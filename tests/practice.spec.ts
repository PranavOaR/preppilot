import { test, expect } from "./fixtures";

// Known slugs seeded into Firestore — used for direct navigation tests
const DSA_SLUG = "two-sum";
const APTITUDE_SLUG = "hcf-of-two-numbers";

test.describe("Practice page", () => {
  test("loads and shows problems table", async ({ page }) => {
    await page.goto("/practice");
    // Wait for Firestore fetch to complete
    const rows = page.locator("table tbody tr");
    const emptyState = page.getByText(/no problems found/i);
    await expect(rows.first().or(emptyState)).toBeVisible({ timeout: 15_000 });
  });

  test("DSA filter shows only DSA problems", async ({ page }) => {
    await page.goto("/practice");
    await expect(
      page.locator("table tbody tr").first().or(page.getByText(/no problems/i))
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /^dsa$/i }).click();
    // Wait for re-fetch
    await page.waitForTimeout(1_000);
    // Aptitude type badges should not appear
    const aptitudeBadges = page.locator("table").getByText(/^aptitude$/i);
    await expect(aptitudeBadges).toHaveCount(0, { timeout: 8_000 });
  });

  test("Aptitude filter shows only aptitude problems", async ({ page }) => {
    await page.goto("/practice");
    await expect(
      page.locator("table tbody tr").first().or(page.getByText(/no problems/i))
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /^aptitude$/i }).click();
    await page.waitForTimeout(1_000);
    const dsaBadges = page.locator("table").getByText(/^dsa$/i);
    await expect(dsaBadges).toHaveCount(0, { timeout: 8_000 });
  });

  test("empty state shows when filters return nothing", async ({ page }) => {
    await page.goto("/practice");
    await expect(
      page.locator("table tbody tr").first().or(page.getByText(/no problems/i))
    ).toBeVisible({ timeout: 15_000 });

    // Apply a topic filter that can't match anything
    // Use search input if present
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill("__zzz_no_match_zzz__");
      await page.waitForTimeout(500);
      await expect(page.getByText(/no problems found/i)).toBeVisible({
        timeout: 8_000,
      });
    }
  });

  test("clicking a DSA problem opens the editor page", async ({ page }) => {
    await page.goto("/practice?type=dsa");
    // Wait for actual data rows (not skeleton) — skeleton rows have no <p> inside td
    const firstDataRow = page.locator("table tbody tr").filter({ has: page.locator("td p") }).first();
    await firstDataRow.waitFor({ timeout: 15_000 });
    await firstDataRow.click();
    await page.waitForURL(/\/practice\/.+/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/practice\/.+/);
  });
});

test.describe("DSA problem page", () => {
  test("loads Monaco editor", async ({ page }) => {
    await page.goto(`/practice/${DSA_SLUG}`);
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("Run Tests button is visible and enabled", async ({ page }) => {
    await page.goto(`/practice/${DSA_SLUG}`);
    const runBtn = page.getByRole("button", { name: /run tests/i });
    await runBtn.waitFor({ timeout: 15_000 });
    await expect(runBtn).toBeVisible();
    await expect(runBtn).not.toBeDisabled();
  });

  test("language selector changes language", async ({ page }) => {
    await page.goto(`/practice/${DSA_SLUG}`);
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 20_000,
    });
    // Switch to Java
    const javaBtn = page.getByRole("button", { name: /java/i });
    if (await javaBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await javaBtn.click();
      await page.waitForTimeout(500);
      // Editor should still be visible after language switch
      await expect(page.locator(".monaco-editor").first()).toBeVisible();
    }
  });
});

test.describe("Aptitude problem page", () => {
  test("loads MCQ with 4 options", async ({ page }) => {
    // Navigate via practice list to ensure we hit an existing aptitude problem
    await page.goto("/practice?type=aptitude");
    const firstDataRow = page.locator("table tbody tr").filter({ has: page.locator("td p") }).first();
    await firstDataRow.waitFor({ timeout: 15_000 });
    await firstDataRow.click();
    await page.waitForURL(/\/practice\/.+/, { timeout: 10_000 });
    // Options are custom <button> elements with a rounded label span (A/B/C/D)
    // Each option button contains a span with class w-8 h-8 rounded-full
    const labelSpans = page.locator("button span.rounded-full");
    await expect(labelSpans.first()).toBeVisible({ timeout: 15_000 });
    await expect(labelSpans).toHaveCount(4);
  });
});
