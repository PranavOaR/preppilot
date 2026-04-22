import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface Editorial {
  problemId: string;
  content: string; // markdown
  approaches: EditorialApproach[];
  updatedAt?: { seconds: number };
  updatedBy?: string;
}

export interface EditorialApproach {
  title: string;
  complexity: string;
  code: {
    python?: string;
    cpp?: string;
    java?: string;
  };
  explanation: string;
}

export async function getEditorial(problemId: string): Promise<Editorial | null> {
  const snap = await getDoc(doc(db, "editorials", problemId));
  if (!snap.exists()) return null;
  return { problemId, ...snap.data() } as Editorial;
}

export async function saveEditorial(
  problemId: string,
  data: Omit<Editorial, "problemId">,
  adminUid: string
) {
  await setDoc(doc(db, "editorials", problemId), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  });
}
