import { describe, it, expect } from 'vitest';
import { classifyTiers } from './tierClassification';
import type { CreativeInput, TieredCreative } from './types';

describe('classifyTiers', () => {
  it('returns empty array for empty input', () => {
    expect(classifyTiers([], 'cpa')).toEqual([]);
  });

  it('assigns single creative to top tier', () => {
    const input: CreativeInput[] = [{ adId: 'a1', kpiValue: 50 }];
    const result = classifyTiers(input, 'cpa');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('top');
  });

  it('classifies 10 creatives by CPA (ascending -- low CPA = top)', () => {
    const input: CreativeInput[] = [
      { adId: 'a1', kpiValue: 10 },
      { adId: 'a2', kpiValue: 20 },
      { adId: 'a3', kpiValue: 30 },
      { adId: 'a4', kpiValue: 40 },
      { adId: 'a5', kpiValue: 50 },
      { adId: 'a6', kpiValue: 60 },
      { adId: 'a7', kpiValue: 70 },
      { adId: 'a8', kpiValue: 80 },
      { adId: 'a9', kpiValue: 90 },
      { adId: 'a10', kpiValue: 100 },
    ];
    const result = classifyTiers(input, 'cpa');

    // Top 20% = lowest CPA (a1=10, a2=20)
    const tops = result.filter((c) => c.tier === 'top');
    expect(tops).toHaveLength(2);
    expect(tops.map((c) => c.kpiValue).sort((a, b) => a - b)).toEqual([10, 20]);

    // Bottom 20% = highest CPA (a9=90, a10=100)
    const bottoms = result.filter((c) => c.tier === 'bottom');
    expect(bottoms).toHaveLength(2);
    expect(bottoms.map((c) => c.kpiValue).sort((a, b) => a - b)).toEqual([90, 100]);

    // Middle 60% = rest
    const middles = result.filter((c) => c.tier === 'middle');
    expect(middles).toHaveLength(6);
  });

  it('classifies 10 creatives by ROAS (descending -- high ROAS = top)', () => {
    const input: CreativeInput[] = [
      { adId: 'a1', kpiValue: 1 },
      { adId: 'a2', kpiValue: 2 },
      { adId: 'a3', kpiValue: 3 },
      { adId: 'a4', kpiValue: 4 },
      { adId: 'a5', kpiValue: 5 },
      { adId: 'a6', kpiValue: 6 },
      { adId: 'a7', kpiValue: 7 },
      { adId: 'a8', kpiValue: 8 },
      { adId: 'a9', kpiValue: 9 },
      { adId: 'a10', kpiValue: 10 },
    ];
    const result = classifyTiers(input, 'roas');

    // Top 20% = highest ROAS (a10=10, a9=9)
    const tops = result.filter((c) => c.tier === 'top');
    expect(tops).toHaveLength(2);
    expect(tops.map((c) => c.kpiValue).sort((a, b) => a - b)).toEqual([9, 10]);

    // Bottom 20% = lowest ROAS (a1=1, a2=2)
    const bottoms = result.filter((c) => c.tier === 'bottom');
    expect(bottoms).toHaveLength(2);
    expect(bottoms.map((c) => c.kpiValue).sort((a, b) => a - b)).toEqual([1, 2]);

    // Middle 60%
    const middles = result.filter((c) => c.tier === 'middle');
    expect(middles).toHaveLength(6);
  });

  it('classifies 5 creatives with correct tier distribution', () => {
    const input: CreativeInput[] = [
      { adId: 'a1', kpiValue: 10 },
      { adId: 'a2', kpiValue: 20 },
      { adId: 'a3', kpiValue: 30 },
      { adId: 'a4', kpiValue: 40 },
      { adId: 'a5', kpiValue: 50 },
    ];
    const result = classifyTiers(input, 'cpa');

    // Top 20% of 5 = ceil(1) = 1
    const tops = result.filter((c) => c.tier === 'top');
    expect(tops).toHaveLength(1);
    expect(tops[0].kpiValue).toBe(10);

    // Bottom 20% of 5 = ceil(1) = 1
    const bottoms = result.filter((c) => c.tier === 'bottom');
    expect(bottoms).toHaveLength(1);
    expect(bottoms[0].kpiValue).toBe(50);

    // Middle = 3
    const middles = result.filter((c) => c.tier === 'middle');
    expect(middles).toHaveLength(3);
  });

  it('computes percentile values correctly', () => {
    const input: CreativeInput[] = [
      { adId: 'a1', kpiValue: 10 },
      { adId: 'a2', kpiValue: 20 },
      { adId: 'a3', kpiValue: 30 },
      { adId: 'a4', kpiValue: 40 },
      { adId: 'a5', kpiValue: 50 },
    ];
    const result = classifyTiers(input, 'cpa');

    // First sorted position (best CPA) = highest percentile
    const best = result.find((c) => c.kpiValue === 10);
    expect(best).toBeDefined();
    expect(best!.percentile).toBe(100);

    // Last sorted position (worst CPA) = lowest percentile
    const worst = result.find((c) => c.kpiValue === 50);
    expect(worst).toBeDefined();
    expect(worst!.percentile).toBe(20);
  });

  it('preserves headlineText on TieredCreative output', () => {
    const input: CreativeInput[] = [
      { adId: 'a1', kpiValue: 10, headlineText: 'Shop Now' },
      { adId: 'a2', kpiValue: 20, headlineText: 'Free Shipping' },
    ];
    const result = classifyTiers(input, 'cpa');

    const a1 = result.find((c) => c.adId === 'a1');
    expect(a1).toBeDefined();
    expect(a1!.headlineText).toBe('Shop Now');

    const a2 = result.find((c) => c.adId === 'a2');
    expect(a2).toBeDefined();
    expect(a2!.headlineText).toBe('Free Shipping');
  });

  it('preserves extra fields from CreativeInput on output', () => {
    const input: CreativeInput[] = [
      { adId: 'a1', kpiValue: 10, impressions: 1000, clicks: 50 },
    ];
    const result = classifyTiers(input, 'cpa');

    expect(result[0].impressions).toBe(1000);
    expect(result[0].clicks).toBe(50);
  });
});
