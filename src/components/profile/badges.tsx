"use client";

import { ALL_BADGES } from "@/lib/db/badges";

interface BadgeGridProps {
  earnedBadgeIds: string[];
}

export function BadgeGrid({ earnedBadgeIds }: BadgeGridProps) {
  const earned = new Set(earnedBadgeIds);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      {ALL_BADGES.map((badge) => {
        const unlocked = earned.has(badge.id);
        return (
          <div
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-opacity ${
              unlocked
                ? "opacity-100"
                : "opacity-25 grayscale"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                unlocked
                  ? "bg-primary-container/20 text-primary-brand"
                  : "bg-surface-container text-outline"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {badge.icon}
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant text-center leading-tight">
              {badge.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
