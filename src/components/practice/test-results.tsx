"use client";

import type { TestCaseResult } from "@/lib/judge/client";

interface TestResultsProps {
  results: TestCaseResult[];
  summary: {
    total: number;
    passed: number;
    allPassed: boolean;
    mode: "run" | "submit";
  };
}

export function TestResults({ results, summary }: TestResultsProps) {
  return (
    <div className="space-y-3">
      {/* Summary Bar */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
          summary.allPassed
            ? "bg-green-400/10 border border-green-400/30"
            : "bg-error/10 border border-error/30"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${
            summary.allPassed ? "text-green-400" : "text-error"
          }`}
        >
          {summary.allPassed ? "check_circle" : "error"}
        </span>
        <div>
          <p
            className={`text-sm font-medium ${
              summary.allPassed ? "text-green-400" : "text-error"
            }`}
          >
            {summary.allPassed
              ? summary.mode === "submit"
                ? "All Test Cases Passed!"
                : "Sample Tests Passed!"
              : `${summary.passed}/${summary.total} Test Cases Passed`}
          </p>
          {summary.mode === "run" && summary.allPassed && (
            <p className="text-on-surface-variant text-xs mt-0.5">
              Submit to run against all test cases including hidden ones.
            </p>
          )}
        </div>
      </div>

      {/* Individual Results */}
      <div className="space-y-2">
        {results.map((result, i) => (
          <div
            key={i}
            className={`rounded-lg border overflow-hidden ${
              result.passed
                ? "border-green-400/20"
                : "border-error/20"
            }`}
          >
            {/* Test Case Header */}
            <div
              className={`flex items-center justify-between px-4 py-2 ${
                result.passed
                  ? "bg-green-400/5"
                  : "bg-error/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    result.passed ? "text-green-400" : "text-error"
                  }`}
                >
                  {result.passed ? "check_circle" : "cancel"}
                </span>
                <span className="text-on-surface text-sm font-medium">
                  Test Case {i + 1}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    result.passed
                      ? "bg-green-400/10 text-green-400"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {result.status}
                </span>
              </div>
              {result.time && (
                <span className="text-outline text-xs font-mono">
                  {result.time}s · {result.memory ? `${(result.memory / 1024).toFixed(1)}MB` : "—"}
                </span>
              )}
            </div>

            {/* Test Case Details */}
            <div className="px-4 py-3 space-y-2 bg-surface-container-lowest">
              {result.input && (
                <div>
                  <p className="text-outline text-xs mb-1">Input:</p>
                  <pre className="text-on-surface-variant text-xs font-mono bg-surface-container rounded px-3 py-2 overflow-x-auto">
                    {result.input}
                  </pre>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-outline text-xs mb-1">Expected Output:</p>
                  <pre className="text-on-surface-variant text-xs font-mono bg-surface-container rounded px-3 py-2 overflow-x-auto">
                    {result.expectedOutput}
                  </pre>
                </div>
                <div>
                  <p className="text-outline text-xs mb-1">Your Output:</p>
                  <pre
                    className={`text-xs font-mono rounded px-3 py-2 overflow-x-auto ${
                      result.passed
                        ? "text-green-400 bg-green-400/5"
                        : "text-error bg-error/5"
                    }`}
                  >
                    {result.actualOutput || "(no output)"}
                  </pre>
                </div>
              </div>
              {result.error && (
                <div>
                  <p className="text-error text-xs mb-1">Error:</p>
                  <pre className="text-error/80 text-xs font-mono bg-error/5 rounded px-3 py-2 overflow-x-auto whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
