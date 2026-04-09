import { NextRequest, NextResponse } from "next/server";
import { PLAN_PRICES, type PlanTier } from "@/lib/types/plans";

export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan: Exclude<PlanTier, "free"> };

    if (!plan || !(plan in PLAN_PRICES)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment system not configured." },
        { status: 500 }
      );
    }

    const { paise } = PLAN_PRICES[plan];
    const receipt = `prepilot_${plan}_${Date.now()}`;

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: paise,
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
