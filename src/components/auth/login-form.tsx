"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocialButton } from "./social-button";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      document.cookie = "__session=1; path=/; max-age=2592000";
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      if (message.includes("invalid-credential") || message.includes("wrong-password") || message.includes("user-not-found")) {
        setError("Invalid email or password.");
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
    <div className="w-full max-w-sm space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Welcome Back
        </h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Resume your technical journey at the atelier.
        </p>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/30 rounded-lg px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Social Login */}
        <div className="flex gap-3">
          <SocialButton provider="google" onClick={handleGoogleSignIn} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-outline-variant/20" />
          <span className="text-outline text-xs uppercase tracking-widest">
            or email
          </span>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 bg-surface-container-highest border-0 text-on-surface placeholder:text-outline focus-visible:ring-1 focus-visible:ring-primary-brand/40 pr-16"
            />
            <a
              href="#"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-brand text-xs hover:underline"
            >
              Forgot?
            </a>
          </div>
        </div>

        {/* Remember Session */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            className="border-outline-variant data-[state=checked]:bg-primary-container data-[state=checked]:border-primary-container"
          />
          <Label
            htmlFor="remember"
            className="text-on-surface-variant text-sm cursor-pointer"
          >
            Remember session for 30 days
          </Label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In to Atelier"}
        </Button>
      </form>

      {/* Register Link */}
      <p className="text-center text-on-surface-variant text-sm">
        New to the workspace?{" "}
        <a href="/register" className="text-primary-brand hover:underline">
          Create an account
        </a>
      </p>
    </div>
  );
}
