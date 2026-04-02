export function PracticeStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Daily Streak */}
      <div className="rounded-lg bg-surface-container-low p-5 space-y-3">
        <h5 className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Daily Streak
        </h5>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-on-surface text-3xl font-bold">
            12
          </span>
          <span className="text-on-surface-variant text-sm">Days active</span>
        </div>
        <p className="text-outline text-xs">Keep going to reach Level 5</p>
      </div>

      {/* Global Rank */}
      <div className="rounded-lg bg-surface-container-low p-5 space-y-3">
        <h5 className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Global Rank
        </h5>
        <div className="flex items-center justify-between">
          <span className="font-mono text-on-surface text-3xl font-bold">
            #1,402
          </span>
          <div className="flex items-center gap-1">
            {/* Avatar placeholders */}
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary-container/40 border-2 border-surface-container-low" />
              <div className="w-7 h-7 rounded-full bg-tertiary-container/40 border-2 border-surface-container-low" />
            </div>
            <span className="text-primary-brand text-xs font-medium ml-1">
              +42
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
