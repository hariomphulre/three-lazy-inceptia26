export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// POST /api/doctor/rate — Rate a doctor (1 to 5 stars)
export async function POST(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { doctorId, rating, review } = await req.json();

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

    // Prevent doctor from rating themselves
    if (auth.userId === doctorId) {
      return NextResponse.json({ error: "Doctors cannot rate themselves" }, { status: 403 });
    }

    // Verify doctor exists
    const doctorCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role IN ('doctor', 'psychologist')`,
      [doctorId]
    );

    if ((doctorCheck.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Upsert rating
    await pool.query(
      `INSERT INTO doctor_ratings (user_id, doctor_id, rating, review, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, doctor_id)
       DO UPDATE SET rating = EXCLUDED.rating, review = EXCLUDED.review, updated_at = NOW()`,
      [auth.userId, doctorId, ratingNum, review || null]
    );

    // Fetch updated rating stats for this doctor
    const statsRes = await pool.query(
      `SELECT 
         COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
         COUNT(id)::int AS rating_count
       FROM doctor_ratings
       WHERE doctor_id = $1`,
      [doctorId]
    );

    const stats = statsRes.rows[0];

    return NextResponse.json({
      message: "Rating saved successfully",
      doctorId,
      user_rating: ratingNum,
      avg_rating: Number(stats.avg_rating),
      rating_count: Number(stats.rating_count),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit rating" }, { status: 500 });
  }
}
