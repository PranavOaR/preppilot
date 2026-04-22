"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { flagUserAsUnethical } from "@/lib/db/users";

/**
 * Proctoring hook for contests and interviews.
 * Detects tab switches and fullscreen exits.
 * Warns twice, then flags + signs out on the third violation.
 */
export function useProctor(
  enabled: boolean = true,
  onViolation?: (violationCount: number) => void
) {
  const violationsRef = useRef(0);
  // Store onViolation in a ref so the effect doesn't re-run when the callback
  // reference changes (e.g. inline arrow functions from a parent component).
  const onViolationRef = useRef(onViolation);
  useEffect(() => { onViolationRef.current = onViolation; });

  // Persists across effect re-runs so fullscreen state isn't reset if deps change.
  const wasFullscreenRef = useRef(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Keep stable refs for showToast and router so they don't cause effect re-runs.
  const showToastRef = useRef(showToast);
  const routerRef = useRef(router);
  useEffect(() => { showToastRef.current = showToast; });
  useEffect(() => { routerRef.current = router; });

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; });

  useEffect(() => {
    if (!enabled) return;

    const handleViolation = async (reason: string) => {
      violationsRef.current += 1;
      const count = violationsRef.current;
      onViolationRef.current?.(count);

      if (count === 1) {
        showToastRef.current(
          `Warning: ${reason}. Two more violations will end your session.`,
          "error"
        );
      } else if (count === 2) {
        showToastRef.current(
          `Final warning: ${reason}. One more violation will permanently end your session.`,
          "error"
        );
      } else {
        showToastRef.current("Session terminated for repeated violations.", "error");
        const currentUser = userRef.current;
        if (currentUser) {
          try {
            await flagUserAsUnethical(currentUser.uid);
          } catch {
            // best-effort — proceed with signout regardless
          }
        }
        await signOut(auth);
        routerRef.current.replace("/flagged");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switching is not allowed");
      }
    };

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        wasFullscreenRef.current = true;
      } else if (wasFullscreenRef.current) {
        handleViolation("Exiting fullscreen is not allowed");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled]); // showToast, router, user accessed via stable refs — no re-registration needed
}
