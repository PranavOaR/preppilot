import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Ensure required fields have sensible defaults if missing
  return {
    username: data.username || "",
    email: data.email || "",
    displayName: data.displayName || "",
    avatarUrl: data.avatarUrl ?? null,
    targetCompany: data.targetCompany || "",
    preferredLanguage: data.preferredLanguage || "python",
    university: data.university || "",
    year: data.year || 1,
    semester: data.semester || 1,
    role: data.role || "user",
    xp: data.xp || 0,
    currentStreak: data.currentStreak || 0,
    longestStreak: data.longestStreak || 0,
    lastPracticeDate: data.lastPracticeDate ?? null,
    badges: data.badges || [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    ...data,
  } as UserProfile;
}

export async function updateUser(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Check if a username is already taken by another user. */
export async function isUsernameTaken(username: string, excludeUid?: string): Promise<boolean> {
  const q = query(
    collection(db, "users"),
    where("username", "==", username)
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  // If only one match and it's the current user, it's not "taken"
  if (excludeUid && snap.size === 1 && snap.docs[0].id === excludeUid) return false;
  return true;
}

export async function flagUserAsUnethical(uid: string) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    isUnethical: true,
    updatedAt: serverTimestamp(),
  });
}
