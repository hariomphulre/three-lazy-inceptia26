export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/parent/profile — get every child linked to the logged-in parent.
// A parent can be linked to multiple students (e.g. siblings), one per referral.

export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || !["parent", "educator", "researcher"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
       s.id, s.name, s.email, s.phone,
       s.referral_assessment_type, s.assessment_status, s.assessment_id,
       s.created_at,
       t.id AS teacher_id, t.name AS teacher_name, t.email AS teacher_email,
       caf.report_url, caf.detected_disabilities, caf.disabilities,
       caf.session_timestamp AS assessment_date
     FROM students s
     LEFT JOIN users t ON t.id = s.teacher_id
     LEFT JOIN child_assessment_features caf ON caf.id = s.assessment_id
     WHERE s.user_id = $1
     ORDER BY s.created_at ASC`,
    [auth.userId]
  );

  const students = result.rows;
  // `student` (first child) kept for backward compatibility with older callers.
  return NextResponse.json({ students, student: students[0] ?? null });
}
