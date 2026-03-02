"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { PatternResult, PrimaryKpi, CopyTheme } from "@/lib/analysis/types";

export interface PatternChartsProps {
  patterns: PatternResult[];
  insightTitle: string;
  kpiType: PrimaryKpi;
  formatKpi: (v: number) => string;
}

/** Human-readable labels for copy themes */
const THEME_LABELS: Record<CopyTheme, string> = {
  urgency: "Urgency",
  social_proof: "Social Proof",
  benefit_led: "Benefit-led",
  feature_led: "Feature-led",
  price_offer: "Price/Offer",
  cta_direct: "Direct CTA",
  stats_numbers: "Stats/Numbers",
};

/**
 * Copy theme analysis charts with insight-led titles.
 * Horizontal bar chart showing average KPI by copy theme,
 * sorted by performance with colour coding.
 */
export function PatternCharts({
  patterns,
  insightTitle,
  kpiType,
  formatKpi,
}: PatternChartsProps) {
  // Sort patterns: for CPA, lowest (best) first; for ROAS, highest (best) first
  const sorted = useMemo(() => {
    const s = [...patterns].sort((a, b) =>
      kpiType === "cpa" ? a.avgKpi - b.avgKpi : b.avgKpi - a.avgKpi,
    );
    return s;
  }, [patterns, kpiType]);

  const chartData = useMemo(
    () =>
      sorted.map((p) => ({
        theme: THEME_LABELS[p.theme] ?? p.theme,
        value: p.avgKpi,
        count: p.count,
      })),
    [sorted],
  );

  // Determine bar colours: top = green, middle = blue, worst = red
  const getBarColour = (index: number): string => {
    if (chartData.length === 0) return "#1A73E8";
    if (index === 0) return "#34A853"; // best performing
    if (index === chartData.length - 1 && chartData.length > 1) return "#EA4335"; // worst performing
    return "#1A73E8"; // middle
  };

  if (patterns.length === 0) {
    return (
      <div className="bg-[#F8F9FA] rounded-xl border border-surface-gridline p-6 text-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Creative Performance by Copy Theme
        </h3>
        <p className="text-sm text-gray-400">
          Not enough data to detect meaningful patterns. At least 3 creatives
          per theme are required for reliable analysis.
        </p>
      </div>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 50 + 40);

  return (
    <div className="bg-[#F8F9FA] rounded-xl border border-surface-gridline p-6 shadow-sm">
      {/* Insight-led title */}
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        {insightTitle}
      </h3>

      {/* Horizontal bar chart */}
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8EAED"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(v) => formatKpi(v)}
              tick={{ fontSize: 12, fill: "#9AA0A6" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="theme"
              width={100}
              tick={{ fontSize: 13, fill: "#374151" }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getBarColour(index)} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: number) => formatKpi(v)}
                style={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Theme distribution */}
      <div className="mt-4 pt-4 border-t border-surface-gridline">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Theme Distribution
        </h4>
        <div className="flex flex-wrap gap-3">
          {sorted.map((p, idx) => (
            <div
              key={p.theme}
              className="flex items-center gap-1.5 text-sm text-gray-600"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getBarColour(idx) }}
              />
              <span>{THEME_LABELS[p.theme] ?? p.theme}:</span>
              <span className="font-medium">{p.count} creatives</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
