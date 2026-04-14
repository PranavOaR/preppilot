import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// ─── Hint Cache ───

export async function getCachedHint(
  problemId: string,
  level: number
): Promise<string | null> {
  const docId = `${problemId}_level${level}`;
  const snap = await getDoc(doc(db, "hintCache", docId));
  if (snap.exists()) {
    return snap.data().hintText as string;
  }
  return null;
}

export async function setCachedHint(
  problemId: string,
  level: number,
  hintText: string,
  model: string
): Promise<void> {
  const docId = `${problemId}_level${level}`;
  await setDoc(doc(db, "hintCache", docId), {
    problemId,
    level,
    hintText,
    model,
    generatedAt: serverTimestamp(),
  });
}

// ─── Hint Usage ───

export async function getHintUsage(
  userId: string,
  problemId: string,
  level: number
): Promise<boolean> {
  const docId = `${userId}_${problemId}_level${level}`;
  const snap = await getDoc(doc(db, "hintUsage", docId));
  return snap.exists();
}

export async function recordHintUsage(
  userId: string,
  problemId: string,
  level: number,
  xpCost: number
): Promise<void> {
  const docId = `${userId}_${problemId}_level${level}`;
  await setDoc(doc(db, "hintUsage", docId), {
    userId,
    problemId,
    level,
    xpCost,
    usedAt: serverTimestamp(),
  });
}

export async function getUserHintsToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "hintUsage"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);

  let count = 0;
  for (const d of snap.docs) {
    const usedAt = d.data().usedAt;
    if (usedAt && usedAt.toDate() >= today) {
      count++;
    }
  }
  return count;
}

export async function getUserUnlockedLevels(
  userId: string,
  problemId: string
): Promise<number[]> {
  const q = query(
    collection(db, "hintUsage"),
    where("userId", "==", userId),
    where("problemId", "==", problemId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data().level as number)
    .filter((l) => l >= 1 && l <= 4)
    .sort((a, b) => a - b);
}
