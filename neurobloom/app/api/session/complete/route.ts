export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

/**
 * POST /api/session/complete
 *
 * Called by the frontend (TestComplete / handleAssessmentComplete) when the
 * full assessment is finished. Accepts:
 *   { sessionId: string, reportUrl?: string }
 *
 * Actions:
 *  1. Optionally stores the report_url on child_assessment_features
 *  2. Marks the linked student record as `completed`
 *  3. Marks the referral as `completed`
 */
export async function POST(req: Request) {
  try {
    const { sessionId, reportUrl } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // 1. Mark child_assessment_features as completed
    await pool.query(
      `UPDATE child_assessment_features
          SET status = 'completed'${reportUrl ? ', report_url = $2' : ''}
        WHERE id = $1`,
      reportUrl ? [sessionId, reportUrl] : [sessionId]
    );

    // 2. Mark student as completed (find by assessment_id)
    await pool.query(
      `UPDATE students
       SET assessment_status = 'completed'
       WHERE assessment_id = $1`,
      [sessionId]
    );

    // 3. Also try to find via logged-in parent (fallback)
    const auth = await getAuthPayload(req).catch(() => null);
    if (auth && ["parent", "educator", "researcher"].includes(auth.role)) {
      await pool.query(
        `UPDATE students
         SET assessment_status = 'completed',
             assessment_id     = COALESCE(assessment_id, $1)
         WHERE user_id = $2
           AND assessment_status != 'completed'`,
        [sessionId, auth.userId]
      );

      // Mark referral as completed
      await pool.query(
        `UPDATE referrals r
           SET status = 'completed', completed_at = NOW()
         FROM students s
         WHERE s.user_id = $1
           AND r.student_id = s.id
           AND r.status IN ('registered', 'started')`,
        [auth.userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
