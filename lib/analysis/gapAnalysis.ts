/**
 * Gap analysis module -- identifies creative themes that are
 * missing or underrepresented in the portfolio.
 *
 * Used by the briefing and recommendations pages to suggest
 * untested creative angles.
 */
import type { CopyTheme, PatternResult } from './types';

/** Result describing a gap in creative theme coverage */
export interface GapResult {
  theme: CopyTheme;
  label: string;
  representation: number;
  suggestion: string;
}

/** All seven copy themes from the taxonomy */
const ALL_THEMES: CopyTheme[] = [
  'urgency',
  'social_proof',
  'benefit_led',
  'feature_led',
  'price_offer',
  'cta_direct',
  'stats_numbers',
];

/** Human-readable labels for each theme */
const THEME_LABELS: Record<CopyTheme, string> = {
  urgency: 'Urgency-driven',
  social_proof: 'Social proof',
  benefit_led: 'Benefit-led',
  feature_led: 'Feature-led',
  price_offer: 'Price/offer',
  cta_direct: 'Direct CTA',
  stats_numbers: 'Stats/numbers',
};

/** Actionable suggestions for each theme gap (AU English) */
const THEME_SUGGESTIONS: Record<CopyTheme, string> = {
  urgency: 'Test headlines with time-limited offers or scarcity messaging',
  social_proof:
    'Test headlines featuring customer counts, reviews, or trust signals',
  benefit_led: 'Test headlines focused on what the customer gains',
  feature_led:
    'Test headlines highlighting product capabilities or technology',
  price_offer:
    'Test headlines with specific pricing, discounts, or value propositions',
  cta_direct:
    'Test headlines with clear action verbs (Shop, Book, Get Started)',
  stats_numbers:
    'Test headlines incorporating specific numbers or statistics',
};

/**
 * Identify creative themes that are missing or underrepresented
 * in the portfolio.
 *
 * Compares detected pattern counts against the full theme taxonomy.
 * Themes with fewer occurrences than `minRepresentation` are returned
 * as gaps with a human-readable label and actionable suggestion.
 *
 * @param detectedPatterns - Pattern results from detectPatterns()
 * @param minRepresentation - Minimum count to consider a theme represented (default 1)
 * @returns Array of gap results for underrepresented themes
 */
export function identifyGaps(
  detectedPatterns: PatternResult[],
  minRepresentation: number = 1,
): GapResult[] {
  const detectedMap = new Map(
    detectedPatterns.map((p) => [p.theme, p.count]),
  );

  return ALL_THEMES.filter(
    (theme) => (detectedMap.get(theme) ?? 0) < minRepresentation,
  ).map((theme) => ({
    theme,
    label: THEME_LABELS[theme],
    representation: detectedMap.get(theme) ?? 0,
    suggestion: THEME_SUGGESTIONS[theme],
  }));
}
