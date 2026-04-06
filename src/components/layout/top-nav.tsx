"use client";

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
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    document.cookie = "__session=; path=/; max-age=0";
    router.push("/login");
  }

  const displayName = profile?.username || user?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
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
  );
}
