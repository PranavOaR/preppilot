import { NextResponse } from "next/server";

const SARVAM_URL = (process.env.SARVAM_API_URL || "https://api.sarvam.ai").replace(/\/$/, "");
const SARVAM_KEY = (process.env.SARVAM_API_KEY || "").trim();
const GROQ_KEY = process.env.GROQ_API_KEY || "";

// GET /api/interview/diagnose
// Visit this URL in the browser to test API connectivity.
export async function GET() {
  const results: Record<string, unknown> = {};

  results.env = {
    SARVAM_API_URL: SARVAM_URL,
    SARVAM_API_KEY: SARVAM_KEY ? `set — starts with: ${SARVAM_KEY.slice(0, 10)}` : "NOT SET ❌",
    GROQ_API_KEY: GROQ_KEY ? `set — starts with: ${GROQ_KEY.slice(0, 10)}` : "NOT SET ❌",
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
    const body = await res.text();
    results.sarvam_tts = {
      status: res.status,
      ok: res.ok,
      response_preview: body.slice(0, 300),
    };
  } catch (e: any) {
    results.sarvam_tts = { error: e.message };
  }

  // Test Sarvam STT endpoint reachability (HEAD request)
  try {
    const res = await fetch(`${SARVAM_URL}/speech-to-text`, { method: "HEAD" });
    results.sarvam_stt_reachable = { status: res.status };
  } catch (e: any) {
    results.sarvam_stt_reachable = { error: e.message };
  }

  // Test Groq connectivity
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
    });
    results.groq = { status: res.status, ok: res.ok };
  } catch (e: any) {
    results.groq = { error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
