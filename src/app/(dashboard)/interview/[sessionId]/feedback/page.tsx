"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { useAuth } from "@/contexts/auth-context";
import {
  getInterviewSession,
  getInterviewFeedback,
  getInterviewQAs,
  saveInterviewFeedback,
} from "@/lib/db/interviews";
import { FeedbackReport } from "@/components/interview/feedback-report";
import type { InterviewFeedback, InterviewSession } from "@/lib/types/interview";

export default function InterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();

  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getInterviewSession(sessionId),
      getInterviewFeedback(sessionId),
    ])
      .then(([s, fb]) => {
        if (!s || s.userId !== user.uid) {
          router.replace("/interview");
          return;
        }
        setSession(s);
        if (fb) {
          setFeedback(fb);
        } else if (s.status !== "completed") {
          // Session not done yet — go back to active interview
          router.replace(`/interview/${sessionId}`);
        } else {
          // Session completed but feedback generation failed — show retry UI
          setError(true);
        }
      })
      .catch(() => router.replace("/interview"))
      .finally(() => setLoading(false));
  }, [sessionId, user, router]);

  const handleRetry = useCallback(async () => {
    if (!session || !user) return;
    setRetrying(true);
    setError(false);
    try {
      const qas = await getInterviewQAs(sessionId);
      const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          type: session.type,
          targetCompany: session.targetCompany,
          qas,
        }),
      });
      if (!res.ok) throw new Error("Feedback generation failed");
      const fb = await res.json();
      const feedbackDoc: InterviewFeedback = {
        sessionId,
        userId: user.uid,
        ...fb,
      };
      await saveInterviewFeedback(feedbackDoc);
      setFeedback(feedbackDoc);
    } catch {
      setError(true);
    } finally {
      setRetrying(false);
    }
  }, [session, sessionId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error) {
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
        <div className="rounded-xl bg-surface-container-low subtle-border p-10 text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-outline block">sentiment_dissatisfied</span>
          <h2 className="text-on-surface font-medium text-lg">Feedback generation failed</h2>
          <p className="text-on-surface-variant text-sm">
            Something went wrong while generating your feedback. Try regenerating it below.
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="mx-auto flex items-center gap-2 px-6 py-2.5 rounded-lg gradient-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {retrying ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Regenerating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Regenerate Feedback
              </>
            )}
          </button>
        </div>
      </main>
    );
  }

  if (!feedback) return null;

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
