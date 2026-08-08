export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

async function verifyAssessmentAccess(
  userId: string,
  role: string,
  assessmentId: string
): Promise<boolean> {
  if (role === "doctor" || role === "psychologist") {
    const r = await pool.query(
      `SELECT 1 FROM students s
       JOIN doctor_requests dr ON dr.student_id = s.id
       WHERE dr.doctor_id = $1 AND dr.status = 'accepted' AND s.assessment_id::text = $2`,
      [userId, assessmentId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  if (role === "teacher") {
    const r = await pool.query(
      `SELECT 1 FROM students s
       WHERE s.teacher_id = $1 AND s.assessment_id::text = $2`,
      [userId, assessmentId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  if (["parent", "educator", "researcher"].includes(role)) {
    const r = await pool.query(
      `SELECT 1 FROM students s
       WHERE s.user_id = $1 AND s.assessment_id::text = $2`,
      [userId, assessmentId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  return false;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const isAuthorized = await verifyAssessmentAccess(auth.userId, auth.role, id);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this assessment" }, { status: 403 });
    }

    await pool.query(
      "DELETE FROM public.child_assessment_features WHERE id::text = $1",
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("DELETE /api/assessments/[id]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
