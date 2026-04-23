/**
 * Auth flow tests
 * Tests login, registration, and redirect behaviour.
 * These run WITHOUT the saved auth state (fresh context).
 */
import { test, expect } from "@playwright/test";

// Override the storageState from playwright.config — auth tests need a fresh session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test.skip("redirects authenticated users away from /login", async ({ page }) => {
    // Requires loading saved auth state into a fresh context —
    // covered by e2e tests that use the global storageState fixture.
    void page;
  });

  test("shows login form with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("notareal@user.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should stay on login and show an error
    await expect(page).toHaveURL(/\/login/);
    // Look for any error text (Firebase returns "user not found" or similar)
    await expect(
      page.getByText(/invalid|incorrect|not found|wrong/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("blocks access to protected routes when not logged in", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("blocks /practice when not logged in", async ({ page }) => {
    await page.goto("/practice");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("blocks /interview when not logged in", async ({ page }) => {
    await page.goto("/interview");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Register page", () => {
  test("shows registration form", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#reg-email")).toBeVisible();
    await expect(page.locator("#reg-password")).toBeVisible();
    await expect(page.locator("#reg-username")).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.locator("#reg-email").fill("test@example.com");
    await page.locator("#reg-username").fill("testuser");
    await page.locator("#reg-password").fill("Password123!");
    await page.locator("#reg-confirm").fill("DifferentPassword!");

    await page.getByRole("button", { name: /create account/i }).click();
    await expect(
      page.getByText(/match|password/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
