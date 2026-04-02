"use client";

interface ProblemsDonutProps {
  solved: number;
  total: number;
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
}

function DifficultyBar({
  label,
  solved,
  total,
  colorClass,
}: {
  label: string;
  solved: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-mono text-on-surface text-xs">
          {solved}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ProblemsDonut({
  solved,
  total,
  easy,
  medium,
  hard,
}: ProblemsDonutProps) {
  const radius = 54;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const pct = total > 0 ? solved / total : 0;
  const strokeDashoffset = circumference - pct * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Donut */}
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} className="block">
          {/* Background ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="var(--color-surface-container-high)"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="var(--color-primary-brand)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius} ${radius})`}
            className="transition-all duration-700"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl text-on-surface font-bold">
            {solved}
          </span>
          <span className="text-on-surface-variant text-xs">/ {total}</span>
        </div>
      </div>

      {/* Difficulty bars */}
      <div className="w-full space-y-3">
        <DifficultyBar
          label="Easy"
          solved={easy.solved}
          total={easy.total}
          colorClass="bg-green-400"
        />
        <DifficultyBar
          label="Medium"
          solved={medium.solved}
          total={medium.total}
          colorClass="bg-yellow-400"
        />
        <DifficultyBar
          label="Hard"
          solved={hard.solved}
          total={hard.total}
          colorClass="bg-error-brand"
        />
      </div>
    </div>
  );
}
