export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await pool.query(
      "DELETE FROM public.child_assessment_features WHERE id = $1",
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("DELETE /api/assessments/[id]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
