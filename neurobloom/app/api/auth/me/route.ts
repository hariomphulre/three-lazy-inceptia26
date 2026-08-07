export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      name: string;
    };
    return NextResponse.json({ userId: payload.userId, name: payload.name });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
