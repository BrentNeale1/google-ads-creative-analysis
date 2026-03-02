import type { CreativeInput, PrimaryKpi, TieredCreative } from './types';

/**
 * Classify creatives into top 20%, middle 60%, bottom 20% tiers
 * by the account's primary KPI.
 *
 * For CPA: lower is better, so top 20% = lowest CPA values (ascending sort).
 * For ROAS: higher is better, so top 20% = highest ROAS values (descending sort).
 *
 * All fields from CreativeInput (including headlineText) are spread/preserved
 * onto TieredCreative output, enabling downstream pattern detection.
 */
export function classifyTiers(
  creatives: CreativeInput[],
  kpiType: PrimaryKpi,
): TieredCreative[] {
  if (creatives.length === 0) return [];

  // Sort: CPA ascending (low = good), ROAS descending (high = good)
  const sorted = [...creatives].sort((a, b) =>
    kpiType === 'cpa'
      ? a.kpiValue - b.kpiValue
      : b.kpiValue - a.kpiValue,
  );

  const topCutoff = Math.ceil(sorted.length * 0.2);
  const bottomStart = sorted.length - Math.ceil(sorted.length * 0.2);

  return sorted.map((creative, idx) => ({
    ...creative,
    tier: idx < topCutoff ? 'top' : idx >= bottomStart ? 'bottom' : 'middle',
    percentile: ((sorted.length - idx) / sorted.length) * 100,
  })) as TieredCreative[];
}
