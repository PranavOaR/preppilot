"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getAllUsers,
  updateUserRole,
  updateUserPlan,
  unflagUser,
  type UserWithId,
} from "@/lib/db/admin";
import { PLAN_LIMITS, type PlanTier } from "@/lib/types/plans";

const PLAN_TIERS: PlanTier[] = ["free", "starter", "pro", "premium"];

const PLAN_COLORS: Record<PlanTier, string> = {
  free:    "bg-surface-container-high text-on-surface-variant",
  starter: "bg-blue-500/15 text-blue-400",
  pro:     "bg-purple-500/15 text-purple-400",
  premium: "bg-amber-500/15 text-amber-400",
};

function formatExpiry(ts: number | undefined | null): string {
  if (!ts) return "No expiry";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | PlanTier>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  // Grant plan modal state
  const [grantTarget, setGrantTarget] = useState<UserWithId | null>(null);
  const [grantPlan, setGrantPlan] = useState<PlanTier>("premium");
  const [grantExpiry, setGrantExpiry] = useState<"1y" | "never">("1y");

  useEffect(() => {
    async function load() {
      try {
        const allUsers = await getAllUsers();
        allUsers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggleRole(userId: string, currentRole: string) {
    if (userId === currentUser?.uid) {
      alert("You cannot change your own role.");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleGrantPlan() {
    if (!grantTarget) return;
    const expiresAt =
      grantExpiry === "1y" ? Date.now() + 365 * 24 * 60 * 60 * 1000 : null;
    setUpdatingId(grantTarget.id);
    try {
      await updateUserPlan(grantTarget.id, grantPlan, expiresAt);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === grantTarget.id
            ? { ...u, plan: grantPlan, planExpiresAt: expiresAt ?? undefined }
            : u
        )
      );
      setGrantTarget(null);
    } catch (err) {
      console.error("Failed to grant plan:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleUnflag(userId: string) {
    if (!confirm("Clear the flag for this user?")) return;
    setUpdatingId(userId);
    try {
      await unflagUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isUnethical: false } : u))
      );
    } catch (err) {
      console.error("Failed to unflag user:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = users.filter((u) => {
    if (filter === "flagged" && !u.isUnethical) return false;
    if (
      filter !== "all" &&
      filter !== "flagged" &&
      (u.plan || "free") !== filter
    )
      return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.university?.toLowerCase().includes(q)
    );
  });

  const flaggedCount = users.filter((u) => u.isUnethical).length;
  const planCounts = PLAN_TIERS.reduce<Record<PlanTier, number>>(
    (acc, t) => {
      acc[t] = users.filter((u) => (u.plan || "free") === t).length;
      return acc;
    },
    { free: 0, starter: 0, pro: 0, premium: 0 }
  );

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Users
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {users.length} registered users
          {flaggedCount > 0 && (
            <span className="ml-2 text-error text-xs font-medium">
              · {flaggedCount} flagged
            </span>
          )}
        </p>
      </div>

      {/* Plan distribution pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "flagged", ...PLAN_TIERS] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary-brand text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f === "all"
              ? `All (${users.length})`
              : f === "flagged"
              ? `Flagged (${flaggedCount})`
              : `${f.charAt(0).toUpperCase() + f.slice(1)} (${planCounts[f]})`}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username, email, or university..."
        className="w-full max-w-md px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
      />

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
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">University</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">XP</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Expires</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const plan = (u.plan || "free") as PlanTier;
                const limits = PLAN_LIMITS[plan];
                const usage = u.usageThisMonth;
                const isExpanded = expandedUserId === u.id;

                return (
                  <>
                    <tr
                      key={u.id}
                      className={`border-b border-outline-variant/5 hover:bg-surface-container transition-colors cursor-pointer ${
                        u.isUnethical ? "bg-red-500/5" : ""
                      }`}
                      onClick={() =>
                        setExpandedUserId(isExpanded ? null : u.id)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                            <span className="text-xs text-primary-brand font-medium">
                              {u.username?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-on-surface text-sm font-medium">{u.username || "—"}</span>
                              {u.isUnethical && (
                                <span className="material-symbols-outlined text-error text-[14px]" title="Flagged for violations">
                                  flag
                                </span>
                              )}
                            </div>
                            <p className="text-on-surface-variant text-[10px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-sm">{u.university || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-primary-brand text-sm">{u.xp || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${PLAN_COLORS[plan]}`}>
                          {plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">
                        {plan === "free" ? "—" : formatExpiry(u.planExpiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-purple-500/15 text-purple-400"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setGrantTarget(u);
                              setGrantPlan(plan === "free" ? "premium" : plan);
                              setGrantExpiry("1y");
                            }}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            Plan
                          </button>
                          <button
                            onClick={() => handleToggleRole(u.id, u.role || "user")}
                            disabled={u.id === currentUser?.uid || updatingId === u.id}
                            className="text-xs text-primary-brand hover:underline disabled:opacity-30 disabled:no-underline"
                          >
                            {updatingId === u.id
                              ? "..."
                              : u.role === "admin"
                              ? "Demote"
                              : "Promote"}
                          </button>
                          {u.isUnethical && (
                            <button
                              onClick={() => handleUnflag(u.id)}
                              disabled={updatingId === u.id}
                              className="text-xs text-green-400 hover:underline disabled:opacity-30"
                            >
                              Unflag
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded usage row */}
                    {isExpanded && (
                      <tr key={`${u.id}-expanded`} className="border-b border-outline-variant/5 bg-surface-container/50">
                        <td colSpan={7} className="px-6 py-4">
                          <p className="text-on-surface-variant text-xs uppercase tracking-wider mb-3 font-medium">
                            This Month&apos;s Usage
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            {[
                              { label: "DSA Runs", used: usage?.dsaRuns ?? 0, limit: limits.dsaRuns },
                              { label: "Submits", used: usage?.dsaSubmits ?? 0, limit: limits.dsaSubmits },
                              { label: "AI Hints", used: usage?.aiHints ?? 0, limit: limits.aiHints },
                              { label: "Code Reviews", used: usage?.codeReviews ?? 0, limit: limits.codeReviews },
                              {
                                label: "Interviews",
                                used: limits.interviewsMonthly
                                  ? (usage?.interviewsThisMonth ?? 0)
                                  : (usage?.interviewsLifetime ?? 0),
                                limit: limits.interviews,
                              },
                            ].map(({ label, used, limit }) => {
                              const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                              return (
                                <div key={label}>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-on-surface-variant text-[10px]">{label}</span>
                                    <span className="text-on-surface-variant text-[10px] font-mono">
                                      {limit === 0 ? "N/A" : `${used}/${limit}`}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-surface-container-high">
                                    {limit > 0 && (
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          pct >= 100 ? "bg-error" : pct >= 75 ? "bg-yellow-400" : "bg-green-400"
                                        }`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Plan Modal */}
      {grantTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm space-y-5 subtle-border">
            <div>
              <h2 className="text-on-surface font-semibold text-lg">Grant Plan Access</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                User: <span className="text-on-surface font-medium">{grantTarget.username || grantTarget.email}</span>
              </p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                Current plan: <span className="uppercase font-mono">{grantTarget.plan || "free"}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-on-surface-variant text-xs uppercase tracking-wider font-medium mb-2 block">
                  New Plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_TIERS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setGrantPlan(t)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        grantPlan === t
                          ? "gradient-primary text-on-primary"
                          : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {grantPlan !== "free" && (
                <div>
                  <label className="text-on-surface-variant text-xs uppercase tracking-wider font-medium mb-2 block">
                    Expiry
                  </label>
                  <div className="flex gap-2">
                    {(["1y", "never"] as const).map((e) => (
                      <button
                        key={e}
                        onClick={() => setGrantExpiry(e)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                          grantExpiry === e
                            ? "gradient-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {e === "1y" ? "1 Year" : "No Expiry"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setGrantTarget(null)}
                className="flex-1 py-2.5 rounded-lg text-sm bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantPlan}
                disabled={updatingId === grantTarget.id}
                className="flex-1 py-2.5 rounded-lg text-sm gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updatingId === grantTarget.id ? "Saving..." : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
