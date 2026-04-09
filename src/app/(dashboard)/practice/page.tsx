"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProblemFilters } from "@/components/practice/problem-filters";
import { RecommendedProblem } from "@/components/practice/recommended-problem";
import { ProblemsTable } from "@/components/practice/problems-table";

function PracticeContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<{
    type?: "dsa" | "aptitude";
    difficulty?: "easy" | "medium" | "hard";
    company?: string;
    topic?: string;
  }>({});

  // Initialize filters from URL params (e.g. from roadmap links)
  useEffect(() => {
    const type = searchParams.get("type") as "dsa" | "aptitude" | null;
    const topic = searchParams.get("topic");
    const initial: typeof filters = {};
    if (type) initial.type = type;
    if (topic) initial.topic = topic;
    if (type || topic) setFilters(initial);
  }, [searchParams]);

  return (
    <>
      {/* Filters */}
      <ProblemFilters filters={filters} onFilterChange={setFilters} />

      {/* Recommended Problem */}
      <RecommendedProblem />

      {/* Problems Table */}
      <ProblemsTable filters={filters} />
    </>
  );
}

export default function PracticePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-on-surface font-medium tracking-tight">
          Practice Arena
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Refine your technical craft through curated algorithmic challenges and
          cognitive puzzles.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            {/* Filters skeleton */}
            <div className="flex gap-3 flex-wrap">
              {[100, 130, 110, 90, 160].map((w, i) => (
                <div key={i} className="h-9 rounded-lg bg-surface-container-low" style={{ width: w }} />
              ))}
            </div>
            {/* Table skeleton */}
            <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
              <div className="h-10 border-b border-outline-variant/10 px-5 flex items-center">
                <div className="h-3 w-32 rounded bg-surface-container" />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 border-b border-outline-variant/5 px-5 flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-surface-container" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded bg-surface-container w-48" />
                    <div className="h-2.5 rounded bg-surface-container w-24" />
                  </div>
                  <div className="h-3 rounded bg-surface-container w-16 hidden md:block" />
                  <div className="h-3 rounded bg-surface-container w-12" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <PracticeContent />
      </Suspense>
    </main>
  );
}
