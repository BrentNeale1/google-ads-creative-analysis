import type { CopyTheme, TieredCreative, PatternResult } from './types';

/**
 * Regex patterns for each copy theme category.
 * Based on common Google Ads headline patterns and keyword signatures.
 */
const THEME_PATTERNS: Record<CopyTheme, RegExp[]> = {
  urgency: [
    /\b(limited|hurry|now|today|last chance|ends? soon|don't miss|act fast|while stocks last)\b/i,
  ],
  social_proof: [
    /\b(\d[\d,]*\+?\s*(customers?|clients?|reviews?|ratings?|stars?|users?))\b/i,
    /\b(trusted|award[- ]?winning|rated|recommended|popular)\b/i,
  ],
  benefit_led: [
    /\b(save|free|get|enjoy|discover|boost|improve|transform|achieve)\b/i,
  ],
  feature_led: [
    /\b(built[- ]in|includes?|features?|powered by|with|using|technology)\b/i,
  ],
  price_offer: [
    /\b(\d+%\s*off|half price|discount|deal|offer|sale|from \$)\b/i,
  ],
  cta_direct: [
    /\b(shop|buy|order|call|book|sign up|get started|learn more|contact|enquire)\b/i,
  ],
  stats_numbers: [
    /\b\d{2,}[+%xX]?\b/, // Numbers >= 10 with optional modifier
  ],
};

/**
 * Classify a single text string into matching copy theme categories.
 * Returns an array of themes that match (a headline can match multiple themes).
 */
export function classifyThemes(text: string): CopyTheme[] {
  if (!text) return [];

  return (Object.entries(THEME_PATTERNS) as [CopyTheme, RegExp[]][])
    .filter(([, patterns]) => patterns.some((p) => p.test(text)))
    .map(([theme]) => theme);
}

/**
 * Detect copy theme patterns across all tiered creatives.
 *
 * For each creative, reads `creative.headlineText` (the pre-joined
 * headline string carried through from classifyTiers) and calls
 * classifyThemes on it.
 *
 * Groups creatives by matched themes, computes avgKpi per theme group,
 * and returns only themes with >= minSampleSize matching creatives
 * (default 3, per research pitfall #5).
 */
export function detectPatterns(
  tieredCreatives: TieredCreative[],
  minSampleSize: number = 3,
): PatternResult[] {
  // Accumulate theme -> { kpiValues[], count }
  const themeMap = new Map<CopyTheme, { kpiValues: number[]; count: number }>();

  for (const creative of tieredCreatives) {
    const text = creative.headlineText;
    if (!text) continue;

    const themes = classifyThemes(text);

    for (const theme of themes) {
      const entry = themeMap.get(theme) || { kpiValues: [], count: 0 };
      entry.kpiValues.push(creative.kpiValue);
      entry.count += 1;
      themeMap.set(theme, entry);
    }
  }

  // Filter by minimum sample size and compute averages
  const results: PatternResult[] = [];

  for (const [theme, data] of themeMap.entries()) {
    if (data.count < minSampleSize) continue;

    const avgKpi =
      data.kpiValues.reduce((sum, v) => sum + v, 0) / data.kpiValues.length;

    results.push({
      theme,
      count: data.count,
      avgKpi,
    });
  }

  return results;
}
