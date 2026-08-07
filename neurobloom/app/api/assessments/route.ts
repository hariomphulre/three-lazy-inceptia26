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
        caf.id,
        caf.child_name,
        caf.gender,
        caf.age,
        caf.report_url,
        caf.school_grade,
        caf.language,
        COALESCE(caf.disabilities, '[]'::jsonb) AS disabilities,
        caf.session_timestamp AS created_at,
        sr.domain_scores,
        sr.narrative,
        sr.flags_for_assessment,
        sr.evidence_status,
        sr.rubric_version,
        sr.questionnaire_group,
        sr.updated_at AS screening_updated_at
      FROM public.child_assessment_features caf
      LEFT JOIN screening_reports sr ON sr.session_id = caf.id::text
      ORDER BY caf.session_timestamp DESC
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
