# Phase 3: RSA Analysis - Research

**Researched:** 2026-03-02
**Domain:** Google Ads RSA creative performance analysis, tier classification, pattern detection, underperformer diagnosis
**Confidence:** HIGH

## Summary

Phase 3 builds the core RSA analysis engine -- the differentiating feature of this app. The existing codebase has a solid foundation: `rsaDaily` stores ad-level data with headlines/descriptions as JSONB, `rsaAssetDaily` stores per-asset metrics with Google's performance labels, and the dashboard infrastructure (queries, charts, tables, formatting) is fully operational from Phase 2. The `accounts.primaryKpi` field already stores each account's preferred KPI (CPA or ROAS), which is the anchor for tier classification.

The phase is primarily business logic, not infrastructure. It requires: (1) tier classification using percentile ranking on the account's primary KPI, (2) RSA asset-level analysis joining asset metrics to actual headline/description text, (3) heuristic-based pattern detection to classify copy themes (urgency, social proof, benefit-led, feature-led, CTA type, stats/numbers), (4) underperformer diagnosis using a decision-tree mapping of metric patterns to root causes, (5) Keep/Test/Pause/Investigate classification with generated recommendations, and (6) insight-led chart titles computed from the analysis results.

A critical schema gap exists: `rsaAssetDaily` stores `assetResource` (a Google resource path) but not the actual text content. The text lives in `rsaDaily.headlines`/`rsaDaily.descriptions` JSONB. Either the Google Ads Script needs updating to include `asset.text_asset.text` in the asset query, or the `rsaAssetDaily` schema needs a `textContent` column, or we infer text by matching asset resource position to the headline/description array index. **The recommended approach is to add `textContent` to `rsaAssetDaily` and update the Google Ads Script to join asset text.** This is the cleanest path and avoids brittle position-based matching.

**Primary recommendation:** Build analysis as pure functions in `lib/analysis/` that operate on aggregated data, separate from DB queries. This makes the logic testable, reusable across campaign types later (Phase 4), and keeps the rendering layer thin.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RSA-01 | Performance tier classification -- top 20%, middle 60%, bottom 20% by primary KPI | Percentile calculation on sorted KPI values. Use `accounts.primaryKpi` to select CPA or ROAS. Sort direction matters: low CPA = good, high ROAS = good. |
| RSA-02 | Primary KPI is configurable per account (CPA or ROAS) | Already supported: `accounts.primaryKpi` column exists with default 'cpa'. Need a Settings page or API to change it. |
| RSA-03 | Top/bottom creative leaderboards sorted by performance | Reuse `PerformanceTable` pattern from Phase 2 with tier-aware row highlighting and filtered views (top/bottom tabs). |
| RSA-04 | RSA asset-level analysis (individual headline and description performance) | Requires schema update: add `textContent` to `rsaAssetDaily`. Query aggregates asset metrics by ad + asset, join to headline text. |
| RSA-05 | RSA combination reporting (headline+description pairings that serve and convert) | Google API limitation: `ad_group_ad_asset_combination_view` only provides impressions. Must label combination data as "directional" per CLAUDE.md. Consider adding combination data collection to Google Ads Script. |
| RSA-06 | Underperformer diagnosis (low impressions, low CTR, low CVR, high CPA mapping) | Decision tree in `lib/analysis/`: impressions < threshold -> "Not serving"; impressions OK + CTR low -> "Not resonating"; CTR OK + CVR low -> "Landing page disconnect"; CPA high -> "Wrong audience". |
| RSA-07 | Pattern detection across top performers (copy themes, headline length, CTA type, numbers/stats) | Heuristic regex-based text classifiers. No NLP library needed -- the copy theme categories (urgency, social proof, benefit-led, feature-led) have clear keyword signatures. |
| RSA-08 | Keep/Test/Pause/Investigate recommendation framework per creative | Map tier + diagnosis to recommendation. Top tier -> Keep. Bottom + clear diagnosis -> Pause with specific replacement suggestion. Mixed signals -> Investigate. Middle + pattern match -> Test variant. |
| RSA-09 | Insight-led chart titles computed from data | Compute after analysis: find the strongest pattern among top performers (e.g., "Benefit-led headlines outperform by 34%") and use as chart title. Template: "[Pattern] [verb] by [percentage]". |
</phase_requirements>

