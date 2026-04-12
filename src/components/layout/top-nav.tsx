"use client";

import { useState, useEffect, useRef } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  // Read dismissal from sessionStorage on mount
  useEffect(() => {
    setExpiryBannerDismissed(!!sessionStorage.getItem("planExpiryBannerDismissed"));
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    setLogoutConfirmOpen(false);
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
    <div id="top-nav">
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
                  className={`flex items-center gap-2 px-3 py-2 text-sm transition-all duration-150 ${
                    isActive
                      ? "border-b-2 border-primary-brand text-on-surface"
                      : "rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
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
              className={`hidden md:block p-2 transition-all duration-150 cursor-pointer ${
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
            className="hidden md:block p-2 text-outline hover:text-on-surface-variant transition-all duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
          </Link>

          {/* User Avatar & Sign Out — desktop */}
          <div className="hidden md:flex items-center gap-2">
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
              onClick={() => setLogoutConfirmOpen(true)}
              className="p-2 text-outline hover:text-error transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
            </button>
          </div>

          {/* Mobile: avatar + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/profile" className="hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-medium">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  initial
                )}
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      </nav>
    </header>

    {/* Mobile Drawer Overlay */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-[200] bg-black/60 md:hidden" aria-hidden="true" />
    )}

    {/* Mobile Drawer */}
    <div
      ref={drawerRef}
      className={`fixed top-0 right-0 z-[201] h-full w-72 bg-surface shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col ${
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-medium shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-on-surface text-sm font-medium">{displayName}</p>
            <Link
              href="/pricing"
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider mt-0.5 ${planBadge.className}`}
            >
              {planBadge.label}
            </Link>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {mainLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-surface-container-high text-on-surface font-medium"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        <div className="h-px bg-outline-variant/10 my-2" />

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
              pathname.startsWith("/admin")
                ? "bg-surface-container-high text-primary-brand font-medium"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            Admin Panel
          </Link>
        )}

        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
            pathname === "/settings"
              ? "bg-surface-container-high text-on-surface font-medium"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          Settings
        </Link>
      </nav>

      {/* Sign Out */}
      <div className="px-3 pb-6 pt-2 border-t border-outline-variant/10">
        <button
          onClick={() => { setMobileMenuOpen(false); setLogoutConfirmOpen(true); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-error hover:bg-error/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
      </div>
    </div>

    {/* Logout Confirmation Dialog */}
    {logoutConfirmOpen && (
      <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl subtle-border w-full max-w-sm p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error text-[20px]">logout</span>
            </div>
            <div>
              <h3 className="text-on-surface font-medium">Sign out?</h3>
              <p className="text-on-surface-variant text-sm">You&apos;ll need to sign in again to access your account.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLogoutConfirmOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 py-2.5 rounded-xl bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
