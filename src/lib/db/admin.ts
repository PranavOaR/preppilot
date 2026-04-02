import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

export interface UserWithId extends UserProfile {
  id: string;
}

export async function getAllUsers(): Promise<UserWithId[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as UserWithId[];
}

export async function updateUserRole(uid: string, role: "user" | "admin") {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role });
}
