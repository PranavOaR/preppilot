import {
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface TopicAccuracy {
  topic: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface UserAnalytics {
  topicAccuracies: TopicAccuracy[];
  totalAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
  percentile: number;
}

/**
 * Computes per-topic accuracy from the progress collection.
 * Percentile is passed in from the caller (fetched via /api/user/rank)
 * to avoid a full users-collection scan client-side.
 */
export async function getUserAnalytics(userId: string, percentile = 0): Promise<UserAnalytics> {
  const topicMap = new Map<string, { attempted: number; correct: number }>();
  let totalAttempted = 0;
  let totalCorrect = 0;

  const progressQuery = query(
    collection(db, "progress"),
    where("userId", "==", userId)
  );
  const progressSnap = await getDocs(progressQuery);

  progressSnap.docs.forEach((doc) => {
    const data = doc.data();
    const topic = data.topic as string;
    const attempted = (data.problemsAttempted as number) || 0;
    const solved = (data.problemsSolved as number) || 0;

    topicMap.set(topic, { attempted, correct: solved });
    totalAttempted += attempted;
    totalCorrect += solved;
  });

  const topicAccuracies: TopicAccuracy[] = Array.from(topicMap.entries())
    .map(([topic, { attempted, correct }]) => ({
      topic,
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    }))
    .sort((a, b) => b.attempted - a.attempted);

  return {
    topicAccuracies,
    totalAttempted,
    totalCorrect,
    overallAccuracy:
      totalAttempted > 0
        ? Math.round((totalCorrect / totalAttempted) * 100)
        : 0,
    percentile,
  };
}
