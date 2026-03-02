import { describe, it, expect } from 'vitest';
import { generateRecommendations } from './recommendations';
import type {
  TieredCreative,
  DiagnosedCreative,
  PatternResult,
  CopyTheme,
} from './types';

describe('generateRecommendations', () => {
  function makeCreative(
    adId: string,
    tier: 'top' | 'middle' | 'bottom',
    kpiValue: number,
    headlineText?: string,
  ): TieredCreative {
    return {
      adId,
      kpiValue,
      tier,
      percentile: tier === 'top' ? 90 : tier === 'middle' ? 50 : 10,
      headlineText,
    } as TieredCreative;
  }

  function makeDiagnosed(
    adId: string,
    diagnosis: DiagnosedCreative['diagnosis'],
  ): DiagnosedCreative {
    return {
      adId,
      tier: 'bottom',
      diagnosis,
      evidence: 'Test evidence',
      recommendedAction: 'Test action',
    };
  }

  const topPatterns: PatternResult[] = [
    { theme: 'benefit_led' as CopyTheme, count: 5, avgKpi: 15 },
    { theme: 'urgency' as CopyTheme, count: 3, avgKpi: 18 },
  ];

  it('assigns keep action to top-tier creatives', () => {
    const tiered = [makeCreative('a1', 'top', 10)];
    const diagnosed: DiagnosedCreative[] = [];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('keep');
    expect(result[0].priority).toBe(3);
    expect(result[0].summary).toContain('Top performer');
  });

  it('assigns pause action to bottom-tier creatives with diagnosis', () => {
    const tiered = [makeCreative('a1', 'bottom', 100)];
    const diagnosed = [makeDiagnosed('a1', 'not_serving')];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('pause');
    expect(result[0].priority).toBe(1);
  });

  it('assigns investigate action to bottom-tier without diagnosis', () => {
    const tiered = [makeCreative('a1', 'bottom', 100)];
    const diagnosed: DiagnosedCreative[] = [];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('investigate');
    expect(result[0].priority).toBe(2);
  });

  it('assigns test action to middle-tier creatives missing top patterns', () => {
    const tiered = [makeCreative('a1', 'middle', 50, 'Some Generic Headline')];
    const diagnosed: DiagnosedCreative[] = [];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('test');
    expect(result[0].priority).toBe(2);
    expect(result[0].details).toContain('benefit_led');
  });

  it('assigns keep-monitor to middle-tier with matching top patterns', () => {
    // Headline matches the top patterns (benefit_led via "Save")
    const tiered = [makeCreative('a1', 'middle', 50, 'Save Today on Premium')];
    const diagnosed: DiagnosedCreative[] = [];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('keep');
    expect(result[0].summary).toContain('monitor');
  });

  it('includes diagnosis detail in pause recommendation', () => {
    const tiered = [makeCreative('a1', 'bottom', 100)];
    const diagnosed = [makeDiagnosed('a1', 'not_serving')];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result[0].summary).toContain('not serving');
    expect(result[0].details).toBeTruthy();
  });

  it('handles all tiers in a mixed set of creatives', () => {
    const tiered = [
      makeCreative('a1', 'top', 10, 'Best Deal Today'),
      makeCreative('a2', 'middle', 50, 'Some Generic Headline'),
      makeCreative('a3', 'bottom', 100),
    ];
    const diagnosed = [makeDiagnosed('a3', 'not_resonating')];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result).toHaveLength(3);

    const actions = result.map((r) => r.action);
    expect(actions).toContain('keep');
    expect(actions).toContain('test');
    expect(actions).toContain('pause');
  });

  it('assigns all-keep when all creatives are top tier', () => {
    const tiered = [
      makeCreative('a1', 'top', 10),
      makeCreative('a2', 'top', 12),
      makeCreative('a3', 'top', 15),
    ];
    const diagnosed: DiagnosedCreative[] = [];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result.every((r) => r.action === 'keep')).toBe(true);
  });

  it('includes ad strength advice for not_serving diagnosis', () => {
    const tiered = [makeCreative('a1', 'bottom', 100)];
    const diagnosed = [makeDiagnosed('a1', 'not_serving')];

    const result = generateRecommendations(tiered, diagnosed, topPatterns);
    expect(result[0].details.toLowerCase()).toContain('ad strength');
  });
});
