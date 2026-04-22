"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { CollegeRankings } from "@/components/leaderboard/college-rankings";

interface CollegeData {
  university: string;
  totalXp: number;
  userCount: number;
  avgXp: number;
}

interface UserRankData {
  uid: string;
  username: string;
  university: string;
  xp: number;
  streak: number;
}

type Tab = "colleges" | "individuals";

export default function CollegeLeaderboardPage() {
  const { user, profile } = useAuth();
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [individuals, setIndividuals] = useState<UserRankData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [tab, setTab] = useState<Tab>("colleges");

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const idToken = await user!.getIdToken();
        const res = await fetch("/api/leaderboard/colleges", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.status === 503) {
          setUnavailable(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        setColleges(data.colleges ?? []);
        setIndividuals(data.individuals ?? []);
      } catch (err) {
        console.error("Failed to load leaderboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  function getRankIcon(rank: number) {
    if (rank === 1) return <span className="material-symbols-outlined text-yellow-400 text-[20px]">military_tech</span>;
    if (rank === 2) return <span className="material-symbols-outlined text-gray-300 text-[20px]">workspace_premium</span>;
    if (rank === 3) return <span className="material-symbols-outlined text-amber-600 text-[20px]">workspace_premium</span>;
    return <span className="font-mono text-on-surface-variant text-sm">{rank}</span>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-[26px]">leaderboard</span>
            <h1 className="font-serif text-2xl sm:text-3xl text-on-surface font-medium tracking-tight">
              Global Rankings
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            See how you rank against everyone on the platform.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1.5 text-on-surface-variant text-sm hover:text-on-surface transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">emoji_events</span>
          Contests
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-container-low w-fit">
        <button
          onClick={() => setTab("colleges")}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === "colleges" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          <span className="material-symbols-outlined text-[16px] mr-1.5 align-text-bottom">school</span>
          Colleges
        </button>
        <button
          onClick={() => setTab("individuals")}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === "individuals" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          <span className="material-symbols-outlined text-[16px] mr-1.5 align-text-bottom">person</span>
          Individuals
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">progress_activity</span>
        </div>
      ) : unavailable ? (
        <div className="rounded-lg bg-surface-container-low subtle-border p-8 text-center text-on-surface-variant text-sm">
          Leaderboard is currently unavailable.
        </div>
      ) : tab === "colleges" ? (
        <CollegeRankings colleges={colleges} currentUserUniversity={profile?.university} />
      ) : (
        <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[44px_1fr_60px_80px] sm:grid-cols-[60px_1fr_120px_80px] px-4 sm:px-5 py-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Rank</span>
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">User</span>
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-center hidden sm:block">College</span>
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">XP</span>
          </div>

          {individuals.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">No users found.</div>
          ) : (
            individuals.map((u, i) => {
              const rank = i + 1;
              const isMe = u.uid === user?.uid;
              return (
                <div
                  key={u.uid}
                  className={`grid grid-cols-[44px_1fr_60px_80px] sm:grid-cols-[60px_1fr_120px_80px] items-center px-4 sm:px-5 py-3 border-b border-outline-variant/5 transition-colors ${
                    isMe ? "bg-primary-container/10 border-l-2 border-l-primary-brand" : "hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center">{getRankIcon(rank)}</div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${isMe ? "bg-primary-container/30 text-primary-brand" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? "text-primary-brand" : "text-on-surface"}`}>
                        {u.username}{isMe && <span className="ml-1.5 text-[10px] text-primary-brand/70">(you)</span>}
                      </p>
                      {u.streak > 0 && (
                        <p className="text-[10px] text-orange-400">🔥 {u.streak} day streak</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant truncate text-center hidden sm:block">{u.university || "—"}</span>
                  <span className="font-mono text-primary-brand text-sm text-right">{u.xp.toLocaleString()}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}
