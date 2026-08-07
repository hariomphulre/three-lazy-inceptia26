import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { name, age, gender, sessionId } = await req.json();

  // Offline-created sessions arrive with a client-generated UUID. Insert with it
  // so all the queued feature UPDATEs (WHERE id = sessionId) line up on sync.
  // Idempotent: replaying a create for an existing row is a no-op.
  if (sessionId) {
    await pool.query(
      `INSERT INTO child_assessment_features (id, child_name, age, gender)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [sessionId, name, age, gender]
    );
    return NextResponse.json({ sessionId });
  }

  // Legacy path: let the DB generate the id.
  const result = await pool.query(
    `INSERT INTO child_assessment_features (child_name, age, gender)
     VALUES ($1,$2,$3) RETURNING id`,
    [name, age, gender]
  );

  return NextResponse.json({ sessionId: result.rows[0].id });
}
