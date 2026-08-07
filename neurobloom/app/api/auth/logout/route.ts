export const runtime = "nodejs";

import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Fully invalidates the session by:
 *  1. Expiring the JWT cookie (maxAge 0, immediate expiry in past)
 *  2. Setting the Expires attribute explicitly to epoch to ensure all browsers clear it
 *  3. Returns a redirect instruction the client can follow
 */
export async function POST() {
  const response = NextResponse.json({ success: true, redirectTo: "/login" });

  // Expire the token cookie immediately — set to epoch and maxAge 0
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0), // explicitly set to epoch as belt-and-suspenders
  });

  return response;
}
