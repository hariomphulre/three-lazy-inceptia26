export const runtime = "nodejs";

import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { pool } from "@/lib/db"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const result = await pool.query(
    "SELECT id, name, password_hash FROM users WHERE email = $1",
    [email]
  )

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const user = result.rows[0]

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Create JWT
  const token = jwt.sign(
    { userId: user.id, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  )

  const response = NextResponse.json({
    success: true,
    name: user.name,
  });

  response.cookies.set("token", token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", 
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}
