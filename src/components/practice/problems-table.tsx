"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getProblems } from "@/lib/db/problems";
import { getUserSolvedProblems, getUserSubmissions } from "@/lib/db/submissions";
import type { Problem } from "@/lib/types";

const difficultyColors: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-error-brand",
};

interface ProblemsTableProps {
  filters: {
    type?: "dsa" | "aptitude";
    difficulty?: "easy" | "medium" | "hard";
    company?: string;
    topic?: string;
  };
  onCountChange?: (count: number) => void;
}

export function ProblemsTable({ filters, onCountChange }: ProblemsTableProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());
  const [attemptedSet, setAttemptedSet] = useState<Set<string>>(new Set());

  // Fetch user's solved and attempted problems
  useEffect(() => {
    if (!user) return;

    async function fetchUserStatus() {
      try {
        const [solvedIds, allSubmissions] = await Promise.all([
          getUserSolvedProblems(user!.uid),
          getUserSubmissions(user!.uid, 500),
        ]);
        setSolvedSet(new Set(solvedIds));
        const attempted = new Set<string>();
        for (const s of allSubmissions) {
          const data = s as Record<string, unknown>;
          if (data.problemId) {
            attempted.add(data.problemId as string);
          }
        }
        setAttemptedSet(attempted);
      } catch (err) {
        console.error("Failed to fetch user solve status:", err);
      }
    }

    fetchUserStatus();
  }, [user]);

  useEffect(() => {
    async function fetchProblems() {
      setLoading(true);
      setProblems([]);
      setLastDocId(null);
      setHasMore(false);
      try {
        const result = await getProblems({
          type: filters.type,
          difficulty: filters.difficulty,
          company: filters.company,
          topic: filters.topic,
          pageSize: 20,
        });
        setProblems(result.problems);
        setLastDocId(result.lastDocId);
        setHasMore(result.hasMore);
        onCountChange?.(result.problems.length);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, [filters.type, filters.difficulty, filters.company, filters.topic]);

  async function loadMore() {
    if (!lastDocId) return;
    setLoading(true);
    try {
      const result = await getProblems({
        type: filters.type,
        difficulty: filters.difficulty,
        company: filters.company,
        topic: filters.topic,
        pageSize: 20,
        lastDocId,
      });
      setProblems((prev) => [...prev, ...result.problems]);
      setLastDocId(result.lastDocId);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(problemId: string) {
    if (solvedSet.has(problemId)) {
      return (
        <span className="material-symbols-outlined text-[18px] text-green-400" title="Solved">
          check_circle
        </span>
      );
    }
    if (attemptedSet.has(problemId)) {
      return (
        <span className="material-symbols-outlined text-[18px] text-yellow-400" title="Attempted">
          pending
        </span>
      );
    }
    return null;
  }

  if (loading && problems.length === 0) {
    return (
      <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
          <div className="h-3 w-32 rounded bg-surface-container animate-pulse" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-outline-variant/5 animate-pulse">
                <td className="px-3 py-4 w-10">
                  <div className="w-5 h-5 rounded-full bg-surface-container mx-auto" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-3.5 rounded bg-surface-container w-48 mb-1.5" />
                  <div className="h-2.5 rounded bg-surface-container w-24" />
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="h-5 rounded bg-surface-container w-20" />
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="h-3 rounded bg-surface-container w-12" />
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <div className="h-3 rounded bg-surface-container w-10" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-3.5 rounded bg-surface-container w-14" />
                </td>
                <td className="px-3 py-4 w-10" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-low subtle-border p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-outline text-3xl">search_off</span>
        </div>
        <p className="text-on-surface text-sm font-medium mt-4">No problems found</p>
        <p className="text-on-surface-variant text-xs mt-1">Try adjusting or clearing your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
        <p className="text-on-surface-variant text-sm">
          Showing <span className="text-on-surface">{problems.length}</span> problems
        </p>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant/10">
            <th className="w-10 px-3 py-3" />
            <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-5 py-3">
              Title
            </th>
            <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">
              Topic
            </th>
            <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">
              Type
            </th>
            <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
              Success Rate
            </th>
            <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-5 py-3">
              Difficulty
            </th>
            <th className="w-10 px-3" />
          </tr>
        </thead>
        <tbody>
          {problems.map((problem) => (
              <tr
                key={problem.id}
                onClick={() => router.push(`/practice/${problem.slug}`)}
                className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <td className="px-3 py-4 text-center">
                  {getStatusBadge(problem.id)}
                </td>
                <td className="px-5 py-4">
                  <p className="text-on-surface text-sm font-medium">
                    {problem.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {problem.companies.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="text-outline text-[10px] bg-surface-container px-1.5 py-0.5 rounded"
                      >
                        {c}
                      </span>
                    ))}
                    {problem.companies.length > 3 && (
                      <span className="text-outline text-[10px]">
                        +{problem.companies.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="px-2 py-1 rounded text-xs bg-tertiary-container/30 text-tertiary capitalize">
                    {problem.topic.replace(/-/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="text-on-surface-variant text-xs uppercase">
                    {problem.type}
                  </span>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <span className="font-mono text-on-surface-variant text-sm">
                    {problem.successRate}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`text-sm font-medium capitalize ${difficultyColors[problem.difficulty]}`}
                  >
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <span className="material-symbols-outlined text-outline group-hover:text-on-surface-variant text-[16px] transition-colors">
                    arrow_forward_ios
                  </span>
                </td>
              </tr>
          ))}
        </tbody>
      </table>

      {/* Load More */}
      {hasMore && (
        <div className="flex items-center justify-center py-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm text-primary-brand hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
