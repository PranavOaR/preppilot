"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { InterviewSetup } from "@/components/interview/interview-setup";
import { createInterviewSession } from "@/lib/db/interviews";
import type { InterviewConfig } from "@/lib/types/interview";

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  async function handleStart(config: InterviewConfig) {
    if (!user) return;

    const sessionId = await createInterviewSession({
      userId: user.uid,
      type: config.type,
      targetCompany: config.targetCompany,
      language: config.language,
      totalQuestions: config.totalQuestions,
      questionsCompleted: 0,
      status: "in-progress",
      overallScore: null,
    });

    router.push(`/interview/${sessionId}`);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <InterviewSetup
        onStart={handleStart}
        defaultCompany={profile?.targetCompany}
      />
    </main>
  );
}
