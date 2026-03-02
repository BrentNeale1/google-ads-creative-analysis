/**
 * Shared types for the RSA analysis pipeline.
 *
 * All analysis modules import from this file to ensure
 * consistent type definitions across the pipeline.
 */

/** Performance tier classification */
export type Tier = 'top' | 'middle' | 'bottom';

/** Primary KPI used for tier ranking */
export type PrimaryKpi = 'cpa' | 'roas';

/** Underperformer diagnosis categories */
export type Diagnosis =
  | 'not_serving'
  | 'not_resonating'
  | 'landing_page_disconnect'
  | 'wrong_audience';

/** Copy theme categories for headline pattern detection */
export type CopyTheme =
  | 'urgency'
  | 'social_proof'
  | 'benefit_led'
  | 'feature_led'
  | 'price_offer'
  | 'cta_direct'
  | 'stats_numbers';

/** Recommendation action categories */
export type RecommendationAction = 'keep' | 'test' | 'pause' | 'investigate';

/**
 * Input to classifyTiers. The headlineText field carries pre-joined
 * headline text (e.g. "Get 50% Off | Free Shipping | Shop Now")
 * so it flows through to TieredCreative for pattern detection.
 */
export interface CreativeInput {
  adId: string;
  kpiValue: number;
  headlineText?: string;
  [key: string]: unknown;
}

/**
 * Creative with tier assignment and percentile ranking.
 * Extends CreativeInput so headlineText and any extra fields
 * pass through automatically.
 */
export interface TieredCreative extends CreativeInput {
  tier: Tier;
  percentile: number;
}

/** Creative with underperformer diagnosis */
export interface DiagnosedCreative {
  adId: string;
  tier: Tier;
  diagnosis: Diagnosis;
  evidence: string;
  recommendedAction: string;
}

/** Aggregated pattern result for a copy theme */
export interface PatternResult {
  theme: CopyTheme;
  count: number;
  avgKpi: number;
}

/** Keep/Test/Pause/Investigate recommendation */
export interface Recommendation {
  adId: string;
  action: RecommendationAction;
  priority: number;
  summary: string;
  details: string;
}
