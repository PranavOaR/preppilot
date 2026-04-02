"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getContests, deleteContest } from "@/lib/db/contests";
import type { Contest } from "@/lib/types";

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getContests();
        setContests(all);
      } catch (err) {
        console.error("Failed to load contests:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete contest "${title}"? This cannot be undone.`)) return;
    try {
      await deleteContest(id);
      setContests((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete contest:", err);
    }
  }

  const statusColors: Record<string, string> = {
    upcoming: "bg-primary-container/20 text-primary-brand",
    active: "bg-green-500/15 text-green-400",
    completed: "bg-outline-variant/20 text-on-surface-variant",
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
            Contests
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {contests.length} contests total
          </p>
        </div>
        <Link
          href="/admin/contests/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Contest
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low subtle-border p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">
            emoji_events
          </span>
          <p className="text-on-surface-variant text-sm">No contests yet. Create your first one!</p>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Title</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Problems</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Duration</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((contest) => (
                <tr key={contest.id} className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3 text-on-surface text-sm font-medium">{contest.title}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs uppercase">{contest.type || "mixed"}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-sm">{contest.problemIds?.length || 0}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-sm">{contest.duration} min</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[contest.status]}`}>
                      {contest.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link
                      href={`/admin/contests/${contest.id}/edit`}
                      className="text-primary-brand text-xs hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(contest.id, contest.title)}
                      className="text-error-brand text-xs hover:underline"
                    >
                      Delete
                    </button>
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
