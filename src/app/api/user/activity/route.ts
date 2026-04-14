import { getActivityLog } from "@/lib/db/activity";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

export async function GET(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const daysParam = searchParams.get("days");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const days = Math.min(Math.max(parseInt(daysParam || "365", 10) || 365, 1), 365);

  try {
    const activity = await getActivityLog(userId, days);
    return Response.json({ activity });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return Response.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
