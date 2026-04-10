import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Contest } from "@/lib/types";

const CONTESTS_COLLECTION = "contests";
const PARTICIPANTS_COLLECTION = "contestParticipants";

interface CreateContestData {
  title: string;
  description: string;
  type: "dsa" | "aptitude" | "mixed";
  topics: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
  problemIds: string[];
  status: "upcoming" | "active" | "completed";
  createdBy: string;
}

export async function createContest(data: CreateContestData) {
  if (data.endTime <= data.startTime) {
    throw new Error("Contest end time must be after start time");
  }
  if (data.startTime < new Date(Date.now() - 60_000)) {
    throw new Error("Contest start time cannot be in the past");
  }

  const docRef = await addDoc(collection(db, CONTESTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getContests(): Promise<Contest[]> {
  const q = query(collection(db, CONTESTS_COLLECTION));
  const snapshot = await getDocs(q);

  const contests: Contest[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Contest[];

  // Sort by startTime descending client-side
  contests.sort((a, b) => {
    const aTime = a.startTime?.seconds || 0;
    const bTime = b.startTime?.seconds || 0;
    return bTime - aTime;
  });

  return contests;
}

export async function getContestById(id: string): Promise<Contest | null> {
  const d = await getDoc(doc(db, CONTESTS_COLLECTION, id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Contest;
}

export interface ContestParticipant {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  score: number;
  totalTime: number;
  joinedAt: { seconds: number } | null | undefined;
}

export async function joinContest(contestId: string, userId: string, username: string) {
  const participantId = `${contestId}_${userId}`;
  await setDoc(doc(db, PARTICIPANTS_COLLECTION, participantId), {
    contestId,
    userId,
    username,
    score: 0,
    totalTime: 0,
    joinedAt: serverTimestamp(),
  });
  return participantId;
}

export async function getContestParticipants(contestId: string): Promise<ContestParticipant[]> {
  const q = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where("contestId", "==", contestId)
  );
  const snapshot = await getDocs(q);

  const participants: ContestParticipant[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ContestParticipant[];

  return participants;
}

export async function submitContestAnswer(
  contestId: string,
  userId: string,
  problemId: string,
  isCorrect: boolean,
  timeTaken: number
) {
  const participantId = `${contestId}_${userId}`;
  const participantRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
  const participantDoc = await getDoc(participantRef);

  if (!participantDoc.exists()) {
    throw new Error("User has not joined this contest");
  }

  const data = participantDoc.data();
  const currentScore = data.score || 0;
  const currentTime = data.totalTime || 0;

  await updateDoc(participantRef, {
    score: isCorrect ? currentScore + 1 : currentScore,
    totalTime: currentTime + timeTaken,
  });
}

export async function getContestLeaderboard(contestId: string): Promise<ContestParticipant[]> {
  const participants = await getContestParticipants(contestId);

  // Sort by score desc, then totalTime asc
  participants.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTime - b.totalTime;
  });

  return participants;
}

export async function hasUserJoinedContest(contestId: string, userId: string): Promise<boolean> {
  const participantId = `${contestId}_${userId}`;
  const d = await getDoc(doc(db, PARTICIPANTS_COLLECTION, participantId));
  return d.exists();
}

export async function updateContest(id: string, data: Partial<CreateContestData>) {
  const contestRef = doc(db, CONTESTS_COLLECTION, id);
  await updateDoc(contestRef, data);
}

export async function deleteContest(id: string) {
  await deleteDoc(doc(db, CONTESTS_COLLECTION, id));
}

// ─── Real-time Subscriptions ─────────────────────────────────

export function subscribeToContests(
  callback: (contests: Contest[]) => void
): Unsubscribe {
  const q = query(collection(db, CONTESTS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const contests: Contest[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Contest[];

    contests.sort((a, b) => {
      const aTime = a.startTime?.seconds || 0;
      const bTime = b.startTime?.seconds || 0;
      return bTime - aTime;
    });

    callback(contests);
  });
}

export function subscribeToContest(
  contestId: string,
  callback: (contest: Contest | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, CONTESTS_COLLECTION, contestId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Contest);
  });
}

export function subscribeToParticipants(
  contestId: string,
  callback: (participants: ContestParticipant[]) => void
): Unsubscribe {
  const q = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where("contestId", "==", contestId)
  );
  return onSnapshot(q, (snapshot) => {
    const participants: ContestParticipant[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ContestParticipant[];

    // Sort by score desc, then totalTime asc
    participants.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTime - b.totalTime;
    });

    callback(participants);
  });
}

/** Get all contest participations for a user, with contest title included. */
export async function getUserContestParticipations(userId: string): Promise<{
  contestId: string;
  contestTitle: string;
  score: number;
  rank: number;
  totalParticipants: number;
  joinedAt: any;
}[]> {
  // Query contestParticipants by userId
  const q = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];

  // For each participation, get the contest title and compute rank
  const results = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as ContestParticipant;
      // Get contest title
      let contestTitle = "Unknown Contest";
      try {
        const contestDoc = await getDoc(doc(db, CONTESTS_COLLECTION, data.contestId));
        if (contestDoc.exists()) {
          contestTitle = (contestDoc.data().title as string) || contestTitle;
        }
      } catch {}

      // Get all participants to compute rank
      let rank = 1;
      let totalParticipants = 1;
      try {
        const allParticipants = await getContestLeaderboard(data.contestId);
        totalParticipants = allParticipants.length;
        const myIndex = allParticipants.findIndex(p => p.userId === userId);
        rank = myIndex >= 0 ? myIndex + 1 : totalParticipants;
      } catch {}

      return {
        contestId: data.contestId,
        contestTitle,
        score: data.score || 0,
        rank,
        totalParticipants,
        joinedAt: data.joinedAt,
      };
    })
  );

  // Sort by joinedAt descending (most recent first)
  return results.sort((a, b) => {
    const aT = (a.joinedAt as { seconds: number } | null)?.seconds || 0;
    const bT = (b.joinedAt as { seconds: number } | null)?.seconds || 0;
    return bT - aT;
  });
}
