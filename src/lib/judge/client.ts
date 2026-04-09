const SELF_HOSTED_URL = process.env.JUDGE0_SELF_HOSTED_URL?.replace(/\/$/, "");
const RAPIDAPI_URL = "https://judge0-ce.p.rapidapi.com";

// Use self-hosted GCP instance when JUDGE0_SELF_HOSTED_URL is set; fall back to RapidAPI.
const API_URL = SELF_HOSTED_URL || RAPIDAPI_URL;

function getHeaders(): Record<string, string> {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (!SELF_HOSTED_URL) {
    // RapidAPI requires auth headers; self-hosted has no auth by default.
    base["x-rapidapi-host"] = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
    base["x-rapidapi-key"] = process.env.JUDGE0_API_KEY || "";
  }
  return base;
}

function toBase64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(str: string | null): string {
  if (!str) return "";
  return Buffer.from(str, "base64").toString("utf-8");
}

interface SubmissionResult {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

async function submitCodeOnce(
  sourceCode: string,
  languageId: number,
  stdin: string,
  expectedOutput?: string
): Promise<SubmissionResult> {
  const res = await fetch(`${API_URL}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      source_code: toBase64(sourceCode),
      language_id: languageId,
      stdin: toBase64(stdin),
      expected_output: expectedOutput ? toBase64(expectedOutput) : undefined,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Judge0 API error: ${res.status} - ${errorText}`);
  }

  const result = await res.json();

  // Decode base64 fields in the response
  return {
    ...result,
    stdout: result.stdout ? fromBase64(result.stdout) : null,
    stderr: result.stderr ? fromBase64(result.stderr) : null,
    compile_output: result.compile_output ? fromBase64(result.compile_output) : null,
  };
}

export async function submitCode(
  sourceCode: string,
  languageId: number,
  stdin: string,
  expectedOutput?: string,
  retries = 2
): Promise<SubmissionResult> {
  try {
    return await submitCodeOnce(sourceCode, languageId, stdin, expectedOutput);
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return submitCode(sourceCode, languageId, stdin, expectedOutput, retries - 1);
    }
    throw err;
  }
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
  time: string | null;
  memory: number | null;
  error: string | null;
}

export async function runAgainstTestCases(
  sourceCode: string,
  languageId: number,
  testCases: { input: string; expectedOutput: string }[]
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  for (const tc of testCases) {
    try {
      const result = await submitCode(sourceCode, languageId, tc.input);

      const actualOutput = (result.stdout || "").trim();
      const expectedTrimmed = tc.expectedOutput.trim();
      const passed = actualOutput === expectedTrimmed;

      let status = result.status.description;
      if (result.status.id === 3) {
        status = passed ? "Accepted" : "Wrong Answer";
      }

      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        passed: passed && result.status.id === 3,
        status,
        time: result.time,
        memory: result.memory,
        error: result.stderr || result.compile_output || null,
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        passed: false,
        status: "Error",
        time: null,
        memory: null,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
