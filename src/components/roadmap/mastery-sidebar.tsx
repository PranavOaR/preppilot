"use client";

import Link from "next/link";
import type { RoadmapData } from "@/lib/roadmap/engine";

interface MasterySidebarProps {
  roadmap: RoadmapData;
  streak: number;
}

export function MasterySidebar({ roadmap, streak }: MasterySidebarProps) {
  // Count statuses across all sections
  const allTopics = roadmap.sections.flatMap((s) => s.topics);
  const completed = allTopics.filter((t) => t.status === "completed").length;
  const inProgress = allTopics.filter((t) => t.status === "in-progress").length;
  const recommended = allTopics.filter((t) => t.status === "recommended").length;

  return (
    <div className="space-y-4">
      {/* Global Mastery */}
      <div className="rounded-lg bg-surface-container-low p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-on-surface-variant text-sm font-medium">
            Global Mastery
          </h4>
          <span className="text-primary-brand font-mono text-sm font-semibold">
            {roadmap.globalMastery}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-surface-container-high">
          <div
            className="h-2 rounded-full bg-primary-brand transition-all relative"
            style={{ width: `${roadmap.globalMastery}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-brand shadow-[0_0_8px_rgba(188,194,255,0.6)]" />
          </div>
        </div>

        <p className="text-outline text-xs">
          {roadmap.totalSolved} / {roadmap.totalProblems} problems solved
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-lg bg-surface-container-low p-5">
        <div className="divide-y divide-outline-variant/10">
          <div className="flex items-center justify-between py-3">
            <span className="text-on-surface-variant text-sm">Daily Streak</span>
            <span className="font-mono text-on-surface text-sm font-medium">
              {streak} Days
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-on-surface-variant text-sm">Target</span>
            <span className="font-mono text-on-surface text-sm font-medium">
              {roadmap.companyName}
            </span>
          </div>
        </div>
      </div>

      {/* Topic Status Summary */}
      <div className="rounded-lg bg-surface-container-low p-5 space-y-3">
        <h4 className="text-on-surface-variant text-sm font-medium">Progress Breakdown</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-on-surface-variant">Completed</span>
            </div>
            <span className="text-on-surface font-medium">{completed}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-brand" />
              <span className="text-on-surface-variant">In Progress</span>
            </div>
            <span className="text-on-surface font-medium">{inProgress}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-on-surface-variant">Recommended</span>
            </div>
            <span className="text-on-surface font-medium">{recommended}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline-variant" />
              <span className="text-on-surface-variant">Not Started</span>
            </div>
            <span className="text-on-surface font-medium">
              {allTopics.length - completed - inProgress - recommended}
            </span>
          </div>
        </div>
      </div>

      {/* Focus Area */}
      {roadmap.focusArea && (
        <div className="rounded-lg bg-surface-container-low p-5 space-y-3">
          <h4 className="text-on-surface-variant text-sm font-medium">
            Suggested Focus
          </h4>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-yellow-400 text-[24px]">
              target
            </span>
            <div>
              <p className="text-on-surface text-sm font-medium">{roadmap.focusArea}</p>
              <p className="text-outline text-xs mt-0.5">
                Highest priority for {roadmap.companyName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="rounded-lg bg-surface-container-low p-5 space-y-2">
        <Link
          href="/practice"
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">terminal</span>
          All Problems
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          View Profile
        </Link>
      </div>
    </div>
  );
}
