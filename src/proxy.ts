import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/firebase/verify-token";

const protectedRoutes = [
  "/dashboard",
  "/roadmap",
  "/practice",
  "/leaderboard",
  "/profile",
  "/settings",
  "/admin",
  "/interview",
  "/mock-tests",
  "/bookmarks",
  "/analytics",
];
const publicRoutes = ["/login", "/register"];

/**
 * Proxy runs in the Edge runtime before every matched request.
 *
 * This is an *optimistic* check as recommended by the Next.js docs — the real
 * authorization enforcement lives in Firestore security rules and server-side
 * API route guards.  We verify the Firebase ID token stored in the __session
 * httpOnly cookie (set by /api/auth/session) to provide a meaningful redirect
 * rather than just checking for a non-empty sentinel value.
 *
 * Token verification uses Google's JWK public keys (Edge-compatible, no Admin
 * SDK dependency).  The keys are cached in the module for the duration of their
 * Cache-Control max-age so the vast majority of requests pay no network cost.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected && !isPublic) return NextResponse.next();

  const rawToken = request.cookies.get("__session")?.value?.trim() || null;

  let isAuthenticated = false;
  if (rawToken) {
    const auth = await verifyIdToken(rawToken);
    isAuthenticated = !!auth;
  }

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/roadmap/:path*",
    "/practice/:path*",
    "/leaderboard/:path*",
    "/profile/:path*",
    "/profile",
    "/settings/:path*",
    "/admin/:path*",
    "/interview/:path*",
    "/mock-tests/:path*",
    "/bookmarks/:path*",
    "/analytics/:path*",
    "/login",
    "/register",
  ],
};
