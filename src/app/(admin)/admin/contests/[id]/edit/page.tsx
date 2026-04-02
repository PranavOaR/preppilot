"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getContestById, updateContest } from "@/lib/db/contests";
import { ProblemPicker } from "@/components/admin/problem-picker";
import type { Contest } from "@/lib/types";

export default function EditContestPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contestType, setContestType] = useState<"dsa" | "aptitude" | "mixed">("mixed");
  const [duration, setDuration] = useState(60);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const c = await getContestById(contestId);
      if (c) {
        setContest(c);
        setTitle(c.title);
        setDescription(c.description);
        setContestType(c.type || "mixed");
        setDuration(c.duration);
        setSelectedProblemIds(c.problemIds || []);
      }
      setLoading(false);
    }
    load();
  }, [contestId]);

  async function handleSave() {
    setSubmitting(true);
    try {
      await updateContest(contestId, {
        title,
        description,
        type: contestType,
        duration,
        problemIds: selectedProblemIds,
      });
      router.push("/admin/contests");
    } catch (err) {
      console.error("Failed to update contest:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="p-8">
        <p className="text-on-surface-variant">Contest not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Edit Contest
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Editing: {contest.title}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
          />
        </div>

        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
          />
        </div>

        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Type</label>
          <div className="flex gap-2">
            {(["dsa", "aptitude", "mixed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setContestType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contestType === t
                    ? "gradient-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t === "dsa" ? "DSA" : t === "aptitude" ? "Aptitude" : "Mixed"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            min={5}
            max={300}
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
          />
        </div>

        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Problems</label>
          <ProblemPicker
            selectedIds={selectedProblemIds}
            onSelectionChange={setSelectedProblemIds}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/10">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => router.push("/admin/contests")}
          className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
