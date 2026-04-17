import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildEvaluationPrompt } from "@/lib/groq/interview-prompts";
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
    const { question, transcript, type } = (await req.json()) as {
      question: string;
      transcript: string;
      type: InterviewType;
    };

    // Reject clearly invalid transcripts before calling Groq
    const isInvalid =
      !transcript ||
      transcript.trim().length < 3 ||
      transcript.startsWith("[") ||
      /transcription failed|no speech|no audio|microphone access/i.test(transcript);

    if (isInvalid) {
      return NextResponse.json({
        score: 0,
        evaluation: "No valid answer was received for this question.",
        comment: "I didn't catch your answer — let's move on. Don't worry, it happens!",
      });
    }

    const prompt = buildEvaluationPrompt(question, transcript, type);

    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODELS.fast,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    // Parse JSON response
    let score = 5;
    let evaluation = "Unable to evaluate response.";
    let comment = "";

    try {
      const parsed = JSON.parse(raw);
      score = Math.min(10, Math.max(0, Number(parsed.score) || 5));
      evaluation = parsed.evaluation || evaluation;
      comment = parsed.comment || "";
    } catch {
      // If JSON parsing fails, try to extract score from text
      const scoreMatch = raw.match(/(\d+)\s*\/\s*10/);
      if (scoreMatch) score = Number(scoreMatch[1]);
      evaluation = raw;
    }

    return NextResponse.json({ score, evaluation, comment });
  } catch (err) {
    console.error("Interview evaluate error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate answer." },
      { status: 500 }
    );
  }
}
