"use client";

interface PercentileCardProps {
  percentile: number;
  totalAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
}

export function PercentileCard({
  percentile,
  totalAttempted,
  totalCorrect,
  overallAccuracy,
}: PercentileCardProps) {
  return (
    <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-5">
      {/* Percentile Circle */}
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-surface-container)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-primary-brand)"
              strokeWidth="8"
              strokeDasharray={`${(percentile / 100) * 264} 264`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-primary-brand">
              {percentile}%
            </span>
            <span className="text-[10px] text-on-surface-variant">percentile</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-on-surface font-medium text-lg">
            Top {100 - percentile}%
          </p>
          <p className="text-on-surface-variant text-sm">
            You&apos;re ahead of {percentile}% of all users on PrepPilot.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant/10">
        <div className="text-center">
          <p className="text-on-surface font-semibold text-lg">{totalAttempted}</p>
          <p className="text-on-surface-variant text-xs">Attempted</p>
        </div>
        <div className="text-center">
          <p className="text-green-400 font-semibold text-lg">{totalCorrect}</p>
          <p className="text-on-surface-variant text-xs">Correct</p>
        </div>
        <div className="text-center">
          <p className="text-primary-brand font-semibold text-lg">{overallAccuracy}%</p>
          <p className="text-on-surface-variant text-xs">Accuracy</p>
        </div>
      </div>
    </div>
  );
}
