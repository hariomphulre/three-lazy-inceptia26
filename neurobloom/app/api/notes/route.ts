export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayload } from "@/app/api/auth/me/route";

// GET /api/notes?studentId=xxx — get notes for a student (role-scoped)
// POST /api/notes — add a note (role-scoped)

export async function GET(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  // Role-based access: verify the caller can see this student's notes
  const accessError = await verifyStudentAccess(auth.userId, auth.role, studentId);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });

  const result = await pool.query(
    `SELECT n.id, n.content, n.author_role, n.created_at,
            u.name AS author_name
     FROM notes n
     JOIN users u ON u.id = n.author_id
     WHERE n.student_id = $1
     ORDER BY n.created_at DESC`,
    [studentId]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const auth = await getAuthPayload(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, content } = await req.json();
  if (!studentId || !content?.trim()) {
    return NextResponse.json({ error: "studentId and content are required" }, { status: 400 });
  }

  // Normalize role for author_role column (psychologist → doctor)
  const authorRole = auth.role === "psychologist" ? "doctor" : auth.role;
  const allowedAuthorRoles = ["teacher", "parent", "doctor", "educator", "researcher"];
  if (!allowedAuthorRoles.includes(auth.role)) {
    return NextResponse.json({ error: "Your role cannot post notes" }, { status: 403 });
  }

  // Role-based access check
  const accessError = await verifyStudentAccess(auth.userId, auth.role, studentId);
  if (accessError) return NextResponse.json({ error: accessError }, { status: 403 });

  const result = await pool.query(
    `INSERT INTO notes (student_id, author_id, author_role, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, content, author_role, created_at`,
    [studentId, auth.userId, authorRole, content.trim()]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}

/**
 * Verify that a user has permission to access a given student's data.
 *
 * Rules (explicitly defined):
 *  - teacher     → only if student.teacher_id = auth.userId
 *  - parent/educator/researcher → only if student.user_id = auth.userId
 *  - doctor/psychologist → only if there is an accepted doctor_request for (student, doctor)
 *
 * Returns an error string if access is denied, or null if allowed.
 */
async function verifyStudentAccess(
  userId: string,
  role: string,
  studentId: string
): Promise<string | null> {
  if (role === "teacher") {
    const r = await pool.query(
      "SELECT id FROM students WHERE id = $1 AND teacher_id = $2",
      [studentId, userId]
    );
    if ((r.rowCount ?? 0) === 0) return "You do not have access to this student";
  } else if (role === "parent" || role === "educator" || role === "researcher") {
    const r = await pool.query(
      "SELECT id FROM students WHERE id = $1 AND user_id = $2",
      [studentId, userId]
    );
    if ((r.rowCount ?? 0) === 0) return "You do not have access to this student";
  } else if (role === "doctor" || role === "psychologist") {
    const r = await pool.query(
      `SELECT id FROM doctor_requests
       WHERE student_id = $1 AND doctor_id = $2 AND status = 'accepted'`,
      [studentId, userId]
    );
    if ((r.rowCount ?? 0) === 0) return "You do not have an accepted consultation for this student";
  } else {
    return "Unauthorized role";
  }
  return null;
}

export { verifyStudentAccess };
