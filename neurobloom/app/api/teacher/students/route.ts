export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/teacher/students — list students in teacher's class
// POST /api/teacher/students — add a new student

export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || auth.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
       s.id, s.name, s.email, s.phone,
       s.referral_assessment_type, s.assessment_status, s.assessment_id,
       s.created_at,
       u.name AS parent_name, u.email AS parent_email,
       caf.report_url, caf.detected_disabilities,
       r.code AS latest_referral_code,
       r.status AS referral_status,
       r.sent_at AS referral_sent_at
     FROM students s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN child_assessment_features caf ON caf.id = s.assessment_id
     LEFT JOIN LATERAL (
       SELECT code, status, sent_at
       FROM referrals
       WHERE student_id = s.id
       ORDER BY sent_at DESC LIMIT 1
     ) r ON true
     WHERE s.teacher_id = $1
     ORDER BY s.created_at DESC`,
    [auth.userId]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || auth.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, phone } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `INSERT INTO students (name, email, phone, teacher_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, created_at`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, auth.userId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Student with this email already exists in your class" }, { status: 409 });
    }
    throw err;
  }
}
