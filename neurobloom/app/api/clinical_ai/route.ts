export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

const FLASK_BASE = process.env.FLASK_URL ?? "http://localhost:5000";

/**
 * Server-side authorization check for child session reports:
 *  - Doctor/psychologist: Authorized if student is linked via accepted doctor_request.
 *  - Teacher: Authorized if student is assigned to this teacher.
 *  - Parent/educator/researcher: Authorized if student is linked to parent account or active testing session.
 */
async function verifyChildSessionAccess(userId: string, role: string, sessionId: string): Promise<boolean> {
  if (role === "doctor" || role === "psychologist") {
    const r = await pool.query(
      `SELECT 1 FROM students s
       JOIN doctor_requests dr ON dr.student_id = s.id
       WHERE dr.doctor_id = $1 AND dr.status = 'accepted' AND s.assessment_id::text = $2`,
      [userId, sessionId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  if (role === "teacher") {
    const r = await pool.query(
      `SELECT 1 FROM students s
       WHERE s.teacher_id = $1 AND s.assessment_id::text = $2`,
      [userId, sessionId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  if (["parent", "educator", "researcher"].includes(role)) {
    const r = await pool.query(
      `SELECT 1 FROM students s
       WHERE s.user_id = $1 AND s.assessment_id::text = $2`,
      [userId, sessionId]
    );
    if ((r.rowCount ?? 0) > 0) return true;

    // Fallback: Check if session row exists in child_assessment_features
    const caf = await pool.query(
      `SELECT 1 FROM public.child_assessment_features WHERE id::text = $1`,
      [sessionId]
    );
    return (caf.rowCount ?? 0) > 0;
  }

  return false;
}

/**
 * POST /api/clinical_ai
 *
 * Frontend-facing proxy for the Research-Aligned Screening Engine.
 * Enforces server-side authorization check before pipeline execution.
 */
export async function POST(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId, raw_responses = {}, previous_phase_state = {} } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Server-side authorization check
    const isAuthorized = await verifyChildSessionAccess(auth.userId, auth.role, sessionId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this report" }, { status: 403 });
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
    void (async () => {
      try {
        const flaskResp = await fetch(`${FLASK_BASE}/predict/screening_ai/run`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(pipelineInput),
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

        // ── 6. Optionally link screening flags to student record ────────
        if (result.flags_for_formal_assessment?.length > 0) {
          pool.query(
            `UPDATE students
                SET screening_flags = $1::text[]
              WHERE assessment_id::text = $2`,
            [result.flags_for_formal_assessment, sessionId]
          ).catch((e: Error) => console.warn("[clinical_ai] flag update skipped:", e.message));
        }
      } catch (bgErr) {
        console.error("[clinical_ai] Background pipeline error:", bgErr);
      }
    })();

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
 * Fetch stored screening report for a session.
 * Enforces server-side authorization: returns 401 if unauthenticated and 403 if unauthorized.
 */
export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
  }

  // Enforce server-side role-based authorization check
  const isAuthorized = await verifyChildSessionAccess(auth.userId, auth.role, sessionId);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden: You do not have access to this report" }, { status: 403 });
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
  } catch (error) {
    console.error("Postgres error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
