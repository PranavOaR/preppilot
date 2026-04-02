import { getUserProgress, getOverallStats } from "@/lib/db/progress";

export async function GET(request: Request) {
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
