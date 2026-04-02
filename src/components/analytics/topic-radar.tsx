"use client";

import type { TopicAccuracy } from "@/lib/db/analytics";

interface TopicRadarProps {
  data: TopicAccuracy[];
}

export function TopicRadar({ data }: TopicRadarProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-low subtle-border p-8 text-center">
        <span className="material-symbols-outlined text-[40px] text-outline mb-2 block">
          bar_chart
        </span>
        <p className="text-on-surface-variant text-sm">
          Solve some problems to see your topic accuracy breakdown.
        </p>
      </div>
    );
  }

  const maxAttempted = Math.max(...data.map((d) => d.attempted), 1);

  return (
    <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-4">
      <h3 className="text-on-surface font-medium flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary-brand">
          bar_chart
        </span>
        Topic-wise Accuracy
      </h3>

      <div className="space-y-3">
        {data.map((topic) => (
          <div key={topic.topic} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-on-surface text-sm capitalize">
                {topic.topic.replace(/-/g, " ")}
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-on-surface-variant">
                  {topic.correct}/{topic.attempted}
                </span>
                <span
                  className={`font-medium ${
                    topic.accuracy >= 70
                      ? "text-green-400"
                      : topic.accuracy >= 40
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {topic.accuracy}%
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="relative h-2.5 rounded-full bg-surface-container overflow-hidden">
              {/* Volume bar (how many attempted relative to max) */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-surface-container-high"
                style={{ width: `${(topic.attempted / maxAttempted) * 100}%` }}
              />
              {/* Accuracy bar */}
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  topic.accuracy >= 70
                    ? "bg-green-500/50"
                    : topic.accuracy >= 40
                    ? "bg-yellow-500/50"
                    : "bg-red-500/50"
                }`}
                style={{
                  width: `${(topic.correct / maxAttempted) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
