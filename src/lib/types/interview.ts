import type { Timestamp } from "firebase/firestore";

export type InterviewType = "dsa" | "aptitude" | "behavioral" | "company-specific";

export type InterviewState =
  | "setup"
  | "generating_question"
  | "speaking_question"
  | "waiting_for_answer"
  | "recording"
  | "processing_stt"
  | "evaluating"
  | "generating_followup"
  | "generating_feedback"
  | "completed";

export interface InterviewConfig {
  type: InterviewType;
  targetCompany: string;
  durationMinutes: number;
  mode: "practice" | "exam";
  topics?: string[];  // optional topic focus (DSA only)
  // legacy — kept so old in-progress sessions can resume
  language?: string;
  speaker?: string;
  totalQuestions?: number;
}

export interface InterviewSession {
  id: string;
  userId: string;
  type: InterviewType;
  targetCompany: string;
  durationMinutes: number;
  mode: "practice" | "exam";
  topics?: string[];
  questionsCompleted: number;
  status: "in-progress" | "completed" | "abandoned";
  overallScore: number | null;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  // legacy fields
  language?: string;
  speaker?: string;
  totalQuestions?: number;
}

export interface InterviewQA {
  index: number;
  questionText: string;
  questionTopic: string;
  userTranscript: string;
  score: number; // 0-10
  evaluation: string;
  isFollowUp: boolean;
  parentIndex: number | null;
  timeTakenSeconds: number;
  answeredAt: Timestamp | null;
  fillerCount?: number;        // count of filler words detected
  confidenceRating?: number;   // user self-rating 1-5
  answerDurationSeconds?: number;
}

export interface InterviewFeedback {
  sessionId: string;
  userId: string;
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  topicScores: Record<string, number>;
  suggestions: string[];
  generatedAt: Timestamp | null;
}
