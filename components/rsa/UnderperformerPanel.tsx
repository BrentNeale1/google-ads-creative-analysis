"use client";

import type { DiagnosedCreative } from "@/lib/analysis/types";
import type { PortfolioAvg } from "@/lib/queries/rsa";

export interface UnderperformerPanelProps {
  diagnosedCreatives: DiagnosedCreative[];
  portfolioAvg: PortfolioAvg;
}

/**
 * Placeholder -- full implementation in Task 3.
 * Diagnosis cards for bottom-tier creatives.
 */
export function UnderperformerPanel({
  diagnosedCreatives,
  portfolioAvg,
}: UnderperformerPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-6">
      <p className="text-sm text-gray-400">
        Underperformer panel loading... ({diagnosedCreatives.length} diagnosed, avg impr: {portfolioAvg.avgImpressions})
      </p>
    </div>
  );
}
