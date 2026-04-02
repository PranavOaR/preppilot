import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const PROGRESS_COLLECTION = "progress";
const SUBMISSIONS_COLLECTION = "submissions";

function getProgressDocId(userId: string, topic: string) {
  return `${userId}_${topic}`;
}

export async function updateProgress(
  userId: string,
  topic: string,
  solved: boolean
) {
  const docId = getProgressDocId(userId, topic);
  const docRef = doc(db, PROGRESS_COLLECTION, docId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    const updates: Record<string, unknown> = {
      problemsAttempted: increment(1),
      lastPracticedAt: serverTimestamp(),
    };
    if (solved) {
      updates.problemsSolved = increment(1);
    }
    await setDoc(docRef, updates, { merge: true });
  } else {
    await setDoc(docRef, {
      userId,
      topic,
      problemsSolved: solved ? 1 : 0,
      problemsAttempted: 1,
      lastPracticedAt: serverTimestamp(),
    });
  }
}

export async function getUserProgress(userId: string) {
  const q = query(
    collection(db, PROGRESS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getOverallStats(userId: string) {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  const solvedByDifficulty = { easy: new Set<string>(), medium: new Set<string>(), hard: new Set<string>() };
  const allSolved = new Set<string>();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.status !== "accepted") return;
    const problemId = data.problemId as string;
    if (!allSolved.has(problemId)) {
      allSolved.add(problemId);
      const difficulty = (data.difficulty as "easy" | "medium" | "hard") || null;
      if (difficulty && difficulty in solvedByDifficulty) {
        solvedByDifficulty[difficulty].add(problemId);
      }
    }
  });

  return {
    totalSolved: allSolved.size,
    easySolved: solvedByDifficulty.easy.size,
    mediumSolved: solvedByDifficulty.medium.size,
    hardSolved: solvedByDifficulty.hard.size,
  };
}
