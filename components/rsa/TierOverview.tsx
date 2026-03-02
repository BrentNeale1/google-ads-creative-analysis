"use client";

import type { TieredCreative, PrimaryKpi } from "@/lib/analysis/types";
import { formatCurrency } from "@/lib/constants/formatting";

export interface TierOverviewProps {
  tieredCreatives: TieredCreative[];
  kpiType: PrimaryKpi;
}

interface TierConfig {
  label: string;
  description: string;
  colour: string;
  bgColour: string;
  tier: "top" | "middle" | "bottom";
}

const TIER_CONFIGS: TierConfig[] = [
  {
    label: "Top Performers",
    description: "Top 20% by",
    colour: "#34A853",
    bgColour: "bg-[#E6F4EA]",
    tier: "top",
  },
  {
    label: "Middle Pack",
    description: "20th-80th percentile",
    colour: "#FBBC04",
    bgColour: "bg-[#FEF7E0]",
    tier: "middle",
  },
  {
    label: "Underperformers",
    description: "Bottom 20%",
    colour: "#EA4335",
    bgColour: "bg-[#FCE8E6]",
    tier: "bottom",
  },
];

/**
 * Tier distribution summary cards showing count and KPI range
 * for top, middle, and bottom performance tiers.
 */
export function TierOverview({
  tieredCreatives,
  kpiType,
}: TierOverviewProps) {
  const formatKpi = kpiType === "cpa"
    ? formatCurrency
    : (v: number) => `${v.toFixed(2)}x`;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TIER_CONFIGS.map((config) => {
        const creatives = tieredCreatives.filter(
          (c) => c.tier === config.tier,
        );
        const count = creatives.length;

        // Compute KPI range for this tier
        const kpiValues = creatives.map((c) => c.kpiValue).sort((a, b) => a - b);
        const minKpi = kpiValues.length > 0 ? kpiValues[0] : 0;
        const maxKpi =
          kpiValues.length > 0 ? kpiValues[kpiValues.length - 1] : 0;

        const kpiLabel = kpiType.toUpperCase();
        const description =
          config.tier === "top"
            ? `Top 20% by ${kpiLabel}`
            : config.description;

        return (
          <div
            key={config.tier}
            className={`${config.bgColour} rounded-xl border border-surface-gridline p-5 shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.colour }}
              />
              <h3 className="text-sm font-semibold text-gray-900">
                {config.label}
              </h3>
            </div>

            <div className="text-3xl font-bold text-gray-900 mb-1">
              {count}
            </div>

            <p className="text-xs text-gray-500 mb-2">{description}</p>

            {count > 0 && (
              <p className="text-xs text-gray-600">
                {kpiLabel}{" "}
                {minKpi === maxKpi
                  ? formatKpi(minKpi)
                  : `${formatKpi(minKpi)} - ${formatKpi(maxKpi)}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
