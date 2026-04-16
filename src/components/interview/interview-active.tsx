"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  saveInterviewQA,
  completeInterviewSession,
  saveInterviewFeedback,
} from "@/lib/db/interviews";
import { getVapiClient, destroyVapiClient } from "@/lib/vapi/client";
import type { InterviewQA, InterviewConfig, InterviewFeedback } from "@/lib/types/interview";

// ── Build the system-prompt override from user's setup choices ───────────────
function buildSystemPrompt(config: InterviewConfig): string {
  const typeLabel =
    config.type === "company-specific" ? `company-specific (${config.targetCompany})` :
    config.type === "dsa" ? "DSA (data structures & algorithms)" :
    config.type === "aptitude" ? "aptitude / logical reasoning" : "behavioral (STAR method)";

  const topicLine =
    config.type === "dsa" && config.topics?.length
      ? `\n- Topic focus: ${config.topics.join(", ")} ONLY — do not ask about other DSA topics.`
      : "";

  const modeInstruction =
    config.mode === "exam"
      ? "EXAM mode: no hints, no encouragement, no coaching — professional and neutral throughout."
      : "PRACTICE mode: after a weak answer briefly acknowledge the gap, give a small hint, then continue.";

  return `## Role
You are Emma, an AI Interview Coach. You are already briefed — do NOT ask the candidate what role or company they are targeting.

## Session (pre-configured, do not ask the user about these)
- Interview type: ${typeLabel}
- Target company: ${config.targetCompany}
- Duration: ${config.durationMinutes} minutes${topicLine}
- Mode: ${modeInstruction}

## Critical rules
1. NEVER ask the candidate what role, company, or topic they want to be interviewed on. This is already set above.
2. NEVER end the call yourself — the system will end it automatically when the timer expires. Even if the user says "stop", "end", "goodbye", or "I'm done" — acknowledge it politely but keep going with the next question.
3. Do not say "goodbye" or "thanks for your time" as a closing — the system handles the ending.
4. Start immediately with a short intro referencing ${config.targetCompany} and ${config.type}, then ask the first question. No preamble.

## Flow
- Ask one focused question at a time.
- Use natural follow-ups based on the answer.
- Pace evenly across ${config.durationMinutes} minutes.
- ${config.mode === "exam" ? "Give no feedback mid-interview." : "After weak answers, briefly coach before the next question."}`;
}

// ── Build the personalized first message ────────────────────────────────────
function buildFirstMessage(config: InterviewConfig): string {
  const typeLabel =
    config.type === "dsa" ? "DSA" :
    config.type === "aptitude" ? "aptitude" :
    config.type === "behavioral" ? "behavioral" : "company-specific";

  const topicHint =
    config.type === "dsa" && config.topics?.length
      ? ` focusing on ${config.topics.slice(0, 2).join(" and ")}${config.topics.length > 2 ? " and more" : ""}`
      : "";

  return `Hi! I'm Emma, your interview coach. Today we're doing a ${config.durationMinutes}-minute ${typeLabel} interview${topicHint} geared towards ${config.targetCompany}. Let's jump right in — ${config.type === "behavioral" ? "tell me about yourself and a recent challenge you overcame." : config.type === "dsa" ? "here's your first problem." : "let's start with your background."}`;
}

interface TranscriptLine {
  role: "assistant" | "user";
  text: string;
}

type CallStatus = "connecting" | "active" | "ending" | "processing" | "error";

interface InterviewActiveProps {
  sessionId: string;
  config: InterviewConfig;
  userId: string;
}

