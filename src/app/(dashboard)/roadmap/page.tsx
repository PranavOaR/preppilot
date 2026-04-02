"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PhaseSection } from "@/components/roadmap/phase-section";
import { MasterySidebar } from "@/components/roadmap/mastery-sidebar";
import { getUserProgress } from "@/lib/db/progress";
import { getProblems } from "@/lib/db/problems";
import { generateRoadmap, type RoadmapData } from "@/lib/roadmap/engine";

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

        // Build progress map
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

        // Build problem count map
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
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  if (!roadmap) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-outline text-5xl">error</span>
          <h2 className="text-on-surface text-xl mt-4">
            Could not load your roadmap
          </h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Please try refreshing the page.
          </p>
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
          interviews. Topics are ordered by priority — focus on the recommended ones first.
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left — Sections */}
        <div className="space-y-10">
          {roadmap.sections.map((section) => (
            <PhaseSection
              key={section.title}
              title={section.title}
              description={section.description}
              topics={section.topics}
            />
          ))}
        </div>

        {/* Right — Sidebar */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <MasterySidebar
            roadmap={roadmap}
            streak={profile?.currentStreak || 0}
          />
        </div>
      </div>
    </main>
  );
}
