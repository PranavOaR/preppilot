import { doc, getDoc, setDoc, updateDoc, Timestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function getDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return getDateOnly(d);
}

function getToday(): string {
  return getDateOnly(new Date());
}

export async function updateStreak(userId: string) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  const today = getToday();
  const yesterday = getYesterday();

  if (!userSnap.exists()) {
    await setDoc(
      userRef,
      {
        currentStreak: 1,
        longestStreak: 1,
        lastPracticeDate: Timestamp.now(),
      },
      { merge: true }
    );
    return;
  }

  const data = userSnap.data();
  const lastPracticeDate = data.lastPracticeDate as Timestamp | null;

  if (!lastPracticeDate) {
    await setDoc(
      userRef,
      {
        currentStreak: 1,
        longestStreak: Math.max(data.longestStreak || 0, 1),
        lastPracticeDate: Timestamp.now(),
      },
      { merge: true }
    );
    return;
  }

  const lastDateStr = getDateOnly(lastPracticeDate.toDate());

  if (lastDateStr === today) {
    // Already practiced today, no-op
    return;
  }

  let newStreak: number;
  if (lastDateStr === yesterday) {
    newStreak = (data.currentStreak || 0) + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(data.longestStreak || 0, newStreak);

  await setDoc(
    userRef,
    {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastPracticeDate: Timestamp.now(),
    },
    { merge: true }
  );
}

export async function useStreakFreeze(userId: string): Promise<{ success: boolean; message: string }> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { success: false, message: "User not found." };

  const data = snap.data();
  const freezes = (data.streakFreezes as number | undefined) ?? 0;
  if (freezes < 1) return { success: false, message: "No streak freezes available." };

  const lastPractice = data.lastPracticeDate as Timestamp | null;
  const today = getDateOnly(new Date());
  const yesterday = getYesterday();

  if (!lastPractice) return { success: false, message: "No streak to protect." };

  const lastDateStr = getDateOnly(lastPractice.toDate());

  if (lastDateStr === today || lastDateStr === yesterday) {
    return { success: false, message: "Your streak is still active — no freeze needed." };
  }

  // Advance lastPracticeDate to yesterday to restore the streak
  const yesterdayTs = new Date();
  yesterdayTs.setUTCDate(yesterdayTs.getUTCDate() - 1);
  yesterdayTs.setUTCHours(12, 0, 0, 0);

  await updateDoc(userRef, {
    streakFreezes: increment(-1),
    lastPracticeDate: Timestamp.fromDate(yesterdayTs),
  });

  return { success: true, message: "Streak freeze used! Your streak has been preserved." };
}

export async function grantStreakFreeze(userId: string, count = 1) {
  await updateDoc(doc(db, "users", userId), {
    streakFreezes: increment(count),
  });
}
