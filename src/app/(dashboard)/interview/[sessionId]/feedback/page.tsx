"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getInterviewSession, getInterviewFeedback } from "@/lib/db/interviews";
import { FeedbackReport } from "@/components/interview/feedback-report";
import type { InterviewFeedback } from "@/lib/types/interview";

export default function InterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();

  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getInterviewSession(sessionId),
      getInterviewFeedback(sessionId),
    ])
      .then(([session, fb]) => {
        if (!session || session.userId !== user.uid) {
          router.replace("/interview");
          return;
        }
        if (!fb) {
          // Feedback not generated yet
          router.replace(`/interview/${sessionId}`);
          return;
        }
        setFeedback(fb);
      })
      .catch(() => router.replace("/interview"))
      .finally(() => setLoading(false));
  }, [sessionId, user, router]);

  if (loading || !feedback) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/interview"
          className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-xl font-medium text-on-surface">Interview Feedback</h1>
      </div>

      <FeedbackReport feedback={feedback} />

      <div className="flex items-center gap-3 mt-8">
        <Link href="/interview" className="flex-1">
          <button className="w-full py-3 rounded-lg gradient-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity">
            Start New Interview
          </button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <button className="w-full py-3 rounded-lg bg-surface-container text-on-surface font-medium text-sm hover:bg-surface-container-high transition-colors subtle-border">
            Back to Dashboard
          </button>
        </Link>
      </div>
    </main>
  );
}
