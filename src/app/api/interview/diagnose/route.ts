import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

const GROQ_KEY = process.env.GROQ_API_KEY || "";

// GET /api/interview/diagnose — admin-only diagnostic endpoint
export async function GET(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const authUser = await verifyIdToken(token);
  if (!authUser) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const adminUids = (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  if (adminUids.length === 0 || !adminUids.includes(authUser.uid)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const results: Record<string, unknown> = {};

  results.env = {
    GROQ_API_KEY: GROQ_KEY ? "set" : "NOT SET",
  };

  // Test Groq connectivity
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
    });
    results.groq = { status: res.status, ok: res.ok };
  } catch (e: unknown) {
    results.groq = { error: e instanceof Error ? e.message : "Unknown error" };
  }

  return NextResponse.json(results, { status: 200 });
}
