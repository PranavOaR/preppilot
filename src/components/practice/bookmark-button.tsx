"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  addBookmark,
  removeBookmark,
  getBookmark,
  updateBookmarkNote,
} from "@/lib/db/bookmarks";
import type { Problem } from "@/lib/types";

interface BookmarkButtonProps {
  problem: Problem;
  compact?: boolean;
}

export function BookmarkButton({ problem, compact = false }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getBookmark(user.uid, problem.id)
      .then((b) => {
        if (cancelled) return;
        setBookmarked(!!b);
        setNote(b?.note ?? "");
        setSavedNote(b?.note ?? "");
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, problem.id]);

  async function handleToggle() {
    if (!user || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (bookmarked) {
        await removeBookmark(user.uid, problem.id);
        setBookmarked(false);
        setShowNote(false);
        setNote("");
        setSavedNote("");
      } else {
        await addBookmark({
          userId: user.uid,
          problemId: problem.id,
          problemSlug: problem.slug,
          problemTitle: problem.title,
          problemType: problem.type,
          problemDifficulty: problem.difficulty,
          problemTopic: problem.topic,
        });
        setBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("permission")
          ? "Couldn't save bookmark — permission denied."
          : "Couldn't save bookmark. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote() {
    if (!user || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!bookmarked) {
        await addBookmark({
          userId: user.uid,
          problemId: problem.id,
          problemSlug: problem.slug,
          problemTitle: problem.title,
          problemType: problem.type,
          problemDifficulty: problem.difficulty,
          problemTopic: problem.topic,
          note,
        });
        setBookmarked(true);
      } else {
        await updateBookmarkNote(user.uid, problem.id, note);
      }
      setSavedNote(note);
      setShowNote(false);
    } catch (err) {
      console.error("Save note failed:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("permission")
          ? "Couldn't save note — permission denied."
          : "Couldn't save note. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading || saving}
        className={`p-2 rounded-lg transition-colors ${
          bookmarked
            ? "text-yellow-400 hover:bg-yellow-400/10"
            : "text-outline hover:text-on-surface hover:bg-surface-container"
        } disabled:opacity-50`}
        title={bookmarked ? "Remove bookmark" : "Bookmark this problem"}
      >
        <span className="material-symbols-outlined text-[20px]">
          {bookmarked ? "bookmark" : "bookmark_border"}
        </span>
      </button>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading || saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            bookmarked
              ? "bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
          } disabled:opacity-50`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {bookmarked ? "bookmark" : "bookmark_border"}
          </span>
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <button
          onClick={() => setShowNote((v) => !v)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          {savedNote ? "Edit note" : "Add note"}
        </button>
      </div>

      {error && (
        <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg break-words">
          {error}
        </div>
      )}

      {showNote && (
        <div className="space-y-2 rounded-lg bg-surface-container-low subtle-border p-3 w-full min-w-0">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your notes — approach, gotchas, things to remember..."
            rows={4}
            className="w-full block bg-surface-container text-on-surface text-sm rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-primary-brand"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setShowNote(false); setNote(savedNote); }}
              className="text-xs text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className="text-xs gradient-primary text-on-primary px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {!showNote && savedNote && (
        <div className="rounded-lg bg-surface-container-low subtle-border px-3 py-2 text-xs text-on-surface-variant whitespace-pre-wrap break-words w-full min-w-0 overflow-hidden">
          <span className="text-outline mr-1.5">Note:</span>{savedNote}
        </div>
      )}
    </div>
  );
}
