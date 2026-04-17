import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildFeedbackPrompt } from "@/lib/groq/interview-prompts";
import { GROQ_MODELS } from "@/lib/groq/models";
import type { InterviewType, InterviewQA } from "@/lib/types/interview";
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
    const { type, targetCompany, qas } = (await req.json()) as {
      type: InterviewType;
      targetCompany: string;
      qas: InterviewQA[];
    };

    const prompt = buildFeedbackPrompt(type, targetCompany, qas);

    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODELS.capable,
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
      const overallScore =
        qas.length > 0
          ? Math.round(
              (qas.reduce((sum, qa) => sum + qa.score, 0) / qas.length) * 10
            )
          : 0;
      return NextResponse.json({
        overallScore,
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
