import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";
import { FieldValue } from "firebase-admin/firestore";
import { PLAN_PRICES, INTERVIEW_ADDON_PRICE, type PlanTier } from "@/lib/types/plans";

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const authUser = await verifyIdToken(token);
    if (!authUser) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const { orderId, paymentId, signature, plan, type } = (await req.json()) as {
      orderId: string;
      paymentId: string;
      signature: string;
      plan?: Exclude<PlanTier, "free">;
      type?: "interview_addon";
    };

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Require Admin SDK — plan activation cannot be delegated to the client.
    const db = getAdminDb();
    if (!db) {
      console.error(
        "[payments/verify] FIREBASE_SERVICE_ACCOUNT_JSON is not configured. " +
          "Set this env var to enable server-side plan activation."
      );
      return NextResponse.json(
        {
          error:
            "Payment received but plan activation is unavailable. " +
            "Please contact support with your payment ID: " + paymentId,
        },
        { status: 503 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || !keyId) {
      return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
    }

    // Verify Razorpay HMAC signature
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "hex");
    let receivedBuf: Buffer;
    try {
      receivedBuf = Buffer.from(signature, "hex");
    } catch {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }
    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // Cross-check the order amount against Razorpay to prevent plan-tier fraud
    // (attacker pays for starter then replays with plan="premium")
    const razorpayAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Basic ${razorpayAuth}` },
    });
    if (!orderRes.ok) {
      return NextResponse.json({ error: "Could not verify payment order." }, { status: 502 });
    }
    const razorpayOrder = (await orderRes.json()) as { amount: number; status: string };

    if (razorpayOrder.status !== "paid") {
      return NextResponse.json({ error: "Payment not completed." }, { status: 400 });
    }

    // ── Interview add-on purchase ──
    if (type === "interview_addon") {
      if (razorpayOrder.amount !== INTERVIEW_ADDON_PRICE.paise) {
        return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
      }

      const paymentRef = db.collection("payments").doc(paymentId);
      const userRef = db.collection("users").doc(authUser.uid);
      let alreadyProcessed = false;

      await db.runTransaction(async (t) => {
        const existing = await t.get(paymentRef);
        if (existing.exists) { alreadyProcessed = true; return; }
        t.create(paymentRef, {
          userId: authUser.uid,
          type: "interview_addon",
          amountInr: INTERVIEW_ADDON_PRICE.inr,
          orderId,
          paymentId,
          paidAt: FieldValue.serverTimestamp(),
        });
        t.update(userRef, {
          purchasedInterviews: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      if (alreadyProcessed) return NextResponse.json({ success: true, idempotent: true });
      return NextResponse.json({ success: true, type: "interview_addon" });
    }

    // ── Plan upgrade purchase ──
    if (!plan || !(plan in PLAN_PRICES)) {
      return NextResponse.json({ error: "Missing or invalid plan." }, { status: 400 });
    }

    const expectedPaise = PLAN_PRICES[plan].paise;
    if (razorpayOrder.amount !== expectedPaise) {
      return NextResponse.json({ error: "Payment amount does not match plan price." }, { status: 400 });
    }

    const planExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    const paymentRef = db.collection("payments").doc(paymentId);
    const userRef = db.collection("users").doc(authUser.uid);
    let alreadyProcessed = false;

    await db.runTransaction(async (t) => {
      const existing = await t.get(paymentRef);
      if (existing.exists) { alreadyProcessed = true; return; }
      t.create(paymentRef, {
        userId: authUser.uid,
        plan,
        amountInr: PLAN_PRICES[plan].inr,
        orderId,
        paymentId,
        planExpiresAt,
        paidAt: FieldValue.serverTimestamp(),
      });
      t.update(userRef, {
        plan,
        planExpiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (alreadyProcessed) return NextResponse.json({ success: true, idempotent: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
