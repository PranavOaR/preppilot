"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { TopicCard } from "@/components/roadmap/topic-card";
import { MasterySidebar } from "@/components/roadmap/mastery-sidebar";
import { getUserProgress } from "@/lib/db/progress";
import { getProblems } from "@/lib/db/problems";
import {
  generateRoadmap,
  type RoadmapData,
  type RoadmapTopic,
} from "@/lib/roadmap/engine";

type Filter = "all" | "dsa" | "aptitude";

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low subtle-border animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-surface-container-high shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-surface-container-high rounded w-1/3" />
        <div className="h-2.5 bg-surface-container-high rounded w-2/3" />
      </div>
      <div className="hidden sm:block w-24 space-y-1.5">
        <div className="h-2.5 bg-surface-container-high rounded" />
        <div className="h-1 bg-surface-container-high rounded-full" />
      </div>
      <div className="w-16 h-7 bg-surface-container-high rounded-lg shrink-0" />
    </div>
  );
}

// ── Status section ────────────────────────────────────────────────────────────
interface StatusSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  topics: RoadmapTopic[];
  defaultOpen?: boolean;
  muted?: boolean;
}

function StatusSection({
  title,
  icon,
  iconColor,
  topics,
  defaultOpen = true,
  muted = false,
}: StatusSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (topics.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 py-2 text-left group"
      >
        <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>
          {icon}
        </span>
        <span className={`text-sm font-semibold ${muted ? "text-on-surface-variant" : "text-on-surface"}`}>
          {title}
        </span>
        <span className="text-xs text-outline font-mono bg-surface-container-high px-1.5 py-0.5 rounded-full">
          {topics.length}
        </span>
        <span
          className={`material-symbols-outlined text-[16px] text-outline ml-auto transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="space-y-2 mt-1">
          {topics.map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { user, profile } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!user) return;

    async function fetchRoadmap() {
      try {
        const [topicProgress, allProblemsResult] = await Promise.all([
          getUserProgress(user!.uid),
          getProblems({ pageSize: 200 }),
        ]);

        const progressMap: Record<string, { solved: number; attempted: number }> =
          {};
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
          problemCountMap[problem.topic] =
            (problemCountMap[problem.topic] || 0) + 1;
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

  // Derive topic list based on active filter
  const allTopics: RoadmapTopic[] = roadmap
    ? roadmap.sections.flatMap((s) => s.topics)
    : [];

  const dsaTopics =
    roadmap?.sections.find((s) => s.title.includes("Data Structures"))?.topics ??
    [];
  const aptitudeTopics =
    roadmap?.sections.find((s) => s.title.includes("Aptitude"))?.topics ?? [];

  const sourceTopics =
    filter === "dsa"
      ? dsaTopics
      : filter === "aptitude"
      ? aptitudeTopics
      : allTopics;

  // Group by status
  const inProgress = sourceTopics.filter((t) => t.status === "in-progress");
  const recommended = sourceTopics.filter((t) => t.status === "recommended");
  const notStarted = sourceTopics.filter((t) => t.status === "not-started");
  const completed = sourceTopics.filter((t) => t.status === "completed");

  const isEmpty =
    !loading &&
    inProgress.length === 0 &&
    recommended.length === 0 &&
    notStarted.length === 0 &&
    completed.length === 0;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Your Learning Roadmap
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          {roadmap ? (
            <>
              Personalised for{" "}
              <span className="text-primary-brand font-medium">
                {roadmap.companyName}
              </span>{" "}
              — topics ordered by priority.
            </>
          ) : (
            "Loading your personalised roadmap..."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-8">
        {/* ── Left: topic list ───────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          {/* Filter toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low subtle-border w-fit">
            {(["all", "dsa", "aptitude"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-primary-container/20 text-primary-brand shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {f === "all" ? "All Topics" : f === "dsa" ? "DSA" : "Aptitude"}
                {!loading && roadmap && (
                  <span className="ml-1.5 text-xs text-outline">
                    (
                    {f === "all"
                      ? allTopics.length
                      : f === "dsa"
                      ? dsaTopics.length
                      : aptitudeTopics.length}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sections */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="rounded-xl bg-surface-container-low subtle-border p-12 text-center">
              <span className="material-symbols-outlined text-outline text-5xl">
                search_off
              </span>
              <p className="text-on-surface-variant text-sm mt-3">
                No topics found.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <StatusSection
                title="In Progress"
                icon="pending"
                iconColor="text-primary-brand"
                topics={inProgress}
              />
              <StatusSection
                title="Up Next"
                icon="rocket_launch"
                iconColor="text-yellow-400"
                topics={recommended}
              />
              <StatusSection
                title="Not Started"
                icon="radio_button_unchecked"
                iconColor="text-outline"
                topics={notStarted}
              />
              <StatusSection
                title="Completed"
                icon="check_circle"
                iconColor="text-green-400"
                topics={completed}
                defaultOpen={false}
                muted
              />
            </div>
          )}
        </div>

        {/* ── Right: sidebar ─────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[96, 140, 80, 96].map((h, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-surface-container-low"
                  style={{ height: h }}
                />
              ))}
            </div>
          ) : roadmap ? (
            <MasterySidebar
              roadmap={roadmap}
              streak={profile?.currentStreak || 0}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
