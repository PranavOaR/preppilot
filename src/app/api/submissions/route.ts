import { NextRequest } from "next/server";
import { runAgainstTestCases } from "@/lib/judge/client";
import { LANGUAGE_IDS } from "@/lib/judge/languages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, testCases, mode } = body as {
      code: string;
      language: string;
      testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
      mode: "run" | "submit";
    };

    if (!code || !language || !testCases) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return Response.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Prepend standard headers for C/C++ if the user's code doesn't already have them.
    // Judge0 compiles code as-is, so missing includes cause compile errors.
    let processedCode = code;
    if (language === "cpp" && !code.includes("#include")) {
      processedCode = `#include <bits/stdc++.h>\nusing namespace std;\n\n${code}`;
    } else if (language === "c" && !code.includes("#include")) {
      processedCode = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\n${code}`;
    }

    // For "run" mode, only use visible test cases
    // For "submit" mode, use all test cases
    const casesToRun =
      mode === "run"
        ? testCases.filter((tc) => !tc.isHidden)
        : testCases;

    // For C/C++: if the code has no main function, Judge0 will produce a linker
    // error. Detect this early and return a clear message instead.
    if ((language === "cpp" || language === "c") && !/\bint\s+main\b/.test(processedCode)) {
      const hint =
        language === "cpp"
          ? "Your C++ code must have a `int main()` function that reads from stdin and prints to stdout. The starter code is a LeetCode-style template — add a main() that parses the input and calls your function."
          : "Your C code must have a `int main()` function that reads from stdin and prints to stdout.";
      const stubResults = casesToRun.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        passed: false,
        status: "Compile Error",
        time: null,
        memory: null,
        error: hint,
      }));
      return Response.json({
        results: stubResults,
        summary: { total: stubResults.length, passed: 0, allPassed: false, mode },
      });
    }

    const results = await runAgainstTestCases(
      processedCode,
      languageId,
      casesToRun.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }))
    );

    // Replace raw linker "undefined reference to `main'" with a friendly message
    const processedResults = results.map((r) => {
      if (r.error && r.error.includes("undefined reference to `main'")) {
        return {
          ...r,
          error:
            "Compile Error: Your C/C++ code must include an `int main()` function. Write a complete program that reads input from stdin and prints to stdout.",
        };
      }
      return r;
    });

    const totalPassed = processedResults.filter((r) => r.passed).length;
    const allPassed = totalPassed === results.length;

    return Response.json({
      results: processedResults,
      summary: {
        total: processedResults.length,
        passed: totalPassed,
        allPassed,
        mode,
      },
    });
  } catch (err) {
    console.error("Submission error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
