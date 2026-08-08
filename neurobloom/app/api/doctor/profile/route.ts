export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/doctor/profile — Get doctor's profile information including fee, rating stats, and patient reviews
export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || !["doctor", "psychologist"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profileRes = await pool.query(
    `SELECT 
       u.id, 
       u.name, 
       u.email, 
       u.role,
       COALESCE(u.consulting_fee, 0) AS consulting_fee,
       COALESCE(ROUND(AVG(dr.rating)::numeric, 1), 0) AS avg_rating,
       COUNT(dr.id)::int AS rating_count
     FROM users u
     LEFT JOIN doctor_ratings dr ON dr.doctor_id = u.id
     WHERE u.id = $1
     GROUP BY u.id, u.name, u.email, u.role, u.consulting_fee`,
    [auth.userId]
  );

  if (profileRes.rows.length === 0) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  const reviewsRes = await pool.query(
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
    [auth.userId]
  );

  const profile = profileRes.rows[0];
  profile.reviews = reviewsRes.rows;
  return NextResponse.json(profile);
}

// PATCH /api/doctor/profile — Update doctor's consulting fee
export async function PATCH(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth || !["doctor", "psychologist"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { consulting_fee } = await req.json();
    const feeNum = Number(consulting_fee);

    if (isNaN(feeNum) || feeNum < 0) {
      return NextResponse.json({ error: "Consulting fee must be a non-negative number" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE users
       SET consulting_fee = $1
       WHERE id = $2 AND role IN ('doctor', 'psychologist')
       RETURNING id, name, email, role, consulting_fee`,
      [feeNum, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 404 });
    }

    return NextResponse.json({ message: "Consulting fee updated successfully", profile: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update consulting fee" }, { status: 500 });
  }
}
