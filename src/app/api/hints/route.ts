import { NextRequest, NextResponse } from "next/server";
import { generateHint } from "@/lib/groq/client";
import { buildHintPrompt } from "@/lib/groq/prompts";
import { getProblemById } from "@/lib/db/problems";
import {
  getCachedHint,
  setCachedHint,
  getHintUsage,
  recordHintUsage,
  getUserHintsToday,
} from "@/lib/db/hints";
import { awardXP } from "@/lib/xp/calculator";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const XP_COSTS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 25,
};

const DAILY_LIMIT = 10;

export async function POST(req: NextRequest) {
  try {
    const { problemId, hintLevel, userId } = await req.json();

    // Validate level
    if (!hintLevel || hintLevel < 1 || hintLevel > 4) {
      return NextResponse.json(
        { error: "Invalid hint level. Must be 1-4." },
        { status: 400 }
      );
    }

    if (!problemId || !userId) {
      return NextResponse.json(
        { error: "Missing problemId or userId." },
        { status: 400 }
      );
    }

    // Check prior levels unlocked (must view level N-1 before N)
    if (hintLevel > 1) {
      const prevUnlocked = await getHintUsage(userId, problemId, hintLevel - 1);
      if (!prevUnlocked) {
        return NextResponse.json(
          { error: `You must unlock level ${hintLevel - 1} first.` },
          { status: 400 }
        );
      }
    }

    // Check if already unlocked (return cached for free)
    const alreadyUsed = await getHintUsage(userId, problemId, hintLevel);
    if (alreadyUsed) {
      const cached = await getCachedHint(problemId, hintLevel);
      if (cached) {
        return NextResponse.json({
          hint: cached,
          level: hintLevel,
          xpDeducted: 0,
          cached: true,
        });
      }
    }

    // Check daily limit
    const todayCount = await getUserHintsToday(userId);
    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Daily hint limit reached (${DAILY_LIMIT}/day). Try again tomorrow.` },
        { status: 429 }
      );
    }

    // Check user has enough XP
    const xpCost = XP_COSTS[hintLevel];
    const userSnap = await getDoc(doc(db, "users", userId));
    const userXP = userSnap.exists() ? (userSnap.data().xp || 0) : 0;

    if (userXP < xpCost) {
      return NextResponse.json(
        { error: `Not enough XP. Need ${xpCost} XP, you have ${userXP}.` },
        { status: 400 }
      );
    }

    // Check hint cache
    let hintText = await getCachedHint(problemId, hintLevel);
    let fromCache = true;

    if (!hintText) {
      // Fetch problem and generate hint
      const problem = await getProblemById(problemId);
      if (!problem) {
        return NextResponse.json(
          { error: "Problem not found." },
          { status: 404 }
        );
      }

      const prompt = buildHintPrompt(problem, hintLevel);
      hintText = await generateHint(prompt);
      fromCache = false;

      // Cache the hint
      await setCachedHint(problemId, hintLevel, hintText, "llama-3.3-70b-versatile");
    }

    // Deduct XP (negative increment)
    await awardXP(userId, -xpCost);

    // Record usage
    await recordHintUsage(userId, problemId, hintLevel, xpCost);

    return NextResponse.json({
      hint: hintText,
      level: hintLevel,
      xpDeducted: xpCost,
      cached: fromCache,
    });
  } catch (err) {
    console.error("Hint API error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const userMsg = msg.includes("GROQ_API_KEY")
      ? "AI hints are not configured. Add GROQ_API_KEY to your .env.local and restart the server."
      : "Failed to generate hint. Please try again.";
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
