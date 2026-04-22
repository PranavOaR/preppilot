import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
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
