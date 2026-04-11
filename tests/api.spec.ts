/**
 * API security tests
 * Verifies that protected API routes reject unauthenticated requests.
 * These tests run WITHOUT saved auth state.
 */
import { test, expect } from "@playwright/test";

// Fresh context — no auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("API auth guards", () => {
  test("POST /api/interview/question returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/question", {
      data: { type: "technical", targetCompany: "TCS", questionIndex: 0, totalQuestions: 5, previousQAs: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interview/tts returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/tts", {
      data: { text: "Hello world", language: "en-IN" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interview/evaluate returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/evaluate", {
      data: { question: "test", transcript: "answer", type: "technical" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interview/feedback returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/feedback", {
      data: { type: "technical", targetCompany: "TCS", qas: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/hints returns 401 without token", async ({ request }) => {
    const res = await request.post("/api/hints", {
      data: { problem: { id: "test" }, hintLevel: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test("PUT /api/user/profile returns 401 without token", async ({
    request,
  }) => {
    const res = await request.put("/api/user/profile", {
      data: { displayName: "Hacker" },
    });
    expect(res.status()).toBe(401);
  });
});
