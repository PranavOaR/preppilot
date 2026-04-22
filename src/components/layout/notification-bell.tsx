"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/db/notifications";

const TYPE_ICON: Record<string, string> = {
  badge_earned:      "workspace_premium",
  contest_starting:  "alarm",
  contest_ended:     "emoji_events",
  streak_milestone:  "local_fire_department",
  rank_change:       "trending_up",
  system:            "info",
};

function formatTime(ts: AppNotification["createdAt"]): string {
  if (!ts) return "";
  const date = new Date(ts.seconds * 1000);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return unsub;
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleOpen() {
    setOpen((prev) => !prev);
  }

  async function handleMarkRead(id: string) {
    if (!user) return;
    await markNotificationRead(user.uid, id);
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-brand text-on-primary text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-xl bg-surface-container-low subtle-border shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
            <h3 className="text-on-surface text-sm font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-primary-brand text-xs hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-outline text-[32px] block mb-2">
                  notifications_none
                </span>
                <p className="text-on-surface-variant text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      !n.read ? "bg-primary-container/5" : ""
                    } hover:bg-surface-container cursor-pointer`}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.read ? "bg-primary-container/20 text-primary-brand" : "bg-surface-container text-outline"
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {TYPE_ICON[n.type] || "info"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                        {n.title}
                      </p>
                      <p className="text-on-surface-variant text-xs mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-outline text-[10px] mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-brand shrink-0 mt-2" />
                    )}
                  </div>
                );

                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
