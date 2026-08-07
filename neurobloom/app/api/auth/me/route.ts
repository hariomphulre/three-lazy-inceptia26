export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export interface JWTPayload {
  userId: string;
  name: string;
  role: string;
}

/** Extract and verify JWT from cookie or Authorization header. */
export async function getAuthPayload(req: Request): Promise<JWTPayload | null> {
  // Try cookie first
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("token")?.value;

  // Fallback to Authorization header
  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = cookieToken || headerToken;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    userId: payload.userId,
    name: payload.name,
    role: payload.role,
  });
}
