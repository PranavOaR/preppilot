"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getProblemBySlug } from "@/lib/db/problems";
import { Button } from "@/components/ui/button";
import { AptitudeProblem } from "@/components/practice/aptitude-problem";
import { TestResults } from "@/components/practice/test-results";
import { LANGUAGE_LABELS } from "@/lib/judge/languages";
import { recordSolve } from "@/lib/db/record-solve";
import { useAuth } from "@/contexts/auth-context";
import { HintPanel } from "@/components/practice/hint-panel";
import { CodeReviewPanel } from "@/components/practice/code-review-panel";
import type { Problem } from "@/lib/types";
import type { TestCaseResult } from "@/lib/judge/client";
import { PLAN_LIMITS } from "@/lib/types/plans";
import { checkAndIncrementUsage } from "@/lib/plans/usage";
import { getAuth } from "firebase/auth";
import Link from "next/link";

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-surface-container-lowest">
      <span className="material-symbols-outlined text-outline text-3xl animate-spin">
        progress_activity
      </span>
    </div>
  ),
});

const difficultyStyles: Record<string, string> = {
  easy: "bg-green-400/10 text-green-400",
  medium: "bg-yellow-400/10 text-yellow-400",
  hard: "bg-error-container/30 text-error-brand",
};

const monacoLangMap: Record<string, string> = {
  python: "python",
  c: "c",
  cpp: "cpp",
  java: "java",
};

function getUsageColor(used: number, limit: number): string {
  if (limit === 0) return "text-outline";
  const remaining = limit - used;
  if (remaining <= 2) return "text-error";
  if (remaining / limit <= 0.5) return "text-yellow-400";
  return "text-green-400";
}

