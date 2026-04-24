"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useRouter } from "next/navigation";
import { getProblems } from "@/lib/db/problems";
import { useStreakFreeze } from "@/lib/xp/streaks";
import { getUserContestParticipations } from "@/lib/db/contests";
import { getUserSubmissions, getUserSolvedProblems } from "@/lib/db/submissions";
import { getActivityLog } from "@/lib/db/activity";
import { Heatmap } from "@/components/profile/heatmap";
import { ProblemsDonut } from "@/components/profile/problems-donut";
import { RecentSubmissions } from "@/components/profile/recent-submissions";
import { BadgeGrid } from "@/components/profile/badges";
import type { Problem } from "@/lib/types";
import { type PlanTier } from "@/lib/types/plans";
import type { Timestamp } from "firebase/firestore";
import Link from "next/link";

const PLAN_BADGE: Record<PlanTier, { label: string; className: string }> = {
  free:    { label: "FREE",    className: "bg-surface-container-high text-on-surface-variant" },
  starter: { label: "STARTER", className: "bg-blue-500/15 text-blue-400" },
  pro:     { label: "PRO",     className: "bg-purple-500/15 text-purple-400" },
  premium: { label: "PREMIUM", className: "bg-amber-500/15 text-amber-400" },
};

interface SubmissionData {
  problemTitle: string;
  problemSlug: string;
  status: string;
  language: string;
  submittedAt: Timestamp | { seconds: number } | string | null;
}

interface ActivityData {
  date: string;
  count: number;
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [problemCounts, setProblemCounts] = useState({
    total: 0, easy: 0, medium: 0, hard: 0,
  });
  const [solvedCounts, setSolvedCounts] = useState({
    total: 0, easy: 0, medium: 0, hard: 0,
  });
  const [loading, setLoading] = useState(true);
  const [contestHistory, setContestHistory] = useState<{
    contestId: string;
    contestTitle: string;
    score: number;
    rank: number;
    totalParticipants: number;
    joinedAt: any;
  }[]>([]);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [collegeRank, setCollegeRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [collegeUsers, setCollegeUsers] = useState<number>(0);
  const [ranksLoaded, setRanksLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [activityResult, submissionsResult, problemsResult, solvedResult] =
          await Promise.allSettled([
            getActivityLog(user!.uid, 365),
            getUserSubmissions(user!.uid, 15),
            getProblems({ pageSize: 500 }),
            getUserSolvedProblems(user!.uid),
          ]);

        const activityData = activityResult.status === "fulfilled" ? activityResult.value : [];
        const submissionsData = submissionsResult.status === "fulfilled" ? submissionsResult.value : [];
        const allProblems = problemsResult.status === "fulfilled" ? problemsResult.value.problems : [];
        const solvedIds = solvedResult.status === "fulfilled" ? solvedResult.value : [];

        // Log failures for debugging but don't crash
        if (activityResult.status === "rejected") console.warn("Activity load failed:", activityResult.reason);
        if (submissionsResult.status === "rejected") console.warn("Submissions load failed:", submissionsResult.reason);
        if (problemsResult.status === "rejected") console.warn("Problems load failed:", problemsResult.reason);
        if (solvedResult.status === "rejected") console.warn("Solved problems load failed:", solvedResult.reason);

        // Build problemId -> problem map for difficulty lookup
        const problemMap = new Map<string, Problem>();
        for (const p of allProblems) problemMap.set(p.id, p);

        // Solved counts by difficulty
        const solvedSet = new Set(solvedIds);
        let easySolved = 0, mediumSolved = 0, hardSolved = 0;
        for (const id of solvedSet) {
          const prob = problemMap.get(id);
          if (prob) {
            if (prob.difficulty === "easy") easySolved++;
            else if (prob.difficulty === "medium") mediumSolved++;
            else if (prob.difficulty === "hard") hardSolved++;
          }
        }

        setSolvedCounts({
          total: solvedSet.size,
          easy: easySolved,
          medium: mediumSolved,
          hard: hardSolved,
        });

        // Activity for heatmap
        setActivity(
          activityData.map((a: any) => ({
            date: a.date,
            count: a.problemsSolved || a.count || 0,
          }))
        );

        // Recent submissions (already limited to 15 by the query)
        setSubmissions(
          submissionsData.map((s: any) => ({
            problemTitle: s.problemTitle || "Unknown",
            problemSlug: s.problemSlug || "",
            status: s.status || "unknown",
            language: s.language || "",
            submittedAt: s.submittedAt,
          }))
        );

        // Problem counts
        setProblemCounts({
          total: allProblems.length,
          easy: allProblems.filter((p) => p.difficulty === "easy").length,
          medium: allProblems.filter((p) => p.difficulty === "medium").length,
          hard: allProblems.filter((p) => p.difficulty === "hard").length,
        });
        // Compute global + college rank via server-side API
        try {
          const idToken = await user!.getIdToken();
          const rankRes = await fetch("/api/user/rank", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (rankRes.ok) {
            const rankData = await rankRes.json();
            setGlobalRank(rankData.globalRank);
            setTotalUsers(rankData.totalUsers ?? 0);
            setCollegeRank(rankData.collegeRank);
            setCollegeUsers(rankData.collegeUsers ?? 0);
          }
        } catch { /* ranking is non-critical */ } finally {
          setRanksLoaded(true);
        }
        try {
          const participations = await getUserContestParticipations(user!.uid);
          setContestHistory(participations);
        } catch { /* contest history is non-critical */ }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, profile?.xp, profile?.university]);

  async function handleUseFreeze() {
    if (!user) return;
    setFreezeLoading(true);
    try {
      const result = await useStreakFreeze(user.uid);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) refreshProfile();
    } finally {
      setFreezeLoading(false);
    }
  }

