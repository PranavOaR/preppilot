"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getEditorial,
  saveEditorial,
  type Editorial,
  type EditorialApproach,
} from "@/lib/db/editorials";

const EMPTY_APPROACH: () => EditorialApproach = () => ({
  title: "",
  complexity: "",
  explanation: "",
  code: { python: "", cpp: "", java: "" },
});

export function AdminEditorialEditor({ problemId }: { problemId: string }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [approaches, setApproaches] = useState<EditorialApproach[]>([EMPTY_APPROACH()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEditorial(problemId)
      .then((e) => {
        if (e) {
          setContent(e.content || "");
          setApproaches(e.approaches?.length ? e.approaches : [EMPTY_APPROACH()]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [problemId]);

  function updateApproach(i: number, patch: Partial<EditorialApproach>) {
    setApproaches((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function updateCode(i: number, lang: string, code: string) {
    setApproaches((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, code: { ...a.code, [lang]: code } } : a))
    );
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveEditorial(
        problemId,
        { content, approaches: approaches.filter((a) => a.title.trim()) },
        user.uid
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-xl bg-surface-container-low subtle-border p-6 space-y-6">
      <h2 className="text-on-surface font-medium flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary-brand">article</span>
        Editorial
      </h2>

      <div className="space-y-1.5">
        <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Intro / Overview
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Brief overview of the editorial…"
          className="w-full bg-surface-container rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand resize-none"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-on-surface text-sm font-medium">Approaches</p>
          <button
            type="button"
            onClick={() => setApproaches((p) => [...p, EMPTY_APPROACH()])}
            className="text-xs text-primary-brand hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add approach
          </button>
        </div>

        {approaches.map((a, i) => (
          <div key={i} className="rounded-lg bg-surface-container p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={a.title}
                onChange={(e) => updateApproach(i, { title: e.target.value })}
                placeholder="Approach title (e.g. Brute Force, Hash Map)"
                className="flex-1 bg-surface-container-low rounded-lg px-3 py-1.5 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
              />
              <input
                value={a.complexity}
                onChange={(e) => updateApproach(i, { complexity: e.target.value })}
                placeholder="O(n) / O(1)"
                className="w-32 bg-surface-container-low rounded-lg px-3 py-1.5 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand"
              />
              {approaches.length > 1 && (
                <button
                  type="button"
                  onClick={() => setApproaches((p) => p.filter((_, idx) => idx !== i))}
                  className="text-outline hover:text-error-brand"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
            <textarea
              value={a.explanation}
              onChange={(e) => updateApproach(i, { explanation: e.target.value })}
              rows={3}
              placeholder="Explain the approach…"
              className="w-full bg-surface-container-low rounded-lg px-3 py-2 text-on-surface text-sm outline-none focus:ring-1 ring-primary-brand resize-none"
            />
            {(["python", "cpp", "java"] as const).map((lang) => (
              <details key={lang}>
                <summary className="cursor-pointer text-xs text-on-surface-variant hover:text-on-surface list-none flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)} code (optional)
                </summary>
                <textarea
                  value={a.code[lang] || ""}
                  onChange={(e) => updateCode(i, lang, e.target.value)}
                  rows={6}
                  spellCheck={false}
                  placeholder={`# ${lang} solution`}
                  className="mt-2 w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-on-surface text-xs font-mono outline-none focus:ring-1 ring-primary-brand resize-none"
                />
              </details>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saved ? "Saved!" : saving ? "Saving…" : "Save Editorial"}
      </button>
    </div>
  );
}
