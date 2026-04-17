import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_MODELS } from "@/lib/groq/models";
import type { InterviewType } from "@/lib/types/interview";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured in .env.local");
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { originalQuestion, userQuery, type } = (await req.json()) as {
      originalQuestion: string;
      userQuery: string;
      type: InterviewType;
    };

    const prompt = [
      `You are a technical interviewer conducting a ${type} interview.`,
      "",
      `You asked the candidate: "${originalQuestion}"`,
      "",
      `The candidate asked you: "${userQuery}"`,
      "",
      "Respond naturally as an interviewer would — clarify, rephrase, or give a brief hint if needed.",
      "Keep your response conversational and under 3 sentences.",
      "IMPORTANT: Output ONLY your spoken response. No labels, no preamble.",
    ].join("\n");

    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODELS.fast,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content?.trim() || "Please answer based on your best understanding.";

    return NextResponse.json({ response });
  } catch (err) {
    console.error("Interview clarify error:", err);
    return NextResponse.json(
      { response: "Please answer based on your best understanding." },
      { status: 200 } // graceful fallback
    );
  }
}
