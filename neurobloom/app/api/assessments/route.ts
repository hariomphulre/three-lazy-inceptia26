export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

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

/**
 * GET /api/assessments
 *
 * Role-scoped assessment report retrieval:
 *  - Doctor/Psychologist: Reports ONLY for children linked via an accepted doctor_requests relationship.
 *  - Teacher: Reports ONLY for students assigned to this teacher.
 *  - Parent/Educator/Researcher: Reports ONLY for their own children (linked user_id).
 *
 * Returns 401 for unauthenticated requests and 403 for unauthorized roles.
 */
export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDisabilitiesColumn();

    let query = "";
    const params: any[] = [auth.userId];

    if (auth.role === "doctor" || auth.role === "psychologist") {
      // Doctor: Reports for children linked via accepted doctor_requests
      query = `
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
        WHERE caf.id IN (
          SELECT s.assessment_id
          FROM students s
          JOIN doctor_requests dr ON dr.student_id = s.id
          WHERE dr.doctor_id = $1 AND dr.status = 'accepted' AND s.assessment_id IS NOT NULL
        )
        ORDER BY caf.session_timestamp DESC
      `;
    } else if (auth.role === "teacher") {
      // Teacher: Reports for assigned students in their class
      query = `
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
        WHERE caf.id IN (
          SELECT s.assessment_id
          FROM students s
          WHERE s.teacher_id = $1 AND s.assessment_id IS NOT NULL
        )
        ORDER BY caf.session_timestamp DESC
      `;
    } else if (["parent", "educator", "researcher"].includes(auth.role)) {
      // Parent: Reports for their own children
      query = `
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
        WHERE caf.id IN (
          SELECT s.assessment_id
          FROM students s
          WHERE s.user_id = $1 AND s.assessment_id IS NOT NULL
        )
        ORDER BY caf.session_timestamp DESC
      `;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Postgres error fetching role-scoped assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
