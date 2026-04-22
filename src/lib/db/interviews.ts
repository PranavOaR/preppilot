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
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { InterviewSession, InterviewQA, InterviewFeedback } from "@/lib/types/interview";

// ─── Sessions ───

export async function createInterviewSession(
  session: Omit<InterviewSession, "id" | "startedAt" | "completedAt">
): Promise<string> {
  const ref = doc(collection(db, "interviewSessions"));
  // Strip undefined values — Firestore throws on undefined field values
  const clean = Object.fromEntries(
    Object.entries(session).filter(([, v]) => v !== undefined)
  );
  await setDoc(ref, {
    ...clean,
    startedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

export async function getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
  const snap = await getDoc(doc(db, "interviewSessions", sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as InterviewSession;
}

export async function updateInterviewSession(
  sessionId: string,
  data: Partial<InterviewSession>
): Promise<void> {
  await updateDoc(doc(db, "interviewSessions", sessionId), data);
}

export async function completeInterviewSession(
  sessionId: string,
  overallScore: number
): Promise<void> {
  await updateDoc(doc(db, "interviewSessions", sessionId), {
    status: "completed",
    overallScore,
    completedAt: serverTimestamp(),
  });
}

export async function getUserInterviews(userId: string): Promise<InterviewSession[]> {
  const q = query(
    collection(db, "interviewSessions"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InterviewSession));
  // Sort client-side to avoid requiring a composite Firestore index
  return sessions.sort((a, b) => {
    const aTs = (a.startedAt as { seconds?: number } | null)?.seconds ?? 0;
    const bTs = (b.startedAt as { seconds?: number } | null)?.seconds ?? 0;
    return bTs - aTs;
  });
}

// ─── Questions (subcollection) ───

export async function saveInterviewQA(
  sessionId: string,
  qa: InterviewQA
): Promise<void> {
  const ref = doc(db, "interviewSessions", sessionId, "questions", String(qa.index));
  await setDoc(ref, {
    ...qa,
    answeredAt: serverTimestamp(),
  });
}

export async function getInterviewQAs(sessionId: string): Promise<InterviewQA[]> {
  const snap = await getDocs(
    query(
      collection(db, "interviewSessions", sessionId, "questions"),
      orderBy("index", "asc")
    )
  );
  return snap.docs.map((d) => d.data() as InterviewQA);
}

// ─── Feedback ───

export async function saveInterviewFeedback(
  feedback: InterviewFeedback
): Promise<void> {
  await setDoc(doc(db, "interviewFeedback", feedback.sessionId), {
    ...feedback,
    generatedAt: serverTimestamp(),
  });
}

export async function getInterviewFeedback(
  sessionId: string
): Promise<InterviewFeedback | null> {
  const snap = await getDoc(doc(db, "interviewFeedback", sessionId));
  if (!snap.exists()) return null;
  return snap.data() as InterviewFeedback;
}
