"use client";

import Link from "next/link";
import type { RoadmapTopic } from "@/lib/roadmap/engine";

const statusConfig = {
  completed: {
    leftBorder: "border-l-green-400/60",
    iconBg: "bg-green-400/10",
    iconColor: "text-green-400",
    barColor: "bg-green-400",
    btnClass: "bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20",
    btnLabel: "Review",
    btnIcon: "replay",
  },
  "in-progress": {
    leftBorder: "border-l-primary-brand",
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary-brand",
    barColor: "bg-primary-brand",
    btnClass: "gradient-primary text-on-primary hover:opacity-90",
    btnLabel: "Continue",
    btnIcon: "play_arrow",
  },
  recommended: {
    leftBorder: "border-l-yellow-400",
    iconBg: "bg-yellow-400/15",
    iconColor: "text-yellow-400",
    barColor: "bg-yellow-400",
    btnClass: "gradient-primary text-on-primary hover:opacity-90",
    btnLabel: "Start",
    btnIcon: "rocket_launch",
  },
  "not-started": {
    leftBorder: "border-l-outline-variant/20",
    iconBg: "bg-surface-container-high",
    iconColor: "text-outline",
    barColor: "bg-outline-variant",
    btnClass: "bg-surface-container-high text-on-surface-variant hover:text-on-surface subtle-border",
    btnLabel: "Start",
    btnIcon: "play_arrow",
  },
};

export function TopicCard({ topic }: { topic: RoadmapTopic }) {
  const s = statusConfig[topic.status];
  const pct =
    topic.progress.total > 0
      ? Math.round((topic.progress.solved / topic.progress.total) * 100)
      : 0;

  const priorityLabel =
    topic.companyWeight >= 8 ? "High" : topic.companyWeight >= 5 ? "Mid" : "Low";
  const priorityColor =
    topic.companyWeight >= 8
      ? "text-red-400 bg-red-400/10"
      : topic.companyWeight >= 5
      ? "text-yellow-400 bg-yellow-400/10"
      : "text-outline bg-surface-container-high";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low subtle-border border-l-2 ${s.leftBorder} hover:bg-surface-container transition-colors group`}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.iconBg}`}
      >
        <span className={`material-symbols-outlined text-[17px] ${s.iconColor}`}>
          {topic.icon}
        </span>
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-on-surface text-sm font-semibold leading-tight">
            {topic.name}
          </span>
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${priorityColor}`}
          >
            {priorityLabel}
          </span>
        </div>
        <p className="text-on-surface-variant text-xs mt-0.5 truncate leading-relaxed">
          {topic.description}
        </p>
      </div>

      {/* Progress bar + counts */}
      <div className="hidden sm:flex flex-col items-end gap-1 w-24 shrink-0">
        <div className="flex items-center gap-1 text-xs">
          <span className={`font-semibold ${s.iconColor}`}>{topic.progress.solved}</span>
          <span className="text-outline">/ {topic.progress.total}</span>
          {topic.progress.attempted > 0 && (
            <span
              className={`ml-1 font-medium ${
                topic.accuracy >= 75
                  ? "text-green-400"
                  : topic.accuracy >= 50
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {topic.accuracy}%
            </span>
          )}
        </div>
        <div className="w-full h-1 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all ${s.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/practice?topic=${topic.slug}&type=${topic.type}`}
        className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${s.btnClass}`}
      >
        <span className="material-symbols-outlined text-[13px]">{s.btnIcon}</span>
        {s.btnLabel}
      </Link>
    </div>
  );
}
