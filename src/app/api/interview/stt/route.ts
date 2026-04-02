import { NextRequest, NextResponse } from "next/server";
import { speechToText } from "@/lib/sarvam/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en-IN";

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const transcript = await speechToText(audioBuffer, language);

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("STT error:", err);
    return NextResponse.json(
      { error: "Speech-to-text failed." },
      { status: 500 }
    );
  }
}
