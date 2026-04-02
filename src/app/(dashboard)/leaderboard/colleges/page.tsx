"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import { CollegeRankings } from "@/components/leaderboard/college-rankings";

interface CollegeData {
  university: string;
  totalXp: number;
  userCount: number;
  avgXp: number;
}

export default function CollegeLeaderboardPage() {
  const { profile } = useAuth();
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const collegeMap = new Map<string, { totalXp: number; count: number }>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const university = (data.university as string)?.trim();
          if (!university) return;

          const existing = collegeMap.get(university) || { totalXp: 0, count: 0 };
          existing.totalXp += (data.xp as number) || 0;
          existing.count += 1;
          collegeMap.set(university, existing);
        });

        const ranked: CollegeData[] = Array.from(collegeMap.entries())
          .map(([university, { totalXp, count }]) => ({
            university,
            totalXp,
            userCount: count,
            avgXp: Math.round(totalXp / count),
          }))
          .sort((a, b) => b.totalXp - a.totalXp);

        setColleges(ranked);
      } catch (err) {
        console.error("Failed to load college data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-brand text-[28px]">
              school
            </span>
            <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
              College Leaderboard
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            See how your college ranks against others. Rankings based on total XP earned.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1.5 text-on-surface-variant text-sm hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">emoji_events</span>
          Contests
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      ) : (
        <CollegeRankings
          colleges={colleges}
          currentUserUniversity={profile?.university}
        />
      )}
    </main>
  );
}
