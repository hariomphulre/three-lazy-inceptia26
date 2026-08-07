export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { name, email, password, role, referralCode } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const allowedRoles = ["parent", "educator", "researcher", "teacher", "doctor", "psychologist"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check if user exists
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user
  const userResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [name, email, passwordHash, role]
  );
  const userId = userResult.rows[0].id;

  // If a referral code was provided, link the parent to the student record
  if (referralCode && (role === "parent" || role === "educator" || role === "researcher")) {
    const referral = await pool.query(
      `SELECT r.id, r.student_id, r.assessment_type, r.expires_at
       FROM referrals r
       WHERE r.code = $1 AND r.status = 'pending' AND r.expires_at > NOW()`,
      [referralCode]
    );

    if (referral.rowCount && referral.rowCount > 0) {
      const { id: referralId, student_id: studentId, assessment_type: assessmentType } = referral.rows[0];

      // Link the user to the student record
      await pool.query(
        `UPDATE students SET user_id = $1 WHERE id = $2`,
        [userId, studentId]
      );

      // Mark referral as registered
      await pool.query(
        `UPDATE referrals SET status = 'registered', registered_at = NOW() WHERE id = $1`,
        [referralId]
      );

      return NextResponse.json({
        success: true,
        redirectTo: `/assessment?type=${assessmentType}&ref=${referralCode}`,
      });
    }
  }

  return NextResponse.json({ success: true });
}
