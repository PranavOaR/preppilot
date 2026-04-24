/**
 * Bookmarks page tests
 * Tests both unauthenticated redirect behavior and authenticated page structure.
 */
import { test as authTest, expect } from "./fixtures";
import { test as unauthTest } from "@playwright/test";

unauthTest.describe("Bookmarks page — unauthenticated", () => {
  unauthTest.use({ storageState: { cookies: [], origins: [] } });

  unauthTest("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

authTest.describe("Bookmarks page — authenticated", () => {
  authTest("/bookmarks loads without redirecting to /login", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  authTest(
    "bookmarked items or empty state is visible",
    async ({ page }) => {
      await page.goto("/bookmarks");
      await page.waitForLoadState("networkidle");

      // Either a list of bookmarked problems or an empty/no-bookmarks message
      const hasBookmarks = await page
        .locator("table, [data-testid='bookmark-item'], li")
        .first()
        .isVisible()
        .catch(() => false);

      const hasEmptyState = await page
        .getByText(/no bookmarks|nothing here|you haven't bookmarked|empty/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasBookmarks || hasEmptyState).toBe(true);
    }
  );

  authTest(
    "no spinners after networkidle",
    async ({ page }) => {
      await page.goto("/bookmarks");
      await page.waitForLoadState("networkidle");

      await expect(page.locator(".animate-spin")).toHaveCount(0, {
        timeout: 20_000,
      });
    }
  );
});
