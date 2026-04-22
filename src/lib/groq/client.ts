import Groq from "groq-sdk";
import { GROQ_MODELS } from "./models";

let _groq: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured in .env.local");
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// Internal alias for file-local use
const getGroq = getGroqClient;

export async function generateHint(prompt: string): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODELS.capable,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful programming tutor. Provide hints that guide students toward the solution without giving it away entirely. Be concise and clear.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content?.trim() || "No hint available.";
}

export async function generateCodeReview(prompt: string): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODELS.capable,
    messages: [
      {
        role: "system",
        content:
          "You are an expert code reviewer specializing in algorithms and data structures. Provide concise, actionable feedback. Always respond with valid JSON as instructed.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 600,
  });

  return completion.choices[0]?.message?.content?.trim() || "{}";
}
