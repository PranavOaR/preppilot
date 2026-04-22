import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

const SARVAM_URL = process.env.SARVAM_API_URL || "https://api.sarvam.ai";
const SARVAM_KEY = process.env.SARVAM_API_KEY || "";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const incoming = await req.formData();
    const audioFile = incoming.get("audio") as File | null;
    const language = (incoming.get("language") as string) || "en-IN";

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
    }

    // Forward to Sarvam speech-to-text as multipart
    const sarvamForm = new FormData();
    sarvamForm.append("file", audioFile, audioFile.name || "recording.webm");
    sarvamForm.append("language_code", language);
    sarvamForm.append("model", "saarika:v2.5");

    const res = await fetch(`${SARVAM_URL}/speech-to-text`, {
      method: "POST",
      headers: { "api-subscription-key": SARVAM_KEY },
      body: sarvamForm,
    });

    const responseText = await res.text();
    console.log(`[STT] Sarvam response ${res.status}:`, responseText.slice(0, 500));

    if (!res.ok) {
      return NextResponse.json(
        { error: "Speech-to-text failed.", detail: responseText },
        { status: 500 }
      );
    }

    let data: { transcript?: string; text?: string };
    try {
      data = JSON.parse(responseText) as { transcript?: string; text?: string };
    } catch {
      console.error("[STT] Sarvam returned non-JSON:", responseText.slice(0, 200));
      return NextResponse.json({ error: "Invalid response from Sarvam." }, { status: 500 });
    }

    const transcript = data.transcript || data.text || "";
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("STT route error:", err);
    return NextResponse.json({ error: "Speech-to-text failed." }, { status: 500 });
  }
}
