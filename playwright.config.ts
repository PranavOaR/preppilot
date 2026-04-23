import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { config as loadDotenv } from "dotenv";

// Load test credentials from .env.test.local
loadDotenv({ path: path.join(__dirname, ".env.test.local") });

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit workers so Firebase Auth sign-ins don't all race at startup
  workers: process.env.CI ? 1 : 3,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${process.env.PORT || 3000}`,
    screenshot: "only-on-failure",
    video: "on-first-retry",
    trace: "on-first-retry",
  },

  projects: [
    // No-auth tests — API security checks, raw auth page checks
    // No sign-in needed. Fresh browser context per test.
    {
      name: "no-auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /\/(api|auth)\.spec\.ts/,
    },

    // Authenticated tests — use the shared-context fixture (fixtures.ts)
    // Signs in once per worker via IndexedDB-aware shared context.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /api\.spec\.ts|auth\.spec\.ts|global\.setup\.ts/,
    },
  ],

  // Start the Next.js dev server automatically before tests run
  webServer: {
    command: "npm run dev",
    url: `http://127.0.0.1:${process.env.PORT || 3000}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      HOST: "127.0.0.1",
    },
  },
});
