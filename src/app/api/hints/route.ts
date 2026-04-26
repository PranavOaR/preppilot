import { NextRequest, NextResponse } from "next/server";
import { generateHint } from "@/lib/groq/client";
import { buildHintPrompt } from "@/lib/groq/prompts";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { rollbackUsage } from "@/lib/plans/usage";
import { getCachedHint, setCachedHint, recordHintUsage, getUserUnlockedLevels } from "@/lib/db/hints";
import { awardXP } from "@/lib/xp/calculator";
import { getProblemById } from "@/lib/db/problems";
import { getAdminDb } from "@/lib/firebase/server";
import { PLAN_LIMITS, currentMonth, emptyUsage, type PlanTier, type MonthlyUsage } from "@/lib/types/plans";

const HINT_XP_COSTS: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 25 };

/** Quota check + increment using Admin SDK so it works from API routes. */
async function serverCheckHintQuota(userId: string): Promise<{ allowed: boolean; plan: string }> {
  const db = getAdminDb();
  if (!db) return { allowed: true, plan: "free" };

  return db.runTransaction(async (tx) => {
    const userRef = db.collection("users").doc(userId);
    const snap = await tx.get(userRef);
    if (!snap.exists) return { allowed: true, plan: "free" };

    const data = snap.data()!;
    const plan: PlanTier = (() => {
      const p = data.plan as PlanTier | undefined;
      if (!p || p === "free") return "free";
      if (data.planExpiresAt && Date.now() > (data.planExpiresAt as number)) return "free";
      return p;
    })();
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    const stored = data.usageThisMonth as MonthlyUsage | undefined;
    const month = currentMonth();
    const usage: MonthlyUsage =
      stored && stored.month === month
        ? stored
        : { ...emptyUsage(), interviewsLifetime: stored?.interviewsLifetime ?? 0, month };

    const current = (usage.aiHints as number) || 0;
    if (current >= limits.aiHints) {
      return { allowed: false, plan };
    }

    tx.update(userRef, {
      usageThisMonth: { ...usage, aiHints: current + 1 },
    });
    return { allowed: true, plan };
  });
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const auth = await verifyIdToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { problemId, hintLevel } = await req.json() as {
    problemId: string;
    hintLevel: number;
  };

  if (!problemId || !hintLevel || hintLevel < 1 || hintLevel > 4) {
    return NextResponse.json(
      { error: "Missing problemId or invalid hint level." },
      { status: 400 }
    );
  }

  // Fetch problem server-side — prevents prompt injection via client-supplied problem data.
  const problem = await getProblemById(problemId);
  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  let quotaIncremented = false;
  try {
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

    // Check monthly quota and increment atomically via Admin SDK.
    const quotaCheck = await serverCheckHintQuota(auth.uid);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: `Monthly hint limit reached on your ${quotaCheck.plan} plan. Upgrade for more hints.` },
        { status: 429 }
      );
    }
    quotaIncremented = true;

    // Check hint cache before calling Groq
    let hintText = await getCachedHint(problem.id, hintLevel).catch(() => null);

    if (!hintText) {
      const prompt = buildHintPrompt(problem, hintLevel);
      hintText = await generateHint(prompt);

      // Cache the generated hint (best-effort; may fail if rules require admin)
      try {
        await setCachedHint(problem.id, hintLevel, hintText, "groq");
      } catch { /* caching is optional */ }
    }

    // Deduct XP and record usage (best-effort)
    const xpCost = HINT_XP_COSTS[hintLevel] ?? 5;
    await Promise.allSettled([
      awardXP(auth.uid, -xpCost),
      recordHintUsage(auth.uid, problem.id, hintLevel, xpCost),
    ]);

    return NextResponse.json({ hint: hintText, level: hintLevel });
  } catch (err) {
    // Roll back quota if we incremented and something downstream failed
    if (quotaIncremented) {
      await rollbackUsage(auth.uid, "aiHint").catch(() => {});
    }
    console.error("Hint API error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const userMsg = msg.includes("GROQ_API_KEY")
      ? "AI hints are not configured. Add GROQ_API_KEY to your environment variables."
      : "Failed to generate hint. Please try again.";
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
