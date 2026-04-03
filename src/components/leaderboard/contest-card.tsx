"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Contest } from "@/lib/types";

interface ContestCardProps {
  contest: Contest;
  participantCount: number;
  hasJoined: boolean;
  computedStatus: "upcoming" | "active" | "completed";
  onJoin: (contestId: string) => void;
  joining: boolean;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "upcoming":
      return { text: "Upcoming", color: "bg-primary-container/20 text-primary-brand" };
    case "active":
      return { text: "Live", color: "bg-green-500/15 text-green-400" };
    default:
      return { text: "Ended", color: "bg-outline-variant/20 text-on-surface-variant" };
  }
}

function useTimerString(contest: Contest, computedStatus: string): string {
  const [str, setStr] = useState(() => computeTimeStr(contest, computedStatus));

  useEffect(() => {
    if (computedStatus === "completed") return;
    const id = setInterval(() => setStr(computeTimeStr(contest, computedStatus)), 1000);
    return () => clearInterval(id);
  }, [contest, computedStatus]);

  return str;
}

function computeTimeStr(contest: Contest, status: string): string {
  const now = Date.now();
  const startMs = contest.startTime?.seconds ? contest.startTime.seconds * 1000 : 0;
  const endMs = contest.endTime?.seconds ? contest.endTime.seconds * 1000 : 0;

  if (status === "upcoming") {
    const diff = startMs - now;
    if (diff <= 0) return "Starting soon";
    return `Starts in ${formatDiff(diff)}`;
  }

  if (status === "active") {
    const diff = endMs - now;
    if (diff <= 0) return "Ending soon";
    return `Ends in ${formatDiff(diff)}`;
  }

  const ago = now - endMs;
  if (ago < 0) return "Contest ended";
  const days = Math.floor(ago / (1000 * 60 * 60 * 24));
  if (days === 0) return "Ended today";
  if (days === 1) return "Ended 1 day ago";
  return `Ended ${days} days ago`;
}

function formatDiff(diff: number): string {
  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
}

export function ContestCard({
  contest,
  participantCount,
  hasJoined,
  computedStatus,
  onJoin,
  joining,
}: ContestCardProps) {
  const statusLabel = getStatusLabel(computedStatus);
  const timeInfo = useTimerString(contest, computedStatus);
  const isActive = computedStatus === "active";

  function handleTakeContest(e: React.MouseEvent) {
    e.preventDefault();
    const url = `/leaderboard/${contest.id}/take`;
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) w.focus();
  }

  return (
    <div
      className={`rounded-lg bg-surface-container-low subtle-border p-5 space-y-4 hover:bg-surface-container transition-colors ${
        isActive ? "border-l-2 border-l-green-500/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-on-surface font-medium text-base truncate">{contest.title}</h3>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusLabel.color}`}>
              {isActive && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse align-middle" />
              )}
              {statusLabel.text}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm line-clamp-2">{contest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
        <span className={`flex items-center gap-1 ${isActive ? "text-green-400 font-medium" : ""}`}>
          <span className="material-symbols-outlined text-[16px]">timer</span>
          {timeInfo}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">quiz</span>
          {contest.problemIds?.length || 0} problems
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">group</span>
          {participantCount} joined
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/leaderboard/${contest.id}`}
          className="px-4 py-2 rounded-md text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">leaderboard</span>
            View Details
          </span>
        </Link>

        {/* Join button — show when not joined and contest hasn't ended */}
        {!hasJoined && computedStatus !== "completed" && (
          <button
            onClick={() => onJoin(contest.id)}
            disabled={joining}
            className="px-4 py-2 rounded-md text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join Contest"}
          </button>
        )}

        {/* Joined badge when upcoming */}
        {hasJoined && computedStatus === "upcoming" && (
          <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary-container/15 text-primary-brand flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Registered
          </span>
        )}

        {/* Take Contest — only when joined + active */}
        {hasJoined && isActive && (
          <button
            onClick={handleTakeContest}
            className="px-4 py-2 rounded-md text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Take Contest
          </button>
        )}

        {/* Joined badge when completed */}
        {hasJoined && computedStatus === "completed" && (
          <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Participated
          </span>
        )}
      </div>
    </div>
  );
}
