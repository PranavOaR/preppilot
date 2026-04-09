import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";
import type { PlanTier } from "@/lib/types/plans";

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

/**
 * Grant or change a user's plan. Pass expiresAt = null to clear expiry (for
 * manual grants where admin doesn't want an expiry date).
 */
export async function updateUserPlan(
  uid: string,
  plan: PlanTier,
  expiresAt: number | null
) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    plan,
    planExpiresAt: expiresAt,
  });
}

/** Clear the isUnethical flag for a user (e.g. after review). */
export async function unflagUser(uid: string) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { isUnethical: false });
}
