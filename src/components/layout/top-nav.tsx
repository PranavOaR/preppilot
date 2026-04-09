"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const mainLinks = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/roadmap", icon: "map", label: "Roadmap" },
  { href: "/practice", icon: "terminal", label: "Practice" },
  { href: "/leaderboard", icon: "emoji_events", label: "Contests" },
  { href: "/interview", icon: "record_voice_over", label: "Interview" },
  { href: "/mock-tests", icon: "quiz", label: "Mock Tests" },
  { href: "/pricing", icon: "upgrade", label: "Pricing" },
];

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free:    { label: "FREE",    className: "bg-surface-container text-on-surface-variant" },
  starter: { label: "STARTER", className: "bg-blue-500/15 text-blue-400" },
  pro:     { label: "PRO",     className: "bg-purple-500/15 text-purple-400" },
  premium: { label: "PREMIUM", className: "bg-amber-500/15 text-amber-400" },
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [expiryBannerDismissed, setExpiryBannerDismissed] = useState(false);

  // Read dismissal from sessionStorage on mount
  useEffect(() => {
    setExpiryBannerDismissed(!!sessionStorage.getItem("planExpiryBannerDismissed"));
  }, []);

  async function handleSignOut() {
    await signOut();
    document.cookie = "__session=; path=/; max-age=0";
    router.push("/login");
  }

  function dismissExpiryBanner() {
    sessionStorage.setItem("planExpiryBannerDismissed", "1");
    setExpiryBannerDismissed(true);
  }

  const displayName = profile?.username || user?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const plan = profile?.plan || "free";
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;

  // Plan expiry banner logic
  const planExpiresAt = profile?.planExpiresAt;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const showExpiringSoon =
    !expiryBannerDismissed &&
    plan !== "free" &&
    planExpiresAt !== undefined &&
    planExpiresAt > now &&
    planExpiresAt - now < sevenDays;
  const showExpired =
    !expiryBannerDismissed &&
    !showExpiringSoon &&
    planExpiresAt !== undefined &&
    planExpiresAt < now;
  const daysLeft = planExpiresAt
    ? Math.ceil((planExpiresAt - now) / (24 * 60 * 60 * 1000))
    : 0;

  return (
    <>
      {/* Plan Expiry Banner */}
      {(showExpiringSoon || showExpired) && (
        <div className="sticky top-0 z-[60] bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-2 flex items-center justify-between gap-4">
          <p className="text-yellow-400 text-sm">
            {showExpiringSoon
              ? `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`
              : "Your plan has expired. You're now on the Free tier."}{" "}
            <Link href="/pricing" className="underline hover:no-underline font-medium">
              {showExpiringSoon ? "Renew →" : "Upgrade →"}
            </Link>
          </p>
          <button
            onClick={dismissExpiryBanner}
            className="text-yellow-400/70 hover:text-yellow-400 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

    <header className="sticky top-0 z-50 glass-panel subtle-border border-t-0 border-x-0">
      <nav className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="font-serif text-xl text-on-surface font-medium">
              PrepPilot
            </span>
          </Link>

          {/* Main Nav */}
          <div className="hidden md:flex items-center gap-1">
            {mainLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-surface-container-high text-on-surface"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className={`p-2 transition-colors ${
                pathname.startsWith("/admin")
                  ? "text-primary-brand"
                  : "text-outline hover:text-on-surface-variant"
              }`}
              title="Admin Panel"
            >
              <span className="material-symbols-outlined text-[20px]">
                admin_panel_settings
              </span>
            </Link>
          )}

          <Link
            href="/settings"
            className="p-2 text-outline hover:text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
          </Link>

          {/* User Avatar & Sign Out */}
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider transition-opacity hover:opacity-80 ${planBadge.className}`}
              title="View pricing plans"
            >
              {planBadge.label}
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-medium">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <span className="text-on-surface text-sm hidden lg:inline">
                {displayName}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 text-outline hover:text-error transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
            </button>
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}
