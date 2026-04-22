import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  where,
  startAfter,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface DiscussionComment {
  id: string;
  problemId: string;
  userId: string;
  username: string;
  photoURL?: string;
  content: string;
  upvotes: string[]; // array of userIds
  parentId?: string; // for replies
  createdAt: { seconds: number };
}

export async function getDiscussions(
  problemId: string,
  pageSize = 20,
  after?: DocumentSnapshot
): Promise<{ comments: DiscussionComment[]; lastDoc: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [
    where("problemId", "==", problemId),
    where("parentId", "==", null),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  ];
  if (after) constraints.push(startAfter(after));

  const q = query(collection(db, "discussions"), ...constraints);
  const snap = await getDocs(q);
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DiscussionComment[];
  return {
    comments,
    lastDoc: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null,
  };
}

export async function getReplies(parentId: string): Promise<DiscussionComment[]> {
  const q = query(
    collection(db, "discussions"),
    where("parentId", "==", parentId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DiscussionComment[];
}

export async function addComment(data: {
  problemId: string;
  userId: string;
  username: string;
  photoURL?: string;
  content: string;
  parentId?: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "discussions"), {
    ...data,
    parentId: data.parentId ?? null,
    upvotes: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function toggleUpvote(commentId: string, userId: string, hasUpvoted: boolean) {
  const ref = doc(db, "discussions", commentId);
  await updateDoc(ref, {
    upvotes: hasUpvoted ? arrayRemove(userId) : arrayUnion(userId),
  });
}
