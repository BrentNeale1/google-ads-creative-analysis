# Phase 4: Multi-Format Analysis and Intelligence - Research

**Researched:** 2026-03-02
**Domain:** PMax/Display/Video creative analysis, creative gap analysis, fatigue detection, Monday briefing
**Confidence:** HIGH

## Summary

Phase 4 extends the analysis framework established in Phase 3 (RSA) to three additional creative formats (PMax, Display, Video) and adds three cross-cutting intelligence features (gap analysis, fatigue detection, Monday briefing). The existing codebase is exceptionally well-positioned for this: the database schema already supports all four format tables (`pmaxAssetGroupDaily`, `pmaxAssetDaily`, `displayDaily`, `videoDaily`) with ingestion fully operational, seed data already generates all formats, and the core analysis functions (`classifyTiers`, `diagnoseUnderperformers`, `detectPatterns`, `generateRecommendations`, `generateInsightTitle`) are pure functions that operate on a generic `CreativeInput` interface with `adId` and `kpiValue`. The RSA page (`/rsa`) provides a complete UI pattern (Server Component orchestration, tab navigation, tier overview, leaderboard, diagnosis, patterns, recommendations) that can be replicated with format-specific adaptations.

The key architectural decision is whether to generalise the existing RSA-specific analysis code or replicate it per format. The existing `lib/analysis/` functions are already format-agnostic in their interfaces -- they accept `CreativeInput[]` and return `TieredCreative[]`. The format-specific concern is in the queries layer (`lib/queries/`) and the UI components (`components/`). Each format has unique characteristics: PMax operates at asset group level with Google-controlled creative assembly (no text-level pattern detection possible), Display has format comparisons (ad type: responsive display, image, discovery), and Video has unique metrics (view rate, quartile completion, CPV). The intelligence features (gap analysis, fatigue detection, Monday briefing) are new modules that cut across all formats.

The schema has one gap: `displayDaily` stores `adType` (RESPONSIVE_DISPLAY_AD, IMAGE_AD, DISCOVERY_MULTI_ASSET_AD) but not image dimensions or aspect ratio. DISP-03 requires format comparison (square vs landscape vs portrait). The best approach is to add an `imageFormat` text column to `displayDaily` and update the Zod schema and Google Ads Script to include this. Alternatively, format can be inferred from `adType` in the analysis layer (responsive display ads are multi-format, image ads have a single format). For v1, mapping `adType` to a format category in the analysis layer is simpler and avoids a schema migration.

