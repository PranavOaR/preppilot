import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import type { PlanTier } from "@/lib/types/plans";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the caller
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
    }

    // Verify Razorpay signature: HMAC-SHA256(orderId + "|" + paymentId, keySecret)
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    const receivedBuf = Buffer.from(signature, "hex");
    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // Interview add-on purchase
    if (type === "interview_addon") {
      return NextResponse.json({ success: true, type: "interview_addon", userId: authUser.uid });
    }

    // Plan upgrade purchase
    if (!plan) {
      return NextResponse.json({ error: "Missing plan." }, { status: 400 });
    }
    const planExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    return NextResponse.json({ success: true, plan, planExpiresAt, userId: authUser.uid });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
