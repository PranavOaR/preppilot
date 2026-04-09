"use client";

const categoryTabs = [
  { label: "All Challenges", value: undefined },
  { label: "DSA", value: "dsa" as const },
  { label: "Aptitude", value: "aptitude" as const },
];

const difficulties = [
  { label: "Easy", value: "easy" as const, color: "text-green-400 bg-green-400/10" },
  { label: "Medium", value: "medium" as const, color: "text-yellow-400 bg-yellow-400/10" },
  { label: "Hard", value: "hard" as const, color: "text-error-brand bg-error-brand/10" },
];

const companies = [
  "TCS", "Infosys", "Wipro", "HCL Technologies", "Cognizant",
  "Accenture", "Tech Mahindra", "Zoho", "Flipkart", "Paytm",
  "Razorpay", "PhonePe", "Swiggy", "Zomato", "CRED",
];

interface ProblemFiltersProps {
  filters: {
    type?: "dsa" | "aptitude";
    difficulty?: "easy" | "medium" | "hard";
    company?: string;
    topic?: string;
  };
  onFilterChange: (filters: {
    type?: "dsa" | "aptitude";
    difficulty?: "easy" | "medium" | "hard";
    company?: string;
    topic?: string;
  }) => void;
}

export function ProblemFilters({ filters, onFilterChange }: ProblemFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low w-fit">
        {categoryTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => onFilterChange({ ...filters, type: tab.value })}
            className={`px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              filters.type === tab.value
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Difficulty + Company Filters */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1 flex-nowrap sm:flex-wrap">
        <div className="flex items-center gap-2">
          {difficulties.map((d) => (
            <button
              key={d.label}
              onClick={() =>
                onFilterChange({
                  ...filters,
                  difficulty: filters.difficulty === d.value ? undefined : d.value,
                })
              }
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filters.difficulty === d.value
                  ? d.color
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Company Filter */}
        <select
          value={filters.company || ""}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              company: e.target.value || undefined,
            })
          }
          className="h-8 rounded-md bg-surface-container text-on-surface-variant text-xs px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Active topic filter chip */}
        {filters.topic && (
          <button
            onClick={() => onFilterChange({ ...filters, topic: undefined })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-tertiary-container/30 text-tertiary cursor-pointer hover:bg-tertiary-container/50 transition-colors"
          >
            Topic: {filters.topic.replace(/-/g, " ")}
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
