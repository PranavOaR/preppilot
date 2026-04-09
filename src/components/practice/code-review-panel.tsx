"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

interface CodeReviewPanelProps {
  problemId: string;
  code: string;
  language: string;
  passed: boolean;
}

interface ReviewResult {
  timeComplexity: string;
  spaceComplexity: string;
  qualityNotes: string;
  alternativeApproach: string;
}

export function CodeReviewPanel({ problemId, code, language, passed }: CodeReviewPanelProps) {
  const { user } = useAuth();
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetReview() {
    if (!user || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, userId: user.uid, code, language, passed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error === "limit_reached" ? data.message : (data.error || "Failed to get review."));
        return;
      }

      setReview(data);
    } catch {
      setError("Failed to connect to review service.");
    } finally {
      setLoading(false);
    }
  }

  if (!review && !loading && !error) {
    return (
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <button
          onClick={handleGetReview}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-container/10 text-primary-brand hover:bg-primary-container/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Get AI Code Review
        </button>
        <p className="text-xs text-on-surface-variant mt-1.5 ml-1">
          Get complexity analysis and quality feedback (Pro/Premium)
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined text-[18px] animate-spin text-primary-brand">
            progress_activity
          </span>
          Analyzing your code...
        </div>
      </div>
    );
  }

  if (error) {
    const isLimitReached = error.toLowerCase().includes("upgrade") || error.toLowerCase().includes("not available");
    return (
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg mb-2">{error}</div>
        {isLimitReached ? (
          <Link href="/pricing" className="text-xs text-primary-brand hover:underline">
            View plans →
          </Link>
        ) : (
          <button
            onClick={handleGetReview}
            className="text-xs text-primary-brand hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="mt-4 pt-4 border-t border-outline-variant/10 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary-brand">auto_awesome</span>
        <h4 className="text-sm font-medium text-on-surface">AI Code Review</h4>
      </div>

      {/* Complexity Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-container-lowest p-3 space-y-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">
            Time Complexity
          </p>
          <p className="text-on-surface font-mono text-sm font-medium">{review.timeComplexity}</p>
        </div>
        <div className="rounded-lg bg-surface-container-lowest p-3 space-y-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">
            Space Complexity
          </p>
          <p className="text-on-surface font-mono text-sm font-medium">{review.spaceComplexity}</p>
        </div>
      </div>

      {/* Quality Notes */}
      {review.qualityNotes && review.qualityNotes !== "—" && (
        <div className="rounded-lg bg-surface-container-lowest p-3 space-y-1.5">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">
            Code Quality
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed">{review.qualityNotes}</p>
        </div>
      )}

      {/* Alternative Approach */}
      {review.alternativeApproach && review.alternativeApproach !== "—" && (
        <div className="rounded-lg bg-tertiary-container/10 p-3 space-y-1.5">
          <p className="text-xs text-tertiary uppercase tracking-wider font-medium">
            Alternative Approach
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed">{review.alternativeApproach}</p>
        </div>
      )}
    </div>
  );
}
