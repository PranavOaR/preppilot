"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getAllUsers,
  updateUserRole,
  updateUserPlan,
  unflagUser,
  resetInterviewUsage,
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

function exportCSV(users: UserWithId[]) {
  const header = ["username", "email", "university", "xp", "plan", "planExpiry", "role", "flagged"];
  const rows = users.map((u) => [
    u.username || "",
    u.email || "",
    u.university || "",
    String(u.xp || 0),
    u.plan || "free",
    u.planExpiresAt ? new Date(u.planExpiresAt).toISOString().split("T")[0] : "",
    u.role || "user",
    u.isUnethical ? "yes" : "no",
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `preppilot-users-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | PlanTier>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Grant plan modal state
  const [grantTarget, setGrantTarget] = useState<UserWithId | "bulk" | null>(null);
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

    const targetIds = grantTarget === "bulk"
      ? Array.from(selected)
      : [grantTarget.id];

    setUpdatingId("bulk");
    try {
      await Promise.all(targetIds.map((id) => updateUserPlan(id, grantPlan, expiresAt)));
      setUsers((prev) =>
        prev.map((u) =>
          targetIds.includes(u.id)
            ? { ...u, plan: grantPlan, planExpiresAt: expiresAt ?? undefined }
            : u
        )
      );
      setSelected(new Set());
      setGrantTarget(null);
    } catch (err) {
      console.error("Failed to grant plan:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
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

  async function handleResetInterviews(userId: string, username: string) {
    if (!confirm(`Reset interview counter for ${username || userId}? This lets them use their plan quota again.`)) return;
    setUpdatingId(userId);
    try {
      await resetInterviewUsage(userId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const usage = u.usageThisMonth ? { ...u.usageThisMonth, interviewsLifetime: 0, interviewsThisMonth: 0 } : undefined;
          return { ...u, usageThisMonth: usage };
        })
      );
    } catch (err) {
      console.error("Failed to reset interview usage:", err);
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
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl">
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
        <>
          {/* Floating bulk action bar */}
          {selected.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-surface subtle-border shadow-lg">
              <span className="text-on-surface text-sm font-medium">{selected.size} selected</span>
              <button
                onClick={() => { setGrantTarget("bulk"); setGrantPlan("premium"); setGrantExpiry("1y"); }}
                className="px-4 py-2 rounded-lg gradient-primary text-on-primary text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Grant Plan
              </button>
              <button
                onClick={() => exportCSV(users.filter((u) => selected.has(u.id)))}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container-highest transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-on-surface-variant text-xs hover:text-on-surface transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className="rounded-xl bg-surface-container-low subtle-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/10 gap-2">
            <span className="text-on-surface-variant text-xs">{filtered.length} users shown</span>
            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="accent-primary-brand"
                  />
                </th>
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
                      } ${selected.has(u.id) ? "bg-primary-container/5" : ""}`}
                      onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                    >
                      <td className="px-4 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="accent-primary-brand"
                        />
                      </td>
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
                              setGrantTarget(u as UserWithId);
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
                        <td colSpan={8} className="px-6 py-4">
                          <p className="text-on-surface-variant text-xs uppercase tracking-wider mb-3 font-medium">
                            This Month&apos;s Usage
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
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
                          <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/10">
                            <span className="text-on-surface-variant text-xs">Admin actions:</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResetInterviews(u.id, u.username || u.email || u.id); }}
                              disabled={updatingId === u.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                              Reset Interview Counter
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        </>
      )}

      {/* Grant Plan Modal */}
      {grantTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm space-y-5 subtle-border">
            <div>
              <h2 className="text-on-surface font-semibold text-lg">Grant Plan Access</h2>
              {grantTarget === "bulk" ? (
                <p className="text-on-surface-variant text-sm mt-1">
                  Applying to <span className="text-on-surface font-medium">{selected.size} selected users</span>
                </p>
              ) : (
                <>
                  <p className="text-on-surface-variant text-sm mt-1">
                    User: <span className="text-on-surface font-medium">{grantTarget.username || grantTarget.email}</span>
                  </p>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    Current plan: <span className="uppercase font-mono">{grantTarget.plan || "free"}</span>
                  </p>
                </>
              )}
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
                disabled={updatingId === "bulk"}
                className="flex-1 py-2.5 rounded-lg text-sm gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updatingId === "bulk" ? "Saving..." : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
