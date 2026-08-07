export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/doctor-requests — doctor sees pending requests; parent sees their sent requests
// POST /api/doctor-requests — parent requests a doctor

export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (auth.role === "doctor" || auth.role === "psychologist") {
    // Doctor: see all requests directed to them
    const result = await pool.query(
      `SELECT dr.id, dr.status, dr.created_at, dr.responded_at,
              s.id AS student_id, s.name AS student_name, s.email AS student_email,
              s.referral_assessment_type, s.assessment_status,
              u.name AS parent_name, u.email AS parent_email
       FROM doctor_requests dr
       JOIN students s ON s.id = dr.student_id
       JOIN users u ON u.id = dr.parent_id
       WHERE dr.doctor_id = $1
       ORDER BY dr.created_at DESC`,
      [auth.userId]
    );
    return NextResponse.json(result.rows);
  }

  if (auth.role === "parent" || auth.role === "educator" || auth.role === "researcher") {
    // Parent: see requests they have sent
    const result = await pool.query(
      `SELECT dr.id, dr.status, dr.created_at,
              s.name AS student_name,
              u.name AS doctor_name, u.email AS doctor_email
       FROM doctor_requests dr
       JOIN students s ON s.id = dr.student_id
       JOIN users u ON u.id = dr.doctor_id
       WHERE dr.parent_id = $1
       ORDER BY dr.created_at DESC`,
      [auth.userId]
    );
    return NextResponse.json(result.rows);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || !["parent", "educator", "researcher"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId, doctorId } = await req.json();
  if (!studentId || !doctorId) {
    return NextResponse.json({ error: "studentId and doctorId are required" }, { status: 400 });
  }

  // Verify this parent owns the student
  const studentCheck = await pool.query(
    "SELECT id FROM students WHERE id = $1 AND user_id = $2",
    [studentId, auth.userId]
  );
  if ((studentCheck.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Verify the target is a doctor/psychologist
  const doctorCheck = await pool.query(
    "SELECT id FROM users WHERE id = $1 AND role IN ('doctor', 'psychologist')",
    [doctorId]
  );
  if ((doctorCheck.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  try {
    const result = await pool.query(
      `INSERT INTO doctor_requests (student_id, parent_id, doctor_id)
       VALUES ($1, $2, $3)
       RETURNING id, status, created_at`,
      [studentId, auth.userId, doctorId]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Request already sent to this doctor" }, { status: 409 });
    }
    throw err;
  }
}
