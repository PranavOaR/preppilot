"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createContest } from "@/lib/db/contests";
import { ProblemPicker } from "@/components/admin/problem-picker";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: "Basics" },
  { num: 2, label: "Schedule" },
  { num: 3, label: "Problems" },
  { num: 4, label: "Review" },
];

export default function CreateContestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contestType, setContestType] = useState<"dsa" | "aptitude" | "mixed">("mixed");

  // Step 2: Scheduling
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);

  // Step 3: Problems
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  function canProceed(): boolean {
    switch (step) {
      case 1: return Boolean(title && description);
      case 2: return Boolean(startDate && startTime && duration > 0);
      case 3: return selectedProblemIds.length > 0;
      default: return true;
    }
  }

  async function handlePublish() {
    if (!user) return;
    setSubmitting(true);
    try {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      const now = new Date();

      let status: "upcoming" | "active" | "completed" = "upcoming";
      if (now >= start && now < end) status = "active";
      else if (now >= end) status = "completed";

      await createContest({
        title,
        description,
        type: contestType,
        topics: [],
        startTime: start,
        endTime: end,
        duration,
        problemIds: selectedProblemIds,
        status,
        createdBy: user.uid,
      });
      router.push("/admin/contests");
    } catch (err) {
      console.error("Failed to create contest:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Create Contest
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Set up a timed challenge for your users.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => s.num < step && setStep(s.num as Step)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s.num
                  ? "gradient-primary text-on-primary"
                  : step > s.num
                  ? "bg-green-500/15 text-green-400 cursor-pointer"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {step > s.num ? (
                <span className="material-symbols-outlined text-[14px]">check</span>
              ) : (
                <span>{s.num}</span>
              )}
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="w-8 h-px bg-outline-variant/30" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-on-surface text-sm font-medium">Contest Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
              placeholder="Weekly DSA Challenge #1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-on-surface text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
              placeholder="A timed challenge focusing on array problems..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-on-surface text-sm font-medium">Contest Type</label>
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
        </div>
      )}

      {/* Step 2: Scheduling */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-on-surface text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
              />
            </div>
            <div className="space-y-2">
              <label className="text-on-surface text-sm font-medium">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
              />
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
            <p className="text-on-surface-variant text-xs">
              Contest will end at:{" "}
              {startDate && startTime && duration
                ? new Date(
                    new Date(`${startDate}T${startTime}`).getTime() + duration * 60000
                  ).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Problems */}
      {step === 3 && (
        <ProblemPicker
          selectedIds={selectedProblemIds}
          onSelectionChange={setSelectedProblemIds}
        />
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-lg bg-surface-container-low subtle-border p-6 space-y-4">
            <h3 className="text-on-surface font-medium">Review Contest</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant">Title:</span>
                <p className="text-on-surface font-medium">{title}</p>
              </div>
              <div>
                <span className="text-on-surface-variant">Type:</span>
                <p className="text-on-surface font-medium capitalize">{contestType}</p>
              </div>
              <div>
                <span className="text-on-surface-variant">Start:</span>
                <p className="text-on-surface font-medium">
                  {startDate && startTime
                    ? new Date(`${startDate}T${startTime}`).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant">Duration:</span>
                <p className="text-on-surface font-medium">{duration} minutes</p>
              </div>
              <div>
                <span className="text-on-surface-variant">Problems:</span>
                <p className="text-on-surface font-medium">{selectedProblemIds.length} selected</p>
              </div>
            </div>
            <div>
              <span className="text-on-surface-variant text-sm">Description:</span>
              <p className="text-on-surface text-sm mt-1">{description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-outline-variant/10 mt-8">
        <button
          onClick={() => step > 1 && setStep((step - 1) as Step)}
          disabled={step === 1}
          className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30"
        >
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed()}
            className="px-6 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Contest"}
          </button>
        )}
      </div>
    </div>
  );
}
