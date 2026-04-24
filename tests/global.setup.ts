/**
 * Global setup — runs once before all tests.
 *
 * Signs in with a real test Firebase account, waits for the dashboard,
 * then saves the browser storage state (cookies + localStorage) so every
 * other test can skip the login step entirely.
 *
 * Prerequisites — create a test account in Firebase Console and add these
 * to your .env.test.local (or export them before running tests):
 *
 *   TEST_USER_EMAIL=testuser@example.com
 *   TEST_USER_PASSWORD=YourTestPassword123!
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_STATE_FILE = path.join(__dirname, ".auth/user.json");

setup("sign in as test user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD.\n" +
        "Create a test Firebase account and set these in .env.test.local"
    );
  }

  await page.goto("/login");

  // Wait for the form to render before interacting
  await page.waitForLoadState("networkidle");

  // Fill login form — inputs use id/placeholder, not Label wrappers
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard — confirms auth succeeded
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Save the full browser context (cookies + localStorage) — this includes
  // the __session cookie and any Firebase persistence tokens in localStorage
  await page.context().storageState({ path: AUTH_STATE_FILE });
});
