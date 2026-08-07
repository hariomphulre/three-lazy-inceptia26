import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { sessionId, payload } = await req.json();

    if (!sessionId || !payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ success: true }); // nothing to update
    }

    const keys = Object.keys(payload);
    const values = Object.values(payload);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    const query = `
      UPDATE child_assessment_features
      SET ${setClause}
      WHERE id = $${keys.length + 1}
    `;

    await pool.query(query, [...values, sessionId]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SAVE ERROR:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
