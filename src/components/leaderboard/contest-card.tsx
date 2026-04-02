"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Contest } from "@/lib/types";

interface ContestCardProps {
  contest: Contest;
  participantCount: number;
  hasJoined: boolean;
  onJoin: (contestId: string) => void;
  joining: boolean;
}

function getStatusLabel(status: Contest["status"]) {
  switch (status) {
    case "upcoming":
      return { text: "Upcoming", color: "bg-primary-container/20 text-primary-brand" };
    case "active":
      return { text: "Live", color: "bg-green-500/15 text-green-400" };
    case "completed":
      return { text: "Ended", color: "bg-outline-variant/20 text-on-surface-variant" };
  }
}

function useTimerString(contest: Contest): string {
  const [str, setStr] = useState(() => computeTimeStr(contest));

  useEffect(() => {
    // Only tick for non-completed contests
    if (contest.status === "completed") return;

    const id = setInterval(() => {
      setStr(computeTimeStr(contest));
    }, 1000);
    return () => clearInterval(id);
  }, [contest]);

  return str;
}

function computeTimeStr(contest: Contest): string {
  const now = Date.now();
  const startMs = contest.startTime?.seconds ? contest.startTime.seconds * 1000 : 0;
  const endMs = contest.endTime?.seconds ? contest.endTime.seconds * 1000 : 0;

  if (contest.status === "upcoming") {
    const diff = startMs - now;
    if (diff <= 0) return "Starting soon";
    return `Starts in ${formatDiff(diff)}`;
  }

  if (contest.status === "active") {
    const diff = endMs - now;
    if (diff <= 0) return "Ending soon";
    return `Ends in ${formatDiff(diff)}`;
  }

  // completed
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
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  return `${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
}

export function ContestCard({ contest, participantCount, hasJoined, onJoin, joining }: ContestCardProps) {
  const status = getStatusLabel(contest.status);
  const timeInfo = useTimerString(contest);

  return (
    <div className={`rounded-lg bg-surface-container-low subtle-border p-5 space-y-4 hover:bg-surface-container transition-colors ${
      contest.status === "active" ? "border-l-2 border-l-green-500/50" : ""
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-on-surface font-medium text-base truncate">
              {contest.title}
            </h3>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.color}`}>
              {contest.status === "active" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse align-middle" />
              )}
              {status.text}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm line-clamp-2">
            {contest.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
        <span className={`flex items-center gap-1 ${
          contest.status === "active" ? "text-green-400 font-medium" : ""
        }`}>
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
            View Leaderboard
          </span>
        </Link>
        {(contest.status === "upcoming" || contest.status === "active") && !hasJoined && (
          <button
            onClick={() => onJoin(contest.id)}
            disabled={joining}
            className="px-4 py-2 rounded-md text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join Contest"}
          </button>
        )}
        {hasJoined && (
          <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Joined
          </span>
        )}
      </div>
    </div>
  );
}
