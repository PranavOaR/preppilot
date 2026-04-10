"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getAllUsers, type UserWithId } from "@/lib/db/admin";
import type { PlanTier } from "@/lib/types/plans";

interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalContests: number;
  totalSubmissions: number;
  flaggedUsers: number;
  planCounts: Record<PlanTier, number>;
  totalRevenueInr: number;
  paymentsThisMonth: number;
}

const PLAN_COLORS: Record<PlanTier, string> = {
  free:    "text-on-surface-variant",
  starter: "text-blue-400",
  pro:     "text-purple-400",
  premium: "text-amber-400",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [problemsResult, contestsResult, submissionsResult, paymentsResult, usersResult] =
          await Promise.allSettled([
            getDocs(collection(db, "problems")),
            getDocs(collection(db, "contests")),
            getDocs(collection(db, "submissions")),
            getDocs(collection(db, "payments")),
            getAllUsers(),
          ]);

        const problemsSnap = problemsResult.status === "fulfilled" ? problemsResult.value : null;
        const contestsSnap = contestsResult.status === "fulfilled" ? contestsResult.value : null;
        const submissionsSnap = submissionsResult.status === "fulfilled" ? submissionsResult.value : null;
        const paymentsSnap = paymentsResult.status === "fulfilled" ? paymentsResult.value : null;
        const users = usersResult.status === "fulfilled" ? usersResult.value : [];

        if (problemsResult.status === "rejected") console.error("problems fetch failed:", problemsResult.reason);
        if (contestsResult.status === "rejected") console.error("contests fetch failed:", contestsResult.reason);
        if (submissionsResult.status === "rejected") console.error("submissions fetch failed:", submissionsResult.reason);
        if (paymentsResult.status === "rejected") console.error("payments fetch failed:", paymentsResult.reason);
        if (usersResult.status === "rejected") console.error("users fetch failed:", usersResult.reason);

        const planCounts: Record<PlanTier, number> = {
          free: 0, starter: 0, pro: 0, premium: 0,
        };
        const flagged: UserWithId[] = [];
        for (const u of users) {
          const plan = (u.plan || "free") as PlanTier;
          planCounts[plan] = (planCounts[plan] || 0) + 1;
          if (u.isUnethical) flagged.push(u);
        }
        setFlaggedUsers(flagged);

        const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        let totalRevenueInr = 0;
        let paymentsThisMonth = 0;
        for (const p of (paymentsSnap?.docs ?? [])) {
          const d = p.data();
          totalRevenueInr += d.amountInr || 0;
          const paidAt = d.paidAt?.toDate?.()?.toISOString?.()?.slice(0, 7);
          if (paidAt === thisMonth) paymentsThisMonth++;
        }

        setStats({
          totalUsers: users.length,
          totalProblems: problemsSnap?.size ?? 0,
          totalContests: contestsSnap?.size ?? 0,
          totalSubmissions: submissionsSnap?.size ?? 0,
          flaggedUsers: flagged.length,
          planCounts,
          totalRevenueInr,
          paymentsThisMonth,
        });

        const subs = (submissionsSnap?.docs ?? [])
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
    { label: "Flagged Users", value: stats?.flaggedUsers ?? 0, icon: "flag", color: "text-error", href: "/admin/users" },
    {
      label: "Revenue (all time)",
      value: `₹${(stats?.totalRevenueInr ?? 0).toLocaleString("en-IN")}`,
      icon: "currency_rupee",
      color: "text-green-400",
      href: null,
    },
    {
      label: "Payments this month",
      value: stats?.paymentsThisMonth ?? 0,
      icon: "payments",
      color: "text-amber-400",
      href: null,
    },
  ];

  const paidUsers = (stats?.planCounts.starter ?? 0) + (stats?.planCounts.pro ?? 0) + (stats?.planCounts.premium ?? 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Overview of platform activity and content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const inner = (
            <div className="rounded-xl bg-surface-container-low subtle-border p-5 hover:bg-surface-container transition-colors h-full">
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

      {/* Plan Distribution */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-on-surface font-medium">Plan Distribution</h2>
          <span className="text-on-surface-variant text-xs">
            {paidUsers} paid · {stats?.planCounts.free ?? 0} free
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(["free", "starter", "pro", "premium"] as PlanTier[]).map((plan) => {
            const count = stats?.planCounts[plan] ?? 0;
            const pct = stats?.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
            return (
              <Link
                key={plan}
                href={`/admin/users?plan=${plan}`}
                className="rounded-xl bg-surface-container-low subtle-border p-4 hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium uppercase ${PLAN_COLORS[plan]}`}>
                    {plan}
                  </span>
                  <span className="text-on-surface-variant text-xs">{pct}%</span>
                </div>
                <p className="text-on-surface font-semibold text-xl">{count}</p>
                <div className="w-full h-1.5 rounded-full bg-surface-container-high mt-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      plan === "premium" ? "bg-amber-400"
                      : plan === "pro" ? "bg-purple-400"
                      : plan === "starter" ? "bg-blue-400"
                      : "bg-surface-container-highest"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Flagged Users */}
      {flaggedUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-on-surface font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">flag</span>
              Flagged Accounts ({flaggedUsers.length})
            </h2>
            <Link href="/admin/users?filter=flagged" className="text-primary-brand text-xs hover:underline">
              Manage
            </Link>
          </div>
          <div className="rounded-xl bg-surface-container-low subtle-border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">University</th>
                  <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">XP</th>
                </tr>
              </thead>
              <tbody>
                {flaggedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-outline-variant/5 bg-red-500/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-error text-[14px]">flag</span>
                        <span className="text-on-surface text-sm">{u.username || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-on-surface-variant text-sm">{u.university || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-primary-brand text-sm">{u.xp || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-on-surface font-medium">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
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
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="space-y-3">
        <h2 className="text-on-surface font-medium">Recent Submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No submissions yet.</p>
        ) : (
          <div className="rounded-xl bg-surface-container-low subtle-border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
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
          </div>
        )}
      </div>
    </div>
  );
}
