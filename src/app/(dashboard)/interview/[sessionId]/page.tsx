"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getInterviewSession } from "@/lib/db/interviews";
import { InterviewActive } from "@/components/interview/interview-active";
import { ProctorWrapper } from "@/components/proctor/ProctorWrapper";
import type { InterviewSession, InterviewConfig } from "@/lib/types/interview";

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    getInterviewSession(sessionId)
      .then((s) => {
        if (!s || s.userId !== user.uid) {
          router.replace("/interview");
          return;
        }
        if (s.status === "completed") {
          router.replace(`/interview/${sessionId}/feedback`);
          return;
        }
        setSession(s);
      })
      .catch(() => router.replace("/interview"))
      .finally(() => setLoading(false));
  }, [sessionId, user, router]);

  if (loading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const config: InterviewConfig = {
    type: session.type,
    targetCompany: session.targetCompany,
    totalQuestions: session.totalQuestions,
    language: session.language,
    speaker: session.speaker || "anushka",
    mode: session.mode || "practice",
    topics: session.topics,
  };

  return (
    <ProctorWrapper>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <InterviewActive
          sessionId={sessionId}
          config={config}
          userId={user.uid}
        />
      </main>
    </ProctorWrapper>
  );
}
