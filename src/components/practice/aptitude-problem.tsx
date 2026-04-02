"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/lib/types";
import { getProblems } from "@/lib/db/problems";
import { recordSolve } from "@/lib/db/record-solve";
import { useAuth } from "@/contexts/auth-context";
import { HintPanel } from "@/components/practice/hint-panel";

const optionLabels = ["A", "B", "C", "D"];

interface AptitudeProblemProps {
  problem: Problem;
}

export function AptitudeProblem({ problem }: AptitudeProblemProps) {
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);

  const options = problem.options || [];
  const correctAnswer = problem.correctAnswer || "";
  const explanation = problem.examples?.[0]?.explanation || "";

  // Extract just the question text (before the **Options:** line)
  const questionText = problem.description.split("\n\n**Options:**")[0];

  function handleSelect(label: string) {
    if (result) return; // Already answered
    setSelected(label);
    setShowConfirm(false);
  }

  function handleSubmit() {
    if (!selected) return;
    setShowConfirm(true);
  }

  async function handleConfirm() {
    if (!selected) return;
    const isCorrect = selected === correctAnswer;
    setResult(isCorrect ? "correct" : "wrong");
    setShowConfirm(false);

    // Record the solve in Firestore
    if (user) {
      try {
        const solveResult = await recordSolve({
          userId: user.uid,
          problemId: problem.id,
          problemTitle: problem.title,
          problemSlug: problem.slug,
          problemTopic: problem.topic,
          problemDifficulty: problem.difficulty,
          problemXpReward: problem.xpReward,
          language: "aptitude",
          passed: isCorrect,
        });
        if (isCorrect) {
          setEarnedXP(solveResult.xp);
        }
        refreshProfile();
      } catch (err) {
        console.error("Failed to record aptitude solve:", err);
      }
    }

    // Prefetch a next problem
    getProblems({ type: "aptitude", topic: problem.topic, pageSize: 50 }).then((res) => {
      const others = res.problems.filter((p) => p.slug !== problem.slug);
      if (others.length > 0) {
        const random = others[Math.floor(Math.random() * others.length)];
        setNextSlug(random.slug);
      }
    });
  }

  function handleCancel() {
    setShowConfirm(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Question */}
      <div className="rounded-lg bg-surface-container-low p-6 subtle-border space-y-4">
        <div className="flex items-center gap-2 text-outline text-xs uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">quiz</span>
          <span>Multiple Choice Question</span>
        </div>
        <p className="text-on-surface text-lg leading-relaxed">
          {questionText}
        </p>
      </div>

      {/* AI Hints */}
      {!result && <HintPanel problemId={problem.id} />}

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, i) => {
          const label = optionLabels[i];
          const isSelected = selected === label;
          const isCorrect = label === correctAnswer;
          const showAsCorrect = result && isCorrect;
          const showAsWrong = result === "wrong" && isSelected && !isCorrect;

          let borderClass = "border-outline-variant/20 hover:border-outline-variant/50";
          let bgClass = "bg-surface-container-low hover:bg-surface-container";
          let iconClass = "text-outline";
          let icon = "radio_button_unchecked";

          if (isSelected && !result) {
            borderClass = "border-primary-brand/60";
            bgClass = "bg-primary-container/10";
            iconClass = "text-primary-brand";
            icon = "radio_button_checked";
          }

          if (showAsCorrect) {
            borderClass = "border-green-400/60";
            bgClass = "bg-green-400/10";
            iconClass = "text-green-400";
            icon = "check_circle";
          }

          if (showAsWrong) {
            borderClass = "border-error/60";
            bgClass = "bg-error/10";
            iconClass = "text-error";
            icon = "cancel";
          }

          return (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              disabled={!!result}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border ${borderClass} ${bgClass} transition-all cursor-pointer disabled:cursor-default`}
            >
              <span className={`material-symbols-outlined text-[22px] ${iconClass}`}>
                {icon}
              </span>
              <span className="flex items-center gap-3 flex-1 text-left">
                <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-sm font-medium shrink-0">
                  {label}
                </span>
                <span className="text-on-surface text-sm">{option}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="rounded-lg bg-surface-container p-5 subtle-border space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-yellow-400 text-[24px]">help</span>
            <div>
              <p className="text-on-surface text-sm font-medium">
                Confirm your answer?
              </p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                You selected option <span className="font-medium text-primary-brand">{selected}</span>. This cannot be changed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-on-surface-variant hover:text-on-surface text-sm h-9 cursor-pointer"
            >
              Go Back
            </Button>
            <Button
              onClick={handleConfirm}
              className="gradient-primary text-on-primary font-medium px-5 h-9 hover:opacity-90 transition-opacity text-sm cursor-pointer"
            >
              Confirm Answer
            </Button>
          </div>
        </div>
      )}

      {/* Submit Button (before answering) */}
      {!result && !showConfirm && (
        <Button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full h-12 gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answer
        </Button>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Verdict */}
          <div
            className={`rounded-lg p-5 border ${
              result === "correct"
                ? "bg-green-400/5 border-green-400/30"
                : "bg-error/5 border-error/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[32px] ${
                  result === "correct" ? "text-green-400" : "text-error"
                }`}
              >
                {result === "correct" ? "celebration" : "close"}
              </span>
              <div>
                <p
                  className={`text-lg font-medium ${
                    result === "correct" ? "text-green-400" : "text-error"
                  }`}
                >
                  {result === "correct" ? "Correct!" : "Incorrect"}
                </p>
                <p className="text-on-surface-variant text-sm">
                  {result === "correct"
                    ? `Great job! You earned ${earnedXP ?? problem.xpReward} XP.`
                    : `The correct answer is ${correctAnswer}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="rounded-lg bg-surface-container-low p-5 subtle-border space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-brand text-[20px]">lightbulb</span>
              <h4 className="text-on-surface text-sm font-medium">Solution & Explanation</h4>
            </div>
            <div className="text-on-surface-variant text-sm leading-relaxed pl-7">
              <p className="mb-2">
                <span className="text-on-surface font-medium">Answer: </span>
                <span className="text-primary-brand font-medium">Option {correctAnswer}</span>
                {" — "}
                {options[optionLabels.indexOf(correctAnswer)]}
              </p>
              <p>{explanation}</p>
            </div>
          </div>

          {/* Shortcut: Next Problem */}
          <div className="flex items-center gap-3">
            <Link href="/practice?type=aptitude" className="flex-1">
              <Button
                variant="outline"
                className="w-full h-11 bg-surface-container-low border-outline-variant/20 text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">list</span>
                All Aptitude Problems
              </Button>
            </Link>
            {nextSlug && (
              <Link href={`/practice/${nextSlug}`} className="flex-1">
                <Button className="w-full h-11 gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity cursor-pointer">
                  Next Problem
                  <span className="material-symbols-outlined text-[18px] ml-2">arrow_forward</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Company Tags */}
          {problem.companies.length > 0 && (
            <div className="pt-2">
              <p className="text-outline text-xs mb-2">Frequently asked by:</p>
              <div className="flex flex-wrap gap-2">
                {problem.companies.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-1 rounded text-xs bg-primary-container/20 text-primary-brand"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
