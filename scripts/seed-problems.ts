import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJpHav3xhdRHoVMvNu2tiV5wR7al1Xptg",
  authDomain: "prepp-e0147.firebaseapp.com",
  projectId: "prepp-e0147",
  storageBucket: "prepp-e0147.firebasestorage.app",
  messagingSenderId: "884696227865",
  appId: "1:884696227865:web:8d53dd13b71ec2c1ae0a88",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Indian company tagging ───
const companyTags: Record<string, string[]> = {
  "arrays": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Zoho", "Flipkart"],
  "strings": ["TCS", "Infosys", "Wipro", "HCL Technologies", "Cognizant", "Tech Mahindra"],
  "hash-table": ["Zoho", "Flipkart", "Paytm", "Razorpay", "TCS", "Infosys"],
  "two-pointers": ["Flipkart", "Zoho", "PhonePe", "Razorpay", "Swiggy"],
  "binary-search": ["Flipkart", "Zoho", "Paytm", "CRED", "Razorpay", "Accenture"],
  "sliding-window": ["Flipkart", "PhonePe", "Swiggy", "Zomato", "CRED"],
  "linked-list": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Zoho"],
  "stack": ["TCS", "Infosys", "Zoho", "Flipkart", "Paytm"],
  "queue": ["TCS", "Infosys", "HCL Technologies", "Tech Mahindra"],
  "trees": ["Zoho", "Flipkart", "Paytm", "Razorpay", "PhonePe", "Swiggy"],
  "binary-tree": ["Zoho", "Flipkart", "Paytm", "Razorpay", "PhonePe"],
  "bst": ["Zoho", "Flipkart", "Paytm", "CRED"],
  "heap": ["Flipkart", "Zoho", "PhonePe", "Razorpay"],
  "graph": ["Flipkart", "Zoho", "PhonePe", "CRED", "Swiggy", "Zomato"],
  "dynamic-programming": ["Flipkart", "Zoho", "PhonePe", "CRED", "Razorpay", "Swiggy"],
  "greedy": ["TCS", "Infosys", "Flipkart", "Zoho", "Paytm"],
  "backtracking": ["Zoho", "Flipkart", "PhonePe", "CRED"],
  "recursion": ["TCS", "Infosys", "Wipro", "Cognizant", "Zoho"],
  "sorting": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "HCL Technologies"],
  "math": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture"],
  "bit-manipulation": ["Zoho", "Flipkart", "Razorpay", "CRED"],
  "matrix": ["TCS", "Infosys", "Wipro", "Zoho", "Flipkart"],
  "trie": ["Flipkart", "Zoho", "PhonePe", "CRED"],
  // Aptitude topics
  "percentages": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "HCL Technologies", "Capgemini"],
  "profit-loss": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini"],
  "time-work": ["TCS", "Infosys", "Wipro", "Cognizant", "HCL Technologies", "Tech Mahindra"],
  "time-speed-distance": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture"],
  "number-series": ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini"],
  "probability": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture"],
  "permutations-combinations": ["TCS", "Infosys", "Wipro", "Zoho", "Flipkart"],
  "logical-reasoning": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini"],
};

function getCompaniesForTopic(topic: string): string[] {
  return companyTags[topic] || ["TCS", "Infosys"];
}

