const API_URL = "https://judge0-ce.p.rapidapi.com";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-rapidapi-host": process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com",
    "x-rapidapi-key": process.env.JUDGE0_API_KEY || "",
  };
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

export async function submitCode(
  sourceCode: string,
  languageId: number,
  stdin: string,
  expectedOutput?: string
): Promise<SubmissionResult> {
  // Create submission
  const createRes = await fetch(`${API_URL}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
      expected_output: expectedOutput,
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Judge0 API error: ${createRes.status} - ${errorText}`);
  }

  return createRes.json();
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

      // Status IDs: 3 = Accepted, 4 = Wrong Answer, 5 = TLE, 6 = Compilation Error, etc.
      let status = result.status.description;
      if (result.status.id === 3) {
        status = passed ? "Accepted" : "Wrong Answer";
      }

      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: actualOutput,
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
