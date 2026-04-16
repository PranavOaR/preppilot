import { doc, getDoc, runTransaction } from "firebase/firestore";
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
 * Uses a Firestore transaction to prevent race conditions (double-spend).
 * For interviews: if the plan quota is exhausted, falls back to purchasedInterviews credit.
 * Returns { allowed: false } without incrementing if both quota and credits are exhausted.
 */
export async function checkAndIncrementUsage(
  userId: string,
  action: UsageAction
): Promise<UsageCheckResult> {
  const userRef = doc(db, "users", userId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);

    if (!snap.exists()) {
      return { allowed: false, remaining: 0, limit: 0, plan: "free" as PlanTier };
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

      if (current >= limit) {
        // Fall back to purchased interview credits
        const purchased = (data.purchasedInterviews as number) || 0;
        if (purchased <= 0) {
          return { allowed: false, remaining: 0, limit, plan };
        }
        // Consume one purchased credit
        const updated: MonthlyUsage = { ...usage, [field]: current + 1 };
        transaction.update(userRef, {
          usageThisMonth: updated,
          purchasedInterviews: purchased - 1,
        });
        return { allowed: true, remaining: purchased - 1, limit, plan };
      }
    } else {
      const actionMap: Record<Exclude<UsageAction, "interview">, { field: keyof MonthlyUsage; limit: number }> = {
        dsaRun:     { field: "dsaRuns",    limit: limits.dsaRuns },
        dsaSubmit:  { field: "dsaSubmits", limit: limits.dsaSubmits },
        aiHint:     { field: "aiHints",    limit: limits.aiHints },
        codeReview: { field: "codeReviews", limit: limits.codeReviews },
      };
      ({ field, limit } = actionMap[action as Exclude<UsageAction, "interview">]);
      current = usage[field] as number;

      if (current >= limit) {
        return { allowed: false, remaining: 0, limit, plan };
      }
    }

    // Increment within the transaction
    const updated: MonthlyUsage = { ...usage, [field]: current + 1 };
    transaction.update(userRef, { usageThisMonth: updated });

    return { allowed: true, remaining: limit - current - 1, limit, plan };
  });
}

/** Roll back a single usage increment (best-effort, e.g. when a downstream check fails). */
export async function rollbackUsage(userId: string, action: UsageAction): Promise<void> {
  const userRef = doc(db, "users", userId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const usage = freshUsage(data.usageThisMonth as MonthlyUsage | undefined);

    const fieldMap: Record<UsageAction, keyof MonthlyUsage> = {
      dsaRun: "dsaRuns",
      dsaSubmit: "dsaSubmits",
      aiHint: "aiHints",
      codeReview: "codeReviews",
      interview: "interviewsThisMonth",
    };
    const field = fieldMap[action];
    const current = (usage[field] as number) || 0;
    if (current <= 0) return;

    const updated: MonthlyUsage = { ...usage, [field]: current - 1 };
    transaction.update(userRef, { usageThisMonth: updated });
  });
}

/** Read current usage without incrementing (for display purposes). */
export async function getUsage(userId: string): Promise<{
  plan: PlanTier;
  usage: MonthlyUsage;
  limits: typeof PLAN_LIMITS[PlanTier];
  purchasedInterviews: number;
}> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) {
    return { plan: "free", usage: emptyUsage(), limits: PLAN_LIMITS.free, purchasedInterviews: 0 };
  }
  const data = snap.data();
  const plan = effectivePlan(data.plan, data.planExpiresAt);
  const usage = freshUsage(data.usageThisMonth as MonthlyUsage | undefined);
  const purchasedInterviews = (data.purchasedInterviews as number) || 0;
  return { plan, usage, limits: PLAN_LIMITS[plan], purchasedInterviews };
}
