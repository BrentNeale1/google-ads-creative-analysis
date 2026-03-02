"use client";

import type { PatternResult, PrimaryKpi } from "@/lib/analysis/types";

export interface PatternChartsProps {
  patterns: PatternResult[];
  insightTitle: string;
  kpiType: PrimaryKpi;
  formatKpi: (v: number) => string;
}

/**
 * Placeholder -- full implementation in Task 3.
 * Copy theme analysis charts with insight-led titles.
 */
export function PatternCharts({
  patterns,
  insightTitle,
  kpiType,
  formatKpi,
}: PatternChartsProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-6">
      <p className="text-sm text-gray-400">
        Pattern charts loading... ({patterns.length} patterns, title: {insightTitle}, KPI: {kpiType}, format: {formatKpi(0)})
      </p>
    </div>
  );
}
