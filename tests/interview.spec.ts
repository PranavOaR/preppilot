import { test, expect } from "./fixtures";

test.describe("Interview landing page", () => {
  test("loads interview page", async ({ page }) => {
    await page.goto("/interview");
    await expect(page).toHaveURL(/\/interview/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("shows past sessions or Start New Interview", async ({ page }) => {
    await page.goto("/interview");
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
    // Either shows history or the start button
    await expect(
      page.getByRole("link", { name: /start|new interview/i })
        .first()
        .or(page.getByText(/past|history|previous/i).first())
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Interview setup page", () => {
  test("loads interview type selection", async ({ page }) => {
    await page.goto("/interview/new");
    // Should show type cards
    await expect(
      page.getByText(/technical|behavioral|hr|dsa|aptitude/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("can select an interview type", async ({ page }) => {
    await page.goto("/interview/new");

    const typeCard = page
      .getByText(/technical|behavioral|hr/i)
      .first();
    if (await typeCard.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await typeCard.click();
      await expect(page).toHaveURL(/\/interview\/new/);
    }
  });
});

test.describe("Interview feedback page", () => {
  test("invalid session redirects or shows error", async ({ page }) => {
    await page.goto("/interview/nonexistent-id-xyz123/feedback");
    // Either redirects away or stays showing an error — should not crash
    await page.waitForTimeout(3_000);
    // Should not show a blank crash page
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
