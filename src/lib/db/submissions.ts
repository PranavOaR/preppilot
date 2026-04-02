import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const SUBMISSIONS_COLLECTION = "submissions";

interface CreateSubmissionData {
  userId: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  language: string;
  status:
    | "accepted"
    | "wrong_answer"
    | "time_limit"
    | "runtime_error"
    | "compile_error";
}

export async function createSubmission(data: CreateSubmissionData) {
  const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
    ...data,
    submittedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserSubmissions(userId: string, maxResults = 20) {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Sort by submittedAt descending and limit client-side to avoid composite index
  docs.sort((a: any, b: any) => {
    const aTime = a.submittedAt?.seconds || 0;
    const bTime = b.submittedAt?.seconds || 0;
    return bTime - aTime;
  });

  return docs.slice(0, maxResults);
}

export async function getUserSubmissionForProblem(
  userId: string,
  problemId: string
) {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const match = snapshot.docs.find((doc) => {
    const data = doc.data();
    return data.problemId === problemId && data.status === "accepted";
  });
  if (!match) return null;
  return { id: match.id, ...match.data() };
}

export async function getUserSolvedProblems(userId: string) {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const solvedIds = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.status === "accepted") {
      solvedIds.add(data.problemId);
    }
  });
  return Array.from(solvedIds);
}
