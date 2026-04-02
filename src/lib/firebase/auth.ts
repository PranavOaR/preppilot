import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";
import type { UserProfile } from "@/lib/types";

const googleProvider = new GoogleAuthProvider();

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, "role" | "xp" | "currentStreak" | "longestStreak" | "lastPracticeDate" | "badges" | "createdAt" | "updatedAt">
) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...data,
    role: "user",
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    badges: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function ensureUserProfile(user: User) {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  // Auto-create a minimal profile for social sign-ins
  const profile: Omit<UserProfile, "role" | "xp" | "currentStreak" | "longestStreak" | "lastPracticeDate" | "badges" | "createdAt" | "updatedAt"> = {
    username: user.displayName || user.email?.split("@")[0] || "user",
    email: user.email || "",
    displayName: user.displayName || "",
    avatarUrl: user.photoURL || null,
    targetCompany: "",
    preferredLanguage: "python",
    university: "",
    year: 1,
    semester: 1,
  };

  await createUserProfile(user.uid, profile);
  return { ...profile, role: "user", xp: 0, currentStreak: 0, longestStreak: 0, lastPracticeDate: null, badges: [], createdAt: null, updatedAt: null } as UserProfile;
}
