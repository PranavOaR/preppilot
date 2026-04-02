import {
  ALL_TOPICS,
  DSA_TOPICS,
  APTITUDE_TOPICS,
  COMPANY_WEIGHTS,
  DEFAULT_WEIGHTS,
  type TopicMeta,
} from "./company-weights";

export interface TopicProgress {
  solved: number;
  attempted: number;
  total: number; // total problems available in this topic
}

export interface RoadmapTopic extends TopicMeta {
  status: "completed" | "in-progress" | "recommended" | "not-started";
  progress: TopicProgress;
  priority: number; // 0-100, higher = should do sooner
  companyWeight: number; // raw company weight (1-10)
  accuracy: number; // 0-100
}

export interface RoadmapSection {
  title: string;
  description: string;
  topics: RoadmapTopic[];
}

export interface RoadmapData {
  sections: RoadmapSection[];
  globalMastery: number; // 0-100
  totalSolved: number;
  totalProblems: number;
  focusArea: string | null; // recommended next topic name
  companyName: string;
}

interface ProgressMap {
  [topicSlug: string]: { solved: number; attempted: number };
}

interface ProblemCountMap {
  [topicSlug: string]: number;
}

export function generateRoadmap(
  targetCompany: string,
  progressMap: ProgressMap,
  problemCountMap: ProblemCountMap
): RoadmapData {
  const weights = COMPANY_WEIGHTS[targetCompany] || DEFAULT_WEIGHTS;

  function buildTopic(meta: TopicMeta): RoadmapTopic {
    const prog = progressMap[meta.slug] || { solved: 0, attempted: 0 };
    const total = problemCountMap[meta.slug] || 0;
    const accuracy = prog.attempted > 0 ? Math.round((prog.solved / prog.attempted) * 100) : 0;
    const completionRate = total > 0 ? prog.solved / total : 0;
    const companyWeight = weights[meta.slug] || 5;

    // Priority scoring:
    // - High company weight topics that are NOT yet completed get highest priority
    // - Low accuracy = needs more practice = higher priority
    // - Already completed topics get lowest priority
    let priority = 0;

    if (completionRate >= 1 && total > 0) {
      // Completed — low priority
      priority = 5;
    } else if (prog.attempted > 0 && completionRate < 1) {
      // In progress — boost priority if accuracy is low (struggling)
      const accuracyPenalty = accuracy < 50 ? 20 : accuracy < 75 ? 10 : 0;
      priority = companyWeight * 8 + accuracyPenalty + (1 - completionRate) * 10;
    } else {
      // Not started — priority based on company weight
      priority = companyWeight * 7;
    }

    // Determine status
    let status: RoadmapTopic["status"];
    if (total > 0 && prog.solved >= total) {
      status = "completed";
    } else if (prog.attempted > 0) {
      status = "in-progress";
    } else {
      status = "not-started";
    }

    return {
      ...meta,
      status,
      progress: { solved: prog.solved, attempted: prog.attempted, total },
      priority: Math.round(Math.min(priority, 100)),
      companyWeight,
      accuracy,
    };
  }

  const dsaTopics = DSA_TOPICS.map(buildTopic).sort((a, b) => b.priority - a.priority);
  const aptitudeTopics = APTITUDE_TOPICS.map(buildTopic).sort((a, b) => b.priority - a.priority);

  // Mark top recommended topics (highest priority not-started ones)
  function markRecommended(topics: RoadmapTopic[], count: number) {
    let marked = 0;
    for (const t of topics) {
      if (marked >= count) break;
      if (t.status === "not-started") {
        t.status = "recommended";
        marked++;
      }
    }
  }

  markRecommended(dsaTopics, 2);
  markRecommended(aptitudeTopics, 2);

  // Calculate global mastery
  const totalSolved = Object.values(progressMap).reduce((sum, p) => sum + p.solved, 0);
  const totalProblems = Object.values(problemCountMap).reduce((sum, c) => sum + c, 0);
  const globalMastery = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  // Find focus area — highest priority topic that isn't completed
  const allTopics = [...dsaTopics, ...aptitudeTopics].sort((a, b) => b.priority - a.priority);
  const focusTopic = allTopics.find((t) => t.status !== "completed") || null;

  // Build sections — split DSA and Aptitude, ordered by priority
  const sections: RoadmapSection[] = [];

  // Check which section has higher average company weight
  const dsaAvgWeight = dsaTopics.reduce((s, t) => s + t.companyWeight, 0) / dsaTopics.length;
  const aptAvgWeight = aptitudeTopics.reduce((s, t) => s + t.companyWeight, 0) / aptitudeTopics.length;

  if (dsaAvgWeight >= aptAvgWeight) {
    sections.push({
      title: "Data Structures & Algorithms",
      description: "Core coding topics weighted for " + (targetCompany || "general") + " interviews.",
      topics: dsaTopics,
    });
    sections.push({
      title: "Quantitative Aptitude",
      description: "Numerical reasoning and problem-solving.",
      topics: aptitudeTopics,
    });
  } else {
    sections.push({
      title: "Quantitative Aptitude",
      description: "High-priority aptitude topics for " + (targetCompany || "general") + " assessments.",
      topics: aptitudeTopics,
    });
    sections.push({
      title: "Data Structures & Algorithms",
      description: "Coding and algorithmic problem-solving.",
      topics: dsaTopics,
    });
  }

  return {
    sections,
    globalMastery,
    totalSolved,
    totalProblems,
    focusArea: focusTopic?.name || null,
    companyName: targetCompany || "General",
  };
}
