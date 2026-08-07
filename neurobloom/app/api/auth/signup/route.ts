export const runtime = "nodejs";

import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { pool } from "@/lib/db"

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  // Check if user exists
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  )

  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 })
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Insert user
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    [name, email, passwordHash, role]
  )

  return NextResponse.json({ success: true })
}
