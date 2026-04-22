import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const authUser = await verifyIdToken(token);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Leaderboard unavailable." }, { status: 503 });
  }

  // Only fetch fields needed — avoids sending email/plan/role to clients
  const snapshot = await db.collection("users").select("username", "university", "xp", "currentStreak").get();

  const collegeMap = new Map<string, { totalXp: number; count: number; displayName: string }>();
  const individuals: { uid: string; username: string; university: string; xp: number; streak: number }[] = [];

  snapshot.docs.forEach((d) => {
    const data = d.data();
    const university = (data.university as string)?.trim() || "";
    const normalizedUni = university.toLowerCase();
    const xp = (data.xp as number) || 0;

    if (data.username) {
      individuals.push({
        uid: d.id,
        username: data.username as string,
        university,
        xp,
        streak: (data.currentStreak as number) || 0,
      });
    }

    if (!university || !normalizedUni) return;
    const existing = collegeMap.get(normalizedUni) || { totalXp: 0, count: 0, displayName: university };
    existing.totalXp += xp;
    existing.count += 1;
    collegeMap.set(normalizedUni, existing);
  });

  const colleges = Array.from(collegeMap.entries())
    .map(([, { totalXp, count, displayName }]) => ({
      university: displayName,
      totalXp,
      userCount: count,
      avgXp: Math.round(totalXp / count),
    }))
    .sort((a, b) => b.totalXp - a.totalXp);

  individuals.sort((a, b) => b.xp - a.xp);

  return NextResponse.json({ colleges, individuals });
}
