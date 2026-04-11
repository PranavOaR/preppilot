"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { joinContest, hasUserJoinedContest } from "@/lib/db/contests";
import { getProblemById } from "@/lib/db/problems";
import { getUserSolvedProblems } from "@/lib/db/submissions";
import { useContestRealtime } from "@/hooks/use-contest-realtime";
import { useLeaderboardRealtime } from "@/hooks/use-leaderboard-realtime";
import { useContestStatus } from "@/hooks/use-contest-status";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import type { Contest, Problem } from "@/lib/types";

function useCountdown(contest: Contest | null, computedStatus: string | null) {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    if (!contest || !computedStatus) return;

    function update() {
      if (!contest || !computedStatus) return;
      const now = Date.now();
      const startMs = contest.startTime?.seconds ? contest.startTime.seconds * 1000 : 0;
      const endMs = contest.endTime?.seconds ? contest.endTime.seconds * 1000 : 0;

      let diff = 0;
      let prefix = "";

      if (computedStatus === "upcoming") {
        diff = startMs - now;
        prefix = "Starts in ";
      } else if (computedStatus === "active") {
        diff = endMs - now;
        prefix = "Ends in ";
      } else {
        const ago = now - endMs;
        if (ago < 0) {
          setTimeStr("Contest ended");
          return;
        }
        const days = Math.floor(ago / (1000 * 60 * 60 * 24));
        if (days === 0) setTimeStr("Ended today");
        else if (days === 1) setTimeStr("Ended yesterday");
        else setTimeStr(`Ended ${days} days ago`);
        return;
      }

      if (diff <= 0) {
        setTimeStr(computedStatus === "upcoming" ? "Starting soon" : "Ending soon");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        setTimeStr(`${prefix}${days}d ${remHours}h`);
      } else {
        setTimeStr(`${prefix}${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    }

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [contest, computedStatus]);

  return timeStr;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "upcoming":
      return { text: "Upcoming", color: "bg-primary-container/20 text-primary-brand", icon: "schedule" };
    case "active":
      return { text: "Live", color: "bg-green-500/15 text-green-400", icon: "radio_button_checked" };
    case "completed":
      return { text: "Ended", color: "bg-outline-variant/20 text-on-surface-variant", icon: "check_circle" };
    default:
      return { text: "Unknown", color: "bg-outline-variant/20 text-on-surface-variant", icon: "help" };
  }
}

export default function ContestDetailPage() {
  const params = useParams();
  const contestId = params.id as string;
  const { user, profile } = useAuth();

  const { contest, loading: contestLoading } = useContestRealtime(contestId);
  const { participants } = useLeaderboardRealtime(contestId);
  const computedStatus = useContestStatus(contest);
  const timeStr = useCountdown(contest, computedStatus);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!contest) return;
    try {
      setDataLoading(true);

      if (contest.problemIds?.length) {
        const problemResults = await Promise.all(
          contest.problemIds.map((pid) => getProblemById(pid))
        );
        setProblems(problemResults.filter(Boolean) as Problem[]);
      }

      if (user) {
        const [joined, solvedIds] = await Promise.all([
          hasUserJoinedContest(contestId, user.uid),
          getUserSolvedProblems(user.uid),
        ]);
        setHasJoined(joined);
        setSolvedProblemIds(new Set(solvedIds));
      }
    } catch (err) {
      console.error("Failed to load contest data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [contest, contestId, user]);

  useEffect(() => {
    if (!contestLoading && contest) loadData();
  }, [contestLoading, contest, loadData]);

  const handleJoin = async () => {
    if (!user || !profile) return;
    try {
      setJoining(true);
      await joinContest(contestId, user.uid, profile.username || profile.displayName || "Anonymous");
      setHasJoined(true);
    } catch (err) {
      console.error("Failed to join contest:", err);
    } finally {
      setJoining(false);
    }
  };

  if (contestLoading || dataLoading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="h-8 w-48 bg-surface-container-low rounded animate-pulse" />
        <div className="h-40 bg-surface-container-low rounded-lg animate-pulse" />
        <div className="h-64 bg-surface-container-low rounded-lg animate-pulse" />
      </main>
    );
  }

  if (!contest) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-lg bg-surface-container-low subtle-border p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">
            error_outline
          </span>
          <p className="text-on-surface-variant text-sm">Contest not found.</p>
          <Link
            href="/leaderboard"
            className="inline-block mt-4 px-4 py-2 text-xs font-medium text-primary-brand hover:underline"
          >
            Back to Contests
          </Link>
        </div>
      </main>
    );
  }

  const status = computedStatus || contest.status;
  const statusBadge = getStatusBadge(status);
  const solvedInContest = problems.filter((p) => solvedProblemIds.has(p.id)).length;
  const totalProblems = problems.length;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Back Link */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1 text-on-surface-variant text-sm hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        All Contests
      </Link>

      {/* Hero / Contest Info Card */}
      <div className="rounded-xl bg-surface-container-low subtle-border overflow-hidden">
        {/* Status Banner */}
        {status === "active" && (
          <div className="px-6 py-2.5 bg-green-500/10 border-b border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
              <span className="text-green-400 text-sm font-medium">Contest is Live</span>
            </div>
            <span className="font-mono text-green-400 text-sm font-semibold">{timeStr}</span>
          </div>
        )}

        {status === "upcoming" && (
          <div className="px-6 py-2.5 bg-primary-container/10 border-b border-primary-brand/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-brand">schedule</span>
              <span className="text-primary-brand text-sm font-medium">Upcoming</span>
            </div>
            <span className="font-mono text-primary-brand text-sm font-semibold">{timeStr}</span>
          </div>
        )}

        {status === "completed" && (
          <div className="px-6 py-2.5 bg-outline-variant/10 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">flag</span>
              <span className="text-on-surface-variant text-sm font-medium">{timeStr}</span>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <span className="material-symbols-outlined text-primary-brand text-[26px] shrink-0">emoji_events</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-xl sm:text-2xl text-on-surface font-medium tracking-tight">
                    {contest.title}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>
                <p className="text-on-surface-variant text-sm mt-1">
                  {contest.description}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <span className="material-symbols-outlined text-[20px] text-primary-brand mb-1 block">quiz</span>
              <p className="text-on-surface font-semibold text-lg">{totalProblems}</p>
              <p className="text-on-surface-variant text-[11px]">Problems</p>
            </div>
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <span className="material-symbols-outlined text-[20px] text-primary-brand mb-1 block">group</span>
              <p className="text-on-surface font-semibold text-lg">{participants.length}</p>
              <p className="text-on-surface-variant text-[11px]">Participants</p>
            </div>
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <span className="material-symbols-outlined text-[20px] text-primary-brand mb-1 block">hourglass_top</span>
              <p className="text-on-surface font-semibold text-lg">{contest.duration || "--"}</p>
              <p className="text-on-surface-variant text-[11px]">Min Duration</p>
            </div>
            {hasJoined && (
              <div className="rounded-lg bg-surface-container p-3 text-center">
                <span className="material-symbols-outlined text-[20px] text-green-400 mb-1 block">task_alt</span>
                <p className="text-on-surface font-semibold text-lg">{solvedInContest}/{totalProblems}</p>
                <p className="text-on-surface-variant text-[11px]">Solved</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            {(status === "upcoming" || status === "active") && !hasJoined && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-5 py-2.5 rounded-md text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                {joining ? "Joining..." : "Join Contest"}
              </button>
            )}
            {hasJoined && status === "active" && (
              <Link
                href={`/leaderboard/${contest.id}/take`}
                className="px-5 py-2.5 rounded-md text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Take Contest
              </Link>
            )}
            {hasJoined && (
              <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Joined
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Problems Section — hidden for upcoming contests to prevent cheating */}
      {problems.length > 0 && computedStatus !== "upcoming" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-[22px]">assignment</span>
            <h2 className="font-serif text-xl text-on-surface font-medium">Problems</h2>
          </div>

          <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_70px_50px] sm:grid-cols-[1fr_90px_90px_60px] px-4 sm:px-5 py-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Problem</span>
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-center">Difficulty</span>
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-center hidden sm:block">Type</span>
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-center">Status</span>
            </div>

            {problems.map((problem, i) => {
              const solved = solvedProblemIds.has(problem.id);
              const diffColors: Record<string, string> = {
                easy: "text-green-400",
                medium: "text-yellow-400",
                hard: "text-red-400",
              };
              return (
                <div
                  key={problem.id}
                  className={`grid grid-cols-[1fr_70px_50px] sm:grid-cols-[1fr_90px_90px_60px] items-center px-4 sm:px-5 py-3.5 border-b border-outline-variant/5 transition-colors hover:bg-surface-container ${
                    solved ? "bg-green-500/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-on-surface-variant text-xs font-mono w-5 shrink-0">{i + 1}</span>
                    <Link
                      href={`/practice/${problem.slug}`}
                      className="text-on-surface text-sm font-medium hover:text-primary-brand transition-colors truncate"
                    >
                      {problem.title}
                    </Link>
                  </div>
                  <span className={`text-xs font-medium text-center capitalize ${diffColors[problem.difficulty] || "text-on-surface-variant"}`}>
                    {problem.difficulty}
                  </span>
                  <span className="text-xs text-on-surface-variant text-center capitalize hidden sm:block">
                    {problem.type}
                  </span>
                  <div className="flex justify-center">
                    {solved ? (
                      <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">radio_button_unchecked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-[22px]">leaderboard</span>
            <h2 className="font-serif text-xl text-on-surface font-medium">Leaderboard</h2>
          </div>
          <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            Live updates
          </span>
        </div>

        <LeaderboardTable
          participants={participants}
          currentUserId={user?.uid}
        />
      </div>
    </main>
  );
}