**Primary recommendation:** Reuse the existing `lib/analysis/` pure functions for tier classification, underperformer diagnosis, and recommendations across all formats. Create format-specific query modules (`lib/queries/pmax.ts`, `lib/queries/display.ts`, `lib/queries/video.ts`) and format-specific UI pages/components following the RSA pattern. Build intelligence features as new modules in `lib/analysis/`. Each format page follows the exact same Server Component orchestration pattern as `/rsa`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PMAX-01 | Performance tier classification for PMax asset groups | Reuse `classifyTiers()` directly -- accepts `CreativeInput[]` with `adId` (assetGroupId) and `kpiValue`. Query `pmaxAssetGroupDaily` aggregated by assetGroupId. |
| PMAX-02 | Asset group performance leaderboard | Reuse `CreativeLeaderboard` component pattern from RSA. PMax leaderboard shows asset group name instead of headline preview. |
| PMAX-03 | Asset group theme analysis (creative theme vs performance) | PMax theme analysis is at asset group level, not headline text level. Use `assetGroupName` for naming and `pmaxAssetDaily` text content for theme detection where asset type is TEXT. Caveat: Google controls creative assembly in PMax. |
| PMAX-04 | Underperformer diagnosis for asset groups | Reuse `diagnoseUnderperformers()` directly -- same decision tree applies. Portfolio averages computed from `pmaxAssetGroupDaily`. |
| PMAX-05 | Pattern detection across top-performing asset groups | Use `detectPatterns()` on PMax creatives where headlineText is derived from TEXT-type assets in `pmaxAssetDaily`. Must join asset group daily metrics with asset text content. |
| PMAX-06 | Keep/Test/Pause/Investigate recommendations for asset groups | Reuse `generateRecommendations()` directly. PMax-specific recommendation text should note Google controls creative assembly. |
| DISP-01 | Performance tier classification for display/demand gen creatives | Reuse `classifyTiers()` directly -- accepts `CreativeInput[]` with `adId` and `kpiValue`. Query `displayDaily` aggregated by adId. |
| DISP-02 | Creative leaderboard for display ads | Reuse leaderboard pattern. Display shows `adName` or adId, plus `adType` badge. |
| DISP-03 | Format performance comparison (square vs landscape vs portrait) | Map `adType` field to format categories in analysis layer. RESPONSIVE_DISPLAY_AD = multi-format, IMAGE_AD = single format. Group by adType for comparison chart. Schema gap: no image dimensions field. v1 approach: use adType as proxy for format analysis. |
| DISP-04 | Underperformer diagnosis for display creatives | Reuse `diagnoseUnderperformers()` directly. |
| DISP-05 | Pattern detection across top-performing display creatives | Display ads lack headline text in the current schema (no JSONB headlines field like RSA). Pattern detection for display is limited to adType/format patterns, not copy themes. This is a known limitation -- display analysis focuses on format performance, not text patterns. |
| DISP-06 | Keep/Test/Pause/Investigate recommendations for display | Reuse `generateRecommendations()`. For middle-tier creatives without text, skip pattern-based "test" recommendations and default to "monitor". |
| VID-01 | Performance tier classification for video creatives | Reuse `classifyTiers()` directly. |
| VID-02 | Video creative leaderboard | Reuse leaderboard pattern. Video shows `adName`, plus video-specific metric columns (view rate, VTR). |
| VID-03 | Video-specific metrics (view rate, watch time, VTR) | `videoDaily` schema already stores `videoViews`, `videoViewRate`, `averageCpvMicros`, and quartile completion rates (P25, P50, P75, P100). These become additional columns in the leaderboard and diagnostic views. VTR (view-through rate) = P100 completion rate. Watch time proxy = quartile progression analysis. |
| VID-04 | Underperformer diagnosis for video creatives | Reuse `diagnoseUnderperformers()`. Video adds a unique diagnosis path: high impressions + low view rate = "video not engaging" (analogous to "not resonating"). High view rate + low CTR = "missing CTA". |
| VID-05 | Pattern detection across top-performing videos | Limited by schema: video ads lack text content fields. Pattern detection for video is based on video-specific metrics (view rate ranges, completion patterns) rather than copy themes. Group top performers by view rate and completion quartile patterns. |
| VID-06 | Keep/Test/Pause/Investigate recommendations for video | Reuse `generateRecommendations()` with video-specific recommendation text. |
| INTL-01 | Gap analysis -- identify untested creative angles and selling points | New module `lib/analysis/gapAnalysis.ts`. Compare themes detected across the portfolio against a full theme taxonomy. Identify themes with zero or minimal representation. Output: list of untested angles with suggested test directions. |
| INTL-02 | Creative fatigue detection (performance declining over time) | New module `lib/analysis/fatigueDetection.ts`. Compare per-creative KPI in recent period vs prior period. Flag creatives where KPI degraded beyond a threshold (e.g. CPA increased >20%, ROAS decreased >20%) with statistical significance filter (minimum impression count). |
| INTL-03 | Monday morning briefing view (what changed, what needs attention, what to do) | New page `/briefing`. Server Component that fetches 7-day vs prior 7-day data across all formats. Sections: (1) What changed -- biggest movers up and down, (2) What needs attention -- newly flagged underperformers, fatigued creatives, (3) What to do -- top 5 prioritised actions from recommendations engine. |
</phase_requirements>

## Standard Stack

### Core (already installed, no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 14 | 14.2.35 | App Router, Server Components for data fetching | Already in use, Phase 2-3 patterns established |
| Drizzle ORM | 0.45.1 | Database queries with type safety | Already in use, all schema tables defined |
| Recharts | 2.15.4 | Chart rendering (bar, line) | Already in use, design system integrated |
| date-fns | 4.1.0 | Date manipulation for time ranges and fatigue detection | Already in use |
| nuqs | 2.8.9 | URL search params for tab navigation and filters | Already in use for dashboard and RSA |
| Zod | 4.3.6 | Schema validation for API payloads | Already in use for ingestion |
| Vitest | 4.0.18 | Unit testing for analysis functions | Already configured, Phase 3 tests exist |

### Supporting (no new packages needed)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| lucide-react | Icons for UI elements (format badges, briefing indicators) | Already installed |
| server-only | Guard server-side query modules | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| adType-based format analysis | Schema migration for image dimensions | adType is sufficient for v1 format comparison. Image dimensions would require Google Ads Script changes and DB migration for marginal benefit. |
| Per-format analysis functions | Single generic analysis module | Per-format keeps the code straightforward and matches the RSA pattern. Generic module would add abstraction overhead without clear benefit -- each format has unique characteristics. |
| Time-series fatigue detection library | Custom sliding window comparison | Simple period-over-period comparison is sufficient. No need for trend libraries -- the fatigue signal is degradation beyond a threshold, not curve fitting. |

