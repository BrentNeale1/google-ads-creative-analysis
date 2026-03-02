import type { CopyTheme, PatternResult, PrimaryKpi } from './types';

/**
 * Human-readable labels for copy theme categories.
 * Used in insight-led chart titles.
 */
const THEME_LABELS: Record<CopyTheme, string> = {
  urgency: 'Urgency-driven',
  social_proof: 'Social proof',
  benefit_led: 'Benefit-led',
  feature_led: 'Feature-led',
  price_offer: 'Price/offer',
  cta_direct: 'Direct CTA',
  stats_numbers: 'Stats/numbers',
};

/** Fallback title when no meaningful insight can be generated */
const FALLBACK_TITLE = 'Creative Performance by Copy Theme';

/**
 * Generate an insight-led chart title from pattern analysis results.
 *
 * Finds the best-performing theme (lowest avgKpi for CPA, highest for ROAS),
 * computes the percentage difference from the overall average, and returns
 * a title like "Benefit-led headlines reduce CPA by 34%".
 *
 * Returns a sensible fallback if:
 * - No patterns have enough data (below minSampleSize)
 * - The difference is 5% or less (not meaningful enough)
 */
export function generateInsightTitle(
  patterns: PatternResult[],
  overallAvgKpi: number,
  kpiType: PrimaryKpi,
  minSampleSize: number = 3,
): string {
  // Filter to patterns with enough data
  const viable = patterns.filter((p) => p.count >= minSampleSize);

  if (viable.length === 0) {
    return FALLBACK_TITLE;
  }

  // Find the best-performing theme
  // For CPA: lowest avg is best. For ROAS: highest avg is best.
  const best = viable.reduce((a, b) => {
    if (kpiType === 'cpa') return a.avgKpi < b.avgKpi ? a : b;
    return a.avgKpi > b.avgKpi ? a : b;
  });

  // Calculate percentage difference from overall average
  const diff =
    kpiType === 'cpa'
      ? ((overallAvgKpi - best.avgKpi) / overallAvgKpi) * 100
      : ((best.avgKpi - overallAvgKpi) / overallAvgKpi) * 100;

  if (diff <= 5) {
    return FALLBACK_TITLE;
  }

  const label = THEME_LABELS[best.theme];
  const verb = kpiType === 'cpa' ? 'reduce CPA by' : 'outperform by';
  return `${label} headlines ${verb} ${Math.round(diff)}%`;
}
