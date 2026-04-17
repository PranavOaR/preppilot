"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserBookmarks, removeBookmark, type Bookmark } from "@/lib/db/bookmarks";

const difficultyClass: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-error-brand",
};

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "dsa" | "aptitude">("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    getUserBookmarks(user.uid)
      .then((b) => { if (!cancelled) setBookmarks(b); })
      .catch((err) => console.error("Failed to load bookmarks:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function handleRemove(b: Bookmark) {
    if (!user) return;
    setBookmarks((prev) => prev.filter((x) => x.id !== b.id));
    try {
      await removeBookmark(user.uid, b.problemId);
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
      // Re-fetch to recover if deletion failed
      const fresh = await getUserBookmarks(user.uid);
      setBookmarks(fresh);
    }
  }

  if (!user) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-on-surface-variant">Please sign in to view your bookmarks.</p>
      </main>
    );
  }

  const filtered = filter === "all" ? bookmarks : bookmarks.filter((b) => b.problemType === filter);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Bookmarks
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Problems you&apos;ve saved for later, with your personal notes.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "dsa", "aptitude"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary-container/20 text-primary-brand"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {f === "all" ? "All" : f.toUpperCase()}
            {f === "all" && (
              <span className="ml-1.5 text-outline">{bookmarks.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low subtle-border p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-outline text-5xl">bookmark_border</span>
          <p className="text-on-surface text-sm font-medium">No bookmarks yet</p>
          <p className="text-on-surface-variant text-xs max-w-sm mx-auto">
            Tap the bookmark icon on any problem to save it for later. Add notes to remember key insights.
          </p>
          <Link
            href="/practice"
            className="inline-block mt-2 text-xs text-primary-brand hover:underline"
          >
            Browse problems →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="rounded-xl bg-surface-container-low subtle-border p-4 space-y-2 group"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/practice/${b.problemSlug}`}
                  className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <p className="text-on-surface text-sm font-medium truncate">
                    {b.problemTitle}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className={`capitalize ${difficultyClass[b.problemDifficulty]}`}>
                      {b.problemDifficulty}
                    </span>
                    <span className="text-outline capitalize">
                      {b.problemTopic.replace(/-/g, " ")}
                    </span>
                    <span className="text-outline uppercase text-[10px]">
                      {b.problemType}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(b)}
                  className="p-1.5 rounded-md text-outline hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove bookmark"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
              {b.note && (
                <div className="rounded-md bg-surface-container px-3 py-2 text-xs text-on-surface-variant whitespace-pre-wrap">
                  {b.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