## Standard Stack

### Core (already installed, no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 14 | 14.2.35 | App Router, server components for data fetching | Already in use, Phase 2 patterns established |
| Drizzle ORM | 0.45.1 | Database queries with type safety | Already in use, schema defined |
| Recharts | 2.15.4 | Chart rendering (bar, line) | Already in use, design system integrated |
| date-fns | 4.1.0 | Date manipulation for time ranges | Already in use |
| nuqs | 2.8.9 | URL search params for filters and state | Already in use for dashboard |
| Zod | 4.3.6 | Schema validation for API payloads | Already in use for ingestion |

### Supporting (no new packages needed)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| lucide-react | Icons for UI elements (tier badges, diagnosis indicators) | Already installed |
| server-only | Guard server-side query modules | Already installed, used in dashboard queries |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex heuristics for copy themes | compromise.js (NLP) | Overkill -- we have a finite set of known theme keywords. NLP adds 200KB+ bundle for no benefit. Regex is faster, deterministic, and easier to debug. |
| Custom percentile calculation | `percentile` npm package | Single function -- not worth a dependency. 10 lines of code. |
| Separate analysis microservice | In-process lib/analysis/ | No need for a separate service. All computation is lightweight, runs server-side in Next.js. |

**Installation:**
```bash
# No new packages needed. All dependencies are already installed.
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
  analysis/
    tierClassification.ts     # Percentile-based tier assignment
    underperformerDiagnosis.ts # Decision tree for diagnosis
    patternDetection.ts        # Copy theme classification
    recommendations.ts         # Keep/Test/Pause/Investigate engine
    insightTitles.ts           # Dynamic chart title generation
    types.ts                   # Shared analysis types
  queries/
    dashboard.ts               # (existing) General dashboard queries
    rsa.ts                     # RSA-specific data queries
app/
  rsa/
    page.tsx                   # Main RSA analysis page (Server Component)
    searchParams.ts            # RSA-specific URL param definitions
components/
  rsa/
    TierOverview.tsx           # Tier distribution summary (pie/donut or summary cards)
    CreativeLeaderboard.tsx    # Top/bottom creative tables with tier highlighting
    AssetPerformance.tsx       # Individual headline/description performance
    CombinationReport.tsx      # Headline+description combinations (directional)
    UnderperformerPanel.tsx    # Diagnosis cards for bottom-tier creatives
    PatternCharts.tsx          # Copy theme analysis charts with insight-led titles
    RecommendationList.tsx     # Keep/Test/Pause/Investigate action list
```

### Pattern 1: Pure Analysis Functions

**What:** All analysis logic lives in `lib/analysis/` as pure functions that accept aggregated data and return enriched/classified results. No DB access, no React, no side effects.

**When to use:** Always. Every analysis requirement (RSA-01 through RSA-08) is implemented as a pure function.

**Why:** Testable without database. Reusable across campaign types in Phase 4. Clear separation between data layer and business logic.

**Example:**
```typescript
// lib/analysis/tierClassification.ts

export type Tier = 'top' | 'middle' | 'bottom';
export type PrimaryKpi = 'cpa' | 'roas';

export interface TieredCreative {
  adId: string;
  tier: Tier;
  kpiValue: number;
  percentile: number;
  // ... other fields
}

/**
 * Classify creatives into top 20%, middle 60%, bottom 20% tiers
 * by the account's primary KPI.
 *
 * For CPA: lower is better, so top 20% = lowest CPA values.
 * For ROAS: higher is better, so top 20% = highest ROAS values.
 */
export function classifyTiers(
  creatives: Array<{ adId: string; kpiValue: number }>,
  kpiType: PrimaryKpi,
): TieredCreative[] {
  if (creatives.length === 0) return [];

  // Sort: for CPA ascending (low=good), for ROAS descending (high=good)
  const sorted = [...creatives].sort((a, b) =>
    kpiType === 'cpa'
      ? a.kpiValue - b.kpiValue
      : b.kpiValue - a.kpiValue,
  );

  const topCutoff = Math.ceil(sorted.length * 0.2);
  const bottomStart = sorted.length - Math.ceil(sorted.length * 0.2);

  return sorted.map((creative, idx) => ({
    ...creative,
    tier: idx < topCutoff ? 'top' : idx >= bottomStart ? 'bottom' : 'middle',
    percentile: ((sorted.length - idx) / sorted.length) * 100,
  }));
}
```

