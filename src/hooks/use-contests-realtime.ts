"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeToContests } from "@/lib/db/contests";
import { useToast } from "@/contexts/toast-context";
import type { Contest } from "@/lib/types";

export function useContestsRealtime() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const previousIdsRef = useRef<Set<string> | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToContests((newContests) => {
      // Detect newly added contests
      if (previousIdsRef.current !== null) {
        const prevIds = previousIdsRef.current;
        for (const contest of newContests) {
          if (!prevIds.has(contest.id)) {
            showToast(`New contest: ${contest.title}!`, "info");
          }
        }
      }

      previousIdsRef.current = new Set(newContests.map((c) => c.id));
      setContests(newContests);
      setLoading(false);
    });

    return unsubscribe;
  }, [showToast]);

  return { contests, loading };
}
