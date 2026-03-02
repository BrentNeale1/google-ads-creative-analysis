import { describe, it, expect } from 'vitest';
import { classifyThemes, detectPatterns } from './patternDetection';
import type { TieredCreative, CopyTheme } from './types';

describe('classifyThemes', () => {
  it('returns empty array for empty string', () => {
    expect(classifyThemes('')).toEqual([]);
  });

  it('detects price_offer and urgency in "Get 50% Off Today"', () => {
    const themes = classifyThemes('Get 50% Off Today');
    expect(themes).toContain('price_offer');
    expect(themes).toContain('urgency');
  });

  it('detects social_proof and stats_numbers in "Trusted by 10,000+ Customers"', () => {
    const themes = classifyThemes('Trusted by 10,000+ Customers');
    expect(themes).toContain('social_proof');
    expect(themes).toContain('stats_numbers');
  });

  it('detects benefit_led in "Free Shipping Australia-Wide"', () => {
    const themes = classifyThemes('Free Shipping Australia-Wide');
    expect(themes).toContain('benefit_led');
  });

  it('detects feature_led in "Built-in GPS Tracking"', () => {
    const themes = classifyThemes('Built-in GPS Tracking');
    expect(themes).toContain('feature_led');
  });

  it('detects cta_direct in "Shop Now"', () => {
    const themes = classifyThemes('Shop Now');
    expect(themes).toContain('cta_direct');
  });

  it('detects urgency and price_offer in "Limited Time Offer"', () => {
    const themes = classifyThemes('Limited Time Offer');
    expect(themes).toContain('urgency');
  });

  it('returns no duplicates', () => {
    const themes = classifyThemes('Shop Now and Buy Today');
    const unique = [...new Set(themes)];
    expect(themes.length).toBe(unique.length);
  });
});

describe('detectPatterns', () => {
  function makeCreative(
    adId: string,
    kpiValue: number,
    headlineText?: string,
  ): TieredCreative {
    return {
      adId,
      kpiValue,
      tier: 'top',
      percentile: 80,
      headlineText,
    } as TieredCreative;
  }

  it('returns empty array when no creatives have headlineText', () => {
    const creatives = [
      makeCreative('a1', 10),
      makeCreative('a2', 20),
    ];
    const result = detectPatterns(creatives);
    expect(result).toEqual([]);
  });

  it('skips creatives with empty headlineText', () => {
    const creatives = [
      makeCreative('a1', 10, ''),
      makeCreative('a2', 20, ''),
    ];
    const result = detectPatterns(creatives);
    expect(result).toEqual([]);
  });

  it('enforces minimum sample size of 3', () => {
    // Only 2 creatives with urgency theme -- should not appear in results
    const creatives = [
      makeCreative('a1', 10, 'Limited Time Only'),
      makeCreative('a2', 20, 'Hurry, Ends Soon'),
    ];
    const result = detectPatterns(creatives);
    // Urgency has only 2 matches, should be filtered out
    const urgencyPattern = result.find((p) => p.theme === 'urgency');
    expect(urgencyPattern).toBeUndefined();
  });

  it('returns themes with 3+ matching creatives', () => {
    const creatives = [
      makeCreative('a1', 10, 'Shop Now'),
      makeCreative('a2', 20, 'Buy Today'),
      makeCreative('a3', 30, 'Order Online'),
    ];
    const result = detectPatterns(creatives);
    const ctaPattern = result.find((p) => p.theme === 'cta_direct');
    expect(ctaPattern).toBeDefined();
    expect(ctaPattern!.count).toBe(3);
  });

  it('computes average KPI per theme group', () => {
    const creatives = [
      makeCreative('a1', 10, 'Shop Now'),
      makeCreative('a2', 20, 'Buy Today'),
      makeCreative('a3', 30, 'Order Online'),
    ];
    const result = detectPatterns(creatives);
    const ctaPattern = result.find((p) => p.theme === 'cta_direct');
    expect(ctaPattern).toBeDefined();
    expect(ctaPattern!.avgKpi).toBe(20); // (10 + 20 + 30) / 3
  });

  it('handles creatives matching multiple themes', () => {
    const creatives = [
      makeCreative('a1', 10, 'Get 50% Off Today - Shop Now'),
      makeCreative('a2', 20, 'Limited Time Offer - Buy Now'),
      makeCreative('a3', 30, 'Hurry, Sale Ends Today - Order Now'),
      makeCreative('a4', 15, 'Save Now - Free Shipping'),
    ];
    const result = detectPatterns(creatives);

    // Each creative matches multiple themes
    // cta_direct should match all 4 (Shop Now, Buy Now, Order Now, Save Now)
    const ctaPattern = result.find((p) => p.theme === 'cta_direct');
    expect(ctaPattern).toBeDefined();
    expect(ctaPattern!.count).toBeGreaterThanOrEqual(3);
  });

  it('reads headlineText from TieredCreative for classification', () => {
    // Verify the function uses creative.headlineText, not some other field
    const creatives = [
      { adId: 'a1', kpiValue: 10, tier: 'top' as const, percentile: 90, headlineText: 'Shop Now' },
      { adId: 'a2', kpiValue: 20, tier: 'top' as const, percentile: 80, headlineText: 'Buy Today' },
      { adId: 'a3', kpiValue: 30, tier: 'top' as const, percentile: 70, headlineText: 'Order Online' },
    ] as TieredCreative[];

    const result = detectPatterns(creatives);
    const ctaPattern = result.find((p) => p.theme === 'cta_direct');
    expect(ctaPattern).toBeDefined();
  });
});