**Installation:**
```bash
# No new packages needed. All dependencies are already installed.
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
  analysis/
    tierClassification.ts          # (existing) Reused for all formats
    underperformerDiagnosis.ts     # (existing) Reused for all formats
    patternDetection.ts            # (existing) Reused where text available
    recommendations.ts             # (existing) Reused for all formats
    insightTitles.ts               # (existing) Reused for all formats
    types.ts                       # (existing) May need minor extensions
    gapAnalysis.ts                 # NEW: untested creative angles
    fatigueDetection.ts            # NEW: performance decline detection
    videoAnalysis.ts               # NEW: video-specific diagnosis helpers
  queries/
    dashboard.ts                   # (existing) Cross-format aggregation
    rsa.ts                         # (existing) RSA-specific queries
    pmax.ts                        # NEW: PMax asset group + asset queries
    display.ts                     # NEW: Display creative queries
    video.ts                       # NEW: Video creative queries
    briefing.ts                    # NEW: Cross-format briefing data

app/
  pmax/
    page.tsx                       # NEW: PMax analysis page (Server Component)
    searchParams.ts                # NEW: PMax URL params
  display/
    page.tsx                       # NEW: Display analysis page
    searchParams.ts
  video/
    page.tsx                       # NEW: Video analysis page
    searchParams.ts
  briefing/
    page.tsx                       # NEW: Monday briefing page

components/
  shared/                          # NEW: Shared analysis components
    TierOverview.tsx               # Extracted from rsa/ for reuse
    CreativeLeaderboard.tsx        # Generalised version
    UnderperformerPanel.tsx        # Shared diagnosis panel
    RecommendationList.tsx         # Shared recommendations
    TabNav.tsx                     # Generic tab navigation
  pmax/
    PmaxAssetBreakdown.tsx         # NEW: Asset group asset breakdown
    PmaxThemeAnalysis.tsx          # NEW: Theme vs performance
  display/
    FormatComparison.tsx           # NEW: Square vs landscape vs portrait
  video/
    VideoMetrics.tsx               # NEW: View rate, quartile, VTR display
    VideoEngagementChart.tsx       # NEW: Quartile completion funnel
  briefing/
    BriefingSection.tsx            # NEW: Briefing card components
    ChangeIndicator.tsx            # NEW: Up/down movement indicators
```

### Pattern 1: Server Component Page Orchestration (established in RSA)

**What:** Each format page is a Server Component that fetches data, runs analysis pipeline, and passes serialisable results to Client Components.
**When to use:** Every format analysis page follows this exact pattern.
**Example:**
```typescript
// app/pmax/page.tsx (follows RSA page pattern)
export default async function PmaxPage({ searchParams }: Props) {
  const params = pmaxSearchParams.parse(await searchParams);

  // 1. Fetch account + KPI setting
  const account = await getAccount(params.account);
  const primaryKpi = account.primaryKpi as PrimaryKpi;

  // 2. Resolve date range
  const { dateFrom, dateTo } = resolveDateRange(params);

  // 3. Fetch data in parallel
  const [assetGroups, portfolioAvg, filterOptions] = await Promise.all([
    fetchPmaxAssetGroups(params.account, dateFrom, dateTo),
    fetchPmaxPortfolioAvg(params.account, dateFrom, dateTo),
    fetchFilterOptions(params.account),
  ]);

  // 4. Enrich as CreativeInput[]
  const creativeInputs: CreativeInput[] = assetGroups.map(ag => ({
    adId: ag.assetGroupId,
    kpiValue: primaryKpi === 'cpa' ? ag.cpa : ag.roas,
    headlineText: ag.textAssetContent, // joined text from pmaxAssetDaily
    // pass through metrics...
  }));

  // 5. Run shared analysis pipeline
  const tiered = classifyTiers(creativeInputs, primaryKpi);
  const diagnosed = diagnoseUnderperformers(tiered, portfolioAvg);
  const patterns = detectPatterns(tiered);
  const recommendations = generateRecommendations(tiered, diagnosed, patterns);

  // 6. Render with Client Components
  return <div>...</div>;
}
```

### Pattern 2: Format-Specific Query Module

