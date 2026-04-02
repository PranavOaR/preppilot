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
    const interval = setInterval(compute, 1000);
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