### Pattern 2: Server Component Data Assembly

**What:** The RSA page is an async Server Component that fetches all data, runs analysis functions, and passes results to client components for rendering.

**When to use:** For the main `/rsa` page and any analysis view.

**Example:**
```typescript
// app/rsa/page.tsx (simplified)
import { fetchRsaCreatives, fetchRsaAssets } from '@/lib/queries/rsa';
import { classifyTiers } from '@/lib/analysis/tierClassification';
import { diagnoseUnderperformers } from '@/lib/analysis/underperformerDiagnosis';
import { detectPatterns } from '@/lib/analysis/patternDetection';
import { generateRecommendations } from '@/lib/analysis/recommendations';

export default async function RsaPage({ searchParams }) {
  const params = rsaSearchParams.parse(await searchParams);
  const account = await fetchAccount(params.account);

  // 1. Fetch raw data
  const [creatives, assets] = await Promise.all([
    fetchRsaCreatives(params.account, dateFrom, dateTo, ...filters),
    fetchRsaAssets(params.account, dateFrom, dateTo),
  ]);

  // 2. Run analysis pipeline
  const tiered = classifyTiers(creatives, account.primaryKpi);
  const diagnosed = diagnoseUnderperformers(tiered);
  const patterns = detectPatterns(tiered);
  const recommendations = generateRecommendations(diagnosed, patterns);

  // 3. Pass to client components
  return (
    <>
      <TierOverview tiered={tiered} />
      <CreativeLeaderboard tiered={tiered} />
      <PatternCharts patterns={patterns} />
      <UnderperformerPanel diagnosed={diagnosed} />
      <RecommendationList recommendations={recommendations} />
    </>
  );
}
```

### Pattern 3: Heuristic Copy Theme Classification

**What:** Regex-based keyword matching to classify headline text into copy themes. No NLP library needed.

**When to use:** For RSA-07 pattern detection.

**Example:**
```typescript
// lib/analysis/patternDetection.ts

export type CopyTheme =
  | 'urgency'
  | 'social_proof'
  | 'benefit_led'
  | 'feature_led'
  | 'price_offer'
  | 'cta_direct'
  | 'stats_numbers';

const THEME_PATTERNS: Record<CopyTheme, RegExp[]> = {
  urgency: [
    /\b(limited|hurry|now|today|last chance|ends? soon|don't miss|act fast|while stocks last)\b/i,
  ],
  social_proof: [
    /\b(\d+[\+,]?\s*(customers?|clients?|reviews?|ratings?|stars?))\b/i,
    /\b(trusted|award[- ]?winning|rated|recommended|popular)\b/i,
  ],
  benefit_led: [
    /\b(save|free|get|enjoy|discover|boost|improve|transform|achieve)\b/i,
  ],
  feature_led: [
    /\b(built[- ]in|includes?|features?|powered by|with|using|technology)\b/i,
  ],
  price_offer: [
    /\b(\d+%\s*off|half price|discount|deal|offer|sale|from \$)\b/i,
  ],
  cta_direct: [
    /\b(shop|buy|order|call|book|sign up|get started|learn more|contact|enquire)\b/i,
  ],
  stats_numbers: [
    /\b\d{2,}[+%xX]?\b/,  // Numbers >= 10 with optional modifier
  ],
};

export function classifyThemes(text: string): CopyTheme[] {
  return Object.entries(THEME_PATTERNS)
    .filter(([_, patterns]) => patterns.some((p) => p.test(text)))
    .map(([theme]) => theme as CopyTheme);
}
```

