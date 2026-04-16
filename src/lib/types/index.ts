import type { Timestamp } from "firebase/firestore";
import type { PlanTier, MonthlyUsage } from "@/lib/types/plans";

export interface UserProfile {
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  targetCompany: string;
  preferredLanguage: "python" | "c" | "cpp" | "java";
  university: string;
  year: number;
  semester: number;
  role: "user" | "admin";
  isUnethical?: boolean;
  onboardingCompleted?: boolean;
  plan?: PlanTier;
  planExpiresAt?: number;
  usageThisMonth?: MonthlyUsage;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Timestamp | null;
  badges: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProblemResource {
  title: string;
  url: string;
  type: "video" | "article" | "similar";
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  type: "dsa" | "aptitude";
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  topic: string;
  companies: string[];
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  starterCode: {
    python: string;
    c: string;
    cpp: string;
    java: string;
  };
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  // Aptitude MCQ fields
  options?: string[];
  correctAnswer?: string;
  resources?: ProblemResource[];
  successRate: number;
  totalSubmissions: number;
  totalAccepted: number;
  status: "draft" | "published";
  createdBy?: string;
  createdAt: Timestamp;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  language: string;
  difficulty: "easy" | "medium" | "hard";
  status: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error";
  submittedAt: Timestamp;
}

export interface UserProgress {
  userId: string;
  topic: string;
  problemsSolved: number;
  problemsAttempted: number;
  masteryPercentage: number;
  lastPracticedAt: Timestamp;
}

export interface ActivityEntry {
  userId: string;
  date: string;
  problemsSolved: number;
  xpEarned: number;
  minutesPracticed: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  type: "dsa" | "aptitude" | "mixed";
  topics: string[];
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number;
  problemIds: string[];
  status: "upcoming" | "active" | "completed";
  createdBy: string;
  createdAt: Timestamp;
}

export interface CachedHint {
  problemId: string;
  level: number;
  hintText: string;
  model: string;
  generatedAt: Timestamp;
}

export interface HintUsage {
  userId: string;
  problemId: string;
  level: number;
  xpCost: number;
  usedAt: Timestamp;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: "problems_solved" | "streak" | "xp" | "contest_rank";
    threshold: number;
  };
}

export interface MockTestSection {
  label: string;
  type: "aptitude" | "dsa";
  problemIds: string[];
  count: number;
}

export interface MockTest {
  id: string;
  company: string;
  title: string;
  description: string;
  durationMinutes: number;
  sections: MockTestSection[];
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface MockTestAttempt {
  id: string;
  testId: string;
  userId: string;
  startedAt: Timestamp;
  submittedAt?: Timestamp;
  answers: Record<string, string>;
  score: number;
  sectionScores: Record<string, number>;
  status: "in_progress" | "submitted" | "timed_out";
}
