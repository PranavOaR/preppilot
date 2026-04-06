import { NextRequest } from "next/server";
import { runAgainstTestCases } from "@/lib/judge/client";
import { LANGUAGE_IDS } from "@/lib/judge/languages";

/**
 * Auto-wraps a LeetCode-style C++ Solution class with a main() function that
 * reads stdin in the test-case format and prints the result to stdout.
 *
 * Supports common parameter types: vector<int>, int, long long, string.
 * Returns null if the signature uses unsupported types (ListNode, TreeNode,
 * vector<vector<...>>) — the caller falls back to the original error message.
 */
function wrapCppSolution(code: string): string | null {
  if (!/class\s+Solution/.test(code)) return null;
  if (/\bint\s+main\b/.test(code)) return null;

  // Extract the first public method signature
  const sigMatch = code.match(/public:\s*([\w<>*, ]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/);
  if (!sigMatch) return null;

  const retType = sigMatch[1].trim();
  const method = sigMatch[2].trim();
  const paramsStr = sigMatch[3].trim();

  // Bail on unsupported complex types
  if (/ListNode|TreeNode/.test(retType + paramsStr)) return null;
  if (/vector\s*<\s*vector/.test(retType + paramsStr)) return null;

  // Parse parameter list
  interface Param { type: string; name: string }
  const params: Param[] = [];
  if (paramsStr) {
    for (const raw of paramsStr.split(",")) {
      const t = raw.trim();
      const nm = t.match(/(\w+)\s*$/)?.[1];
      if (!nm) return null;
      const typ = t.slice(0, t.lastIndexOf(nm)).replace(/[&*\s]+$/, "").trim();
      params.push({ type: typ, name: nm });
    }
  }

  // Ensure all param types are supported
  for (const p of params) {
    if (!["vector<int>", "int", "long long", "string"].includes(p.type)) return null;
  }

  // Ensure return type is supported
  if (!["int", "long long", "bool", "double", "float", "void", "vector<int>"].includes(retType)) {
    return null;
  }

  const needsArrayParser = params.some((p) => p.type === "vector<int>");

  let main = "\nint main() {\n";

  if (needsArrayParser) {
    main += `    auto _parseArr = [](const string& s) -> vector<int> {
        vector<int> v;
        if (s.size() <= 2) return v;
        string inner = s.substr(1, s.size() - 2);
        stringstream ss(inner);
        string tok;
        while (getline(ss, tok, ',')) {
            tok.erase(remove_if(tok.begin(), tok.end(), ::isspace), tok.end());
            if (!tok.empty()) v.push_back(stoi(tok));
        }
        return v;
    };\n`;
  }

  for (const p of params) {
    if (p.type === "vector<int>") {
      main += `    string _${p.name}_s; getline(cin, _${p.name}_s);\n`;
      main += `    auto _${p.name} = _parseArr(_${p.name}_s);\n`;
    } else if (p.type === "int") {
      main += `    string _${p.name}_s; getline(cin, _${p.name}_s);\n`;
      main += `    int _${p.name} = stoi(_${p.name}_s);\n`;
    } else if (p.type === "long long") {
      main += `    string _${p.name}_s; getline(cin, _${p.name}_s);\n`;
      main += `    long long _${p.name} = stoll(_${p.name}_s);\n`;
    } else {
      // string
      main += `    string _${p.name}; getline(cin, _${p.name});\n`;
    }
  }

  const args = params.map((p) => `_${p.name}`).join(", ");
  main += `    Solution sol;\n`;

  if (retType === "void") {
    main += `    sol.${method}(${args});\n`;
    // Print first vector<int> param (modified in-place, e.g. merge)
    const firstArr = params.find((p) => p.type === "vector<int>");
    if (firstArr) {
      main += `    cout << "[";\n`;
      main += `    for (size_t i = 0; i < _${firstArr.name}.size(); ++i) { if (i) cout << ","; cout << _${firstArr.name}[i]; }\n`;
      main += `    cout << "\\n";\n`;
    }
  } else if (retType === "bool") {
    main += `    cout << (sol.${method}(${args}) ? "true" : "false") << "\\n";\n`;
  } else if (retType === "int" || retType === "long long") {
    main += `    cout << sol.${method}(${args}) << "\\n";\n`;
  } else if (retType === "double" || retType === "float") {
    // Use setprecision(1) for median-style outputs like "2.0", "2.5"
    main += `    cout << fixed << setprecision(1) << sol.${method}(${args}) << "\\n";\n`;
  } else if (retType === "vector<int>") {
    main += `    auto _res = sol.${method}(${args});\n`;
    main += `    cout << "[";\n`;
    main += `    for (size_t i = 0; i < _res.size(); ++i) { if (i) cout << ","; cout << _res[i]; }\n`;
    main += `    cout << "\\n";\n`;
  }

  main += `    return 0;\n}`;
  return code + main;
}

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

    // For C++: if the code has no main(), try to auto-wrap a LeetCode-style
    // Solution class. If the signature is too complex to wrap, return a clear
    // error rather than a confusing linker failure from Judge0.
    if (language === "cpp" && !/\bint\s+main\b/.test(processedCode)) {
      const wrapped = wrapCppSolution(processedCode);
      if (wrapped) {
        processedCode = wrapped;
      } else {
        const hint =
          "Your C++ code must have a `int main()` function. This problem's types (e.g. ListNode, TreeNode, 2D arrays) require a custom main() — switch to Python for automatic I/O handling, or add main() yourself.";
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
    }

    // For C: still require an explicit main()
    if (language === "c" && !/\bint\s+main\b/.test(processedCode)) {
      const hint = "Your C code must have a `int main()` function that reads from stdin and prints to stdout.";
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
