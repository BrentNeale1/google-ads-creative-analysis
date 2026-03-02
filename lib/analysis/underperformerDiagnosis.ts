import type { TieredCreative, DiagnosedCreative, Diagnosis } from './types';

/** Portfolio average metrics for relative threshold comparison */
export interface PortfolioAvg {
  impressions: number;
  ctr: number;
  cvr: number;
}

/**
 * Diagnosis action text mapped to each diagnosis category.
 * AU English spelling throughout.
 */
const DIAGNOSIS_ACTIONS: Record<Diagnosis, string> = {
  not_serving:
    'Check ad strength and auction competitiveness. Consider pausing and replacing with a stronger creative.',
  not_resonating:
    'Creative is not engaging users. Test new headline angles or stronger calls to action.',
  landing_page_disconnect:
    'Ad attracts clicks but landing page fails to convert. Review landing page relevance and experience.',
  wrong_audience:
    'Creative may be attracting the wrong audience. Review targeting settings and keyword match types.',
};

/**
 * Diagnose bottom-tier creatives using a decision tree
 * based on portfolio-relative thresholds.
 *
 * Decision tree (checked in priority order):
 * 1. Impressions < 20% of avg -> not_serving
 * 2. CTR < 50% of avg -> not_resonating
 * 3. CTR >= 80% of avg AND CVR < 50% of avg -> landing_page_disconnect
 * 4. Else -> wrong_audience
 *
 * Only processes bottom-tier creatives. Top and middle tiers are skipped.
 */
export function diagnoseUnderperformers(
  tieredCreatives: TieredCreative[],
  portfolioAvg: PortfolioAvg,
): DiagnosedCreative[] {
  return tieredCreatives
    .filter((c) => c.tier === 'bottom')
    .map((creative) => {
      const impressions = (creative.impressions as number) ?? 0;
      const ctr = (creative.ctr as number) ?? 0;
      const cvr = (creative.cvr as number) ?? 0;

      let diagnosis: Diagnosis;
      let evidence: string;

      if (impressions < portfolioAvg.impressions * 0.2) {
        diagnosis = 'not_serving';
        evidence = `Impressions significantly below portfolio average (${impressions} vs avg ${portfolioAvg.impressions})`;
      } else if (ctr < portfolioAvg.ctr * 0.5) {
        diagnosis = 'not_resonating';
        evidence = `CTR well below portfolio average (${(ctr * 100).toFixed(1)}% vs avg ${(portfolioAvg.ctr * 100).toFixed(1)}%)`;
      } else if (ctr >= portfolioAvg.ctr * 0.8 && cvr < portfolioAvg.cvr * 0.5) {
        diagnosis = 'landing_page_disconnect';
        evidence = `Good CTR but poor landing page conversion (CVR ${(cvr * 100).toFixed(1)}% vs avg ${(portfolioAvg.cvr * 100).toFixed(1)}%)`;
      } else {
        diagnosis = 'wrong_audience';
        evidence = `Mediocre performance across all metrics suggests targeting mismatch`;
      }

      return {
        adId: creative.adId,
        tier: creative.tier,
        diagnosis,
        evidence,
        recommendedAction: DIAGNOSIS_ACTIONS[diagnosis],
      };
    });
}
