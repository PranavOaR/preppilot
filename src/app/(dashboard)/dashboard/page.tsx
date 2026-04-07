"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserSubmissions, getUserSolvedProblems } from "@/lib/db/submissions";
import { getProblems } from "@/lib/db/problems";
import { getUserProgress } from "@/lib/db/progress";
import { getContests } from "@/lib/db/contests";
import type { Problem, Contest } from "@/lib/types";

interface SubmissionItem {
  id: string;
  problemTitle?: string;
  problemSlug?: string;
  problemTopic?: string;
  status?: string;
  submittedAt?: { seconds: number };
}

function formatRelativeTime(seconds: number): string {
  const now = Date.now() / 1000;
  const diff = now - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(seconds * 1000).toLocaleDateString();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [solvedCount, setSolvedCount] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionItem[]>([]);
  const [weakTopics, setWeakTopics] = useState<{ topic: string; accuracy: number; solved: number; total: number }[]>([]);
  const [unsolved, setUnsolved] = useState<Problem[]>([]);
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [todaySolved, setTodaySolved] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setDataLoading(true);
      try {
        const [solvedIds, problemsResult, submissions, progressData, contests] = await Promise.all([
          getUserSolvedProblems(user!.uid),
          getProblems({ pageSize: 500 }),
          getUserSubmissions(user!.uid, 20),
          getUserProgress(user!.uid),
          getContests(),
        ]);

        if (cancelled) return;

        const allProblems = problemsResult.problems;
        const solvedSet = new Set(solvedIds);

        setSolvedCount(solvedSet.size);
        setTotalProblems(allProblems.length);
        setRecentSubmissions(submissions.slice(0, 3) as SubmissionItem[]);

        // Today's solved count
        const today = new Date().toISOString().split("T")[0];
        const todayCount = (submissions as SubmissionItem[]).filter((s) => {
          if (!s.submittedAt?.seconds) return false;
          const d = new Date(s.submittedAt.seconds * 1000).toISOString().split("T")[0];
          return d === today && s.status === "accepted";
        });
        // Deduplicate by problem
        const todayProblems = new Set(todayCount.map((s) => s.problemSlug));
        setTodaySolved(todayProblems.size);

        // Find weak topics (low accuracy, attempted but struggling)
        const topicStats: Record<string, { solved: number; attempted: number; total: number }> = {};
        for (const p of allProblems) {
          if (!topicStats[p.topic]) topicStats[p.topic] = { solved: 0, attempted: 0, total: 0 };
          topicStats[p.topic].total++;
        }
        for (const p of progressData) {
          const data = p as Record<string, unknown>;
          const topic = data.topic as string;
          if (topic && topicStats[topic]) {
            topicStats[topic].solved = (data.problemsSolved as number) || 0;
            topicStats[topic].attempted = (data.problemsAttempted as number) || 0;
          }
        }

        const weak = Object.entries(topicStats)
          .filter(([, s]) => s.attempted > 0 && s.solved < s.total)
          .map(([topic, s]) => ({
            topic,
            accuracy: s.attempted > 0 ? Math.round((s.solved / s.attempted) * 100) : 0,
            solved: s.solved,
            total: s.total,
          }))
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 3);
        setWeakTopics(weak);

        // Find unsolved problems for daily challenge — 1 DSA + 1 Aptitude
        const unsolvedDSA = allProblems.filter((p) => !solvedSet.has(p.id) && p.type === "dsa");
        const unsolvedAptitude = allProblems.filter((p) => !solvedSet.has(p.id) && p.type === "aptitude");
        const pickedDSA = unsolvedDSA.sort(() => Math.random() - 0.5).slice(0, 1);
        const pickedAptitude = unsolvedAptitude.sort(() => Math.random() - 0.5).slice(0, 1);
        setUnsolved([...pickedDSA, ...pickedAptitude]);

        // Active/upcoming contests
        const liveContests = contests.filter((c) => c.status === "active" || c.status === "upcoming");
        setActiveContests(liveContests.slice(0, 2));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-pulse">
        {/* Welcome row */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-lg bg-surface-container-low" />
            <div className="h-3.5 w-72 rounded bg-surface-container-low" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-lg bg-surface-container-low" />
            <div className="h-10 w-24 rounded-lg bg-surface-container-low" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-16 rounded-xl bg-surface-container-low" />
        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-4">
            <div className="h-5 w-40 rounded bg-surface-container-low" />
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-surface-container-low" />)}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-surface-container-low" />)}
          </div>
        </div>
      </main>
    );
  }

  if (!user || !profile) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-on-surface-variant">Please sign in to view your dashboard.</p>
      </main>
    );
  }

  const dailyGoal = 5;
  const dailyProgress = Math.min((todaySolved / dailyGoal) * 100, 100);

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome + Daily Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
            {getGreeting()}, {profile.displayName || profile.username || "there"}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {todaySolved === 0
              ? "Start your daily practice to keep the streak going!"
              : todaySolved >= dailyGoal
                ? "You've hit your daily goal! Keep going or take a break."
                : `${dailyGoal - todaySolved} more to hit today's goal.`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-orange-400">local_fire_department</span>
            <span className="text-on-surface font-mono text-sm font-semibold">{profile.currentStreak || 0}</span>
            <span className="text-on-surface-variant text-xs">day streak</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-primary-brand">bolt</span>
            <span className="text-on-surface font-mono text-sm font-semibold">{(profile.xp || 0).toLocaleString()}</span>
            <span className="text-on-surface-variant text-xs">XP</span>
          </div>
        </div>
      </div>

      {/* Daily Goal Progress Bar */}
      <div className="glass-panel subtle-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-[20px]">target</span>
            <span className="text-on-surface text-sm font-medium">Today&apos;s Goal</span>
          </div>
          <span className="text-on-surface font-mono text-sm font-semibold">
            {todaySolved}/{dailyGoal}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-container-high">
          <div
            className="h-3 rounded-full bg-green-500 transition-all"
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Daily Challenge — Unsolved Problems */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-on-surface text-lg font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400 text-xl">emoji_events</span>
                Today&apos;s Challenges
              </h3>
              <Link href="/practice" className="text-primary-brand text-xs hover:underline">
                View all
              </Link>
            </div>

            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-surface-container-low animate-pulse" />
                ))}
              </div>
            ) : unsolved.length === 0 ? (
              <div className="rounded-lg bg-surface-container-low p-6 text-center">
                <span className="material-symbols-outlined text-green-400 text-3xl">celebration</span>
                <p className="text-on-surface text-sm font-medium mt-2">You&apos;ve solved everything!</p>
                <p className="text-on-surface-variant text-xs mt-1">Check back when new problems are added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unsolved.map((problem) => (
                  <Link
                    key={problem.id}
                    href={`/practice/${problem.slug}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        problem.type === "dsa"
                          ? "bg-primary-container/20"
                          : "bg-tertiary-container/20"
                      }`}>
                        <span className={`material-symbols-outlined text-[18px] ${
                          problem.type === "dsa" ? "text-primary-brand" : "text-tertiary"
                        }`}>
                          {problem.type === "dsa" ? "code" : "quiz"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-on-surface text-sm font-medium truncate">{problem.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs capitalize ${
                            problem.difficulty === "easy" ? "text-green-400"
                              : problem.difficulty === "medium" ? "text-yellow-400"
                              : "text-error-brand"
                          }`}>{problem.difficulty}</span>
                          <span className="text-outline text-[10px]">{problem.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary-brand text-[18px] transition-colors">
                      arrow_forward
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Weak Areas — Topics to Improve */}
          {weakTopics.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-on-surface text-lg font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-error-brand text-xl">trending_down</span>
                  Needs Improvement
                </h3>
                <p className="text-on-surface-variant text-xs mt-1 ml-7">
                  Topics you&apos;ve attempted but struggled with — focus here to boost your accuracy.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {weakTopics.map((wt) => (
                  <Link
                    key={wt.topic}
                    href={`/practice?topic=${wt.topic}`}
                    className="rounded-lg bg-surface-container-low p-4 hover:bg-surface-container transition-colors group"
                  >
                    <p className="text-on-surface text-sm font-medium capitalize">
                      {wt.topic.replace(/-/g, " ")}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-medium ${
                        wt.accuracy < 50 ? "text-error-brand" : "text-yellow-400"
                      }`}>
                        {wt.accuracy}% accuracy
                      </span>
                      <span className="text-on-surface-variant text-xs">
                        {wt.solved}/{wt.total} solved
                      </span>
                    </div>
                    <p className="text-outline text-[10px] mt-1">
                      {wt.accuracy < 30
                        ? "Start with easy problems"
                        : wt.accuracy < 60
                        ? "Review concepts, then retry"
                        : "Almost there — keep practicing"}
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-high mt-2">
                      <div
                        className={`h-1.5 rounded-full ${wt.accuracy < 50 ? "bg-error-brand" : "bg-yellow-400"}`}
                        style={{ width: `${(wt.solved / wt.total) * 100}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Link
                href="/practice"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-primary-brand text-[20px]">terminal</span>
                <span className="text-on-surface text-sm">Practice Problems</span>
              </Link>
              <Link
                href="/roadmap"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-primary-brand text-[20px]">map</span>
                <span className="text-on-surface text-sm">View Roadmap</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-primary-brand text-[20px]">emoji_events</span>
                <span className="text-on-surface text-sm">Contests</span>
              </Link>
            </div>
          </div>

          {/* Active Contests */}
          {activeContests.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">
                Active Contests
              </h4>
              {activeContests.map((contest) => (
                <Link
                  key={contest.id}
                  href={`/leaderboard/${contest.id}`}
                  className="block rounded-lg bg-surface-container-low p-4 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      contest.status === "active" ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                    }`} />
                    <span className="text-on-surface text-sm font-medium">{contest.title}</span>
                  </div>
                  <p className="text-on-surface-variant text-xs mt-1 capitalize">
                    {contest.status === "active" ? "Live now" : "Upcoming"}
                    {" · "}{contest.problemIds?.length || 0} problems
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">
                Recent Activity
              </h4>
              <Link href="/profile" className="text-primary-brand text-xs hover:underline">
                View all
              </Link>
            </div>
            {dataLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-surface-container-low animate-pulse" />
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <p className="text-on-surface-variant text-xs rounded-lg bg-surface-container-low p-4">
                No activity yet. Start solving!
              </p>
            ) : (
              <div className="space-y-2">
                {recentSubmissions.map((sub) => {
                  const slug = sub.problemSlug;
                  const inner = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface text-xs font-medium truncate">
                          {sub.problemTitle || "Unknown problem"}
                        </p>
                        <p className="text-outline text-[10px] mt-0.5">
                          {sub.submittedAt ? formatRelativeTime(sub.submittedAt.seconds) : ""}
                        </p>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        sub.status === "accepted" ? "bg-green-400" : "bg-error-brand"
                      }`} />
                    </>
                  );
                  return slug ? (
                    <Link
                      key={sub.id}
                      href={`/practice/${slug}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
