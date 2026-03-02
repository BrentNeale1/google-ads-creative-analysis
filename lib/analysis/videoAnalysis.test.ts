import { describe, it, expect } from 'vitest';
import { diagnoseVideoCreative } from './videoAnalysis';
import type {
  VideoCreativeMetrics,
  VideoPortfolioAvg,
} from './videoAnalysis';

describe('diagnoseVideoCreative', () => {
  const portfolioAvg: VideoPortfolioAvg = {
    impressions: 10000,
    videoViewRate: 0.30,
    ctr: 0.02,
    cvr: 0.05,
  };

  it('diagnoses high impressions + low view rate as not_engaging', () => {
    const creative: VideoCreativeMetrics = {
      adId: 'v1',
      impressions: 12000, // Above 0.2x avg (2000)
      videoViewRate: 0.10, // Below 0.5x avg (0.15)
      ctr: 0.025,
      cvr: 0.06,
      videoQuartileP100Rate: 0.05,
    };

    const result = diagnoseVideoCreative(creative, portfolioAvg);

    expect(result).not.toBeNull();
    expect(result!.diagnosis).toBe('not_engaging');
    expect(result!.evidence).toMatch(/view rate/i);
    expect(result!.adId).toBe('v1');
    expect(result!.recommendedAction).toBeTruthy();
  });

  it('diagnoses high view rate + low CTR as missing_cta', () => {
    const creative: VideoCreativeMetrics = {
      adId: 'v2',
      impressions: 15000, // Above 0.2x avg
      videoViewRate: 0.35, // Above 0.5x avg (0.15) -- good view rate
      ctr: 0.005, // Below 0.5x avg (0.01)
      cvr: 0.06,
      videoQuartileP100Rate: 0.10,
    };

    const result = diagnoseVideoCreative(creative, portfolioAvg);

    expect(result).not.toBeNull();
    expect(result!.diagnosis).toBe('missing_cta');
    expect(result!.evidence).toMatch(/cta/i);
    expect(result!.adId).toBe('v2');
  });

  it('diagnoses good metrics + low CVR as landing_page_disconnect', () => {
    const creative: VideoCreativeMetrics = {
      adId: 'v3',
      impressions: 15000, // Above 0.2x avg
      videoViewRate: 0.35, // Above 0.5x avg
      ctr: 0.025, // Above 0.5x avg (0.01)
      cvr: 0.01, // Below 0.5x avg (0.025)
      videoQuartileP100Rate: 0.08,
    };

    const result = diagnoseVideoCreative(creative, portfolioAvg);

    expect(result).not.toBeNull();
    expect(result!.diagnosis).toBe('landing_page_disconnect');
    expect(result!.adId).toBe('v3');
  });

  it('diagnoses low impressions as not_serving', () => {
    const creative: VideoCreativeMetrics = {
      adId: 'v4',
      impressions: 500, // Below 0.2x avg (2000)
      videoViewRate: 0.05,
      ctr: 0.001,
      cvr: 0.001,
      videoQuartileP100Rate: 0.01,
    };

    const result = diagnoseVideoCreative(creative, portfolioAvg);

    expect(result).not.toBeNull();
    expect(result!.diagnosis).toBe('not_serving');
    expect(result!.adId).toBe('v4');
  });

  it('returns null when all metrics are healthy', () => {
    const creative: VideoCreativeMetrics = {
      adId: 'v5',
      impressions: 12000, // Well above 0.2x avg
      videoViewRate: 0.35, // Above 0.5x avg
      ctr: 0.025, // Above 0.5x avg
      cvr: 0.06, // Above 0.5x avg
      videoQuartileP100Rate: 0.10,
    };

    const result = diagnoseVideoCreative(creative, portfolioAvg);

    expect(result).toBeNull();
  });
});
