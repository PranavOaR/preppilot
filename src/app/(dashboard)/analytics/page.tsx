"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserAnalytics, type UserAnalytics } from "@/lib/db/analytics";
import { getActivityLog } from "@/lib/db/activity";
import { PercentileCard } from "@/components/analytics/percentile-card";
import { TopicRadar } from "@/components/analytics/topic-radar";

interface ActivityDay {
  id: string;
  date: string;
  problemsSolved: number;
  xpEarned: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const rankRes = await fetch("/api/user/rank", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rankData = rankRes.ok ? await rankRes.json() : { percentile: 0 };

        const [analyticsData, activityData] = await Promise.all([
          getUserAnalytics(user!.uid, rankData.percentile ?? 0),
          getActivityLog(user!.uid, 90),
        ]);
        setAnalytics(analyticsData);
        setActivity(activityData as ActivityDay[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  if (!analytics) return null;

  // Build weekly XP chart data (last 12 weeks)
  const weeklyXP = buildWeeklyXP(activity);
  const maxWeeklyXP = Math.max(...weeklyXP.map((w) => w.xp), 1);

  // Solve velocity: problems solved per week over last 8 weeks
  const solveVelocity = buildWeeklyVelocity(activity);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium">Analytics</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Track your performance and progress over time
        </p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PercentileCard
          percentile={analytics.percentile}
          totalAttempted={analytics.totalAttempted}
          totalCorrect={analytics.totalCorrect}
          overallAccuracy={analytics.overallAccuracy}
        />
        <TopicRadar data={analytics.topicAccuracies.slice(0, 8)} />
      </div>

      {/* XP Over Time */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-4">
        <h3 className="text-on-surface font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary-brand">trending_up</span>
          XP Earned (Last 12 Weeks)
        </h3>
        {weeklyXP.every((w) => w.xp === 0) ? (
          <p className="text-on-surface-variant text-sm text-center py-6">
            No XP data yet. Start solving problems!
          </p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {weeklyXP.map((week) => (
              <div
                key={week.label}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <div
                  className="w-full rounded-t-sm bg-primary-brand/40 hover:bg-primary-brand/70 transition-colors relative"
                  style={{ height: `${(week.xp / maxWeeklyXP) * 100}%`, minHeight: week.xp > 0 ? "4px" : "0" }}
                  title={`${week.label}: ${week.xp} XP`}
                />
                <span className="text-[9px] text-outline rotate-0 leading-none">{week.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solve Velocity + Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solve Velocity */}
        <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-4">
          <h3 className="text-on-surface font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary-brand">speed</span>
            Solve Velocity (Last 8 Weeks)
          </h3>
          {solveVelocity.every((w) => w.solved === 0) ? (
            <p className="text-on-surface-variant text-sm text-center py-6">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {solveVelocity.map((week) => (
                <div key={week.label} className="flex items-center gap-3">
                  <span className="text-outline text-xs w-8 shrink-0">{week.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500/50 transition-all duration-500"
                      style={{
                        width: `${(week.solved / Math.max(...solveVelocity.map((w) => w.solved), 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-on-surface-variant text-xs w-6 text-right">{week.solved}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Topics */}
        <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-4">
          <h3 className="text-on-surface font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary-brand">emoji_events</span>
            Strongest Topics
          </h3>
          {analytics.topicAccuracies.length === 0 ? (
            <p className="text-on-surface-variant text-sm text-center py-6">
              Solve problems to see your strongest topics.
            </p>
          ) : (
            <div className="space-y-3">
              {[...analytics.topicAccuracies]
                .sort((a, b) => b.accuracy - a.accuracy)
                .slice(0, 5)
                .map((t, i) => (
                  <div key={t.topic} className="flex items-center gap-3">
                    <span className="text-on-surface-variant text-xs font-mono w-4">#{i + 1}</span>
                    <span className="text-on-surface text-sm flex-1 capitalize">
                      {t.topic.replace(/-/g, " ")}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        t.accuracy >= 70
                          ? "text-green-400"
                          : t.accuracy >= 40
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {t.accuracy}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function buildWeeklyXP(activity: ActivityDay[]): { label: string; xp: number }[] {
  const weeks: { label: string; xp: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - i * 7 - now.getUTCDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    const label = `W${12 - i}`;
    const xp = activity
      .filter((a) => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, a) => sum + (a.xpEarned || 0), 0);
    weeks.push({ label, xp });
  }
  return weeks;
}

function buildWeeklyVelocity(activity: ActivityDay[]): { label: string; solved: number }[] {
  const weeks: { label: string; solved: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - i * 7 - now.getUTCDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    const label = `W${8 - i}`;
    const solved = activity
      .filter((a) => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, a) => sum + (a.problemsSolved || 0), 0);
    weeks.push({ label, solved });
  }
  return weeks;
}