  if (!profile) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined text-outline animate-spin text-3xl">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  const displayName =
    profile.username ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";
  const initial = displayName.charAt(0).toUpperCase();
  const memberSince = profile.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in-up">
      {/* Page Title */}
      <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
        Profile
      </h1>

      {/* User Info Card */}
      <div className="glass-panel subtle-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-serif font-medium text-on-primary">
                {initial}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl text-on-surface font-medium">
                {displayName}
              </h2>
              {(() => {
                const plan = (profile.plan || "free") as PlanTier;
                const badge = PLAN_BADGE[plan];
                const expiresAt = profile.planExpiresAt;
                const daysLeft = expiresAt
                  ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <Link href="/pricing">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${badge.className}`}>
                      {badge.label}
                    </span>
                    {plan !== "free" && daysLeft !== null && daysLeft <= 30 && (
                      <span className={`ml-1.5 text-xs ${daysLeft <= 7 ? "text-error" : "text-on-surface-variant"}`}>
                        · {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                      </span>
                    )}
                  </Link>
                );
              })()}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-on-surface-variant">
              {profile.university && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">school</span>
                  {profile.university}
                </span>
              )}
              {profile.year && profile.semester && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
                  Year {profile.year}, Sem {profile.semester}
                </span>
              )}
              {profile.targetCompany && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
                  {profile.targetCompany}
                </span>
              )}
              {profile.preferredLanguage && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">code</span>
                  {profile.preferredLanguage.toUpperCase()}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">event</span>
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel subtle-border rounded-lg px-4 py-3 text-center">
          <p className="font-mono text-on-surface text-lg font-semibold">
            {profile.xp?.toLocaleString() || 0}
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5">XP</p>
        </div>
        <div className="glass-panel subtle-border rounded-lg px-4 py-3 text-center">
          <p className="font-mono text-on-surface text-lg font-semibold">
            {solvedCounts.total}
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5">Solved</p>
        </div>
        <div className="glass-panel subtle-border rounded-lg px-4 py-3 text-center">
          <p className="font-mono text-on-surface text-lg font-semibold">
            {profile.currentStreak || 0}
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5">Current Streak</p>
        </div>
        <div className="glass-panel subtle-border rounded-lg px-4 py-3 text-center">
          <p className="font-mono text-on-surface text-lg font-semibold">
            {profile.longestStreak || 0}
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5">Longest Streak</p>
        </div>
      </div>

      {/* Streak Freeze */}
      {((profile.streakFreezes ?? 0) > 0 || true) && (
        <div className="glass-panel subtle-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-400 text-[20px]">ac_unit</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-surface text-sm font-medium">Streak Freeze</p>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {(profile.streakFreezes ?? 0) > 0
                ? `${profile.streakFreezes} freeze${profile.streakFreezes === 1 ? "" : "s"} available — protects your streak for a missed day`
                : "No freezes available. Upgrade your plan to earn streak freezes."}
            </p>
          </div>
          {(profile.streakFreezes ?? 0) > 0 && (
            <button
              onClick={handleUseFreeze}
              disabled={freezeLoading}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 shrink-0"
            >
              {freezeLoading ? "Using…" : "Use Freeze"}
            </button>
          )}
        </div>
      )}

      {/* Rankings Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/leaderboard/colleges?tab=individuals"
          className="glass-panel subtle-border rounded-xl px-5 py-4 flex items-center gap-4 hover:bg-surface-container transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary-brand text-[20px]">public</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-surface-variant text-xs">Global Rank</p>
            {!ranksLoaded ? (
              <p className="text-on-surface-variant text-sm">Calculating...</p>
            ) : globalRank ? (
              <p className="text-on-surface font-semibold text-xl font-mono">
                #{globalRank}
                <span className="text-on-surface-variant text-xs font-normal ml-1.5">/ {totalUsers} users</span>
              </p>
            ) : (
              <p className="text-on-surface-variant text-sm">—</p>
            )}
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-on-surface-variant text-[18px] transition-colors">arrow_forward</span>
        </Link>

        <Link
          href="/leaderboard/colleges"
          className="glass-panel subtle-border rounded-xl px-5 py-4 flex items-center gap-4 hover:bg-surface-container transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-tertiary text-[20px]">school</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-surface-variant text-xs">College Rank</p>
            {!profile.university ? (
              <p className="text-on-surface-variant text-sm">Add your college in settings</p>
            ) : !ranksLoaded ? (
              <p className="text-on-surface-variant text-sm">Calculating...</p>
            ) : collegeRank ? (
              <p className="text-on-surface font-semibold text-xl font-mono">
                #{collegeRank}
                <span className="text-on-surface-variant text-xs font-normal ml-1.5">/ {collegeUsers} at {profile.university}</span>
              </p>
            ) : (
              <p className="text-on-surface-variant text-sm">—</p>
            )}
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-on-surface-variant text-[18px] transition-colors">arrow_forward</span>
        </Link>
      </div>

      {/* Contest History */}
      {contestHistory.length > 0 && (
        <div className="glass-panel subtle-border rounded-xl p-6">
          <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-xl">emoji_events</span>
            Contest History
          </h3>
          <div className="space-y-2">
            {contestHistory.slice(0, 5).map((c) => (
              <div
                key={c.contestId}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-on-surface text-sm font-medium truncate">{c.contestTitle}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    Rank #{c.rank} of {c.totalParticipants}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="font-mono text-primary-brand text-sm font-semibold">
                    {c.score} pts
                  </span>
                  {c.rank <= 3 && (
                    <span className="material-symbols-outlined text-[18px] text-yellow-400">
                      {c.rank === 1 ? "military_tech" : "workspace_premium"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {contestHistory.length > 5 && (
            <p className="text-on-surface-variant text-xs text-center mt-3">
              +{contestHistory.length - 5} more contests
            </p>
          )}
        </div>
      )}

      {/* 2-Column: Donut + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Problems Donut */}
        <div className="glass-panel subtle-border rounded-xl p-6">
          <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-xl">check_circle</span>
            Problems Solved
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined text-outline animate-spin">progress_activity</span>
            </div>
          ) : (
            <ProblemsDonut
              solved={solvedCounts.total}
              total={problemCounts.total}
              easy={{ solved: solvedCounts.easy, total: problemCounts.easy }}
              medium={{ solved: solvedCounts.medium, total: problemCounts.medium }}
              hard={{ solved: solvedCounts.hard, total: problemCounts.hard }}
            />
          )}
        </div>

        {/* Recent Submissions */}
        <div className="glass-panel subtle-border rounded-xl p-6">
          <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-xl">history</span>
            Recent Submissions
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined text-outline animate-spin">progress_activity</span>
            </div>
          ) : (
            <RecentSubmissions submissions={submissions} />
          )}
        </div>
      </div>

      {/* Heatmap — Full Width */}
      <div className="glass-panel subtle-border rounded-xl p-6">
        <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-brand text-xl">grid_view</span>
          Activity
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="material-symbols-outlined text-outline animate-spin">progress_activity</span>
          </div>
        ) : (
          <Heatmap data={activity} />
        )}
      </div>

      {/* Badges */}
      <div className="glass-panel subtle-border rounded-xl p-6">
        <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-brand text-xl">workspace_premium</span>
          Badges
          <span className="text-on-surface-variant text-sm font-normal font-sans ml-1">
            ({(profile.badges || []).length}/{7})
          </span>
        </h3>
        <BadgeGrid earnedBadgeIds={profile.badges || []} />
      </div>
    </main>
  );
}
