"use client";

import { useState } from "react";
import { METRICS, type MetricKey } from "@/lib/constants/metrics";
import type { TimeSeriesRow, CreativeRow } from "@/lib/queries/dashboard";
import { MetricTabs } from "./MetricTabs";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { CreativeBarChart } from "./CreativeBarChart";

export interface ChartSectionProps {
  /** Full daily time-series data with all metrics per day */
  timeSeries: TimeSeriesRow[];
  /** Creative comparison data with all metrics per creative */
  creatives: CreativeRow[];
}

/**
 * Chart section with synced metric tabs, time-series line chart,
 * and horizontal bar chart for creative comparison.
 * Uses local useState for metric selection to avoid server re-render.
 */
export function ChartSection({ timeSeries, creatives }: ChartSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("conversions");

  const metric = METRICS[selectedMetric];

  // Transform time-series data to single-metric shape for the line chart
  const lineData = timeSeries.map((d) => ({
    date: d.date,
    value: metric.computeFromTotals(d),
  }));

  // Transform creative data to single-metric shape for the bar chart
  const barData = creatives.map((c) => ({
    name: c.name,
    value: metric.computeFromTotals(c),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Trend (Line Chart) */}
      <section className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Performance Trend
        </h2>
        <MetricTabs
          activeMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
        {lineData.length > 0 ? (
          <TimeSeriesChart
            data={lineData}
            formatValue={metric.formatCompact}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[300px] text-sm text-gray-400">
            No data for the selected period
          </div>
        )}
      </section>

      {/* Creative Comparison (Bar Chart) */}
      <section className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Creative Comparison
        </h2>
        <MetricTabs
          activeMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
        {barData.length > 0 ? (
          <CreativeBarChart
            data={barData}
            formatValue={metric.formatCompact}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[300px] text-sm text-gray-400">
            No creative data for the selected filters
          </div>
        )}
      </section>
    </div>
  );
}
