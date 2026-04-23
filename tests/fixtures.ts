/**
 * Custom Playwright fixtures for PrepPilot tests.
 *
 * Firebase Auth stores its session in IndexedDB, which Playwright's
 * storageState doesn't capture.  The fix: sign in once per worker using
 * a shared browser context so IndexedDB survives across tests in the same file.
 *
 * Usage in spec files:
 *   import { test, expect } from "./fixtures";
 *
 *   test("my test", async ({ page }) => { ... });
 *
 * The `page` fixture here is an authenticated page — no per-test sign-in needed.
 */
import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { signInTestUser } from "./helpers/auth";

type WorkerFixtures = { sharedAuthContext: BrowserContext };
type TestFixtures = { page: Page };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // One authenticated browser context per worker.
  // Signs in once; IndexedDB persists for every page opened from this context.
  sharedAuthContext: [
    async ({ browser }, use) => {
      const ctx = await browser.newContext();
      const setupPage = await ctx.newPage();
      await signInTestUser(setupPage);
      await setupPage.close();
      await use(ctx);
      await ctx.close();
    },
    { scope: "worker" },
  ],

  // Override the default `page` to come from the shared authenticated context.
  // `use` here is Playwright's fixture `use` callback, not a React hook.
  page: async ({ sharedAuthContext }, use) => {
    const page = await sharedAuthContext.newPage();
    await use(page); // eslint-disable-line react-hooks/rules-of-hooks
    await page.close();
  },
});

export { expect };
