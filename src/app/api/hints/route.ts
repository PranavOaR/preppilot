import { NextRequest, NextResponse } from "next/server";
import { generateHint } from "@/lib/groq/client";
import { buildHintPrompt } from "@/lib/groq/prompts";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { checkAndIncrementUsage, rollbackUsage } from "@/lib/plans/usage";
import { getCachedHint, setCachedHint, recordHintUsage, getUserUnlockedLevels } from "@/lib/db/hints";
import { awardXP } from "@/lib/xp/calculator";
import type { Problem } from "@/lib/types";

const HINT_XP_COSTS: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 25 };

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const auth = await verifyIdToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Enforce level progression: level N requires level N-1 to be already unlocked
  if (hintLevel > 1) {
    const unlockedLevels = await getUserUnlockedLevels(auth.uid, problem.id);
    if (!unlockedLevels.includes(hintLevel - 1)) {
      return NextResponse.json(
        { error: `You must unlock level ${hintLevel - 1} before level ${hintLevel}.` },
        { status: 400 }
      );
    }
    // If already unlocked, serve from cache without re-charging
    if (unlockedLevels.includes(hintLevel)) {
      const cached = await getCachedHint(problem.id, hintLevel);
      if (cached) return NextResponse.json({ hint: cached, level: hintLevel });
    }
  }

  // Check monthly quota and increment atomically
  const quotaCheck = await checkAndIncrementUsage(auth.uid, "aiHint");
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      { error: `Monthly hint limit reached on your ${quotaCheck.plan} plan. Upgrade for more hints.` },
      { status: 429 }
    );
  }

  try {
    // Check hint cache before calling Groq
    let hintText = await getCachedHint(problem.id, hintLevel);

    if (!hintText) {
      const prompt = buildHintPrompt(problem, hintLevel);
      hintText = await generateHint(prompt);

      // Cache the generated hint
      try {
        await setCachedHint(problem.id, hintLevel, hintText, "groq");
      } catch { /* caching is optional */ }
    }

    // Deduct XP and record usage server-side
    const xpCost = HINT_XP_COSTS[hintLevel] ?? 5;
    await Promise.allSettled([
      awardXP(auth.uid, -xpCost),
      recordHintUsage(auth.uid, problem.id, hintLevel, xpCost),
    ]);

    return NextResponse.json({ hint: hintText, level: hintLevel });
  } catch (err) {
    // Roll back quota if Groq failed
    await rollbackUsage(auth.uid, "aiHint").catch(() => {});
    console.error("Hint API error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const userMsg = msg.includes("GROQ_API_KEY")
      ? "AI hints are not configured. Add GROQ_API_KEY to your environment variables."
      : "Failed to generate hint. Please try again.";
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
