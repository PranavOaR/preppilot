import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";
import type { PlanTier } from "@/lib/types/plans";

export interface UserWithId extends UserProfile {
  id: string;
}

/** Check if a given userId has the admin role. */
async function assertAdmin(callerUid: string): Promise<void> {
  const snap = await getDoc(doc(db, "users", callerUid));
  if (!snap.exists() || snap.data().role !== "admin") {
    throw new Error("Forbidden: caller is not an admin");
  }
}

export async function getAllUsers(callerUid?: string): Promise<UserWithId[]> {
  if (callerUid) await assertAdmin(callerUid);
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as UserWithId[];
}

export async function updateUserRole(uid: string, role: "user" | "admin", callerUid?: string) {
  if (callerUid) await assertAdmin(callerUid);
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
  expiresAt: number | null,
  callerUid?: string
) {
  if (callerUid) await assertAdmin(callerUid);
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    plan,
    planExpiresAt: expiresAt,
  });
}

/** Clear the isUnethical flag for a user (e.g. after review). */
export async function unflagUser(uid: string, callerUid?: string) {
  if (callerUid) await assertAdmin(callerUid);
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { isUnethical: false });
}

/**
 * Reset a user's interview usage counters back to 0.
 * Resets both interviewsLifetime (free/starter/pro) and interviewsThisMonth (premium)
 * so the user can start a fresh interview regardless of plan type.
 */
export async function resetInterviewUsage(uid: string, callerUid?: string) {
  if (callerUid) await assertAdmin(callerUid);
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    "usageThisMonth.interviewsLifetime": 0,
    "usageThisMonth.interviewsThisMonth": 0,
  });
}
