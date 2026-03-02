import { describe, it, expect } from 'vitest';
import { generateInsightTitle } from './insightTitles';
import type { PatternResult, CopyTheme } from './types';

describe('generateInsightTitle', () => {
  it('returns fallback title when no patterns provided', () => {
    const result = generateInsightTitle([], 50, 'cpa');
    expect(result).toBe('Creative Performance by Copy Theme');
  });

  it('returns fallback when all themes below minSampleSize', () => {
    const patterns: PatternResult[] = [
      { theme: 'urgency' as CopyTheme, count: 2, avgKpi: 10 },
      { theme: 'benefit_led' as CopyTheme, count: 1, avgKpi: 8 },
    ];
    const result = generateInsightTitle(patterns, 50, 'cpa');
    expect(result).toBe('Creative Performance by Copy Theme');
  });

  it('generates CPA reduction title when best theme outperforms', () => {
    // Overall avg CPA = 50, best theme avg CPA = 33 -> 34% reduction
    const patterns: PatternResult[] = [
      { theme: 'benefit_led' as CopyTheme, count: 5, avgKpi: 33 },
      { theme: 'urgency' as CopyTheme, count: 4, avgKpi: 45 },
    ];
    const result = generateInsightTitle(patterns, 50, 'cpa');
    expect(result).toBe('Benefit-led headlines reduce CPA by 34%');
  });

  it('generates ROAS outperform title for ROAS KPI', () => {
    // Overall avg ROAS = 5, best theme avg ROAS = 6 -> 20% outperform
    const patterns: PatternResult[] = [
      { theme: 'urgency' as CopyTheme, count: 4, avgKpi: 6 },
      { theme: 'benefit_led' as CopyTheme, count: 3, avgKpi: 5.2 },
    ];
    const result = generateInsightTitle(patterns, 5, 'roas');
    expect(result).toBe('Urgency-driven headlines outperform by 20%');
  });

  it('returns fallback when difference is 5% or less', () => {
    // Overall avg CPA = 50, best theme avg CPA = 48 -> 4% difference (too small)
    const patterns: PatternResult[] = [
      { theme: 'benefit_led' as CopyTheme, count: 5, avgKpi: 48 },
    ];
    const result = generateInsightTitle(patterns, 50, 'cpa');
    expect(result).toBe('Creative Performance by Copy Theme');
  });

  it('respects custom minSampleSize parameter', () => {
    const patterns: PatternResult[] = [
      { theme: 'benefit_led' as CopyTheme, count: 4, avgKpi: 30 },
    ];
    // With minSampleSize=5, this pattern is excluded
    const result = generateInsightTitle(patterns, 50, 'cpa', 5);
    expect(result).toBe('Creative Performance by Copy Theme');

    // With minSampleSize=3, this pattern is included
    const result2 = generateInsightTitle(patterns, 50, 'cpa', 3);
    expect(result2).not.toBe('Creative Performance by Copy Theme');
  });

  it('selects theme with lowest CPA for CPA KPI type', () => {
    const patterns: PatternResult[] = [
      { theme: 'urgency' as CopyTheme, count: 5, avgKpi: 40 },
      { theme: 'benefit_led' as CopyTheme, count: 5, avgKpi: 30 },
      { theme: 'cta_direct' as CopyTheme, count: 3, avgKpi: 45 },
    ];
    const result = generateInsightTitle(patterns, 50, 'cpa');
    // benefit_led has lowest CPA (30) -> best for CPA
    expect(result).toContain('Benefit-led');
  });

  it('selects theme with highest ROAS for ROAS KPI type', () => {
    const patterns: PatternResult[] = [
      { theme: 'urgency' as CopyTheme, count: 5, avgKpi: 4 },
      { theme: 'social_proof' as CopyTheme, count: 5, avgKpi: 8 },
      { theme: 'cta_direct' as CopyTheme, count: 3, avgKpi: 5 },
    ];
    const result = generateInsightTitle(patterns, 5, 'roas');
    // social_proof has highest ROAS (8) -> best for ROAS
    expect(result).toContain('Social proof');
  });

  it('rounds percentage to whole number', () => {
    // 50 -> 33 = 34% reduction (not 34.0% or 33.99%)
    const patterns: PatternResult[] = [
      { theme: 'benefit_led' as CopyTheme, count: 5, avgKpi: 33 },
    ];
    const result = generateInsightTitle(patterns, 50, 'cpa');
    expect(result).toMatch(/\d+%/);
    expect(result).not.toMatch(/\d+\.\d+%/);
  });
});
