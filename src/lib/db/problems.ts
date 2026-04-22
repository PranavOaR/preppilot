import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  type QueryConstraint,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Problem } from "@/lib/types";

interface ProblemFilters {
  type?: "dsa" | "aptitude";
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
  company?: string;
  status?: "draft" | "published";
  pageSize?: number;
  lastDocId?: string;
  includeAll?: boolean;
}

export async function getProblems(filters: ProblemFilters = {}) {
  // With a small dataset (<200 problems), fetch all and filter/sort client-side
  // to avoid needing composite Firestore indexes for every filter combination.
  const q = query(collection(db, "problems"));
  const snapshot = await getDocs(q);

  let problems: Problem[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Problem[];

  // Filter out drafts for regular users (admin pages pass includeAll)
  if (!filters.includeAll) {
    problems = problems.filter((p) => !p.status || p.status === "published");
  }

  // Apply filters in memory
  if (filters.type) {
    problems = problems.filter((p) => p.type === filters.type);
  }
  if (filters.difficulty) {
    problems = problems.filter((p) => p.difficulty === filters.difficulty);
  }
  if (filters.topic) {
    problems = problems.filter((p) => p.topic === filters.topic);
  }
  if (filters.company) {
    problems = problems.filter((p) => p.companies.includes(filters.company!));
  }
  if (filters.status) {
    problems = problems.filter((p) => p.status === filters.status);
  }

  // Sort by title
  problems.sort((a, b) => a.title.localeCompare(b.title));

  // Paginate using offset (lastDocId stores the string-encoded offset)
  const pageSize = filters.pageSize || 50;
  const offset = filters.lastDocId ? parseInt(filters.lastDocId, 10) : 0;
  const paginated = problems.slice(offset, offset + pageSize);
  const nextOffset = offset + pageSize;

  return {
    problems: paginated,
    lastDocId: nextOffset < problems.length ? String(nextOffset) : null,
    hasMore: nextOffset < problems.length,
  };
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const q = query(collection(db, "problems"), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Problem;
}

export async function getProblemById(id: string): Promise<Problem | null> {
  const d = await getDoc(doc(db, "problems", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Problem;
}

export async function getTopics(): Promise<string[]> {
  // Reuse getAllProblems (which is also used by the practice page)
  // to avoid a redundant full collection read
  const problems = await getAllProblems();
  const topics = new Set<string>();
  for (const p of problems) {
    if (p.topic) topics.add(p.topic);
  }
  return Array.from(topics).sort();
}

export async function getProblemCount(filters: { type?: string; difficulty?: string } = {}): Promise<number> {
  const constraints: QueryConstraint[] = [where("status", "==", "published")];
  if (filters.type) constraints.push(where("type", "==", filters.type));
  if (filters.difficulty) constraints.push(where("difficulty", "==", filters.difficulty));

  const q = query(collection(db, "problems"), ...constraints);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getAllProblems(): Promise<Problem[]> {
  const snapshot = await getDocs(collection(db, "problems"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Problem[];
}

/**
 * Picks the same problem for everyone on a given UTC day so we can
 * have leaderboards / shared daily challenges. Deterministic from date string.
 */
export async function getDailyChallenge(): Promise<Problem | null> {
  const all = await getAllProblems();
  const published = all.filter((p) => !p.status || p.status === "published");
  if (published.length === 0) return null;

  // Sort to get deterministic ordering across machines
  published.sort((a, b) => a.id.localeCompare(b.id));

  const today = new Date();
  const dateKey = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return published[hash % published.length];
}

/** Deterministic UTC date key, exposed so callers can show "today's" indicator */
export function getDailyChallengeDateKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export interface CreateProblemData {
  title: string;
  slug: string;
  type: "dsa" | "aptitude";
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  topic: string;
  companies: string[];
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  starterCode: { python: string; c: string; cpp: string; java: string };
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  options?: string[];
  correctAnswer?: string;
  status: "draft" | "published";
  createdBy: string;
}

export async function createProblem(data: CreateProblemData) {
  const docRef = await addDoc(collection(db, "problems"), {
    ...data,
    successRate: 0,
    totalSubmissions: 0,
    totalAccepted: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProblem(id: string, data: Partial<CreateProblemData>) {
  const problemRef = doc(db, "problems", id);
  await updateDoc(problemRef, data);
}
