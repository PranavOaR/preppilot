"use client";

import Link from "next/link";
import type { RoadmapData } from "@/lib/roadmap/engine";

interface MasterySidebarProps {
  roadmap: RoadmapData;
  streak: number;
}

export function MasterySidebar({ roadmap, streak }: MasterySidebarProps) {
  const allTopics = roadmap.sections.flatMap((s) => s.topics);
  const completed = allTopics.filter((t) => t.status === "completed").length;
  const inProgress = allTopics.filter((t) => t.status === "in-progress").length;
  const recommended = allTopics.filter((t) => t.status === "recommended").length;
  const notStarted = allTopics.filter(
    (t) => t.status === "not-started"
  ).length;

  const mastery = roadmap.globalMastery;

  // SVG ring dimensions
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (mastery / 100) * circ;

  return (
    <div className="space-y-3">
      {/* Mastery ring */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="text-surface-container-high"
              />
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                className="text-primary-brand transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono font-semibold text-on-surface text-base">
                {mastery}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-on-surface text-sm font-semibold">Global Mastery</p>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {roadmap.totalSolved} / {roadmap.totalProblems} problems
            </p>
            <p className="text-outline text-xs mt-1">
              For{" "}
              <span className="text-primary-brand font-medium">
                {roadmap.companyName}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress breakdown */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-4">
        <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-3">
          Breakdown
        </p>
        <div className="space-y-2">
          {[
            { label: "Completed", count: completed, dot: "bg-green-400" },
            { label: "In Progress", count: inProgress, dot: "bg-primary-brand" },
            { label: "Up Next", count: recommended, dot: "bg-yellow-400" },
            { label: "Not Started", count: notStarted, dot: "bg-outline-variant" },
          ].map(({ label, count, dot }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-on-surface-variant text-xs">{label}</span>
              </div>
              <span className="text-on-surface text-xs font-semibold font-mono">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak + Target */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-4 space-y-0 divide-y divide-outline-variant/10">
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-[16px] text-orange-400">
              local_fire_department
            </span>
            Streak
          </div>
          <span className="text-on-surface text-sm font-semibold font-mono">
            {streak}d
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-[16px] text-outline">
              apartment
            </span>
            Target
          </div>
          <span className="text-on-surface text-sm font-semibold">
            {roadmap.companyName}
          </span>
        </div>
      </div>

      {/* Focus area */}
      {roadmap.focusArea && (
        <div className="rounded-xl bg-yellow-400/5 border border-yellow-400/15 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-yellow-400 text-[20px] mt-0.5">
              target
            </span>
            <div>
              <p className="text-on-surface-variant text-xs uppercase tracking-wider font-medium mb-1">
                Focus Now
              </p>
              <p className="text-on-surface text-sm font-semibold">
                {roadmap.focusArea}
              </p>
              <p className="text-outline text-xs mt-0.5">
                Highest priority for {roadmap.companyName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-4 space-y-1">
        {[
          { href: "/practice", icon: "terminal", label: "All Problems" },
          { href: "/profile", icon: "person", label: "View Profile" },
          { href: "/settings", icon: "tune", label: "Change Target" },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
          >
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
