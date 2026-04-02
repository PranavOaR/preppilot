"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProblems } from "@/lib/db/problems";
import type { Problem } from "@/lib/types";

const difficultyStyles: Record<string, string> = {
  easy: "bg-green-400/10 text-green-400",
  medium: "bg-yellow-400/10 text-yellow-400",
  hard: "bg-error-container/30 text-error-brand",
};

export function RecommendedProblem() {
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        const result = await getProblems({ difficulty: "medium", pageSize: 5 });
        if (result.problems.length > 0) {
          const random = result.problems[Math.floor(Math.random() * result.problems.length)];
          setProblem(random);
        }
      } catch (err) {
        console.error("Failed to fetch recommended problem:", err);
      }
    }
    fetchRecommended();
  }, []);

  if (!problem) return null;

  return (
    <div className="rounded-lg bg-surface-container-low p-6 subtle-border space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h4 className="text-on-surface text-lg font-medium">
              {problem.title}
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${difficultyStyles[problem.difficulty]}`}
            >
              {problem.difficulty}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
            {problem.description.slice(0, 150)}...
          </p>
          <div className="flex items-center gap-4 text-outline text-xs">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">topic</span>
              <span className="capitalize">{problem.topic.replace(/-/g, " ")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>
              <span>{problem.successRate}% success rate</span>
            </div>
          </div>
        </div>

        <Link href={`/practice/${problem.slug}`}>
          <Button className="gradient-primary text-on-primary font-medium px-5 h-10 hover:opacity-90 transition-opacity shrink-0 cursor-pointer">
            <span className="material-symbols-outlined text-[18px] mr-1">
              play_arrow
            </span>
            Solve Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
