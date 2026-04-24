/**
 * Bookmarks page tests
 * Tests both unauthenticated redirect behavior and authenticated page structure.
 */
import { test, expect } from "@playwright/test";

// Fresh context — no auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Bookmarks page — unauthenticated", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/bookmarks");
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
test.describe.skip("Bookmarks page — authenticated (requires test user)", () => {
  test("renders bookmarked problems after data loads", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForLoadState("networkidle");

    // Spinner must be gone once data has loaded
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 15_000 });
  });
});
