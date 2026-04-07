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

// ── Topic formulas reference ──────────────────────────────────────────────────
const TOPIC_FORMULAS: Record<string, { label: string; formula: string }[]> = {
  percentages: [
    { label: "x% of N", formula: "(x / 100) × N" },
    { label: "Percentage change", formula: "(Change / Original) × 100" },
    { label: "After x% increase", formula: "Original × (1 + x/100)" },
    { label: "After x% decrease", formula: "Original × (1 − x/100)" },
  ],
  "profit-and-loss": [
    { label: "Profit", formula: "SP − CP" },
    { label: "Loss", formula: "CP − SP" },
    { label: "Profit %", formula: "(Profit / CP) × 100" },
    { label: "SP (given Profit%)", formula: "CP × (100 + P%) / 100" },
    { label: "CP (given SP & Profit%)", formula: "SP × 100 / (100 + P%)" },
  ],
  average: [
    { label: "Average", formula: "Sum of values / Count" },
    { label: "New average (add x)", formula: "(Old Sum + x) / (n + 1)" },
    { label: "Weighted average", formula: "Σ(wᵢ × xᵢ) / Σwᵢ" },
  ],
  "ratio-and-proportion": [
    { label: "Proportion", formula: "a/b = c/d  ⟹  ad = bc" },
    { label: "Mean proportional of a, b", formula: "√(a × b)" },
    { label: "Third proportional to a, b", formula: "b² / a" },
  ],
  "time-and-work": [
    { label: "Work done in 1 day (takes n days)", formula: "1/n" },
    { label: "Combined rate A + B", formula: "1/a + 1/b" },
    { label: "Time for A + B together", formula: "ab / (a + b)" },
    { label: "Efficiency ratio", formula: "Inversely proportional to time" },
  ],
  "time-speed-distance": [
    { label: "Speed", formula: "Distance / Time" },
    { label: "Average speed (equal distances)", formula: "2S₁S₂ / (S₁ + S₂)" },
    { label: "Relative speed (same direction)", formula: "S₁ − S₂" },
    { label: "Relative speed (opposite)", formula: "S₁ + S₂" },
    { label: "km/h to m/s", formula: "× 5/18" },
  ],
  "mixture-and-alligation": [
    { label: "Alligation rule", formula: "(Cheaper price − Mean) : (Mean − Dearer price)" },
    { label: "Amount remaining after n replacements", formula: "Q × (1 − x/V)ⁿ" },
  ],
  "pipes-and-cisterns": [
    { label: "Pipe A fills in a hours", formula: "Rate = 1/a" },
    { label: "A fills, B empties", formula: "Net rate = 1/a − 1/b" },
    { label: "Time to fill/empty", formula: "1 / (net rate)" },
  ],
  numbers: [
    { label: "Sum of 1 to n", formula: "n(n + 1) / 2" },
    { label: "Sum of first n odd numbers", formula: "n²" },
    { label: "Sum of first n even numbers", formula: "n(n + 1)" },
    { label: "Divisible by 3 / 9", formula: "Sum of digits divisible by 3 / 9" },
    { label: "Divisible by 11", formula: "(Sum of odd-position digits) − (Sum of even-position digits) = 0 or 11" },
  ],
  algebra: [
    { label: "(a + b)²", formula: "a² + 2ab + b²" },
    { label: "(a − b)²", formula: "a² − 2ab + b²" },
    { label: "a² − b²", formula: "(a + b)(a − b)" },
    { label: "Quadratic roots", formula: "x = (−b ± √(b² − 4ac)) / 2a" },
  ],
  probability: [
    { label: "Probability of event E", formula: "P(E) = Favourable outcomes / Total outcomes" },
    { label: "P(A or B)", formula: "P(A) + P(B) − P(A ∩ B)" },
    { label: "P(A and B) — independent", formula: "P(A) × P(B)" },
    { label: "Complement", formula: "P(A′) = 1 − P(A)" },
  ],
  "permutation-and-combination": [
    { label: "Permutation nPr", formula: "n! / (n − r)!" },
    { label: "Combination nCr", formula: "n! / [r! × (n − r)!]" },
    { label: "Circular arrangements", formula: "(n − 1)!" },
    { label: "With repetition (r from n)", formula: "nʳ" },
  ],
  geometry: [
    { label: "Circle area / circumference", formula: "πr²  /  2πr" },
    { label: "Triangle area", formula: "½ × base × height" },
    { label: "Pythagoras theorem", formula: "a² + b² = c²" },
    { label: "Rectangle area / perimeter", formula: "l × b  /  2(l + b)" },
    { label: "Heron's formula", formula: "√[s(s−a)(s−b)(s−c)], s = (a+b+c)/2" },
  ],
  "trigonometry-height-distance": [
    { label: "sin θ", formula: "Opposite / Hypotenuse" },
    { label: "cos θ", formula: "Adjacent / Hypotenuse" },
    { label: "tan θ", formula: "Opposite / Adjacent = sin θ / cos θ" },
    { label: "Height (angle of elevation α)", formula: "h = d × tan(α)" },
    { label: "Key angles: sin 30°, 45°, 60°", formula: "½,  1/√2,  √3/2" },
  ],
  "age-problems": [
    { label: "Age n years ago", formula: "Present age − n" },
    { label: "Age n years later", formula: "Present age + n" },
    { label: "Strategy", formula: "Assign variables, form 2 equations from ratio + difference" },
  ],
};

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
  const [formulasOpen, setFormulasOpen] = useState(false);

  // Extract just the question text (before the **Options:** line)
  const questionText = problem.description.split("\n\n**Options:**")[0];
  const topicFormulas = TOPIC_FORMULAS[problem.topic] || [];

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

      {/* Key Formulas */}
      {topicFormulas.length > 0 && (
        <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
          <button
            onClick={() => setFormulasOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary-brand">functions</span>
              <span className="text-on-surface text-sm font-medium">Key Formulas &amp; Definitions</span>
              <span className="text-outline text-xs capitalize">· {problem.topic.replace(/-/g, " ")}</span>
            </div>
            <span className={`material-symbols-outlined text-[18px] text-outline transition-transform ${formulasOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
          {formulasOpen && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topicFormulas.map((f, i) => (
                <div key={i} className="flex flex-col gap-0.5 rounded-lg bg-surface-container px-3 py-2">
                  <span className="text-outline text-[10px] uppercase tracking-wide">{f.label}</span>
                  <span className="text-on-surface text-sm font-mono">{f.formula}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
