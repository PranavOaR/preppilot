"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useAuth } from "@/contexts/auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <>
        <TopNav />
        <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </>
    );
  }

  if (profile?.role !== "admin") {
    return null;
  }

  return (
    <>
      <TopNav />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-h-[calc(100vh-57px)] pb-20 md:pb-0">{children}</main>
      </div>
    </>
  );
}