### Pattern 4: Underperformer Decision Tree

**What:** A systematic mapping of metric patterns to diagnoses, following the CLAUDE.md framework exactly.

**When to use:** For RSA-06.

**Example:**
```typescript
// lib/analysis/underperformerDiagnosis.ts

export type Diagnosis =
  | 'not_serving'
  | 'not_resonating'
  | 'landing_page_disconnect'
  | 'wrong_audience';

export interface DiagnosedCreative {
  adId: string;
  diagnosis: Diagnosis;
  evidence: string;
  action: string;
}

/**
 * Diagnose underperformers using the decision tree from CLAUDE.md:
 * - Low impressions -> not serving
 * - High impressions + low CTR -> not resonating
 * - High CTR + low CVR -> landing page disconnect
 * - High CPA -> wrong audience
 *
 * Thresholds are relative to portfolio averages.
 */
export function diagnoseUnderperformer(
  creative: { impressions: number; ctr: number; cvr: number; cpa: number },
  portfolioAvg: { impressions: number; ctr: number; cvr: number; cpa: number },
): Diagnosis {
  // Check in priority order (most specific first)
  if (creative.impressions < portfolioAvg.impressions * 0.2) {
    return 'not_serving';
  }
  if (creative.ctr < portfolioAvg.ctr * 0.5) {
    return 'not_resonating';
  }
  if (creative.cvr < portfolioAvg.cvr * 0.5 && creative.ctr >= portfolioAvg.ctr * 0.8) {
    return 'landing_page_disconnect';
  }
  return 'wrong_audience';
}
```

### Anti-Patterns to Avoid

- **Client-side analysis computation:** All analysis logic runs server-side. Do NOT compute tiers, diagnoses, or patterns in React components. The Server Component fetches data, runs analysis, and passes results down.

- **Hardcoded absolute thresholds:** Do NOT use fixed thresholds like "CTR < 2% means bad". Use portfolio-relative thresholds (e.g., "CTR < 50% of portfolio average") so the analysis works across industries and account sizes.

- **Trusting Google's performance labels as ground truth:** Google's BEST/GOOD/LOW labels on RSA assets are directional only. Always cross-reference with actual conversion data from `rsaAssetDaily` metrics. Show Google's label alongside real metrics.

- **Treating RSA combination data as having full metrics:** The `ad_group_ad_asset_combination_view` only provides impressions. Do NOT display conversion rates or CPA for combinations. Label combination data as "Reported by Google -- impressions only" per CLAUDE.md guidance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Percentile calculation | Complex statistical library | 10-line sort-and-index function | Only need simple rank-based percentiles, not interpolated quantiles |
| NLP text classification | Full NLP pipeline (compromise.js, etc.) | Regex keyword matching | Finite set of known copy themes. Regex is deterministic, zero-dependency, and runs in microseconds |
| Chart components | New chart wrappers | Extend existing Recharts components from Phase 2 | CreativeBarChart, TimeSeriesChart, ChartTooltip already built. Add tier-coloured variants |
| URL state management | Custom state management | nuqs (already installed) | Dashboard already uses nuqs for search params. RSA page follows same pattern |
| Tabbed navigation | Custom tab component | Simple button group with active state | Only need 2-3 tabs (Overview / Assets / Recommendations). No library needed |

**Key insight:** This phase is 80% business logic and 20% UI. The heavy lifting is in `lib/analysis/` pure functions. The UI reuses Phase 2 component patterns with RSA-specific data shapes.

## Common Pitfalls

### Pitfall 1: Sort Direction Confusion for CPA vs ROAS
**What goes wrong:** Tier classification sorts all KPIs the same way, putting high-CPA creatives in "top" tier.
**Why it happens:** CPA is an inverse metric (lower = better) while ROAS is normal (higher = better). Easy to forget when writing sort logic.
**How to avoid:** The `classifyTiers` function MUST accept `kpiType` parameter and flip sort direction. Write a test case with both CPA and ROAS data sets. Use the existing `invertColour` pattern from `METRICS` in `lib/constants/metrics.ts`.
**Warning signs:** Top-tier creatives having the worst CPA in the UI.

