"use client";

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
import type { PrimaryKpi } from "@/lib/analysis/types";

interface QuartileCreative {
  tier?: string;
  videoQuartileP25Rate?: unknown;
  videoQuartileP50Rate?: unknown;
  videoQuartileP75Rate?: unknown;
  videoQuartileP100Rate?: unknown;
}

export interface VideoEngagementChartProps {
  creatives: QuartileCreative[];
  kpiType: PrimaryKpi;
}

/** Compute average of a numeric field across creatives */
function avgField(
  creatives: QuartileCreative[],
  field: keyof QuartileCreative,
): number {
  if (creatives.length === 0) return 0;
  const total = creatives.reduce(
    (sum, c) => sum + (Number(c[field]) || 0),
    0,
  );
  return total / creatives.length;
}

/** Interpret completion rate for insight text */
function completionInsight(p100: number): string {
  if (p100 > 0.3) return "strong retention";
  if (p100 >= 0.1) return "typical retention";
  return "low completion -- consider shorter or more compelling content";
}

/**
 * Video quartile completion funnel chart.
 * Shows average P25 -> P50 -> P75 -> P100 completion rates
 * as a horizontal bar chart, naturally decreasing from P25 to P100.
 * Includes top tier vs bottom tier comparison when data is available.
 */
export function VideoEngagementChart({
  creatives,
  kpiType,
}: VideoEngagementChartProps) {
  // Compute average quartile rates across all creatives
  const avgP25 = avgField(creatives, "videoQuartileP25Rate");
  const avgP50 = avgField(creatives, "videoQuartileP50Rate");
  const avgP75 = avgField(creatives, "videoQuartileP75Rate");
  const avgP100 = avgField(creatives, "videoQuartileP100Rate");

  const chartData = [
    { name: "25% watched", value: avgP25, pct: `${(avgP25 * 100).toFixed(1)}%` },
    { name: "50% watched", value: avgP50, pct: `${(avgP50 * 100).toFixed(1)}%` },
    { name: "75% watched", value: avgP75, pct: `${(avgP75 * 100).toFixed(1)}%` },
    { name: "Completed", value: avgP100, pct: `${(avgP100 * 100).toFixed(1)}%` },
  ];

  // Top tier vs bottom tier comparison
  const topTier = creatives.filter((c) => c.tier === "top");
  const bottomTier = creatives.filter((c) => c.tier === "bottom");

  const topP100 = avgField(topTier, "videoQuartileP100Rate");
  const bottomP100 = avgField(bottomTier, "videoQuartileP100Rate");
  const hasComparison = topTier.length > 0 && bottomTier.length > 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-surface-gridline p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Quartile Completion Funnel
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Average viewer retention across all video creatives
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            barCategoryGap="25%"
          >
            <CartesianGrid
              stroke="#E8EAED"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 1]}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 12, fill: "#9AA0A6" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12, fill: "#374151" }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill="#1A73E8" />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                style={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Insight text */}
        <div className="mt-4 pt-4 border-t border-surface-gridline">
          <p className="text-sm text-gray-700">
            <span className="font-medium">
              Average completion rate: {(avgP100 * 100).toFixed(1)}%
            </span>
            {" -- "}
            {completionInsight(avgP100)}
          </p>
        </div>

        {/* Top vs bottom tier comparison */}
        {hasComparison && (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="bg-[#E6F4EA] rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">
                Top tier completion
              </p>
              <p className="text-lg font-semibold text-[#34A853]">
                {(topP100 * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#FCE8E6] rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">
                Bottom tier completion
              </p>
              <p className="text-lg font-semibold text-[#EA4335]">
                {(bottomP100 * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
