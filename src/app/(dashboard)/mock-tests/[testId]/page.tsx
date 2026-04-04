"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/auth-context";
import {
  getMockTest,
  createAttempt,
  getInProgressAttempt,
  getAttempt,
  submitAttempt,
} from "@/lib/db/mock-tests";
import { getProblemById } from "@/lib/db/problems";
import { ContestTimer } from "@/components/practice/contest-timer";
import type { MockTest, MockTestAttempt, Problem } from "@/lib/types";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-surface-container-lowest">
      <span className="material-symbols-outlined text-outline text-3xl animate-spin">
        progress_activity
      </span>
    </div>
  ),
});

const monacoLangMap: Record<string, string> = {
  python: "python",
  c: "c",
  cpp: "cpp",
  java: "java",
};

const diffColors: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

interface FlatProblem {
  problem: Problem;
  sectionLabel: string;
  sectionType: "aptitude" | "dsa";
}

export default function MockTestTakePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = params.testId as string;
  const { user } = useAuth();

  const [test, setTest] = useState<MockTest | null>(null);
  const [attempt, setAttempt] = useState<MockTestAttempt | null>(null);
  const [flatProblems, setFlatProblems] = useState<FlatProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Per-problem state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState<"python" | "c" | "cpp" | "java">("python");

  const currentFlat = flatProblems[currentIndex] || null;
  const currentProblem = currentFlat?.problem || null;

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const testData = await getMockTest(testId);
      if (!testData) {
        router.replace("/mock-tests");
        return;
      }
      setTest(testData);

      // Find or create attempt
      const attemptIdFromUrl = searchParams.get("attempt");
      let currentAttempt: MockTestAttempt | null = null;

      if (attemptIdFromUrl) {
        currentAttempt = await getAttempt(attemptIdFromUrl);
      }
      if (!currentAttempt) {
        currentAttempt = await getInProgressAttempt(testId, user.uid);
      }
      if (!currentAttempt) {
        const newId = await createAttempt(testId, user.uid);
        currentAttempt = await getAttempt(newId);
      }

      if (!currentAttempt) {
        router.replace("/mock-tests");
        return;
      }

      setAttempt(currentAttempt);
      setAnswers(currentAttempt.answers || {});

      // Compute end time
      const startMs = currentAttempt.startedAt?.seconds
        ? currentAttempt.startedAt.seconds * 1000
        : Date.now();
      setEndTime(new Date(startMs + testData.durationMinutes * 60 * 1000));

      // Load all problems flat
      const flat: FlatProblem[] = [];
      for (const section of testData.sections) {
        for (const problemId of section.problemIds) {
          const p = await getProblemById(problemId);
          if (p) flat.push({ problem: p, sectionLabel: section.label, sectionType: section.type });
        }
      }
      setFlatProblems(flat);
    } finally {
      setLoading(false);
    }
  }, [testId, user, router, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset per-problem editor state when switching
  useEffect(() => {
    if (currentProblem?.type === "dsa") {
      // Only set starter code if no saved answer
      if (!answers[currentProblem.id]) {
        // Don't override, editor will show empty
      }
    }
  }, [currentIndex, currentProblem, answers]);

  async function handleSubmit(status: "submitted" | "timed_out" = "submitted") {
    if (!attempt || submitting || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    setSubmitting(true);
    try {
      await submitAttempt(attempt.id, answers, status);
      // Fetch updated attempt to get the score
      const updated = await getAttempt(attempt.id);
      if (updated) {
        router.push(`/mock-tests/${testId}/result/${attempt.id}`);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      hasAutoSubmitted.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function handleTimeUp() {
    if (!hasAutoSubmitted.current) {
      setTimeUp(true);
      handleSubmit("timed_out");
    }
  }

  function setAnswer(problemId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [problemId]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!test || flatProblems.length === 0 || !endTime) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-on-surface-variant">Test not available.</p>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = flatProblems.length;

  return (
    <div>
      {/* Timer */}
      <ContestTimer endTime={endTime} onTimeUp={handleTimeUp} />

      {timeUp && (
        <div className="bg-red-500/20 px-6 py-3 text-center text-red-400 text-sm font-medium">
          Time is up! Submitting your answers...
        </div>
      )}

      <div className="flex min-h-[calc(100vh-57px-44px)]">
        {/* Sidebar */}
        <div className="w-60 shrink-0 border-r border-outline-variant/10 bg-surface-container-lowest p-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {test.title}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {answeredCount}/{totalCount} answered
            </p>
          </div>

          {/* Group by section */}
          {test.sections.map((section) => {
            const sectionProblems = flatProblems.filter(
              (fp) => fp.sectionLabel === section.label
            );
            return (
              <div key={section.label} className="space-y-0.5">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-2">
                  {section.label}
                </p>
                {sectionProblems.map((fp) => {
                  const idx = flatProblems.indexOf(fp);
                  const isCurrent = idx === currentIndex;
                  const isAnswered = !!answers[fp.problem.id];
                  return (
                    <button
                      key={fp.problem.id}
                      onClick={() => setCurrentIndex(idx)}
                      disabled={timeUp}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                        isCurrent
                          ? "bg-primary-container/15 text-primary-brand font-medium"
                          : "text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {isAnswered ? (
                        <span className="material-symbols-outlined text-[14px] text-green-400">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[14px] text-outline-variant">radio_button_unchecked</span>
                      )}
                      <span className="truncate">{fp.problem.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {currentProblem && currentFlat && (
            <div className="max-w-4xl space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-on-surface-variant text-sm font-mono">
                  {currentIndex + 1}/{totalCount}
                </span>
                <h2 className="text-on-surface text-lg font-medium">{currentProblem.title}</h2>
                <span className={`text-xs font-medium capitalize ${diffColors[currentProblem.difficulty]}`}>
                  {currentProblem.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface-variant">
                  {currentFlat.sectionLabel}
                </span>
              </div>

              {/* Description */}
              <div className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">
                {currentProblem.description}
              </div>

              {/* Examples for DSA */}
              {currentProblem.type === "dsa" && currentProblem.examples?.length > 0 && (
                <div className="space-y-2">
                  {currentProblem.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-lg bg-surface-container-lowest font-mono text-xs space-y-1 text-on-surface-variant">
                      {ex.input && <p><span className="text-outline">Input:</span> {ex.input}</p>}
                      <p><span className="text-outline">Output:</span> {ex.output}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Aptitude MCQ */}
              {currentProblem.type === "aptitude" && (
                <div className="space-y-3">
                  {(currentProblem.options || []).map((opt, i) => {
                    const selected = answers[currentProblem.id] === opt;
                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                          selected
                            ? "bg-primary-container/15 text-primary-brand subtle-border"
                            : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                        } ${timeUp ? "pointer-events-none opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`mcq-${currentProblem.id}`}
                          value={opt}
                          checked={selected}
                          onChange={() => !timeUp && setAnswer(currentProblem.id, opt)}
                          disabled={timeUp}
                          className="accent-primary-brand"
                        />
                        <span className="text-sm">
                          {String.fromCharCode(65 + i)}. {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* DSA Code Editor */}
              {currentProblem.type === "dsa" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {(["python", "c", "cpp", "java"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLang(lang)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          selectedLang === lang
                            ? "bg-primary-container/20 text-primary-brand"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg overflow-hidden subtle-border h-80">
                    <Editor
                      height="100%"
                      language={monacoLangMap[selectedLang]}
                      value={answers[currentProblem.id] || currentProblem.starterCode?.[selectedLang] || ""}
                      onChange={(val) => setAnswer(currentProblem.id, val || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        readOnly: timeUp,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30"
                >
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  {currentIndex < flatProblems.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="px-4 py-2 rounded-lg text-sm text-primary-brand hover:underline"
                    >
                      Next
                    </button>
                  ) : (
                    !timeUp && (
                      <button
                        onClick={() => handleSubmit("submitted")}
                        disabled={submitting}
                        className="px-5 py-2 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : `Submit Test (${answeredCount}/${totalCount})`}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
