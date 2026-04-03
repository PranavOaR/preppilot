import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/sarvam/client";

export async function POST(req: NextRequest) {
  try {
    const { text, language, speaker } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text." }, { status: 400 });
    }

    const audioBuffer = await textToSpeech(
      text,
      language || "en-IN",
      speaker || "meera"
    );

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("TTS error:", msg);
    // Return the actual Sarvam error so the browser console shows it
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