export default function ProblemPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, profile, refreshProfile } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<"python" | "c" | "cpp" | "java">("python");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<TestCaseResult[] | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    allPassed: boolean;
    mode: "run" | "submit";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "results">("editor");
  const [mobilePanelTab, setMobilePanelTab] = useState<"description" | "code">("description");
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [runCooldown, setRunCooldown] = useState(0); // seconds remaining in cooldown
  const lastRunCodeRef = useRef<string>(""); // code that was last run
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastSubmit, setLastSubmit] = useState<{
    code: string;
    language: "python" | "c" | "cpp" | "java";
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const p = await getProblemBySlug(slug);
        setProblem(p);
        if (p) {
          // Restore saved code from localStorage, fall back to starter code
          const saved = localStorage.getItem(`practice_code_${slug}_python`);
          setCode(saved || p.starterCode["python"] || "");
        }
      } catch (err) {
        console.error("Failed to fetch problem:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [slug]);

  const handleLanguageChange = useCallback(
    (lang: "python" | "c" | "cpp" | "java") => {
      setSelectedLang(lang);
      if (problem) {
        const saved = localStorage.getItem(`practice_code_${slug}_${lang}`);
        setCode(saved || problem.starterCode[lang] || "");
      }
    },
    [problem, slug]
  );

  const handleResetCode = useCallback(() => {
    if (!problem) return;
    localStorage.removeItem(`practice_code_${slug}_${selectedLang}`);
    setCode(problem.starterCode[selectedLang] || "");
  }, [problem, slug, selectedLang]);

  async function handleRun() {
    if (!problem) return;

    // Client-side quota check (runs with authenticated Firestore context)
    if (user) {
      const check = await checkAndIncrementUsage(user.uid, "dsaRun");
      if (!check.allowed) {
        setActiveTab("results");
        setResults([{
          input: "", expectedOutput: "", actualOutput: "",
          passed: false, status: "Quota Reached", time: null, memory: null,
          error: `You've used all ${check.limit} runs this month on your ${check.plan} plan. Upgrade for more.`,
        }]);
        setSummary({ total: 1, passed: 0, allPassed: false, mode: "run" });
        return;
      }
    }

    setRunning(true);
    setActiveTab("results");
    setResults(null);
    setSummary(null);

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
          testCases: problem.testCases,
          mode: "run",
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResults([
          {
            input: "",
            expectedOutput: "",
            actualOutput: "",
            passed: false,
            status: "Error",
            time: null,
            memory: null,
            error: data.error,
          },
        ]);
        setSummary({ total: 1, passed: 0, allPassed: false, mode: "run" });
      } else {
        setResults(data.results);
        setSummary(data.summary);
      }
    } catch (err) {
      setResults([
        {
          input: "",
          expectedOutput: "",
          actualOutput: "",
          passed: false,
          status: "Error",
          time: null,
          memory: null,
          error: err instanceof Error ? err.message : "Failed to connect",
        },
      ]);
      setSummary({ total: 1, passed: 0, allPassed: false, mode: "run" });
    } finally {
      setRunning(false);
      // Start 15-second cooldown (unlocks immediately if code changes)
      lastRunCodeRef.current = code;
      setRunCooldown(15);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = setInterval(() => {
        setRunCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      // Refresh usage counts after a run
      if (user) refreshProfile();
    }
  }

  // Cancel cooldown if code changes
  useEffect(() => {
    if (runCooldown > 0 && code !== lastRunCodeRef.current) {
      setRunCooldown(0);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    }
  }, [code, runCooldown]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current); };
  }, []);

  async function handleSubmit() {
    if (!problem) return;

    // Client-side quota check
    if (user) {
      const check = await checkAndIncrementUsage(user.uid, "dsaSubmit");
      if (!check.allowed) {
        setActiveTab("results");
        setResults([{
          input: "", expectedOutput: "", actualOutput: "",
          passed: false, status: "Quota Reached", time: null, memory: null,
          error: `You've used all ${check.limit} submits this month on your ${check.plan} plan. Upgrade for more.`,
        }]);
        setSummary({ total: 1, passed: 0, allPassed: false, mode: "submit" });
        return;
      }
    }

    setSubmitting(true);
    setActiveTab("results");
    setResults(null);
    setSummary(null);

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
          testCases: problem.testCases,
          mode: "submit",
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResults([
          {
            input: "",
            expectedOutput: "",
            actualOutput: "",
            passed: false,
            status: "Error",
            time: null,
            memory: null,
            error: data.error,
          },
        ]);
        setSummary({ total: 1, passed: 0, allPassed: false, mode: "submit" });
      } else {
        setResults(data.results);
        setSummary(data.summary);

        // Track last submit for code review
        setLastSubmit({ code, language: selectedLang, passed: data.summary.allPassed });

        // Record the submission in Firestore
        if (user) {
          try {
            await recordSolve({
              userId: user.uid,
              problemId: problem.id,
              problemTitle: problem.title,
              problemSlug: problem.slug,
              problemTopic: problem.topic,
              problemDifficulty: problem.difficulty,
              problemXpReward: problem.xpReward,
              language: selectedLang,
              passed: data.summary.allPassed,
            });
            refreshProfile();
          } catch (recordErr) {
            console.error("Failed to record submission:", recordErr);
          }
        }
      }
    } catch (err) {
      setResults([
        {
          input: "",
          expectedOutput: "",
          actualOutput: "",
          passed: false,
          status: "Error",
          time: null,
          memory: null,
          error: err instanceof Error ? err.message : "Failed to connect",
        },
      ]);
      setSummary({ total: 1, passed: 0, allPassed: false, mode: "submit" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  if (!problem) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-outline text-5xl">error</span>
          <h2 className="text-on-surface text-xl mt-4">Problem not found</h2>
          <Link href="/practice" className="text-primary-brand text-sm mt-2 inline-block hover:underline">
            Back to Practice
          </Link>
        </div>
      </main>
    );
  }

  // ─── Aptitude MCQ Layout ───
  if (problem.type === "aptitude") {
    return (
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/practice"
            className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-on-surface text-xl font-medium">{problem.title}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${difficultyStyles[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-tertiary-container/30 text-tertiary capitalize">
              {problem.topic.replace(/-/g, " ")}
            </span>
            <span className="text-outline text-xs">{problem.xpReward} XP</span>
          </div>
        </div>
        <AptitudeProblem problem={problem} />
      </main>
    );
  }

  // ─── DSA Code Editor Layout ───
  return (
    <main className="max-w-[1400px] mx-auto px-2 sm:px-4 py-3 sm:py-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-3 sm:mb-4 px-2 sm:px-0">
        <Link
          href="/practice"
          className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h1 className="text-on-surface text-base sm:text-lg font-medium truncate">{problem.title}</h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize shrink-0 ${difficultyStyles[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="text-outline text-xs shrink-0">{problem.xpReward} XP</span>
        </div>
      </div>

      {/* Mobile Panel Switcher */}
      <div className="flex lg:hidden items-center gap-1 mb-2 px-2 sm:px-0">
        <button
          onClick={() => setMobilePanelTab("description")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobilePanelTab === "description"
              ? "bg-surface-container-high text-on-surface"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Description
        </button>
        <button
          onClick={() => setMobilePanelTab("code")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobilePanelTab === "code"
              ? "bg-surface-container-high text-on-surface"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Code Editor
        </button>
      </div>

      {/* Split Layout */}
      <div className="rounded-lg bg-surface-container subtle-border overflow-hidden">
        <div className="lg:grid lg:grid-cols-2" style={{ minHeight: "calc(100vh - 140px)" }}>
          {/* Left: Problem Description */}
          <div
            className={`p-4 sm:p-6 space-y-5 border-r border-outline-variant/10 overflow-y-auto ${mobilePanelTab === "description" ? "block" : "hidden lg:block"}`}
            style={{ maxHeight: "calc(100vh - 140px)" }}
          >
            <div className="space-y-3">
              <h4 className="text-on-surface text-sm font-medium uppercase tracking-wider">
                Problem Description
              </h4>
              <div className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>
            </div>

            {problem.examples.map((ex, i) => (
              <div key={i} className="space-y-2 p-4 rounded-lg bg-surface-container-lowest">
                <p className="text-on-surface text-sm font-medium">Example {i + 1}:</p>
                <div className="font-mono text-xs space-y-1 text-on-surface-variant">
                  {ex.input && (
                    <p>
                      <span className="text-outline">Input:</span> {ex.input}
                    </p>
                  )}
                  <p>
                    <span className="text-outline">Output:</span> {ex.output}
                  </p>
                  {ex.explanation && (
                    <p>
                      <span className="text-outline">Explanation:</span> {ex.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {problem.constraints.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-on-surface text-sm font-medium">Constraints:</h5>
                <ul className="space-y-1 text-on-surface-variant text-xs font-mono">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>&bull; {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {problem.companies.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-on-surface text-sm font-medium">Asked by:</h5>
                <div className="flex flex-wrap gap-2">
                  {problem.companies.map((c) => (
                    <span key={c} className="px-2 py-1 rounded text-xs bg-primary-container/20 text-primary-brand">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <HintPanel problem={problem} />

            {/* Resources Panel */}
            <div className="space-y-2">
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {resourcesOpen ? "expand_less" : "library_books"}
                </span>
                <span>Resources</span>
                {problem.resources && problem.resources.length > 0 && (
                  <span className="text-xs text-primary-brand">
                    ({problem.resources.length})
                  </span>
                )}
              </button>
              {resourcesOpen && (
                <div className="rounded-lg bg-surface-container-low subtle-border p-4 space-y-3">
                  {!problem.resources || problem.resources.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">
                      No resources added yet for this problem.
                    </p>
                  ) : (
                    (() => {
                      const videos = problem.resources.filter((r) => r.type === "video");
                      const articles = problem.resources.filter((r) => r.type === "article");
                      const similar = problem.resources.filter((r) => r.type === "similar");
                      return (
                        <>
                          {videos.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Videos</p>
                              {videos.map((r, i) => (
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-brand hover:underline">
                                  <span className="material-symbols-outlined text-[14px]">play_circle</span>
                                  {r.title}
                                  <span className="material-symbols-outlined text-[12px] text-outline">open_in_new</span>
                                </a>
                              ))}
                            </div>
                          )}
                          {articles.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Articles</p>
                              {articles.map((r, i) => (
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-brand hover:underline">
                                  <span className="material-symbols-outlined text-[14px]">article</span>
                                  {r.title}
                                  <span className="material-symbols-outlined text-[12px] text-outline">open_in_new</span>
                                </a>
                              ))}
                            </div>
                          )}
                          {similar.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Similar Problems</p>
                              {similar.map((r, i) => (
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-brand hover:underline">
                                  <span className="material-symbols-outlined text-[14px]">link</span>
                                  {r.title}
                                  <span className="material-symbols-outlined text-[12px] text-outline">open_in_new</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Editor + Results */}
          <div
            className={`flex flex-col ${mobilePanelTab === "code" ? "block" : "hidden lg:flex"}`}
            style={{ maxHeight: "calc(100vh - 140px)" }}
          >
            {/* Language Tabs */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-b border-outline-variant/10 shrink-0">
              <div className="flex items-center gap-1">
                {(Object.keys(LANGUAGE_LABELS) as Array<"python" | "c" | "cpp" | "java">).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                      selectedLang === lang
                        ? "bg-surface-container-high text-on-surface"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleResetCode}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-on-surface-variant hover:text-error transition-colors"
                title="Reset to starter code"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset
              </button>
            </div>

            {/* Editor / Results Toggle */}
            <div className="flex items-center gap-1 px-4 py-1.5 bg-surface-container-lowest border-b border-outline-variant/10 shrink-0">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-surface-container-high text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "results"
                    ? "bg-surface-container-high text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Test Results
                {summary && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      summary.allPassed ? "bg-green-400" : "bg-error"
                    }`}
                  />
                )}
              </button>
            </div>

            {/* Code Editor */}
            {activeTab === "editor" && (
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language={monacoLangMap[selectedLang]}
                  value={code}
                  onChange={(value) => {
                    const v = value || "";
                    setCode(v);
                    localStorage.setItem(`practice_code_${slug}_${selectedLang}`, v);
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 4,
                    padding: { top: 12 },
                    renderLineHighlight: "line",
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                  }}
                />
              </div>
            )}

            {/* Test Results */}
            {activeTab === "results" && (
              <div className="flex-1 overflow-y-auto p-4">
                {running || submitting ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="material-symbols-outlined text-primary-brand text-4xl animate-spin">
                      progress_activity
                    </span>
                    <p className="text-on-surface-variant text-sm">
                      {running ? "Running test cases..." : "Submitting solution..."}
                    </p>
                  </div>
                ) : results && summary ? (
                  <>
                    <TestResults results={results} summary={summary} />
                    {summary.mode === "submit" && lastSubmit && problem && (
                      <CodeReviewPanel
                        problemId={problem.id}
                        code={lastSubmit.code}
                        language={lastSubmit.language}
                        passed={lastSubmit.passed}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <span className="material-symbols-outlined text-outline text-4xl">
                      play_circle
                    </span>
                    <p className="text-on-surface-variant text-sm">
                      Click &quot;Run Tests&quot; to test against sample cases
                      <br />
                      or &quot;Submit&quot; to run all test cases.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="px-4 py-3 bg-surface-container border-t border-outline-variant/10 shrink-0 space-y-2">
              {/* Usage indicators */}
              {profile && (() => {
                const plan = profile.plan || "free";
                const limits = PLAN_LIMITS[plan];
                const usage = profile.usageThisMonth;
                const runsUsed = usage?.dsaRuns ?? 0;
                const submitsUsed = usage?.dsaSubmits ?? 0;
                const runsLeft = limits.dsaRuns - runsUsed;
                const submitsLeft = limits.dsaSubmits - submitsUsed;
                return (
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className={getUsageColor(runsUsed, limits.dsaRuns)}>
                      {runsLeft <= 0 ? (
                        <Link href="/pricing" className="underline">Out of runs — Upgrade →</Link>
                      ) : (
                        `Runs: ${runsLeft} left`
                      )}
                    </span>
                    <span className={getUsageColor(submitsUsed, limits.dsaSubmits)}>
                      {submitsLeft <= 0 ? (
                        <Link href="/pricing" className="underline">Out of submits — Upgrade →</Link>
                      ) : (
                        `Submits: ${submitsLeft} left`
                      )}
                    </span>
                  </div>
                );
              })()}
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={handleRun}
                  disabled={running || submitting || !code.trim() || runCooldown > 0}
                  title={runCooldown > 0 ? `Edit code to run again, or wait ${runCooldown}s` : undefined}
                  className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-sm h-9 cursor-pointer disabled:opacity-40"
                >
                  {running ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] mr-1 animate-spin">progress_activity</span>
                      Running...
                    </>
                  ) : runCooldown > 0 ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] mr-1">timer</span>
                      {runCooldown}s
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] mr-1">play_arrow</span>
                      Run Tests
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={running || submitting || !code.trim()}
                  className="gradient-primary text-on-primary font-medium px-5 h-9 hover:opacity-90 transition-opacity text-sm cursor-pointer disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] mr-1 animate-spin">progress_activity</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] mr-1">upload</span>
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
