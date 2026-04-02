"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProblemFilters } from "@/components/practice/problem-filters";
import { RecommendedProblem } from "@/components/practice/recommended-problem";
import { PracticeStats } from "@/components/practice/practice-stats";
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

      {/* Stats Row */}
      <PracticeStats />

      {/* Problems Table */}
      <ProblemsTable filters={filters} />
    </>
  );
}

export default function PracticePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Practice Arena
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Refine your technical craft through curated algorithmic challenges and
          cognitive puzzles.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-outline text-4xl animate-spin">
              progress_activity
            </span>
          </div>
        }
      >
        <PracticeContent />
      </Suspense>
    </main>
  );
}
