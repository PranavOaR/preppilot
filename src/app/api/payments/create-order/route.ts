import { NextRequest, NextResponse } from "next/server";
import { PLAN_PRICES, INTERVIEW_ADDON_PRICE, type PlanTier } from "@/lib/types/plans";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

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

    const body = (await req.json()) as
      | { plan: Exclude<PlanTier, "free"> }
      | { type: "interview_addon" };

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment system not configured." },
        { status: 500 }
      );
    }

    let amountPaise: number;
    let receipt: string;

    if ("type" in body && body.type === "interview_addon") {
      amountPaise = INTERVIEW_ADDON_PRICE.paise;
      receipt = `preppilot_interview_${Date.now()}`;
    } else if ("plan" in body && body.plan && body.plan in PLAN_PRICES) {
      amountPaise = PLAN_PRICES[body.plan].paise;
      receipt = `preppilot_${body.plan}_${Date.now()}`;
    } else {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        payment_capture: 1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Razorpay order error:", res.status, errText);
      let razorpayMessage = "Failed to create payment order.";
      try {
        const errJson = JSON.parse(errText);
        razorpayMessage = errJson?.error?.description || errJson?.error?.reason || razorpayMessage;
      } catch {}
      return NextResponse.json(
        { error: razorpayMessage, razorpayStatus: res.status },
        { status: 502 }
      );
    }

    const order = await res.json();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
