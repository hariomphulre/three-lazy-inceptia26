export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

/**
 * GET /api/teacher/students/[id]/progress
 *
 * Returns the current assessment status and linked assessment data
 * for a specific student in the teacher's class.
 * Used for live polling from TeacherDashboard.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload(req);
  if (!auth || auth.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const result = await pool.query(
    `SELECT
       s.id, s.assessment_status, s.assessment_id,
       s.referral_assessment_type,
       caf.report_url,
       caf.detected_disabilities,
       caf.session_timestamp AS assessment_date
     FROM students s
     LEFT JOIN child_assessment_features caf ON caf.id = s.assessment_id
     WHERE s.id = $1 AND s.teacher_id = $2`,
    [id, auth.userId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
