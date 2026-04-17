import {
  collection,
  query,
  where,
  getDocs,
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

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  // Build topic accuracy map from the per-topic progress collection
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

  // Calculate percentile by comparing total solved against all users
  const allUsersSnap = await getDocs(collection(db, "users"));
  const allXps: number[] = allUsersSnap.docs.map(
    (d) => (d.data().xp as number) || 0
  );
  const userXp =
    allUsersSnap.docs.find((d) => d.id === userId)?.data()?.xp || 0;
  const belowCount = allXps.filter((xp) => xp < userXp).length;
  const percentile =
    allXps.length > 1 ? Math.round((belowCount / (allXps.length - 1)) * 100) : 100;

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
