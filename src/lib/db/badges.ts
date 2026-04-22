import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { addNotification } from "./notifications";
import type { Badge } from "@/lib/types";

export const ALL_BADGES: Badge[] = [
  {
    id: "first_blood",
    name: "First Blood",
    description: "Solved your first problem",
    icon: "local_fire_department",
    criteria: { type: "problems_solved", threshold: 1 },
  },
  {
    id: "on_fire",
    name: "On Fire",
    description: "Maintained a 7-day streak",
    icon: "whatshot",
    criteria: { type: "streak", threshold: 7 },
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Solved 100 problems",
    icon: "military_tech",
    criteria: { type: "problems_solved", threshold: 100 },
  },
  {
    id: "xp_1000",
    name: "Rising Star",
    description: "Earned 1,000 XP",
    icon: "star",
    criteria: { type: "xp", threshold: 1000 },
  },
  {
    id: "xp_5000",
    name: "XP Veteran",
    description: "Earned 5,000 XP",
    icon: "stars",
    criteria: { type: "xp", threshold: 5000 },
  },
  {
    id: "streak_30",
    name: "Consistent",
    description: "Maintained a 30-day streak",
    icon: "local_fire_department",
    criteria: { type: "streak", threshold: 30 },
  },
  {
    id: "contest_podium",
    name: "Contest Podium",
    description: "Finished in the top 3 of a contest",
    icon: "emoji_events",
    criteria: { type: "contest_rank", threshold: 3 },
  },
];

interface BadgeContext {
  problemsSolved?: number;
  currentStreak?: number;
  xp?: number;
  contestRank?: number;
}

/**
 * Checks which badges the user has earned and awards any new ones.
 * Reads the current user doc, computes eligible badges, then writes only
 * the new ones. Returns the list of newly awarded badge IDs.
 */
export async function checkAndAwardBadges(
  userId: string,
  context: BadgeContext
): Promise<string[]> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return [];

  const data = snap.data();
  const existingBadges: string[] = data.badges || [];

  const newBadgeIds: string[] = [];

  for (const badge of ALL_BADGES) {
    if (existingBadges.includes(badge.id)) continue;

    let earned = false;
    const { type, threshold } = badge.criteria;

    if (type === "problems_solved" && context.problemsSolved !== undefined) {
      earned = context.problemsSolved >= threshold;
    } else if (type === "streak" && context.currentStreak !== undefined) {
      earned = context.currentStreak >= threshold;
    } else if (type === "xp" && context.xp !== undefined) {
      earned = context.xp >= threshold;
    } else if (type === "contest_rank" && context.contestRank !== undefined) {
      earned = context.contestRank <= threshold && context.contestRank > 0;
    }

    if (earned) {
      newBadgeIds.push(badge.id);
    }
  }

  if (newBadgeIds.length > 0) {
    await updateDoc(userRef, {
      badges: arrayUnion(...newBadgeIds),
    });

    // Send a notification for each new badge (best-effort)
    const badgeMap = new Map(ALL_BADGES.map((b) => [b.id, b]));
    await Promise.all(
      newBadgeIds.map((id) => {
        const badge = badgeMap.get(id);
        if (!badge) return Promise.resolve();
        return addNotification(userId, {
          type: "badge_earned",
          title: `Badge unlocked: ${badge.name}`,
          body: badge.description,
          icon: badge.icon,
          href: "/profile",
        }).catch(() => {});
      })
    );
  }

  return newBadgeIds;
}
