import { NextRequest, NextResponse } from "next/server";
import { generateCodeReview } from "@/lib/groq/client";
import { buildCodeReviewPrompt } from "@/lib/groq/prompts";
import { getProblemById } from "@/lib/db/problems";
import { checkAndIncrementUsage } from "@/lib/plans/usage";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { problemId, userId, code, language, passed } = await req.json();

    if (!problemId || !userId || !code || !language) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const cacheKey = `${problemId}_${userId}_${language}`;
    const cacheRef = doc(db, "codeReviews", cacheKey);

    // Check cache — cached reviews are free and don't count against quota
    const cached = await getDoc(cacheRef);
    if (cached.exists()) {
      const data = cached.data();
      return NextResponse.json({
        timeComplexity: data.timeComplexity,
        spaceComplexity: data.spaceComplexity,
        qualityNotes: data.qualityNotes,
        alternativeApproach: data.alternativeApproach,
        cached: true,
      });
    }

    // Check plan-based code review quota (only for new reviews)
    const reviewCheck = await checkAndIncrementUsage(userId, "codeReview");
    if (!reviewCheck.allowed) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `Code review is not available on the ${reviewCheck.plan} plan. Upgrade to Pro or Premium to unlock AI code reviews.`,
          plan: reviewCheck.plan,
          limit: reviewCheck.limit,
        },
        { status: 429 }
      );
    }

    // Fetch problem
    const problem = await getProblemById(problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    // Generate review
    const prompt = buildCodeReviewPrompt(problem, code, language, passed);
    const raw = await generateCodeReview(prompt);

    // Parse JSON from Groq response
    let review: {
      timeComplexity: string;
      spaceComplexity: string;
      qualityNotes: string;
      alternativeApproach: string;
    };

    try {
      review = JSON.parse(raw);
    } catch {
      // If Groq didn't return valid JSON, wrap the raw text
      review = {
        timeComplexity: "—",
        spaceComplexity: "—",
        qualityNotes: raw,
        alternativeApproach: "—",
      };
    }

    // Cache in Firestore
    await setDoc(cacheRef, {
      problemId,
      userId,
      language,
      ...review,
      generatedAt: serverTimestamp(),
    });

    return NextResponse.json({ ...review, cached: false });
  } catch (err) {
    console.error("Code review error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const userMsg = msg.includes("GROQ_API_KEY")
      ? "AI code review is not configured. Add GROQ_API_KEY to .env.local."
      : "Failed to generate code review. Please try again.";
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
