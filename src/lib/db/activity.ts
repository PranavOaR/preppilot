import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const ACTIVITY_COLLECTION = "activity";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getActivityDocId(userId: string, date: string) {
  return `${userId}_${date}`;
}

export async function recordActivity(
  userId: string,
  problemsSolved = 0,
  xpEarned = 0
) {
  const date = getTodayDateString();
  const docId = getActivityDocId(userId, date);
  const docRef = doc(db, ACTIVITY_COLLECTION, docId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    const current = existing.data();
    await setDoc(
      docRef,
      {
        problemsSolved: (current.problemsSolved || 0) + problemsSolved,
        xpEarned: (current.xpEarned || 0) + xpEarned,
      },
      { merge: true }
    );
  } else {
    await setDoc(docRef, {
      userId,
      date,
      problemsSolved,
      xpEarned,
    });
  }
}

export async function getActivityLog(userId: string, days = 365) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as { id: string; date: string; problemsSolved: number; xpEarned: number })
    .filter((a) => a.date >= startDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}
