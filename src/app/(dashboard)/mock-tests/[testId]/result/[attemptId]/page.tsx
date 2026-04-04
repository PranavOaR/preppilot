"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getAttempt, getMockTest } from "@/lib/db/mock-tests";
import { getProblemById } from "@/lib/db/problems";
import type { MockTest, MockTestAttempt, Problem } from "@/lib/types";

interface ProblemResult {
  problem: Problem;
  sectionLabel: string;
  sectionType: "aptitude" | "dsa";
  userAnswer: string;
  isCorrect: boolean | null; // null for DSA
}

function formatDate(ts: any): string {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MockTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;
  const attemptId = params.attemptId as string;
  const { user } = useAuth();

  const [test, setTest] = useState<MockTest | null>(null);
  const [attempt, setAttempt] = useState<MockTestAttempt | null>(null);
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const [testData, attemptData] = await Promise.all([
          getMockTest(testId),
          getAttempt(attemptId),
        ]);

        if (!testData || !attemptData || attemptData.userId !== user!.uid) {
          router.replace("/mock-tests");
          return;
        }

        setTest(testData);
        setAttempt(attemptData);

        // Load all problems and build results
        const flat: ProblemResult[] = [];
        for (const section of testData.sections) {
          for (const problemId of section.problemIds) {
            const p = await getProblemById(problemId);
            if (!p) continue;
            const userAnswer = attemptData.answers?.[problemId] || "";
            let isCorrect: boolean | null = null;
            if (section.type === "aptitude" && p.correctAnswer) {
              isCorrect = userAnswer === p.correctAnswer;
            }
            flat.push({
              problem: p,
              sectionLabel: section.label,
              sectionType: section.type,
              userAnswer,
              isCorrect,
            });
          }
        }
        setResults(flat);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [testId, attemptId, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!test || !attempt) return null;

  const aptitudeResults = results.filter((r) => r.sectionType === "aptitude");
  const totalAptitude = aptitudeResults.length;
  const correctAptitude = aptitudeResults.filter((r) => r.isCorrect).length;
  const score = attempt.score;

  // Score ring color
  const scoreColor =
    score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-error-brand";

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-1 text-on-surface-variant text-sm hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        All Mock Tests
      </Link>

      {/* Score Card */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-6">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Score Ring */}
          <div className="flex flex-col items-center gap-1">
            <div className={`text-5xl font-bold font-serif ${scoreColor}`}>{score}%</div>
            <div className="text-xs text-on-surface-variant">Overall Score</div>
            {attempt.status === "timed_out" && (
              <span className="mt-1 px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 font-medium">
                Time Out
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h2 className="text-on-surface font-medium text-lg">{test.title}</h2>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {test.company} &bull; {formatDate(attempt.submittedAt)}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-on-surface-variant text-xs">Aptitude</span>
                <p className="text-on-surface font-medium">
                  {correctAptitude}/{totalAptitude} correct
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant text-xs">DSA</span>
                <p className="text-on-surface font-medium">
                  {results.filter((r) => r.sectionType === "dsa" && r.userAnswer).length}/
                  {results.filter((r) => r.sectionType === "dsa").length} submitted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Scores */}
      {Object.keys(attempt.sectionScores || {}).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-on-surface font-medium">Section Scores</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(attempt.sectionScores).map(([label, pct]) => (
              <div key={label} className="rounded-lg bg-surface-container-low subtle-border p-4 space-y-2">
                <p className="text-on-surface-variant text-xs">{label}</p>
                <p
                  className={`text-2xl font-bold ${
                    pct >= 70 ? "text-green-400" : pct >= 40 ? "text-yellow-400" : "text-error-brand"
                  }`}
                >
                  {pct}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Problem Breakdown */}
      <div className="space-y-3">
        <h3 className="text-on-surface font-medium">Problem Breakdown</h3>

        {test.sections.map((section) => {
          const sectionResults = results.filter((r) => r.sectionLabel === section.label);
          if (sectionResults.length === 0) return null;

          return (
            <div key={section.label} className="rounded-xl bg-surface-container-low subtle-border overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">{section.label}</span>
                {section.type === "aptitude" && (
                  <span className="text-xs text-on-surface-variant">
                    {sectionResults.filter((r) => r.isCorrect).length}/{sectionResults.length} correct
                  </span>
                )}
              </div>

              {sectionResults.map((r, i) => (
                <div
                  key={r.problem.id}
                  className={`grid items-start px-4 py-3 border-b border-outline-variant/5 last:border-0 ${
                    section.type === "aptitude"
                      ? "grid-cols-[1fr_auto]"
                      : "grid-cols-[1fr_auto]"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant text-xs font-mono w-5 shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-on-surface text-sm font-medium truncate">
                        {r.problem.title}
                      </p>
                    </div>

                    {section.type === "aptitude" && r.userAnswer && (
                      <div className="ml-7 space-y-0.5">
                        <p className="text-xs text-on-surface-variant">
                          Your answer:{" "}
                          <span className={r.isCorrect ? "text-green-400" : "text-error-brand"}>
                            {r.userAnswer}
                          </span>
                        </p>
                        {!r.isCorrect && r.problem.correctAnswer && (
                          <p className="text-xs text-on-surface-variant">
                            Correct:{" "}
                            <span className="text-green-400">{r.problem.correctAnswer}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {section.type === "dsa" && (
                      <p className="ml-7 text-xs text-on-surface-variant">
                        {r.userAnswer ? "Code submitted" : "Not attempted"}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex items-center pt-0.5">
                    {section.type === "aptitude" ? (
                      r.isCorrect ? (
                        <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                      ) : r.userAnswer ? (
                        <span className="material-symbols-outlined text-[18px] text-error-brand">cancel</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-outline-variant">radio_button_unchecked</span>
                      )
                    ) : r.userAnswer ? (
                      <span className="material-symbols-outlined text-[18px] text-primary-brand">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">radio_button_unchecked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href={`/mock-tests/${testId}`} className="flex-1">
          <button className="w-full py-3 rounded-lg gradient-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity">
            Retake Test
          </button>
        </Link>
        <Link href="/mock-tests" className="flex-1">
          <button className="w-full py-3 rounded-lg bg-surface-container text-on-surface font-medium text-sm hover:bg-surface-container-high transition-colors subtle-border">
            All Mock Tests
          </button>
        </Link>
      </div>
    </main>
  );
}
