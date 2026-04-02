// Topic importance weights per company (0-10 scale)
// Higher weight = more important for that company's interview process

export interface TopicMeta {
  slug: string;
  name: string;
  type: "dsa" | "aptitude";
  description: string;
  icon: string;
}

export const DSA_TOPICS: TopicMeta[] = [
  { slug: "arrays", name: "Arrays & Hashing", type: "dsa", description: "Contiguous memory, lookups, and frequency counting.", icon: "data_array" },
  { slug: "strings", name: "Strings", type: "dsa", description: "Pattern matching, manipulation, and parsing.", icon: "text_fields" },
  { slug: "two-pointers", name: "Two Pointers", type: "dsa", description: "Linear optimization through symmetric traversal.", icon: "compare_arrows" },
  { slug: "binary-search", name: "Binary Search", type: "dsa", description: "Divide-and-conquer in sorted domains.", icon: "search" },
  { slug: "linked-list", name: "Linked Lists", type: "dsa", description: "Dynamic data sequencing and pointer manipulation.", icon: "link" },
  { slug: "stack", name: "Stacks & Queues", type: "dsa", description: "LIFO/FIFO paradigms for sequential processing.", icon: "stacks" },
  { slug: "trees", name: "Trees", type: "dsa", description: "Hierarchical traversal and balancing.", icon: "account_tree" },
  { slug: "dp", name: "Dynamic Programming", type: "dsa", description: "Optimal substructure and memoization.", icon: "grid_on" },
  { slug: "graph", name: "Graphs", type: "dsa", description: "BFS, DFS, shortest paths, and connectivity.", icon: "hub" },
  { slug: "sorting", name: "Sorting", type: "dsa", description: "Comparison and non-comparison sorting algorithms.", icon: "sort" },
  { slug: "heap", name: "Heap / Priority Queue", type: "dsa", description: "Efficient extraction of extremes.", icon: "filter_list" },
  { slug: "greedy", name: "Greedy Algorithms", type: "dsa", description: "Locally optimal choices for global optima.", icon: "bolt" },
  { slug: "backtracking", name: "Backtracking", type: "dsa", description: "Systematic enumeration with constraint pruning.", icon: "undo" },
  { slug: "hash-table", name: "Hash Tables", type: "dsa", description: "O(1) average lookups and collision handling.", icon: "tag" },
  { slug: "matrix", name: "Matrix", type: "dsa", description: "2D traversal, rotation, and search.", icon: "grid_view" },
  { slug: "bit-manipulation", name: "Bit Manipulation", type: "dsa", description: "Bitwise operations for space/time optimization.", icon: "memory" },
];

export const APTITUDE_TOPICS: TopicMeta[] = [
  { slug: "numbers", name: "Number System", type: "aptitude", description: "Divisibility, LCM, HCF, and number properties.", icon: "pin" },
  { slug: "percentages", name: "Percentages", type: "aptitude", description: "Percentage calculations and conversions.", icon: "percent" },
  { slug: "profit-and-loss", name: "Profit & Loss", type: "aptitude", description: "Cost price, selling price, and margins.", icon: "trending_up" },
  { slug: "average", name: "Averages", type: "aptitude", description: "Mean, weighted average, and central tendency.", icon: "equalizer" },
  { slug: "ratio-and-proportion", name: "Ratio & Proportion", type: "aptitude", description: "Ratios, proportions, and variations.", icon: "balance" },
  { slug: "mixture-and-alligation", name: "Mixtures", type: "aptitude", description: "Mixture problems and alligation rules.", icon: "science" },
  { slug: "time-and-work", name: "Time & Work", type: "aptitude", description: "Work rates, efficiency, and combined work.", icon: "engineering" },
  { slug: "time-speed-distance", name: "Speed & Distance", type: "aptitude", description: "Relative speed, trains, and boats.", icon: "speed" },
  { slug: "pipes-and-cisterns", name: "Pipes & Cisterns", type: "aptitude", description: "Fill/drain rates and combined operations.", icon: "water_drop" },
  { slug: "algebra", name: "Algebra", type: "aptitude", description: "Equations, inequalities, and expressions.", icon: "functions" },
  { slug: "trigonometry-height-distance", name: "Trigonometry", type: "aptitude", description: "Heights, distances, and angle problems.", icon: "architecture" },
  { slug: "geometry", name: "Geometry", type: "aptitude", description: "Area, perimeter, and spatial reasoning.", icon: "pentagon" },
  { slug: "probability", name: "Probability", type: "aptitude", description: "Chance, odds, and expected value.", icon: "casino" },
  { slug: "permutation-and-combination", name: "P & C", type: "aptitude", description: "Counting principles and arrangements.", icon: "shuffle" },
  { slug: "age-problems", name: "Age Problems", type: "aptitude", description: "Age-based word problems and equations.", icon: "cake" },
];

export const ALL_TOPICS = [...DSA_TOPICS, ...APTITUDE_TOPICS];

