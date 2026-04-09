import { NextResponse } from "next/server";

/**
 * Temporary debug endpoint — reveals masked env var values to confirm
 * Vercel has the correct Razorpay keys set.
 * DELETE THIS FILE after confirming env vars are correct.
 */
export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

  return NextResponse.json({
    keyId_present: keyId.length > 0,
    keyId_preview: keyId.length > 6 ? `${keyId.slice(0, 6)}...${keyId.slice(-4)}` : "(too short)",
    keySecret_present: keySecret.length > 0,
    keySecret_preview: keySecret.length > 6 ? `${keySecret.slice(0, 3)}...${keySecret.slice(-3)}` : "(too short)",
    keyId_length: keyId.length,
    keySecret_length: keySecret.length,
  });
}
