"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProblems } from "@/lib/db/problems";
import type { Problem } from "@/lib/types";

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"" | "dsa" | "aptitude">("");
  const [filterStatus, setFilterStatus] = useState<"" | "draft" | "published">("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getProblems({
          type: filterType || undefined,
          status: (filterStatus as "draft" | "published") || undefined,
          pageSize: 200,
          includeAll: true,
        });
        setProblems(result.problems);
      } catch (err) {
        console.error("Failed to load problems:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterType, filterStatus]);

  const diffColors: Record<string, string> = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
            Problems
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {problems.length} problems total
          </p>
        </div>
        <Link
          href="/admin/problems/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Problem
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border"
        >
          <option value="">All Types</option>
          <option value="dsa">DSA</option>
          <option value="aptitude">Aptitude</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Title</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Topic</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Difficulty</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem.id} className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-on-surface text-sm font-medium">{problem.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-on-surface-variant text-xs uppercase">{problem.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-tertiary-container/30 text-tertiary capitalize">
                      {problem.topic?.replace(/-/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${diffColors[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      problem.status === "published" || !problem.status
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {problem.status || "published"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/problems/${problem.id}/edit`}
                      className="text-primary-brand text-xs hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
