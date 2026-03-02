/**
 * Video-specific diagnosis helpers.
 *
 * Extends the standard underperformer diagnosis with video-specific
 * failure modes: low view rate (not engaging) and high view rate
 * but low CTR (missing CTA). Uses portfolio-relative thresholds
 * matching the pattern from diagnoseUnderperformers.
 */

/** Metrics for a single video creative */
export interface VideoCreativeMetrics {
  adId: string;
  impressions: number;
  videoViewRate: number;
  ctr: number;
  cvr: number;
  videoQuartileP100Rate: number;
}

/** Portfolio average metrics for video comparison */
export interface VideoPortfolioAvg {
  impressions: number;
  videoViewRate: number;
  ctr: number;
  cvr: number;
}

/** Diagnosis result for a video creative */
export interface VideoDiagnosis {
  adId: string;
  diagnosis: string;
  evidence: string;
  recommendedAction: string;
}

/**
 * Diagnose a video creative using a decision tree with
 * portfolio-relative thresholds.
 *
 * Decision tree (checked in priority order):
 * 1. Low impressions (< 0.2x portfolio avg) => not_serving
 * 2. High impressions + low view rate (< 0.5x avg) => not_engaging (video-specific)
 * 3. High view rate + low CTR (< 0.5x avg) => missing_cta (video-specific)
 * 4. Good metrics + low CVR (< 0.5x avg) => landing_page_disconnect
 * 5. Otherwise => null (no diagnosis needed)
 *
 * @param creative - Video creative metrics to diagnose
 * @param portfolioAvg - Portfolio average metrics for comparison
 * @returns Diagnosis with evidence and action, or null if healthy
 */
export function diagnoseVideoCreative(
  creative: VideoCreativeMetrics,
  portfolioAvg: VideoPortfolioAvg,
): VideoDiagnosis | null {
  // 1. Not serving -- impressions significantly below portfolio average
  if (creative.impressions < portfolioAvg.impressions * 0.2) {
    return {
      adId: creative.adId,
      diagnosis: 'not_serving',
      evidence: `Impressions significantly below portfolio average (${creative.impressions} vs avg ${portfolioAvg.impressions})`,
      recommendedAction:
        'Check ad group targeting and bidding. Consider pausing and replacing with a stronger creative.',
    };
  }

  // 2. Not engaging -- high impressions but low view rate (video-specific)
  if (creative.videoViewRate < portfolioAvg.videoViewRate * 0.5) {
    return {
      adId: creative.adId,
      diagnosis: 'not_engaging',
      evidence: `Video view rate well below portfolio average (${(creative.videoViewRate * 100).toFixed(1)}% vs avg ${(portfolioAvg.videoViewRate * 100).toFixed(1)}%). Viewers are not watching the video.`,
      recommendedAction:
        'Improve the opening hook of the video. Test a more compelling first 5 seconds to capture attention before viewers skip.',
    };
  }

  // 3. Missing CTA -- good view rate but low CTR (video-specific)
  if (creative.ctr < portfolioAvg.ctr * 0.5) {
    return {
      adId: creative.adId,
      diagnosis: 'missing_cta',
      evidence: `Good video view rate but CTR well below average (${(creative.ctr * 100).toFixed(2)}% vs avg ${(portfolioAvg.ctr * 100).toFixed(2)}%). Viewers watch but do not click. CTA may be weak or missing.`,
      recommendedAction:
        'Add or strengthen the call-to-action. Include a clear CTA overlay, end card, or companion banner to drive clicks.',
    };
  }

  // 4. Landing page disconnect -- good engagement but low conversion
  if (creative.cvr < portfolioAvg.cvr * 0.5) {
    return {
      adId: creative.adId,
      diagnosis: 'landing_page_disconnect',
      evidence: `Good video engagement and CTR but poor conversion (CVR ${(creative.cvr * 100).toFixed(1)}% vs avg ${(portfolioAvg.cvr * 100).toFixed(1)}%). Landing page may not match video messaging.`,
      recommendedAction:
        'Review landing page relevance and experience. Ensure the landing page message aligns with the video content and has a clear conversion path.',
    };
  }

  // 5. All metrics healthy -- no diagnosis needed
  return null;
}
