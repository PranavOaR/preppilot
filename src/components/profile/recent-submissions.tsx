"use client";

import Link from "next/link";

interface SubmissionItem {
  problemTitle: string;
  problemSlug: string;
  status: string;
  language: string;
  submittedAt: any;
}

interface RecentSubmissionsProps {
  submissions: SubmissionItem[];
}

function formatRelativeTime(timestamp: any): string {
  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  if (submissions.length === 0) {
    return (
      <p className="text-on-surface-variant text-sm text-center py-4">
        No submissions yet. Start practicing!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {submissions.map((sub, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-container/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href={`/practice/${sub.problemSlug}`}
              className="text-on-surface text-sm hover:text-primary-brand transition-colors truncate"
            >
              {sub.problemTitle}
            </Link>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                sub.status === "accepted"
                  ? "bg-green-400/15 text-green-400"
                  : "bg-error-brand/15 text-error-brand"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">
                {sub.status === "accepted" ? "check_circle" : sub.status === "time_limit_exceeded" ? "timer_off" : sub.status === "compile_error" ? "error" : "cancel"}
              </span>
              {formatStatus(sub.status)}
            </span>
            <span className="text-outline text-xs font-mono uppercase">
              {sub.language}
            </span>
            <span className="text-outline text-xs whitespace-nowrap">
              {formatRelativeTime(sub.submittedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
