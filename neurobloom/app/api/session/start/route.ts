import { NextResponse } from "next/server";
import { sessionStore } from "@/lib/sessionStore";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const data = await req.json();
  const sessionId = randomUUID();

  sessionStore.set(sessionId, {
    child_name: data.name,
    age: data.age,
    gender: data.gender
  });

  return NextResponse.json({ sessionId });
}
