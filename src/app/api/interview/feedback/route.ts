import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildFeedbackPrompt } from "@/lib/groq/interview-prompts";
import type { InterviewType, InterviewQA } from "@/lib/types/interview";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export async function POST(req: NextRequest) {
  try {
    const { type, targetCompany, qas } = (await req.json()) as {
      type: InterviewType;
      targetCompany: string;
      qas: InterviewQA[];
    };

    const prompt = buildFeedbackPrompt(type, targetCompany, qas);

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    try {
      const feedback = JSON.parse(raw);
      return NextResponse.json(feedback);
    } catch {
      // Fallback if JSON parsing fails
      return NextResponse.json({
        overallScore: Math.round(
          (qas.reduce((sum, qa) => sum + qa.score, 0) / qas.length) * 10
        ),
        summary: raw.slice(0, 500),
        strengths: ["Completed the interview"],
        weaknesses: ["Could not parse detailed feedback"],
        topicScores: {},
        suggestions: ["Practice more and try again"],
      });
    }
  } catch (err) {
    console.error("Interview feedback error:", err);
    return NextResponse.json(
      { error: "Failed to generate feedback." },
      { status: 500 }
    );
  }
}
