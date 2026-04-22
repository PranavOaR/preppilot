"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

const COMPANIES = [
  "TCS", "Infosys", "Wipro", "Zoho", "Flipkart",
  "Amazon India", "Google India", "Microsoft India",
  "Cognizant", "Accenture", "HCL", "Tech Mahindra",
];

const STEPS = ["Pick Your Target", "Solve Your First Problem", "Your Roadmap"];

export function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(profile?.targetCompany || "");
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        onboardingCompleted: true,
        ...(company && !profile?.targetCompany ? { targetCompany: company } : {}),
      });
      await refreshProfile();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl subtle-border w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-surface-container-high">
          <div
            className="h-1 gradient-primary transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < step ? "bg-green-500 text-white"
                  : i === step ? "gradient-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {i < step ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 w-8 ${i < step ? "bg-green-500" : "bg-surface-container-high"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Company selection */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl text-on-surface font-medium">
                  Welcome to PrepPilot! 👋
                </h2>
                <p className="text-on-surface-variant text-sm mt-2">
                  Which company are you preparing for? We&apos;ll personalise your roadmap and daily challenges.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {COMPANIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCompany(c)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors text-center ${
                      company === c
                        ? "gradient-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!company}
                className="w-full py-3 rounded-xl gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Continue →
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full text-on-surface-variant text-xs hover:text-on-surface transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 1: First problem */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl text-on-surface font-medium">
                  Solve your first problem
                </h2>
                <p className="text-on-surface-variant text-sm mt-2">
                  Start with an easy warm-up problem to get comfortable with the editor.
                </p>
              </div>

              <Link
                href="/practice/two-sum"
                onClick={() => setStep(2)}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors subtle-border group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-brand text-[20px]">code</span>
                </div>
                <div className="flex-1">
                  <p className="text-on-surface font-medium text-sm">Two Sum</p>
                  <p className="text-green-400 text-xs mt-0.5">Easy · 10 XP · Arrays</p>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary-brand text-[18px] transition-colors">
                  arrow_forward
                </span>
              </Link>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Skip this step →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Roadmap ready */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-on-primary text-3xl">map</span>
                </div>
                <h2 className="font-serif text-2xl text-on-surface font-medium">
                  Your roadmap is ready!
                </h2>
                <p className="text-on-surface-variant text-sm mt-2">
                  {company
                    ? `We've built a personalised study plan focused on ${company}'s interview patterns.`
                    : "We've built a study plan covering all the topics you need to ace technical interviews."}
                </p>
              </div>

              <div className="rounded-xl bg-surface-container p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-brand text-[18px]">check_circle</span>
                  <span className="text-on-surface text-sm">Personalised topic prioritisation</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-brand text-[18px]">check_circle</span>
                  <span className="text-on-surface text-sm">Daily challenges to build consistency</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-brand text-[18px]">check_circle</span>
                  <span className="text-on-surface text-sm">AI hints when you get stuck</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => { await handleComplete(); router.push("/roadmap"); }}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl gradient-primary text-on-primary text-sm font-medium text-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  View My Roadmap →
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface text-sm hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Go to Dashboard"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
