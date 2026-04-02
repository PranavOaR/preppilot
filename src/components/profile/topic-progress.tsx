"use client";

interface TopicProgressProps {
  progress: { topic: string; solved: number; total: number }[];
}

const DSA_TOPICS = [
  "arrays", "strings", "linked-list", "stacks", "queues", "trees",
  "graphs", "hash-map", "heap", "sorting", "searching", "recursion",
  "dynamic-programming", "greedy", "backtracking", "bit-manipulation",
  "sliding-window", "two-pointers", "divide-and-conquer", "trie",
  "segment-tree", "math",
];

function formatTopicName(topic: string): string {
  return topic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function TopicBar({
  topic,
  solved,
  total,
}: {
  topic: string;
  solved: number;
  total: number;
}) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-on-surface text-sm">
          {formatTopicName(topic)}
        </span>
        <span className="font-mono text-on-surface-variant text-xs">
          {solved}/{total} solved
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TopicProgress({ progress }: TopicProgressProps) {
  const dsaTopics = progress.filter((p) =>
    DSA_TOPICS.includes(p.topic.toLowerCase())
  );
  const aptitudeTopics = progress.filter(
    (p) => !DSA_TOPICS.includes(p.topic.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* DSA Topics */}
      {dsaTopics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">
            Data Structures & Algorithms
          </h4>
          <div className="space-y-3">
            {dsaTopics.map((t) => (
              <TopicBar key={t.topic} {...t} />
            ))}
          </div>
        </div>
      )}

      {/* Aptitude Topics */}
      {aptitudeTopics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">
            Aptitude
          </h4>
          <div className="space-y-3">
            {aptitudeTopics.map((t) => (
              <TopicBar key={t.topic} {...t} />
            ))}
          </div>
        </div>
      )}

      {progress.length === 0 && (
        <p className="text-on-surface-variant text-sm text-center py-4">
          No progress data yet. Start solving problems!
        </p>
      )}
    </div>
  );
}