**What:** Each format gets its own query module in `lib/queries/` with `fetchXxxCreatives()`, `fetchXxxPortfolioAvg()`, and format-specific queries.
**When to use:** Each format page needs aggregated data and portfolio averages.
**Example:**
```typescript
// lib/queries/pmax.ts
import "server-only";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function fetchPmaxAssetGroups(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
): Promise<PmaxAssetGroupAggregated[]> {
  // Same pattern as fetchRsaCreatives:
  // Aggregate by assetGroupId, compute derived metrics (CTR, CVR, CPA, ROAS)
  // with zero-division guards
}

export async function fetchPmaxPortfolioAvg(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<PortfolioAvg> {
  // Same pattern as fetchRsaPortfolioAvg
}
```

### Pattern 3: Shared Component Extraction

**What:** Extract common RSA components into shared components that accept format-agnostic props, then create format-specific wrappers for unique UI.
**When to use:** When 3+ format pages need the same UI (tier overview, leaderboard, diagnosis, recommendations).
**Example:**
```typescript
// Components that can be shared directly:
// - TierOverview (already generic -- accepts TieredCreative[])
// - UnderperformerPanel (already generic -- accepts DiagnosedCreative[])
// - RecommendationList (already generic -- accepts Recommendation[])
// - PatternCharts (already generic -- accepts PatternResult[])

// Components needing format-specific versions:
// - CreativeLeaderboard: RSA shows headline preview, PMax shows asset group name,
//   Display shows ad name + type badge, Video shows ad name + view metrics
```

### Pattern 4: Intelligence Module Architecture

**What:** Intelligence features (gap analysis, fatigue, briefing) are new pure functions that operate on already-fetched data.
**When to use:** INTL-01, INTL-02, INTL-03.
**Example:**
```typescript
// lib/analysis/gapAnalysis.ts
export function identifyGaps(
  detectedThemes: CopyTheme[],
  fullTaxonomy: CopyTheme[],
): GapResult[] {
  // Compare detected themes against full taxonomy
  // Return themes with zero or minimal representation
}

// lib/analysis/fatigueDetection.ts
export function detectFatigue(
  currentPeriod: CreativeMetrics[],
  priorPeriod: CreativeMetrics[],
  threshold: number, // e.g. 0.20 = 20% degradation
  minImpressions: number, // e.g. 100
): FatiguedCreative[] {
  // Compare KPI between periods per creative
  // Flag those exceeding degradation threshold
}
```

### Anti-Patterns to Avoid

- **Over-abstracting analysis functions:** The existing `classifyTiers`, `diagnoseUnderperformers`, etc. are already generic enough. Do NOT create an abstract `AnalysisPipeline` class or factory pattern. Each page assembles the pipeline explicitly in the Server Component.
- **Sharing query modules across formats:** Each format has different table structure and unique fields. Keep query modules separate per format (pmax.ts, display.ts, video.ts) even though they follow the same pattern.
- **Moving UI components to a shared folder too aggressively:** Only extract to `components/shared/` when the component is truly identical across formats. If a component needs even minor format-specific logic (e.g. different column headers), keep it format-specific.
- **Crossing Server/Client boundary with functions:** Per Phase 3 decision (03-04), functions cannot cross the Next.js Server/Client boundary. Create `formatKpi` inside each Client Component from `kpiType` prop.
- **Adding new npm packages for simple logic:** Fatigue detection, gap analysis, and briefing aggregation are all straightforward computations. No libraries needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tier classification | Custom percentile logic per format | Existing `classifyTiers()` | Already tested, handles edge cases (empty input, single item, CPA vs ROAS direction) |
| Underperformer diagnosis | Custom diagnosis per format | Existing `diagnoseUnderperformers()` | Same decision tree applies to all formats -- the diagnostic categories (not serving, not resonating, landing page disconnect, wrong audience) are universal |
| URL search params | Custom query string parsing | nuqs `createSearchParamsCache` | Already used for dashboard and RSA, handles type safety and defaults |
| Date range resolution | Custom date logic | Existing `resolveDateRange()` | Already implemented identically in dashboard and RSA searchParams |
| Number formatting | Per-component formatting | Existing `lib/constants/formatting.ts` | AU locale formatting already correct |
| Chart styling | Custom chart configs | Existing Recharts patterns from PatternCharts | Design system colours, gridline styles, label formatting all established |

**Key insight:** Phase 4 is primarily a replication and extension exercise, not a greenfield build. The analysis framework, UI patterns, query patterns, and formatting are all established. The risk is in introducing unnecessary abstraction rather than straightforward replication.

## Common Pitfalls

### Pitfall 1: PMax "Directional Only" Caveats Missing

