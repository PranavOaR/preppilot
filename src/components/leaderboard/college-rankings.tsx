"use client";

interface CollegeData {
  university: string;
  totalXp: number;
  userCount: number;
  avgXp: number;
}

interface CollegeRankingsProps {
  colleges: CollegeData[];
  currentUserUniversity?: string;
}

export function CollegeRankings({ colleges, currentUserUniversity }: CollegeRankingsProps) {
  if (colleges.length === 0) {
    return (
      <div className="rounded-lg bg-surface-container-low subtle-border p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">
          school
        </span>
        <p className="text-on-surface-variant text-sm">
          No college data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
      <div className="grid grid-cols-[60px_1fr_100px_80px_100px] px-5 py-3 border-b border-outline-variant/10">
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Rank</span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">College</span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">Total XP</span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">Members</span>
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider text-right">Avg XP</span>
      </div>

      {colleges.map((college, index) => {
        const rank = index + 1;
        const isMyCollege =
          currentUserUniversity &&
          college.university.toLowerCase() === currentUserUniversity.toLowerCase();

        return (
          <div
            key={college.university}
            className={`grid grid-cols-[60px_1fr_100px_80px_100px] items-center px-5 py-4 border-b border-outline-variant/5 transition-colors ${
              isMyCollege
                ? "bg-primary-container/10 border-l-2 border-l-primary-brand"
                : "hover:bg-surface-container"
            }`}
          >
            <div>
              {rank <= 3 ? (
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    rank === 1
                      ? "text-yellow-400"
                      : rank === 2
                      ? "text-gray-300"
                      : "text-amber-600"
                  }`}
                >
                  {rank === 1 ? "military_tech" : "workspace_premium"}
                </span>
              ) : (
                <span className="font-mono text-on-surface-variant text-sm">{rank}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isMyCollege ? "bg-primary-container/30" : "bg-surface-container-high"
              }`}>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  school
                </span>
              </div>
              <span className={`text-sm font-medium ${isMyCollege ? "text-primary-brand" : "text-on-surface"}`}>
                {college.university}
                {isMyCollege && (
                  <span className="ml-2 text-[10px] text-primary-brand/70">(your college)</span>
                )}
              </span>
            </div>

            <span className="font-mono text-primary-brand text-sm text-right">
              {college.totalXp.toLocaleString()}
            </span>
            <span className="font-mono text-on-surface-variant text-sm text-right">
              {college.userCount}
            </span>
            <span className="font-mono text-on-surface-variant text-sm text-right">
              {college.avgXp}
            </span>
          </div>
        );
      })}
    </div>
  );
}
