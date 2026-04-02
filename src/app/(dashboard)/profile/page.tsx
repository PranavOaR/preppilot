"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getProblems } from "@/lib/db/problems";
import { getUserSubmissions, getUserSolvedProblems } from "@/lib/db/submissions";
import { getActivityLog } from "@/lib/db/activity";
import { Heatmap } from "@/components/profile/heatmap";
import { ProblemsDonut } from "@/components/profile/problems-donut";
import { RecentSubmissions } from "@/components/profile/recent-submissions";
import type { Problem } from "@/lib/types";

interface SubmissionData {
  problemTitle: string;
  problemSlug: string;
  status: string;
  language: string;
  submittedAt: any;
}

interface ActivityData {
  date: string;
  count: number;
}

export default function ProfilePage() {
  const { user, profile } = useAuth();

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [problemCounts, setProblemCounts] = useState({
    total: 0, easy: 0, medium: 0, hard: 0,
  });
  const [solvedCounts, setSolvedCounts] = useState({
    total: 0, easy: 0, medium: 0, hard: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [activityData, submissionsData, problemsResult, solvedIds] =
          await Promise.all([
            getActivityLog(user!.uid, 365),
            getUserSubmissions(user!.uid, 15),
            getProblems({ pageSize: 500 }),
            getUserSolvedProblems(user!.uid),
          ]);

        const allProblems = problemsResult.problems;

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
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

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
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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
            <h2 className="font-serif text-xl text-on-surface font-medium">
              {displayName}
            </h2>
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
    </main>
  );
}
