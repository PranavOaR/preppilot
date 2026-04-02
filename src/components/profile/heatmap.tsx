"use client";

import { useMemo, useState } from "react";

interface HeatmapProps {
  data: { date: string; count: number }[];
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getColor(count: number): string {
  if (count === 0) return "var(--color-surface-container)";
  if (count === 1) return "#14532d"; // green-900
  if (count <= 3) return "#16a34a"; // green-600
  if (count <= 5) return "#22c55e"; // green-500
  return "#4ade80"; // green-400
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function Heatmap({ data }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const { grid, monthLabels, totalContributions } = useMemo(() => {
    const countMap = new Map<string, number>();
    let total = 0;
    data.forEach((d) => {
      countMap.set(d.date, d.count);
      total += d.count;
    });

    const today = new Date();
    const weeks: { date: Date; count: number }[][] = [];

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

    // Align startDate to a Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let current = new Date(startDate);
    let currentWeek: { date: Date; count: number }[] = [];

    while (current <= today) {
      const dateStr = formatDate(current);
      currentWeek.push({
        date: new Date(current),
        count: countMap.get(dateStr) || 0,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Build month labels with column positions
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      const month = firstDay.date.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTH_LABELS[month], col: i });
        lastMonth = month;
      }
    });

    return { grid: weeks, monthLabels: labels, totalContributions: total };
  }, [data]);

  const cellSize = 12;
  const cellGap = 3;
  const leftPadding = 32;
  const topPadding = 20;
  const totalWidth = leftPadding + grid.length * (cellSize + cellGap);
  const totalHeight = topPadding + 7 * (cellSize + cellGap);

  return (
    <div className="space-y-3">
      <p className="text-on-surface-variant text-xs">
        <span className="text-on-surface font-medium">{totalContributions}</span> contributions in the last year
      </p>

      <div className="relative overflow-x-auto">
        <svg
          width={totalWidth}
          height={totalHeight}
          className="block"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={`${m.label}-${i}`}
              x={leftPadding + m.col * (cellSize + cellGap)}
              y={12}
              className="fill-on-surface-variant"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={label}
                x={0}
                y={topPadding + i * (cellSize + cellGap) + cellSize - 1}
                className="fill-on-surface-variant"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Grid cells */}
          {grid.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const x = leftPadding + weekIdx * (cellSize + cellGap);
              const y = topPadding + dayIdx * (cellSize + cellGap);
              return (
                <rect
                  key={`${weekIdx}-${dayIdx}`}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  style={{ fill: getColor(day.count) }}
                  className="transition-colors cursor-pointer"
                  onMouseEnter={() => {
                    const formatted = day.date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    setTooltip({
                      text: `${day.count} contribution${day.count !== 1 ? "s" : ""} on ${formatted}`,
                      x: x + cellSize / 2,
                      y: y - 8,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-surface-container-highest text-on-surface text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap subtle-border"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <span>Less</span>
        {[0, 1, 3, 5, 6].map((count) => (
          <div
            key={count}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(count) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