**What goes wrong:** PMax analysis presented with same confidence level as RSA, when Google controls creative assembly in PMax campaigns.
**Why it happens:** Copy-pasting RSA patterns without adding PMax-specific caveats.
**How to avoid:** Every PMax analysis view must include a prominent caveat banner (same pattern as RSA combination report): "Google controls creative assembly in Performance Max campaigns. Asset group performance data is directional -- it reflects Google's optimisation choices, not controlled creative tests."
**Warning signs:** PMax page renders without any caveat banners.

### Pitfall 2: Video Analysis Using Standard CTR Diagnosis

**What goes wrong:** Video creatives diagnosed as "not resonating" based on low CTR, when video metrics use view rate and completion as primary engagement signals.
**Why it happens:** Reusing RSA diagnosis thresholds without adapting for video-specific metrics.
**How to avoid:** Video underperformer diagnosis should prioritise view rate and quartile completion over CTR. A video with high impressions + low view rate is the video equivalent of "not resonating". High view rate + low click rate may be acceptable for awareness campaigns.
**Warning signs:** Video creatives all diagnosed as "not resonating" due to naturally low CTR.

### Pitfall 3: Display Format Comparison Without Data

**What goes wrong:** DISP-03 requires square vs landscape vs portrait comparison, but `displayDaily` schema only has `adType` (RESPONSIVE_DISPLAY_AD, IMAGE_AD, DISCOVERY_MULTI_ASSET_AD), not image dimensions.
**Why it happens:** Schema designed for metrics aggregation, not format-level breakdown.
**How to avoid:** For v1, use `adType` as the format grouping dimension. RESPONSIVE_DISPLAY_AD encompasses multiple formats (Google serves the best fit). IMAGE_AD could have an optional format field added later. The comparison chart groups by ad type, which is the actionable dimension for the advertiser.
**Warning signs:** Empty format comparison chart or chart with only one category.

### Pitfall 4: Pattern Detection Failing on Non-RSA Formats

**What goes wrong:** `detectPatterns()` expects `headlineText` on `TieredCreative`, but Display and Video ads don't have headlines in the same way.
**Why it happens:** Pattern detection was designed for RSA headline text analysis.
**How to avoid:** For PMax: join `pmaxAssetDaily` TEXT-type assets to get headline text for pattern detection. For Display: skip text-based pattern detection, focus on format/type patterns instead. For Video: skip text-based pattern detection, focus on engagement metric patterns instead. The pattern detection is optional per format -- not all formats have analysable text.
**Warning signs:** Pattern chart shows "Not enough data" for all non-RSA formats even with many creatives.

### Pitfall 5: Monday Briefing Querying All Historical Data

**What goes wrong:** Briefing page makes expensive queries across all formats and all time, causing slow load times.
**Why it happens:** Fetching full history instead of targeted 7-day windows.
**How to avoid:** Briefing page should fetch exactly two 7-day windows (current and prior) per format. Use Promise.all for parallel fetching across formats. Pre-compute change metrics server-side. Target total query time under 2 seconds.
**Warning signs:** Briefing page takes more than 3 seconds to load.

### Pitfall 6: Sidebar Nav Links Not Enabled

**What goes wrong:** New format pages built but sidebar still shows them as disabled (opacity-50, cursor-not-allowed, "Soon" label).
**Why it happens:** Sidebar `navItems` array has `disabled: true` for PMax, Display, Video.
**How to avoid:** Update `components/layout/Sidebar.tsx` navItems to set `disabled: false` for each format as its page is completed. Add Briefing nav item.
**Warning signs:** Users cannot navigate to new pages despite them being implemented.

### Pitfall 7: Settings Page Not Revalidating New Format Pages

**What goes wrong:** Changing primary KPI in Settings doesn't update PMax/Display/Video pages.
**Why it happens:** Settings `revalidatePath` only includes `/settings` and `/rsa` (added in 03-04).
**How to avoid:** Add `revalidatePath('/pmax')`, `revalidatePath('/display')`, `revalidatePath('/video')`, `revalidatePath('/briefing')` to the `updatePrimaryKpi` Server Action.
**Warning signs:** Changing KPI in settings, then navigating to a format page shows stale tier classifications.

## Code Examples

Verified patterns from existing codebase:

### Query Module Template (from lib/queries/rsa.ts)

