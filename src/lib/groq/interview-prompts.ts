import type { InterviewType, InterviewQA } from "@/lib/types/interview";

export function buildQuestionPrompt(
  type: InterviewType,
  targetCompany: string,
  questionIndex: number,
  totalQuestions: number,
  previousQAs: InterviewQA[],
  topics?: string[]
): string {
  const context = [
    `You are a technical interviewer at ${targetCompany}, conducting a ${type} interview.`,
    `This is question ${questionIndex + 1} of ${totalQuestions}.`,
  ];

  if (type === "dsa") {
    context.push(
      "Ask a data structures and algorithms question. Focus on problem-solving ability.",
      "Frame it as a verbal question — the candidate will explain their approach verbally, not write code.",
      topics?.length
        ? `Focus on these topics: ${topics.join(", ")}.`
        : ""
    );
  } else if (type === "aptitude") {
    context.push(
      "Ask a quantitative aptitude or logical reasoning question.",
      "The candidate should walk you through their thought process verbally."
    );
  } else if (type === "behavioral") {
    context.push(
      "Ask a behavioral interview question using the STAR method.",
      "Focus on teamwork, leadership, conflict resolution, or problem-solving scenarios."
    );
  } else if (type === "company-specific") {
    context.push(
      `Ask a question that ${targetCompany} is known to ask in interviews.`,
      "Mix technical and situational questions."
    );
  }

  if (previousQAs.length > 0) {
    const lastQA = previousQAs[previousQAs.length - 1];
    context.push(
      "",
      "Previous exchange:",
      `Q: ${lastQA.questionText}`,
      `A: ${lastQA.userTranscript}`,
      `Score: ${lastQA.score}/10`,
      "",
      "Ask a different question on a new topic. Do not repeat themes."
    );
  }

  context.push(
    "",
    "IMPORTANT: Output ONLY the question text. No preamble, no labels, no numbering. Keep it under 3 sentences."
  );

  return context.filter(Boolean).join("\n");
}

export function buildFollowUpPrompt(
  originalQuestion: string,
  userAnswer: string,
  score: number
): string {
  return [
    "You are a technical interviewer conducting a follow-up.",
    "",
    `Original question: ${originalQuestion}`,
    `Candidate's answer: ${userAnswer}`,
    `Their answer scored ${score}/10.`,
    "",
    score < 5
      ? "The candidate struggled. Ask a simpler, guiding follow-up to help them demonstrate partial understanding."
      : "The candidate did well. Ask a deeper follow-up to probe their understanding further.",
    "",
    "IMPORTANT: Output ONLY the follow-up question. Keep it under 2 sentences.",
  ].join("\n");
}

export function buildEvaluationPrompt(
  question: string,
  transcript: string,
  type: InterviewType
): string {
  return [
    "You are evaluating a candidate's verbal answer in a technical interview.",
    "",
    `Question: ${question}`,
    `Candidate's answer (transcribed from speech): ${transcript}`,
    `Interview type: ${type}`,
    "",
    "Evaluate the answer on a scale of 0-10. Consider:",
    "- Correctness of the approach/answer",
    "- Clarity of explanation",
    "- Depth of understanding",
    "- Communication quality (accounting for speech-to-text artifacts)",
    "",
    "Respond in EXACTLY this JSON format:",
    '{ "score": <number 0-10>, "evaluation": "<2-3 sentence written feedback>", "comment": "<1-2 sentence natural spoken remark to the candidate, as if you are reacting verbally>" }',
    "",
    "Output ONLY the JSON. No markdown, no code blocks.",
  ].join("\n");
}

export function buildFeedbackPrompt(
  type: InterviewType,
  targetCompany: string,
  qas: InterviewQA[]
): string {
  const qaList = qas
    .map(
      (qa, i) =>
        `Q${i + 1} [${qa.questionTopic}]: ${qa.questionText}\nA: ${qa.userTranscript}\nScore: ${qa.score}/10 — ${qa.evaluation}`
    )
    .join("\n\n");

  return [
    `Generate a comprehensive interview feedback report for a ${type} interview targeting ${targetCompany}.`,
    "",
    "Interview transcript:",
    qaList,
    "",
    "Respond in EXACTLY this JSON format:",
    "{",
    '  "overallScore": <number 0-100>,',
    '  "summary": "<3-4 sentence overall assessment>",',
    '  "strengths": ["<strength 1>", "<strength 2>", ...],',
    '  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],',
    '  "topicScores": { "<topic>": <score 0-10>, ... },',
    '  "suggestions": ["<actionable suggestion 1>", "<suggestion 2>", ...]',
    "}",
    "",
    "Output ONLY the JSON. No markdown, no code blocks.",
  ].join("\n");
}
