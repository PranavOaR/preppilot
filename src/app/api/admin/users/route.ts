import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";
import type { Firestore } from "firebase-admin/firestore";
import type { PlanTier } from "@/lib/types/plans";

type AdminAction =
  | { action: "updateRole"; targetUid: string; role: "user" | "admin" }
  | { action: "updatePlan"; targetUid: string; plan: PlanTier; expiresAt: number | null }
  | { action: "unflag"; targetUid: string }
  | { action: "resetInterviews"; targetUid: string };

async function isAdmin(uid: string, db: Firestore): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists && snap.data()?.role === "admin";
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const auth = await verifyIdToken(token);
  if (!auth) return NextResponse.json({ error: "Invalid token." }, { status: 401 });

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON." },
      { status: 503 }
    );
  }

  if (!(await isAdmin(auth.uid, db))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as AdminAction;

  switch (body.action) {
    case "updateRole": {
      if (body.targetUid === auth.uid) {
        return NextResponse.json({ error: "Cannot change your own role." }, { status: 400 });
      }
      await db.collection("users").doc(body.targetUid).update({ role: body.role });
      return NextResponse.json({ success: true });
    }

    case "updatePlan": {
      await db.collection("users").doc(body.targetUid).update({
        plan: body.plan,
        planExpiresAt: body.expiresAt,
      });
      return NextResponse.json({ success: true });
    }

    case "unflag": {
      await db.collection("users").doc(body.targetUid).update({ isUnethical: false });
      return NextResponse.json({ success: true });
    }

    case "resetInterviews": {
      await db.collection("users").doc(body.targetUid).update({
        "usageThisMonth.interviewsLifetime": 0,
        "usageThisMonth.interviewsThisMonth": 0,
      });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
