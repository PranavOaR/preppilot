"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { TopicCard } from "@/components/roadmap/topic-card";
import { MasterySidebar } from "@/components/roadmap/mastery-sidebar";
import { getUserProgress } from "@/lib/db/progress";
import { getProblems } from "@/lib/db/problems";
import { generateRoadmap, type RoadmapData, type RoadmapSection } from "@/lib/roadmap/engine";

function CollapsibleSection({ section }: { section: RoadmapSection }) {
  const [open, setOpen] = useState(true);
  const completedCount = section.topics.filter((t) => t.status === "completed").length;
  const pct = section.topics.length > 0 ? Math.round((completedCount / section.topics.length) * 100) : 0;

  return (
    <div className="rounded-xl bg-surface-container subtle-border overflow-hidden">
      {/* Header — click to toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-high transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${open ? "rotate-90" : ""} text-on-surface-variant`}
          >
            chevron_right
          </span>
          <div className="text-left">
            <p className="text-on-surface text-sm font-medium">{section.title}</p>
            <p className="text-on-surface-variant text-xs mt-0.5">{section.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-brand rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-primary-brand font-mono font-semibold w-8 text-right">{pct}%</span>
          </div>
          <span className="text-xs text-outline">{completedCount}/{section.topics.length}</span>
        </div>
      </button>

      {/* Topics list */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-outline-variant/10">
          <div className="relative space-y-3 pl-6 pt-4">
            <div className="absolute left-[7px] top-4 bottom-2 w-px bg-primary-brand/20" />
            {section.topics.map((topic) => (
              <div key={topic.slug} className="relative">
                <div
                  className={`absolute -left-6 top-6 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center ${
                    topic.status === "completed"
                      ? "bg-green-400 border-green-400"
                      : topic.status === "in-progress"
                      ? "bg-surface border-primary-brand"
                      : topic.status === "recommended"
                      ? "bg-surface border-yellow-400"
                      : "bg-surface-container border-outline-variant"
                  }`}
                >
                  {topic.status === "completed" && (
                    <span className="material-symbols-outlined text-on-primary text-[10px]">check</span>
                  )}
                </div>
                <TopicCard topic={topic} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const { user, profile } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">progress_activity</span>
        </div>
      </main>
    );
  }

  if (!roadmap) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-outline text-5xl">error</span>
          <h2 className="text-on-surface text-xl mt-4">Could not load your roadmap</h2>
          <p className="text-on-surface-variant text-sm mt-2">Please try refreshing the page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Your Learning Path
        </h1>
        <p className="text-on-surface-variant text-sm mt-3 leading-relaxed">
          Personalized for{" "}
          <span className="text-primary-brand font-medium">{roadmap.companyName}</span>{" "}
          interviews. Click a category to expand or collapse it.
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left — Collapsible sections */}
        <div className="space-y-4">
          {roadmap.sections.map((section) => (
            <CollapsibleSection key={section.title} section={section} />
          ))}
        </div>

        {/* Right — Sidebar */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <MasterySidebar roadmap={roadmap} streak={profile?.currentStreak || 0} />
        </div>
      </div>
    </main>
  );
}
