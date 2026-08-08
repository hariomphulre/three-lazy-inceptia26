export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/doctor/reviews?doctorId=... — Get all ratings and reviews for a doctor
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");

  if (!doctorId) {
    return NextResponse.json({ error: "doctorId parameter is required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT 
         dr.id,
         dr.rating,
         dr.review,
         dr.created_at,
         u.name AS reviewer_name
       FROM doctor_ratings dr
       JOIN users u ON u.id = dr.user_id
       WHERE dr.doctor_id = $1
       ORDER BY dr.created_at DESC`,
      [doctorId]
    );

    const statsRes = await pool.query(
      `SELECT 
         COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
         COUNT(id)::int AS rating_count
       FROM doctor_ratings
       WHERE doctor_id = $1`,
      [doctorId]
    );

    const stats = statsRes.rows[0] || { avg_rating: 0, rating_count: 0 };

    return NextResponse.json({
      doctorId,
      avg_rating: Number(stats.avg_rating),
      rating_count: Number(stats.rating_count),
      reviews: result.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reviews" }, { status: 500 });
  }
}