// Company interview focus areas — weights determine topic priority in the roadmap
// Scale: 10 = core focus, 7-9 = important, 4-6 = moderate, 1-3 = rarely asked
export const COMPANY_WEIGHTS: Record<string, Record<string, number>> = {
  TCS: {
    // TCS NQT heavily tests aptitude
    arrays: 6, strings: 5, "two-pointers": 4, "binary-search": 4, "linked-list": 3,
    stack: 3, trees: 3, dp: 2, graph: 2, sorting: 5, heap: 2, greedy: 3,
    backtracking: 2, "hash-table": 4, matrix: 3, "bit-manipulation": 2,
    numbers: 10, percentages: 9, "profit-and-loss": 9, average: 8,
    "ratio-and-proportion": 8, "mixture-and-alligation": 7, "time-and-work": 9,
    "time-speed-distance": 8, "pipes-and-cisterns": 7, algebra: 8,
    "trigonometry-height-distance": 6, geometry: 7, probability: 7,
    "permutation-and-combination": 7, "age-problems": 8,
  },
  Infosys: {
    arrays: 7, strings: 6, "two-pointers": 5, "binary-search": 5, "linked-list": 4,
    stack: 4, trees: 4, dp: 3, graph: 3, sorting: 6, heap: 3, greedy: 4,
    backtracking: 3, "hash-table": 5, matrix: 4, "bit-manipulation": 3,
    numbers: 9, percentages: 8, "profit-and-loss": 8, average: 8,
    "ratio-and-proportion": 7, "mixture-and-alligation": 6, "time-and-work": 8,
    "time-speed-distance": 7, "pipes-and-cisterns": 6, algebra: 7,
    "trigonometry-height-distance": 5, geometry: 6, probability: 7,
    "permutation-and-combination": 6, "age-problems": 7,
  },
  Wipro: {
    arrays: 6, strings: 5, "two-pointers": 4, "binary-search": 4, "linked-list": 3,
    stack: 3, trees: 3, dp: 2, graph: 2, sorting: 5, heap: 2, greedy: 3,
    backtracking: 2, "hash-table": 4, matrix: 3, "bit-manipulation": 2,
    numbers: 9, percentages: 9, "profit-and-loss": 8, average: 8,
    "ratio-and-proportion": 8, "mixture-and-alligation": 7, "time-and-work": 8,
    "time-speed-distance": 8, "pipes-and-cisterns": 7, algebra: 7,
    "trigonometry-height-distance": 6, geometry: 6, probability: 6,
    "permutation-and-combination": 6, "age-problems": 7,
  },
  Zoho: {
    // Zoho heavily tests DSA + programming
    arrays: 10, strings: 9, "two-pointers": 8, "binary-search": 8, "linked-list": 7,
    stack: 7, trees: 7, dp: 8, graph: 6, sorting: 8, heap: 6, greedy: 7,
    backtracking: 6, "hash-table": 8, matrix: 7, "bit-manipulation": 5,
    numbers: 5, percentages: 4, "profit-and-loss": 3, average: 4,
    "ratio-and-proportion": 3, "mixture-and-alligation": 2, "time-and-work": 3,
    "time-speed-distance": 3, "pipes-and-cisterns": 2, algebra: 5,
    "trigonometry-height-distance": 2, geometry: 3, probability: 4,
    "permutation-and-combination": 4, "age-problems": 3,
  },
  Flipkart: {
    arrays: 10, strings: 8, "two-pointers": 8, "binary-search": 9, "linked-list": 7,
    stack: 7, trees: 9, dp: 10, graph: 8, sorting: 7, heap: 8, greedy: 7,
    backtracking: 6, "hash-table": 8, matrix: 6, "bit-manipulation": 5,
    numbers: 3, percentages: 2, "profit-and-loss": 2, average: 2,
    "ratio-and-proportion": 2, "mixture-and-alligation": 1, "time-and-work": 2,
    "time-speed-distance": 2, "pipes-and-cisterns": 1, algebra: 3,
    "trigonometry-height-distance": 1, geometry: 2, probability: 3,
    "permutation-and-combination": 3, "age-problems": 2,
  },
  "Amazon India": {
    arrays: 10, strings: 8, "two-pointers": 9, "binary-search": 9, "linked-list": 7,
    stack: 8, trees: 9, dp: 10, graph: 9, sorting: 7, heap: 8, greedy: 8,
    backtracking: 7, "hash-table": 9, matrix: 6, "bit-manipulation": 5,
    numbers: 3, percentages: 2, "profit-and-loss": 2, average: 2,
    "ratio-and-proportion": 2, "mixture-and-alligation": 1, "time-and-work": 2,
    "time-speed-distance": 2, "pipes-and-cisterns": 1, algebra: 3,
    "trigonometry-height-distance": 1, geometry: 2, probability: 3,
    "permutation-and-combination": 3, "age-problems": 2,
  },
  "Google India": {
    arrays: 10, strings: 8, "two-pointers": 9, "binary-search": 9, "linked-list": 6,
    stack: 7, trees: 9, dp: 10, graph: 10, sorting: 7, heap: 8, greedy: 8,
    backtracking: 8, "hash-table": 9, matrix: 7, "bit-manipulation": 7,
    numbers: 2, percentages: 1, "profit-and-loss": 1, average: 1,
    "ratio-and-proportion": 1, "mixture-and-alligation": 1, "time-and-work": 1,
    "time-speed-distance": 1, "pipes-and-cisterns": 1, algebra: 2,
    "trigonometry-height-distance": 1, geometry: 2, probability: 3,
    "permutation-and-combination": 3, "age-problems": 1,
  },
  "Microsoft India": {
    arrays: 10, strings: 8, "two-pointers": 8, "binary-search": 9, "linked-list": 7,
    stack: 8, trees: 9, dp: 9, graph: 8, sorting: 7, heap: 7, greedy: 7,
    backtracking: 7, "hash-table": 8, matrix: 6, "bit-manipulation": 6,
    numbers: 3, percentages: 2, "profit-and-loss": 2, average: 2,
    "ratio-and-proportion": 2, "mixture-and-alligation": 1, "time-and-work": 2,
    "time-speed-distance": 2, "pipes-and-cisterns": 1, algebra: 3,
    "trigonometry-height-distance": 1, geometry: 2, probability: 3,
    "permutation-and-combination": 3, "age-problems": 2,
  },
  "Tech Mahindra": {
    arrays: 5, strings: 5, "two-pointers": 4, "binary-search": 4, "linked-list": 3,
    stack: 3, trees: 3, dp: 2, graph: 2, sorting: 5, heap: 2, greedy: 3,
    backtracking: 2, "hash-table": 4, matrix: 3, "bit-manipulation": 2,
    numbers: 9, percentages: 8, "profit-and-loss": 8, average: 8,
    "ratio-and-proportion": 7, "mixture-and-alligation": 6, "time-and-work": 8,
    "time-speed-distance": 7, "pipes-and-cisterns": 6, algebra: 7,
    "trigonometry-height-distance": 5, geometry: 6, probability: 6,
    "permutation-and-combination": 6, "age-problems": 7,
  },
  Cognizant: {
    arrays: 6, strings: 5, "two-pointers": 4, "binary-search": 4, "linked-list": 3,
    stack: 3, trees: 3, dp: 2, graph: 2, sorting: 5, heap: 2, greedy: 3,
    backtracking: 2, "hash-table": 4, matrix: 3, "bit-manipulation": 2,
    numbers: 9, percentages: 8, "profit-and-loss": 8, average: 8,
    "ratio-and-proportion": 7, "mixture-and-alligation": 6, "time-and-work": 8,
    "time-speed-distance": 7, "pipes-and-cisterns": 6, algebra: 7,
    "trigonometry-height-distance": 5, geometry: 6, probability: 6,
    "permutation-and-combination": 6, "age-problems": 7,
  },
  HCLTech: {
    arrays: 6, strings: 5, "two-pointers": 4, "binary-search": 4, "linked-list": 3,
    stack: 3, trees: 3, dp: 2, graph: 2, sorting: 5, heap: 2, greedy: 3,
    backtracking: 2, "hash-table": 4, matrix: 3, "bit-manipulation": 2,
    numbers: 9, percentages: 8, "profit-and-loss": 8, average: 8,
    "ratio-and-proportion": 7, "mixture-and-alligation": 6, "time-and-work": 8,
    "time-speed-distance": 7, "pipes-and-cisterns": 6, algebra: 7,
    "trigonometry-height-distance": 5, geometry: 6, probability: 6,
    "permutation-and-combination": 6, "age-problems": 7,
  },
  Accenture: {
    arrays: 5, strings: 5, "two-pointers": 3, "binary-search": 4, "linked-list": 3,
    stack: 3, trees: 3, dp: 2, graph: 2, sorting: 4, heap: 2, greedy: 3,
    backtracking: 2, "hash-table": 4, matrix: 3, "bit-manipulation": 2,
    numbers: 9, percentages: 9, "profit-and-loss": 8, average: 8,
    "ratio-and-proportion": 8, "mixture-and-alligation": 7, "time-and-work": 8,
    "time-speed-distance": 8, "pipes-and-cisterns": 7, algebra: 7,
    "trigonometry-height-distance": 6, geometry: 6, probability: 7,
    "permutation-and-combination": 6, "age-problems": 7,
  },
};

// Default weights when user's target company isn't in the map
export const DEFAULT_WEIGHTS: Record<string, number> = {
  arrays: 8, strings: 7, "two-pointers": 6, "binary-search": 7, "linked-list": 5,
  stack: 5, trees: 6, dp: 7, graph: 6, sorting: 6, heap: 5, greedy: 5,
  backtracking: 4, "hash-table": 6, matrix: 4, "bit-manipulation": 4,
  numbers: 7, percentages: 6, "profit-and-loss": 6, average: 6,
  "ratio-and-proportion": 5, "mixture-and-alligation": 4, "time-and-work": 6,
  "time-speed-distance": 5, "pipes-and-cisterns": 4, algebra: 5,
  "trigonometry-height-distance": 3, geometry: 4, probability: 5,
  "permutation-and-combination": 4, "age-problems": 5,
};
