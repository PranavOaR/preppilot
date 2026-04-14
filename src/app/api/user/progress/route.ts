import { getUserProgress, getOverallStats } from "@/lib/db/progress";
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
    const [topicProgress, overallStats] = await Promise.all([
      getUserProgress(userId),
      getOverallStats(userId),
    ]);

    return Response.json({ topicProgress, overallStats });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return Response.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
