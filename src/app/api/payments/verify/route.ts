import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import type { PlanTier } from "@/lib/types/plans";

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId, signature, plan } = (await req.json()) as {
      orderId: string;
      paymentId: string;
      signature: string;
      plan: Exclude<PlanTier, "free">;
    };

    if (!orderId || !paymentId || !signature || !plan) {
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

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // Signature valid — return plan + expiry for the client to write to Firestore
    const planExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    return NextResponse.json({ success: true, plan, planExpiresAt });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
