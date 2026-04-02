import { doc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const XP_VALUES: Record<string, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

const FIRST_SOLVE_MULTIPLIER = 1.5;

export function calculateXP(
  difficulty: "easy" | "medium" | "hard",
  isFirstSolve: boolean
): number {
  const baseXP = XP_VALUES[difficulty] || 0;
  return isFirstSolve ? Math.round(baseXP * FIRST_SOLVE_MULTIPLIER) : baseXP;
}

export async function awardXP(userId: string, xp: number) {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { xp: increment(xp) }, { merge: true });
}
