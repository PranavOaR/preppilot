"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProctorWrapper } from "@/components/proctor/ProctorWrapper";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/auth-context";
import { hasUserJoinedContest, submitContestAnswer } from "@/lib/db/contests";
import { getProblemById } from "@/lib/db/problems";
import {
  submitContestProblem,
  getContestUserSubmissions,
} from "@/lib/db/contest-submissions";
import { useContestRealtime } from "@/hooks/use-contest-realtime";
import { useContestStatus, computeContestStatus } from "@/hooks/use-contest-status";
import { ContestTimer } from "@/components/practice/contest-timer";
import { getAuth } from "firebase/auth";
import type { Problem } from "@/lib/types";

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

export default function ContestTakePage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const { user, profile } = useAuth();

  const { contest, loading: contestLoading } = useContestRealtime(contestId);
  const computedStatus = useContestStatus(contest);

  // Request fullscreen on mount (exam mode)
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {}); // ignore if denied
    }
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
  const [timeUp, setTimeUp] = useState(false);

  // DSA state
  const [code, setCode] = useState("");
  const [selectedLang, setSelectedLang] = useState<"python" | "c" | "cpp" | "java">("python");
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<{ passed: boolean; status: string; error?: string | null }[] | null>(null);
  const [runSummary, setRunSummary] = useState<{ total: number; passed: number } | null>(null);

  // MCQ state
  const [selectedOption, setSelectedOption] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  // Track submitted answers so MCQ selection remains visible after navigation
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({});
  const startTimeRef = useRef(Date.now());

  const currentProblem = problems[currentIndex] || null;

  // Auto-detect contest end via realtime status
  useEffect(() => {
    if (computedStatus === "completed" && !timeUp) {
      setTimeUp(true);
    }
  }, [computedStatus, timeUp]);

  const loadData = useCallback(async () => {
    if (!user || !contest) return;
    try {
      setProblemsLoading(true);

      // Check the user has joined
      const joined = await hasUserJoinedContest(contestId, user.uid);
      if (!joined) {
        router.replace(`/leaderboard/${contestId}`);
        return;
      }

      // Check contest is active — use synchronous compute to avoid null race
      if (computeContestStatus(contest) !== "active") {
        router.replace(`/leaderboard/${contestId}`);
        return;
      }

      // Load problems
      const problemResults = await Promise.all(
        (contest.problemIds || []).map((pid) => getProblemById(pid))
      );
      const validProblems = problemResults.filter(Boolean) as Problem[];
      setProblems(validProblems);

      // Load existing submissions (for resume)
      const existingSubs = await getContestUserSubmissions(contestId, user.uid);
      const submitted = new Set<string>();
      const correct = new Set<string>();
      for (const sub of existingSubs) {
        const s = sub as any;
        submitted.add(s.problemId);
        if (s.isCorrect) correct.add(s.problemId);
      }
      setSubmittedIds(submitted);
      setCorrectIds(correct);
    } catch (err) {
      console.error("Failed to load contest:", err);
    } finally {
      setProblemsLoading(false);
    }
  }, [contestId, user, contest, computedStatus, router]);

  useEffect(() => {
    if (contest && !contestLoading) {
      loadData();
    }
  }, [contest, contestLoading, loadData]);

  // Reset state when switching problems
  useEffect(() => {
    if (!currentProblem) return;
    if (currentProblem.type === "dsa") {
      // Restore saved code from localStorage if available
      const savedKey = `contest_code_${currentProblem.id}_${selectedLang}`;
      const savedCode = typeof window !== "undefined" ? localStorage.getItem(savedKey) : null;
      setCode(savedCode || currentProblem.starterCode?.[selectedLang] || "");
    }
    // Restore previously submitted MCQ answer (so it's visible on return)
    setSelectedOption(submittedAnswers[currentProblem.id] || "");
    setRunResults(null);
    setRunSummary(null);
    startTimeRef.current = Date.now();
  }, [currentIndex, currentProblem, selectedLang, submittedAnswers]);

  async function handleRunTests() {
    if (!currentProblem || !currentProblem.testCases) return;
    setRunning(true);
    setRunResults(null);
    setRunSummary(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          code,
          language: selectedLang,
          testCases: currentProblem.testCases,
          mode: "run",
        }),
      });
      const data = await res.json();
      if (data.error) {
        setRunResults([{ passed: false, status: "Error", error: data.error }]);
        setRunSummary({ total: 1, passed: 0 });
      } else if (data.results) {
        setRunResults(data.results);
        setRunSummary({ total: data.summary.total, passed: data.summary.passed });
      }
    } catch {
      setRunResults([{ passed: false, status: "Error", error: "Failed to connect to Judge0 execution service" }]);
      setRunSummary({ total: 1, passed: 0 });
    } finally {
      setRunning(false);
    }
  }

  function handleTimeUp() {
    setTimeUp(true);
  }

  async function handleSubmitProblem() {
    if (!user || !currentProblem || !contest) return;
    setSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      let isCorrect = false;
      let answer = "";

      if (currentProblem.type === "aptitude") {
        answer = selectedOption;
        isCorrect = selectedOption === currentProblem.correctAnswer;
      } else {
        // Run code against test cases via Judge0 using mode:"run" to avoid
        // burning the user's monthly submit quota for contest practice.
        answer = code;
        try {
          const idToken2 = await getAuth().currentUser?.getIdToken().catch(() => null);
          const res = await fetch("/api/submissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(idToken2 ? { Authorization: `Bearer ${idToken2}` } : {}),
            },
            body: JSON.stringify({
              code,
              language: selectedLang,
              testCases: currentProblem.testCases,
              mode: "run",
            }),
          });
          const data = await res.json();
          if (data.summary) {
            isCorrect = data.summary.allPassed === true;
          }
        } catch {
          // Judge0 unavailable — record submission as pending (isCorrect stays false)
          console.warn("Judge0 unavailable; contest DSA submission recorded as pending");
        }
      }

      await submitContestProblem({
        contestId,
        userId: user.uid,
        problemId: currentProblem.id,
        answer,
        isCorrect,
        timeTakenSeconds: timeTaken,
      });

      // Also update contest participant score
      await submitContestAnswer(contestId, user.uid, currentProblem.id, isCorrect, timeTaken);

      setSubmittedIds((prev) => new Set([...prev, currentProblem.id]));
      if (isCorrect) {
        setCorrectIds((prev) => new Set([...prev, currentProblem.id]));
      }
      // Remember what the user submitted (MCQ option or language)
      if (currentProblem.type === "aptitude") {
        setSubmittedAnswers((prev) => ({ ...prev, [currentProblem.id]: answer }));
      }

      // Move to next unsolved problem
      const nextUnsolved = problems.findIndex(
        (p, i) => i > currentIndex && !submittedIds.has(p.id) && p.id !== currentProblem.id
      );
      if (nextUnsolved !== -1) {
        setCurrentIndex(nextUnsolved);
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const loading = contestLoading || problemsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!contest || problems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-on-surface-variant">Contest not available.</p>
      </div>
    );
  }

  if (!contest.endTime?.seconds) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center space-y-3">
        <span className="material-symbols-outlined text-error text-5xl">error</span>
        <h2 className="text-on-surface text-lg font-medium">Contest configuration error</h2>
        <p className="text-on-surface-variant text-sm">This contest has no end time configured. Contact the organizer.</p>
      </div>
    );
  }

  const endTime = new Date(contest.endTime.seconds * 1000);

  return (
    <ProctorWrapper>
    {/* pt-[44px] offsets the fixed ContestTimer bar (57px nav + 44px timer = 101px total) */}
    <div className="pt-[44px]">
      <ContestTimer endTime={endTime} onTimeUp={handleTimeUp} />

      {timeUp && (
        <div className="bg-red-500/20 px-6 py-3 text-center text-red-400 text-sm font-medium">
          Time is up! Your submissions have been recorded.
          <button
            onClick={() => router.push(`/leaderboard/${contestId}`)}
            className="ml-3 underline hover:no-underline"
          >
            View Results
          </button>
        </div>
      )}

      {/* Mobile: horizontal scrollable problem tabs */}
      <div className="md:hidden border-b border-outline-variant/10 bg-surface-container-lowest px-3 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
          <span className="text-xs text-on-surface-variant shrink-0 mr-1">
            {correctIds.size}/{problems.length}
          </span>
          {problems.map((p, i) => {
            const isSolved = correctIds.has(p.id);
            const isSubmitted = submittedIds.has(p.id);
            const isCurrent = i === currentIndex;
            return (
              <button
                key={p.id}
                onClick={() => !timeUp && setCurrentIndex(i)}
                disabled={timeUp}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                  isCurrent
                    ? "bg-primary-container/20 text-primary-brand font-medium"
                    : "bg-surface-container text-on-surface-variant"
                } ${timeUp ? "opacity-50" : ""}`}
              >
                {isSolved ? (
                  <span className="material-symbols-outlined text-[12px] text-green-400">check_circle</span>
                ) : isSubmitted ? (
                  <span className="material-symbols-outlined text-[12px] text-red-400">cancel</span>
                ) : null}
                Q{i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-57px-44px)]">
        {/* Problem Sidebar — desktop only, shows numbers only (no titles for fairness) */}
        <div className="hidden md:block w-48 shrink-0 border-r border-outline-variant/10 bg-surface-container-lowest p-3 space-y-1">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Questions ({correctIds.size}/{problems.length})
          </p>
          {problems.map((p, i) => {
            const isSolved = correctIds.has(p.id);
            const isSubmitted = submittedIds.has(p.id);
            const isCurrent = i === currentIndex;
            return (
              <button
                key={p.id}
                onClick={() => !timeUp && setCurrentIndex(i)}
                disabled={timeUp}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  isCurrent
                    ? "bg-primary-container/15 text-primary-brand font-medium"
                    : "text-on-surface-variant hover:bg-surface-container"
                } ${timeUp ? "opacity-50" : ""}`}
              >
                {isSolved ? (
                  <span className="material-symbols-outlined text-[16px] text-green-400">check_circle</span>
                ) : isSubmitted ? (
                  <span className="material-symbols-outlined text-[16px] text-red-400">cancel</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px] text-outline-variant">radio_button_unchecked</span>
                )}
                <span>Question {i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-6 overflow-auto">
          {currentProblem && (
            <div className="max-w-4xl space-y-6">
              {/* Problem Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-on-surface-variant text-sm font-mono shrink-0">
                  {currentIndex + 1}/{problems.length}
                </span>
                <h2 className="text-on-surface text-base sm:text-lg font-medium min-w-0 break-words">{currentProblem.title}</h2>
                <span className={`text-xs font-medium capitalize shrink-0 ${diffColors[currentProblem.difficulty]}`}>
                  {currentProblem.difficulty}
                </span>
                <span className="text-on-surface-variant text-xs uppercase shrink-0">{currentProblem.type}</span>
                {submittedIds.has(currentProblem.id) && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    correctIds.has(currentProblem.id)
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {correctIds.has(currentProblem.id) ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">
                {currentProblem.description}
              </div>

              {/* Aptitude MCQ */}
              {currentProblem.type === "aptitude" && (
                <div className="space-y-3">
                  {(currentProblem.options || []).map((opt, i) => {
                    const label = String.fromCharCode(65 + i); // "A", "B", "C", "D"
                    const isSubmitted = submittedIds.has(currentProblem.id);
                    const isSelected = selectedOption === label;
                    const isCorrect = label === currentProblem.correctAnswer;
                    const showCorrect = isSubmitted && isCorrect;
                    const showWrong = isSubmitted && isSelected && !isCorrect;
                    return (
                      <label
                        key={i}
                        className={`flex items-start gap-3 px-3 sm:px-4 py-3 rounded-lg transition-colors ${
                          showCorrect
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : showWrong
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : isSelected
                            ? "bg-primary-container/15 text-primary-brand subtle-border"
                            : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                        } ${isSubmitted ? "pointer-events-none" : "cursor-pointer"}`}
                      >
                        <input
                          type="radio"
                          name="mcq"
                          value={label}
                          checked={isSelected}
                          onChange={() => setSelectedOption(label)}
                          disabled={isSubmitted}
                          className="accent-primary-brand mt-0.5 shrink-0"
                        />
                        <span className="text-sm flex-1">
                          {label}. {opt}
                        </span>
                        {showCorrect && <span className="material-symbols-outlined text-[16px] text-green-400">check_circle</span>}
                        {showWrong && <span className="material-symbols-outlined text-[16px] text-red-400">cancel</span>}
                      </label>
                    );
                  })}
                  {/* Post-submission verdict */}
                  {submittedIds.has(currentProblem.id) && (
                    <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                      correctIds.has(currentProblem.id)
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {correctIds.has(currentProblem.id)
                        ? "✓ Correct! Well done."
                        : `✗ Incorrect. You selected Option ${submittedAnswers[currentProblem.id] || selectedOption}. Correct answer: Option ${currentProblem.correctAnswer}.`}
                    </div>
                  )}
                </div>
              )}

              {/* DSA Code Editor */}
              {currentProblem.type === "dsa" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["python", "c", "cpp", "java"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setSelectedLang(lang);
                          const savedKey = `contest_code_${currentProblem.id}_${lang}`;
                          const saved = localStorage.getItem(savedKey);
                          setCode(saved || currentProblem.starterCode?.[lang] || "");
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          selectedLang === lang
                            ? "bg-primary-container/20 text-primary-brand"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const starter = currentProblem.starterCode?.[selectedLang] || "";
                        setCode(starter);
                        localStorage.removeItem(`contest_code_${currentProblem.id}_${selectedLang}`);
                      }}
                      className="ml-auto px-3 py-1.5 rounded text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                      title="Reset to starter code"
                    >
                      <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                      Reset
                    </button>
                  </div>
                  <div className="rounded-lg overflow-hidden subtle-border h-48 sm:h-72">
                    <Editor
                      height="100%"
                      language={monacoLangMap[selectedLang]}
                      value={code}
                      onChange={(val) => {
                        const v = val || "";
                        setCode(v);
                        if (currentProblem) {
                          localStorage.setItem(`contest_code_${currentProblem.id}_${selectedLang}`, v);
                        }
                      }}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        readOnly: submittedIds.has(currentProblem.id),
                      }}
                    />
                  </div>
                  {/* Run Results */}
                  {runResults && runSummary && (
                    <div className="rounded-lg bg-surface-container-lowest subtle-border p-3 space-y-2">
                      <p className="text-xs font-medium text-on-surface-variant">
                        Sample Tests: <span className={runSummary.passed === runSummary.total ? "text-green-400" : "text-red-400"}>{runSummary.passed}/{runSummary.total} passed</span>
                      </p>
                      {runResults.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`material-symbols-outlined text-[14px] ${r.passed ? "text-green-400" : "text-red-400"}`}>
                            {r.passed ? "check_circle" : "cancel"}
                          </span>
                          <span className="text-on-surface-variant">Test {i + 1}: {r.status}</span>
                          {r.error && <span className="text-red-400 break-words">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!submittedIds.has(currentProblem.id) && !timeUp && (
                <div className="flex flex-wrap items-center gap-3">
                  {currentProblem.type === "dsa" && (
                    <button
                      onClick={handleRunTests}
                      disabled={running || submitting || !code.trim()}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50 subtle-border flex items-center gap-2"
                    >
                      {running ? (
                        <>
                          <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                          Running...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                          Run Tests
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleSubmitProblem}
                    disabled={
                      submitting ||
                      running ||
                      (currentProblem.type === "aptitude" && !selectedOption) ||
                      (currentProblem.type === "dsa" && !code.trim())
                    }
                    className="px-6 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                        {currentProblem.type === "dsa" ? "Evaluating..." : "Submitting..."}
                      </>
                    ) : "Submit Answer"}
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-outline-variant/10">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="px-3 sm:px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <span className="text-xs text-on-surface-variant">{currentIndex + 1} of {problems.length}</span>
                {currentIndex < problems.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-3 sm:px-4 py-2 rounded-lg text-sm text-primary-brand hover:underline transition-colors flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next Problem</span>
                    <span className="sm:hidden">Next</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/leaderboard/${contestId}`)}
                    className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
                  >
                    <span className="hidden sm:inline">View Leaderboard</span>
                    <span className="sm:hidden">Leaderboard</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProctorWrapper>
  );
}
