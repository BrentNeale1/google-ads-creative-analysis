"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export interface MetricCardDelta {
  value: number;
  direction: "up" | "down" | "flat";
}

export interface MetricCardProps {
  /** Metric display label (e.g. "Impressions", "CTR") */
  label: string;
  /** Pre-formatted metric value */
  value: string;
  /** Period-over-period delta, or null if no comparison data */
  delta: MetricCardDelta | null;
  /** True for cost metrics (CPA) where a decrease is positive */
  invertColour?: boolean;
}

/** Single KPI metric card with value and colour-coded delta arrow. */
export function MetricCard({
  label,
  value,
  delta,
  invertColour = false,
}: MetricCardProps) {
  const getColour = (dir: "up" | "down" | "flat") => {
    if (dir === "flat") return "text-brand-grey";
    const isPositive = invertColour ? dir === "down" : dir === "up";
    return isPositive ? "text-brand-green" : "text-brand-red";
  };

  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUp
      : delta?.direction === "down"
        ? ArrowDown
        : Minus;

  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {delta && (
        <div
          className={`flex items-center gap-1 mt-1 text-sm ${getColour(delta.direction)}`}
        >
          <DeltaIcon size={14} />
          <span>{delta.value.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