### Pitfall 2: Division-by-Zero in Derived Metrics
**What goes wrong:** CTR, CVR, CPA, ROAS calculations produce NaN or Infinity when denominators are zero.
**Why it happens:** Creatives with zero impressions (CTR), zero clicks (CVR), zero conversions (CPA), or zero cost (ROAS).
**How to avoid:** Guard every division: `denominator === 0 ? 0 : numerator / denominator`. The existing `METRICS` in `lib/constants/metrics.ts` already does this. Apply the same pattern consistently.
**Warning signs:** NaN appearing in tables, charts rendering incorrectly, sort breaking.

### Pitfall 3: RSA Asset Text Not Available in rsaAssetDaily
**What goes wrong:** Asset performance table shows asset resource IDs instead of actual headline/description text because `rsaAssetDaily` schema lacks `textContent`.
**Why it happens:** The current Google Ads Script query for `ad_group_ad_asset_view` does not join to `asset.text_asset.text`. The schema was designed to store the resource path but not the content.
**How to avoid:** Update `rsaAssetDaily` schema to add `textContent` column. Update Google Ads Script to include `asset.text_asset.text` in the asset query SELECT. Update seed data to populate text content. This is a prerequisite for RSA-04 and RSA-07.
**Warning signs:** Asset performance views showing opaque resource paths like "customers/1234/assets/5678".

### Pitfall 4: Combination Data Presented with Misleading Metrics
**What goes wrong:** Users see conversion rates for headline+description combinations, implying Google provides this data.
**Why it happens:** Developer assumes combination view has full metrics like the asset view.
**How to avoid:** Google's `ad_group_ad_asset_combination_view` only provides impressions. Label ALL combination data as "Top combinations reported by Google -- impressions only". Do NOT compute CTR or CPA for combinations. Per CLAUDE.md: "Google ratings are directional only."
**Warning signs:** Combination tables showing clicks, conversions, or CPA columns.

### Pitfall 5: Pattern Detection Overfitting to Small Samples
**What goes wrong:** "Urgency headlines outperform by 200%" when there's only 1 urgency headline and 1 non-urgency headline.
**Why it happens:** Percentage differences are meaningless with tiny sample sizes.
**How to avoid:** Set minimum sample thresholds for pattern claims: require at least 3 creatives matching a theme AND 3 not matching before computing a comparison. Display "Insufficient data" instead of misleading percentages.
**Warning signs:** Insight titles showing extreme percentages (>100% difference).

### Pitfall 6: Sidebar Navigation Not Updated
**What goes wrong:** The RSA Analysis nav link in Sidebar.tsx still shows "Soon" and is disabled after building the RSA page.
**Why it happens:** Forgetting to update the `navItems` array in `components/layout/Sidebar.tsx`.
**How to avoid:** Update `Sidebar.tsx` to enable the RSA link, set `active` based on current route, and change href to `/rsa` with proper search params.
**Warning signs:** Users can't navigate to the RSA page from the sidebar.

## Code Examples

### RSA-Specific Database Query