```typescript
// lib/queries/pmax.ts -- follows exact same pattern as rsa.ts
import "server-only";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sum, desc } from "drizzle-orm";
import { convertMicrosToAud } from "@/lib/constants/formatting";

export interface PmaxAssetGroupAggregated {
  assetGroupId: string;
  assetGroupName: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
  costAud: number;
  ctr: number;
  cvr: number;
  cpa: number;
  roas: number;
}

function safeDivide(n: number, d: number): number {
  return d === 0 ? 0 : n / d;
}

export async function fetchPmaxAssetGroups(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
): Promise<PmaxAssetGroupAggregated[]> {
  const conditions = [
    eq(schema.pmaxAssetGroupDaily.accountId, accountId),
    gte(schema.pmaxAssetGroupDaily.date, dateFrom),
    lte(schema.pmaxAssetGroupDaily.date, dateTo),
  ];
  if (campaignId) {
    conditions.push(eq(schema.pmaxAssetGroupDaily.campaignId, campaignId));
  }

  const rows = await db
    .select({
      assetGroupId: schema.pmaxAssetGroupDaily.assetGroupId,
      assetGroupName: schema.pmaxAssetGroupDaily.assetGroupName,
      campaignName: schema.pmaxAssetGroupDaily.campaignName,
      impressions: sum(schema.pmaxAssetGroupDaily.impressions).mapWith(Number),
      clicks: sum(schema.pmaxAssetGroupDaily.clicks).mapWith(Number),
      costMicros: sum(schema.pmaxAssetGroupDaily.costMicros).mapWith(Number),
      conversions: sum(schema.pmaxAssetGroupDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.pmaxAssetGroupDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.pmaxAssetGroupDaily)
    .where(and(...conditions))
    .groupBy(
      schema.pmaxAssetGroupDaily.assetGroupId,
      schema.pmaxAssetGroupDaily.assetGroupName,
      schema.pmaxAssetGroupDaily.campaignName,
    );

  return rows.map(row => {
    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const costMicros = row.costMicros ?? 0;
    const conversions = row.conversions ?? 0;
    const conversionsValue = row.conversionsValue ?? 0;
    const costAud = convertMicrosToAud(costMicros);
    return {
      assetGroupId: row.assetGroupId,
      assetGroupName: row.assetGroupName,
      campaignName: row.campaignName,
      impressions, clicks, costMicros, conversions, conversionsValue, costAud,
      ctr: safeDivide(clicks, impressions),
      cvr: safeDivide(conversions, clicks),
      cpa: safeDivide(costAud, conversions),
      roas: safeDivide(conversionsValue, costAud),
    };
  });
}
```

### Fatigue Detection Module

```typescript
// lib/analysis/fatigueDetection.ts
export interface CreativeMetrics {
  adId: string;
  kpiValue: number;
  impressions: number;
}

export interface FatiguedCreative {
  adId: string;
  currentKpi: number;
  priorKpi: number;
  changePercent: number;
  direction: 'degraded' | 'improved';
}

export function detectFatigue(
  currentPeriod: CreativeMetrics[],
  priorPeriod: CreativeMetrics[],
  kpiType: 'cpa' | 'roas',
  degradationThreshold: number = 0.20,
  minImpressions: number = 100,
): FatiguedCreative[] {
  const priorMap = new Map(priorPeriod.map(c => [c.adId, c]));

  return currentPeriod
    .filter(c => c.impressions >= minImpressions)
    .map(current => {
      const prior = priorMap.get(current.adId);
      if (!prior || prior.impressions < minImpressions) return null;
      if (prior.kpiValue === 0) return null;

      const changePercent = (current.kpiValue - prior.kpiValue) / prior.kpiValue;
      // For CPA: positive change = degradation (CPA went up)
      // For ROAS: negative change = degradation (ROAS went down)
      const isDegraded = kpiType === 'cpa'
        ? changePercent > degradationThreshold
        : changePercent < -degradationThreshold;

      if (!isDegraded) return null;

      return {
        adId: current.adId,
        currentKpi: current.kpiValue,
        priorKpi: prior.kpiValue,
        changePercent,
        direction: 'degraded' as const,
      };
    })
    .filter((c): c is FatiguedCreative => c !== null);
}
```

### Gap Analysis Module

