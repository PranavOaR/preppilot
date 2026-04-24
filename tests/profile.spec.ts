/**
 * Profile page tests
 * Tests both unauthenticated redirect behavior and authenticated page structure.
 */
import { test, expect } from "@playwright/test";

// Fresh context — no auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Profile page — unauthenticated", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated tests — skipped until global setup / storageState is wired up.
// Firebase Auth persists sessions in IndexedDB, not cookies, so storageState
// cannot carry a session into a fresh context. To enable these tests:
//   1. Create a test Firebase user and add credentials to .env.test.local
//   2. Implement tests/global.setup.ts to sign in and write an IndexedDB snapshot
//   3. Add storageState to the chromium project config and remove test.skip below
// ---------------------------------------------------------------------------
test.describe.skip("Profile page — authenticated (requires test user)", () => {
  test("renders all panels after data loads", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // All panels must be visible after data loads
    await expect(page.getByText("Problems Solved")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Recent Submissions")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Activity")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Global Rank")).toBeVisible({ timeout: 15_000 });

    // Spinners must be gone once data has loaded
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 15_000 });

    // Stat cards must render (even if values are 0)
    await expect(page.getByText("Solved")).toBeVisible();
    await expect(page.getByText("XP")).toBeVisible();
    await expect(page.getByText("Current Streak")).toBeVisible();
  });

  test("shows submissions and solved count even if activity query fails", async ({ page }) => {
    // Regression test for the Promise.allSettled fix — a failed activity fetch
    // must not blank out submissions or solved count.
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Recent Submissions")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Problems Solved")).toBeVisible({ timeout: 15_000 });
  });

  test("rank widget settles — no perpetual Calculating spinner", async ({ page }) => {
    // Regression test for the ranksLoaded state fix. After loading, rank widgets
    // must show a real rank, "—" (Admin SDK unavailable), or no text at all —
    // but NOT "Calculating..." indefinitely.
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await page.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll("p")).some(
          (el) => el.textContent?.trim() === "Calculating..."
        ),
      { timeout: 15_000 }
    );
  });
});
