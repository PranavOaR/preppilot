"use client";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";

export function ProblemDetail() {
  return (
    <div className="rounded-lg bg-surface-container subtle-border overflow-hidden">
      {/* Problem Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h3 className="text-on-surface text-lg font-medium">
            Median of Two Sorted Arrays
          </h3>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-error-container/30 text-error-brand">
            Hard
          </span>
          <span className="text-outline text-xs">&bull; 4 ms (Average)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">
              schedule
            </span>
            <time className="font-mono text-sm">00:14:52</time>
          </div>
          <Button className="gradient-primary text-on-primary font-medium px-4 h-9 hover:opacity-90 transition-opacity text-sm cursor-pointer">
            Submit Solution
          </Button>
        </div>
      </div>

      {/* Content: Description + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Problem Description */}
        <div className="p-6 space-y-5 border-r border-outline-variant/10 overflow-y-auto max-h-[500px]">
          <div className="space-y-3">
            <h4 className="text-on-surface text-sm font-medium uppercase tracking-wider">
              Problem Description
            </h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Given two sorted arrays{" "}
              <code className="font-mono text-primary-brand bg-surface-container-lowest px-1.5 py-0.5 rounded text-xs">
                nums1
              </code>{" "}
              and{" "}
              <code className="font-mono text-primary-brand bg-surface-container-lowest px-1.5 py-0.5 rounded text-xs">
                nums2
              </code>{" "}
              of size{" "}
              <code className="font-mono text-primary-brand bg-surface-container-lowest px-1.5 py-0.5 rounded text-xs">
                m
              </code>{" "}
              and{" "}
              <code className="font-mono text-primary-brand bg-surface-container-lowest px-1.5 py-0.5 rounded text-xs">
                n
              </code>{" "}
              respectively, return the median of the two sorted arrays.
            </p>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              The overall run time complexity should be{" "}
              <code className="font-mono text-primary-brand bg-surface-container-lowest px-1.5 py-0.5 rounded text-xs">
                O(log (m+n))
              </code>
              .
            </p>
          </div>

          {/* Example */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-container-lowest">
            <p className="text-on-surface text-sm font-medium">Example 1:</p>
            <div className="font-mono text-xs space-y-1 text-on-surface-variant">
              <p>
                <span className="text-outline">Input:</span> nums1 = [1,3],
                nums2 = [2]
              </p>
              <p>
                <span className="text-outline">Output:</span> 2.00000
              </p>
              <p>
                <span className="text-outline">Explanation:</span> merged array
                = [1,2,3] and median is 2.
              </p>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <h5 className="text-on-surface text-sm font-medium">
              Constraints:
            </h5>
            <ul className="space-y-1 text-on-surface-variant text-xs font-mono">
              <li>
                &bull; nums1.length == m
              </li>
              <li>
                &bull; nums2.length == n
              </li>
              <li>
                &bull; 0 &lt;= m, n &lt;= 1000
              </li>
              <li>
                &bull; -10<sup>6</sup> &lt;= nums1[i], nums2[i] &lt;= 10
                <sup>6</sup>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Code Editor */}
        <div>
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}
