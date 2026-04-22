"use client";

import { useEffect, useState } from "react";
import { getEditorial, type Editorial } from "@/lib/db/editorials";

const codeBlockStyle =
  "bg-surface-container-lowest rounded-lg p-4 text-xs font-mono text-on-surface-variant overflow-x-auto whitespace-pre";

export function EditorialPanel({ problemId }: { problemId: string }) {
  const [editorial, setEditorial] = useState<Editorial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEditorial(problemId)
      .then(setEditorial)
      .catch(() => setEditorial(null))
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="material-symbols-outlined text-outline text-3xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!editorial) {
    return (
      <div className="py-10 text-center space-y-2">
        <span className="material-symbols-outlined text-outline text-4xl">article</span>
        <p className="text-on-surface-variant text-sm">
          Editorial not available yet for this problem.
        </p>
        <p className="text-outline text-xs">
          Solve the problem yourself first — editorials reveal the optimal approach.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editorial.content && (
        <div className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
          {editorial.content}
        </div>
      )}

      {editorial.approaches.map((approach, i) => (
        <div
          key={i}
          className="rounded-xl bg-surface-container-low subtle-border p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-on-surface text-sm font-medium">
              Approach {i + 1}: {approach.title}
            </h4>
            <span className="text-xs text-outline shrink-0">{approach.complexity}</span>
          </div>

          {approach.explanation && (
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {approach.explanation}
            </p>
          )}

          {approach.code && Object.entries(approach.code).map(([lang, code]) =>
            code ? (
              <details key={lang} className="group">
                <summary className="cursor-pointer text-xs text-primary-brand hover:underline list-none flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] group-open:rotate-90 transition-transform">
                    chevron_right
                  </span>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)} solution
                </summary>
                <pre className={`mt-2 ${codeBlockStyle}`}>{code}</pre>
              </details>
            ) : null
          )}
        </div>
      ))}
    </div>
  );
}
