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
    return NextResponse.json({ globalRank: null, totalUsers: null, collegeRank: null, collegeUsers: null, percentile: null });
  }

  const snapshot = await db.collection("users").select("xp", "university").get();
  const users = snapshot.docs.map((d) => ({
    uid: d.id,
    xp: (d.data().xp as number) || 0,
    university: ((d.data().university as string) || "").trim().toLowerCase(),
  }));

  users.sort((a, b) => b.xp - a.xp);
  const totalUsers = users.length;
  const myIndex = users.findIndex((u) => u.uid === authUser.uid);
  const globalRank = myIndex >= 0 ? myIndex + 1 : null;

  const myUser = users[myIndex];
  const myXp = myUser?.xp ?? 0;
  const belowCount = users.filter((u) => u.xp < myXp).length;
  const percentile = totalUsers > 1 ? Math.round((belowCount / (totalUsers - 1)) * 100) : 100;

  const university = myUser?.university || "";
  let collegeRank: number | null = null;
  let collegeUsers: number | null = null;
  if (university) {
    const sameCollege = users.filter((u) => u.university === university);
    collegeUsers = sameCollege.length;
    const cIdx = sameCollege.findIndex((u) => u.uid === authUser.uid);
    collegeRank = cIdx >= 0 ? cIdx + 1 : null;
  }

  return NextResponse.json({ globalRank, totalUsers, collegeRank, collegeUsers, percentile });
}
