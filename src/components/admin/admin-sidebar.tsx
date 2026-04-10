"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", icon: "dashboard", label: "Dashboard", exact: true },
  { href: "/admin/problems", icon: "code", label: "Problems", exact: false },
  { href: "/admin/contests", icon: "emoji_events", label: "Contests", exact: false },
  { href: "/admin/users", icon: "group", label: "Users", exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-outline-variant/10 bg-surface-container-lowest min-h-[calc(100vh-57px)]">
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Admin Panel
            </h2>
          </div>
          {adminLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary-container/15 text-primary-brand font-medium"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 mt-4 border-t border-outline-variant/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
            Back to App
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant/10 flex items-center">
        {adminLinks.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                active ? "text-primary-brand" : "text-on-surface-variant"
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${active ? "text-primary-brand" : ""}`}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/dashboard"
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          App
        </Link>
      </nav>
    </>
  );
}
