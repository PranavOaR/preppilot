/**
 * Profile page tests
 * Tests both unauthenticated redirect behavior and authenticated page structure.
 */
import { test as authTest, expect } from "./fixtures";
import { test as unauthTest } from "@playwright/test";

unauthTest.describe("Profile page — unauthenticated", () => {
  unauthTest.use({ storageState: { cookies: [], origins: [] } });

  unauthTest("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

authTest.describe("Profile page — authenticated", () => {
  authTest("page loads and does not redirect to /login", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login/);
  });

  authTest(
    "stats section is visible",
    async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // At least one of these stat labels must be present
      const statsLocator = page.getByText(/Problems Solved|Solved|XP|Streak/i);
      await expect(statsLocator.first()).toBeVisible({ timeout: 20_000 });
    }
  );

  authTest(
    "recent submissions section is visible",
    async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByText("Recent Submissions")
      ).toBeVisible({ timeout: 20_000 });
    }
  );

  authTest(
    "spinners clear after networkidle",
    async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await expect(page.locator(".animate-spin")).toHaveCount(0, {
        timeout: 20_000,
      });
    }
  );

  authTest(
    "rank widgets settle — no perpetual Calculating... text",
    async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      await page.waitForFunction(
        () =>
          !Array.from(document.querySelectorAll("p")).some(
            (el) => el.textContent?.trim() === "Calculating..."
          ),
        { timeout: 15_000 }
      );
    }
  );
});
