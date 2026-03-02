"use client";

import type { DiagnosedCreative, Diagnosis } from "@/lib/analysis/types";
import type { PortfolioAvg } from "@/lib/queries/rsa";
import { formatNumber, formatPercentage } from "@/lib/constants/formatting";

export interface UnderperformerPanelProps {
  diagnosedCreatives: DiagnosedCreative[];
  portfolioAvg: PortfolioAvg;
}

/** Diagnosis display config: label, colour, sort priority */
const DIAGNOSIS_CONFIG: Record<
  Diagnosis,
  { label: string; colour: string; bgColour: string; priority: number }
> = {
  not_serving: {
    label: "Not Serving",
    colour: "#9AA0A6",
    bgColour: "bg-gray-50",
    priority: 1,
  },
  not_resonating: {
    label: "Not Resonating",
    colour: "#EA4335",
    bgColour: "bg-[#FCE8E6]",
    priority: 2,
  },
  landing_page_disconnect: {
    label: "Landing Page Disconnect",
    colour: "#FBBC04",
    bgColour: "bg-[#FEF7E0]",
    priority: 3,
  },
  wrong_audience: {
    label: "Wrong Audience",
    colour: "#EA4335",
    bgColour: "bg-[#FCE8E6]",
    priority: 4,
  },
};

/**
 * Diagnosis cards for bottom-tier creatives.
 * Shows specific diagnosis with evidence and recommended action.
 */
export function UnderperformerPanel({
  diagnosedCreatives,
  portfolioAvg,
}: UnderperformerPanelProps) {
  if (diagnosedCreatives.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-gridline p-8 text-center">
        <p className="text-sm text-gray-500">
          No underperformers detected -- all creatives are performing adequately.
        </p>
      </div>
    );
  }

  // Sort by diagnosis priority (most actionable first)
  const sorted = [...diagnosedCreatives].sort(
    (a, b) =>
      DIAGNOSIS_CONFIG[a.diagnosis].priority -
      DIAGNOSIS_CONFIG[b.diagnosis].priority,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Underperformer Diagnosis ({sorted.length})
        </h3>
        <div className="text-xs text-gray-400">
          Portfolio avg: {formatNumber(Math.round(portfolioAvg.avgImpressions))}{" "}
          impr, {formatPercentage(portfolioAvg.avgCtr)} CTR
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((creative) => {
          const config = DIAGNOSIS_CONFIG[creative.diagnosis];

          return (
            <div
              key={creative.adId}
              className={`${config.bgColour} rounded-xl border border-surface-gridline p-5 shadow-sm`}
            >
              {/* Header: ad ID + diagnosis badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 truncate">
                    Ad {creative.adId}
                  </p>
                </div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
                  style={{ backgroundColor: config.colour }}
                >
                  {config.label}
                </span>
              </div>

              {/* Evidence */}
              <p className="text-sm text-gray-700 mb-3">{creative.evidence}</p>

              {/* Recommended action */}
              <div className="pt-3 border-t border-surface-gridline">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Recommended action
                </p>
                <p className="text-sm text-gray-800">
                  {creative.recommendedAction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
