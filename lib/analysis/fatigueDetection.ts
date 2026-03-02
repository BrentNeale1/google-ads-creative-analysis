/**
 * Fatigue detection module -- identifies creatives whose KPI
 * has degraded beyond a threshold between two time periods.
 *
 * Handles both CPA (up = bad) and ROAS (down = bad) direction.
 * Includes guards for minimum impressions and divide-by-zero.
 */
import type { PrimaryKpi } from './types';

/** Metrics for a single creative in a time period */
export interface CreativeMetrics {
  adId: string;
  kpiValue: number;
  impressions: number;
}

/** A creative flagged as fatigued with comparison data */
export interface FatiguedCreative {
  adId: string;
  currentKpi: number;
  priorKpi: number;
  changePercent: number;
  direction: 'degraded' | 'improved';
}

/**
 * Detect creatives with degraded performance between two periods.
 *
 * For CPA: positive change (CPA went up) beyond threshold = degraded.
 * For ROAS: negative change (ROAS went down) beyond threshold = degraded.
 *
 * @param currentPeriod - Creative metrics for the current period
 * @param priorPeriod - Creative metrics for the prior period
 * @param kpiType - Which KPI to evaluate ('cpa' or 'roas')
 * @param degradationThreshold - Percentage threshold (default 0.20 = 20%)
 * @param minImpressions - Minimum impressions to include (default 100)
 * @returns Array of fatigued creatives that exceeded the degradation threshold
 */
export function detectFatigue(
  currentPeriod: CreativeMetrics[],
  priorPeriod: CreativeMetrics[],
  kpiType: PrimaryKpi,
  degradationThreshold: number = 0.20,
  minImpressions: number = 100,
): FatiguedCreative[] {
  const priorMap = new Map(priorPeriod.map((c) => [c.adId, c]));

  const results: FatiguedCreative[] = [];

  for (const current of currentPeriod) {
    if (current.impressions < minImpressions) continue;

    const prior = priorMap.get(current.adId);
    if (!prior || prior.impressions < minImpressions) continue;
    if (prior.kpiValue === 0) continue;

    const changePercent =
      (current.kpiValue - prior.kpiValue) / prior.kpiValue;

    // For CPA: positive change = degradation (CPA went up)
    // For ROAS: negative change = degradation (ROAS went down)
    const isDegraded =
      kpiType === 'cpa'
        ? changePercent > degradationThreshold
        : changePercent < -degradationThreshold;

    if (!isDegraded) continue;

    results.push({
      adId: current.adId,
      currentKpi: current.kpiValue,
      priorKpi: prior.kpiValue,
      changePercent,
      direction: 'degraded',
    });
  }

  return results;
}
