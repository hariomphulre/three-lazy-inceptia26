export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

/**
 * POST /api/session/create
 *
 * Creates a new child_assessment_features row.
 * Now also accepts school_grade and language for the screening AI pipeline.
 * If the caller is a logged-in parent/educator/researcher, automatically
 * marks their linked student record as `in_progress` and stores the
 * new assessment_id on it — so teachers can see the status change immediately.
 */
export async function POST(req: Request) {
  const { name, age, gender, school_grade, language } = await req.json();

  // Create the assessment row (school_grade + language added for screening engine)
  const result = await pool.query(
    `INSERT INTO child_assessment_features
        (child_name, age, gender, school_grade, language)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name, age, gender, school_grade ?? null, language ?? "english"]
  );
  const sessionId: string = result.rows[0].id;

  // Try to link to the logged-in parent's student record
  const auth = await getAuthPayload(req).catch(() => null);
  if (auth && ["parent", "educator", "researcher"].includes(auth.role)) {
    // Update student: set assessment_id + mark in_progress
    await pool.query(
      `UPDATE students
       SET assessment_id     = $1,
           assessment_status = 'in_progress'
       WHERE user_id = $2
         AND assessment_status IN ('not_started', 'in_progress')`,
      [sessionId, auth.userId]
    );

    // Also mark the referral as started
    await pool.query(
      `UPDATE referrals r
         SET status = 'started'
       FROM students s
       WHERE s.user_id = $1
         AND r.student_id = s.id
         AND r.status = 'registered'`,
      [auth.userId]
    );
  }

  return NextResponse.json({ sessionId });
}