```typescript
// lib/analysis/gapAnalysis.ts
import type { CopyTheme, PatternResult } from './types';

export interface GapResult {
  theme: CopyTheme;
  label: string;
  representation: number; // count of creatives using this theme
  suggestion: string;
}

const ALL_THEMES: CopyTheme[] = [
  'urgency', 'social_proof', 'benefit_led', 'feature_led',
  'price_offer', 'cta_direct', 'stats_numbers',
];

const THEME_LABELS: Record<CopyTheme, string> = {
  urgency: 'Urgency-driven',
  social_proof: 'Social proof',
  benefit_led: 'Benefit-led',
  feature_led: 'Feature-led',
  price_offer: 'Price/offer',
  cta_direct: 'Direct CTA',
  stats_numbers: 'Stats/numbers',
};

const THEME_SUGGESTIONS: Record<CopyTheme, string> = {
  urgency: 'Test headlines with time-limited offers or scarcity messaging',
  social_proof: 'Test headlines featuring customer counts, reviews, or trust signals',
  benefit_led: 'Test headlines focused on what the customer gains',
  feature_led: 'Test headlines highlighting product capabilities or technology',
  price_offer: 'Test headlines with specific pricing, discounts, or value propositions',
  cta_direct: 'Test headlines with clear action verbs (Shop, Book, Get Started)',
  stats_numbers: 'Test headlines incorporating specific numbers or statistics',
};

export function identifyGaps(
  detectedPatterns: PatternResult[],
  minRepresentation: number = 1,
): GapResult[] {
  const detectedMap = new Map(detectedPatterns.map(p => [p.theme, p.count]));

  return ALL_THEMES
    .filter(theme => (detectedMap.get(theme) ?? 0) < minRepresentation)
    .map(theme => ({
      theme,
      label: THEME_LABELS[theme],
      representation: detectedMap.get(theme) ?? 0,
      suggestion: THEME_SUGGESTIONS[theme],
    }));
}
```

### Tab Navigation (reusable pattern from RsaTabNav)

