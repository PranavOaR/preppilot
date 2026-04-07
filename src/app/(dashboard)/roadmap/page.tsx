"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { TopicCard } from "@/components/roadmap/topic-card";
import { MasterySidebar } from "@/components/roadmap/mastery-sidebar";
import { getUserProgress } from "@/lib/db/progress";
import { getProblems } from "@/lib/db/problems";
import { generateRoadmap, type RoadmapData, type RoadmapTopic } from "@/lib/roadmap/engine";

type Tab = "all" | "dsa" | "aptitude";

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low overflow-hidden animate-pulse">
      <div className="px-4 pt-4 pb-3 bg-surface-container">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
          <div className="flex-1 space-y-2 mt-1">
            <div className="h-3 bg-surface-container-high rounded w-3/4" />
            <div className="h-2.5 bg-surface-container-high rounded w-full" />
            <div className="h-2.5 bg-surface-container-high rounded w-2/3" />
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-2.5 bg-surface-container-high rounded w-1/3" />
          <div className="h-2.5 bg-surface-container-high rounded w-1/4" />
        </div>
        <div className="h-1.5 bg-surface-container-high rounded-full" />
      </div>
      <div className="px-4 pb-4">
        <div className="h-8 bg-surface-container-high rounded-lg" />
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { user, profile } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  useEffect(() => {
    if (!user) return;

    async function fetchRoadmap() {
      try {
        const [topicProgress, allProblemsResult] = await Promise.all([
          getUserProgress(user!.uid),
          getProblems({ pageSize: 200 }),
        ]);

        const progressMap: Record<string, { solved: number; attempted: number }> = {};
        for (const p of topicProgress) {
          const data = p as Record<string, unknown>;
          const topic = data.topic as string;
          if (topic) {
            progressMap[topic] = {
              solved: (data.problemsSolved as number) || 0,
              attempted: (data.problemsAttempted as number) || 0,
            };
          }
        }

        const problemCountMap: Record<string, number> = {};
        for (const problem of allProblemsResult.problems) {
          problemCountMap[problem.topic] = (problemCountMap[problem.topic] || 0) + 1;
        }

        const targetCompany = profile?.targetCompany || "General";
        const data = generateRoadmap(targetCompany, progressMap, problemCountMap);
        setRoadmap(data);
      } catch (err) {
        console.error("Failed to generate roadmap:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRoadmap();
  }, [user, profile]);

  // Derive topic lists for the active tab
  const allTopics: RoadmapTopic[] = roadmap
    ? roadmap.sections.flatMap((s) => s.topics)
    : [];

  const dsaTopics = roadmap?.sections.find((s) =>
    s.title.includes("Data Structures")
  )?.topics ?? [];
  const aptitudeTopics = roadmap?.sections.find((s) =>
    s.title.includes("Aptitude")
  )?.topics ?? [];

  const visibleTopics =
    activeTab === "dsa"
      ? dsaTopics
      : activeTab === "aptitude"
      ? aptitudeTopics
      : allTopics;

  // Status counts for summary bar
  const completed = allTopics.filter((t) => t.status === "completed").length;
  const inProgress = allTopics.filter((t) => t.status === "in-progress").length;
  const recommended = allTopics.filter((t) => t.status === "recommended").length;
  const notStarted = allTopics.filter((t) => t.status === "not-started").length;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Your Learning Roadmap
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          {roadmap
            ? <>Personalised for <span className="text-primary-brand font-medium">{roadmap.companyName}</span> — work through topics in priority order.</>
            : "Loading your personalised roadmap..."}
        </p>
      </div>

      {/* Summary stats row */}
      {!loading && roadmap && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Completed", value: completed, color: "text-green-400", dot: "bg-green-400" },
            { label: "In Progress", value: inProgress, color: "text-primary-brand", dot: "bg-primary-brand" },
            { label: "Recommended", value: recommended, color: "text-yellow-400", dot: "bg-yellow-400" },
            { label: "Not Started", value: notStarted, color: "text-outline", dot: "bg-outline-variant" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-surface-container-low subtle-border px-4 py-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stat.dot}`} />
              <div>
                <p className={`text-lg font-semibold font-mono leading-none ${stat.color}`}>{stat.value}</p>
                <p className="text-on-surface-variant text-xs mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Left — Quest grid */}
        <div className="space-y-5">
          {/* Tab selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low subtle-border w-fit">
            {(["all", "dsa", "aptitude"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-primary-container/20 text-primary-brand shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab === "all" ? "All Topics" : tab === "dsa" ? "DSA" : "Aptitude"}
                {!loading && roadmap && (
                  <span className="ml-1.5 text-xs text-outline">
                    ({tab === "all" ? allTopics.length : tab === "dsa" ? dsaTopics.length : aptitudeTopics.length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visibleTopics.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low subtle-border p-12 text-center">
              <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
              <p className="text-on-surface-variant text-sm mt-3">No topics found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleTopics.map((topic) => (
                <TopicCard key={topic.slug} topic={topic} />
              ))}
            </div>
          )}
        </div>

        {/* Right — Mastery sidebar */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[80, 60, 120, 90].map((h, i) => (
                <div key={i} className={`h-${h} rounded-xl bg-surface-container-low`} style={{ height: h }} />
              ))}
            </div>
          ) : roadmap ? (
            <MasterySidebar roadmap={roadmap} streak={profile?.currentStreak || 0} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