```typescript
// lib/queries/rsa.ts
import 'server-only';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, gte, lte, sum, sql } from 'drizzle-orm';

export interface RsaCreativeAggregated {
  adId: string;
  campaignName: string;
  adGroupName: string;
  headlines: Array<{ text: string; pinnedField?: string }>;
  descriptions: Array<{ text: string; pinnedField?: string }>;
  adStrength: string | null;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
}

/**
 * Fetch RSA creatives aggregated over a date range.
 * Groups by adId, takes latest headlines/descriptions (they shouldn't change).
 */
export async function fetchRsaCreatives(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<RsaCreativeAggregated[]> {
  const conditions = [
    eq(schema.rsaDaily.accountId, accountId),
    gte(schema.rsaDaily.date, dateFrom),
    lte(schema.rsaDaily.date, dateTo),
  ];

  if (campaignId) conditions.push(eq(schema.rsaDaily.campaignId, campaignId));
  if (adGroupId) conditions.push(eq(schema.rsaDaily.adGroupId, adGroupId));

  const rows = await db
    .select({
      adId: schema.rsaDaily.adId,
      campaignName: schema.rsaDaily.campaignName,
      adGroupName: schema.rsaDaily.adGroupName,
      headlines: schema.rsaDaily.headlines,
      descriptions: schema.rsaDaily.descriptions,
      adStrength: schema.rsaDaily.adStrength,
      impressions: sum(schema.rsaDaily.impressions).mapWith(Number),
      clicks: sum(schema.rsaDaily.clicks).mapWith(Number),
      costMicros: sum(schema.rsaDaily.costMicros).mapWith(Number),
      conversions: sum(schema.rsaDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.rsaDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.rsaDaily)
    .where(and(...conditions))
    .groupBy(
      schema.rsaDaily.adId,
      schema.rsaDaily.campaignName,
      schema.rsaDaily.adGroupName,
      schema.rsaDaily.headlines,
      schema.rsaDaily.descriptions,
      schema.rsaDaily.adStrength,
    );

  return rows.map((r) => ({
    adId: r.adId,
    campaignName: r.campaignName,
    adGroupName: r.adGroupName,
    headlines: r.headlines as Array<{ text: string; pinnedField?: string }>,
    descriptions: r.descriptions as Array<{ text: string; pinnedField?: string }>,
    adStrength: r.adStrength,
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    costMicros: r.costMicros ?? 0,
    conversions: r.conversions ?? 0,
    conversionsValue: r.conversionsValue ?? 0,
  }));
}
```

### Insight-Led Title Generation

```typescript
// lib/analysis/insightTitles.ts

import type { CopyTheme } from './patternDetection';

const THEME_LABELS: Record<CopyTheme, string> = {
  urgency: 'Urgency-driven',
  social_proof: 'Social proof',
  benefit_led: 'Benefit-led',
  feature_led: 'Feature-led',
  price_offer: 'Price/offer',
  cta_direct: 'Direct CTA',
  stats_numbers: 'Stats/numbers',
};

/**
 * Generate an insight-led chart title from pattern analysis results.
 * Returns a title like "Benefit-led headlines outperform by 34%"
 * or a sensible fallback if no clear pattern exists.
 */
export function generateInsightTitle(
  patterns: Array<{
    theme: CopyTheme;
    avgKpi: number;
    count: number;
  }>,
  overallAvgKpi: number,
  kpiType: 'cpa' | 'roas',
  minSampleSize: number = 3,
): string {
  // Filter to patterns with enough data
  const viable = patterns.filter((p) => p.count >= minSampleSize);

  if (viable.length === 0) {
    return 'Creative Performance by Copy Theme';
  }

  // Find the best-performing theme
  // For CPA: lowest avg is best. For ROAS: highest avg is best.
  const best = viable.reduce((a, b) => {
    if (kpiType === 'cpa') return a.avgKpi < b.avgKpi ? a : b;
    return a.avgKpi > b.avgKpi ? a : b;
  });

  // Calculate percentage difference from overall average
  const diff = kpiType === 'cpa'
    ? ((overallAvgKpi - best.avgKpi) / overallAvgKpi) * 100
    : ((best.avgKpi - overallAvgKpi) / overallAvgKpi) * 100;

  if (diff <= 5) {
    return 'Creative Performance by Copy Theme';
  }

  const label = THEME_LABELS[best.theme];
  const verb = kpiType === 'cpa' ? 'reduce CPA by' : 'outperform by';
  return `${label} headlines ${verb} ${Math.round(diff)}%`;
}
```

### Recommendation Engine

