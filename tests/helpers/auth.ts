import { expect, type Page } from "@playwright/test";

/**
 * Signs in the test user via the login form.
 * Firebase Auth stores the session in IndexedDB — as long as the same
 * browser context is reused, the session persists across pages without
 * having to log in again.
 */
export async function signInTestUser(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local"
    );
  }

  await page.goto("/login");
  await expect(page.locator("#email")).toBeVisible({ timeout: 15_000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}
