import type { InterviewState } from "@/lib/types/interview";

export type InterviewEvent =
  | "START_INTERVIEW"
  | "QUESTION_GENERATED"
  | "QUESTION_SPOKEN"
  | "START_RECORDING"
  | "STOP_RECORDING"
  | "STT_COMPLETE"
  | "EVALUATION_COMPLETE"
  | "NEEDS_FOLLOWUP"
  | "NEXT_QUESTION"
  | "ALL_QUESTIONS_DONE"
  | "FEEDBACK_GENERATED";

const TRANSITIONS: Record<InterviewState, Partial<Record<InterviewEvent, InterviewState>>> = {
  setup: {
    START_INTERVIEW: "generating_question",
  },
  generating_question: {
    QUESTION_GENERATED: "speaking_question",
  },
  speaking_question: {
    QUESTION_SPOKEN: "waiting_for_answer",
  },
  waiting_for_answer: {
    START_RECORDING: "recording",
  },
  recording: {
    STOP_RECORDING: "processing_stt",
  },
  processing_stt: {
    STT_COMPLETE: "evaluating",
  },
  evaluating: {
    NEEDS_FOLLOWUP: "generating_followup",
    NEXT_QUESTION: "generating_question",
    ALL_QUESTIONS_DONE: "generating_feedback",
  },
  generating_followup: {
    QUESTION_GENERATED: "speaking_question",
  },
  generating_feedback: {
    FEEDBACK_GENERATED: "completed",
  },
  completed: {},
};

export function getNextState(
  currentState: InterviewState,
  event: InterviewEvent
): InterviewState | null {
  return TRANSITIONS[currentState]?.[event] ?? null;
}

export function canTransition(
  currentState: InterviewState,
  event: InterviewEvent
): boolean {
  return getNextState(currentState, event) !== null;
}
