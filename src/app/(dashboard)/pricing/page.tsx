"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { PLAN_LIMITS, PLAN_PRICES, type PlanTier } from "@/lib/types/plans";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const PLANS: {
  tier: PlanTier;
  name: string;
  tagline: string;
  badge?: string;
  cta: string;
  highlight: boolean;
}[] = [
  {
    tier: "free",
    name: "Free",
    tagline: "Start your preparation journey",
    cta: "Get Started Free",
    highlight: false,
  },
  {
    tier: "starter",
    name: "Starter",
    tagline: "Build consistency at the lowest price",
    cta: "Start Starter Plan",
    highlight: false,
  },
  {
    tier: "pro",
    name: "Pro",
    tagline: "The best balance of access and value",
    badge: "Most Popular",
    cta: "Choose Pro",
    highlight: true,
  },
  {
    tier: "premium",
    name: "Premium",
    tagline: "Full prep experience for serious users",
    badge: "Best for Placements",
    cta: "Go Premium",
    highlight: false,
  },
];

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

export default function PricingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<PlanTier | null>(null);

  const currentPlan = profile?.plan ?? "free";

  async function handleUpgrade(tier: Exclude<PlanTier, "free">) {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(tier);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Failed to load payment gateway. Please try again.", "error");
        return;
      }

      const idToken = await user.getIdToken();
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan: tier }),
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
        description: `${PLANS.find((p) => p.tier === tier)?.name} Plan — ${PLAN_PRICES[tier].label}`,
        order_id: orderId,
        prefill: {
          name: displayName,
          email: user.email,
        },
        theme: { color: "#6750A4" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // Step 1: verify signature server-side
            const verifyToken = await user.getIdToken();
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${verifyToken}`,
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan: tier,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}));
              console.error("Verify failed:", err);
              showToast("Payment verification failed. Contact support.", "error");
              return;
            }

            // Plan and payment record are written exclusively server-side.
            // The client never touches sensitive Firestore fields.
            await refreshProfile();
            showToast(`You're now on the ${PLANS.find((p) => p.tier === tier)?.name} plan!`, "success");
            router.push("/dashboard");
          } catch (err) {
            console.error("Post-payment error:", err);
            showToast("Payment went through but activation failed. Contact support.", "error");
          }
        },
      }).open();
    } catch (err) {
      console.error("Upgrade error:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-on-surface text-3xl font-semibold">Choose Your Plan</h1>
        <p className="text-on-surface-variant text-sm max-w-lg mx-auto">
          All plans include roadmap, profile, streak, XP, and unlimited aptitude practice. Upgrade for more DSA access, AI support, and interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(({ tier, name, tagline, badge, cta, highlight }) => {
          const limits = PLAN_LIMITS[tier];
          const price = tier !== "free" ? PLAN_PRICES[tier as Exclude<PlanTier, "free">] : null;
          const isCurrent = currentPlan === tier;

          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl p-6 space-y-5 subtle-border ${
                isCurrent
                  ? "ring-1 ring-primary-brand/40"
                  : ""
              } ${
                highlight
                  ? "bg-primary-container/10 border-primary-brand/40"
                  : "bg-surface-container-low"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-primary-brand border border-primary-brand/30 whitespace-nowrap">
                  Your current plan
                </span>
              )}
              {!isCurrent && badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold gradient-primary text-on-primary whitespace-nowrap">
                  {badge}
                </span>
              )}

              <div className="space-y-1">
                <h2 className="text-on-surface text-lg font-semibold">{name}</h2>
                <p className="text-on-surface-variant text-xs">{tagline}</p>
              </div>

              <div>
                {price ? (
                  <>
                    <span className="text-on-surface text-2xl font-bold">₹{price.inr}</span>
                    <span className="text-on-surface-variant text-sm">/year</span>
                    <p className="text-on-surface-variant text-xs">
                      ≈ ₹{Math.round(price.inr / 12)}/month
                    </p>
                  </>
                ) : (
                  <span className="text-on-surface text-2xl font-bold">₹0</span>
                )}
              </div>

              <ul className="space-y-2 text-sm flex-1">
                <Feature label={`DSA Runs: ${limits.dsaRuns}/month`} />
                <Feature label={`DSA Submits: ${limits.dsaSubmits}/month`} />
                <Feature label={`AI Hints: ${limits.aiHints}/month`} />
                <Feature
                  label={
                    limits.codeReviews === 0
                      ? "No AI Code Reviews"
                      : `AI Code Reviews: ${limits.codeReviews}/month`
                  }
                  dim={limits.codeReviews === 0}
                />
                <Feature
                  label={
                    limits.interviewsMonthly
                      ? `${limits.interviews} Interviews/month`
                      : `${limits.interviews} Lifetime Interview${limits.interviews > 1 ? "s" : ""}`
                  }
                />
                <Feature label="All Contests" />
                <Feature label="Aptitude Practice: Unlimited" />
              </ul>

              <button
                disabled={isCurrent || loading !== null}
                onClick={() => {
                  if (tier === "free") {
                    router.push("/dashboard");
                  } else {
                    handleUpgrade(tier as Exclude<PlanTier, "free">);
                  }
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-opacity ${
                  isCurrent
                    ? "bg-surface-container text-on-surface-variant cursor-default"
                    : highlight
                    ? "gradient-primary text-on-primary hover:opacity-90"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                } disabled:opacity-50`}
              >
                {isCurrent ? "Current Plan" : loading === tier ? "Loading..." : cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left py-3 text-on-surface-variant font-medium">Feature</th>
              {PLANS.map((p) => (
                <th key={p.tier} className="text-center py-3 text-on-surface font-medium">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            <TableRow label="DSA Runs/month" values={["25", "50", "150", "300"]} />
            <TableRow label="DSA Submits/month" values={["8", "12", "30", "75"]} />
            <TableRow label="AI Hints/month" values={["8", "12", "25", "50"]} />
            <TableRow label="AI Code Reviews/month" values={["—", "—", "1", "4"]} />
            <TableRow label="Interviews" values={["1 lifetime", "1 lifetime", "1 lifetime", "2/month"]} />
            <TableRow label="Aptitude Practice" values={["Unlimited", "Unlimited", "Unlimited", "Unlimited"]} />
            <TableRow label="Contests" values={["All", "All", "All", "All"]} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Feature({ label, dim = false }: { label: string; dim?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${dim ? "text-on-surface-variant" : "text-on-surface"}`}>
      <span className={`material-symbols-outlined text-[16px] ${dim ? "text-outline-variant" : "text-green-400"}`}>
        {dim ? "remove" : "check"}
      </span>
      {label}
    </li>
  );
}

function TableRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="py-2.5 text-on-surface-variant">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2.5 text-center text-on-surface">
          {v}
        </td>
      ))}
    </tr>
  );
}
