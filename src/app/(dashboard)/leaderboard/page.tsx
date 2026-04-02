"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getContestParticipants, joinContest, hasUserJoinedContest } from "@/lib/db/contests";
import { useContestsRealtime } from "@/hooks/use-contests-realtime";
import { computeContestStatus } from "@/hooks/use-contest-status";
import { ContestCard } from "@/components/leaderboard/contest-card";
import type { Contest } from "@/lib/types";

type TabKey = "all" | "upcoming" | "active" | "completed";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "list" },
  { key: "upcoming", label: "Upcoming", icon: "schedule" },
  { key: "active", label: "Live", icon: "play_circle" },
  { key: "completed", label: "Completed", icon: "check_circle" },
];

export default function ContestsPage() {
  const { user, profile } = useAuth();
  const { contests, loading: contestsLoading } = useContestsRealtime();
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [joinedContests, setJoinedContests] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [metaLoading, setMetaLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    if (contests.length === 0) {
      setMetaLoading(false);
      return;
    }
    try {
      setMetaLoading(true);
      const counts: Record<string, number> = {};
      const joined: Record<string, boolean> = {};

      await Promise.all(
        contests.map(async (contest) => {
          const participants = await getContestParticipants(contest.id);
          counts[contest.id] = participants.length;
          if (user) {
            joined[contest.id] = await hasUserJoinedContest(contest.id, user.uid);
          }
        })
      );

      setParticipantCounts(counts);
      setJoinedContests(joined);
    } catch (err) {
      console.error("Failed to load contest metadata:", err);
    } finally {
      setMetaLoading(false);
    }
  }, [contests, user]);

  useEffect(() => {
    if (!contestsLoading) loadMeta();
  }, [contestsLoading, loadMeta]);

  const handleJoin = async (contestId: string) => {
    if (!user || !profile) return;
    try {
      setJoiningId(contestId);
      await joinContest(contestId, user.uid, profile.username || profile.displayName || "Anonymous");
      setJoinedContests((prev) => ({ ...prev, [contestId]: true }));
      setParticipantCounts((prev) => ({
        ...prev,
        [contestId]: (prev[contestId] || 0) + 1,
      }));
    } catch (err) {
      console.error("Failed to join contest:", err);
    } finally {
      setJoiningId(null);
    }
  };

  const loading = contestsLoading || metaLoading;

  // Use computed status instead of stored status for filtering
  const filteredContests = activeTab === "all"
    ? contests
    : contests.filter((c) => computeContestStatus(c) === activeTab);

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-primary-brand text-[28px]">
            emoji_events
          </span>
          <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
            Contests & Leaderboard
          </h1>
        </div>
        <p className="text-on-surface-variant text-sm">
          Compete in timed challenges and climb the ranks.
        </p>
        <Link
          href="/leaderboard/colleges"
          className="inline-flex items-center gap-1.5 text-primary-brand text-sm hover:underline mt-1"
        >
          <span className="material-symbols-outlined text-[16px]">school</span>
          College Leaderboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-container-low subtle-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contest List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-surface-container-low subtle-border p-5 h-36 animate-pulse"
            />
          ))}
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low subtle-border p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">
            event_busy
          </span>
          <p className="text-on-surface-variant text-sm">
            {activeTab === "all"
              ? "No contests available yet."
              : `No ${activeTab} contests right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              participantCount={participantCounts[contest.id] || 0}
              hasJoined={joinedContests[contest.id] || false}
              onJoin={handleJoin}
              joining={joiningId === contest.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}
