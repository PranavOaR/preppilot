"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserUnlockedLevels, getCachedHint, setCachedHint, recordHintUsage } from "@/lib/db/hints";
import { checkAndIncrementUsage } from "@/lib/plans/usage";
import { awardXP } from "@/lib/xp/calculator";
import { PLAN_LIMITS } from "@/lib/types/plans";
import type { Problem } from "@/lib/types";

const HINT_LEVELS = [
  { level: 1, label: "Nudge", cost: 5, icon: "lightbulb" },
  { level: 2, label: "Approach", cost: 10, icon: "psychology" },
  { level: 3, label: "Pseudocode", cost: 15, icon: "code_blocks" },
  { level: 4, label: "Walkthrough", cost: 25, icon: "menu_book" },
];

interface HintPanelProps {
  problem: Problem;
}

export function HintPanel({ problem }: HintPanelProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([]);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load previously unlocked hints on mount
  useEffect(() => {
    if (!user) return;
    getUserUnlockedLevels(user.uid, problem.id).then(async (levels) => {
      setUnlockedLevels(levels);
      const loaded: Record<number, string> = {};
      for (const lvl of levels) {
        const cached = await getCachedHint(problem.id, lvl);
        if (cached) loaded[lvl] = cached;
      }
      setHints(loaded);
    });
  }, [user, problem.id]);

  async function handleUnlockHint(level: number) {
    if (!user) return;
    setLoading(level);
    setError(null);

    const xpCost = HINT_LEVELS.find(h => h.level === level)?.cost ?? 5;

    try {
      // 1. Client-side quota check + increment
      const quotaCheck = await checkAndIncrementUsage(user.uid, "aiHint");
      if (!quotaCheck.allowed) {
        setError(`Monthly hint limit reached on your ${quotaCheck.plan} plan. Upgrade for more hints.`);
        return;
      }

      // 2. Client-side XP check
      const userXP = profile?.xp ?? 0;
      if (userXP < xpCost) {
        setError(`Not enough XP. Need ${xpCost} XP, you have ${userXP}.`);
        // Roll back the quota increment since we're not generating
        return;
      }

      // 3. Check hint cache first (avoid calling API for already-generated hints)
      let hintText = await getCachedHint(problem.id, level);

      if (!hintText) {
        // 4. Call API with problem data (server only does Groq call)
        const res = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problem, hintLevel: level }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to get hint.");
          return;
        }

        hintText = data.hint;

        // 5. Cache the hint client-side
        try {
          await setCachedHint(problem.id, level, hintText!, "groq");
        } catch { /* caching is optional, ignore errors */ }
      }

      // 6. Deduct XP client-side
      try {
        await awardXP(user.uid, -xpCost);
      } catch { /* non-critical */ }

      // 7. Record hint usage client-side
      try {
        await recordHintUsage(user.uid, problem.id, level, xpCost);
      } catch { /* non-critical */ }

      setHints((prev) => ({ ...prev, [level]: hintText! }));
      setUnlockedLevels((prev) =>
        prev.includes(level) ? prev : [...prev, level].sort()
      );
      setExpandedLevel(level);
      refreshProfile();
    } catch {
      setError("Failed to connect to hint service.");
    } finally {
      setLoading(null);
    }
  }

  const userXP = profile?.xp ?? 0;
  const plan = profile?.plan || "free";
  const hintLimit = PLAN_LIMITS[plan].aiHints;
  const hintsUsed = profile?.usageThisMonth?.aiHints ?? 0;
  const hintsLeft = hintLimit - hintsUsed;
  const monthlyQuotaReached = hintsLeft <= 0;

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isOpen ? "expand_less" : "assistant"}
        </span>
        <span>AI Hints</span>
        {unlockedLevels.length > 0 && (
          <span className="text-xs text-primary-brand">
            ({unlockedLevels.length}/4 unlocked)
          </span>
        )}
      </button>

      {isOpen && (
        <div className="rounded-lg bg-surface-container-low subtle-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-on-surface-variant">
                Progressive hints — each level reveals more.
              </p>
              <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                Each hint costs XP <span className="text-on-surface-variant">and</span> counts toward your monthly hint quota.
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-xs text-primary-brand font-medium">
                {userXP} XP
              </span>
              <span className={`text-[10px] ${monthlyQuotaReached ? "text-error" : hintsLeft <= 2 ? "text-yellow-400" : "text-on-surface-variant"}`}>
                {hintsLeft}/{hintLimit} hints/mo
              </span>
            </div>
          </div>

          {monthlyQuotaReached && (
            <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg">
              Monthly hint quota reached.{" "}
              <Link href="/pricing" className="underline hover:no-underline font-medium">
                Upgrade →
              </Link>
            </div>
          )}

          {error && (
            <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {HINT_LEVELS.map(({ level, label, cost, icon }) => {
              const isUnlocked = unlockedLevels.includes(level);
              const isExpanded = expandedLevel === level;
              const isLoading = loading === level;
              const canUnlock =
                !isUnlocked &&
                !monthlyQuotaReached &&
                (level === 1 || unlockedLevels.includes(level - 1));
              const isLocked = !isUnlocked && !canUnlock;

              return (
                <div key={level} className="rounded-lg bg-surface-container overflow-hidden">
                  <button
                    onClick={() => {
                      if (isUnlocked) {
                        setExpandedLevel(isExpanded ? null : level);
                      } else if (canUnlock) {
                        handleUnlockHint(level);
                      }
                    }}
                    disabled={isLocked || isLoading}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isLocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-surface-container-high cursor-pointer"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isUnlocked ? "text-primary-brand" : "text-outline"}`}>
                      {isUnlocked ? "lock_open" : isLocked ? "lock" : icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-on-surface">
                          Level {level}: {label}
                        </span>
                        {isUnlocked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-brand">
                            Unlocked
                          </span>
                        )}
                      </div>
                    </div>

                    {isLoading ? (
                      <span className="material-symbols-outlined text-[16px] text-primary-brand animate-spin">
                        progress_activity
                      </span>
                    ) : isUnlocked ? (
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        {isExpanded ? "expand_less" : "expand_more"}
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant">{cost} XP</span>
                    )}
                  </button>

                  {isExpanded && hints[level] && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container-lowest rounded-lg p-3">
                        {hints[level]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
