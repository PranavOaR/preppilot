import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getProblemById } from "@/lib/db/problems";
import type { MockTest, MockTestAttempt } from "@/lib/types";

export async function getMockTests(): Promise<MockTest[]> {
  const snap = await getDocs(collection(db, "mockTests"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MockTest);
}

export async function getMockTest(testId: string): Promise<MockTest | null> {
  const snap = await getDoc(doc(db, "mockTests", testId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MockTest;
}

export async function createAttempt(testId: string, userId: string): Promise<string> {
  const ref = doc(collection(db, "mockTestAttempts"));
  await setDoc(ref, {
    testId,
    userId,
    answers: {},
    score: 0,
    sectionScores: {},
    status: "in_progress",
    startedAt: serverTimestamp(),
    submittedAt: null,
  });
  return ref.id;
}

export async function getInProgressAttempt(
  testId: string,
  userId: string
): Promise<MockTestAttempt | null> {
  const q = query(
    collection(db, "mockTestAttempts"),
    where("testId", "==", testId),
    where("userId", "==", userId),
    where("status", "==", "in_progress"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as MockTestAttempt;
}

export async function getAttempt(attemptId: string): Promise<MockTestAttempt | null> {
  const snap = await getDoc(doc(db, "mockTestAttempts", attemptId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MockTestAttempt;
}

export async function submitAttempt(
  attemptId: string,
  userId: string,
  answers: Record<string, string>,
  status: "submitted" | "timed_out" = "submitted"
): Promise<void> {
  const attemptRef = doc(db, "mockTestAttempts", attemptId);
  const attemptSnap = await getDoc(attemptRef);
  if (!attemptSnap.exists()) throw new Error("Attempt not found");

  const attempt = attemptSnap.data() as MockTestAttempt;

  if (attempt.userId !== userId) throw new Error("Forbidden: attempt does not belong to user");
  const testSnap = await getDoc(doc(db, "mockTests", attempt.testId));
  if (!testSnap.exists()) throw new Error("Test not found");

  const test = { id: testSnap.id, ...testSnap.data() } as MockTest;

  // Fetch all problems in the test
  const allProblemIds = test.sections.flatMap((s) => s.problemIds);
  const problemDocs = await Promise.all(allProblemIds.map((id) => getProblemById(id)));
  const problemMap = new Map(
    problemDocs.filter(Boolean).map((p) => [p!.id, p!])
  );

  // Grade per section.
  // Aptitude is checked against correctAnswer; DSA code isn't auto-graded
  // in mock tests, so any submitted answer counts as attempted credit.
  const sectionScores: Record<string, number> = {};
  let totalProblems = 0;
  let totalCorrect = 0;

  for (const section of test.sections) {
    let sectionCorrect = 0;
    totalProblems += section.problemIds.length;
    for (const problemId of section.problemIds) {
      const problem = problemMap.get(problemId);
      const answer = answers[problemId];
      if (!problem || !answer) continue;
      if (section.type === "aptitude" && problem.correctAnswer) {
        if (answer === problem.correctAnswer) {
          sectionCorrect++;
          totalCorrect++;
        }
      } else if (section.type === "dsa") {
        // DSA answers are graded as attempted-only (no Judge0 execution in mock tests).
        // Count toward denominator but not toward correct — score reflects aptitude only.
      }
    }
    const denominator = section.problemIds.length;
    sectionScores[section.label] =
      denominator > 0 ? Math.round((sectionCorrect / denominator) * 100) : 0;
  }

  const overallScore =
    totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;

  await updateDoc(attemptRef, {
    answers,
    score: overallScore,
    sectionScores,
    status,
    submittedAt: serverTimestamp(),
  });
}

export async function getAttemptsByUser(userId: string): Promise<MockTestAttempt[]> {
  const q = query(
    collection(db, "mockTestAttempts"),
    where("userId", "==", userId),
    orderBy("startedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MockTestAttempt);
}
