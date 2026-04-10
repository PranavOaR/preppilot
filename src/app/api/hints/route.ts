import { NextRequest, NextResponse } from "next/server";
import { generateHint } from "@/lib/groq/client";
import { buildHintPrompt } from "@/lib/groq/prompts";
import type { Problem } from "@/lib/types";

/**
 * POST /api/hints
 *
 * Generates an AI hint for a DSA problem using Groq.
 * All quota checking, XP deduction, and usage tracking are handled
 * CLIENT-SIDE in hint-panel.tsx — this route only calls the Groq API.
 *
 * Body: { problem: Problem, hintLevel: 1|2|3|4 }
 */
export async function POST(req: NextRequest) {
  try {
    const { problem, hintLevel } = await req.json() as {
      problem: Problem;
      hintLevel: number;
    };

    if (!problem || !hintLevel || hintLevel < 1 || hintLevel > 4) {
      return NextResponse.json(
        { error: "Missing problem data or invalid hint level." },
        { status: 400 }
      );
    }

    const prompt = buildHintPrompt(problem, hintLevel);
    const hintText = await generateHint(prompt);

    return NextResponse.json({ hint: hintText, level: hintLevel });
  } catch (err) {
    console.error("Hint API error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const userMsg = msg.includes("GROQ_API_KEY")
      ? "AI hints are not configured. Add GROQ_API_KEY to your environment variables."
      : "Failed to generate hint. Please try again.";
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
