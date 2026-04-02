"use client";

import type { InterviewQA } from "@/lib/types/interview";

interface InterviewTranscriptProps {
  qas: InterviewQA[];
  currentQuestion?: string;
}

export function InterviewTranscript({ qas, currentQuestion }: InterviewTranscriptProps) {
  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {qas.map((qa, i) => (
        <div key={i} className="space-y-2">
          {/* Interviewer */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary-brand">smart_toy</span>
            </div>
            <div className="flex-1 bg-surface-container rounded-lg rounded-tl-sm p-3">
              <p className="text-sm text-on-surface">{qa.questionText}</p>
            </div>
          </div>

          {/* Candidate */}
          {qa.userTranscript && (
            <div className="flex gap-3 justify-end">
              <div className="flex-1 bg-primary-container/15 rounded-lg rounded-tr-sm p-3 max-w-[85%] ml-auto">
                <p className="text-sm text-on-surface">{qa.userTranscript}</p>
                {qa.score > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/10">
                    <span className={`text-xs font-medium ${
                      qa.score >= 7 ? "text-green-400" : qa.score >= 4 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {qa.score}/10
                    </span>
                    <span className="text-xs text-on-surface-variant">{qa.evaluation}</span>
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Current question being asked */}
      {currentQuestion && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-primary-brand">smart_toy</span>
          </div>
          <div className="flex-1 bg-surface-container rounded-lg rounded-tl-sm p-3">
            <p className="text-sm text-on-surface">{currentQuestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
