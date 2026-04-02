"use client";

import { useEffect, useState } from "react";
import { subscribeToParticipants, type ContestParticipant } from "@/lib/db/contests";

export function useLeaderboardRealtime(contestId: string) {
  const [participants, setParticipants] = useState<ContestParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) return;

    const unsubscribe = subscribeToParticipants(contestId, (data) => {
      setParticipants(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [contestId]);

  return { participants, loading };
}