// ─── DSA Problems ───
interface ProblemSeed {
  title: string;
  slug: string;
  type: "dsa" | "aptitude";
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  starterCode: { python: string; c: string; cpp: string; java: string };
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

const dsaProblems: ProblemSeed[] = [
  // ─── Arrays ───
  {
    title: "Two Sum",
    slug: "two-sum",
    type: "dsa",
    difficulty: "easy",
    topic: "arrays",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
    starterCode: {
      python: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass",
      c: "#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true },
      { input: "[1,5,3,7,2]\n9", expectedOutput: "[1,3]", isHidden: true },
    ],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-sell-stock",
    type: "dsa",
    difficulty: "easy",
    topic: "arrays",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "No profit possible, return 0." },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    starterCode: {
      python: "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        pass",
      c: "int maxProfit(int* prices, int pricesSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5", isHidden: false },
      { input: "[7,6,4,3,1]", expectedOutput: "0", isHidden: false },
      { input: "[2,4,1]", expectedOutput: "2", isHidden: true },
      { input: "[1,2]", expectedOutput: "1", isHidden: true },
    ],
  },
  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    type: "dsa",
    difficulty: "easy",
    topic: "arrays",
    description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "true", explanation: "The element 1 occurs at indices 0 and 3." },
      { input: "nums = [1,2,3,4]", output: "false", explanation: "All elements are distinct." },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    starterCode: {
      python: "class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        pass",
      c: "#include <stdbool.h>\n\nbool containsDuplicate(int* nums, int numsSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
      { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
      { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: true },
    ],
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    type: "dsa",
    difficulty: "medium",
    topic: "arrays",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1", explanation: "The subarray [1] has the largest sum 1." },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    starterCode: {
      python: "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        pass",
      c: "int maxSubArray(int* nums, int numsSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
      { input: "[1]", expectedOutput: "1", isHidden: false },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", isHidden: true },
      { input: "[-1]", expectedOutput: "-1", isHidden: true },
    ],
  },
  {
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    type: "dsa",
    difficulty: "medium",
    topic: "arrays",
    description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "Product except self for each index." },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]", explanation: "Product except self with zeros." },
    ],
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30", "The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer."],
    starterCode: {
      python: "class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        pass",
      c: "int* productExceptSelf(int* nums, int numsSize, int* returnSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false },
      { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]", isHidden: false },
      { input: "[2,3]", expectedOutput: "[3,2]", isHidden: true },
    ],
  },

  // ─── Strings ───
  {
    title: "Valid Anagram",
    slug: "valid-anagram",
    type: "dsa",
    difficulty: "easy",
    topic: "strings",
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true", explanation: "nagaram is an anagram of anagram." },
      { input: 's = "rat", t = "car"', output: "false", explanation: "rat and car are not anagrams." },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    starterCode: {
      python: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        pass",
      c: "#include <stdbool.h>\n\nbool isAnagram(char* s, char* t) {\n    \n}",
      cpp: "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}",
    },
    testCases: [
      { input: "anagram\nnagaram", expectedOutput: "true", isHidden: false },
      { input: "rat\ncar", expectedOutput: "false", isHidden: false },
      { input: "a\na", expectedOutput: "true", isHidden: true },
    ],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating",
    type: "dsa",
    difficulty: "medium",
    topic: "sliding-window",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    starterCode: {
      python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass",
      c: "int lengthOfLongestSubstring(char* s) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
    },
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isHidden: false },
      { input: "bbbbb", expectedOutput: "1", isHidden: false },
      { input: "pwwkew", expectedOutput: "3", isHidden: true },
      { input: "", expectedOutput: "0", isHidden: true },
    ],
  },

  // ─── Two Pointers ───
  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    type: "dsa",
    difficulty: "easy",
    topic: "two-pointers",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: "false", explanation: '"raceacar" is not a palindrome.' },
    ],
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    starterCode: {
      python: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        pass",
      c: "#include <stdbool.h>\n\nbool isPalindrome(char* s) {\n    \n}",
      cpp: "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}",
    },
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isHidden: false },
      { input: "race a car", expectedOutput: "false", isHidden: false },
      { input: " ", expectedOutput: "true", isHidden: true },
    ],
  },
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    type: "dsa",
    difficulty: "medium",
    topic: "two-pointers",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the ith line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The max area is between index 1 and 8." },
      { input: "height = [1,1]", output: "1", explanation: "The max area is 1." },
    ],
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    starterCode: {
      python: "class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        pass",
      c: "int maxArea(int* height, int heightSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false },
      { input: "[1,1]", expectedOutput: "1", isHidden: false },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
    ],
  },

  // ─── Binary Search ───
  {
    title: "Binary Search",
    slug: "binary-search",
    type: "dsa",
    difficulty: "easy",
    topic: "binary-search",
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1." },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All the integers in nums are unique.", "nums is sorted in ascending order."],
    starterCode: {
      python: "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass",
      c: "int search(int* nums, int numsSize, int target) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[-1,0,3,5,9,12]\n9", expectedOutput: "4", isHidden: false },
      { input: "[-1,0,3,5,9,12]\n2", expectedOutput: "-1", isHidden: false },
      { input: "[5]\n5", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    type: "dsa",
    difficulty: "medium",
    topic: "binary-search",
    description: "There is an integer array `nums` sorted in ascending order (with distinct values). Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index.\n\nGiven the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or -1 if it is not in `nums`.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4", explanation: "0 is found at index 4." },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1", explanation: "3 is not in the array." },
    ],
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i] <= 10^4", "All values of nums are unique."],
    starterCode: {
      python: "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass",
      c: "int search(int* nums, int numsSize, int target) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[4,5,6,7,0,1,2]\n0", expectedOutput: "4", isHidden: false },
      { input: "[4,5,6,7,0,1,2]\n3", expectedOutput: "-1", isHidden: false },
      { input: "[1]\n0", expectedOutput: "-1", isHidden: true },
    ],
  },

  // ─── Linked List ───
  {
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    type: "dsa",
    difficulty: "easy",
    topic: "linked-list",
    description: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "Reverse the entire linked list." },
      { input: "head = [1,2]", output: "[2,1]", explanation: "Reverse two nodes." },
    ],
    constraints: ["The number of nodes in the list is the range [0, 5000].", "-5000 <= Node.val <= 5000"],
    starterCode: {
      python: "class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        pass",
      c: "struct ListNode* reverseList(struct ListNode* head) {\n    \n}",
      cpp: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
      java: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false },
      { input: "[1,2]", expectedOutput: "[2,1]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: true },
    ],
  },
  {
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    type: "dsa",
    difficulty: "easy",
    topic: "linked-list",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "Merge the two sorted lists." },
      { input: "list1 = [], list2 = []", output: "[]", explanation: "Both lists are empty." },
    ],
    constraints: ["The number of nodes in both lists is in the range [0, 50].", "-100 <= Node.val <= 100", "Both list1 and list2 are sorted in non-decreasing order."],
    starterCode: {
      python: "class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        pass",
      c: "struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {\n    \n}",
      cpp: "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        \n    }\n};",
      java: "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false },
      { input: "[]\n[]", expectedOutput: "[]", isHidden: false },
      { input: "[]\n[0]", expectedOutput: "[0]", isHidden: true },
    ],
  },

  // ─── Stack ───
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    type: "dsa",
    difficulty: "easy",
    topic: "stack",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      { input: 's = "()"', output: "true", explanation: "Simple valid parentheses." },
      { input: 's = "()[]{}"', output: "true", explanation: "All types of brackets valid." },
      { input: 's = "(]"', output: "false", explanation: "Mismatched brackets." },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}' ."],
    starterCode: {
      python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
      c: "#include <stdbool.h>\n\nbool isValid(char* s) {\n    \n}",
      cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
    },
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "()[]{}", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false },
      { input: "([)]", expectedOutput: "false", isHidden: true },
    ],
  },

  // ─── Trees ───
  {
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    type: "dsa",
    difficulty: "easy",
    topic: "trees",
    description: "Given the `root` of a binary tree, invert the tree, and return its root.\n\nInverting a binary tree means swapping the left and right children of every node.",
    examples: [
      { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]", explanation: "Swap left and right children at every level." },
      { input: "root = [2,1,3]", output: "[2,3,1]", explanation: "Simple three-node tree inversion." },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    starterCode: {
      python: "class Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        pass",
      c: "struct TreeNode* invertTree(struct TreeNode* root) {\n    \n}",
      cpp: "class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        \n    }\n};",
      java: "class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[4,2,7,1,3,6,9]", expectedOutput: "[4,7,2,9,6,3,1]", isHidden: false },
      { input: "[2,1,3]", expectedOutput: "[2,3,1]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: true },
    ],
  },
  {
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-binary-tree",
    type: "dsa",
    difficulty: "easy",
    topic: "trees",
    description: "Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "3", explanation: "The tree has depth 3." },
      { input: "root = [1,null,2]", output: "2", explanation: "The tree has depth 2." },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 10^4].", "-100 <= Node.val <= 100"],
    starterCode: {
      python: "class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        pass",
      c: "int maxDepth(struct TreeNode* root) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expectedOutput: "3", isHidden: false },
      { input: "[1,null,2]", expectedOutput: "2", isHidden: false },
      { input: "[]", expectedOutput: "0", isHidden: true },
    ],
  },

  // ─── Dynamic Programming ───
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    type: "dsa",
    difficulty: "easy",
    topic: "dynamic-programming",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "There are two ways to climb: 1+1 or 2." },
      { input: "n = 3", output: "3", explanation: "There are three ways: 1+1+1, 1+2, 2+1." },
    ],
    constraints: ["1 <= n <= 45"],
    starterCode: {
      python: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass",
      c: "int climbStairs(int n) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
    },
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false },
      { input: "3", expectedOutput: "3", isHidden: false },
      { input: "5", expectedOutput: "8", isHidden: true },
      { input: "10", expectedOutput: "89", isHidden: true },
    ],
  },
  {
    title: "Longest Common Subsequence",
    slug: "longest-common-subsequence",
    type: "dsa",
    difficulty: "medium",
    topic: "dynamic-programming",
    description: "Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.",
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: 'The LCS is "ace" and its length is 3.' },
      { input: 'text1 = "abc", text2 = "def"', output: "0", explanation: "No common subsequence." },
    ],
    constraints: ["1 <= text1.length, text2.length <= 1000", "text1 and text2 consist of only lowercase English characters."],
    starterCode: {
      python: "class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        pass",
      c: "int longestCommonSubsequence(char* text1, char* text2) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        \n    }\n};",
      java: "class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        \n    }\n}",
    },
    testCases: [
      { input: "abcde\nace", expectedOutput: "3", isHidden: false },
      { input: "abc\nabc", expectedOutput: "3", isHidden: false },
      { input: "abc\ndef", expectedOutput: "0", isHidden: true },
    ],
  },

  // ─── Graph ───
  {
    title: "Number of Islands",
    slug: "number-of-islands",
    type: "dsa",
    difficulty: "medium",
    topic: "graph",
    description: "Given an `m x n` 2D binary grid `grid` which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1", explanation: "One connected island." },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3", explanation: "Three separate islands." },
    ],
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is '0' or '1'."],
    starterCode: {
      python: "class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        pass",
      c: "int numIslands(char** grid, int gridSize, int* gridColSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};",
      java: "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
    },
    testCases: [
      { input: '[[1,1,1,1,0],[1,1,0,1,0],[1,1,0,0,0],[0,0,0,0,0]]', expectedOutput: "1", isHidden: false },
      { input: '[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]', expectedOutput: "3", isHidden: false },
      { input: '[[1,0,1],[0,1,0],[1,0,1]]', expectedOutput: "5", isHidden: true },
    ],
  },

  // ─── Sorting ───
  {
    title: "Merge Sort Array",
    slug: "merge-sorted-array",
    type: "dsa",
    difficulty: "easy",
    topic: "sorting",
    description: "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.\n\nMerge `nums1` and `nums2` into a single array sorted in non-decreasing order.\n\nThe final sorted array should be stored inside `nums1`. `nums1` has a length of `m + n`.",
    examples: [
      { input: "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", output: "[1,2,2,3,5,6]", explanation: "Merge and sort." },
    ],
    constraints: ["nums1.length == m + n", "nums2.length == n", "0 <= m, n <= 200"],
    starterCode: {
      python: "class Solution:\n    def merge(self, nums1: list[int], m: int, nums2: list[int], n: int) -> None:\n        pass",
      c: "void merge(int* nums1, int nums1Size, int m, int* nums2, int nums2Size, int n) {\n    \n}",
      cpp: "class Solution {\npublic:\n    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {\n        \n    }\n};",
      java: "class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,2,3,0,0,0]\n3\n[2,5,6]\n3", expectedOutput: "[1,2,2,3,5,6]", isHidden: false },
      { input: "[1]\n1\n[]\n0", expectedOutput: "[1]", isHidden: false },
      { input: "[0]\n0\n[1]\n1", expectedOutput: "[1]", isHidden: true },
    ],
  },

  // ─── Hard Problems ───
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    type: "dsa",
    difficulty: "hard",
    topic: "two-pointers",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "6 units of rain water are trapped." },
      { input: "height = [4,2,0,3,2,5]", output: "9", explanation: "9 units of rain water are trapped." },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    starterCode: {
      python: "class Solution:\n    def trap(self, height: list[int]) -> int:\n        pass",
      c: "int trap(int* height, int heightSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
      java: "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", isHidden: false },
      { input: "[4,2,0,3,2,5]", expectedOutput: "9", isHidden: false },
      { input: "[4,2,3]", expectedOutput: "1", isHidden: true },
    ],
  },
  {
    title: "Merge K Sorted Lists",
    slug: "merge-k-sorted-lists",
    type: "dsa",
    difficulty: "hard",
    topic: "heap",
    description: "You are given an array of `k` linked-lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.",
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]", explanation: "Merge all three sorted lists into one." },
      { input: "lists = []", output: "[]", explanation: "Empty input returns empty list." },
    ],
    constraints: ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500", "-10^4 <= lists[i][j] <= 10^4"],
    starterCode: {
      python: "class Solution:\n    def mergeKLists(self, lists: list[Optional[ListNode]]) -> Optional[ListNode]:\n        pass",
      c: "struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};",
      java: "class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: false },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
    ],
  },
  {
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    type: "dsa",
    difficulty: "hard",
    topic: "binary-search",
    description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.0", explanation: "Merged array = [1,2,3] and median is 2." },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.5", explanation: "Merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5." },
    ],
    constraints: ["nums1.length == m", "nums2.length == n", "0 <= m <= 1000", "0 <= n <= 1000", "1 <= m + n <= 2000"],
    starterCode: {
      python: "class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        pass",
      c: "double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    \n}",
      cpp: "class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      java: "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,3]\n[2]", expectedOutput: "2.0", isHidden: false },
      { input: "[1,2]\n[3,4]", expectedOutput: "2.5", isHidden: false },
      { input: "[0,0]\n[0,0]", expectedOutput: "0.0", isHidden: true },
    ],
  },

  // ─── Greedy ───
  {
    title: "Jump Game",
    slug: "jump-game",
    type: "dsa",
    difficulty: "medium",
    topic: "greedy",
    description: "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn `true` if you can reach the last index, or `false` otherwise.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true", explanation: "Jump 1 step from index 0 to 1, then 3 steps to the last index." },
      { input: "nums = [3,2,1,0,4]", output: "false", explanation: "You will always arrive at index 3, which has 0 jump length." },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    starterCode: {
      python: "class Solution:\n    def canJump(self, nums: list[int]) -> bool:\n        pass",
      c: "#include <stdbool.h>\n\nbool canJump(int* nums, int numsSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[2,3,1,1,4]", expectedOutput: "true", isHidden: false },
      { input: "[3,2,1,0,4]", expectedOutput: "false", isHidden: false },
      { input: "[0]", expectedOutput: "true", isHidden: true },
    ],
  },

  // ─── Recursion / Backtracking ───
  {
    title: "Subsets",
    slug: "subsets",
    type: "dsa",
    difficulty: "medium",
    topic: "backtracking",
    description: "Given an integer array `nums` of unique elements, return all possible subsets (the power set).\n\nThe solution set must not contain duplicate subsets. Return the solution in any order.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]", explanation: "All subsets of [1,2,3]." },
      { input: "nums = [0]", output: "[[],[0]]", explanation: "All subsets of [0]." },
    ],
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All the numbers of nums are unique."],
    starterCode: {
      python: "class Solution:\n    def subsets(self, nums: list[int]) -> list[list[int]]:\n        pass",
      c: "int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    \n}",
      cpp: "class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[1,2,3]", expectedOutput: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]", isHidden: false },
      { input: "[0]", expectedOutput: "[[],[0]]", isHidden: false },
    ],
  },

  // ─── Hash Table ───
  {
    title: "Group Anagrams",
    slug: "group-anagrams",
    type: "dsa",
    difficulty: "medium",
    topic: "hash-table",
    description: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: "Group strings that are anagrams of each other." },
      { input: 'strs = [""]', output: '[[""]]', explanation: "Single empty string." },
    ],
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    starterCode: {
      python: "class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        pass",
      c: "char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {\n    \n}",
      cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
    },
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
      { input: '[""]', expectedOutput: '[[""]]', isHidden: false },
      { input: '["a"]', expectedOutput: '[["a"]]', isHidden: true },
    ],
  },

  // ─── Matrix ───
  {
    title: "Rotate Image",
    slug: "rotate-image",
    type: "dsa",
    difficulty: "medium",
    topic: "matrix",
    description: "You are given an `n x n` 2D `matrix` representing an image, rotate the image by 90 degrees (clockwise).\n\nYou have to rotate the image in-place, which means you have to modify the input 2D matrix directly. DO NOT allocate another 2D matrix and do the rotation.",
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]", explanation: "Rotated 90 degrees clockwise." },
    ],
    constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20", "-1000 <= matrix[i][j] <= 1000"],
    starterCode: {
      python: "class Solution:\n    def rotate(self, matrix: list[list[int]]) -> None:\n        pass",
      c: "void rotate(int** matrix, int matrixSize, int* matrixColSize) {\n    \n}",
      cpp: "class Solution {\npublic:\n    void rotate(vector<vector<int>>& matrix) {\n        \n    }\n};",
      java: "class Solution {\n    public void rotate(int[][] matrix) {\n        \n    }\n}",
    },
    testCases: [
      { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[[7,4,1],[8,5,2],[9,6,3]]", isHidden: false },
      { input: "[[1]]", expectedOutput: "[[1]]", isHidden: true },
    ],
  },

  // ─── Bit Manipulation ───
  {
    title: "Number of 1 Bits",
    slug: "number-of-1-bits",
    type: "dsa",
    difficulty: "easy",
    topic: "bit-manipulation",
    description: "Write a function that takes the binary representation of a positive integer and returns the number of set bits it has (also known as the Hamming weight).",
    examples: [
      { input: "n = 11", output: "3", explanation: "Binary of 11 is 1011, which has three set bits." },
      { input: "n = 128", output: "1", explanation: "Binary of 128 is 10000000, which has one set bit." },
    ],
    constraints: ["1 <= n <= 2^31 - 1"],
    starterCode: {
      python: "class Solution:\n    def hammingWeight(self, n: int) -> int:\n        pass",
      c: "int hammingWeight(int n) {\n    \n}",
      cpp: "class Solution {\npublic:\n    int hammingWeight(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int hammingWeight(int n) {\n        \n    }\n}",
    },
    testCases: [
      { input: "11", expectedOutput: "3", isHidden: false },
      { input: "128", expectedOutput: "1", isHidden: false },
      { input: "2147483645", expectedOutput: "30", isHidden: true },
    ],
  },
];

