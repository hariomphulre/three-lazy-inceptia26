export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/users/doctors — return list of all doctors/psychologists for parent to request

export async function GET() {
  const result = await pool.query(
    `SELECT id, name, email FROM users WHERE role IN ('doctor', 'psychologist') ORDER BY name`
  );
  return NextResponse.json(result.rows);
}
