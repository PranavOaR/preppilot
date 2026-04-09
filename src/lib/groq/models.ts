/** Centralized Groq model configuration. */
export const GROQ_MODELS = {
  /** Low-latency model — for real-time question generation and evaluation. */
  fast: "llama-3.1-8b-instant",
  /** High-quality model — for hints, feedback, and code review. */
  capable: "llama-3.3-70b-versatile",
} as const;
