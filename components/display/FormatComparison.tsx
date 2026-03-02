"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { PrimaryKpi } from "@/lib/analysis/types";
import type { DisplayFormatRow } from "@/lib/queries/display";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/constants/formatting";

export interface FormatComparisonProps {
  formatBreakdown: DisplayFormatRow[];
  kpiType: PrimaryKpi;
}

/**
 * Compute an insight-led title from the format breakdown data.
 * Compares the best-performing ad type against others by the primary KPI.
 */
function computeInsightTitle(
  data: DisplayFormatRow[],
  kpiType: PrimaryKpi,
): string {
  if (data.length < 2) {
    return "Display Format Performance by Ad Type";
  }

  // Sort: for CPA, lowest is best; for ROAS, highest is best
  const sorted = [...data].sort((a, b) =>
    kpiType === "cpa" ? a.cpa - b.cpa : b.roas - a.roas,
  );

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (kpiType === "cpa") {
    if (worst.cpa === 0) return "Display Format Performance by Ad Type";
    const pctDiff = Math.round(
      ((worst.cpa - best.cpa) / worst.cpa) * 100,
    );
    if (pctDiff <= 5) return "Display Format Performance by Ad Type";
    return `${best.adType} ads achieve ${pctDiff}% lower CPA`;
  } else {
    if (worst.roas === 0) return "Display Format Performance by Ad Type";
    const multiplier = (best.roas / worst.roas).toFixed(1);
    if (best.roas <= worst.roas * 1.05)
      return "Display Format Performance by Ad Type";
    return `${best.adType} ads deliver ${multiplier}x higher ROAS`;
  }
}

/**
 * Format comparison chart and table for Display ads (DISP-03).
 * Horizontal bar chart comparing the primary KPI across ad types,
 * with a summary table below showing all metrics per format.
 */
export function FormatComparison({
  formatBreakdown,
  kpiType,
}: FormatComparisonProps) {
  const formatKpi =
    kpiType === "cpa"
      ? formatCurrency
      : (v: number) => `${v.toFixed(2)}x`;

  // Sort data: for CPA, ascending (lower is better); for ROAS, descending (higher is better)
  const sorted = useMemo(() => {
    return [...formatBreakdown].sort((a, b) =>
      kpiType === "cpa" ? a.cpa - b.cpa : b.roas - a.roas,
    );
  }, [formatBreakdown, kpiType]);

  const chartData = useMemo(
    () =>
      sorted.map((row) => ({
        adType: row.adType,
        value: kpiType === "cpa" ? row.cpa : row.roas,
      })),
    [sorted, kpiType],
  );

  const insightTitle = useMemo(
    () => computeInsightTitle(formatBreakdown, kpiType),
    [formatBreakdown, kpiType],
  );

  if (formatBreakdown.length === 0) {
    return (
      <div className="bg-[#F8F9FA] rounded-xl border border-surface-gridline p-6 text-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Format Comparison
        </h3>
        <p className="text-sm text-gray-400">
          No Display ad data available for format comparison.
        </p>
      </div>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 60 + 40);

  return (
    <div className="space-y-6">
      {/* Horizontal bar chart */}
      <div className="bg-[#F8F9FA] rounded-xl border border-surface-gridline p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {insightTitle}
        </h3>

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
                dataKey="adType"
                width={160}
                tick={{ fontSize: 13, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <Bar
                dataKey="value"
                fill="#1A73E8"
                radius={[0, 4, 4, 0]}
                barSize={32}
              >
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
      </div>

      {/* Summary table with all metrics per format */}
      <div className="bg-white rounded-xl border border-surface-gridline overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-surface-gridline">
          <h3 className="text-sm font-semibold text-gray-900">
            Format Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F1F3F4]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                  Ad Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  Impr.
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  Clicks
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  CTR
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  Conv.
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  CPA
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                // Highlight best and worst rows
                const isBest = idx === 0 && sorted.length > 1;
                const isWorst =
                  idx === sorted.length - 1 && sorted.length > 1;
                const rowBg = isBest
                  ? "bg-[#E6F4EA]"
                  : isWorst
                    ? "bg-[#FCE8E6]"
                    : "";

                return (
                  <tr
                    key={row.adType}
                    className={`border-b border-surface-gridline ${rowBg}`}
                  >
                    <td className="px-4 py-3 text-sm text-left font-medium text-gray-900">
                      {row.adType}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(row.impressions)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(row.clicks)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatPercentage(row.ctr)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {row.conversions.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(row.cpa)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {row.roas.toFixed(2)}x
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
