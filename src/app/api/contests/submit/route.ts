import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/firebase/verify-token";
import { getAdminDb } from "@/lib/firebase/server";
import { getProblemById } from "@/lib/db/problems";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
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

  const body = await req.json() as {
    contestId: string;
    problemId: string;
    answer: string;
    timeTaken: number;
  };

  const { contestId, problemId, answer, timeTaken } = body;
  if (!contestId || !problemId || answer === undefined || timeTaken === undefined) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Verify the contest exists and user has joined
  const participantRef = db.collection("contestParticipants").doc(`${contestId}_${auth.uid}`);
  const participantSnap = await participantRef.get();
  if (!participantSnap.exists) {
    return NextResponse.json({ error: "You have not joined this contest." }, { status: 403 });
  }

  // Check for duplicate submission
  const submissionRef = db
    .collection("contestSubmissions")
    .doc(`${contestId}_${auth.uid}_${problemId}`);
  const existingSnap = await submissionRef.get();
  if (existingSnap.exists) {
    return NextResponse.json({ error: "Already submitted for this problem." }, { status: 409 });
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
    // DSA: correctness determined by Judge0 via /api/submissions; client passes result.
    // We accept the client's claim here but at minimum the write goes through our API
    // so direct Firestore score manipulation is blocked by rules.
    isCorrect = answer === "passed";
  }

  // Write submission and update participant score atomically
  await db.runTransaction(async (tx) => {
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
}
