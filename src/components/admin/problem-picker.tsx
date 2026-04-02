"use client";

import { useEffect, useState } from "react";
import { getAllProblems } from "@/lib/db/problems";
import type { Problem } from "@/lib/types";

interface ProblemPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ProblemPicker({ selectedIds, onSelectionChange }: ProblemPickerProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "dsa" | "aptitude">("");
  const [filterDifficulty, setFilterDifficulty] = useState<"" | "easy" | "medium" | "hard">("");

  useEffect(() => {
    async function load() {
      const all = await getAllProblems();
      // Only show published problems
      setProblems(all.filter((p) => !p.status || p.status === "published"));
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  const filtered = problems.filter((p) => {
    if (filterType && p.type !== filterType) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const diffColors: Record<string, string> = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="material-symbols-outlined text-outline text-2xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search problems..."
          className="flex-1 px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
        />
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
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as any)}
          className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <p className="text-on-surface-variant text-xs">
        {selectedIds.length} selected &middot; {filtered.length} shown
      </p>

      <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden max-h-96 overflow-y-auto">
        {filtered.map((problem) => {
          const selected = selectedIds.includes(problem.id);
          return (
            <label
              key={problem.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 cursor-pointer transition-colors ${
                selected ? "bg-primary-container/10" : "hover:bg-surface-container"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(problem.id)}
                className="accent-primary-brand shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-on-surface text-sm font-medium">{problem.title}</span>
                <span className="ml-2 text-on-surface-variant text-xs uppercase">{problem.type}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs bg-tertiary-container/30 text-tertiary capitalize shrink-0">
                {problem.topic?.replace(/-/g, " ")}
              </span>
              <span className={`text-xs font-medium capitalize shrink-0 ${diffColors[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
            </label>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-on-surface-variant text-sm">
            No problems match your search.
          </div>
        )}
      </div>
    </div>
  );
}
