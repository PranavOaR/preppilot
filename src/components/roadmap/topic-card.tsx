"use client";

import Link from "next/link";
import type { RoadmapTopic } from "@/lib/roadmap/engine";

const statusConfig = {
  completed: {
    icon: "check_circle",
    iconClass: "text-green-400",
    borderClass: "border-green-400/20",
    bgClass: "bg-green-400/5",
    label: "Completed",
    labelClass: "bg-green-400/10 text-green-400",
  },
  "in-progress": {
    icon: "play_circle",
    iconClass: "text-primary-brand",
    borderClass: "border-primary-brand/20",
    bgClass: "bg-primary-brand/5",
    label: "In Progress",
    labelClass: "bg-primary-container/30 text-primary-brand",
  },
  recommended: {
    icon: "star",
    iconClass: "text-yellow-400",
    borderClass: "border-yellow-400/20",
    bgClass: "bg-yellow-400/5",
    label: "Recommended",
    labelClass: "bg-yellow-400/10 text-yellow-400",
  },
  "not-started": {
    icon: "circle",
    iconClass: "text-outline",
    borderClass: "border-outline-variant/10",
    bgClass: "bg-surface-container",
    label: "",
    labelClass: "",
  },
};

export function TopicCard({ topic }: { topic: RoadmapTopic }) {
  const config = statusConfig[topic.status];
  const progressPct =
    topic.progress.total > 0
      ? Math.round((topic.progress.solved / topic.progress.total) * 100)
      : 0;

  return (
    <div
      className={`relative rounded-lg p-5 border transition-colors ${config.borderClass} ${config.bgClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Title row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`material-symbols-outlined text-[20px] ${config.iconClass}`}>
              {topic.icon}
            </span>
            <h4 className="text-on-surface text-base font-medium">{topic.name}</h4>
            {config.label && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${config.labelClass}`}
              >
                {config.label}
              </span>
            )}
            {topic.companyWeight >= 8 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-error-container/30 text-error-brand">
                High Priority
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {topic.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-on-surface-variant">
              <span className="text-on-surface font-medium">{topic.progress.solved}</span>
              /{topic.progress.total} solved
            </span>
            {topic.progress.attempted > 0 && (
              <span className="text-on-surface-variant">
                Accuracy:{" "}
                <span
                  className={`font-medium ${
                    topic.accuracy >= 75
                      ? "text-green-400"
                      : topic.accuracy >= 50
                        ? "text-yellow-400"
                        : "text-error"
                  }`}
                >
                  {topic.accuracy}%
                </span>
              </span>
            )}
          </div>

          {/* Progress bar */}
          {topic.progress.total > 0 && (
            <div className="w-full h-1.5 rounded-full bg-surface-container-high">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  topic.status === "completed"
                    ? "bg-green-400"
                    : topic.status === "in-progress"
                      ? "bg-primary-brand"
                      : topic.status === "recommended"
                        ? "bg-yellow-400"
                        : "bg-outline-variant"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Practice button */}
        <Link
          href={`/practice?topic=${topic.slug}&type=${topic.type}`}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            topic.status === "recommended"
              ? "gradient-primary text-on-primary hover:opacity-90"
              : topic.status === "completed"
                ? "bg-green-400/10 text-green-400 hover:bg-green-400/20"
                : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {topic.status === "completed" ? "refresh" : "play_arrow"}
          </span>
          {topic.status === "completed" ? "Review" : "Practice"}
        </Link>
      </div>
    </div>
  );
}
