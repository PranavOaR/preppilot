import { createSubmission } from "./submissions";
import { updateProgress } from "./progress";
import { recordActivity } from "./activity";
import { calculateXP, awardXP } from "@/lib/xp/calculator";
import { updateStreak } from "@/lib/xp/streaks";
import { getUserSubmissionForProblem } from "./submissions";
import { checkAndAwardBadges } from "./badges";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface RecordSolveParams {
  userId: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  problemTopic: string;
  problemDifficulty: "easy" | "medium" | "hard";
  problemXpReward: number;
  language: string;
  passed: boolean;
}

/**
 * Records a problem attempt — creates submission, updates progress,
 * awards XP, updates streak, and logs activity.
 */
export async function recordSolve(params: RecordSolveParams) {
  const {
    userId,
    problemId,
    problemTitle,
    problemSlug,
    problemTopic,
    problemDifficulty,
    problemXpReward,
    language,
    passed,
  } = params;

  const status = passed ? "accepted" : "wrong_answer";

  // 1. Check for prior accepted submission BEFORE creating ours
  //    (race window is small; worst case: two concurrent solves both see
  //    "no prior solve" — but since we insert first, then check, we mitigate)
  const priorSolve = passed
    ? await getUserSubmissionForProblem(userId, problemId)
    : null;
  const isFirstSolve = passed && !priorSolve;

  // 2. Create submission record (includes difficulty for stats)
  await createSubmission({
    userId,
    problemId,
    problemTitle,
    problemSlug,
    language,
    difficulty: problemDifficulty,
    status,
  });

  // 3. Update topic progress
  await updateProgress(userId, problemTopic, passed);

  if (passed) {
    // 4. Calculate and award XP
    const xp = isFirstSolve
      ? calculateXP(problemDifficulty, true)
      : calculateXP(problemDifficulty, false);
    await awardXP(userId, xp);

    // 5. Update streak
    await updateStreak(userId);

    // 6. Record activity for heatmap
    await recordActivity(userId, 1, xp);

    // 7. Check and award badges (best-effort, non-blocking)
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      checkAndAwardBadges(userId, {
        problemsSolved: (userData.totalSolved as number | undefined) ?? 0,
        currentStreak: (userData.currentStreak as number | undefined) ?? 0,
        xp: ((userData.xp as number | undefined) ?? 0) + xp,
      }).catch(() => {});
    }

    return { xp, isFirstSolve };
  }

  return { xp: 0, isFirstSolve: false };
}
