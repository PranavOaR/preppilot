import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

const SARVAM_URL = (process.env.SARVAM_API_URL || "https://api.sarvam.ai").replace(/\/$/, "");
const SARVAM_KEY = (process.env.SARVAM_API_KEY || "").trim();
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

  // Admin UID allowlist — no Firebase Admin SDK available for role lookup,
  // so admin UIDs must be configured via env var.
  const adminUids = (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  if (adminUids.length === 0 || !adminUids.includes(authUser.uid)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const results: Record<string, unknown> = {};

  results.env = {
    SARVAM_API_KEY: SARVAM_KEY ? "set" : "NOT SET",
    GROQ_API_KEY: GROQ_KEY ? "set" : "NOT SET",
  };

  // Test Sarvam TTS
  try {
    const res = await fetch(`${SARVAM_URL}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_KEY,
      },
      body: JSON.stringify({
        inputs: ["Hello, this is a test."],
        target_language_code: "en-IN",
        speaker: "meera",
        model: "bulbul:v2",
      }),
    });
    results.sarvam_tts = { status: res.status, ok: res.ok };
  } catch (e: unknown) {
    results.sarvam_tts = { error: e instanceof Error ? e.message : "Unknown error" };
  }

  // Test Sarvam STT endpoint reachability (HEAD request)
  try {
    const res = await fetch(`${SARVAM_URL}/speech-to-text`, { method: "HEAD" });
    results.sarvam_stt_reachable = { status: res.status };
  } catch (e: unknown) {
    results.sarvam_stt_reachable = { error: e instanceof Error ? e.message : "Unknown error" };
  }

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
