import { test, expect } from "./fixtures";

test.describe("Roadmap page", () => {
  test("loads roadmap", async ({ page }) => {
    await page.goto("/roadmap");
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("shows topic cards", async ({ page }) => {
    await page.goto("/roadmap");
    await expect(
      page.getByText(/arrays|strings|binary|graph|dp|trees/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("practice link from roadmap navigates to practice page", async ({ page }) => {
    await page.goto("/roadmap");
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });

    const practiceLink = page
      .getByRole("link", { name: /practice/i })
      .first();
    if (await practiceLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await practiceLink.click();
      await page.waitForURL(/\/practice/, { timeout: 8_000 });
      expect(page.url()).toMatch(/\/practice/);
    }
  });
});

test.describe("Leaderboard page", () => {
  test("loads leaderboard", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("Profile page", () => {
  test("loads profile with stats", async ({ page }) => {
    await page.goto("/profile");
    await expect(
      page.getByText(/xp|solved|streak/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("shows activity heatmap SVG", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Analytics page", () => {
  test("loads analytics page (redirects to dashboard)", async ({ page }) => {
    await page.goto("/analytics");
    // Analytics is currently a stub that redirects to dashboard
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Mock Tests page", () => {
  test("loads mock tests page", async ({ page }) => {
    await page.goto("/mock-tests");
    await expect(
      page.getByText(/no mock tests|company mock tests/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Pricing page", () => {
  test("shows all four plan tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/^free$/i).first()).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByText(/^pro$/i).first()).toBeVisible();
    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/premium/i).first()).toBeVisible();
  });
});
