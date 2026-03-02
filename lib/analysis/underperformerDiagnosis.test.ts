import { describe, it, expect } from 'vitest';
import { diagnoseUnderperformers } from './underperformerDiagnosis';
import type { TieredCreative, DiagnosedCreative } from './types';

describe('diagnoseUnderperformers', () => {
  const portfolioAvg = {
    impressions: 1000,
    ctr: 0.03,
    cvr: 0.02,
  };

  function makeCreative(
    overrides: Partial<TieredCreative> & {
      impressions?: number;
      ctr?: number;
      cvr?: number;
    },
  ): TieredCreative {
    return {
      adId: 'test',
      kpiValue: 100,
      tier: 'bottom',
      percentile: 10,
      impressions: 1000,
      ctr: 0.03,
      cvr: 0.02,
      ...overrides,
    } as TieredCreative;
  }

  it('diagnoses not_serving when impressions < 20% of average', () => {
    const creatives = [
      makeCreative({ adId: 'a1', impressions: 5, tier: 'bottom' }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(1);
    expect(result[0].diagnosis).toBe('not_serving');
    expect(result[0].evidence).toContain('below');
  });

  it('diagnoses not_resonating when impressions OK but CTR < 50% of average', () => {
    const creatives = [
      makeCreative({
        adId: 'a1',
        impressions: 800,
        ctr: 0.005,
        tier: 'bottom',
      }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(1);
    expect(result[0].diagnosis).toBe('not_resonating');
    expect(result[0].evidence).toContain('CTR');
  });

  it('diagnoses landing_page_disconnect when CTR >= 80% of avg but CVR < 50% of avg', () => {
    const creatives = [
      makeCreative({
        adId: 'a1',
        impressions: 800,
        ctr: 0.028,
        cvr: 0.001,
        tier: 'bottom',
      }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(1);
    expect(result[0].diagnosis).toBe('landing_page_disconnect');
    expect(result[0].evidence).toContain('landing page');
  });

  it('diagnoses wrong_audience when no other condition matches', () => {
    const creatives = [
      makeCreative({
        adId: 'a1',
        impressions: 800,
        ctr: 0.02,
        cvr: 0.015,
        tier: 'bottom',
      }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(1);
    expect(result[0].diagnosis).toBe('wrong_audience');
  });

  it('skips top-tier creatives', () => {
    const creatives = [
      makeCreative({ adId: 'a1', tier: 'top' }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(0);
  });

  it('skips middle-tier creatives', () => {
    const creatives = [
      makeCreative({ adId: 'a1', tier: 'middle' }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(0);
  });

  it('includes recommended action string for each diagnosis', () => {
    const creatives = [
      makeCreative({ adId: 'a1', impressions: 5, tier: 'bottom' }),
      makeCreative({
        adId: 'a2',
        impressions: 800,
        ctr: 0.005,
        tier: 'bottom',
      }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result).toHaveLength(2);
    result.forEach((d) => {
      expect(d.recommendedAction).toBeTruthy();
      expect(typeof d.recommendedAction).toBe('string');
    });
  });

  it('preserves adId and tier on diagnosed creatives', () => {
    const creatives = [
      makeCreative({ adId: 'my-ad-123', impressions: 5, tier: 'bottom' }),
    ];
    const result = diagnoseUnderperformers(creatives, portfolioAvg);

    expect(result[0].adId).toBe('my-ad-123');
    expect(result[0].tier).toBe('bottom');
  });
});
