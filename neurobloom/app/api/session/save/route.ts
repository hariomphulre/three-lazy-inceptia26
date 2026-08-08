export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * POST /api/session/save
 *
 * Dual-write handler:
 *  1. Updates flat columns on child_assessment_features (backward-compatible)
 *  2. If payload contains a `screening_task` object, writes a row to
 *     screening_responses so Phase 2 AI scoring has real per-task data.
 *
 * Legacy payload shape (unchanged):
 *   { sessionId, payload: { test3_image: "..." } }
 *
 * New screening task shape (additional, opt-in):
 *   {
 *     sessionId,
 *     payload: { ...flat columns... },        // can be empty {}
 *     screening_task: {
 *       task_id:         "B-math-arithmetic-1",
 *       domain:          "math",
 *       construct:       "arithmetic_fluency",
 *       task_type:       "arithmetic_quest",
 *       response_data:   { answer: 7, correct: true },
 *       reaction_time_ms: 2100
 *     }
 *   }
 */
function sanitizeReactionTimeMs(val: any): number | null {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  let ms = Math.floor(Number(val));
  if (ms < 0) return 0;
  // If timestamp > 5 minutes, cap to 3000ms safe default to prevent integer overflow
  if (ms > 300000) return 3000;
  return Math.min(ms, 2147483647);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, payload, screening_task } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // ── 1. Legacy flat-column update (unchanged behaviour) ────────────
    if (payload && Object.keys(payload).length > 0) {
      const keys   = Object.keys(payload);
      const values = Object.values(payload);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      await pool.query(
        `UPDATE child_assessment_features SET ${setClause} WHERE id = $${keys.length + 1}`,
        [...values, sessionId]
      );
    }

    // ── 2. Screening task row (new — feeds Phase 2 AI scoring) ────────
    let actualScreeningTask = screening_task;

    // Auto-map legacy game payloads if screening_task is missing
    if (payload && (!screening_task || !screening_task.task_id)) {
      const keys = Object.keys(payload);
      if (keys.length > 0) {
        const firstKey = keys[0];
        // Extract correct/incorrect from legacy 0/1 score values
        const scoreKey = keys.find(k => !k.endsWith("_time"));
        const timeKey = keys.find(k => k.endsWith("_time"));
        const rawScore = scoreKey ? Number(payload[scoreKey]) : 0.5;
        const isCorrect = rawScore >= 1;
        const rawTimeVal = timeKey ? payload[timeKey] : 3;
        const reactionMs = sanitizeReactionTimeMs(Number(rawTimeVal) < 1000 ? Number(rawTimeVal) * 1000 : rawTimeVal) ?? 3000;

        if (firstKey.startsWith("test1_")) {
          actualScreeningTask = {
            task_id: `math-auto-${firstKey}`,
            domain: "math",
            construct: "arithmetic_fluency",
            task_type: "arithmetic_quest",
            response_data: { correct: isCorrect, raw_score: rawScore },
            reaction_time_ms: reactionMs,
          };
        } else if (firstKey.startsWith("test2_")) {
          actualScreeningTask = {
            task_id: `reading-auto-${firstKey}`,
            domain: "reading",
            construct: "decoding_fluency",
            task_type: "reading_rocket",
            response_data: { audio_submitted: true, correct: isCorrect, raw_score: rawScore },
            reaction_time_ms: reactionMs,
          };
        } else if (firstKey.startsWith("test3_")) {
          actualScreeningTask = {
            task_id: "A-writing-big_path-1",
            domain: "writing",
            construct: "graphomotor_speed",
            task_type: "big_path_tracing",
            response_data: { image_submitted: true, correct: true },
            reaction_time_ms: 3000,
          };
        } else if (firstKey.startsWith("test4_")) {
          actualScreeningTask = {
            task_id: `socioemotional-auto-${firstKey}`,
            domain: "socioemotional",
            construct: "emotion_recognition",
            task_type: "feeling_friends",
            response_data: { correct: isCorrect, raw_score: rawScore },
            reaction_time_ms: reactionMs,
          };
        } else if (firstKey.startsWith("test5_") || firstKey.startsWith("test6_")) {
          actualScreeningTask = {
            task_id: `attention-auto-${firstKey}`,
            domain: "attention",
            construct: "selective_attention",
            task_type: "eagle_eyes",
            response_data: { correct: isCorrect, raw_score: rawScore },
            reaction_time_ms: reactionMs,
          };
        }
      }
    }

    if (actualScreeningTask && actualScreeningTask.task_id) {
      const {
        task_id,
        domain,
        construct,
        task_type,
        response_data,
        reaction_time_ms,
      } = actualScreeningTask;

      // Fetch age/grade/language for denormalized storage (aids future ML queries)
      const profile = await pool.query(
        `SELECT age, school_grade, language FROM child_assessment_features WHERE id = $1`,
        [sessionId]
      );
      const row = profile.rows[0] ?? {};

      // Determine questionnaire group from school_grade (mirrors Phase 1 logic)
      const gradeGroupMap: Record<string, string> = {
        preschool: "A", prep: "A", "pre-k": "A", kg: "A", grade_1: "A",
        grade_2: "B", grade_3: "B", grade_4: "B", grade_5: "B", grade_6: "B",
        grade_7: "C", grade_8: "C", grade_9: "C", grade_10: "C",
        grade_11: "C", grade_12: "C",
      };
      const grade = (row.school_grade ?? "").toLowerCase().replace(" ", "_");
      const questionnaire_group = gradeGroupMap[grade] ?? (
        (row.age ?? 8) <= 7 ? "A" : (row.age ?? 8) <= 12 ? "B" : "C"
      );

      await pool.query(
        `INSERT INTO screening_responses
           (session_id, task_id, domain, construct, task_type,
            questionnaire_group, age_years, school_grade, language,
            response_json, reaction_time_ms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT DO NOTHING`,
        [
          sessionId, task_id, domain, construct, task_type,
          questionnaire_group, row.age ?? null, row.school_grade ?? null,
          row.language ?? null,
          JSON.stringify(response_data ?? {}), sanitizeReactionTimeMs(reaction_time_ms),
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SAVE ERROR:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
