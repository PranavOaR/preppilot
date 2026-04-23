"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import {
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
  ensureUserProfile,
} from "@/lib/firebase/auth";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Persist the Firebase ID token in the httpOnly __session cookie. */
async function syncSessionCookie(idToken: string | null): Promise<void> {
  try {
    if (idToken) {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } else {
      await fetch("/api/auth/session", { method: "DELETE" });
    }
  } catch {
    // Non-critical — the proxy check is optimistic.  Firestore rules and API
    // route guards remain the authoritative enforcement layer.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track whether a sign-in handler already loaded the profile to avoid
  // double-loading when onIdTokenChanged fires immediately after sign-in.
  const profileLoadedBySignIn = useRef(false);

  async function loadProfile(firebaseUser: User) {
    const userProfile = await ensureUserProfile(firebaseUser);
    setProfile(userProfile);
  }

  useEffect(() => {
    // onIdTokenChanged fires on sign-in, sign-out, AND whenever Firebase
    // refreshes the ID token (~every hour).  We use this instead of
    // onAuthStateChanged so the __session cookie always contains a fresh token.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Sync the fresh token to the httpOnly session cookie.
        const idToken = await firebaseUser.getIdToken();
        syncSessionCookie(idToken);

        if (!profileLoadedBySignIn.current) {
          await loadProfile(firebaseUser);
        }
        profileLoadedBySignIn.current = false;
      } else {
        setProfile(null);
        syncSessionCookie(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignIn(email: string, password: string) {
    const credential = await signIn(email, password);
    profileLoadedBySignIn.current = true;
    await loadProfile(credential.user);
  }

  async function handleSignUp(email: string, password: string) {
    const credential = await signUp(email, password);
    profileLoadedBySignIn.current = true;
    await loadProfile(credential.user);
    return credential.user;
  }

  async function handleSignInWithGoogle() {
    const credential = await signInWithGoogle();
    profileLoadedBySignIn.current = true;
    await loadProfile(credential.user);
  }

  async function handleSignOut() {
    await signOut();
    setProfile(null);
    // Cookie is cleared by the onIdTokenChanged(null) callback above.
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === "admin",
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
