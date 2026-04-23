/**
 * API security tests
 * Verifies that protected API routes reject unauthenticated requests.
 * These tests run WITHOUT saved auth state.
 */
import { test, expect } from "@playwright/test";

// Fresh context — no auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("API auth guards", () => {
  test("POST /api/interview/feedback returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/feedback", {
      data: { type: "technical", targetCompany: "TCS", qas: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interview/clarify returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/clarify", {
      data: { question: "Tell me about yourself" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interview/diagnose returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/interview/diagnose", {
      data: { sessionId: "test-session" },
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

  test("POST /api/auth/session returns 400 for missing idToken", async ({ request }) => {
    const res = await request.post("/api/auth/session", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/session returns 401 for invalid idToken", async ({ request }) => {
    const res = await request.post("/api/auth/session", {
      data: { idToken: "not-a-real-token" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/payments/verify returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/payments/verify", {
      data: { orderId: "x", paymentId: "x", signature: "x", plan: "pro" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/stats returns 401 without token", async ({ request }) => {
    const res = await request.get("/api/admin/stats");
    expect(res.status()).toBe(401);
  });
});
