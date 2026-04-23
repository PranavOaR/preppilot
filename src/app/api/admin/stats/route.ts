import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";
import type { PlanTier } from "@/lib/types/plans";

export interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalContests: number;
  totalSubmissions: number;
  flaggedUsers: number;
  planCounts: Record<PlanTier, number>;
  totalRevenueInr: number;
  paymentsThisMonth: number;
  recentSubmissions: {
    id: string;
    userId: string;
    problemTitle: string;
    problemSlug: string;
    status: string;
    language: string;
    submittedAt: number | null;
  }[];
  users: {
    id: string;
    username: string;
    email: string;
    university: string;
    xp: number;
    plan: PlanTier;
    isUnethical?: boolean;
    role: string;
  }[];
}

export async function GET(req: NextRequest) {
  // Verify identity
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const authUser = await verifyIdToken(token);
  if (!authUser) return NextResponse.json({ error: "Invalid token." }, { status: 401 });

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Admin SDK not configured." }, { status: 503 });
  }

  // Verify admin role server-side before returning any data
  const callerSnap = await db.collection("users").doc(authUser.uid).get();
  if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const thisMonth = new Date().toISOString().slice(0, 7);

  const [problemsSnap, contestsSnap, submissionsSnap, paymentsSnap, usersSnap] =
    await Promise.all([
      db.collection("problems").count().get(),
      db.collection("contests").count().get(),
      db.collection("submissions").orderBy("submittedAt", "desc").limit(10).get(),
      db.collection("payments").get(),
      db.collection("users").get(),
    ]);

  const planCounts: Record<PlanTier, number> = { free: 0, starter: 0, pro: 0, premium: 0 };
  let flaggedUsers = 0;
  const users = usersSnap.docs.map((d) => {
    const data = d.data();
    const plan = (data.plan || "free") as PlanTier;
    planCounts[plan] = (planCounts[plan] || 0) + 1;
    if (data.isUnethical) flaggedUsers++;
    return {
      id: d.id,
      username: (data.username as string) || "",
      email: (data.email as string) || "",
      university: (data.university as string) || "",
      xp: (data.xp as number) || 0,
      plan,
      isUnethical: (data.isUnethical as boolean) || false,
      role: (data.role as string) || "user",
    };
  });

  let totalRevenueInr = 0;
  let paymentsThisMonth = 0;
  for (const p of paymentsSnap.docs) {
    const d = p.data();
    totalRevenueInr += (d.amountInr as number) || 0;
    const paidAt = d.paidAt?.toDate?.()?.toISOString?.()?.slice(0, 7);
    if (paidAt === thisMonth) paymentsThisMonth++;
  }

  const recentSubmissions = submissionsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: (data.userId as string) || "",
      problemTitle: (data.problemTitle as string) || "",
      problemSlug: (data.problemSlug as string) || "",
      status: (data.status as string) || "",
      language: (data.language as string) || "",
      submittedAt: (data.submittedAt?.seconds as number) ?? null,
    };
  });

  const stats: AdminStats = {
    totalUsers: usersSnap.size,
    totalProblems: problemsSnap.data().count,
    totalContests: contestsSnap.data().count,
    totalSubmissions: recentSubmissions.length, // full count would need separate query
    flaggedUsers,
    planCounts,
    totalRevenueInr,
    paymentsThisMonth,
    recentSubmissions,
    users,
  };

  return NextResponse.json(stats);
}
