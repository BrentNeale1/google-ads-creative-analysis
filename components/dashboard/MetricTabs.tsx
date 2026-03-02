"use client";

import { METRICS, type MetricKey } from "@/lib/constants/metrics";

const METRIC_KEYS: MetricKey[] = [
  "impressions",
  "clicks",
  "ctr",
  "conversions",
  "cpa",
  "roas",
];

export interface MetricTabsProps {
  /** Currently selected metric */
  activeMetric: MetricKey;
  /** Callback when user selects a metric */
  onMetricChange: (metric: MetricKey) => void;
}

/**
 * Client-side metric selector tabs.
 * Uses local state (not URL params) to prevent full server re-render on tab switch.
 */
export function MetricTabs({ activeMetric, onMetricChange }: MetricTabsProps) {
  return (
    <div className="flex items-center gap-1 mb-3">
      {METRIC_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onMetricChange(key)}
          className={
            activeMetric === key
              ? "bg-brand-blue text-white px-3 py-1.5 rounded-md text-sm font-medium"
              : "text-gray-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-surface-background"
          }
        >
          {METRICS[key].label}
        </button>
      ))}
    </div>
  );
}
