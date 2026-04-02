interface PodiumEntry {
  rank: number;
  username: string;
  xp: string;
  badge: string;
}

const topThree: PodiumEntry[] = [
  { rank: 2, username: "arc_dev", xp: "14,820 XP", badge: "workspace_premium" },
  { rank: 1, username: "null_pointer", xp: "18,440 XP", badge: "military_tech" },
  { rank: 3, username: "byte_boss", xp: "12,900 XP", badge: "workspace_premium" },
];

const podiumHeights: Record<number, string> = {
  1: "h-36",
  2: "h-28",
  3: "h-24",
};

const rankColors: Record<number, string> = {
  1: "from-primary-brand/20 to-primary-container/10",
  2: "from-tertiary/10 to-transparent",
  3: "from-tertiary/10 to-transparent",
};

export function Podium() {
  return (
    <div className="rounded-lg bg-surface-container-low p-8 subtle-border">
      <div className="flex items-end justify-center gap-4 md:gap-8">
        {topThree.map((entry) => (
          <div
            key={entry.rank}
            className="flex flex-col items-center gap-3"
          >
            {/* Avatar + Badge */}
            <div className="relative">
              <div
                className={`w-16 h-16 ${entry.rank === 1 ? "w-20 h-20" : ""} rounded-full bg-surface-container-high subtle-border flex items-center justify-center`}
              >
                <span className="text-on-surface-variant text-lg font-medium">
                  {entry.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className={`material-symbols-outlined absolute -bottom-1 -right-1 text-[20px] ${
                  entry.rank === 1 ? "text-yellow-400" : "text-primary-brand"
                }`}
              >
                {entry.badge}
              </span>
            </div>

            {/* Username */}
            <p
              className={`text-on-surface text-sm font-medium ${
                entry.rank === 1 ? "text-base" : ""
              }`}
            >
              {entry.username}
            </p>

            {/* XP */}
            <p className="font-mono text-primary-brand text-xs">
              {entry.xp}
            </p>

            {/* Podium Block */}
            <div
              className={`${podiumHeights[entry.rank]} w-24 md:w-32 rounded-t-lg bg-gradient-to-t ${rankColors[entry.rank]} flex items-start justify-center pt-3`}
            >
              <span
                className={`font-serif font-bold ${
                  entry.rank === 1
                    ? "text-2xl text-primary-brand"
                    : "text-xl text-on-surface-variant"
                }`}
              >
                {entry.rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
