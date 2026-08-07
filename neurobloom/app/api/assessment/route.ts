import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const query = `
      INSERT INTO child_assessment_features (
        child_name, age, gender,
        test1_q1, test1_q1_time,
        test1_q2, test1_q2_time,
        test2_audio1, test2_audio2,
        test3_image,
        test4_q1, test4_q1_time,
        test5_q2_score, test5_q2_time,
        test6_q1_score, test6_q1_time
      ) VALUES (
        $1,$2,$3,
        $4,$5,
        $6,$7,
        $8,$9,
        $10,
        $11,$12,
        $13,$14,
        $15,$16
      ) RETURNING id
    `;

    const values = [
      data.child_name,
      data.age,
      data.gender,

      data.test1_q1,
      data.test1_q1_time,

      data.test1_q2,
      data.test1_q2_time,

      data.test2_audio1,
      data.test2_audio2,

      data.test3_image,

      data.test4_q1,
      data.test4_q1_time,

      data.test5_q2_score,
      data.test5_q2_time,

      data.test6_q1_score,
      data.test6_q1_time
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, id: result.rows[0].id });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
