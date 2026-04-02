export function UserStanding() {
  return (
    <div className="rounded-lg bg-surface-container-high subtle-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Rank */}
          <span className="font-mono text-on-surface text-lg font-bold w-10">
            124
          </span>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center">
            <span className="text-primary-brand text-sm font-medium">U</span>
          </div>

          {/* User Info */}
          <div>
            <p className="text-on-surface text-sm font-medium">User_Alpha</p>
            <p className="font-mono text-primary-brand text-xs">4,280 XP</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-green-400 text-[20px]">
            trending_up
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-container/20 text-primary-brand">
            Top 2% This Week
          </span>
        </div>
      </div>
    </div>
  );
}
