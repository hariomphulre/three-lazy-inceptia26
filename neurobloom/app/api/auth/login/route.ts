export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password, referralCode } = await req.json();

  const result = await pool.query(
    "SELECT id, name, password_hash, role FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // If they arrived through a teacher's invite link (/login?ref=CODE) and are a
  // parent, link this existing account to the student now. Sign-up already does
  // this; without it, parents who registered separately never get linked.
  let linked = false;
  if (referralCode && ["parent", "educator", "researcher"].includes(user.role)) {
    try {
      const referral = await pool.query(
        `SELECT r.id, r.student_id
         FROM referrals r
         WHERE r.code = $1 AND r.status = 'pending' AND r.expires_at > NOW()`,
        [referralCode]
      );
      if (referral.rowCount && referral.rowCount > 0) {
        const { id: referralId, student_id: studentId } = referral.rows[0];
        await pool.query(`UPDATE students SET user_id = $1 WHERE id = $2`, [user.id, studentId]);
        await pool.query(
          `UPDATE referrals SET status = 'registered', registered_at = NOW() WHERE id = $1`,
          [referralId]
        );
        linked = true;
      }
    } catch (e) {
      // Non-fatal: login must still succeed even if linking fails.
      console.warn("Referral linking on login failed:", e);
    }
  }

  // Create JWT with role included
  const token = jwt.sign(
    { userId: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  const response = NextResponse.json({
    success: true,
    name: user.name,
    role: user.role,
    linked,
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
