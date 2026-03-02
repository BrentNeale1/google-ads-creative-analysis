import { describe, it, expect } from 'vitest';
import { identifyGaps } from './gapAnalysis';
import type { PatternResult } from './types';

describe('identifyGaps', () => {
  it('returns 3 gap results when 4 of 7 themes are detected', () => {
    const detectedPatterns: PatternResult[] = [
      { theme: 'urgency', count: 5, avgKpi: 12.0 },
      { theme: 'benefit_led', count: 8, avgKpi: 10.5 },
      { theme: 'cta_direct', count: 4, avgKpi: 15.0 },
      { theme: 'stats_numbers', count: 3, avgKpi: 11.0 },
    ];

    const gaps = identifyGaps(detectedPatterns);

    expect(gaps).toHaveLength(3);
    const gapThemes = gaps.map((g) => g.theme);
    expect(gapThemes).toContain('social_proof');
    expect(gapThemes).toContain('feature_led');
    expect(gapThemes).toContain('price_offer');
  });

  it('returns empty array when all themes are detected', () => {
    const detectedPatterns: PatternResult[] = [
      { theme: 'urgency', count: 2, avgKpi: 12.0 },
      { theme: 'social_proof', count: 3, avgKpi: 14.0 },
      { theme: 'benefit_led', count: 5, avgKpi: 10.0 },
      { theme: 'feature_led', count: 1, avgKpi: 18.0 },
      { theme: 'price_offer', count: 4, avgKpi: 9.0 },
      { theme: 'cta_direct', count: 6, avgKpi: 11.0 },
      { theme: 'stats_numbers', count: 2, avgKpi: 13.0 },
    ];

    const gaps = identifyGaps(detectedPatterns);

    expect(gaps).toEqual([]);
  });

  it('returns all 7 themes as gaps when no patterns detected', () => {
    const gaps = identifyGaps([]);

    expect(gaps).toHaveLength(7);
    const gapThemes = gaps.map((g) => g.theme);
    expect(gapThemes).toContain('urgency');
    expect(gapThemes).toContain('social_proof');
    expect(gapThemes).toContain('benefit_led');
    expect(gapThemes).toContain('feature_led');
    expect(gapThemes).toContain('price_offer');
    expect(gapThemes).toContain('cta_direct');
    expect(gapThemes).toContain('stats_numbers');
  });

  it('treats themes with count below minRepresentation as gaps', () => {
    const detectedPatterns: PatternResult[] = [
      { theme: 'urgency', count: 1, avgKpi: 12.0 },
      { theme: 'social_proof', count: 0, avgKpi: 0 },
      { theme: 'benefit_led', count: 5, avgKpi: 10.0 },
      { theme: 'feature_led', count: 2, avgKpi: 18.0 },
      { theme: 'price_offer', count: 3, avgKpi: 9.0 },
      { theme: 'cta_direct', count: 1, avgKpi: 11.0 },
      { theme: 'stats_numbers', count: 4, avgKpi: 13.0 },
    ];

    // minRepresentation=2 means themes with count 0 or 1 are gaps
    const gaps = identifyGaps(detectedPatterns, 2);

    expect(gaps).toHaveLength(3);
    const gapThemes = gaps.map((g) => g.theme);
    expect(gapThemes).toContain('urgency');
    expect(gapThemes).toContain('social_proof');
    expect(gapThemes).toContain('cta_direct');
  });

  it('returns correct theme, label, representation count, and suggestion for each gap', () => {
    const detectedPatterns: PatternResult[] = [
      { theme: 'urgency', count: 3, avgKpi: 12.0 },
      { theme: 'benefit_led', count: 5, avgKpi: 10.0 },
      { theme: 'feature_led', count: 2, avgKpi: 18.0 },
      { theme: 'price_offer', count: 4, avgKpi: 9.0 },
      { theme: 'cta_direct', count: 6, avgKpi: 11.0 },
      { theme: 'stats_numbers', count: 2, avgKpi: 13.0 },
    ];

    const gaps = identifyGaps(detectedPatterns);

    // Only social_proof is missing (count 0)
    expect(gaps).toHaveLength(1);
    const gap = gaps[0];

    expect(gap.theme).toBe('social_proof');
    expect(gap.label).toBe('Social proof');
    expect(gap.representation).toBe(0);
    expect(gap.suggestion).toMatch(/customer|review|trust/i);
  });
});
