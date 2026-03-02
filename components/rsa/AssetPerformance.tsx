"use client";

import type { RsaAssetAggregated } from "@/lib/queries/rsa";
import type { PrimaryKpi } from "@/lib/analysis/types";
import {
  formatNumber,
  formatPercentage,
  formatCurrency,
} from "@/lib/constants/formatting";

export interface AssetPerformanceProps {
  assets: RsaAssetAggregated[];
  kpiType: PrimaryKpi;
}

/** Performance label badge with colour coding */
function PerformanceBadge({ label }: { label: string | null }) {
  if (!label) return <span className="text-xs text-gray-400">--</span>;

  const styles: Record<string, string> = {
    BEST: "bg-[#34A853]/10 text-[#34A853]",
    GOOD: "bg-[#1A73E8]/10 text-[#1A73E8]",
    LOW: "bg-[#EA4335]/10 text-[#EA4335]",
    LEARNING: "bg-[#FBBC04]/10 text-[#9A7400]",
  };

  const style = styles[label] ?? "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

/**
 * RSA asset-level performance table.
 * Shows headline and description text alongside Google performance labels
 * and actual conversion metrics.
 */
export function AssetPerformance({
  assets,
  kpiType,
}: AssetPerformanceProps) {
  const headlines = assets
    .filter((a) => a.fieldType === "HEADLINE")
    .sort((a, b) => b.impressions - a.impressions);

  const descriptions = assets
    .filter((a) => a.fieldType === "DESCRIPTION")
    .sort((a, b) => b.impressions - a.impressions);

  const kpiLabel = kpiType.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Directional note */}
      <div className="bg-[#FEF7E0] border border-[#FBBC04]/30 rounded-lg px-4 py-3">
        <p className="text-sm text-[#9A7400]">
          Google&apos;s performance labels are directional -- cross-reference
          with conversion data for accurate assessment.
        </p>
      </div>

      {/* Headlines */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Headlines ({headlines.length})
        </h3>
        <AssetTable
          assets={headlines}
          kpiLabel={kpiLabel}
        />
      </section>

      {/* Descriptions */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Descriptions ({descriptions.length})
        </h3>
        <AssetTable
          assets={descriptions}
          kpiLabel={kpiLabel}
        />
      </section>
    </div>
  );
}

interface AssetTableProps {
  assets: RsaAssetAggregated[];
  kpiLabel: string;
}

function AssetTable({ assets, kpiLabel }: AssetTableProps) {
  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-gridline p-6 text-center">
        <p className="text-sm text-gray-400">No assets in this category</p>
      </div>
    );
  }

  // Identify top and bottom by impressions for row highlighting
  const topIdx = 0; // already sorted by impressions desc
  const bottomIdx = assets.length > 1 ? assets.length - 1 : -1;

  return (
    <div className="bg-white rounded-xl border border-surface-gridline overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F1F3F4]">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                Text Content
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left">
                Google Label
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
            {assets.map((asset, idx) => {
              const isTop = idx === topIdx;
              const isBottom = idx === bottomIdx;
              const rowBg = isTop
                ? "bg-[#E6F4EA]"
                : isBottom
                  ? "bg-[#FCE8E6]"
                  : "";

              return (
                <tr
                  key={`${asset.adId}-${asset.assetResource}`}
                  className={`border-b border-surface-gridline ${rowBg}`}
                >
                  <td className="px-4 py-3 text-sm text-left max-w-[350px]">
                    {asset.textContent ? (
                      <span className="text-gray-900">{asset.textContent}</span>
                    ) : (
                      <span className="text-gray-400 italic">
                        {asset.assetResource}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-left">
                    <PerformanceBadge label={asset.performanceLabel} />
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatNumber(asset.impressions)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatNumber(asset.clicks)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatPercentage(asset.ctr)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {asset.conversions.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(asset.cpa)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
