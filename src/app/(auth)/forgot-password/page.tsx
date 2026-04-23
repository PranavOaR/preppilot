"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(msg.includes("user-not-found") ? "No account found with that email." : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
            Reset Password
          </h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
              Reset link sent! Check your inbox (and spam folder).
            </div>
            <Link href="/login" className="text-primary-brand text-sm hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-error-container/20 border border-error/30 rounded-lg px-4 py-3 text-error text-sm">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-center text-on-surface-variant text-sm">
              <Link href="/login" className="text-primary-brand hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
