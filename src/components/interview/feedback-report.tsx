"use client";

import type { InterviewFeedback } from "@/lib/types/interview";

interface FeedbackReportProps {
  feedback: InterviewFeedback;
}

export function FeedbackReport({ feedback }: FeedbackReportProps) {
  const scoreColor =
    feedback.overallScore >= 70
      ? "text-green-400"
      : feedback.overallScore >= 40
      ? "text-yellow-400"
      : "text-red-400";

  const scoreRingColor =
    feedback.overallScore >= 70
      ? "stroke-green-400"
      : feedback.overallScore >= 40
      ? "stroke-yellow-400"
      : "stroke-red-400";

  return (
    <div className="space-y-6">
      {/* Score Ring */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              strokeWidth="8"
              className="stroke-surface-container-high"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(feedback.overallScore / 100) * 264} 264`}
              className={scoreRingColor}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>
              {feedback.overallScore}
            </span>
            <span className="text-xs text-on-surface-variant">/100</span>
          </div>
        </div>
        <p className="text-on-surface font-medium">Overall Score</p>
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-surface-container p-4 subtle-border">
        <h3 className="text-on-surface text-sm font-medium mb-2">Summary</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          {feedback.summary}
        </p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-green-400/5 border border-green-400/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-green-400">thumb_up</span>
            <h3 className="text-green-400 text-sm font-medium">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                <span className="text-green-400 shrink-0">&bull;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-red-400/5 border border-red-400/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-red-400">flag</span>
            <h3 className="text-red-400 text-sm font-medium">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {feedback.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                <span className="text-red-400 shrink-0">&bull;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topic Scores */}
      {Object.keys(feedback.topicScores).length > 0 && (
        <div className="rounded-lg bg-surface-container p-4 subtle-border">
          <h3 className="text-on-surface text-sm font-medium mb-3">Topic Scores</h3>
          <div className="space-y-3">
            {Object.entries(feedback.topicScores).map(([topic, score]) => (
              <div key={topic}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-on-surface-variant capitalize">
                    {topic.replace(/-/g, " ")}
                  </span>
                  <span className={`font-medium ${
                    score >= 7 ? "text-green-400" : score >= 4 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {score}/10
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score >= 7 ? "bg-green-400" : score >= 4 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="rounded-lg bg-surface-container p-4 subtle-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[18px] text-primary-brand">tips_and_updates</span>
          <h3 className="text-on-surface text-sm font-medium">Suggestions</h3>
        </div>
        <ul className="space-y-2">
          {feedback.suggestions.map((s, i) => (
            <li key={i} className="text-sm text-on-surface-variant flex gap-2">
              <span className="text-primary-brand shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
