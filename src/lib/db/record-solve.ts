import { createSubmission } from "./submissions";
import { updateProgress } from "./progress";
import { recordActivity } from "./activity";
import { calculateXP, awardXP } from "@/lib/xp/calculator";
import { updateStreak } from "@/lib/xp/streaks";
import { getUserSubmissionForProblem } from "./submissions";

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

  // Check if this is a first solve
  const existingSolve = passed
    ? await getUserSubmissionForProblem(userId, problemId)
    : null;
  const isFirstSolve = passed && !existingSolve;

  // 1. Create submission record
  await createSubmission({
    userId,
    problemId,
    problemTitle,
    problemSlug,
    language,
    status,
  });

  // 2. Update topic progress
  await updateProgress(userId, problemTopic, passed);

  if (passed) {
    // 3. Calculate and award XP
    const xp = isFirstSolve
      ? calculateXP(problemDifficulty, true)
      : calculateXP(problemDifficulty, false);
    await awardXP(userId, xp);

    // 4. Update streak
    await updateStreak(userId);

    // 5. Record activity for heatmap
    await recordActivity(userId, 1, xp);

    return { xp, isFirstSolve };
  }

  return { xp: 0, isFirstSolve: false };
}
