export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// PATCH /api/doctor-requests/[id] — doctor accepts or rejects a request

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthPayload(req);
  if (!auth || !["doctor", "psychologist"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status must be 'accepted' or 'rejected'" }, { status: 400 });
  }

  // Ensure this request belongs to this doctor
  const result = await pool.query(
    `UPDATE doctor_requests
     SET status = $1, responded_at = NOW()
     WHERE id = $2 AND doctor_id = $3
     RETURNING id, status, responded_at, student_id`,
    [status, id, auth.userId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
