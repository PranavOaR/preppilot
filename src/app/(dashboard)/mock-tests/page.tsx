"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getMockTests, getAttemptsByUser } from "@/lib/db/mock-tests";
import type { MockTest, MockTestAttempt } from "@/lib/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-green-400/10 text-green-400",
  medium: "bg-yellow-400/10 text-yellow-400",
  hard: "bg-error-container/30 text-error-brand",
};

const COMPANY_COLORS: Record<string, string> = {
  TCS: "bg-blue-500/10 text-blue-400",
  Infosys: "bg-indigo-500/10 text-indigo-400",
  Wipro: "bg-purple-500/10 text-purple-400",
  Zoho: "bg-orange-500/10 text-orange-400",
};

export default function MockTestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<MockTestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [testsData, attemptsData] = await Promise.all([
          getMockTests(),
          user ? getAttemptsByUser(user.uid) : Promise.resolve([]),
        ]);
        // Sort by company name
        testsData.sort((a, b) => a.company.localeCompare(b.company));
        setTests(testsData);
        setAttempts(attemptsData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Group by company
  const byCompany = tests.reduce<Record<string, MockTest[]>>((acc, t) => {
    if (!acc[t.company]) acc[t.company] = [];
    acc[t.company].push(t);
    return acc;
  }, {});

  // Best attempt per test
  const bestAttemptByTest = attempts.reduce<Record<string, MockTestAttempt>>((acc, a) => {
    if (
      a.status !== "in_progress" &&
      (!acc[a.testId] || a.score > acc[a.testId].score)
    ) {
      acc[a.testId] = a;
    }
    return acc;
  }, {});

  const inProgressByTest = attempts.reduce<Record<string, MockTestAttempt>>((acc, a) => {
    if (a.status === "in_progress") acc[a.testId] = a;
    return acc;
  }, {});

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium">Company Mock Tests</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Simulate real placement tests from top Indian IT companies
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low subtle-border p-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block">quiz</span>
          <h2 className="text-on-surface text-lg font-medium mb-2">No mock tests available</h2>
          <p className="text-on-surface-variant text-sm">
            Run the seed script to populate mock tests.
          </p>
        </div>
      ) : (
        Object.entries(byCompany).map(([company, companyTests]) => (
          <div key={company} className="space-y-4">
            {/* Company Header */}
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  COMPANY_COLORS[company] || "bg-primary-container/20 text-primary-brand"
                }`}
              >
                {company}
              </div>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>

            {/* Test Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyTests.map((test) => {
                const best = bestAttemptByTest[test.id];
                const inProgress = inProgressByTest[test.id];
                const totalQuestions = test.sections.reduce((s, sec) => s + sec.problemIds.length, 0);

                return (
                  <div
                    key={test.id}
                    className="rounded-xl bg-surface-container-low subtle-border p-5 space-y-4 hover:bg-surface-container transition-colors"
                  >
                    {/* Title + Difficulty */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-on-surface font-medium text-sm leading-snug">
                          {test.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize shrink-0 ${
                            DIFFICULTY_STYLES[test.difficulty]
                          }`}
                        >
                          {test.difficulty}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-xs leading-relaxed">
                        {test.description}
                      </p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        {test.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">quiz</span>
                        {totalQuestions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">view_module</span>
                        {test.sections.length} sections
                      </span>
                    </div>

                    {/* Sections */}
                    <div className="flex flex-wrap gap-1.5">
                      {test.sections.map((sec) => (
                        <span
                          key={sec.label}
                          className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface-variant"
                        >
                          {sec.label} ({sec.problemIds.length})
                        </span>
                      ))}
                    </div>

                    {/* Best Score */}
                    {best && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-[14px] text-primary-brand">
                          emoji_events
                        </span>
                        <span className="text-primary-brand font-medium">
                          Best: {best.score}%
                        </span>
                        <Link
                          href={`/mock-tests/${test.id}/result/${best.id}`}
                          className="text-on-surface-variant hover:text-primary-brand hover:underline ml-1"
                        >
                          View results
                        </Link>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="pt-1">
                      {inProgress ? (
                        <Link
                          href={`/mock-tests/${test.id}?attempt=${inProgress.id}`}
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          Resume Test
                        </Link>
                      ) : (
                        <Link
                          href={`/mock-tests/${test.id}`}
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {best ? "replay" : "play_arrow"}
                          </span>
                          {best ? "Retake Test" : "Start Test"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
