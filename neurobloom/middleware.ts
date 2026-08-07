import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Next.js Edge Middleware — enforces strict role-based authorization.
 *
 * Rules:
 *  /dashboard      → any authenticated user
 *  /assessment     → any authenticated user (parent/educator must be logged in)
 *  /api/teacher/*  → teacher only
 *  /api/doctor/*   → doctor or psychologist only
 *  /api/parent/*   → parent, educator, or researcher only
 *  /api/notes/*    → any authenticated user (per-record RBAC enforced in route)
 *  /api/doctor-requests/* → any authenticated user (RBAC in route)
 *  /login, /signup, /referral/* → public (no auth required)
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
);

interface JWTPayload {
  userId: string;
  name: string;
  role: string;
}

async function getPayload(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

function loginRedirect(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public routes — skip auth ──────────────────────────────────────────────
  const publicPrefixes = [
    "/login", "/signup", "/referral", "/_next", "/favicon",
    "/api/auth/login", "/api/auth/signup", "/api/auth/logout",
    "/api/referral", "/api/clinical_ai"
  ];
  if (publicPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── API routes — check role ────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const payload = await getPayload(req);
    if (!payload) return forbiddenResponse();

    const role = payload.role;

    // Teacher-only API routes
    if (pathname.startsWith("/api/teacher/")) {
      if (role !== "teacher") return forbiddenResponse();
    }

    // Doctor-only API routes
    if (pathname.startsWith("/api/doctor/")) {
      if (!["doctor", "psychologist"].includes(role)) return forbiddenResponse();
    }

    // Parent-only API routes
    if (pathname.startsWith("/api/parent/")) {
      if (!["parent", "educator", "researcher"].includes(role)) return forbiddenResponse();
    }

    return NextResponse.next();
  }

  // ── App pages — must be authenticated ─────────────────────────────────────
  const protectedPrefixes = ["/dashboard", "/assessment", "/personalised-path", "/psychologists"];
  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    const payload = await getPayload(req);
    if (!payload) return loginRedirect(req);

    const role = payload.role;

    // Role-based page access
    // Teachers should not access /assessment directly (they manage, not take)
    // Doctors should not access /assessment directly
    if (pathname.startsWith("/assessment")) {
      if (["teacher", "doctor", "psychologist"].includes(role)) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/session/upload|_next/static|_next/image|favicon.ico|icons|manifest).*)",
  ],
};
