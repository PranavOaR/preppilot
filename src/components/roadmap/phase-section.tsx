"use client";

import { TopicCard } from "./topic-card";
import type { RoadmapTopic } from "@/lib/roadmap/engine";

interface PhaseSectionProps {
  title: string;
  description: string;
  topics: RoadmapTopic[];
}

export function PhaseSection({ title, description, topics }: PhaseSectionProps) {
  const completedCount = topics.filter((t) => t.status === "completed").length;
  const sectionProgress =
    topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-on-surface text-lg font-medium tracking-tight">
            {title}
          </h3>
          <p className="text-on-surface-variant text-xs mt-1">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-primary-brand font-mono text-sm font-semibold">
            {sectionProgress}%
          </span>
          <p className="text-outline text-[10px] mt-0.5">
            {completedCount}/{topics.length} topics
          </p>
        </div>
      </div>

      {/* Topic list with timeline */}
      <div className="relative space-y-3 pl-6">
        {/* Connector line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-primary-brand/20" />

        {topics.map((topic) => (
          <div key={topic.slug} className="relative">
            {/* Timeline dot */}
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
                <span className="material-symbols-outlined text-on-primary text-[10px]">
                  check
                </span>
              )}
            </div>

            <TopicCard topic={topic} />
          </div>
        ))}
      </div>
    </section>
  );
}
