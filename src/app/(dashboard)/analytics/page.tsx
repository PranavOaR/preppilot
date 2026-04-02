"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserAnalytics, type UserAnalytics } from "@/lib/db/analytics";
import { TopicRadar } from "@/components/analytics/topic-radar";
import { PercentileCard } from "@/components/analytics/percentile-card";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const data = await getUserAnalytics(user!.uid);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Track your strengths, identify weak areas, and see how you compare.
        </p>
      </div>

      {analytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Percentile Card */}
          <PercentileCard
            percentile={analytics.percentile}
            totalAttempted={analytics.totalAttempted}
            totalCorrect={analytics.totalCorrect}
            overallAccuracy={analytics.overallAccuracy}
          />

          {/* Quick Insights */}
          <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-4">
            <h3 className="text-on-surface font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary-brand">
                lightbulb
              </span>
              Insights
            </h3>

            <div className="space-y-3">
              {analytics.topicAccuracies.length > 0 && (
                <>
                  {/* Best topic */}
                  {(() => {
                    const best = [...analytics.topicAccuracies]
                      .filter((t) => t.attempted >= 2)
                      .sort((a, b) => b.accuracy - a.accuracy)[0];
                    return best ? (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5">
                        <span className="material-symbols-outlined text-green-400 text-[20px] mt-0.5">
                          trending_up
                        </span>
                        <div>
                          <p className="text-on-surface text-sm font-medium">
                            Strongest: {best.topic.replace(/-/g, " ")}
                          </p>
                          <p className="text-on-surface-variant text-xs">
                            {best.accuracy}% accuracy across {best.attempted} attempts
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Weakest topic */}
                  {(() => {
                    const weak = [...analytics.topicAccuracies]
                      .filter((t) => t.attempted >= 2)
                      .sort((a, b) => a.accuracy - b.accuracy)[0];
                    return weak && weak.accuracy < 70 ? (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5">
                        <span className="material-symbols-outlined text-red-400 text-[20px] mt-0.5">
                          trending_down
                        </span>
                        <div>
                          <p className="text-on-surface text-sm font-medium">
                            Needs Work: {weak.topic.replace(/-/g, " ")}
                          </p>
                          <p className="text-on-surface-variant text-xs">
                            {weak.accuracy}% accuracy — focus your practice here
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Practice suggestion */}
                  {analytics.totalAttempted < 10 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary-container/5">
                      <span className="material-symbols-outlined text-primary-brand text-[20px] mt-0.5">
                        info
                      </span>
                      <div>
                        <p className="text-on-surface text-sm font-medium">Keep Practicing</p>
                        <p className="text-on-surface-variant text-xs">
                          Solve more problems to unlock detailed insights and accurate percentile rankings.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {analytics.topicAccuracies.length === 0 && (
                <p className="text-on-surface-variant text-sm">
                  Start solving problems to generate performance insights.
                </p>
              )}
            </div>
          </div>

          {/* Topic Radar - Full Width */}
          <div className="lg:col-span-2">
            <TopicRadar data={analytics.topicAccuracies} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container-low subtle-border p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">
            insights
          </span>
          <p className="text-on-surface-variant text-sm">
            No analytics data yet. Start solving problems to see your performance breakdown.
          </p>
        </div>
      )}
    </main>
  );
}