// ─── Aptitude Problems (MCQ style) ───
const aptitudeProblems: ProblemSeed[] = [
  {
    title: "Percentage Increase",
    slug: "percentage-increase",
    type: "aptitude",
    difficulty: "easy",
    topic: "percentages",
    description: "A number is increased by 20% and then decreased by 20%. What is the net change in percentage?\n\n**Options:**\nA) 0%\nB) -4%\nC) 4%\nD) -2%\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "Let x = 100. After 20% increase: 120. After 20% decrease: 120 × 0.8 = 96. Net change = -4%." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
  {
    title: "Profit and Loss: Cost Price",
    slug: "profit-loss-cost-price",
    type: "aptitude",
    difficulty: "easy",
    topic: "profit-loss",
    description: "A shopkeeper sells an article for Rs. 450, making a profit of 25%. What is the cost price of the article?\n\n**Options:**\nA) Rs. 350\nB) Rs. 360\nC) Rs. 375\nD) Rs. 400\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "CP = SP / (1 + profit%) = 450 / 1.25 = 360." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
  {
    title: "Time and Work: Combined Rate",
    slug: "time-work-combined-rate",
    type: "aptitude",
    difficulty: "medium",
    topic: "time-work",
    description: "A can do a piece of work in 10 days and B can do it in 15 days. In how many days can they complete the work together?\n\n**Options:**\nA) 5 days\nB) 6 days\nC) 7 days\nD) 8 days\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "A's rate = 1/10, B's rate = 1/15. Combined = 1/10 + 1/15 = 1/6. So 6 days." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
  {
    title: "Speed, Distance and Time",
    slug: "speed-distance-time",
    type: "aptitude",
    difficulty: "easy",
    topic: "time-speed-distance",
    description: "A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?\n\n**Options:**\nA) 30 km/h\nB) 36 km/h\nC) 40 km/h\nD) 45 km/h\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "Speed = 150/15 = 10 m/s = 10 × 18/5 = 36 km/h." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
  {
    title: "Number Series Pattern",
    slug: "number-series-pattern",
    type: "aptitude",
    difficulty: "easy",
    topic: "number-series",
    description: "What is the next number in the series: 2, 6, 12, 20, 30, ?\n\n**Options:**\nA) 40\nB) 42\nC) 44\nD) 48\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "Pattern: n(n+1). 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
  {
    title: "Probability: Dice Roll",
    slug: "probability-dice-roll",
    type: "aptitude",
    difficulty: "medium",
    topic: "probability",
    description: "Two dice are thrown simultaneously. What is the probability of getting a sum of 7?\n\n**Options:**\nA) 1/9\nB) 1/6\nC) 5/36\nD) 7/36\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "Favorable outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. Total = 36. P = 6/36 = 1/6." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
  {
    title: "Permutations Count",
    slug: "permutations-count",
    type: "aptitude",
    difficulty: "medium",
    topic: "permutations-combinations",
    description: "In how many ways can the letters of the word 'LEADER' be arranged?\n\n**Options:**\nA) 360\nB) 720\nC) 240\nD) 120\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "A", explanation: "LEADER has 6 letters with E repeated twice. Arrangements = 6!/2! = 720/2 = 360." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "A", isHidden: false },
    ],
  },
  {
    title: "Logical Reasoning: Seating Arrangement",
    slug: "logical-reasoning-seating",
    type: "aptitude",
    difficulty: "medium",
    topic: "logical-reasoning",
    description: "Five friends A, B, C, D, E sit in a row. B sits to the right of A. C sits at one of the ends. D is not adjacent to C. Who sits in the middle?\n\n**Options:**\nA) A\nB) B\nC) D\nD) E\n\n**Output the correct option letter.**",
    examples: [
      { input: "", output: "B", explanation: "One valid arrangement: C, A, B, E, D. B sits in the middle." },
    ],
    constraints: ["Output a single letter: A, B, C, or D"],
    starterCode: {
      python: "class Solution:\n    def solve(self) -> str:\n        # Return 'A', 'B', 'C', or 'D'\n        pass",
      c: "char solve() {\n    // Return 'A', 'B', 'C', or 'D'\n}",
      cpp: "class Solution {\npublic:\n    char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n};",
      java: "class Solution {\n    public char solve() {\n        // Return 'A', 'B', 'C', or 'D'\n    }\n}",
    },
    testCases: [
      { input: "", expectedOutput: "B", isHidden: false },
    ],
  },
];

// ─── Seed function ───
async function seed() {
  const allProblems = [...dsaProblems, ...aptitudeProblems];

  console.log(`Seeding ${allProblems.length} problems to Firestore...`);

  let count = 0;
  for (const problem of allProblems) {
    const xpReward = problem.difficulty === "easy" ? 10 : problem.difficulty === "medium" ? 25 : 50;
    const companies = getCompaniesForTopic(problem.topic);

    const ref = doc(collection(db, "problems"));
    await setDoc(ref, {
      ...problem,
      xpReward,
      companies,
      successRate: Math.floor(Math.random() * 40) + 40, // 40-80%
      totalSubmissions: Math.floor(Math.random() * 5000) + 500,
      totalAccepted: Math.floor(Math.random() * 3000) + 200,
      createdAt: new Date(),
    });

    count++;
    console.log(`  [${count}/${allProblems.length}] ${problem.title} (${problem.type}/${problem.topic}/${problem.difficulty})`);
  }

  console.log(`\nDone! Seeded ${count} problems.`);
  console.log(`  DSA: ${dsaProblems.length}`);
  console.log(`  Aptitude: ${aptitudeProblems.length}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
