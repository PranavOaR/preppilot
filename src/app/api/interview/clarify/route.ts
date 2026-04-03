import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { InterviewType } from "@/lib/types/interview";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export async function POST(req: NextRequest) {
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
      model: "llama-3.1-8b-instant",
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
