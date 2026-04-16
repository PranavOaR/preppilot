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

  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleViolation = async (reason: string) => {
      violationsRef.current += 1;
      const count = violationsRef.current;
      onViolationRef.current?.(count);

      if (count === 1) {
        showToast(
          `Warning: ${reason}. Two more violations will end your session.`,
          "error"
        );
      } else if (count === 2) {
        showToast(
          `Final warning: ${reason}. One more violation will permanently end your session.`,
          "error"
        );
      } else {
        showToast("Session terminated for repeated violations.", "error");
        if (user) {
          try {
            await flagUserAsUnethical(user.uid);
          } catch {
            // best-effort — proceed with signout regardless
          }
        }
        await signOut(auth);
        router.replace("/flagged");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switching is not allowed");
      }
    };

    // Track whether user has ever entered fullscreen — don't fire violations
    // for the initial mount state where the page is not fullscreen.
    let wasFullscreen = !!document.fullscreenElement;

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        wasFullscreen = true;
      } else if (wasFullscreen) {
        // Only fire if user was in fullscreen and exited
        handleViolation("Exiting fullscreen is not allowed");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled, user, showToast, router]);
}
