"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserByUsername } from "@/lib/db/users";
import { getUserSolvedProblems } from "@/lib/db/submissions";
import { getActivityLog } from "@/lib/db/activity";
import { Heatmap } from "@/components/profile/heatmap";
import type { UserProfile } from "@/lib/types";

interface ActivityData {
  date: string;
  count: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<(UserProfile & { uid: string }) | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // Public profiles still need an authenticated viewer due to Firestore rules
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const p = await getUserByUsername(username);
        if (cancelled) return;
        if (!p) {
          setNotFound(true);
          return;
        }
        setProfile(p);

        const [solved, activityData] = await Promise.all([
          getUserSolvedProblems(p.uid).catch(() => []),
          getActivityLog(p.uid, 365).catch(() => []),
        ]);
        if (cancelled) return;
        setSolvedCount(solved.length);
        setActivity(
          activityData.map((a) => ({
            date: a.date,
            count: (a as { problemsSolved?: number }).problemsSolved ?? 0,
          }))
        );
      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [username, user, authLoading]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-outline animate-spin text-3xl">
          progress_activity
        </span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl bg-surface-container-low subtle-border p-8">
          <span className="material-symbols-outlined text-outline text-5xl">lock</span>
          <h1 className="font-serif text-on-surface text-2xl font-medium">
            Sign in to view profiles
          </h1>
          <p className="text-on-surface-variant text-sm">
            PrepPilot profiles are visible to other users. Create a free account to view <span className="text-on-surface font-medium">@{username}</span>.
          </p>
          <div className="flex items-center gap-3 justify-center pt-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm hover:bg-surface-container-high transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <span className="material-symbols-outlined text-outline text-5xl">person_off</span>
          <h1 className="font-serif text-on-surface text-2xl font-medium">User not found</h1>
          <p className="text-on-surface-variant text-sm">
            No PrepPilot user with the username <span className="text-on-surface font-medium">@{username}</span>.
          </p>
          <Link href="/dashboard" className="inline-block mt-2 text-sm text-primary-brand hover:underline">
            Back to dashboard →
          </Link>
        </div>
      </main>
    );
  }

  const displayName = profile.displayName || profile.username;
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const memberSince = profile.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";
  const isOwnProfile = user.uid === profile.uid;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-on-surface-variant text-sm hover:text-on-surface transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-medium hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? "check" : "link"}
          </span>
          {copied ? "Link copied" : "Share profile"}
        </button>
      </div>

      <div className="glass-panel subtle-border rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="text-3xl font-serif font-medium text-on-primary">{initial}</span>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="font-serif text-on-surface text-2xl font-medium">{displayName}</h1>
              <p className="text-on-surface-variant text-sm">@{profile.username}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
              {profile.university && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">school</span>
                  {profile.university}
                </span>
              )}
              {profile.targetCompany && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
                  Targeting {profile.targetCompany}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">event</span>
                Joined {memberSince}
              </span>
            </div>
          </div>
          {isOwnProfile && (
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs hover:bg-surface-container-high transition-colors"
            >
              Edit profile
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="XP" value={(profile.xp || 0).toLocaleString()} />
        <Stat label="Solved" value={solvedCount.toString()} />
        <Stat label="Streak" value={`${profile.currentStreak || 0}🔥`} />
        <Stat label="Longest" value={(profile.longestStreak || 0).toString()} />
      </div>

      <div className="glass-panel subtle-border rounded-xl p-6">
        <h3 className="font-serif text-on-surface text-lg font-medium mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-brand text-xl">grid_view</span>
          Activity
        </h3>
        <Heatmap data={activity} />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel subtle-border rounded-lg px-4 py-4 text-center">
      <p className="font-mono text-on-surface text-xl font-semibold">{value}</p>
      <p className="text-on-surface-variant text-xs mt-0.5">{label}</p>
    </div>
  );
}
