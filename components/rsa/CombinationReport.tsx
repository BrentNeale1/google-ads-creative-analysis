"use client";

import type { RsaCombinationAggregated } from "@/lib/queries/rsa";

export interface CombinationReportProps {
  combinations: RsaCombinationAggregated[];
}

/**
 * Placeholder -- full implementation in Task 2.
 * RSA headline+description combination impressions with directional caveat.
 */
export function CombinationReport({ combinations }: CombinationReportProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-6">
      <p className="text-sm text-gray-400">
        Combination report loading... ({combinations.length} combinations)
      </p>
    </div>
  );
}
