import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const COLLECTION = "bookmarks";

export interface Bookmark {
  id: string;
  userId: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  problemType: "dsa" | "aptitude";
  problemDifficulty: "easy" | "medium" | "hard";
  problemTopic: string;
  note: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

const bookmarkId = (userId: string, problemId: string) => `${userId}_${problemId}`;

export async function getBookmark(userId: string, problemId: string): Promise<Bookmark | null> {
  const snap = await getDoc(doc(db, COLLECTION, bookmarkId(userId, problemId)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Bookmark;
}

export async function addBookmark(params: {
  userId: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  problemType: "dsa" | "aptitude";
  problemDifficulty: "easy" | "medium" | "hard";
  problemTopic: string;
  note?: string;
}): Promise<void> {
  const id = bookmarkId(params.userId, params.problemId);
  await setDoc(doc(db, COLLECTION, id), {
    userId: params.userId,
    problemId: params.problemId,
    problemSlug: params.problemSlug,
    problemTitle: params.problemTitle,
    problemType: params.problemType,
    problemDifficulty: params.problemDifficulty,
    problemTopic: params.problemTopic,
    note: params.note ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function removeBookmark(userId: string, problemId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, bookmarkId(userId, problemId)));
}

export async function updateBookmarkNote(
  userId: string,
  problemId: string,
  note: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, bookmarkId(userId, problemId)), {
    note,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId));
  const snap = await getDocs(q);
  const bookmarks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bookmark);
  // Sort by createdAt desc client-side (avoids composite index)
  bookmarks.sort((a, b) => {
    const aT = (a.createdAt as { seconds: number } | null)?.seconds ?? 0;
    const bT = (b.createdAt as { seconds: number } | null)?.seconds ?? 0;
    return bT - aT;
  });
  return bookmarks;
}
