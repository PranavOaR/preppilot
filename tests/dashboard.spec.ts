import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test("loads dashboard page after auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("shows XP and streak stats", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/xp/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("navigation links are all present", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.locator("header nav");
    await expect(nav.getByRole("link", { name: /roadmap/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /practice/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /interview/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /mock tests/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /pricing/i })).toBeVisible();
  });

  test("settings icon navigates to settings", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("header a[href='/settings']").click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("avatar navigates to profile", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("header a[href='/profile']").first().click();
    await expect(page).toHaveURL(/\/profile/);
  });
});

test.describe("Settings page", () => {
  test("loads settings form with profile data", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("#username")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#university")).toBeVisible();
  });

  test("save shows success toast", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("#username")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /save/i }).click();
    await expect(
      page.getByText(/saved|success/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
