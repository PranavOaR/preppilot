"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getDiscussions,
  getReplies,
  addComment,
  toggleUpvote,
  type DiscussionComment,
} from "@/lib/db/discussions";

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentItem({
  comment,
  onReply,
  userId,
}: {
  comment: DiscussionComment;
  onReply: (parentId: string, username: string) => void;
  userId?: string;
}) {
  const [replies, setReplies] = useState<DiscussionComment[] | null>(null);
  const [showReplies, setShowReplies] = useState(false);
  const hasUpvoted = userId ? comment.upvotes.includes(userId) : false;
  const [upvoteCount, setUpvoteCount] = useState(comment.upvotes.length);
  const [upvoted, setUpvoted] = useState(hasUpvoted);

  async function handleUpvote() {
    if (!userId) return;
    setUpvoted((u) => !u);
    setUpvoteCount((c) => (upvoted ? c - 1 : c + 1));
    await toggleUpvote(comment.id, userId, upvoted);
  }

  async function handleToggleReplies() {
    if (!showReplies && replies === null) {
      const r = await getReplies(comment.id);
      setReplies(r);
    }
    setShowReplies((s) => !s);
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-surface-container p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-container/30 flex items-center justify-center text-[10px] text-primary-brand font-bold shrink-0">
            {comment.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-on-surface text-xs font-medium">{comment.username}</span>
          <span className="text-outline text-xs">
            {comment.createdAt ? timeAgo(comment.createdAt.seconds) : ""}
          </span>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 text-xs transition-colors ${
              upvoted ? "text-primary-brand" : "text-outline hover:text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {upvoted ? "thumb_up" : "thumb_up"}
            </span>
            {upvoteCount > 0 && <span>{upvoteCount}</span>}
          </button>
          {userId && (
            <button
              onClick={() => onReply(comment.id, comment.username)}
              className="text-xs text-outline hover:text-on-surface-variant transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {replies !== null && showReplies && replies.length > 0 && (
        <div className="ml-4 space-y-2">
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} onReply={onReply} userId={userId} />
          ))}
        </div>
      )}

      {(replies === null || !showReplies) && (
        <button
          onClick={handleToggleReplies}
          className="ml-4 text-xs text-outline hover:text-primary-brand transition-colors"
        >
          {showReplies ? "Hide replies" : replies !== null && replies.length > 0 ? `Show ${replies.length} replies` : ""}
        </button>
      )}
    </div>
  );
}

export function DiscussionPanel({ problemId }: { problemId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    getDiscussions(problemId)
      .then(({ comments: c }) => setComments(c))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [problemId]);

  async function handlePost() {
    if (!user || !profile || !text.trim()) return;
    setPosting(true);
    try {
      const id = await addComment({
        problemId,
        userId: user.uid,
        username: profile.username || user.displayName || "Anonymous",
        photoURL: user.photoURL || undefined,
        content: text.trim(),
        parentId: replyTo?.id,
      });
      const newComment: DiscussionComment = {
        id,
        problemId,
        userId: user.uid,
        username: profile.username || user.displayName || "Anonymous",
        content: text.trim(),
        upvotes: [],
        parentId: replyTo?.id,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      };
      if (!replyTo) {
        setComments((prev) => [newComment, ...prev]);
      }
      setText("");
      setReplyTo(null);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      {user ? (
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container rounded px-2 py-1">
              <span>Replying to <span className="text-primary-brand">{replyTo.username}</span></span>
              <button onClick={() => setReplyTo(null)} className="ml-auto text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your approach, ask a question, or help others…"
            rows={3}
            className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand resize-none"
          />
          <button
            onClick={handlePost}
            disabled={!text.trim() || posting}
            className="px-4 py-1.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {posting ? "Posting…" : replyTo ? "Post Reply" : "Post Comment"}
          </button>
        </div>
      ) : (
        <p className="text-on-surface-variant text-sm text-center py-4">
          Sign in to join the discussion.
        </p>
      )}

      {/* Comments */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="material-symbols-outlined text-outline text-3xl animate-spin">progress_activity</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">
          No comments yet. Be the first to share your approach!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              userId={user?.uid}
              onReply={(id, username) => setReplyTo({ id, username })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
