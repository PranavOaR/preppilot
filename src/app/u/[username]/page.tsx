"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserByUsername } from "@/lib/db/users";
import { getUserSolvedProblems, getUserSubmissions } from "@/lib/db/submissions";
import { getActivityLog } from "@/lib/db/activity";
import { getProblems } from "@/lib/db/problems";
import { getUserContestParticipations } from "@/lib/db/contests";
import { Heatmap } from "@/components/profile/heatmap";
import { ProblemsDonut } from "@/components/profile/problems-donut";
import { RecentSubmissions } from "@/components/profile/recent-submissions";
import { BadgeGrid } from "@/components/profile/badges";
import type { UserProfile, Problem } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

interface ActivityData {
  date: string;
  count: number;
}

interface SubmissionData {
  problemTitle: string;
  problemSlug: string;
  status: string;
  language: string;
  submittedAt: Timestamp | { seconds: number } | string | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<(UserProfile & { uid: string }) | null>(null);
  const [solvedCounts, setSolvedCounts] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [problemCounts, setProblemCounts] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [contestHistory, setContestHistory] = useState<{
    contestId: string; contestTitle: string; score: number; rank: number; totalParticipants: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    let cancelled = false;
    async function load() {
      try {
        const p = await getUserByUsername(username);
        if (cancelled) return;
        if (!p) { setNotFound(true); return; }
        setProfile(p);

        const [solved, activityData, submissionsData, problemsResult, contestData] = await Promise.all([
          getUserSolvedProblems(p.uid).catch(() => [] as string[]),
          getActivityLog(p.uid, 365).catch(() => []),
          getUserSubmissions(p.uid, 10).catch(() => []),
          getProblems({ pageSize: 500 }).catch(() => ({ problems: [] as Problem[] })),
          getUserContestParticipations(p.uid).catch(() => []),
        ]);

        if (cancelled) return;

        const allProblems = problemsResult.problems;
        const problemMap = new Map<string, Problem>();
        for (const prob of allProblems) problemMap.set(prob.id, prob);

        const solvedSet = new Set(solved);
        let easySolved = 0, mediumSolved = 0, hardSolved = 0;
        for (const id of solvedSet) {
          const prob = problemMap.get(id);
          if (prob?.difficulty === "easy") easySolved++;
          else if (prob?.difficulty === "medium") mediumSolved++;
          else if (prob?.difficulty === "hard") hardSolved++;
        }
        setSolvedCounts({ total: solvedSet.size, easy: easySolved, medium: mediumSolved, hard: hardSolved });
        setProblemCounts({
          total: allProblems.length,
          easy: allProblems.filter((pr) => pr.difficulty === "easy").length,
          medium: allProblems.filter((pr) => pr.difficulty === "medium").length,
          hard: allProblems.filter((pr) => pr.difficulty === "hard").length,
        });

        setActivity(activityData.map((a) => ({
          date: a.date,
          count: (a as { problemsSolved?: number }).problemsSolved ?? 0,
        })));

        setSubmissions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          submissionsData.map((s: any) => ({
            problemTitle: s.problemTitle || "Unknown",
            problemSlug: s.problemSlug || "",
            status: s.status || "unknown",
            language: s.language || "",
            submittedAt: s.submittedAt,
          }))
        );
        setContestHistory(contestData);
      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [username, user, authLoading]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-outline animate-spin text-3xl">progress_activity</span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl bg-surface-container-low subtle-border p-8">
          <span className="material-symbols-outlined text-outline text-5xl">lock</span>
          <h1 className="font-serif text-on-surface text-2xl font-medium">Sign in to view profiles</h1>
          <p className="text-on-surface-variant text-sm">
            PrepPilot profiles are visible to other users. Create a free account to view <span className="text-on-surface font-medium">@{username}</span>.
          </p>
          <div className="flex items-center gap-3 justify-center pt-2">
            <Link href="/login" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm hover:bg-surface-container-high transition-colors">Sign in</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity">Create account</Link>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <span className="material-symbols-outlined text-outline text-5xl">person_off</span>
          <h1 className="font-serif text-on-surface text-2xl font-medium">User not found</h1>
          <p className="text-on-surface-variant text-sm">
            No PrepPilot user with username <span className="text-on-surface font-medium">@{username}</span>.
          </p>
          <Link href="/dashboard" className="inline-block mt-2 text-sm text-primary-brand hover:underline">Back to dashboard →</Link>
        </div>
      </main>
    );
  }

  const displayName = profile.displayName || profile.username;
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const memberSince = profile.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";
  const isOwnProfile = user.uid === profile.uid;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-on-surface-variant text-sm hover:text-on-surface transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-medium hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "link"}</span>
          {copied ? "Link copied" : "Share profile"}
        </button>
      </div>

      {/* Header card */}
      <div className="glass-panel subtle-border rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="text-3xl font-serif font-medium text-on-primary">{initial}</span>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="font-serif text-on-surface text-2xl font-medium">{displayName}</h1>
              <p className="text-on-surface-variant text-sm">@{profile.username}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
              {profile.university && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">school</span>
                  {profile.university}
                </span>
              )}
              {profile.targetCompany && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
                  Targeting {profile.targetCompany}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">event</span>
                Joined {memberSince}
              </span>
            </div>
          </div>
          {isOwnProfile && (
            <Link href="/profile" className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs hover:bg-surface-container-high transition-colors">
              Edit profile
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="XP" value={(profile.xp || 0).toLocaleString()} />
        <Stat label="Solved" value={solvedCounts.total.toString()} />
        <Stat label="Streak" value={`${profile.currentStreak || 0}🔥`} />
        <Stat label="Longest" value={(profile.longestStreak || 0).toString()} />
      </div>

      {/* Donut + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="glass-panel subtle-border rounded-xl p-6">
          <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-xl">check_circle</span>
            Problems Solved
          </h3>
          <ProblemsDonut
            solved={solvedCounts.total}
            total={problemCounts.total}
            easy={{ solved: solvedCounts.easy, total: problemCounts.easy }}
            medium={{ solved: solvedCounts.medium, total: problemCounts.medium }}
            hard={{ solved: solvedCounts.hard, total: problemCounts.hard }}
          />
        </div>
        <div className="glass-panel subtle-border rounded-xl p-6">
          <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-xl">history</span>
            Recent Submissions
          </h3>
          <RecentSubmissions submissions={submissions} />
        </div>
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
              <div key={c.contestId} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
                <div className="min-w-0">
                  <p className="text-on-surface text-sm font-medium truncate">{c.contestTitle}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">Rank #{c.rank} of {c.totalParticipants}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="font-mono text-primary-brand text-sm font-semibold">{c.score} pts</span>
                  {c.rank <= 3 && (
                    <span className="material-symbols-outlined text-[18px] text-yellow-400">
                      {c.rank === 1 ? "military_tech" : "workspace_premium"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="glass-panel subtle-border rounded-xl p-6">
        <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-brand text-xl">grid_view</span>
          Activity
        </h3>
        <Heatmap data={activity} />
      </div>

      {/* Badges */}
      {(profile.badges || []).length > 0 && (
        <div className="glass-panel subtle-border rounded-xl p-6">
          <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-xl">workspace_premium</span>
            Badges
          </h3>
          <BadgeGrid earnedBadgeIds={profile.badges || []} />
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel subtle-border rounded-lg px-4 py-4 text-center">
      <p className="font-mono text-on-surface text-xl font-semibold">{value}</p>
      <p className="text-on-surface-variant text-xs mt-0.5">{label}</p>
    </div>
  );
}