```typescript
// lib/analysis/recommendations.ts

export type RecommendationAction = 'keep' | 'test' | 'pause' | 'investigate';

export interface Recommendation {
  adId: string;
  action: RecommendationAction;
  priority: number; // 1 = highest
  summary: string;
  details: string;
}

/**
 * Generate Keep/Test/Pause/Investigate recommendations.
 * Maps tier + diagnosis + patterns to actionable advice.
 */
export function generateRecommendation(
  creative: {
    adId: string;
    tier: 'top' | 'middle' | 'bottom';
    diagnosis?: string;
    matchedPatterns: string[];
    kpiValue: number;
  },
  topPatterns: string[], // patterns common among top performers
): Recommendation {
  if (creative.tier === 'top') {
    return {
      adId: creative.adId,
      action: 'keep',
      priority: 3,
      summary: 'Top performer -- keep running',
      details: 'This creative is in the top 20% by performance. Maintain current budget allocation.',
    };
  }

  if (creative.tier === 'bottom') {
    if (!creative.diagnosis) {
      return {
        adId: creative.adId,
        action: 'investigate',
        priority: 2,
        summary: 'Underperforming -- needs investigation',
        details: 'Bottom 20% but no clear diagnosis. Check ad strength and landing page.',
      };
    }

    return {
      adId: creative.adId,
      action: 'pause',
      priority: 1,
      summary: `Pause -- ${creative.diagnosis.replace(/_/g, ' ')}`,
      details: generatePauseDetail(creative.diagnosis, topPatterns),
    };
  }

  // Middle tier
  const missingPatterns = topPatterns.filter(
    (p) => !creative.matchedPatterns.includes(p),
  );

  if (missingPatterns.length > 0) {
    return {
      adId: creative.adId,
      action: 'test',
      priority: 2,
      summary: `Test adding ${missingPatterns[0].replace(/_/g, ' ')} elements`,
      details: `Top performers commonly use ${missingPatterns.join(', ')}. Test a variant incorporating these themes.`,
    };
  }

  return {
    adId: creative.adId,
    action: 'keep',
    priority: 3,
    summary: 'Performing adequately -- monitor',
    details: 'Middle tier with patterns matching top performers. Monitor for changes.',
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual RSA headline testing | Google auto-serves and rates headline combinations | 2022+ | Cannot directly A/B test headlines. Must infer from asset-level and combination-level data |
| ETAs (Expanded Text Ads) with full control | RSAs with Google-controlled assembly | June 2022 (ETAs sunset) | All Search campaigns now use RSAs. This tool analyses what Google has assembled |
| Performance labels only (BEST/GOOD/LOW) | Headline-level clicks + conversions data | Late 2024 | Can now see actual metric data per headline, not just Google's directional labels |
| Combination data had no metrics | Combination data has impressions only | 2022+ | Combinations still limited to impressions. No click/conversion data at combination level |

**Deprecated/outdated:**
- Expanded Text Ads (ETAs): Sunset June 2022. All analysis is RSA-focused now.
- Google's performance labels as sole metric: Now supplementary. Real click/conversion data available at asset level.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (needs installation) |
| Config file | vitest.config.mts (needs creation -- Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~5 seconds |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RSA-01 | Tier classification assigns top 20%, middle 60%, bottom 20% correctly | unit | `npx vitest run lib/analysis/tierClassification.test.ts` | No -- Wave 0 gap |
| RSA-02 | CPA vs ROAS sort direction is correct | unit | `npx vitest run lib/analysis/tierClassification.test.ts` | No -- Wave 0 gap |
| RSA-06 | Underperformer diagnosis maps metric patterns to correct diagnosis | unit | `npx vitest run lib/analysis/underperformerDiagnosis.test.ts` | No -- Wave 0 gap |
| RSA-07 | Copy theme regex classifies known examples correctly | unit | `npx vitest run lib/analysis/patternDetection.test.ts` | No -- Wave 0 gap |
| RSA-08 | Recommendation engine maps tier + diagnosis to correct action | unit | `npx vitest run lib/analysis/recommendations.test.ts` | No -- Wave 0 gap |
| RSA-09 | Insight title generation produces correct format and handles edge cases | unit | `npx vitest run lib/analysis/insightTitles.test.ts` | No -- Wave 0 gap |
| RSA-03 | Leaderboard displays tier-highlighted rows correctly | manual-only | Visual inspection | N/A -- UI component |
| RSA-04 | Asset performance shows headline text with metrics | manual-only | Visual inspection + query verification | N/A -- depends on schema update |
| RSA-05 | Combination report labelled as directional | manual-only | Visual inspection | N/A -- UI component |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npx vitest run --reporter=verbose`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] Install Vitest: `npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths`
- [ ] Create `vitest.config.mts` -- configure with react plugin, tsconfig paths, jsdom environment
- [ ] Add `"test": "vitest"` to package.json scripts
- [ ] `lib/analysis/tierClassification.test.ts` -- covers RSA-01, RSA-02
- [ ] `lib/analysis/underperformerDiagnosis.test.ts` -- covers RSA-06
- [ ] `lib/analysis/patternDetection.test.ts` -- covers RSA-07
- [ ] `lib/analysis/recommendations.test.ts` -- covers RSA-08
- [ ] `lib/analysis/insightTitles.test.ts` -- covers RSA-09

