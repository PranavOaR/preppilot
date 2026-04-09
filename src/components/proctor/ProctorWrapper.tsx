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
 * Internally uses useProctor to track and penalize violations.
 */
export function ProctorWrapper({ children, enabled = true }: ProctorWrapperProps) {
  // Initialize to false so the overlay shows until fullscreen is confirmed —
  // prevents the content flash that occurred with the previous useState(true).
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track violation count to show message in overlay
  const [violations, setViolations] = useState(0);

  useProctor(enabled, (count) => setViolations(count));

  useEffect(() => {
    if (!enabled) return;

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    setIsFullscreen(!!document.fullscreenElement);

    // Attempt auto-enter fullscreen (works when page was reached via user interaction)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Browser may block; overlay will prompt the user instead
        setIsFullscreen(false);
      });
    }

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore
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
            Return to Fullscreen
          </button>
        </div>
      )}
    </>
  );
}
