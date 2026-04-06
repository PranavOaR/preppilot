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

// ── WAV encoder: converts Float32 PCM samples → WAV ArrayBuffer ─────────────
function float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * (s < 0 ? 32768 : 32767), true);
  }
  return buf;
}

// ── Interviewer personas ─────────────────────────────────────────────────────
const PERSONAS: Record<string, { name: string; role: string }> = {
  technical: { name: "Arjun", role: "Senior Software Engineer" },
  behavioral: { name: "Priya", role: "Engineering Manager" },
  hr: { name: "Rahul", role: "HR Lead" },
  dsa: { name: "Aditya", role: "Senior SDE" },
  aptitude: { name: "Neha", role: "Technical Recruiter" },
  "company-specific": { name: "Rohan", role: "Staff Engineer" },
};

type Phase =
  | "starting"
  | "greeting"
  | "generating"
  | "speaking"
  | "listening"
  | "clarifying"
  | "processing"
  | "wrapping_up";

interface InterviewActiveProps {
  sessionId: string;
  config: InterviewConfig;
  userId: string;
}

export function InterviewActive({ sessionId, config, userId }: InterviewActiveProps) {
  const router = useRouter();

  const persona = PERSONAS[config.type] || { name: "Arjun", role: "Technical Interviewer" };

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
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const resolvePlayRef = useRef<(() => void) | null>(null);
  const transcriptModeRef = useRef<"answer" | "question">("answer");
  const userSkippedRef = useRef(false);

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

  // ── Play WAV ArrayBuffer via Web Audio API — stores refs for external stop ─
  async function playAudioBuffer(buffer: ArrayBuffer, text: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        ctx.decodeAudioData(
          buffer.slice(0),
          (decoded) => {
            const src = ctx.createBufferSource();
            audioSourceRef.current = src;
            src.buffer = decoded;
            src.connect(ctx.destination);

            let resolved = false;
            const done = () => {
              if (!resolved) {
                resolved = true;
                resolvePlayRef.current = null;
                audioSourceRef.current = null;
                ctx.close().catch(() => {});
                resolve();
              }
            };

            resolvePlayRef.current = done; // allow external stop
            src.onended = done;
            const words = text.split(" ").length;
            setTimeout(done, Math.max(4000, (words / 2.5) * 1000) + 3000);
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

  // ── Stop currently playing audio immediately ──────────────────────────────
  function stopCurrentAudio() {
    try { audioSourceRef.current?.stop(); } catch {}
    audioSourceRef.current = null;
    if (audioCtxRef.current?.state !== "closed") {
      audioCtxRef.current?.close().catch(() => {});
    }
    audioCtxRef.current = null;
    resolvePlayRef.current?.(); // resolve the pending playAudioBuffer promise
    resolvePlayRef.current = null;
  }

  // ── Speak via Sarvam TTS ─────────────────────────────────────────────────
  async function speakText(text: string): Promise<void> {
    try {
      const res = await fetchWithTimeout(
        "/api/interview/tts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: "en-IN", speaker: "anushka" }),
        },
        15000
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`TTS ${res.status}: ${errBody.error || "unknown"}`);
      }
      const buf = await res.arrayBuffer();
      await playAudioBuffer(buf, text);
    } catch (err) {
      console.error("TTS failed:", err);
      setStatusText("(Audio unavailable — read question above)");
      await new Promise((r) => setTimeout(r, 2000));
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
        "Microphone access denied. Please allow access and reload."
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
        if (secs >= 180) stopRec();
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
        setStatusText("Processing your answer...");

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        console.log(`[STT] Recorded blob: ${blob.size} bytes, type: ${mimeType}`);

        if (blob.size < 500) {
          console.warn("[STT] Recording too small — likely no audio captured");
          resolve("[No audio recorded — please try again]");
          return;
        }

        try {
          const rawBuffer = await blob.arrayBuffer();
          const decodeCtx = new AudioContext();
          const decoded = await decodeCtx.decodeAudioData(rawBuffer);
          await decodeCtx.close();

          const wavBuffer = float32ToWav(decoded.getChannelData(0), decoded.sampleRate);
          const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
          console.log(`[STT] WAV: ${wavBlob.size} bytes, ${decoded.sampleRate}Hz, ${decoded.duration.toFixed(1)}s`);

          const form = new FormData();
          form.append("audio", wavBlob, "recording.wav");
          form.append("language", "en-IN");

          const res = await fetchWithTimeout(
            "/api/interview/stt",
            { method: "POST", body: form },
            30000
          );
          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            console.error("[STT] API error:", res.status, errText);
            resolve("[Transcription failed — please try again]");
            return;
          }
          const data = await res.json();
          console.log("[STT] Response:", data);
          const text = (data.transcript || "").trim();
          setLiveTranscript(text);
          resolve(text || "[No speech detected]");
        } catch (err) {
          console.error("[STT] Failed:", err);
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
    await speakText("That concludes our interview today. Thank you for your time. Let me prepare your feedback report now.");

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
    abortRef.current = false;
    qasRef.current = [];
    const allQAs: InterviewQA[] = [];

    const FALLBACK_QUESTIONS = [
      "Tell me about yourself and your technical background.",
      "Walk me through a challenging problem you have solved recently.",
      "How do you approach debugging a complex issue in production?",
      "Describe a project you are most proud of and what you learned.",
      "What is your approach to writing clean, maintainable code?",
    ];

    async function run() {
      // ── Greeting ──
      const greetingPersona = PERSONAS[config.type] || { name: "Arjun", role: "Technical Interviewer" };
      setPhase("greeting");
      setStatusText(`${greetingPersona.name} is introducing themselves...`);
      const greeting = `Hello! I'm ${greetingPersona.name}, ${greetingPersona.role} at ${config.targetCompany}. Welcome to your ${config.type} interview today. We have ${config.totalQuestions} questions lined up. You can skip me at any time using the Skip button, and you can ask me to clarify any question. Let's get started!`;
      setCurrentQuestion(greeting);
      await speakText(greeting);
      if (abortRef.current) return;

      for (let i = 0; i < config.totalQuestions; i++) {
        if (abortRef.current) break;

        // Generate question
        setPhase("generating");
        setStatusText("Interviewer is thinking...");
        setCurrentQuestion("");
        setLiveTranscript("");
        setQuestionIndex(i);

        let question = FALLBACK_QUESTIONS[i % FALLBACK_QUESTIONS.length];
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
          if (data.question) question = data.question;
        } catch {}

        if (abortRef.current) break;
        setCurrentQuestion(question);

        // Speak question
        userSkippedRef.current = false;
        setPhase("speaking");
        setStatusText("Interviewer is speaking...");
        await speakText(question);
        if (abortRef.current) break;

        // Clarification loop — user may ask questions before answering
        let answered = false;
        let sttRetries = 0;
        while (!answered && !abortRef.current) {
          transcriptModeRef.current = "answer";
          setPhase("listening");
          setStatusText(
            sttRetries > 0
              ? "Didn't catch that — please speak again."
              : "Your turn — answer or ask me to clarify."
          );
          const startTime = Date.now();
          const userSpeech = await recordAndTranscribe();
          const timeTaken = Math.floor((Date.now() - startTime) / 1000);
          if (abortRef.current) break;

          // STT produced an error string — retry up to 2 times
          const isSttError = !userSpeech || userSpeech.startsWith("[");
          if (isSttError && sttRetries < 2) {
            sttRetries++;
            console.warn(`[STT] Retry ${sttRetries}/2:`, userSpeech);
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }

          if ((transcriptModeRef.current as "answer" | "question") === "question") {
            // User asked a clarifying question
            setPhase("clarifying");
            setStatusText("Interviewer is responding...");
            try {
              const res = await fetchWithTimeout(
                "/api/interview/clarify",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    originalQuestion: question,
                    userQuery: userSpeech,
                    type: config.type,
                  }),
                },
                10000
              );
              const data = await res.json();
              const clarification = data.response || "Please answer based on your best understanding.";
              setCurrentQuestion(clarification);
              await speakText(clarification);
              if (!abortRef.current) {
                // Re-state the question briefly
                setCurrentQuestion(question);
                await speakText(`So, going back to my question: ${question}`);
              }
            } catch {
              await speakText("Good question! Please answer based on what you know.");
            }
            // loop again for actual answer
          } else {
            // It's an answer — evaluate it
            answered = true;
            setPhase("processing");
            setStatusText("Evaluating your answer...");

            let score = 5;
            let evaluation = "";
            let comment = "";
            try {
              const res = await fetchWithTimeout(
                "/api/interview/evaluate",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    question,
                    transcript: userSpeech,
                    type: config.type,
                  }),
                },
                20000
              );
              const data = await res.json();
              score = data.score ?? 5;
              evaluation = data.evaluation ?? "";
              comment = data.comment ?? "";
            } catch {}

            const qa: InterviewQA = {
              index: allQAs.length,
              questionText: question,
              questionTopic: config.type,
              userTranscript: userSpeech,
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

            // Spoken comment from interviewer after the answer
            if (comment && !abortRef.current) {
              userSkippedRef.current = false;
              setPhase("speaking");
              setStatusText("Interviewer is responding...");
              setCurrentQuestion(comment);
              await speakText(comment);
              // If user pressed Skip during the comment, give them another attempt
              if (userSkippedRef.current && !abortRef.current) {
                userSkippedRef.current = false;
                answered = false;
                sttRetries = 0;
                setCurrentQuestion(question);
              }
            }
          }
        }
      }

      if (!abortRef.current && allQAs.length > 0) {
        await generateFeedback(allQAs);
      }
    }

    run();

    return () => {
      abortRef.current = true;
      stopCurrentAudio();
      stopRecordingRef.current?.();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived state for UI ─────────────────────────────────────────────────
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking" || phase === "greeting";
  const isBusy =
    phase === "generating" ||
    phase === "processing" ||
    phase === "wrapping_up" ||
    phase === "clarifying";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Interviewer persona card */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-full bg-primary-container/20 border border-primary-brand/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px] text-primary-brand">person</span>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">{persona.name}</p>
          <p className="text-xs text-on-surface-variant">{persona.role} · {config.targetCompany}</p>
        </div>
      </div>

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

        {/* Skip button — visible during any TTS playback */}
        {(phase === "speaking" || phase === "greeting") && (
          <button
            onClick={() => { userSkippedRef.current = true; stopCurrentAudio(); }}
            className="ml-auto text-xs px-3 py-1 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface subtle-border transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">skip_next</span>
            Skip
          </button>
        )}
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

      {/* Mic indicator + answer/clarify buttons */}
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
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => {
                transcriptModeRef.current = "answer";
                stopRecordingRef.current?.();
              }}
              className="text-xs px-5 py-2 rounded-lg bg-primary-container/15 text-primary-brand border border-primary-brand/20 hover:bg-primary-container/25 transition-colors"
            >
              Done answering →
            </button>
            <button
              onClick={() => {
                transcriptModeRef.current = "question";
                stopRecordingRef.current?.();
              }}
              className="text-xs px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface subtle-border transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">help</span>
              Ask interviewer
            </button>
          </div>
        </div>
      )}

      {/* End interview early */}
      {qas.length > 0 && !isBusy && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              abortRef.current = true;
              stopCurrentAudio();
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
