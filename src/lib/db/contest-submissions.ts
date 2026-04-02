import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const COLLECTION = "contestSubmissions";

interface ContestSubmissionData {
  contestId: string;
  userId: string;
  problemId: string;
  answer: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

export async function submitContestProblem(data: ContestSubmissionData) {
  const docId = `${data.contestId}_${data.userId}_${data.problemId}`;
  await setDoc(doc(db, COLLECTION, docId), {
    ...data,
    submittedAt: serverTimestamp(),
  });
  return docId;
}

export async function getContestUserSubmissions(
  contestId: string,
  userId: string
) {
  const q = query(
    collection(db, COLLECTION),
    where("contestId", "==", contestId),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function hasSubmittedProblem(
  contestId: string,
  userId: string,
  problemId: string
): Promise<boolean> {
  const docId = `${contestId}_${userId}_${problemId}`;
  const d = await getDoc(doc(db, COLLECTION, docId));
  return d.exists();
}
