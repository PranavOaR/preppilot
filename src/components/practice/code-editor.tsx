"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const codeLines = [
  "# Binary search optimization for O(log(m+n))",
  "class Solution:",
  "    def findMedianSortedArrays(self, nums1, nums2):",
  "        A, B = nums1, nums2",
  "        total = len(A) + len(B)",
  "        half = total // 2",
  "",
  "        if len(B) < len(A):",
  "            A, B = B, A",
  "        // Start binary search logic here...",
];

const editorTabs = ["Solution.py", "Console"];

export function CodeEditor() {
  const [activeTab, setActiveTab] = useState("Solution.py");

  return (
    <div className="rounded-lg bg-surface-container-lowest subtle-border overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-b border-outline-variant/10">
        <div className="flex items-center gap-1">
          {editorTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-surface-container-high text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="text-outline text-xs">Python 3.10</span>
      </div>

      {/* Code Area */}
      <div className="p-4 font-mono text-sm leading-6 overflow-x-auto">
        {codeLines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 shrink-0 text-right text-outline/50 select-none pr-4">
              {i + 1}
            </span>
            <span
              className={
                line.startsWith("#") || line.startsWith("//")
                  ? "text-outline"
                  : line.includes("class ") || line.includes("def ")
                    ? "text-primary-brand"
                    : "text-on-surface"
              }
            >
              {line || "\u00A0"}
            </span>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 bg-surface-container border-t border-outline-variant/10">
        <Button
          variant="ghost"
          className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-sm h-9 cursor-pointer"
        >
          Run Tests
        </Button>
        <Button className="gradient-primary text-on-primary font-medium px-5 h-9 hover:opacity-90 transition-opacity text-sm cursor-pointer">
          Submit
        </Button>
      </div>
    </div>
  );
}
