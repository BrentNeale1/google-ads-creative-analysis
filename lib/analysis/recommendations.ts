import type {
  TieredCreative,
  DiagnosedCreative,
  PatternResult,
  Recommendation,
  Diagnosis,
  CopyTheme,
} from './types';
import { classifyThemes } from './patternDetection';

/**
 * Pause recommendation details based on diagnosis type.
 * AU English spelling throughout.
 */
const PAUSE_DETAILS: Record<Diagnosis, (topPatternNames: string[]) => string> = {
  not_serving: (patterns) =>
    `Ad is not serving -- check ad strength and auction competitiveness. ` +
    (patterns.length > 0
      ? `Consider replacing with copy that uses ${patterns.join(', ')} themes, which top performers favour.`
      : `Consider testing a new creative approach.`),
  not_resonating: (patterns) =>
    `Creative is not resonating with users. ` +
    (patterns.length > 0
      ? `Top performers commonly use ${patterns.join(', ')}. Test a replacement incorporating these themes.`
      : `Test new headline angles or stronger calls to action.`),
  landing_page_disconnect: (patterns) =>
    `Good ad engagement but poor landing page conversion. ` +
    `Review landing page relevance and user experience. ` +
    (patterns.length > 0
      ? `If replacing, use ${patterns.join(', ')} patterns from top performers.`
      : `Ensure landing page matches the ad promise.`),
  wrong_audience: (patterns) =>
    `Creative may be attracting the wrong audience. ` +
    `Review targeting settings and keyword match types. ` +
    (patterns.length > 0
      ? `Consider testing with ${patterns.join(', ')} themes used by top performers.`
      : `Consider refining audience targeting.`),
};

/**
 * Generate Keep/Test/Pause/Investigate recommendations for each creative.
 *
 * Maps tier + diagnosis + patterns to actionable advice:
 * - Top tier -> keep (priority 3)
 * - Bottom tier + diagnosis -> pause (priority 1)
 * - Bottom tier + no diagnosis -> investigate (priority 2)
 * - Middle tier + missing top patterns -> test (priority 2)
 * - Middle tier + has top patterns -> keep-monitor (priority 3)
 */
export function generateRecommendations(
  tieredCreatives: TieredCreative[],
  diagnosedCreatives: DiagnosedCreative[],
  topPatterns: PatternResult[],
): Recommendation[] {
  // Build a lookup of adId -> diagnosis
  const diagnosisMap = new Map<string, DiagnosedCreative>();
  for (const d of diagnosedCreatives) {
    diagnosisMap.set(d.adId, d);
  }

  // Extract top pattern theme names for recommendations
  const topPatternNames = topPatterns.map((p) =>
    p.theme.replace(/_/g, ' '),
  );
  const topPatternThemes = topPatterns.map((p) => p.theme);

  return tieredCreatives.map((creative) => {
    // Top tier -> keep
    if (creative.tier === 'top') {
      return {
        adId: creative.adId,
        action: 'keep' as const,
        priority: 3,
        summary: 'Top performer -- keep running',
        details:
          'This creative is in the top 20% by performance. Maintain current budget allocation.',
      };
    }

    // Bottom tier
    if (creative.tier === 'bottom') {
      const diagnosed = diagnosisMap.get(creative.adId);

      if (!diagnosed) {
        return {
          adId: creative.adId,
          action: 'investigate' as const,
          priority: 2,
          summary: 'Underperforming -- needs investigation',
          details:
            'Bottom 20% but no clear diagnosis. Check ad strength and landing page.',
        };
      }

      const detailFn = PAUSE_DETAILS[diagnosed.diagnosis];
      return {
        adId: creative.adId,
        action: 'pause' as const,
        priority: 1,
        summary: `Pause -- ${diagnosed.diagnosis.replace(/_/g, ' ')}`,
        details: detailFn(topPatternNames),
      };
    }

    // Middle tier -- check pattern matching
    const creativeThemes = creative.headlineText
      ? classifyThemes(creative.headlineText)
      : [];

    const missingPatterns = topPatternThemes.filter(
      (theme) => !creativeThemes.includes(theme),
    );

    if (missingPatterns.length > 0) {
      const missingLabels = missingPatterns.map((p) => p.replace(/_/g, ' '));
      return {
        adId: creative.adId,
        action: 'test' as const,
        priority: 2,
        summary: `Test adding ${missingLabels[0]} elements`,
        details: `Top performers commonly use ${missingPatterns.join(', ')}. Test a variant incorporating these themes.`,
      };
    }

    return {
      adId: creative.adId,
      action: 'keep' as const,
      priority: 3,
      summary: 'Performing adequately -- monitor',
      details:
        'Middle tier with patterns matching top performers. Monitor for changes.',
    };
  });
}
