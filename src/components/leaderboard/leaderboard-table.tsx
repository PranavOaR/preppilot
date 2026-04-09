"use client";

import type { ContestParticipant } from "@/lib/db/contests";

interface LeaderboardTableProps {
  participants: ContestParticipant[];
  currentUserId?: string;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

function getRankDisplay(rank: number) {
  if (rank === 1) return { icon: "military_tech", color: "text-yellow-400" };
  if (rank === 2) return { icon: "workspace_premium", color: "text-gray-300" };
  if (rank === 3) return { icon: "workspace_premium", color: "text-amber-600" };
  return null;
}

export function LeaderboardTable({ participants, currentUserId }: LeaderboardTableProps) {
  if (participants.length === 0) {
    return (
      <div className="rounded-lg bg-surface-container-low subtle-border p-8 text-center">
        <span className="material-symbols-outlined text-[40px] text-outline mb-3 block">
          group_off
        </span>
        <p className="text-on-surface-variant text-sm">
          No participants yet. Be the first to join!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[44px_1fr_60px_80px] sm:grid-cols-[60px_1fr_80px_100px] px-4 sm:px-5 py-3 border-b border-outline-variant/10">
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Rank
        </span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Participant
        </span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">
          Score
        </span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">
          Time
        </span>
      </div>

      {/* Rows */}
      {participants.map((participant, index) => {
        const rank = index + 1;
        const rankDisplay = getRankDisplay(rank);
        const isCurrentUser = participant.userId === currentUserId;

        return (
          <div
            key={participant.id}
            className={`grid grid-cols-[44px_1fr_60px_80px] sm:grid-cols-[60px_1fr_80px_100px] items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-outline-variant/5 transition-colors ${
              isCurrentUser
                ? "bg-primary-container/10 border-l-2 border-l-primary-brand"
                : "hover:bg-surface-container"
            }`}
          >
            {/* Rank */}
            <div className="flex items-center">
              {rankDisplay ? (
                <span className={`material-symbols-outlined text-[20px] ${rankDisplay.color}`}>
                  {rankDisplay.icon}
                </span>
              ) : (
                <span className="font-mono text-on-surface-variant text-sm">
                  {rank}
                </span>
              )}
            </div>

            {/* Username */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isCurrentUser
                    ? "bg-primary-container/30"
                    : "bg-surface-container-high"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isCurrentUser ? "text-primary-brand" : "text-on-surface-variant"
                  }`}
                >
                  {participant.username?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  isCurrentUser ? "text-primary-brand" : "text-on-surface"
                }`}
              >
                {participant.username || "Anonymous"}
                {isCurrentUser && (
                  <span className="ml-2 text-[10px] text-primary-brand/70">(you)</span>
                )}
              </span>
            </div>

            {/* Score */}
            <span className="font-mono text-primary-brand text-sm text-right">
              {participant.score}
            </span>

            {/* Time */}
            <span className="font-mono text-on-surface-variant text-sm text-right">
              {formatTime(participant.totalTime)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
