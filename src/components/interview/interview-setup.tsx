"use client";

import { useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/sarvam/voices";
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

const QUESTION_COUNTS = [3, 5, 7, 10];

const DSA_TOPICS = [
  "Arrays", "Strings", "Two Pointers", "Binary Search",
  "Linked Lists", "Stack", "Trees", "Dynamic Programming",
  "Graphs", "Sorting", "Heap", "Greedy",
  "Backtracking", "Hash Tables", "Matrix", "Bit Manipulation",
];

const SPEAKERS = [
  { id: "anushka", label: "Anushka", icon: "face_3", description: "Female voice" },
  { id: "abhilash", label: "Abhilash", icon: "face", description: "Male voice" },
];

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
  defaultCompany?: string;
}

export function InterviewSetup({ onStart, defaultCompany }: InterviewSetupProps) {
  const [type, setType] = useState<InterviewType>("dsa");
  const [company, setCompany] = useState(defaultCompany || "TCS");
  const [questionCount, setQuestionCount] = useState(5);
  const [language, setLanguage] = useState("en-IN");
  const [speaker, setSpeaker] = useState("meera");
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
      totalQuestions: questionCount,
      language,
      speaker,
      mode,
      topics: type === "dsa" && selectedTopics.length > 0 ? selectedTopics : undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium text-on-surface">Mock Interview</h1>
        <p className="text-on-surface-variant text-sm">
          Practice with an AI interviewer. Answer verbally — just like a real interview.
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

      {/* DSA Topic Focus (only for DSA type) */}
      {type === "dsa" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-on-surface text-sm font-medium">Topic Focus</h3>
            <span className="text-on-surface-variant text-xs">
              {selectedTopics.length === 0 ? "All topics (no filter)" : `${selectedTopics.length} selected`}
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

      {/* Question Count */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Number of Questions</h3>
        <div className="flex gap-3">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`w-14 h-10 rounded-lg text-sm font-medium transition-colors ${
                questionCount === n
                  ? "gradient-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {n}
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
              Get coaching tips after low-scoring answers
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
              No hints — simulate a real interview
            </p>
          </button>
        </div>
      </div>

      {/* Voice Language */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Voice Language</h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/20 focus:border-primary-brand/50 outline-none"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interviewer Voice */}
      <div className="space-y-3">
        <h3 className="text-on-surface text-sm font-medium">Interviewer Voice</h3>
        <div className="flex gap-3">
          {SPEAKERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpeaker(s.id)}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg transition-all ${
                speaker === s.id
                  ? "bg-primary-container/15 border border-primary-brand/40"
                  : "bg-surface-container border border-transparent hover:bg-surface-container-high"
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${speaker === s.id ? "text-primary-brand" : "text-outline"}`}>
                {s.icon}
              </span>
              <div className="text-left">
                <p className={`text-sm font-medium ${speaker === s.id ? "text-primary-brand" : "text-on-surface"}`}>
                  {s.label}
                </p>
                <p className="text-xs text-on-surface-variant">{s.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Microphone Permission Notice */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-on-surface-variant text-xs">
        <span className="material-symbols-outlined text-[18px] text-primary-brand">mic</span>
        <span>This feature requires microphone access. You&apos;ll be prompted to allow it when the interview starts.</span>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-3 rounded-lg gradient-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity"
      >
        Start Interview
      </button>
    </div>
  );
}
