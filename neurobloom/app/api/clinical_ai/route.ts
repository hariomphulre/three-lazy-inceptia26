export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

const FLASK_BASE = process.env.FLASK_URL ?? "http://localhost:5000";

/**
 * POST /api/clinical_ai
 *
 * Frontend-facing proxy for the Research-Aligned Screening Engine.
 * Accepts:
 *   { sessionId: string, raw_responses?: object, previous_phase_state?: object }
 *
 * Actions:
 *  1. Fetches child profile (name, age, school_grade, language) from DB
 *  2. Builds the input_json for the Flask pipeline
 *  3. Calls POST http://localhost:5000/predict/screening_ai/run (server-side only)
 *  4. Returns the full structured screening report to the client
 *
 * NOTE: This is a screening aid, not a clinical diagnostic tool.
 * All outputs carry evidence_status='prototype_heuristic'.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, raw_responses = {}, previous_phase_state = {} } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // ── 1. Fetch child profile from DB ──────────────────────────────────
    const profileResult = await pool.query(
      `SELECT id, child_name AS name, age, school_grade, language
         FROM child_assessment_features
        WHERE id = $1
        LIMIT 1`,
      [sessionId]
    );

    if (profileResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Session '${sessionId}' not found` },
        { status: 404 }
      );
    }

    const row = profileResult.rows[0];
    const child_profile = {
      id:           row.id,
      name:         row.name   ?? "child",
      age_years:    Number(row.age ?? 8),
      school_grade: row.school_grade ?? "unknown",
      language:     row.language     ?? "english",
    };

    // ── 2. If raw_responses not supplied, load from screening_responses ──
    let responses = raw_responses;
    if (!raw_responses || Object.keys(raw_responses).length === 0) {
      const saved = await pool.query(
        `SELECT domain, task_id, construct, task_type, response_json, reaction_time_ms
           FROM screening_responses
          WHERE session_id = $1
          ORDER BY created_at`,
        [sessionId]
      );
      if (saved.rows.length > 0) {
        const grouped: Record<string, any[]> = {};
        for (const r of saved.rows) {
          if (!grouped[r.domain]) grouped[r.domain] = [];
          grouped[r.domain].push({
            task_id: r.task_id,
            construct: r.construct,
            task_type: r.task_type,
            response_data: r.response_json,
            reaction_time_ms: r.reaction_time_ms,
          });
        }
        responses = grouped;
      }
    }

    // ── 3. Build pipeline input ──────────────────────────────────────────
    const pipelineInput = {
      child_profile,
      raw_responses: responses,
      previous_phase_state,
    };

    // ── 4. Fire-and-forget: kick off Flask pipeline without waiting ───────
    // The LLM pipeline can take 3-10 minutes (Groq rate-limit sleeps per task).
    // We return 202 immediately so the HTTP connection doesn't time out.
    // TestComplete.tsx polls GET /api/clinical_ai until the result appears.
    void (async () => {
      try {
        const flaskResp = await fetch(`${FLASK_BASE}/predict/screening_ai/run`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(pipelineInput),
          // 10-minute ceiling — enough for the longest Group A session (6 tasks × ~35s each)
          signal:  AbortSignal.timeout(600_000),
        });

        if (!flaskResp.ok) {
          const errText = await flaskResp.text();
          console.error("[clinical_ai] Flask error:", flaskResp.status, errText);
          return;
        }

        const result = await flaskResp.json();

        // ── 5. Save result to screening_reports ──────────────────────────
        await pool.query(
          `INSERT INTO screening_reports
              (session_id, questionnaire_group, domain_scores, narrative,
               flags_for_assessment, evidence_status, rubric_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (session_id) DO UPDATE
               SET domain_scores        = EXCLUDED.domain_scores,
                   narrative            = EXCLUDED.narrative,
                   flags_for_assessment = EXCLUDED.flags_for_assessment,
                   updated_at           = NOW()`,
          [
            sessionId,
            result.questionnaire_group,
            JSON.stringify(result.domain_scores ?? {}),
            JSON.stringify(result.global_impression ?? {}),
            result.flags_for_formal_assessment ?? [],
            result.evidence_status ?? "prototype_heuristic",
            result.rubric_version ?? "prototype-heuristic-v1",
          ]
        );
        console.log(`[clinical_ai] ✅ Report saved for session ${sessionId}`);

        // ── 6. Optionally link screening flags to authenticated user ──────
        const auth = await getAuthPayload(req).catch(() => null);
        if (auth && result.flags_for_formal_assessment?.length > 0) {
          pool.query(
            `UPDATE students
                SET screening_flags = $1::text[]
              WHERE assessment_id = $2`,
            [result.flags_for_formal_assessment, sessionId]
          ).catch((e: Error) => console.warn("[clinical_ai] flag update skipped:", e.message));
        }
      } catch (bgErr) {
        console.error("[clinical_ai] Background pipeline error:", bgErr);
      }
    })();

    // Return 202 immediately — frontend polls GET until report is ready
    return NextResponse.json(
      { accepted: true, message: "Screening pipeline started. Poll GET /api/clinical_ai?sessionId=... for results." },
      { status: 202 }
    );
  } catch (err) {
    console.error("[clinical_ai] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error", detail: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/clinical_ai?sessionId=xxx
 *
 * Fetch a previously stored screening report for a session.
 * Returns 200 with { pending: true } while report calculation is in progress.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT session_id, questionnaire_group, domain_scores, narrative,
              flags_for_assessment, evidence_status, rubric_version,
              scoring_provider, created_at, updated_at
         FROM screening_reports
        WHERE session_id = $1
        LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { pending: true, message: "Screening report calculation in progress" },
        { status: 200 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      session_id: row.session_id,
      questionnaire_group: row.questionnaire_group,
      domain_scores: row.domain_scores,
      narrative: row.narrative,
      global_impression: row.narrative,
      flags_for_assessment: row.flags_for_assessment,
      flags_for_formal_assessment: row.flags_for_assessment ?? [],
      evidence_status: row.evidence_status,
      rubric_version: row.rubric_version,
      scoring_provider: row.scoring_provider,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "DB error", detail: String(err) },
      { status: 500 }
    );
  }
}
