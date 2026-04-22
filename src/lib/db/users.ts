import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Spread data first, then apply defaults only for fields missing/falsy in Firestore.
  return {
    username: "",
    email: "",
    displayName: "",
    avatarUrl: null,
    targetCompany: "",
    preferredLanguage: "python",
    university: "",
    year: 1,
    semester: 1,
    role: "user",
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    badges: [],
    streakFreezes: 0,
    createdAt: null,
    updatedAt: null,
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

/** Look up a user by their username (case-insensitive within stored format). */
export async function getUserByUsername(username: string): Promise<(UserProfile & { uid: string }) | null> {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() } as UserProfile & { uid: string };
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
