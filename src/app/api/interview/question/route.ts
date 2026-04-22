import { NextRequest, NextResponse } from "next/server";
import {
  buildQuestionPrompt,
  buildFollowUpPrompt,
} from "@/lib/groq/interview-prompts";
import { getGroqClient } from "@/lib/groq/client";
import { GROQ_MODELS } from "@/lib/groq/models";
import type { InterviewType, InterviewQA } from "@/lib/types/interview";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODELS.capable,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 300,
    });

    const question = completion.choices[0]?.message?.content?.trim();
    if (!question) {
      return NextResponse.json({ error: "Failed to generate question." }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error("Interview question error:", err);
    return NextResponse.json(
      { error: "Failed to generate question." },
      { status: 500 }
    );
  }
}
