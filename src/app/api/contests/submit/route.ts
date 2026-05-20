import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";
import { getProblemById } from "@/lib/db/problems";
import { FieldValue } from "firebase-admin/firestore";

const MAX_CONTEST_DURATION_SECONDS = 24 * 60 * 60; // 24 hours upper bound

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const auth = await verifyIdToken(token);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Server not configured." }, { status: 503 });
    }

    let body: { contestId: string; problemId: string; answer: string; timeTaken: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { contestId, problemId, answer, timeTaken } = body;

    if (!contestId || typeof contestId !== "string") {
      return NextResponse.json({ error: "Missing or invalid contestId." }, { status: 400 });
    }
    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json({ error: "Missing or invalid problemId." }, { status: 400 });
    }
    if (answer === undefined || answer === null || typeof answer !== "string") {
      return NextResponse.json({ error: "Missing or invalid answer." }, { status: 400 });
    }
    if (
      typeof timeTaken !== "number" ||
      !Number.isFinite(timeTaken) ||
      timeTaken < 0 ||
      timeTaken > MAX_CONTEST_DURATION_SECONDS
    ) {
      return NextResponse.json({ error: "Invalid timeTaken value." }, { status: 400 });
    }

    // Verify the contest is currently active
    const contestSnap = await db.collection("contests").doc(contestId).get();
    if (!contestSnap.exists) {
      return NextResponse.json({ error: "Contest not found." }, { status: 404 });
    }
    const contestData = contestSnap.data()!;
    const now = Date.now();
    const startMs: number = contestData.startTime?.toMillis?.() ?? 0;
    const endMs: number = contestData.endTime?.toMillis?.() ?? 0;
    if (now < startMs || now > endMs) {
      return NextResponse.json({ error: "Contest is not currently active." }, { status: 403 });
    }

    // Verify the user has joined this contest
    const participantRef = db.collection("contestParticipants").doc(`${contestId}_${auth.uid}`);
    const participantSnap = await participantRef.get();
    if (!participantSnap.exists) {
      return NextResponse.json({ error: "You have not joined this contest." }, { status: 403 });
    }

    // Fetch problem server-side and validate answer
    const problem = await getProblemById(problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    let isCorrect = false;
    if (problem.type === "aptitude") {
      // Validate answer server-side — client cannot forge correctness
      isCorrect = answer === problem.correctAnswer;
    } else {
      // DSA: Judge0 verdict is not re-run here; the client reports the outcome.
      // Direct Firestore writes are blocked by rules, so cheating requires calling
      // this API. This is a known limitation — DSA contest scoring is not fully
      // server-verified. See CLAUDE.md Known Issues.
      console.warn("[contest-submit] Trusting client DSA result for problem", problemId, "user", auth.uid);
      isCorrect = answer === "passed";
    }

    const submissionRef = db
      .collection("contestSubmissions")
      .doc(`${contestId}_${auth.uid}_${problemId}`);

    // Write submission and update participant score atomically.
    // The duplicate-submission guard is inside the transaction so concurrent
    // requests for the same (contestId, userId, problemId) cannot both succeed.
    await db.runTransaction(async (tx) => {
      const existingSnap = await tx.get(submissionRef);
      if (existingSnap.exists) {
        // Signal duplicate via a sentinel — caught below and returned as 409
        throw Object.assign(new Error("duplicate"), { code: "duplicate" });
      }

      tx.set(submissionRef, {
        contestId,
        userId: auth.uid,
        problemId,
        answer,
        isCorrect,
        timeTakenSeconds: timeTaken,
        submittedAt: FieldValue.serverTimestamp(),
      });

      const participantUpdate: Record<string, unknown> = {
        totalTime: FieldValue.increment(timeTaken),
      };
      if (isCorrect) {
        participantUpdate.score = FieldValue.increment(1);
      }
      tx.update(participantRef, participantUpdate);
    });

    return NextResponse.json({ isCorrect, timeTaken });
  } catch (err) {
    if (err instanceof Error && (err as Error & { code?: string }).code === "duplicate") {
      return NextResponse.json({ error: "Already submitted for this problem." }, { status: 409 });
    }
    console.error("[contest-submit] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
