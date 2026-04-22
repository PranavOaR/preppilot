"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ProblemPicker } from "@/components/admin/problem-picker";

interface Section {
  label: string;
  type: "aptitude" | "dsa";
  problemIds: string[];
}

const DEFAULT_SECTION: () => Section = () => ({
  label: "",
  type: "aptitude",
  problemIds: [],
});

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminCreateMockTestPage() {
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [tags, setTags] = useState("");
  const [sections, setSections] = useState<Section[]>([DEFAULT_SECTION()]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSection(idx: number, patch: Partial<Section>) {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addSection() {
    setSections((prev) => [...prev, DEFAULT_SECTION()]);
    setActiveSectionIdx(sections.length);
  }

  function removeSection(idx: number) {
    if (sections.length <= 1) return;
    const next = sections.filter((_, i) => i !== idx);
    setSections(next);
    setActiveSectionIdx(Math.min(activeSectionIdx, next.length - 1));
  }

  async function handleSave() {
    setError(null);

    if (!company.trim()) { setError("Company name is required."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (sections.some((s) => !s.label.trim())) { setError("All sections need a label."); return; }
    if (sections.some((s) => s.problemIds.length === 0)) { setError("Every section needs at least one problem."); return; }

    const id = slugify(`${company}-${title}`);
    setSaving(true);
    try {
      await setDoc(doc(db, "mockTests", id), {
        company: company.trim(),
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
        difficulty,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        sections: sections.map((s) => ({
          label: s.label.trim(),
          type: s.type,
          count: s.problemIds.length,
          problemIds: s.problemIds,
        })),
      });
      router.push("/admin/mock-tests");
    } catch (err) {
      console.error(err);
      setError("Failed to save. Make sure you have admin privileges.");
    } finally {
      setSaving(false);
    }
  }

  const activeSection = sections[activeSectionIdx];

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Create Mock Test
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Build a company mock test by filling in details and picking problems for each section.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container/20 border border-error-brand/20 px-4 py-3 text-sm text-error-brand">
          {error}
        </div>
      )}

      {/* Meta Fields */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-5">
        <h2 className="text-on-surface font-medium">Test Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="TCS, Infosys, Wipro, Zoho…"
              className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="TCS NQT 2024 Pattern"
              className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of what this test covers…"
            className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              min={10}
              max={360}
              className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="TCS, NQT, aptitude"
              className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-on-surface font-medium">Sections</h2>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 text-sm text-primary-brand hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Section
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSectionIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                i === activeSectionIdx
                  ? "bg-primary-container/20 text-primary-brand"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {s.label || `Section ${i + 1}`}
              <span className="opacity-60 text-[10px]">({s.problemIds.length})</span>
              {sections.length > 1 && (
                <span
                  className="material-symbols-outlined text-[12px] hover:text-error-brand"
                  onClick={(e) => { e.stopPropagation(); removeSection(i); }}
                >
                  close
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active section editor */}
        {activeSection && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Section Label</label>
                <input
                  value={activeSection.label}
                  onChange={(e) => updateSection(activeSectionIdx, { label: e.target.value })}
                  placeholder="Quantitative Aptitude, Coding…"
                  className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Section Type</label>
                <select
                  value={activeSection.type}
                  onChange={(e) => updateSection(activeSectionIdx, { type: e.target.value as "aptitude" | "dsa" })}
                  className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
                >
                  <option value="aptitude">Aptitude / MCQ</option>
                  <option value="dsa">DSA / Coding</option>
                </select>
              </div>
            </div>

            <div>
              <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">
                Pick Problems ({activeSection.problemIds.length} selected)
              </p>
              <ProblemPicker
                selectedIds={activeSection.problemIds}
                onSelectionChange={(ids) => updateSection(activeSectionIdx, { problemIds: ids })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create Mock Test"}
        </button>
        <button
          onClick={() => router.push("/admin/mock-tests")}
          className="px-5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
