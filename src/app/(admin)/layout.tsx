import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyIdToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";
import { TopNav } from "@/components/layout/top-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) redirect("/login");

  const auth = await verifyIdToken(session);
  if (!auth) redirect("/login");

  // Verify admin role via Admin SDK before rendering any admin content.
  // Fail closed: if Admin SDK is absent or Firestore is unreachable, deny access.
  const db = getAdminDb();
  if (!db) redirect("/dashboard");

  try {
    const userSnap = await db.collection("users").doc(auth.uid).get();
    if (!userSnap.exists || userSnap.data()?.role !== "admin") {
      redirect("/dashboard");
    }
  } catch (err) {
    console.error("Admin role check failed:", err);
    redirect("/dashboard");
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
