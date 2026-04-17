"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDailyChallenge } from "@/lib/db/problems";
import { getUserSolvedProblems } from "@/lib/db/submissions";
import { useAuth } from "@/contexts/auth-context";
import type { Problem } from "@/lib/types";

const difficultyClass: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-error-brand",
};

export function DailyChallengeCard() {
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solved, setSolved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const p = await getDailyChallenge();
        if (cancelled) return;
        setProblem(p);
        if (p && user) {
          const solvedIds = await getUserSolvedProblems(user.uid);
          if (!cancelled) setSolved(solvedIds.includes(p.id));
        }
      } catch (err) {
        console.error("Daily challenge fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-container-low subtle-border p-5 h-28 animate-pulse" />
    );
  }

  if (!problem) return null;

  return (
    <div className="rounded-xl gradient-primary/5 subtle-border bg-gradient-to-br from-primary-container/10 via-surface-container-low to-surface-container-low p-5 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary-brand/10 blur-3xl pointer-events-none" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-400 text-[20px]">
              local_fire_department
            </span>
            <span className="text-on-surface text-xs font-semibold uppercase tracking-wider">
              Daily Challenge
            </span>
            <span className="text-outline text-[10px]">· same problem for everyone today</span>
          </div>
          {solved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-400/15 text-green-400 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              Solved
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-serif text-on-surface text-lg font-medium truncate">
              {problem.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className={`capitalize ${difficultyClass[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
              <span className="text-outline capitalize">
                {problem.topic.replace(/-/g, " ")}
              </span>
              <span className="text-outline">{problem.xpReward} XP</span>
            </div>
          </div>
          <Link
            href={`/practice/${problem.slug}`}
            className="shrink-0 px-4 py-2 rounded-lg gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {solved ? "Review" : "Solve"}
          </Link>
        </div>
      </div>
    </div>
  );
}
