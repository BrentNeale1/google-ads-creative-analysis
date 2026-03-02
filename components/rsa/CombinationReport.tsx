"use client";

import { useMemo } from "react";
import type { RsaCombinationAggregated } from "@/lib/queries/rsa";
import { formatNumber, formatPercentage } from "@/lib/constants/formatting";

export interface CombinationReportProps {
  combinations: RsaCombinationAggregated[];
}

/** Parse JSONB headline/description array into displayable strings */
function parseTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "string" ? item : (item as { text?: string })?.text ?? "",
    )
    .filter(Boolean);
}

/**
 * RSA headline+description combination report.
 * CRITICAL: Impressions only -- Google does not provide click or conversion
 * data for asset combinations. Prominent caveat banner at top.
 */
export function CombinationReport({ combinations }: CombinationReportProps) {
  // Sort by impressions descending
  const sorted = useMemo(
    () => [...combinations].sort((a, b) => b.impressions - a.impressions),
    [combinations],
  );

  // Compute total impressions for share calculation
  const totalImpressions = useMemo(
    () => sorted.reduce((sum, c) => sum + c.impressions, 0),
    [sorted],
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-gridline p-6 text-center">
        <p className="text-sm text-gray-400">
          No combination data available for this period
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prominent caveat banner */}
      <div className="bg-[#FEF7E0] border border-[#FBBC04]/30 rounded-lg px-4 py-3">
        <p className="text-sm font-medium text-[#9A7400]">
          Top combinations reported by Google -- impressions only.
        </p>
        <p className="text-xs text-[#9A7400] mt-1">
          Click and conversion data is not available for combinations. Use this
          data directionally to understand which asset pairings Google serves
          most frequently.
        </p>
      </div>

      {/* Combination table */}
      <div className="bg-white rounded-xl border border-surface-gridline overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F1F3F4]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                  Headlines
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                  Descriptions
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  Impressions
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                  Share of Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((combo, idx) => {
                const headlines = parseTextArray(combo.headlines);
                const descriptions = parseTextArray(combo.descriptions);
                const share =
                  totalImpressions > 0
                    ? combo.impressions / totalImpressions
                    : 0;

                return (
                  <tr
                    key={`${combo.adId}-${idx}`}
                    className="border-b border-surface-gridline hover:bg-surface-background"
                  >
                    <td className="px-4 py-3 text-sm text-left align-top">
                      <ul className="list-disc list-inside space-y-0.5">
                        {headlines.map((h, i) => (
                          <li key={i} className="text-gray-900 text-sm">
                            {h}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-sm text-left align-top">
                      <ul className="list-disc list-inside space-y-0.5">
                        {descriptions.map((d, i) => (
                          <li key={i} className="text-gray-700 text-sm">
                            {d}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-sm text-right align-top">
                      {formatNumber(combo.impressions)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right align-top">
                      {formatPercentage(share)}
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
