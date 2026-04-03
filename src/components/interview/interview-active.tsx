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
  const [statusText, setStatusText] = useState("Starting interview...");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState("");

  const qasRef = useRef<InterviewQA[]>([]);
  const abortRef = useRef(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { qasRef.current = qas; }, [qas]);

  // ── Fetch with AbortController timeout ───────────────────────────────────
  async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    ms = 20000
  ): Promise<Response> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(t);
      return res;
    } catch (e: any) {
      clearTimeout(t);
      if (e.name === "AbortError") throw new Error("Request timed out");
      throw e;
    }
  }

  // ── Play WAV ArrayBuffer via Web Audio API ───────────────────────────────
  async function playAudioBuffer(buffer: ArrayBuffer, text: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        ctx.decodeAudioData(
          buffer.slice(0),
          (decoded) => {
            const src = ctx.createBufferSource();
            src.buffer = decoded;
            src.connect(ctx.destination);

            let resolved = false;
            const done = () => {
              if (!resolved) {
                resolved = true;
                ctx.close().catch(() => {});
                resolve();
              }
            };

            src.onended = done;
            // Hard timeout based on word count (in case onended doesn't fire)
            const words = text.split(" ").length;
            const estMs = Math.max(3000, (words / 2.5) * 1000) + 3000;
            setTimeout(done, estMs);
            src.start(0);
          },
          () => {
            ctx.close().catch(() => {});
            resolve();
          }
        );
      } catch {
        resolve();
      }
    });
  }

  // ── Speak via Sarvam TTS ─────────────────────────────────────────────────
  async function speakQuestion(text: string): Promise<void> {
    try {
      const res = await fetchWithTimeout(
        "/api/interview/tts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: "en-IN", speaker: "meera" }),
        },
        15000
      );
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const buf = await res.arrayBuffer();
      await playAudioBuffer(buf, text);
    } catch (err) {
      console.warn("TTS failed, continuing silently:", err);
      // Short pause so the UI doesn't feel broken
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  // ── Record audio → Sarvam STT → transcript ───────────────────────────────
  async function recordAndTranscribe(): Promise<string> {
    setMicError("");
    setLiveTranscript("");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError(
        "Microphone access denied. Please allow microphone access in your browser and reload."
      );
      return "[Microphone access denied]";
    }

    return new Promise((resolve) => {
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      let stopped = false;
      let secs = 0;

      const tick = setInterval(() => {
        secs++;
        setRecordingSeconds(secs);
        if (secs >= 180) stopRec(); // auto-stop at 3 min
      }, 1000);
      timerRef.current = tick;

      function stopRec() {
        if (stopped) return;
        stopped = true;
        clearInterval(tick);
        timerRef.current = null;
        setRecordingSeconds(0);
        try { recorder.stop(); } catch {}
        stream.getTracks().forEach((t) => t.stop());
      }

      stopRecordingRef.current = stopRec;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stopRecordingRef.current = null;
        setPhase("processing");
        setStatusText("Transcribing your answer via Sarvam AI...");

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });

        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          form.append("language", config.language || "en-IN");

          const res = await fetchWithTimeout(
            "/api/interview/stt",
            { method: "POST", body: form },
            30000
          );
          const data = await res.json();
          const text = (data.transcript || "").trim();
          setLiveTranscript(text);
          resolve(text || "[No speech detected]");
        } catch (err) {
          console.error("STT failed:", err);
          resolve("[Transcription failed — please try again]");
        }
      };

      recorder.start();
    });
  }

  // ── Generate feedback and navigate to results ────────────────────────────
  async function generateFeedback(allQAs: InterviewQA[]) {
    setPhase("wrapping_up");
    setStatusText("Generating your feedback report...");

    try {
      await speakQuestion(
        "Great interview session! Let me analyse your performance and generate your feedback now."
      );
    } catch {}

    try {
      const res = await fetchWithTimeout(
        "/api/interview/feedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: config.type,
            targetCompany: config.targetCompany,
            qas: allQAs,
          }),
        },
        30000
      );
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
      setStatusText("Interview complete! Redirecting to feedback...");
      setTimeout(() => router.push(`/interview/${sessionId}/feedback`), 2000);
    }
  }

  // ── Main interview loop (runs once on mount) ─────────────────────────────
  useEffect(() => {
    // Reset abort flag — critical for React Strict Mode which double-invokes
    // effects in development (cleanup sets abortRef=true, second mount must reset it)
    abortRef.current = false;
    qasRef.current = [];
    const allQAs: InterviewQA[] = [];

    const FALLBACK_QUESTIONS = [
      "Tell me about yourself and your technical background.",
      "Walk me through a challenging problem you have solved recently.",
      "How do you approach debugging a complex issue in production?",
      "Describe a project you are most proud of and what you learned from it.",
      "What is your approach to writing clean, maintainable code?",
    ];

    async function run() {
      for (let i = 0; i < config.totalQuestions; i++) {
        if (abortRef.current) break;

        // 1. Generate question via Groq
        setPhase("generating");
        setStatusText(i === 0 ? "Connecting to AI interviewer..." : "Interviewer is thinking...");
        setCurrentQuestion("");
        setLiveTranscript("");
        setQuestionIndex(i);

        let question = "";
        try {
          const res = await fetchWithTimeout(
            "/api/interview/question",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: config.type,
                targetCompany: config.targetCompany,
                questionIndex: i,
                totalQuestions: config.totalQuestions,
                previousQAs: allQAs,
              }),
            },
            10000
          );
          const data = await res.json();
          question = data.question || FALLBACK_QUESTIONS[i % FALLBACK_QUESTIONS.length];
        } catch {
          question = FALLBACK_QUESTIONS[i % FALLBACK_QUESTIONS.length];
        }

        if (abortRef.current) break;
        setCurrentQuestion(question);

        // 2. Speak question via Sarvam TTS
        setPhase("speaking");
        setStatusText("Interviewer is speaking...");
        await speakQuestion(question);
        if (abortRef.current) break;

        // 3. Record answer → Sarvam STT
        setPhase("listening");
        setStatusText("Your turn — speak freely, then click Done.");
        const startTime = Date.now();
        const userAnswer = await recordAndTranscribe();
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        if (abortRef.current) break;

        // 4. Evaluate answer via Groq
        setPhase("processing");
        setStatusText("Evaluating your answer...");

        let score = 5;
        let evaluation = "";
        try {
          const res = await fetchWithTimeout(
            "/api/interview/evaluate",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question,
                transcript: userAnswer,
                type: config.type,
              }),
            },
            20000
          );
          const data = await res.json();
          score = data.score ?? 5;
          evaluation = data.evaluation ?? "";
        } catch {}

        const qa: InterviewQA = {
          index: allQAs.length,
          questionText: question,
          questionTopic: config.type,
          userTranscript: userAnswer,
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
      stopRecordingRef.current?.();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived state for UI ─────────────────────────────────────────────────
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";
  const isBusy =
    phase === "generating" || phase === "processing" || phase === "wrapping_up";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
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

      {/* Mic permission error */}
      {micError && (
        <div className="bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3 text-sm text-red-400">
          {micError}
        </div>
      )}

      {/* Conversation window */}
      <div className="rounded-xl bg-surface-container-low subtle-border p-4 min-h-[320px] max-h-[460px] overflow-y-auto space-y-4">
        <InterviewTranscript
          qas={qas}
          currentQuestion={isListening || isSpeaking ? currentQuestion : undefined}
        />

        {/* User transcript (appears after recording stops and STT runs) */}
        {isListening && liveTranscript && (
          <div className="flex gap-3 justify-end">
            <div className="flex-1 max-w-[85%] ml-auto bg-primary-container/10 rounded-xl rounded-tr-sm p-3 border border-primary-brand/15">
              <p className="text-sm text-on-surface leading-relaxed">
                {liveTranscript}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                person
              </span>
            </div>
          </div>
        )}

        {/* Waiting for user to speak */}
        {isListening && !liveTranscript && (
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
              <span className="material-symbols-outlined text-[30px] text-green-400">
                mic
              </span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-25" />
          </div>
          <p className="text-xs text-on-surface-variant text-center">
            Recording
            {recordingSeconds > 0 ? ` • ${recordingSeconds}s` : " • speak now"}
            {recordingSeconds >= 150 && " • auto-stopping soon"}
          </p>
          <button
            onClick={() => stopRecordingRef.current?.()}
            className="text-xs px-5 py-2 rounded-lg bg-primary-container/15 text-primary-brand border border-primary-brand/20 hover:bg-primary-container/25 transition-colors"
          >
            Done answering →
          </button>
        </div>
      )}

      {/* End interview early */}
      {qas.length > 0 && !isBusy && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              abortRef.current = true;
              stopRecordingRef.current?.();
              if (timerRef.current) clearInterval(timerRef.current);
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
