export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * GET /api/referral/[code]
 *
 * Validates a referral code and returns metadata.
 *
 * Permanence rules (per spec):
 *  - A referral link NEVER expires once the parent has registered (`status != 'pending'`).
 *  - An unregistered link expires after 30 days (`expires_at`).
 *  - A completed referral returns its info so the parent can always log back in
 *    and reach their assessment — not blocked.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const result = await pool.query(
    `SELECT
       r.id, r.code, r.assessment_type, r.status, r.expires_at,
       s.id   AS student_id,
       s.name AS student_name,
       s.user_id,
       t.name  AS teacher_name,
       t.email AS teacher_email
     FROM referrals r
     JOIN students s ON s.id = r.student_id
     JOIN users   t ON t.id = r.teacher_id
     WHERE r.code = $1`,
    [code]
  );

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  const referral = result.rows[0];

  // Only enforce expiry for links that have NOT yet been used (still pending)
  if (referral.status === "pending" && new Date(referral.expires_at) < new Date()) {
    return NextResponse.json({ error: "This referral link has expired" }, { status: 410 });
  }

  // Permanent access once registered — always return valid
  return NextResponse.json({
    valid: true,
    code: referral.code,
    studentName: referral.student_name,
    teacherName: referral.teacher_name,
    teacherEmail: referral.teacher_email,
    assessmentType: referral.assessment_type,
    status: referral.status,
    expiresAt: referral.expires_at,
    alreadyRegistered: referral.status !== "pending",
  });
}
