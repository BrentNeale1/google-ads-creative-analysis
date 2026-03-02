import { describe, it, expect } from 'vitest';
import { detectFatigue } from './fatigueDetection';
import type { CreativeMetrics } from './fatigueDetection';

describe('detectFatigue', () => {
  it('flags creative with CPA increased >20% as fatigued', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 25, impressions: 500 }, // CPA went from 20 to 25 = +25%
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 20, impressions: 500 },
    ];

    const result = detectFatigue(current, prior, 'cpa', 0.20, 100);

    expect(result).toHaveLength(1);
    expect(result[0].adId).toBe('a1');
    expect(result[0].direction).toBe('degraded');
    expect(result[0].changePercent).toBeCloseTo(0.25);
    expect(result[0].currentKpi).toBe(25);
    expect(result[0].priorKpi).toBe(20);
  });

  it('does NOT flag creative with CPA increased 15% (below 20% threshold)', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 23, impressions: 500 }, // CPA went from 20 to 23 = +15%
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 20, impressions: 500 },
    ];

    const result = detectFatigue(current, prior, 'cpa', 0.20, 100);

    expect(result).toHaveLength(0);
  });

  it('flags creative with ROAS decreased >20% as fatigued', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 3.0, impressions: 500 }, // ROAS went from 4.0 to 3.0 = -25%
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 4.0, impressions: 500 },
    ];

    const result = detectFatigue(current, prior, 'roas', 0.20, 100);

    expect(result).toHaveLength(1);
    expect(result[0].adId).toBe('a1');
    expect(result[0].direction).toBe('degraded');
    expect(result[0].changePercent).toBeCloseTo(-0.25);
  });

  it('does NOT flag creative with ROAS decreased 10% (below threshold)', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 3.6, impressions: 500 }, // ROAS went from 4.0 to 3.6 = -10%
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 4.0, impressions: 500 },
    ];

    const result = detectFatigue(current, prior, 'roas', 0.20, 100);

    expect(result).toHaveLength(0);
  });

  it('excludes creatives below minImpressions threshold', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 30, impressions: 50 }, // Below minImpressions=100
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 20, impressions: 500 },
    ];

    const result = detectFatigue(current, prior, 'cpa', 0.20, 100);

    expect(result).toHaveLength(0);
  });

  it('excludes creatives only in current period (no prior data)', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 25, impressions: 500 },
      { adId: 'a2', kpiValue: 30, impressions: 500 }, // No match in prior
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 20, impressions: 500 },
    ];

    const result = detectFatigue(current, prior, 'cpa', 0.20, 100);

    // Only a1 should be checked; a2 has no prior data
    expect(result).toHaveLength(1);
    expect(result[0].adId).toBe('a1');
  });

  it('excludes prior period creative with kpiValue=0 (divide by zero guard)', () => {
    const current: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 25, impressions: 500 },
    ];
    const prior: CreativeMetrics[] = [
      { adId: 'a1', kpiValue: 0, impressions: 500 }, // Zero would cause divide by zero
    ];

    const result = detectFatigue(current, prior, 'cpa', 0.20, 100);

    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty inputs', () => {
    expect(detectFatigue([], [], 'cpa')).toEqual([]);
    expect(detectFatigue([], [], 'roas')).toEqual([]);
  });
});
