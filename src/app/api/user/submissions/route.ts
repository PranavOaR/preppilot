import { getUserSubmissions } from "@/lib/db/submissions";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";

export async function GET(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await verifyIdToken(token);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const limitParam = searchParams.get("limit");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);

  try {
    const submissions = await getUserSubmissions(userId, limit);
    return Response.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return Response.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
