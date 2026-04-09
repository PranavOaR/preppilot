export type PlanTier = "free" | "starter" | "pro" | "premium";

export interface MonthlyUsage {
  dsaRuns: number;
  dsaSubmits: number;
  aiHints: number;
  codeReviews: number;
  interviewsThisMonth: number;
  interviewsLifetime: number;
  month: string; // 'YYYY-MM'
}

export interface PlanLimits {
  dsaRuns: number;
  dsaSubmits: number;
  aiHints: number;
  codeReviews: number;
  /** For premium: monthly interviews. For others: lifetime interviews. */
  interviews: number;
  interviewsMonthly: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free:    { dsaRuns: 25,  dsaSubmits: 8,  aiHints: 8,  codeReviews: 0, interviews: 1, interviewsMonthly: false },
  starter: { dsaRuns: 50,  dsaSubmits: 12, aiHints: 12, codeReviews: 0, interviews: 1, interviewsMonthly: false },
  pro:     { dsaRuns: 150, dsaSubmits: 30, aiHints: 25, codeReviews: 1, interviews: 1, interviewsMonthly: false },
  premium: { dsaRuns: 300, dsaSubmits: 75, aiHints: 50, codeReviews: 4, interviews: 2, interviewsMonthly: true  },
};

export const PLAN_PRICES: Record<Exclude<PlanTier, "free">, { paise: number; inr: number; label: string }> = {
  starter: { paise: 29900, inr: 299, label: "₹299/year" },
  pro:     { paise: 49900, inr: 499, label: "₹499/year" },
  premium: { paise: 99900, inr: 999, label: "₹999/year" },
};

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function emptyUsage(): MonthlyUsage {
  return {
    dsaRuns: 0,
    dsaSubmits: 0,
    aiHints: 0,
    codeReviews: 0,
    interviewsThisMonth: 0,
    interviewsLifetime: 0,
    month: currentMonth(),
  };
}
