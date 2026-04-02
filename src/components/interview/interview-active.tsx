"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewTranscript } from "./interview-transcript";
import { InterviewProgress } from "./interview-progress";
import {
  saveInterviewQA,
  updateInterviewSession,
  completeInterviewSession,
  saveInterviewFeedback,
} from "@/lib/db/interviews";
import type { InterviewQA, InterviewConfig } from "@/lib/types/interview";

type Phase =
  | "starting"
  | "generating"
  | "speaking"
  | "listening"
  | "processing"
  | "wrapping_up";

interface InterviewActiveProps {
  sessionId: string;
  config: InterviewConfig;
  userId: string;
}

export function InterviewActive({ sessionId, config, userId }: InterviewActiveProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("starting");
  const [qas, setQAs] = useState<InterviewQA[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [statusText, setStatusText] = useState("Starting interview...");

  // Refs used inside async loops / callbacks
  const qasRef = useRef<InterviewQA[]>([]);
  const abortRef = useRef(false);
  const listenResolveRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => { qasRef.current = qas; }, [qas]);

  // ── Browser TTS (instant, no API call) ──────────────────────────────────
  function speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-IN";
      utter.rate = 0.92;
      utter.pitch = 1.0;

      // Prefer a natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find((v) => v.lang.startsWith("en") && /google|neural|premium/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (pick) utter.voice = pick;

      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  }

  // ── Live SpeechRecognition → resolves when user pauses 2 s ─────────────
  function listenForAnswer(): Promise<string> {
    return new Promise((resolve) => {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SR) {
        resolve("[Speech recognition unavailable — use Chrome or Edge]");
        return;
      }

      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = config.language;

      let accumulated = "";
      let silenceTimer: ReturnType<typeof setTimeout> | null = null;
      let done = false;

      function finish(text: string) {
        if (done) return;
        done = true;
        if (silenceTimer) clearTimeout(silenceTimer);
        listenResolveRef.current = null;
        try { recognition.stop(); } catch {}
        setLiveTranscript("");
        setFinalTranscript("");
        resolve(text.trim() || "[No answer detected]");
      }

      // Expose so the "Done answering" button and end-early can resolve this
      listenResolveRef.current = (text: string) => finish(text);

      recognition.onresult = (event: any) => {
        let interim = "";
        let newFinal = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) newFinal += t + " ";
          else interim += t;
        }
        if (newFinal) {
          accumulated += newFinal;
          setFinalTranscript(accumulated);
        }
        setLiveTranscript(interim);

        // Reset 2-second silence window on any new speech
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          const full = (accumulated + interim).trim();
          if (full.split(" ").length >= 3) finish(full);
          // If less than 3 words, wait longer — might still be speaking
          else silenceTimer = setTimeout(() => finish(full), 2000);
        }, 2000);
      };

      recognition.onerror = (e: any) => {
        if (e.error === "aborted") return;
        if (e.error === "no-speech") {
          // Chrome fires this after a few seconds; restart silently
          if (!done) try { recognition.start(); } catch { finish(accumulated); }
          return;
        }
        finish(accumulated || "[transcription error]");
      };

      recognition.onend = () => {
        // Chrome stops recognition spontaneously sometimes — restart if still listening
        if (!done) {
          try { recognition.start(); } catch { finish(accumulated); }
        }
      };

      try {
        recognition.start();
      } catch {
        finish("[Could not start microphone]");
      }
    });
  }

  // ── Generate feedback and navigate ──────────────────────────────────────
  async function generateFeedback(allQAs: InterviewQA[]) {
    setPhase("wrapping_up");
    setStatusText("Generating your feedback report...");
    window.speechSynthesis?.cancel();

    try {
      await speakText("Great interview! Generating your feedback now.");
    } catch {}

    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: config.type,
          targetCompany: config.targetCompany,
          qas: allQAs,
        }),
      });
      const feedback = await res.json();
      const overallScore = feedback.overallScore || 50;

      await completeInterviewSession(sessionId, overallScore);
      await saveInterviewFeedback({
        sessionId,
        userId,
        overallScore,
        summary: feedback.summary || "",
        strengths: feedback.strengths || [],
        weaknesses: feedback.weaknesses || [],
        topicScores: feedback.topicScores || {},
        suggestions: feedback.suggestions || [],
        generatedAt: null as any,
      });

      router.push(`/interview/${sessionId}/feedback`);
    } catch (err) {
      console.error("Feedback failed:", err);
      setStatusText("Interview complete! Feedback could not be generated.");
    }
  }

  // ── Main interview loop ──────────────────────────────────────────────────
  useEffect(() => {
    const allQAs: InterviewQA[] = [];

    async function run() {
      for (let i = 0; i < config.totalQuestions; i++) {
        if (abortRef.current) break;

        // ── 1. Generate question ──
        setPhase("generating");
        setStatusText("Interviewer is thinking...");
        setCurrentQuestion("");
        setLiveTranscript("");
        setFinalTranscript("");
        setQuestionIndex(i);

        let question = "";
        try {
          const res = await fetch("/api/interview/question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: config.type,
              targetCompany: config.targetCompany,
              questionIndex: i,
              totalQuestions: config.totalQuestions,
              previousQAs: allQAs,
            }),
          });
          const data = await res.json();
          question = data.question || "Tell me about a challenging problem you recently solved.";
        } catch {
          question = "Walk me through a technical challenge you faced and how you resolved it.";
        }

        setCurrentQuestion(question);
        if (abortRef.current) break;

        // ── 2. Speak question ──
        setPhase("speaking");
        setStatusText("Interviewer is speaking...");
        await speakText(question);
        if (abortRef.current) break;

        // ── 3. Listen for answer (auto-starts, resolves on 2s silence) ──
        setPhase("listening");
        setStatusText("Your turn — speak freely. Pause 2 seconds to submit.");
        const startTime = Date.now();
        const transcript = await listenForAnswer();
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        if (abortRef.current) break;

        // ── 4. Evaluate ──
        setPhase("processing");
        setStatusText("Thinking about your answer...");

        let score = 5;
        let evaluation = "";
        try {
          const res = await fetch("/api/interview/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, transcript, type: config.type }),
          });
          const data = await res.json();
          score = data.score ?? 5;
          evaluation = data.evaluation ?? "";
        } catch {}

        const qa: InterviewQA = {
          index: allQAs.length,
          questionText: question,
          questionTopic: config.type,
          userTranscript: transcript,
          score,
          evaluation,
          isFollowUp: false,
          parentIndex: null,
          timeTakenSeconds: timeTaken,
          answeredAt: null as any,
        };

        allQAs.push(qa);
        setQAs([...allQAs]);
        try {
          await saveInterviewQA(sessionId, qa);
          await updateInterviewSession(sessionId, { questionsCompleted: i + 1 });
        } catch {}
      }

      if (!abortRef.current && allQAs.length > 0) {
        await generateFeedback(allQAs);
      }
    }

    run();

    return () => {
      abortRef.current = true;
      window.speechSynthesis?.cancel();
      // Resolve any pending listen so the loop can exit
      listenResolveRef.current?.("[interview ended]");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── UI ──────────────────────────────────────────────────────────────────
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";
  const isBusy = phase === "generating" || phase === "processing" || phase === "wrapping_up";

  const displayTranscript = finalTranscript + liveTranscript;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Progress bar */}
      <InterviewProgress current={questionIndex} total={config.totalQuestions} />

      {/* Status pill */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          isListening
            ? "bg-green-400/10 border border-green-400/25"
            : isSpeaking
            ? "bg-primary-container/10 border border-primary-brand/25"
            : "bg-surface-container subtle-border"
        }`}
      >
        {isBusy && (
          <span className="material-symbols-outlined text-[18px] text-primary-brand animate-spin">
            progress_activity
          </span>
        )}
        {isListening && (
          <span className="material-symbols-outlined text-[18px] text-green-400 animate-pulse">
            mic
          </span>
        )}
        {isSpeaking && (
          <span className="material-symbols-outlined text-[18px] text-primary-brand">
            record_voice_over
          </span>
        )}
        <span className="text-sm text-on-surface-variant">{statusText}</span>
      </div>

      {/* Conversation window */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-4 min-h-[320px] max-h-[460px] overflow-y-auto space-y-4">
        <InterviewTranscript
          qas={qas}
          currentQuestion={isListening || isSpeaking ? currentQuestion : undefined}
        />

        {/* Live user transcript bubble */}
        {isListening && displayTranscript && (
          <div className="flex gap-3 justify-end">
            <div className="flex-1 max-w-[85%] ml-auto bg-primary-container/10 rounded-xl rounded-tr-sm p-3 border border-primary-brand/15">
              <p className="text-sm text-on-surface leading-relaxed">
                {finalTranscript}
                <span className="text-on-surface-variant italic">{liveTranscript}</span>
                <span className="inline-block w-[2px] h-4 bg-primary-brand ml-1 animate-pulse align-middle rounded-full" />
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                person
              </span>
            </div>
          </div>
        )}

        {/* Waiting for first word */}
        {isListening && !displayTranscript && (
          <div className="flex gap-3 justify-end">
            <div className="bg-surface-container rounded-xl rounded-tr-sm px-4 py-3 border border-outline-variant/10">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-outline-variant animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-outline-variant animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-outline-variant animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mic indicator + Done button */}
      {isListening && (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-green-400/10 border-2 border-green-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[30px] text-green-400">mic</span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-25" />
          </div>
          <p className="text-xs text-on-surface-variant text-center">
            Microphone is live — pause 2 s to auto-submit
          </p>
          <button
            onClick={() => listenResolveRef.current?.(displayTranscript || "[done]")}
            className="text-xs px-5 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
          >
            Done answering →
          </button>
        </div>
      )}

      {/* End early */}
      {qas.length > 0 && !isBusy && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              abortRef.current = true;
              window.speechSynthesis?.cancel();
              listenResolveRef.current?.(displayTranscript || "[ended early]");
              // generateFeedback runs after loop exits via abortRef check — call directly
              setTimeout(() => generateFeedback(qasRef.current), 200);
            }}
            className="text-xs text-on-surface-variant hover:text-error transition-colors underline underline-offset-2"
          >
            End interview early
          </button>
        </div>
      )}
    </div>
  );
}
