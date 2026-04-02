import type { Timestamp } from "firebase/firestore";

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
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Timestamp | null;
  badges: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
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
  language: string;
  code: string;
  status: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error";
  testCasesPassed: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
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
