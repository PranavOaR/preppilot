import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";

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

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Admin SDK not configured." }, { status: 503 });
  }
  const userSnap = await db.collection("users").doc(authUser.uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== "admin") {
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
