"use client";

import type { Recommendation, TieredCreative } from "@/lib/analysis/types";

export interface RecommendationListProps {
  recommendations: Recommendation[];
  creatives: TieredCreative[];
}

/**
 * Placeholder -- full implementation in Task 3.
 * Keep/Test/Pause/Investigate action list.
 */
export function RecommendationList({
  recommendations,
  creatives,
}: RecommendationListProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-6">
      <p className="text-sm text-gray-400">
        Recommendation list loading... ({recommendations.length} recommendations, {creatives.length} creatives)
      </p>
    </div>
  );
}
