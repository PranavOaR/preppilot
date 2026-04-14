import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

export async function GET(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const data = userSnap.data();

    // Only the owner gets the full profile; other callers get public fields only
    if (userId !== auth.uid) {
      return Response.json({
        id: userSnap.id,
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        university: data.university,
        xp: data.xp,
        currentStreak: data.currentStreak,
      });
    }

    return Response.json({ id: userSnap.id, ...data });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = auth.uid;

  try {
    const body = await request.json();
    const userRef = doc(db, "users", userId);

    const allowedFields = [
      "displayName",
      "avatarUrl",
      "targetCompany",
      "preferredLanguage",
      "university",
      "year",
      "semester",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updatedAt = serverTimestamp();

    await setDoc(userRef, updates, { merge: true });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
