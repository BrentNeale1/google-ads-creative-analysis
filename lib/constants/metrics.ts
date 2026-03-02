import {
  formatNumber,
  formatNumberCompact,
  formatPercentage,
  formatCurrency,
  formatCurrencyCompact,
  convertMicrosToAud,
} from "@/lib/constants/formatting";

export type MetricKey =
  | "impressions"
  | "clicks"
  | "ctr"
  | "conversions"
  | "cpa"
  | "roas";

export interface MetricDefinition {
  /** Display label (e.g. "Impressions", "CTR") */
  label: string;
  /** Full formatter for cards/tables */
  format: (value: number) => string;
  /** Compact formatter for chart axes */
  formatCompact: (value: number) => string;
  /** True when a decrease is positive (e.g. CPA -- lower is better) */
  invertColour: boolean;
  /**
   * Compute this metric's value from raw aggregation totals.
   * Guards against division by zero (returns 0).
   */
  computeFromTotals: (totals: {
    impressions: number;
    clicks: number;
    costMicros: number;
    conversions: number;
    conversionsValue: number;
  }) => number;
}

export const METRICS: Record<MetricKey, MetricDefinition> = {
  impressions: {
    label: "Impressions",
    format: formatNumber,
    formatCompact: formatNumberCompact,
    invertColour: false,
    computeFromTotals: (t) => t.impressions,
  },
  clicks: {
    label: "Clicks",
    format: formatNumber,
    formatCompact: formatNumberCompact,
    invertColour: false,
    computeFromTotals: (t) => t.clicks,
  },
  ctr: {
    label: "CTR",
    format: formatPercentage,
    formatCompact: formatPercentage,
    invertColour: false,
    computeFromTotals: (t) =>
      t.impressions === 0 ? 0 : t.clicks / t.impressions,
  },
  conversions: {
    label: "Conversions",
    format: formatNumber,
    formatCompact: formatNumberCompact,
    invertColour: false,
    computeFromTotals: (t) => t.conversions,
  },
  cpa: {
    label: "CPA",
    format: formatCurrency,
    formatCompact: formatCurrencyCompact,
    invertColour: true,
    computeFromTotals: (t) =>
      t.conversions === 0
        ? 0
        : convertMicrosToAud(t.costMicros) / t.conversions,
  },
  roas: {
    label: "ROAS",
    format: (v) => `${v.toFixed(2)}x`,
    formatCompact: (v) => `${v.toFixed(1)}x`,
    invertColour: false,
    computeFromTotals: (t) => {
      const cost = convertMicrosToAud(t.costMicros);
      return cost === 0 ? 0 : t.conversionsValue / cost;
    },
  },
};