```typescript
// Generic tab nav pattern used by all format pages
// Each format page defines its own tabs array and uses the same nuqs pattern
const PMAX_TABS = [
  { key: "overview", label: "Overview" },
  { key: "assets", label: "Asset Groups" },
  { key: "recommendations", label: "Recommendations" },
] as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RSA-specific analysis types | Generic CreativeInput interface | Phase 3 (03-02) | Analysis functions already accept any format via index signature `[key: string]: unknown` |
| Hardcoded sidebar nav | navItems array with disabled flag | Phase 1 (01-01) | Simply flip `disabled: false` to enable new pages |
| No test infrastructure | Vitest with pure function tests | Phase 3 (03-01) | New analysis modules can be TDD'd with existing test setup |

**Deprecated/outdated:**
- None relevant to this phase. All existing patterns are current and should be maintained.

## Open Questions

1. **Display Format Granularity**
   - What we know: `displayDaily.adType` stores ad type (RESPONSIVE_DISPLAY_AD, IMAGE_AD, DISCOVERY_MULTI_ASSET_AD). DISP-03 asks for square vs landscape vs portrait.
   - What's unclear: Whether ad type grouping is sufficient for meaningful format analysis, or if image dimensions are needed.
   - Recommendation: Use `adType` as the format dimension for v1. If users need pixel-level format breakdown, add `imageFormat` column in a future iteration. The Google Ads Script can be updated to include `ad_group_ad.ad.image_ad.image_format` or derive format from responsive display ad image assets.

2. **PMax Text Asset Joining Strategy**
   - What we know: `pmaxAssetGroupDaily` has metrics by asset group. `pmaxAssetDaily` has individual assets (TEXT, IMAGE, VIDEO) with `textContent` for text assets.
   - What's unclear: Whether joining text assets to asset groups for pattern detection is useful given Google controls creative assembly.
   - Recommendation: Join TEXT-type assets to their asset groups to enable headline-based pattern detection. Add a caveat that detected patterns reflect asset composition, not Google's served combinations. This provides value: users can see which text themes correlate with better-performing asset groups.

3. **Briefing Frequency vs Data Freshness**
   - What we know: Data syncs daily via Google Ads Script. Briefing compares 7-day periods.
   - What's unclear: Whether weekly is the right cadence, or if the briefing should adapt to sync frequency.
   - Recommendation: Use 7-day comparison by default (matching "Monday morning" framing). The page is always available -- calling it "Monday briefing" is a UX convention, not a technical restriction.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |
| Estimated runtime | ~3 seconds |

### Phase Requirements --> Test Map

| Req ID | Behaviour | Test Type | Automated Command | File Exists? |
|--------|-----------|-----------|-------------------|-------------|
| PMAX-01 | Tier classification for PMax asset groups | unit | `npx vitest run lib/analysis/tierClassification.test.ts` | Existing -- classifyTiers already tested, format-agnostic |
| PMAX-04 | Underperformer diagnosis for asset groups | unit | `npx vitest run lib/analysis/underperformerDiagnosis.test.ts` | Existing -- diagnoseUnderperformers already tested |
| PMAX-05 | Pattern detection across asset groups | unit | `npx vitest run lib/analysis/patternDetection.test.ts` | Existing -- detectPatterns already tested |
| PMAX-06 | Recommendations for asset groups | unit | `npx vitest run lib/analysis/recommendations.test.ts` | Existing -- generateRecommendations already tested |
| VID-04 | Video underperformer diagnosis (video-specific paths) | unit | `npx vitest run lib/analysis/videoAnalysis.test.ts` | Wave 0 gap |
| INTL-01 | Gap analysis -- untested angles | unit | `npx vitest run lib/analysis/gapAnalysis.test.ts` | Wave 0 gap |
| INTL-02 | Fatigue detection | unit | `npx vitest run lib/analysis/fatigueDetection.test.ts` | Wave 0 gap |
| PMAX-02 | Asset group leaderboard renders | manual | Visual verification in browser | manual-only -- UI component |
| PMAX-03 | Theme analysis renders | manual | Visual verification in browser | manual-only -- UI component |
| DISP-01 | Display tier classification | unit | Reuses classifyTiers tests | Existing |
| DISP-03 | Format comparison chart | manual | Visual verification in browser | manual-only -- UI component |
| VID-03 | Video metrics display | manual | Visual verification in browser | manual-only -- UI component |
| INTL-03 | Monday briefing renders | manual | Visual verification in browser | manual-only -- UI component |

### Nyquist Sampling Rate

- **Minimum sample interval:** After every committed task run: `npx vitest run --reporter=verbose`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before verification
- **Estimated feedback latency per task:** ~3 seconds

### Wave 0 Gaps (must be created before implementation)

- [ ] `lib/analysis/gapAnalysis.test.ts` -- covers INTL-01 (gap analysis pure function tests)
- [ ] `lib/analysis/fatigueDetection.test.ts` -- covers INTL-02 (fatigue detection pure function tests)
- [ ] `lib/analysis/videoAnalysis.test.ts` -- covers VID-04 (video-specific diagnosis helper tests)

*(Existing test infrastructure covers PMAX-01, PMAX-04, PMAX-05, PMAX-06, DISP-01 via format-agnostic classifyTiers/diagnoseUnderperformers/detectPatterns/generateRecommendations tests.)*

## Sources

### Primary (HIGH confidence)

- Existing codebase analysis: `lib/analysis/types.ts`, `lib/analysis/tierClassification.ts`, `lib/analysis/underperformerDiagnosis.ts`, `lib/analysis/patternDetection.ts`, `lib/analysis/recommendations.ts`, `lib/analysis/insightTitles.ts` -- confirmed all functions accept generic interfaces
- Existing codebase analysis: `lib/db/schema.ts` -- confirmed all 7 tables (rsaDaily, rsaAssetDaily, rsaCombinationDaily, pmaxAssetGroupDaily, pmaxAssetDaily, displayDaily, videoDaily) are fully defined with appropriate indexes
- Existing codebase analysis: `lib/validation/ingestionSchema.ts` -- confirmed all format schemas (pmaxAssetGroupRowSchema, pmaxAssetRowSchema, displayRowSchema, videoRowSchema) are complete
- Existing codebase analysis: `app/api/ingest/route.ts` -- confirmed ingestion handles all 7 data types with upsert logic
- Existing codebase analysis: `scripts/seed-data.ts` -- confirmed seed data generates all formats including PMax, Display, Video
- Existing codebase analysis: `app/rsa/page.tsx` -- confirmed Server Component orchestration pattern for analysis pipeline
- Existing codebase analysis: `components/rsa/` -- confirmed UI component patterns (TierOverview, CreativeLeaderboard, PatternCharts, UnderperformerPanel, RecommendationList, RsaTabNav)
- Existing codebase analysis: `lib/queries/rsa.ts` -- confirmed query pattern (aggregate by ID, compute derived metrics with safeDivide)
- Existing codebase analysis: `components/layout/Sidebar.tsx` -- confirmed PMax, Display, Video nav items exist with `disabled: true`

### Secondary (MEDIUM confidence)

- CLAUDE.md project instructions -- PMax, Display, Video analysis requirements and caveats (Google controls PMax assembly, Display format analysis, Video-specific metrics)
- CLAUDE.md analysis framework -- underperformer diagnosis decision tree, recommendation categories, report structure

### Tertiary (LOW confidence)

- None. All research is based on existing codebase analysis and established project requirements.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages needed, all libraries already installed and proven
- Architecture: HIGH - Replicating established Phase 3 patterns with format-specific adaptations
- Pitfalls: HIGH - Identified from direct codebase analysis (schema gaps, format-specific considerations)
- Intelligence features: MEDIUM - Gap analysis and fatigue detection are new modules, but implementations are straightforward pure functions

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- no external dependencies changing)
