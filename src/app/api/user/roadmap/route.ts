import { getUserProgress } from "@/lib/db/progress";
import { getProblems } from "@/lib/db/problems";
import { getUser } from "@/lib/db/users";
import { generateRoadmap } from "@/lib/roadmap/engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const [userProfile, topicProgress, allProblemsResult] = await Promise.all([
      getUser(userId),
      getUserProgress(userId),
      getProblems({ pageSize: 200 }),
    ]);

    // Build progress map from Firestore data
    const progressMap: Record<string, { solved: number; attempted: number }> = {};
    for (const p of topicProgress) {
      const data = p as unknown as { topic: string; problemsSolved?: number; problemsAttempted?: number };
      if (data.topic) {
        progressMap[data.topic] = {
          solved: data.problemsSolved || 0,
          attempted: data.problemsAttempted || 0,
        };
      }
    }

    // Build problem count map
    const problemCountMap: Record<string, number> = {};
    for (const problem of allProblemsResult.problems) {
      const topic = problem.topic;
      problemCountMap[topic] = (problemCountMap[topic] || 0) + 1;
    }

    const targetCompany = userProfile?.targetCompany || "General";
    const roadmap = generateRoadmap(targetCompany, progressMap, problemCountMap);

    return Response.json(roadmap);
  } catch (error) {
    console.error("Error generating roadmap:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to generate roadmap", details: message }, { status: 500 });
  }
}
