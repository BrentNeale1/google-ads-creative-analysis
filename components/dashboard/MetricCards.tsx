"use client";

import { METRICS, type MetricKey } from "@/lib/constants/metrics";
import type { KpiTotals } from "@/lib/queries/dashboard";
import { MetricCard, type MetricCardDelta } from "./MetricCard";

const METRIC_ORDER: MetricKey[] = [
  "impressions",
  "clicks",
  "ctr",
  "conversions",
  "cpa",
  "roas",
];

export interface MetricCardsProps {
  /** Aggregated KPI totals for the current period */
  current: KpiTotals;
  /** Aggregated KPI totals for the comparison period, or null if unavailable */
  comparison: KpiTotals | null;
}

/** Responsive grid of 6 metric cards with computed deltas. */
export function MetricCards({ current, comparison }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {METRIC_ORDER.map((key) => {
        const metric = METRICS[key];
        const currentValue = metric.computeFromTotals(current);
        const formattedValue = metric.format(currentValue);

        let delta: MetricCardDelta | null = null;
        if (comparison) {
          const prevValue = metric.computeFromTotals(comparison);
          if (prevValue === 0) {
            delta = null;
          } else {
            const pctChange = ((currentValue - prevValue) / prevValue) * 100;
            delta = {
              value: Math.abs(pctChange),
              direction:
                pctChange > 0 ? "up" : pctChange < 0 ? "down" : "flat",
            };
          }
        }

        return (
          <MetricCard
            key={key}
            label={metric.label}
            value={formattedValue}
            delta={delta}
            invertColour={metric.invertColour}
          />
        );
      })}
    </div>
  );
}
