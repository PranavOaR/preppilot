"use client";

import { useEffect, useState } from "react";
import { subscribeToContest } from "@/lib/db/contests";
import type { Contest } from "@/lib/types";

export function useContestRealtime(contestId: string) {
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) return;

    const unsubscribe = subscribeToContest(contestId, (data) => {
      setContest(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [contestId]);

  return { contest, loading };
}
