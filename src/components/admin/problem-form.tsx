"use client";

import { useState } from "react";
import type { Problem, ProblemResource } from "@/lib/types";

interface ProblemFormProps {
  initialData?: Partial<Problem>;
  onSubmit: (data: any) => Promise<void>;
  submitLabel: string;
}

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;
const TYPE_OPTIONS = ["dsa", "aptitude"] as const;
const COMPANIES = [
  "TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra", "Zoho",
  "Flipkart", "Amazon", "Google", "Microsoft", "Accenture", "Cognizant",
];
const LANGUAGES = ["python", "c", "cpp", "java"] as const;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function ProblemForm({ initialData, onSubmit, submitLabel }: ProblemFormProps) {
  const [type, setType] = useState<"dsa" | "aptitude">(initialData?.type || "dsa");
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initialData?.difficulty || "easy");
  const [topic, setTopic] = useState(initialData?.topic || "");
  const [companies, setCompanies] = useState<string[]>(initialData?.companies || []);
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "draft");
  const [submitting, setSubmitting] = useState(false);

  // DSA fields
  const [examples, setExamples] = useState(
    initialData?.examples || [{ input: "", output: "", explanation: "" }]
  );
  const [constraints, setConstraints] = useState<string[]>(initialData?.constraints || [""]);
  const [starterCode, setStarterCode] = useState(
    initialData?.starterCode || { python: "", c: "", cpp: "", java: "" }
  );
  const [testCases, setTestCases] = useState(
    initialData?.testCases || [{ input: "", expectedOutput: "", isHidden: false }]
  );

  // Aptitude fields
  const [options, setOptions] = useState<string[]>(initialData?.options || ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correctAnswer || "");

  // Resources
  const [resources, setResources] = useState<ProblemResource[]>(
    initialData?.resources || []
  );

  const xpReward = difficulty === "easy" ? 10 : difficulty === "medium" ? 25 : 50;

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!initialData?.slug) {
      setSlug(generateSlug(val));
    }
  }

  function toggleCompany(company: string) {
    setCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data: any = {
        title,
        slug,
        type,
        difficulty,
        xpReward,
        topic,
        companies,
        description,
        status,
      };

      if (type === "dsa") {
        data.examples = examples.filter((ex) => ex.input || ex.output);
        data.constraints = constraints.filter(Boolean);
        data.starterCode = starterCode;
        data.testCases = testCases.filter((tc) => tc.input || tc.expectedOutput);
      } else {
        data.options = options.filter(Boolean);
        data.correctAnswer = correctAnswer;
        data.examples = [];
        data.constraints = [];
        data.starterCode = { python: "", c: "", cpp: "", java: "" };
        data.testCases = [];
      }

      data.resources = resources.filter((r) => r.title && r.url);
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Type Selector */}
      <div className="space-y-2">
        <label className="text-on-surface text-sm font-medium">Problem Type</label>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? "gradient-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t === "dsa" ? "DSA" : "Aptitude"}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
            placeholder="Two Sum"
          />
        </div>
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
            placeholder="two-sum"
          />
        </div>
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
            placeholder="arrays"
          />
        </div>
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-on-surface text-sm font-medium">XP Reward</label>
          <input
            type="number"
            value={xpReward}
            readOnly
            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant text-sm subtle-border"
          />
        </div>
      </div>

      {/* Companies */}
      <div className="space-y-2">
        <label className="text-on-surface text-sm font-medium">Companies</label>
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCompany(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                companies.includes(c)
                  ? "bg-primary-container/30 text-primary-brand"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-on-surface text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand font-mono"
          placeholder="Problem description..."
        />
      </div>

      {/* DSA-specific fields */}
      {type === "dsa" && (
        <>
          {/* Examples */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-on-surface text-sm font-medium">Examples</label>
              <button
                type="button"
                onClick={() => setExamples([...examples, { input: "", output: "", explanation: "" }])}
                className="text-xs text-primary-brand hover:underline"
              >
                + Add Example
              </button>
            </div>
            {examples.map((ex, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 rounded-lg bg-surface-container-low p-3 subtle-border">
                <div className="space-y-1">
                  <span className="text-on-surface-variant text-xs">Input</span>
                  <textarea
                    value={ex.input}
                    onChange={(e) => {
                      const copy = [...examples];
                      copy[i] = { ...copy[i], input: e.target.value };
                      setExamples(copy);
                    }}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant text-xs">Output</span>
                  <textarea
                    value={ex.output}
                    onChange={(e) => {
                      const copy = [...examples];
                      copy[i] = { ...copy[i], output: e.target.value };
                      setExamples(copy);
                    }}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs">Explanation</span>
                    {examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setExamples(examples.filter((_, j) => j !== i))}
                        className="text-error-brand text-xs hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    value={ex.explanation}
                    onChange={(e) => {
                      const copy = [...examples];
                      copy[i] = { ...copy[i], explanation: e.target.value };
                      setExamples(copy);
                    }}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-on-surface text-sm font-medium">Constraints</label>
              <button
                type="button"
                onClick={() => setConstraints([...constraints, ""])}
                className="text-xs text-primary-brand hover:underline"
              >
                + Add
              </button>
            </div>
            {constraints.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const copy = [...constraints];
                    copy[i] = e.target.value;
                    setConstraints(copy);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand font-mono"
                  placeholder="1 <= n <= 10^5"
                />
                {constraints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setConstraints(constraints.filter((_, j) => j !== i))}
                    className="text-error-brand text-xs px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Starter Code */}
          <div className="space-y-3">
            <label className="text-on-surface text-sm font-medium">Starter Code</label>
            {LANGUAGES.map((lang) => (
              <div key={lang} className="space-y-1">
                <span className="text-on-surface-variant text-xs uppercase">{lang}</span>
                <textarea
                  value={starterCode[lang]}
                  onChange={(e) =>
                    setStarterCode({ ...starterCode, [lang]: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-xs subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand font-mono"
                  placeholder={`${lang} starter code...`}
                />
              </div>
            ))}
          </div>

          {/* Test Cases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-on-surface text-sm font-medium">Test Cases</label>
              <button
                type="button"
                onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }])}
                className="text-xs text-primary-brand hover:underline"
              >
                + Add Test Case
              </button>
            </div>
            {testCases.map((tc, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-start rounded-lg bg-surface-container-low p-3 subtle-border">
                <div className="space-y-1">
                  <span className="text-on-surface-variant text-xs">Input</span>
                  <textarea
                    value={tc.input}
                    onChange={(e) => {
                      const copy = [...testCases];
                      copy[i] = { ...copy[i], input: e.target.value };
                      setTestCases(copy);
                    }}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant text-xs">Expected Output</span>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) => {
                      const copy = [...testCases];
                      copy[i] = { ...copy[i], expectedOutput: e.target.value };
                      setTestCases(copy);
                    }}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border font-mono"
                  />
                </div>
                <label className="flex items-center gap-1.5 pt-5">
                  <input
                    type="checkbox"
                    checked={tc.isHidden}
                    onChange={(e) => {
                      const copy = [...testCases];
                      copy[i] = { ...copy[i], isHidden: e.target.checked };
                      setTestCases(copy);
                    }}
                    className="accent-primary-brand"
                  />
                  <span className="text-on-surface-variant text-xs">Hidden</span>
                </label>
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTestCases(testCases.filter((_, j) => j !== i))}
                    className="text-error-brand text-xs pt-5"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Aptitude-specific fields */}
      {type === "aptitude" && (
        <>
          <div className="space-y-3">
            <label className="text-on-surface text-sm font-medium">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-on-surface-variant text-sm font-mono w-6">
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const copy = [...options];
                    copy[i] = e.target.value;
                    setOptions(copy);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-on-surface text-sm font-medium">Correct Answer</label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
            >
              <option value="">Select correct answer</option>
              {options.map((opt, i) => (
                <option key={i} value={opt}>
                  {String.fromCharCode(65 + i)}. {opt}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Resources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-on-surface text-sm font-medium">Resources (optional)</label>
          <button
            type="button"
            onClick={() =>
              setResources([...resources, { title: "", url: "", type: "article" }])
            }
            className="text-xs text-primary-brand hover:underline"
          >
            + Add Resource
          </button>
        </div>
        {resources.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_120px_auto] gap-3 items-start rounded-lg bg-surface-container-low p-3 subtle-border"
          >
            <div className="space-y-1">
              <span className="text-on-surface-variant text-xs">Title</span>
              <input
                type="text"
                value={r.title}
                onChange={(e) => {
                  const copy = [...resources];
                  copy[i] = { ...copy[i], title: e.target.value };
                  setResources(copy);
                }}
                className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
                placeholder="NeetCode Two Sum"
              />
            </div>
            <div className="space-y-1">
              <span className="text-on-surface-variant text-xs">URL</span>
              <input
                type="url"
                value={r.url}
                onChange={(e) => {
                  const copy = [...resources];
                  copy[i] = { ...copy[i], url: e.target.value };
                  setResources(copy);
                }}
                className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-on-surface-variant text-xs">Type</span>
              <select
                value={r.type}
                onChange={(e) => {
                  const copy = [...resources];
                  copy[i] = { ...copy[i], type: e.target.value as ProblemResource["type"] };
                  setResources(copy);
                }}
                className="w-full px-2 py-1.5 rounded bg-surface-container text-on-surface text-xs subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
              >
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="similar">Similar</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setResources(resources.filter((_, j) => j !== i))}
              className="text-error-brand text-xs pt-5 px-1"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/10">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
