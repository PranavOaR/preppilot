"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { InterviewSetup } from "@/components/interview/interview-setup";
import { createInterviewSession } from "@/lib/db/interviews";
import { getUsage, checkAndIncrementUsage } from "@/lib/plans/usage";
import { INTERVIEW_ADDON_PRICE, type PlanTier, type PlanLimits, type MonthlyUsage } from "@/lib/types/plans";
import type { InterviewConfig } from "@/lib/types/interview";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type PageState = "loading" | "available" | "exhausted";

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [plan, setPlan] = useState<PlanTier>("free");
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [buyingInterview, setBuyingInterview] = useState(false);

  const checkQuota = useCallback(async () => {
    if (!user) return;
    setPageState("loading");
    const data = await getUsage(user.uid);
    setPlan(data.plan);
    setLimits(data.limits);
    setUsage(data.usage);
    setPurchasedCredits(data.purchasedInterviews);

    const used = data.limits.interviewsMonthly
      ? data.usage.interviewsThisMonth
      : data.usage.interviewsLifetime;
    const hasQuota = used < data.limits.interviews || data.purchasedInterviews > 0;
    setPageState(hasQuota ? "available" : "exhausted");
  }, [user]);

  useEffect(() => {
    checkQuota();
  }, [checkQuota]);

  async function handleStart(config: InterviewConfig) {
    if (!user) return;
    const check = await checkAndIncrementUsage(user.uid, "interview");
    if (!check.allowed) {
      setPageState("exhausted");
      showToast("Interview quota exhausted.", "error");
      return;
    }
    try {
      const sessionData: Parameters<typeof createInterviewSession>[0] = {
        userId: user.uid,
        type: config.type,
        targetCompany: config.targetCompany,
        durationMinutes: config.durationMinutes,
        mode: config.mode || "practice",
        questionsCompleted: 0,
        status: "in-progress",
        overallScore: null,
      };
      // Only include topics if defined — Firestore rejects undefined field values
      if (config.topics?.length) sessionData.topics = config.topics;

      const sessionId = await createInterviewSession(sessionData);
      router.push(`/interview/${sessionId}`);
    } catch (err) {
      console.error("Failed to create interview session:", err);
      showToast("Failed to start interview. Please try again.", "error");
    }
  }

  async function handleBuyInterview() {
    if (!user) return;
    setBuyingInterview(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Failed to load payment gateway. Please try again.", "error");
        return;
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "interview_addon" }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        showToast(err.error || "Failed to create order.", "error");
        return;
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();
      const displayName = profile?.username || user.displayName || user.email || "User";

      new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "PrepPilot",
        description: "1 Extra Mock Interview",
        order_id: orderId,
        prefill: { name: displayName, email: user.email },
        theme: { color: "#6750A4" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                type: "interview_addon",
              }),
            });

            if (!verifyRes.ok) {
              showToast("Payment verification failed. Contact support.", "error");
              return;
            }

            await Promise.all([
              updateDoc(doc(db, "users", user.uid), {
                purchasedInterviews: (purchasedCredits || 0) + 1,
                updatedAt: serverTimestamp(),
              }),
              setDoc(doc(db, "payments", response.razorpay_payment_id), {
                userId: user.uid,
                type: "interview_addon",
                amountInr: INTERVIEW_ADDON_PRICE.inr,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                paidAt: serverTimestamp(),
              }),
            ]);

            showToast("Interview credit added! Starting setup...", "success");
            await checkQuota();
          } catch (err) {
            console.error("Post-payment error:", err);
            showToast("Payment went through but activation failed. Contact support.", "error");
          }
        },
      }).open();
    } catch (err) {
      console.error("Buy interview error:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setBuyingInterview(false);
    }
  }

  if (!user || pageState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (pageState === "exhausted" && limits) {
    const isFree = plan === "free";
    const isMonthly = limits.interviewsMonthly;
    const interviewsUsed = isMonthly
      ? (usage?.interviewsThisMonth ?? 0)
      : (usage?.interviewsLifetime ?? 0);

    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-surface-container-low subtle-border p-8 sm:p-10 text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
              lock
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl text-on-surface font-medium">
              {isFree ? "Free Interview Used" : "Interview Limit Reached"}
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-md mx-auto">
              {isFree
                ? "You've used your 1 free lifetime interview. Buy an extra for ₹49, or upgrade your plan to unlock more."
                : isMonthly
                ? `You've used all ${limits.interviews} interviews this month on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. They reset on the 1st of next month, or buy an extra one now.`
                : `You've used your ${limits.interviews} lifetime interview${limits.interviews > 1 ? "s" : ""} on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. Upgrade your plan, or buy an extra interview below.`}
            </p>
          </div>

          {/* Usage pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
            {interviewsUsed} / {limits.interviews} {isMonthly ? "this month" : "lifetime"} used
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={handleBuyInterview}
              disabled={buyingInterview}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {buyingInterview ? "hourglass_empty" : "shopping_cart"}
              </span>
              {buyingInterview ? "Processing..." : `Buy 1 Interview — ₹${INTERVIEW_ADDON_PRICE.inr}`}
            </button>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors subtle-border"
            >
              <span className="material-symbols-outlined text-[18px]">upgrade</span>
              Upgrade Plan
            </Link>
          </div>

          {/* Plan comparison teaser for free users */}
          {isFree && (
            <div className="pt-4 border-t border-outline-variant/10 space-y-2">
              <p className="text-on-surface-variant text-xs">Or upgrade your plan for more interviews</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(["starter", "pro", "premium"] as const).map((t) => (
                  <div key={t} className="rounded-lg bg-surface-container px-3 py-2.5 text-center">
                    <p className="text-on-surface font-medium capitalize">{t}</p>
                    <p className="text-on-surface-variant mt-0.5">
                      {t === "premium" ? "2/month" : "1 lifetime"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/interview"
              className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Back to Interviews
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <InterviewSetup
        onStart={handleStart}
        defaultCompany={profile?.targetCompany}
      />
    </main>
  );
}
