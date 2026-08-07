import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureDisabilitiesColumn() {
  try {
    await pool.query(`
      ALTER TABLE public.child_assessment_features
      ADD COLUMN IF NOT EXISTS disabilities JSONB DEFAULT '[]'
    `);
  } catch {
    // column already exists or migration not needed
  }
}

export async function GET() {
  try {
    await ensureDisabilitiesColumn();

    const result = await pool.query(`
      SELECT
        id,
        child_name,
        gender,
        age,
        report_url,
        COALESCE(disabilities, '[]'::jsonb) AS disabilities,
        session_timestamp AS created_at
      FROM public.child_assessment_features
      ORDER BY session_timestamp DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Postgres error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
