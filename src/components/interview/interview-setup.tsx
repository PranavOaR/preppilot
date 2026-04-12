"use client";

import { useState } from "react";
import type { InterviewType, InterviewConfig } from "@/lib/types/interview";

const INTERVIEW_TYPES: { type: InterviewType; label: string; icon: string; description: string }[] = [
  { type: "dsa", label: "DSA", icon: "code", description: "Data structures & algorithms questions" },
  { type: "aptitude", label: "Aptitude", icon: "calculate", description: "Quantitative & logical reasoning" },
  { type: "behavioral", label: "Behavioral", icon: "groups", description: "STAR method & soft skills" },
  { type: "company-specific", label: "Company Mix", icon: "business", description: "Tailored to your target company" },
];

const COMPANIES = [
  "TCS", "Infosys", "Wipro", "Zoho", "Flipkart",
  "Amazon", "Google", "Microsoft", "Accenture",
  "HCL", "Tech Mahindra", "Cognizant",
];

const DURATIONS = [
  { minutes: 5,  label: "5 min",  sublabel: "Quick warm-up" },
  { minutes: 10, label: "10 min", sublabel: "Standard" },
  { minutes: 15, label: "15 min", sublabel: "Deep dive" },
  { minutes: 20, label: "20 min", sublabel: "Full round" },
];

const DSA_TOPICS = [
  "Arrays", "Strings", "Two Pointers", "Binary Search",
  "Linked Lists", "Stack", "Trees", "Dynamic Programming",
  "Graphs", "Sorting", "Heap", "Greedy",
  "Backtracking", "Hash Tables", "Matrix", "Bit Manipulation",
];

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
  defaultCompany?: string;
}

export function InterviewSetup({ onStart, defaultCompany }: InterviewSetupProps) {
  const [type, setType] = useState<InterviewType>("behavioral");
  const [company, setCompany] = useState(defaultCompany || "TCS");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  function handleStart() {
    onStart({
      type,
      targetCompany: company,
      durationMinutes,
      mode,
      topics: type === "dsa" && selectedTopics.length > 0 ? selectedTopics : undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium text-on-surface">Mock Interview</h1>
        <p className="text-on-surface-variant text-sm">
          Set up your session and Emma, your AI interviewer, will tailor every question to your choices.
        </p>
      </div>

      {/* Interview Type */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Interview Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {INTERVIEW_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => { setType(t.type); setSelectedTopics([]); }}
              className={`p-4 rounded-lg text-left transition-all ${
                type === t.type
                  ? "bg-primary-container/15 border border-primary-brand/40 subtle-glow"
                  : "bg-surface-container border border-transparent hover:bg-surface-container-high"
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <span className={`material-symbols-outlined text-[20px] ${
                  type === t.type ? "text-primary-brand" : "text-outline"
                }`}>
                  {t.icon}
                </span>
                <span className={`text-sm font-medium ${
                  type === t.type ? "text-primary-brand" : "text-on-surface"
                }`}>
                  {t.label}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant pl-8">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* DSA Topic Focus */}
      {type === "dsa" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-on-surface text-sm font-medium">Topic Focus</h3>
            <span className="text-on-surface-variant text-xs">
              {selectedTopics.length === 0 ? "All topics" : `${selectedTopics.length} selected`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DSA_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTopics.includes(topic)
                    ? "bg-primary-container/20 text-primary-brand border border-primary-brand/30"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target Company */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Target Company</h3>
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map((c) => (
            <button
              key={c}
              onClick={() => setCompany(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                company === c
                  ? "bg-primary-container/20 text-primary-brand border border-primary-brand/30"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Interview Duration</h3>
        <div className="grid grid-cols-4 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.minutes}
              onClick={() => setDurationMinutes(d.minutes)}
              className={`p-3 rounded-lg text-center transition-all ${
                durationMinutes === d.minutes
                  ? "gradient-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <p className="text-sm font-medium">{d.label}</p>
              <p className={`text-xs mt-0.5 ${durationMinutes === d.minutes ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                {d.sublabel}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Interview Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("practice")}
            className={`p-4 rounded-lg text-left transition-all ${
              mode === "practice"
                ? "bg-primary-container/15 border border-primary-brand/40"
                : "bg-surface-container border border-transparent hover:bg-surface-container-high"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-[18px] ${mode === "practice" ? "text-primary-brand" : "text-outline"}`}>
                school
              </span>
              <span className={`text-sm font-medium ${mode === "practice" ? "text-primary-brand" : "text-on-surface"}`}>
                Practice
              </span>
            </div>
            <p className="text-xs text-on-surface-variant pl-6">
              Emma gives hints and encouragement after weak answers
            </p>
          </button>
          <button
            onClick={() => setMode("exam")}
            className={`p-4 rounded-lg text-left transition-all ${
              mode === "exam"
                ? "bg-primary-container/15 border border-primary-brand/40"
                : "bg-surface-container border border-transparent hover:bg-surface-container-high"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-[18px] ${mode === "exam" ? "text-primary-brand" : "text-outline"}`}>
                timer
              </span>
              <span className={`text-sm font-medium ${mode === "exam" ? "text-primary-brand" : "text-on-surface"}`}>
                Exam
              </span>
            </div>
            <p className="text-xs text-on-surface-variant pl-6">
              Strict simulation — no hints, just like the real thing
            </p>
          </button>
        </div>
      </div>

      {/* Context summary */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary-brand text-[20px] mt-0.5">auto_awesome</span>
        <p className="text-on-surface-variant text-xs leading-relaxed">
          Emma will be briefed on your choices before the call starts —{" "}
          <span className="text-on-surface font-medium">{company}</span>,{" "}
          <span className="text-on-surface font-medium capitalize">{type.replace("-", " ")}</span>
          {selectedTopics.length > 0 && (
            <> focusing on <span className="text-on-surface font-medium">{selectedTopics.slice(0, 2).join(", ")}{selectedTopics.length > 2 ? ` +${selectedTopics.length - 2} more` : ""}</span></>
          )}
          , <span className="text-on-surface font-medium">{durationMinutes} minutes</span>,{" "}
          <span className="text-on-surface font-medium capitalize">{mode}</span> mode.
        </p>
      </div>

      {/* Mic notice */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-on-surface-variant text-xs">
        <span className="material-symbols-outlined text-[18px] text-primary-brand">mic</span>
        <span>Microphone access is required. You&apos;ll be prompted when the interview starts.</span>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-3 rounded-lg gradient-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity"
      >
        Start Interview
      </button>
    </div>
  );
}
