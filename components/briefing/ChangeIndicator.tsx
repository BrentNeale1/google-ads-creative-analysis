"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface ChangeIndicatorProps {
  /** Change as a decimal ratio (e.g. 0.234 = +23.4%) */
  value: number;
  /** KPI type determines colour direction */
  kpiType: "cpa" | "roas";
  /** Icon and text size */
  size?: "sm" | "md";
}

/**
 * Colour-coded change indicator with up/down arrow.
 *
 * For CPA: positive change (cost went up) = red (bad), negative = green (good).
 * For ROAS: positive change (return went up) = green (good), negative = red (bad).
 */
export const ChangeIndicator = ({
  value,
  kpiType,
  size = "md",
}: ChangeIndicatorProps) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  // Determine if the change is "good" based on KPI direction
  const isGood = kpiType === "cpa" ? !isPositive : isPositive;

  const colour = isNeutral
    ? "text-[#9AA0A6]"
    : isGood
      ? "text-[#34A853]"
      : "text-[#EA4335]";

  const iconSize = size === "sm" ? 14 : 16;
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const formatted = `${isPositive ? "+" : ""}${(value * 100).toFixed(1)}%`;

  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 ${colour} ${textSize} font-medium`}>
      {!isNeutral && <Icon size={iconSize} />}
      {formatted}
    </span>
  );
};
