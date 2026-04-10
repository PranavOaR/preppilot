import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  buildQuestionPrompt,
  buildFollowUpPrompt,
} from "@/lib/groq/interview-prompts";
import { GROQ_MODELS } from "@/lib/groq/models";
import type { InterviewType, InterviewQA } from "@/lib/types/interview";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export async function POST(req: NextRequest) {
  try {
    const {
      type,
      targetCompany,
      questionIndex,
      totalQuestions,
      previousQAs,
      followUp,
      topics,
      avgScore,
    } = (await req.json()) as {
      type: InterviewType;
      targetCompany: string;
      questionIndex: number;
      totalQuestions: number;
      previousQAs: InterviewQA[];
      followUp?: { originalQuestion: string; userAnswer: string; score: number };
      topics?: string[];
      avgScore?: number;
    };

    let prompt: string;
    if (followUp) {
      prompt = buildFollowUpPrompt(
        followUp.originalQuestion,
        followUp.userAnswer,
        followUp.score
      );
    } else {
      prompt = buildQuestionPrompt(
        type,
        targetCompany,
        questionIndex,
        totalQuestions,
        previousQAs,
        topics,
        avgScore
      );
    }

    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODELS.capable,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 300,
    });

    const question = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ question });
  } catch (err) {
    console.error("Interview question error:", err);
    return NextResponse.json(
      { error: "Failed to generate question." },
      { status: 500 }
    );
  }
}
