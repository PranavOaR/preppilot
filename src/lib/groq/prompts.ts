import type { Problem } from "@/lib/types";

const LEVEL_INSTRUCTIONS: Record<number, string> = {
  1: "Provide a conceptual nudge. Do NOT name the algorithm or data structure. No code. Just point the student in the right direction with a brief observation about the problem's nature.",
  2: "Describe the approach. You may name the technique or algorithm. Explain the high-level strategy. No code.",
  3: "Provide structured pseudocode with key steps and edge cases. Use clear step-by-step formatting.",
  4: "Detailed walkthrough with near-complete pseudocode and complexity analysis (time + space). This should be enough for the student to implement the solution.",
};

export function buildHintPrompt(problem: Problem, level: number): string {
  const parts = [
    `Problem: "${problem.title}"`,
    `Difficulty: ${problem.difficulty}`,
    `Topic: ${problem.topic.replace(/-/g, " ")}`,
    "",
    `Description:\n${problem.description}`,
  ];

  if (problem.constraints.length > 0) {
    parts.push("", `Constraints:\n${problem.constraints.join("\n")}`);
  }

  if (problem.examples.length > 0) {
    const ex = problem.examples[0];
    parts.push(
      "",
      "Example:",
      ex.input ? `Input: ${ex.input}` : "",
      `Output: ${ex.output}`
    );
  }

  parts.push("", `--- Hint Level ${level} ---`, LEVEL_INSTRUCTIONS[level]);

  return parts.filter(Boolean).join("\n");
}
