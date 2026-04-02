"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocialButton } from "./social-button";
import { useAuth } from "@/contexts/auth-context";
import { createUserProfile } from "@/lib/firebase/auth";

const companies = [
  "TCS",
  "Infosys",
  "Wipro",
  "HCL Technologies",
  "Cognizant",
  "Accenture",
  "Tech Mahindra",
  "Capgemini",
  "Mindtree",
  "Mphasis",
  "Zoho",
  "Flipkart",
  "Paytm",
  "Razorpay",
  "PhonePe",
  "Swiggy",
  "Zomato",
  "CRED",
  "Ola",
  "Other",
];

const languages = [
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    targetCompany: "",
    preferredLanguage: "python" as "python" | "c" | "cpp" | "java",
    university: "",
    year: 1,
    semester: 1,
  });

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const user = await signUp(form.email, form.password);

      await createUserProfile(user.uid, {
        username: form.username,
        email: form.email,
        displayName: form.username,
        avatarUrl: null,
        targetCompany: form.targetCompany,
        preferredLanguage: form.preferredLanguage,
        university: form.university,
        year: form.year,
        semester: form.semester,
      });

      document.cookie = "__session=1; path=/; max-age=2592000";
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      if (message.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      document.cookie = "__session=1; path=/; max-age=2592000";
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign in failed";
      if (!message.includes("popup-closed")) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 max-h-[90vh] overflow-y-auto pr-2">
      <div>
        <h2 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Join the Atelier
        </h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Set up your profile to begin your technical journey.
        </p>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/30 rounded-lg px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* Social Sign Up */}
      <div className="flex gap-3">
        <SocialButton provider="google" onClick={handleGoogleSignIn} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant/20" />
        <span className="text-outline text-xs uppercase tracking-widest">
          or email
        </span>
        <div className="flex-1 h-px bg-outline-variant/20" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Username */}
        <div className="space-y-1.5">
          <Label className="text-on-surface-variant text-sm">Username</Label>
          <Input
            type="text"
            placeholder="johndoe"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            required
            className="h-10 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-on-surface-variant text-sm">Email</Label>
          <Input
            type="email"
            placeholder="you@university.edu"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            className="h-10 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
          />
        </div>

        {/* Password Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-on-surface-variant text-sm">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
              className="h-10 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-on-surface-variant text-sm">Confirm</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              required
              className="h-10 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
            />
          </div>
        </div>

        {/* University */}
        <div className="space-y-1.5">
          <Label className="text-on-surface-variant text-sm">University</Label>
          <Input
            type="text"
            placeholder="VIT, SRM, BITS..."
            value={form.university}
            onChange={(e) => updateField("university", e.target.value)}
            className="h-10 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
          />
        </div>

        {/* Year & Semester */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-on-surface-variant text-sm">Year</Label>
            <select
              value={form.year}
              onChange={(e) => updateField("year", parseInt(e.target.value))}
              className="w-full h-10 rounded-md bg-surface-container-highest text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-on-surface-variant text-sm">Semester</Label>
            <select
              value={form.semester}
              onChange={(e) => updateField("semester", parseInt(e.target.value))}
              className="w-full h-10 rounded-md bg-surface-container-highest text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Company */}
        <div className="space-y-1.5">
          <Label className="text-on-surface-variant text-sm">Target Company</Label>
          <select
            value={form.targetCompany}
            onChange={(e) => updateField("targetCompany", e.target.value)}
            className="w-full h-10 rounded-md bg-surface-container-highest text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
          >
            <option value="">Select a company</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Language */}
        <div className="space-y-1.5">
          <Label className="text-on-surface-variant text-sm">Preferred Language</Label>
          <select
            value={form.preferredLanguage}
            onChange={(e) => updateField("preferredLanguage", e.target.value)}
            className="w-full h-10 rounded-md bg-surface-container-highest text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-sm">
        Already have an account?{" "}
        <a href="/login" className="text-primary-brand hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
