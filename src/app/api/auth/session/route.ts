import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/verify-token";

const COOKIE_NAME = "__session";
const COOKIE_MAX_AGE = 55 * 60; // 55 min — just under Firebase ID token TTL of 1 h

/**
 * POST /api/auth/session
 * Receives a Firebase ID token, verifies it server-side, then sets an httpOnly
 * session cookie containing the raw token so the proxy can verify it on each
 * request without a Firestore round-trip.
 *
 * Tradeoff: storing raw ID tokens is stateless and Edge-compatible with no
 * Admin SDK needed, but costs ~1 KB per request and offers no server-side
 * revocation (a revoked token stays valid for up to ~1 h). Acceptable here
 * because the proxy is an optimistic check only — real enforcement lives in
 * Firestore rules and API-level guards.
 */
export async function POST(req: NextRequest) {
  let idToken: string | undefined;
  try {
    ({ idToken } = (await req.json()) as { idToken?: string });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken is required." }, { status: 400 });
  }

  const auth = await verifyIdToken(idToken);
  if (!auth) {
    return NextResponse.json({ error: "Invalid or expired ID token." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie on sign-out.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