export function InterviewActive({ sessionId, config, userId }: InterviewActiveProps) {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState<CallStatus>("connecting");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [endConfirm, setEndConfirm] = useState(false);

  // Countdown timer
  const totalSeconds = config.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transcriptRef = useRef<TranscriptLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callEndedRef = useRef(false);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  // ── Parse transcript into QA pairs ──────────────────────────────────────
  function buildQAs(lines: TranscriptLine[]): InterviewQA[] {
    const qas: InterviewQA[] = [];
    let qIndex = 0;
    let i = 0;
    while (i < lines.length) {
      // Find next assistant line
      if (lines[i].role !== "assistant") { i++; continue; }
      const questionText = lines[i].text.trim();
      if (!questionText) { i++; continue; }

      // Advance past any consecutive assistant lines (partial merges)
      i++;
      while (i < lines.length && lines[i].role === "assistant") i++;

      // Find the user's answer (may be the very next line)
      if (i < lines.length && lines[i].role === "user") {
        qas.push({
          index: qIndex++,
          questionText,
          questionTopic: config.topics?.[0] ?? config.type,
          userTranscript: lines[i].text.trim(),
          score: 5,
          evaluation: "",
          isFollowUp: false,
          parentIndex: null,
          timeTakenSeconds: 0,
          answeredAt: null,
        });
        i++;
      }
    }
    return qas;
  }

  // ── Post-call processing ─────────────────────────────────────────────────
  const handleCallEnd = useCallback(async () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    setCallStatus("processing");
    destroyVapiClient();

    const lines = transcriptRef.current;
    const qas = buildQAs(lines);

    try {
      await Promise.all(qas.map((qa) => saveInterviewQA(sessionId, qa)));

      const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ type: config.type, targetCompany: config.targetCompany, qas }),
      });

      const overallScore = qas.length > 0
        ? Math.round(qas.reduce((s, q) => s + q.score, 0) / qas.length * 10)
        : 50;

      if (res.ok) {
        const fb = await res.json();
        const feedbackDoc: InterviewFeedback = {
          sessionId,
          userId,
          overallScore: fb.overallScore ?? overallScore,
          summary: fb.summary ?? "",
          strengths: fb.strengths ?? [],
          weaknesses: fb.weaknesses ?? [],
          topicScores: fb.topicScores ?? {},
          suggestions: fb.suggestions ?? [],
          generatedAt: null as unknown as InterviewFeedback["generatedAt"],
        };
        await saveInterviewFeedback(feedbackDoc);
        await completeInterviewSession(sessionId, feedbackDoc.overallScore);
      } else {
        await completeInterviewSession(sessionId, overallScore);
      }
    } catch (err) {
      console.error("Post-call processing error:", err);
    }

    router.push(`/interview/${sessionId}/feedback`);
  }, [sessionId, userId, config, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start/stop countdown when call goes active ───────────────────────────
  useEffect(() => {
    if (callStatus === "active") {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            try { getVapiClient().stop(); } catch {}
            handleCallEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus, handleCallEnd]);

  // ── Start Vapi call on mount ─────────────────────────────────────────────
  useEffect(() => {
    const vapi = getVapiClient();

    vapi.on("call-start", () => setCallStatus("active"));
    vapi.on("call-end", () => handleCallEnd());
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("message", (msg: { type: string; role?: string; transcript?: string }) => {
      if (msg.type !== "transcript") return;
      const role = msg.role as "assistant" | "user";
      const text: string = msg.transcript ?? "";

      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === role) return [...prev.slice(0, -1), { role, text }];
        return [...prev, { role, text }];
      });
    });

    vapi.on("error", (err: { message?: string; errorMessage?: string }) => {
      const msg: string = err?.message ?? err?.errorMessage ?? "";
      // "Meeting ended due to ejection" is normal call termination, not a real error
      if (!msg || msg.toLowerCase().includes("ejection") || msg.toLowerCase().includes("meeting has ended")) {
        return;
      }
      console.error("Vapi error:", err);
      setErrorMsg(msg || "An error occurred. Please try again.");
      setCallStatus("error");
    });

    // Start the call — override system prompt and first message with user's context
    vapi
      .start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
        firstMessage: buildFirstMessage(config),
        model: {
          provider: "groq",
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: buildSystemPrompt(config) }],
          maxTokens: 250,
        },
      } as Record<string, unknown>)
      .catch((err: Error) => {
        console.error("Failed to start Vapi call:", err);
        setErrorMsg("Could not connect to the interviewer. Please check your microphone and try again.");
        setCallStatus("error");
      });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try { vapi.stop(); } catch {}
      destroyVapiClient();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEndCall() {
    if (!endConfirm) { setEndConfirm(true); return; }
    setCallStatus("ending");
    if (timerRef.current) clearInterval(timerRef.current);
    try { getVapiClient().stop(); } catch {}
  }

  // ── Timer display helpers ────────────────────────────────────────────────
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerLabel = `${mins}:${String(secs).padStart(2, "0")}`;
  const timerPct = (secondsLeft / totalSeconds) * 100;
  const timerColor =
    timerPct > 40 ? "bg-green-500" :
    timerPct > 15 ? "bg-yellow-500" : "bg-red-500";

  // ── Render ───────────────────────────────────────────────────────────────

  if (callStatus === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">
          progress_activity
        </span>
        <p className="text-on-surface-variant text-sm">Generating your feedback report...</p>
      </div>
    );
  }

  if (callStatus === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <span className="material-symbols-outlined text-error text-5xl">error</span>
        <p className="text-on-surface font-medium">{errorMsg || "Something went wrong."}</p>
        <button
          onClick={() => router.push("/interview/new")}
          className="px-6 py-2.5 rounded-lg gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            callStatus === "connecting" ? "bg-yellow-500 animate-pulse" :
            callStatus === "active" ? "bg-green-500" : "bg-outline"
          }`} />
          <span className="text-on-surface font-medium text-sm">
            {callStatus === "connecting" ? "Connecting..." :
             callStatus === "active" ? "Interview in progress" : "Ending call..."}
          </span>
          {/* Context pills */}
          {callStatus === "active" && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs">
                {config.targetCompany}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs capitalize">
                {config.type.replace("-", " ")}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs capitalize">
                {config.mode}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {endConfirm ? (
            <>
              <span className="text-on-surface-variant text-xs">End interview?</span>
              <button
                onClick={() => setEndConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndCall}
                className="px-3 py-1.5 rounded-lg text-xs text-on-error bg-error hover:opacity-90 transition-opacity"
              >
                End
              </button>
            </>
          ) : (
            <button
              onClick={handleEndCall}
              disabled={callStatus !== "active"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-error-container text-on-error-container hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">call_end</span>
              End
            </button>
          )}
        </div>
      </div>

      {/* Timer bar */}
      {callStatus === "active" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              Time remaining
            </span>
            <span className={`font-mono font-medium ${secondsLeft < 60 ? "text-red-500" : "text-on-surface"}`}>
              {timerLabel}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Interviewer card */}
      <div className="rounded-2xl bg-surface-container-low subtle-border p-5 flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center gradient-primary shrink-0 ${isSpeaking ? "ring-4 ring-primary/30" : ""}`}>
          <span className="material-symbols-outlined text-on-primary text-xl">record_voice_over</span>
          {isSpeaking && (
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-surface" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-on-surface font-medium text-sm">Emma</p>
          <p className="text-on-surface-variant text-xs">
            {isSpeaking ? "Speaking..." : callStatus === "active" ? "Listening" : "Connecting..."}
          </p>
        </div>
        {/* Animated sound bars when speaking */}
        {isSpeaking && (
          <div className="flex items-end gap-0.5 h-5 shrink-0">
            {[3, 5, 4, 6, 3].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-primary-brand animate-pulse"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live transcript */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 min-h-[300px] max-h-[400px] overflow-y-auto rounded-2xl bg-surface-container-low subtle-border p-5"
      >
        {transcript.length === 0 ? (
          <p className="text-on-surface-variant text-sm text-center my-auto">
            {callStatus === "connecting"
              ? "Connecting to Emma..."
              : "Interview starting — Emma will speak first..."}
          </p>
        ) : (
          transcript.map((line, i) => (
            <div key={i} className={`flex gap-3 ${line.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-medium mt-0.5 ${
                line.role === "assistant"
                  ? "gradient-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface"
              }`}>
                {line.role === "assistant" ? "E" : "Y"}
              </div>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                line.role === "assistant"
                  ? "bg-surface-container text-on-surface rounded-tl-sm"
                  : "bg-primary/10 text-on-surface rounded-tr-sm"
              }`}>
                {line.text}
              </div>
            </div>
          ))
        )}
      </div>

      {callStatus === "active" && (
        <p className="text-center text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1">mic</span>
          Your microphone is active — speak naturally to respond
        </p>
      )}
    </div>
  );
}