## Open Questions

1. **RSA Asset Text Content Mapping**
   - What we know: `rsaAssetDaily` has `assetResource` (path) but no `textContent`. The Google Ads Script can be updated to include `asset.text_asset.text` in the `ad_group_ad_asset_view` query.
   - What's unclear: Whether the existing seed data approach will still work after adding textContent. Need to update both the script and seed generator.
   - Recommendation: Add `textContent` column to `rsaAssetDaily` schema, update Google Ads Script query to include text, update seed data to populate text content. This is a prerequisite task for the first plan wave.

2. **RSA Combination Data Collection**
   - What we know: The current Google Ads Script does not query `ad_group_ad_asset_combination_view` at all. The API only provides impressions for combinations.
   - What's unclear: Whether to add combination data to the existing ingestion pipeline or defer to a later enhancement.
   - Recommendation: Add a new `rsaCombinations` array to the ingestion payload and a `rsa_combination_daily` table. Even with just impressions, showing "which headline+description pairings Google shows most" is valuable directional data. Label as directional per CLAUDE.md.

3. **KPI Configuration UI**
   - What we know: `accounts.primaryKpi` exists in the schema with default 'cpa'. RSA-02 requires it to be configurable.
   - What's unclear: Whether to build a full Settings page or just add a KPI toggle on the RSA page.
   - Recommendation: Add a minimal Settings page at `/settings` with account KPI selection. The sidebar already has a Settings nav item.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `lib/db/schema.ts`, `lib/queries/dashboard.ts`, `lib/validation/ingestionSchema.ts`, `scripts/google-ads/creative-analyser.js` -- thoroughly reviewed, all current
- CLAUDE.md -- project design system and analysis framework requirements
- Google Ads API `ad_group_ad_asset_view` field docs: confirms clicks, cost_micros, conversions, performance_label available at asset level

### Secondary (MEDIUM confidence)
- [Google Ads Help: Combinations report](https://support.google.com/google-ads/answer/11894820) -- confirms impressions-only limitation for RSA combinations
- [Google Ads API: Fetching assets](https://developers.google.com/google-ads/api/docs/assets/fetching-assets) -- documents asset reporting capabilities
- [Google Ads API: ad_group_ad_asset_combination_view](https://developers.google.com/google-ads/api/fields/v18/ad_group_ad_asset_combination_view) -- confirms combination view has metrics but impressions only
- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) -- official setup instructions

### Tertiary (LOW confidence)
- [Search Engine Land: RSA headline metrics](https://searchengineland.com/google-ads-rsa-headline-performance-data-459541) -- reports on headline-level metric availability (confirmed by primary sources)
- [Google Ads community forums](https://groups.google.com/g/adwords-api/c/t6LJcdwsqzM) -- community confirmation that combination view only has impressions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in place
- Architecture: HIGH -- follows established patterns from Phase 2, pure-function analysis is well-understood
- Pitfalls: HIGH -- identified through codebase analysis and Google Ads API documentation review
- Schema gap (textContent): HIGH -- verified by reading both schema.ts and creative-analyser.js

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable domain, no fast-moving dependencies)
