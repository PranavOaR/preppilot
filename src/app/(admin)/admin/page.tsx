"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalContests: number;
  totalSubmissions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersSnap, problemsSnap, contestsSnap, submissionsSnap] =
          await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "problems")),
            getDocs(collection(db, "contests")),
            getDocs(collection(db, "submissions")),
          ]);

        setStats({
          totalUsers: usersSnap.size,
          totalProblems: problemsSnap.size,
          totalContests: contestsSnap.size,
          totalSubmissions: submissionsSnap.size,
        });

        // Get recent submissions (sort client-side to avoid composite index)
        const subs = submissionsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const aTime = a.submittedAt?.seconds || 0;
            const bTime = b.submittedAt?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 10);
        setRecentSubmissions(subs);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: "group", color: "text-blue-400", href: "/admin/users" },
    { label: "Problems", value: stats?.totalProblems ?? 0, icon: "code", color: "text-green-400", href: "/admin/problems" },
    { label: "Contests", value: stats?.totalContests ?? 0, icon: "emoji_events", color: "text-yellow-400", href: "/admin/contests" },
    { label: "Submissions", value: stats?.totalSubmissions ?? 0, icon: "assignment_turned_in", color: "text-purple-400", href: null },
  ];

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Overview of platform activity and content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const inner = (
            <div className="rounded-lg bg-surface-container-low subtle-border p-5 hover:bg-surface-container transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-[24px] ${card.color}`}>
                  {card.icon}
                </span>
              </div>
              <p className="text-on-surface font-semibold text-2xl">{card.value}</p>
              <p className="text-on-surface-variant text-xs mt-1">{card.label}</p>
            </div>
          );
          if (card.href) {
            return <Link key={card.label} href={card.href}>{inner}</Link>;
          }
          return <div key={card.label}>{inner}</div>;
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-on-surface font-medium">Quick Actions</h2>
        <div className="flex gap-3">
          <Link
            href="/admin/problems/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Problem
          </Link>
          <Link
            href="/admin/contests/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Contest
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="text-on-surface font-medium">Recent Submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No submissions yet.</p>
        ) : (
          <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Problem</th>
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Language</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3 text-sm text-on-surface">{sub.userId?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm text-on-surface">{sub.problemTitle || sub.problemSlug || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sub.status === "accepted"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{sub.language || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
