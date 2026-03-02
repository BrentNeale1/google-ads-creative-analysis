"use client";

import type { RsaAssetAggregated } from "@/lib/queries/rsa";
import type { PrimaryKpi } from "@/lib/analysis/types";

export interface AssetPerformanceProps {
  assets: RsaAssetAggregated[];
  kpiType: PrimaryKpi;
}

/**
 * Placeholder -- full implementation in Task 2.
 * RSA asset-level performance table showing headline and description metrics.
 */
export function AssetPerformance({ assets, kpiType }: AssetPerformanceProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-6">
      <p className="text-sm text-gray-400">
        Asset performance loading... ({assets.length} assets, KPI: {kpiType})
      </p>
    </div>
  );
}
