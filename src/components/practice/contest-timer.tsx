"use client";

import { useEffect, useState } from "react";

interface ContestTimerProps {
  endTime: Date;
  onTimeUp: () => void;
}

export function ContestTimer({ endTime, onTimeUp }: ContestTimerProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime.getTime() - Date.now()));
  const isWarning = remaining < 5 * 60 * 1000; // less than 5 minutes
  const isExpired = remaining <= 0;

  useEffect(() => {
    if (isExpired) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      const diff = Math.max(0, endTime.getTime() - Date.now());
      setRemaining(diff);
      if (diff <= 0) {
        clearInterval(timer);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, isExpired, onTimeUp]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((remaining % (1000 * 60)) / 1000);

  const timeStr = `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div
      className={`sticky top-[57px] z-40 px-6 py-2.5 flex items-center justify-between text-sm font-medium transition-colors ${
        isExpired
          ? "bg-red-500/20 text-red-400"
          : isWarning
          ? "bg-yellow-500/15 text-yellow-400"
          : "bg-green-500/10 text-green-400"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">timer</span>
        <span>Contest in Progress</span>
      </div>

      <div className="flex items-center gap-2">
        {isWarning && !isExpired && (
          <span className="material-symbols-outlined text-[18px] animate-pulse">
            warning
          </span>
        )}
        <span className="font-mono text-base">
          {isExpired ? "Time's Up!" : timeStr}
        </span>
      </div>
    </div>
  );
}
