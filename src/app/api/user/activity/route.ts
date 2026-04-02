import { getActivityLog } from "@/lib/db/activity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const daysParam = searchParams.get("days");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const days = daysParam ? parseInt(daysParam, 10) : 365;

  try {
    const activity = await getActivityLog(userId, days);
    return Response.json({ activity });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return Response.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
