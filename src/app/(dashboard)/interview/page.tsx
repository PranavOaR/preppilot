"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserInterviews, getInterviewFeedback } from "@/lib/db/interviews";
import { getUsage } from "@/lib/plans/usage";
import type { InterviewSession, InterviewFeedback } from "@/lib/types/interview";
import type { PlanTier, PlanLimits, MonthlyUsage } from "@/lib/types/plans";
import { INTERVIEW_ADDON_PRICE } from "@/lib/types/plans";

const TYPE_LABELS: Record<string, string> = {
  dsa: "DSA",
  aptitude: "Aptitude",
  behavioral: "Behavioral",
  "company-specific": "Company-Specific",
};

const TYPE_ICONS: Record<string, string> = {
  dsa: "code",
  aptitude: "calculate",
  behavioral: "psychology",
  "company-specific": "business_center",
};

function formatDate(ts: any): string {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function InterviewHistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, InterviewFeedback>>({});
  const [loading, setLoading] = useState(true);
  const [quotaPlan, setQuotaPlan] = useState<PlanTier>("free");
  const [quotaLimits, setQuotaLimits] = useState<PlanLimits | null>(null);
  const [quotaUsage, setQuotaUsage] = useState<MonthlyUsage | null>(null);
  const [purchasedCredits, setPurchasedCredits] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function loadHistory() {
      try {
        const [data, usageData] = await Promise.all([
          getUserInterviews(user!.uid),
          getUsage(user!.uid),
        ]);
        setSessions(data);
        setQuotaPlan(usageData.plan);
        setQuotaLimits(usageData.limits);
        setQuotaUsage(usageData.usage);
        setPurchasedCredits(usageData.purchasedInterviews);

        const completed = data.filter((s) => s.status === "completed");
        const fbEntries = await Promise.all(
          completed.map(async (s) => {
            const fb = await getInterviewFeedback(s.id);
            return [s.id, fb] as [string, InterviewFeedback | null];
          })
        );
        const map: Record<string, InterviewFeedback> = {};
        for (const [id, fb] of fbEntries) {
          if (fb) map[id] = fb;
        }
        setFeedbackMap(map);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  // Derive quota display values
  const isMonthly = quotaLimits?.interviewsMonthly ?? false;
  const interviewsUsed = isMonthly
    ? (quotaUsage?.interviewsThisMonth ?? 0)
    : (quotaUsage?.interviewsLifetime ?? 0);
  const interviewLimit = quotaLimits?.interviews ?? 1;
  const planQuotaLeft = Math.max(0, interviewLimit - interviewsUsed);
  const totalAvailable = planQuotaLeft + purchasedCredits;
  const isExhausted = totalAvailable === 0;

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in-up">
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-on-surface font-medium">Mock Interviews</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/interview/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Interview
        </Link>
      </div>

      {/* Quota status banner */}
      {quotaLimits && (
        <div className={`rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 subtle-border ${
          isExhausted ? "bg-red-500/5 border-red-500/20" : "bg-surface-container-low"
        }`}>
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-[22px] ${isExhausted ? "text-error" : "text-primary-brand"}`}>
              record_voice_over
            </span>
            <div>
              <p className="text-on-surface text-sm font-medium">
                {isExhausted
                  ? quotaPlan === "free"
                    ? "Free trial interview used"
                    : "Interview limit reached"
                  : `${totalAvailable} interview${totalAvailable !== 1 ? "s" : ""} available`}
              </p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {planQuotaLeft} plan quota
                {purchasedCredits > 0 && ` · ${purchasedCredits} purchased credit${purchasedCredits > 1 ? "s" : ""}`}
                {isMonthly ? " · resets monthly" : " · lifetime"}
              </p>
            </div>
          </div>
          {isExhausted && (
            <div className="flex gap-2 shrink-0">
              <Link
                href="/interview/new"
                className="px-4 py-2 rounded-lg text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
              >
                Buy ₹{INTERVIEW_ADDON_PRICE.inr}
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
              >
                Upgrade
              </Link>
            </div>
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low subtle-border p-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block">
            record_voice_over
          </span>
          <h2 className="text-on-surface text-lg font-medium mb-2">No interviews yet</h2>
          <p className="text-on-surface-variant text-sm mb-6">
            Practice mock interviews with AI and get detailed feedback.
          </p>
          <Link
            href="/interview/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Start Your First Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const feedback = feedbackMap[session.id];
            const isCompleted = session.status === "completed";
            const isInProgress = session.status === "in-progress";

            return (
              <div
                key={session.id}
                className="rounded-xl bg-surface-container-low subtle-border p-5 hover:bg-surface-container transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-brand text-[20px]">
                        {TYPE_ICONS[session.type] || "mic"}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-on-surface font-medium text-sm">
                          {TYPE_LABELS[session.type] || session.type} Interview
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/20 text-primary-brand">
                          {session.targetCompany}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/10 text-green-400">
                            Completed
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-500/10 text-yellow-400">
                            In Progress
                          </span>
                        )}
                        {session.status === "abandoned" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-outline-variant/20 text-on-surface-variant">
                            Abandoned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                        <span>{formatDate(session.startedAt)}</span>
                        <span>&bull;</span>
                        <span>{session.questionsCompleted}/{session.totalQuestions} questions</span>
                        <span>&bull;</span>
                        <span className="capitalize">{session.language.replace("-", " ")}</span>
                      </div>
                      {feedback && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="material-symbols-outlined text-[14px] text-primary-brand">star</span>
                          <span className="text-primary-brand font-medium">
                            Score: {feedback.overallScore}/100
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted && feedback && (
                      <Link
                        href={`/interview/${session.id}/feedback`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-container/15 text-primary-brand hover:bg-primary-container/25 transition-colors"
                      >
                        View Feedback
                      </Link>
                    )}
                    {isInProgress && (
                      <Link
                        href={`/interview/${session.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
                      >
                        Resume
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
