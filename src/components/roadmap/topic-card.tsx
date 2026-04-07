"use client";

import Link from "next/link";
import type { RoadmapTopic } from "@/lib/roadmap/engine";

// Color palette per status
const statusStyles = {
  completed: {
    headerBg: "bg-green-400/10",
    headerBorder: "border-green-400/20",
    iconBg: "bg-green-400/15",
    iconColor: "text-green-400",
    badge: "bg-green-400/15 text-green-400",
    badgeLabel: "Completed",
    barColor: "bg-green-400",
    btnClass: "bg-green-400/10 text-green-400 border border-green-400/25 hover:bg-green-400/20",
    btnLabel: "Review",
    btnIcon: "replay",
  },
  "in-progress": {
    headerBg: "bg-primary-container/10",
    headerBorder: "border-primary-brand/20",
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary-brand",
    badge: "bg-primary-container/20 text-primary-brand",
    badgeLabel: "In Progress",
    barColor: "bg-primary-brand",
    btnClass: "gradient-primary text-on-primary hover:opacity-90",
    btnLabel: "Continue",
    btnIcon: "play_arrow",
  },
  recommended: {
    headerBg: "bg-yellow-400/8",
    headerBorder: "border-yellow-400/20",
    iconBg: "bg-yellow-400/15",
    iconColor: "text-yellow-400",
    badge: "bg-yellow-400/15 text-yellow-400",
    badgeLabel: "Recommended",
    barColor: "bg-yellow-400",
    btnClass: "gradient-primary text-on-primary hover:opacity-90",
    btnLabel: "Start",
    btnIcon: "rocket_launch",
  },
  "not-started": {
    headerBg: "bg-surface-container",
    headerBorder: "border-outline-variant/10",
    iconBg: "bg-surface-container-high",
    iconColor: "text-outline",
    badge: "",
    badgeLabel: "",
    barColor: "bg-outline-variant",
    btnClass: "bg-surface-container-high text-on-surface-variant hover:text-on-surface subtle-border",
    btnLabel: "Start",
    btnIcon: "play_arrow",
  },
};

export function TopicCard({ topic }: { topic: RoadmapTopic }) {
  const s = statusStyles[topic.status];
  const pct =
    topic.progress.total > 0
      ? Math.round((topic.progress.solved / topic.progress.total) * 100)
      : 0;

  // Difficulty label from company weight
  const diffLabel =
    topic.companyWeight >= 8
      ? "High Priority"
      : topic.companyWeight >= 5
      ? "Medium Priority"
      : "Low Priority";
  const diffColor =
    topic.companyWeight >= 8
      ? "text-error-brand bg-error-container/20"
      : topic.companyWeight >= 5
      ? "text-yellow-400 bg-yellow-400/10"
      : "text-outline bg-surface-container-high";

  return (
    <div
      className={`flex flex-col rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${s.headerBorder} bg-surface-container-low`}
    >
      {/* Card header strip */}
      <div className={`px-4 pt-4 pb-3 ${s.headerBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
            <span className={`material-symbols-outlined text-[22px] ${s.iconColor}`}>
              {topic.icon}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            {s.badgeLabel && (
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}>
                {s.badgeLabel}
              </span>
            )}
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${diffColor}`}>
              {diffLabel}
            </span>
          </div>
        </div>

        <h4 className="text-on-surface text-sm font-semibold mt-3 leading-tight">
          {topic.name}
        </h4>
        <p className="text-on-surface-variant text-xs mt-1 line-clamp-2 leading-relaxed">
          {topic.description}
        </p>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 px-4 py-3 flex-1">
        {/* Problem count + accuracy */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">
            <span className={`font-semibold ${s.iconColor}`}>{topic.progress.solved}</span>
            <span className="text-outline">/{topic.progress.total}</span>
            <span className="text-outline ml-1">problems</span>
          </span>
          {topic.progress.attempted > 0 && (
            <span className={`font-medium ${
              topic.accuracy >= 75 ? "text-green-400"
              : topic.accuracy >= 50 ? "text-yellow-400"
              : "text-error-brand"
            }`}>
              {topic.accuracy}% accuracy
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-surface-container-high">
          <div
            className={`h-1.5 rounded-full transition-all ${s.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Card footer — CTA */}
      <div className="px-4 pb-4">
        <Link
          href={`/practice?topic=${topic.slug}&type=${topic.type}`}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${s.btnClass}`}
        >
          <span className="material-symbols-outlined text-[15px]">{s.btnIcon}</span>
          {s.btnLabel}
        </Link>
      </div>
    </div>
  );
}
