export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/doctor/cases — doctor gets all accepted cases with full student info

export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || !["doctor", "psychologist"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
       s.id AS student_id, s.name AS student_name, s.email AS student_email,
       s.referral_assessment_type, s.assessment_status, s.assessment_id,
       s.created_at,
       t.name AS teacher_name, t.email AS teacher_email,
       u.name AS parent_name, u.email AS parent_email,
       dr.id AS request_id, dr.status AS request_status, dr.created_at AS request_date,
       caf.report_url, caf.detected_disabilities, caf.disabilities,
       caf.session_timestamp AS assessment_date
     FROM doctor_requests dr
     JOIN students s ON s.id = dr.student_id
     LEFT JOIN users t ON t.id = s.teacher_id
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN child_assessment_features caf ON caf.id = s.assessment_id
     WHERE dr.doctor_id = $1 AND dr.status = 'accepted'
     ORDER BY dr.responded_at DESC`,
    [auth.userId]
  );

  return NextResponse.json(result.rows);
}
