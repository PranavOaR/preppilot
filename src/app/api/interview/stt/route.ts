import { NextRequest, NextResponse } from "next/server";

const SARVAM_URL = process.env.SARVAM_API_URL || "https://api.sarvam.ai";
const SARVAM_KEY = process.env.SARVAM_API_KEY || "";

export async function POST(req: NextRequest) {
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
    sarvamForm.append("model", "saarika:v2");

    const res = await fetch(`${SARVAM_URL}/speech-to-text`, {
      method: "POST",
      headers: { "api-subscription-key": SARVAM_KEY },
      body: sarvamForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Sarvam STT error:", res.status, err);
      return NextResponse.json({ error: "Speech-to-text failed.", detail: err }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ transcript: data.transcript || "" });
  } catch (err) {
    console.error("STT route error:", err);
    return NextResponse.json({ error: "Speech-to-text failed." }, { status: 500 });
  }
}
