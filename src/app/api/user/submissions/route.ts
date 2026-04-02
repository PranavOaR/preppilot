import { getUserSubmissions } from "@/lib/db/submissions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const limitParam = searchParams.get("limit");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  try {
    const submissions = await getUserSubmissions(userId, limit);
    return Response.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return Response.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
