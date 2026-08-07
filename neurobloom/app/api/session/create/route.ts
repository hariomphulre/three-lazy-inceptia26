import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { name, age, gender } = await req.json();

  const result = await pool.query(
    `INSERT INTO child_assessment_features (child_name, age, gender)
     VALUES ($1,$2,$3) RETURNING id`,
    [name, age, gender]
  );

  return NextResponse.json({ sessionId: result.rows[0].id });
}
