"use client";

import type { TooltipProps } from "recharts";

export interface ChartTooltipProps
  extends TooltipProps<number, string> {
  /** Formatter for the metric value */
  formatValue: (v: number) => string;
  /** Sum of all values in the dataset, used for percentage of total */
  total: number;
}

/**
 * Custom Recharts tooltip showing date, AU-formatted metric value,
 * and percentage of total.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  total,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const dateStr = (() => {
    try {
      return new Date(label as string).toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return String(label);
    }
  })();

  return (
    <div className="bg-white rounded-lg shadow-lg border border-surface-gridline p-3">
      <p className="text-xs text-gray-500 mb-1">{dateStr}</p>
      {payload.map((entry, idx) => {
        const val = entry.value as number;
        const pctOfTotal =
          total === 0
            ? "\u2014"
            : `${(val / total * 100).toLocaleString("en-AU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% of total`;

        return (
          <div key={idx}>
            {payload.length > 1 && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <p className="text-sm font-semibold">{formatValue(val)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{pctOfTotal}</p>
          </div>
        );
      })}
    </div>
  );
}
