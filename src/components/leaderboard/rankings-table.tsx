interface RankEntry {
  rank: number;
  username: string;
  xp: string;
}

const rankings: RankEntry[] = [
  { rank: 4, username: "binary_bard", xp: "11,200 XP" },
  { rank: 5, username: "code_whisperer", xp: "10,850 XP" },
  { rank: 6, username: "logic_gate", xp: "9,920 XP" },
  { rank: 7, username: "data_digger", xp: "9,410 XP" },
  { rank: 8, username: "shadow_syntax", xp: "8,800 XP" },
];

export function RankingsTable() {
  return (
    <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[60px_1fr_120px] px-5 py-3 border-b border-outline-variant/10">
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Rank
        </span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Craftsman
        </span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">
          Reputation
        </span>
      </div>

      {/* Entries */}
      {rankings.map((entry) => (
        <div
          key={entry.rank}
          className="grid grid-cols-[60px_1fr_120px] items-center px-5 py-4 border-b border-outline-variant/5 hover:bg-surface-container transition-colors"
        >
          <span className="font-mono text-on-surface-variant text-sm">
            {entry.rank}
          </span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="text-on-surface-variant text-xs font-medium">
                {entry.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-on-surface text-sm font-medium">
              {entry.username}
            </span>
          </div>
          <span className="font-mono text-primary-brand text-sm text-right">
            {entry.xp}
          </span>
        </div>
      ))}

      {/* Ellipsis */}
      <div className="px-5 py-6 text-center">
        <p className="text-outline text-sm italic font-serif">
          ... and 42 others pursuing excellence ...
        </p>
      </div>
    </div>
  );
}
