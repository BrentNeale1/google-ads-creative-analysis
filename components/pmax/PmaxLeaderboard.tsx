"use client";

import type { TieredCreative, PrimaryKpi } from "@/lib/analysis/types";
import type { PortfolioAvg } from "@/lib/queries/pmax";
import {
  formatNumber,
  formatPercentage,
  formatCurrency,
} from "@/lib/constants/formatting";

export interface PmaxLeaderboardProps {
  tieredCreatives: TieredCreative[];
  portfolioAvg: PortfolioAvg;
  kpiType: PrimaryKpi;
}

/** Badge component for tier labels */
function TierBadge({ tier }: { tier: "top" | "middle" | "bottom" }) {
  const styles = {
    top: "bg-[#34A853]/10 text-[#34A853]",
    middle: "bg-[#FBBC04]/10 text-[#9A7400]",
    bottom: "bg-[#EA4335]/10 text-[#EA4335]",
  };
  const labels = { top: "Top", middle: "Mid", bottom: "Low" };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[tier]}`}
    >
      {labels[tier]}
    </span>
  );
}

/**
 * PMax asset group leaderboard tables with tier-highlighted rows
 * and portfolio average context row.
 * Shows asset group name (not headline text) as the primary identifier.
 */
export function PmaxLeaderboard({
  tieredCreatives,
  portfolioAvg,
  kpiType,
}: PmaxLeaderboardProps) {
  const formatKpi =
    kpiType === "cpa"
      ? formatCurrency
      : (v: number) => `${v.toFixed(2)}x`;

  // Top performers: sorted by KPI (best first)
  const topCreatives = tieredCreatives
    .filter((c) => c.tier === "top")
    .sort((a, b) =>
      kpiType === "cpa" ? a.kpiValue - b.kpiValue : b.kpiValue - a.kpiValue,
    )
    .slice(0, 5);

  // Bottom performers: sorted by KPI (worst first)
  const bottomCreatives = tieredCreatives
    .filter((c) => c.tier === "bottom")
    .sort((a, b) =>
      kpiType === "cpa" ? b.kpiValue - a.kpiValue : a.kpiValue - b.kpiValue,
    )
    .slice(0, 5);

  const kpiLabel = kpiType.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Top Performers Table */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Top Asset Groups
        </h3>
        <LeaderboardTable
          creatives={topCreatives}
          portfolioAvg={portfolioAvg}
          kpiType={kpiType}
          kpiLabel={kpiLabel}
          formatKpi={formatKpi}
          highlightClass="bg-[#E6F4EA]"
        />
      </section>

      {/* Underperformers Table */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Underperforming Asset Groups
        </h3>
        <LeaderboardTable
          creatives={bottomCreatives}
          portfolioAvg={portfolioAvg}
          kpiType={kpiType}
          kpiLabel={kpiLabel}
          formatKpi={formatKpi}
          highlightClass="bg-[#FCE8E6]"
        />
      </section>
    </div>
  );
}

interface LeaderboardTableProps {
  creatives: TieredCreative[];
  portfolioAvg: PortfolioAvg;
  kpiType: PrimaryKpi;
  kpiLabel: string;
  formatKpi: (v: number) => string;
  highlightClass: string;
}

function LeaderboardTable({
  creatives,
  portfolioAvg,
  kpiType,
  kpiLabel,
  formatKpi,
  highlightClass,
}: LeaderboardTableProps) {
  if (creatives.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-gridline p-6 text-center">
        <p className="text-sm text-gray-400">
          No asset groups in this tier
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-gridline overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F1F3F4]">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                Asset Group
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                Campaign
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                Tier
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
                {kpiLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {creatives.map((creative) => (
              <tr
                key={creative.adId}
                className={`border-b border-surface-gridline ${highlightClass}`}
              >
                <td className="px-4 py-3 text-sm text-left">
                  <div className="text-sm text-gray-900 truncate max-w-[240px]">
                    {String(creative.assetGroupName ?? creative.adId)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-left">
                  <div className="text-xs text-gray-500 truncate max-w-[180px]">
                    {String(creative.campaignName ?? "")}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-left">
                  <TierBadge tier={creative.tier} />
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatNumber(Number(creative.impressions) || 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatNumber(Number(creative.clicks) || 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatPercentage(Number(creative.ctr) || 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {(Number(creative.conversions) || 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {formatKpi(creative.kpiValue)}
                </td>
              </tr>
            ))}

            {/* Portfolio Average row */}
            <tr className="border-t-2 border-surface-gridline bg-[#F8F9FA]">
              <td className="px-4 py-3 text-sm text-left font-medium text-gray-600">
                Portfolio Avg
              </td>
              <td className="px-4 py-3 text-sm text-left">
                <span className="text-xs text-gray-400">--</span>
              </td>
              <td className="px-4 py-3 text-sm text-left">
                <span className="text-xs text-gray-400">--</span>
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {formatNumber(Math.round(portfolioAvg.avgImpressions))}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                --
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {formatPercentage(portfolioAvg.avgCtr)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                --
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600 font-medium">
                {kpiType === "cpa"
                  ? formatCurrency(portfolioAvg.avgCpa)
                  : "--"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
