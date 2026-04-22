import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/roadmap", "/practice", "/leaderboard", "/settings", "/admin", "/interview", "/mock-tests", "/bookmarks"];
const publicRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path starts with any protected route
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Read the auth token cookie set by the client.
  // Check for a non-empty value — an empty or whitespace-only cookie is treated as absent.
  const rawCookie = request.cookies.get("__session")?.value;
  const authToken = rawCookie?.trim() || null;

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login/register
  if (isPublic && authToken) {
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
    "/settings/:path*",
    "/admin/:path*",
    "/interview/:path*",
    "/mock-tests/:path*",
    "/bookmarks/:path*",
    "/login",
    "/register",
  ],
};
