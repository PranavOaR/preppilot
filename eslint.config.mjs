import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / non-app directories:
    ".firebase/**",
    "judge0-gcp/**",
    "scripts/**",
    // Test artifacts — may not exist; ESLint should not attempt to traverse them
    "test-results/**",
    "playwright-report/**",
    // Claude Code worktrees — separate git trees, not part of this project
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
