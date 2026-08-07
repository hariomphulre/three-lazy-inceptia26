export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

/**
 * POST /api/session/create
 *
 * Creates a new child_assessment_features row.
 * If the caller is a logged-in parent/educator/researcher, automatically
 * marks their linked student record as `in_progress` and stores the
 * new assessment_id on it — so teachers can see the status change immediately.
 */
export async function POST(req: Request) {
  const { name, age, gender, studentId } = await req.json();

  // Create the assessment row
  const result = await pool.query(
    `INSERT INTO child_assessment_features (child_name, age, gender)
     VALUES ($1, $2, $3) RETURNING id`,
    [name, age, gender]
  );
  const sessionId: string = result.rows[0].id;

  // Try to link to the logged-in parent's student record
  const auth = await getAuthPayload(req).catch(() => null);
  if (auth && ["parent", "educator", "researcher"].includes(auth.role)) {
    // Link to the specific child the parent is assessing (siblings supported).
    // Fall back to "any not-yet-completed child" only when no id was supplied
    // (e.g. a self-start parent with a single linked student).
    if (studentId) {
      await pool.query(
        `UPDATE students
         SET assessment_id     = $1,
             assessment_status = 'in_progress'
         WHERE id = $2 AND user_id = $3`,
        [sessionId, studentId, auth.userId]
      );
      await pool.query(
        `UPDATE referrals
           SET status = 'started'
         WHERE student_id = $1 AND status = 'registered'`,
        [studentId]
      );
    } else {
      await pool.query(
        `UPDATE students
         SET assessment_id     = $1,
             assessment_status = 'in_progress'
         WHERE user_id = $2
           AND assessment_status IN ('not_started', 'in_progress')`,
        [sessionId, auth.userId]
      );
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
  }

  return NextResponse.json({ sessionId });
}
