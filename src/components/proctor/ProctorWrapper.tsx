"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useProctor } from "@/hooks/use-proctor";

interface ProctorWrapperProps {
  children: ReactNode;
  enabled?: boolean;
}

/**
 * Wraps a page in fullscreen enforcement.
 * Attempts to enter fullscreen on mount; shows a blocking overlay if not in fullscreen.
 * Uses a body[data-proctor] attribute to reliably hide the navbar via CSS.
 */
export function ProctorWrapper({ children, enabled = true }: ProctorWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState(0);

  useProctor(enabled, (count) => setViolations(count));

  useEffect(() => {
    if (!enabled) return;

    function syncState() {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) {
        document.body.setAttribute("data-proctor", "active");
      } else {
        document.body.removeAttribute("data-proctor");
      }
    }

    document.addEventListener("fullscreenchange", syncState);

    // Sync immediately in case we're already fullscreen (e.g. page reload)
    syncState();

    // Attempt auto-enter fullscreen, then sync state from the resolved promise
    // (avoids the React Strict Mode double-invocation timing gap)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(syncState)
        .catch(() => {
          // Browser blocked auto-fullscreen — overlay will prompt the user
        });
    }

    return () => {
      document.removeEventListener("fullscreenchange", syncState);
      document.body.removeAttribute("data-proctor");
    };
  }, [enabled]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      // Explicitly sync after the user-gesture fullscreen resolves
      setIsFullscreen(true);
      document.body.setAttribute("data-proctor", "active");
    } catch {
      // ignore — browser may deny even on user gesture in some configs
    }
  }

  return (
    <>
      {children}

      {enabled && !isFullscreen && (
        <div className="fixed inset-0 z-[200] bg-surface/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 p-6">
          <span className="material-symbols-outlined text-primary-brand text-6xl">
            fullscreen
          </span>

          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-on-surface text-xl font-semibold">
              Fullscreen Required
            </h2>
            <p className="text-on-surface-variant text-sm">
              This session must be taken in fullscreen mode. Exiting fullscreen
              or switching tabs is monitored and will result in a warning.
            </p>
            {violations > 0 && (
              <p className="text-error text-sm font-medium">
                {violations === 1
                  ? "1 warning issued — 2 remain before your session is terminated."
                  : `${violations} warnings issued — ${3 - violations} remain before your session is terminated.`}
              </p>
            )}
          </div>

          <button
            onClick={enterFullscreen}
            className="px-6 py-3 rounded-lg gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Enter Fullscreen
          </button>
        </div>
      )}
    </>
  );
}
