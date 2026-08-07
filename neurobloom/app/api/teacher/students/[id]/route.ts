export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// DELETE /api/teacher/students/[id] — remove student from teacher's class

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload(req);
  if (!auth || auth.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Ensure this student belongs to the requesting teacher
  const check = await pool.query(
    "SELECT id FROM students WHERE id = $1 AND teacher_id = $2",
    [id, auth.userId]
  );
  if ((check.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await pool.query("DELETE FROM students WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}

// PATCH /api/teacher/students/[id] — update assessment status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload(req);
  if (!auth || auth.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { assessment_status } = await req.json();

  const allowed = ["not_started", "in_progress", "completed"];
  if (!allowed.includes(assessment_status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE students SET assessment_status = $1
     WHERE id = $2 AND teacher_id = $3
     RETURNING id, assessment_status`,
    [assessment_status, id, auth.userId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
