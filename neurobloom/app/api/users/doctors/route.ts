export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/users/doctors — return list of all doctors/psychologists with consulting fee and rating stats

export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  const currentUserId = auth?.userId || null;

  const result = await pool.query(
    `SELECT 
       u.id, 
       u.name, 
       u.email, 
       u.role,
       COALESCE(u.consulting_fee, 0) AS consulting_fee,
       COALESCE(ROUND(AVG(dr.rating)::numeric, 1), 0) AS avg_rating,
       COUNT(DISTINCT dr.id)::int AS rating_count,
       (
         SELECT rating 
         FROM doctor_ratings 
         WHERE user_id = $1 AND doctor_id = u.id
         LIMIT 1
       ) AS user_rating
     FROM users u
     LEFT JOIN doctor_ratings dr ON dr.doctor_id = u.id
     WHERE u.role IN ('doctor', 'psychologist')
     GROUP BY u.id, u.name, u.email, u.role, u.consulting_fee
     ORDER BY u.name`,
    [currentUserId]
  );

  return NextResponse.json(result.rows);
}
