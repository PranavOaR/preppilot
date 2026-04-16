"use client";

import { useState, useEffect } from "react";
import type { Contest } from "@/lib/types";

export type ComputedStatus = "upcoming" | "active" | "completed";

export function useContestStatus(contest: Contest | null): ComputedStatus | null {
  const [status, setStatus] = useState<ComputedStatus | null>(null);

  useEffect(() => {
    if (!contest) {
      setStatus(null);
      return;
    }

    function compute() {
      if (!contest) return;
      const now = Date.now();
      const startMs = contest.startTime?.seconds ? contest.startTime.seconds * 1000 : 0;
      const endMs = contest.endTime?.seconds ? contest.endTime.seconds * 1000 : 0;

      if (now < startMs) {
        setStatus("upcoming");
      } else if (now >= startMs && now <= endMs) {
        setStatus("active");
      } else {
        setStatus("completed");
      }
    }

    compute();
    // Only tick when the contest could change status (upcoming → active → completed).
    // Once completed, no need to keep ticking.
    const startMs = contest.startTime?.seconds ? contest.startTime.seconds * 1000 : 0;
    const endMs = contest.endTime?.seconds ? contest.endTime.seconds * 1000 : 0;
    const now = Date.now();
    if (now > endMs) return; // Already completed, no need for interval

    const interval = setInterval(() => {
      compute();
      // Clear once completed
      const currentNow = Date.now();
      if (currentNow > endMs) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  return status;
}

export function computeContestStatus(contest: Contest): ComputedStatus {
  const now = Date.now();
  const startMs = contest.startTime?.seconds ? contest.startTime.seconds * 1000 : 0;
  const endMs = contest.endTime?.seconds ? contest.endTime.seconds * 1000 : 0;

  if (now < startMs) return "upcoming";
  if (now >= startMs && now <= endMs) return "active";
  return "completed";
}
