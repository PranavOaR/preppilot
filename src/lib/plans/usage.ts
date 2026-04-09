import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  PLAN_LIMITS,
  currentMonth,
  emptyUsage,
  type PlanTier,
  type MonthlyUsage,
} from "@/lib/types/plans";

type UsageAction = "dsaRun" | "dsaSubmit" | "aiHint" | "codeReview" | "interview";

interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: PlanTier;
}

/** Resolve effective plan — falls back to free if plan is expired. */
function effectivePlan(plan: PlanTier | undefined, planExpiresAt: number | undefined): PlanTier {
  if (!plan || plan === "free") return "free";
  if (planExpiresAt && Date.now() > planExpiresAt) return "free";
  return plan;
}

/** Reset usage counters if the stored month differs from the current month. */
function freshUsage(stored: MonthlyUsage | undefined): MonthlyUsage {
  const month = currentMonth();
  if (!stored || stored.month !== month) {
    return {
      ...emptyUsage(),
      // Preserve lifetime interview count across resets
      interviewsLifetime: stored?.interviewsLifetime ?? 0,
      month,
    };
  }
  return stored;
}

/**
 * Check whether an action is within plan limits, then increment the counter.
 * Returns { allowed: false } without incrementing if the limit is reached.
 */
export async function checkAndIncrementUsage(
  userId: string,
  action: UsageAction
): Promise<UsageCheckResult> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return { allowed: false, remaining: 0, limit: 0, plan: "free" };
  }

  const data = snap.data();
  const plan = effectivePlan(data.plan, data.planExpiresAt);
  const limits = PLAN_LIMITS[plan];
  const usage = freshUsage(data.usageThisMonth as MonthlyUsage | undefined);

  let current: number;
  let limit: number;
  let field: keyof MonthlyUsage;

  if (action === "interview") {
    if (limits.interviewsMonthly) {
      current = usage.interviewsThisMonth;
      limit = limits.interviews;
      field = "interviewsThisMonth";
    } else {
      current = usage.interviewsLifetime;
      limit = limits.interviews;
      field = "interviewsLifetime";
    }
  } else {
    const actionMap: Record<Exclude<UsageAction, "interview">, { field: keyof MonthlyUsage; limit: number }> = {
      dsaRun:     { field: "dsaRuns",   limit: limits.dsaRuns },
      dsaSubmit:  { field: "dsaSubmits", limit: limits.dsaSubmits },
      aiHint:     { field: "aiHints",   limit: limits.aiHints },
      codeReview: { field: "codeReviews", limit: limits.codeReviews },
    };
    ({ field, limit } = actionMap[action as Exclude<UsageAction, "interview">]);
    current = usage[field] as number;
  }

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit, plan };
  }

  // Increment
  const updated: MonthlyUsage = { ...usage, [field]: current + 1 };
  await updateDoc(userRef, { usageThisMonth: updated });

  return { allowed: true, remaining: limit - current - 1, limit, plan };
}

/** Read current usage without incrementing (for display purposes). */
export async function getUsage(userId: string): Promise<{
  plan: PlanTier;
  usage: MonthlyUsage;
  limits: typeof PLAN_LIMITS[PlanTier];
}> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) {
    return { plan: "free", usage: emptyUsage(), limits: PLAN_LIMITS.free };
  }
  const data = snap.data();
  const plan = effectivePlan(data.plan, data.planExpiresAt);
  const usage = freshUsage(data.usageThisMonth as MonthlyUsage | undefined);
  return { plan, usage, limits: PLAN_LIMITS[plan] };
}
