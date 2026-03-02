---
phase: 02-dashboard-and-visualisation
verified: 2026-03-02T09:00:00Z
status: passed
score: 19/19 must-haves verified
gaps: []
human_verification:
  - test: "Account selector dropdown visibility and navigation"
    expected: "Selecting an account from the sidebar dropdown navigates to /dashboard?account=xxx"
    why_human: "useRouter.push and useSearchParams are client-side; cannot verify navigation behaviour programmatically"
  - test: "Filter bar date preset state highlighting"
    expected: "Active preset button shows bg-brand-blue text-white; inactive shows bg-surface-background"
    why_human: "CSS class application on interactive state requires browser rendering"
  - test: "Campaign change clears ad group in UI"
    expected: "Selecting a different campaign resets the ad group dropdown to 'All ad groups'"
    why_human: "setFilters cascade (adGroup: null on campaign change) requires live interaction to confirm"
  - test: "Metric tab switching updates charts without page flash"
    expected: "Clicking a metric tab in ChartSection updates both charts instantly with no loading skeleton"
    why_human: "useState-driven re-render vs server re-fetch distinction requires browser observation"
  - test: "CPA row highlighting inversion"
    expected: "When sorted by CPA ascending, the lowest-CPA row shows green bg (#E6F4EA) and highest shows red (#FCE8E6)"
    why_human: "Row highlighting logic with sort-direction inversion requires real data to observe"
  - test: "Bar chart data labels on fewer than 10 items"
    expected: "LabelList appears on bar chart when fewer than 10 creatives; absent when 10 or more"
    why_human: "Conditional LabelList render depends on live data count"
  - test: "URL filter persistence across refresh"
    expected: "Copying URL with ?account=xxx&range=7d&campaign=yyy and opening in a new tab preserves all filter state"
    why_human: "URL round-trip behaviour requires browser session testing"
---

# Phase 2: Dashboard and Visualisation Verification Report

**Phase Goal:** Operator can open the app, select an account, view key performance metrics, filter by date and campaign, and see creative performance in charts and sortable tables
**Verified:** 2026-03-02T09:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | New dependencies (recharts, nuqs, date-fns) are installed and importable | VERIFIED | package.json: recharts@^2.15.4, nuqs@^2.8.9, date-fns@^4.1.0, server-only@^0.0.1 |
| 2 | NuqsAdapter wraps the app so useQueryStates works on any page | VERIFIED | app/layout.tsx line 27: `<NuqsAdapter>` wraps `<AppShell>{children}</AppShell>` |
| 3 | Dashboard search params are defined with type-safe parsers for account, range, from, to, campaign, adGroup | VERIFIED | app/dashboard/searchParams.ts: all 6 params with createSearchParamsCache; resolveDateRange and getComparisonRange exported |
| 4 | Server-side aggregation queries return KPI totals and time-series data from all 4 daily tables | VERIFIED | lib/queries/dashboard.ts: fetchKpiMetrics, fetchTimeSeries, fetchCreativeComparison, fetchFilterOptions — all aggregate across rsaDaily, pmaxAssetGroupDaily, displayDaily, videoDaily via Promise.all |
| 5 | Metric definitions map metric keys to labels, formatters, and colour direction | VERIFIED | lib/constants/metrics.ts: METRICS record covers impressions, clicks, ctr, conversions, cpa, roas with format, formatCompact, invertColour, computeFromTotals |
| 6 | User can select an account from a dropdown in the sidebar | VERIFIED | Sidebar.tsx lines 133-151: account selector `<select>` with handleAccountChange using router.push to /dashboard?account=xxx |
| 7 | Selecting an account updates the URL and navigates to the dashboard page | VERIFIED | Sidebar.tsx line 85: `router.push('/dashboard?' + params.toString())` preserving existing params |
| 8 | User can switch between 7d, 30d, 90d date presets and select a custom date range | VERIFIED | FilterBar.tsx: preset buttons at lines 100-115, custom toggle at lines 118-159 with date inputs, all wired via useQueryStates |
| 9 | User can filter by campaign, and selecting a campaign narrows the ad group dropdown | VERIFIED | FilterBar.tsx line 35-37: filteredAdGroups filters by campaignId when campaign selected |
| 10 | Changing campaign clears the ad group selection | VERIFIED | FilterBar.tsx line 68: `setFilters({ campaign: value or null, adGroup: null })` |
| 11 | All filter state is persisted in URL query params | VERIFIED | FilterBar.tsx line 29: `{ shallow: false }` on useQueryStates ensures server re-fetch on URL change |
| 12 | Dashboard page fetches aggregated data server-side and passes to child components | VERIFIED | app/dashboard/page.tsx: Promise.all fetches currentKpi, comparisonKpi, timeSeries, creatives, filterOptions; all passed as props |
| 13 | User sees 6 KPI metric cards with formatted values and delta arrows | VERIFIED | MetricCards.tsx: renders all 6 MetricKey values from METRICS; MetricCard.tsx: ArrowUp/ArrowDown/Minus icons with formatted delta percentage |
| 14 | Each metric card shows a delta arrow with percentage change versus the previous period | VERIFIED | MetricCards.tsx lines 33-45: computes pctChange from comparison; MetricCard.tsx lines 47-54: renders delta icon + percentage |
| 15 | CPA card shows green for decrease and red for increase (inverted colour direction) | VERIFIED | metrics.ts: cpa.invertColour = true; MetricCard.tsx getColour(): `invertColour ? dir === 'down' : dir === 'up'` determines green |
| 16 | Time-series line chart displays daily trend for the selected metric | VERIFIED | TimeSeriesChart.tsx: LineChart with CartesianGrid, XAxis, YAxis, Tooltip, Line using COLOURS.brand.blue |
| 17 | Horizontal bar chart shows creatives sorted by value descending with conditional data labels | VERIFIED | CreativeBarChart.tsx line 28: `[...data].sort((a,b) => b.value - a.value)`; lines 30-31: showLabels when < 10; LabelList inside Bar |
| 18 | Charts use subtle gridlines with no borders or 3D effects | VERIFIED | TimeSeriesChart.tsx: `stroke={COLOURS.surface.gridline} strokeDasharray="3 3"`; CreativeBarChart.tsx: same pattern with `horizontal={false}` |
| 19 | User can view creatives in a sortable table with pagination | VERIFIED | PerformanceTable.tsx: 304 lines; click-to-sort via handleSort; PAGE_SIZE=25; top/bottom row highlighting with #E6F4EA/#FCE8E6 |

**Score:** 19/19 truths verified

---

### Required Artifacts

| Artifact | Provides | Level 1: Exists | Level 2: Substantive | Level 3: Wired | Status |
|----------|----------|-----------------|----------------------|----------------|--------|
| `app/dashboard/searchParams.ts` | nuqs search param cache with 6 URL params | Yes | 91 lines; createSearchParamsCache with 6 parsers; resolveDateRange and getComparisonRange | Imported in page.tsx and FilterBar.tsx | VERIFIED |
| `lib/queries/dashboard.ts` | Server-side aggregation queries | Yes | 471 lines; exports fetchKpiMetrics, fetchTimeSeries, fetchCreativeComparison, fetchFilterOptions | Imported in page.tsx with all 4 functions called | VERIFIED |
| `lib/constants/metrics.ts` | Metric definitions with formatters and compute functions | Yes | 91 lines; METRICS record covers all 6 MetricKeys with format, formatCompact, invertColour, computeFromTotals | Imported in MetricCards.tsx, ChartSection.tsx, MetricTabs.tsx | VERIFIED |
| `app/layout.tsx` | NuqsAdapter wrapping the app | Yes | NuqsAdapter imported from nuqs/adapters/next/app; wraps AppShell | Used at root — affects all pages | VERIFIED |
| `components/layout/Sidebar.tsx` | Account selector dropdown in sidebar | Yes | 200 lines; account `<select>` with handleAccountChange; accounts prop; router.push to /dashboard | AppShell passes accounts prop; page.tsx reads account param | VERIFIED |
| `components/layout/AppShell.tsx` | Async Server Component fetching accounts | Yes | 54 lines; fetchAccountsForSidebar uses db.select from schema.accounts; passes to Sidebar | Root layout imports AppShell; Sidebar receives accounts | VERIFIED |
| `components/dashboard/FilterBar.tsx` | Filter bar with date presets, custom range, cascading dropdowns | Yes | 214 lines; useQueryStates with shallow:false; preset buttons; campaign/adGroup dropdowns with cascade | Used in page.tsx; receives filterOptions from server | VERIFIED |
| `app/dashboard/page.tsx` | Dashboard Server Component with data fetching | Yes | 111 lines; dashboardSearchParams.parse; Promise.all for 5 fetches; renders FilterBar, MetricCards, ChartSection, PerformanceTable | All components imported and used; dynamic = force-dynamic | VERIFIED |
| `app/dashboard/loading.tsx` | Loading skeleton for dashboard | Yes | 109 lines; animate-pulse skeleton for filter bar, 6 metric cards, 2 chart areas, table rows | Automatically used by Next.js for /dashboard route | VERIFIED |
| `components/dashboard/MetricCard.tsx` | Single metric card with value and delta arrow | Yes | 57 lines; ArrowUp/ArrowDown/Minus icons; invertColour colour logic; formatted value and delta% | Used by MetricCards.tsx | VERIFIED |
| `components/dashboard/MetricCards.tsx` | Grid of 6 metric cards with computed deltas | Yes | 59 lines; METRICS import; computeFromTotals for all 6 keys; responsive grid | Used in page.tsx with current and comparison props | VERIFIED |
| `components/dashboard/TimeSeriesChart.tsx` | Recharts LineChart wrapper | Yes | 63 lines; LineChart, CartesianGrid, COLOURS, ChartTooltip; min-h-[300px] div guard | Used in ChartSection.tsx | VERIFIED |
| `components/dashboard/CreativeBarChart.tsx` | Recharts horizontal BarChart | Yes | 73 lines; layout="vertical"; sorted descending; showLabels < 10; LabelList; COLOURS | Used in ChartSection.tsx | VERIFIED |
| `components/dashboard/MetricTabs.tsx` | Client-side metric selector tabs | Yes | 43 lines; useState-based (no URL); tab buttons for all 6 metrics; METRICS labels | Used in ChartSection.tsx (both chart columns) | VERIFIED |
| `components/dashboard/ChartTooltip.tsx` | Custom Recharts tooltip | Yes | 63 lines; toLocaleDateString('en-AU'); formatValue; percentage of total with en-AU locale | Used in TimeSeriesChart.tsx and CreativeBarChart.tsx | VERIFIED |
| `components/dashboard/ChartSection.tsx` | Chart section wrapper with metric tabs | Yes | 84 lines; useState for selectedMetric; transforms time-series and creative data per metric | Used in page.tsx | VERIFIED |
| `components/dashboard/PerformanceTable.tsx` | Sortable paginated performance table | Yes | 304 lines; 8 columns; sort logic with NaN handling; PAGE_SIZE=25; row highlighting | Used in page.tsx; receives creatives data | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| lib/queries/dashboard.ts | lib/db/schema.ts | Drizzle ORM sum/groupBy | WIRED | sum(schema.rsaDaily.impressions).mapWith(Number) at line 97; all 4 tables queried |
| app/dashboard/searchParams.ts | nuqs/server | createSearchParamsCache import | WIRED | Line 2-6: createSearchParamsCache imported and used at line 14 |
| components/layout/Sidebar.tsx | app/dashboard/page.tsx | URL navigation with account param | WIRED | handleAccountChange at line 83-85: params.set("account", accountId); router.push("/dashboard?" + params) |
| components/layout/AppShell.tsx | components/layout/Sidebar.tsx | Passes accounts prop from server query | WIRED | Line 39-45: const accounts = await fetchAccountsForSidebar(); `<Sidebar accounts={accounts} />` |
| components/dashboard/FilterBar.tsx | app/dashboard/searchParams.ts | nuqs useQueryStates reading/writing URL params | WIRED | Line 3: import useQueryStates from nuqs; line 21: useQueryStates with same parsers; shallow:false |
| app/dashboard/page.tsx | lib/queries/dashboard.ts | Server-side data fetching | WIRED | Lines 3-7: all 4 functions imported; lines 51-80: called in Promise.all |
| components/dashboard/MetricCards.tsx | lib/constants/metrics.ts | METRICS config for labels, formatters | WIRED | Line 3: import { METRICS }; line 28: METRICS[key].computeFromTotals(current) |
| components/dashboard/TimeSeriesChart.tsx | lib/constants/colours.ts | COLOURS for chart styling | WIRED | Line 12: import { COLOURS }; lines 34,54,57: COLOURS.surface.gridline, COLOURS.brand.blue |
| components/dashboard/CreativeBarChart.tsx | lib/constants/colours.ts | COLOURS for chart styling | WIRED | Line 13: import { COLOURS }; lines 42,58: COLOURS.surface.gridline, COLOURS.brand.blue |
| app/dashboard/page.tsx | components/dashboard/MetricCards.tsx | Passes KPI data as props | WIRED | Line 9: import MetricCards; line 97: `<MetricCards current={currentKpi} comparison={comparisonKpi} />` |
| components/dashboard/PerformanceTable.tsx | lib/constants/metrics.ts | METRICS for formatting columns | PARTIAL | PerformanceTable uses inline formatters (formatNumber, formatCurrency, formatPercentage) imported directly from formatting.ts, NOT from METRICS. Functionally correct — same formatters — but doesn't use METRICS record as the plan specified |
| components/dashboard/PerformanceTable.tsx | lib/constants/colours.ts | COLOURS for row highlighting | PARTIAL | Row highlighting uses inline hex values (#E6F4EA, #FCE8E6) matching COLOURS.surface.rowPositive/rowNegative exactly, but COLOURS is not imported. Functionally correct; doesn't use COLOURS constant |
| app/dashboard/page.tsx | components/dashboard/PerformanceTable.tsx | Passes creative comparison data | WIRED | Line 11: import PerformanceTable; line 107: `<PerformanceTable data={creatives} />` |

**Note on PARTIAL links:** Both partial links in PerformanceTable are implementation style deviations, not functional gaps. The correct hex values are used, matching the design system exactly. The formatters are the same functions (imported from formatting.ts rather than accessed via METRICS). The goal is achieved; the code just bypasses the METRICS and COLOURS abstraction layers.

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DASH-01 | Plan 02 | User can switch between client accounts via account selector | SATISFIED | Sidebar account `<select>` dropdown navigates to /dashboard?account=xxx |
| DASH-02 | Plans 01, 03 | Performance overview shows key metrics (impressions, clicks, CTR, conversions, CPA/ROAS) | SATISFIED | MetricCards renders all 6 KPIs computed from KpiTotals via METRICS.computeFromTotals |
| DASH-03 | Plans 01, 02 | User can select date ranges (7d, 30d, 90d presets + custom range) | SATISFIED | FilterBar: 3 preset buttons + Custom toggle with date inputs; all via nuqs useQueryStates |
| DASH-04 | Plan 02 | User can filter by campaign and ad group | SATISFIED | FilterBar: campaign `<select>` and cascading adGroup `<select>`; filter options from fetchFilterOptions |
| DASH-05 | Plan 04 | User can sort tables by any metric column | SATISFIED | PerformanceTable: handleSort on all 8 column headers; asc/desc toggle with ChevronUp/Down indicators |
| VIS-01 | Plans 03, 04 | Time-series line charts showing creative performance trends | SATISFIED | TimeSeriesChart: Recharts LineChart with daily data from fetchTimeSeries |
| VIS-02 | Plans 03, 04 | Horizontal bar charts for creative comparisons (sorted by value descending) | SATISFIED | CreativeBarChart: BarChart layout="vertical"; `[...data].sort((a,b) => b.value - a.value)` |
| VIS-04 | Plan 03 | Data labels on bar charts when fewer than 10 items | SATISFIED | CreativeBarChart: `const showLabels = sorted.length < 10`; LabelList inside Bar when showLabels |
| VIS-05 | Plan 03 | Charts use subtle gridlines or none; no borders, no 3D effects | SATISFIED | Both charts: CartesianGrid stroke={COLOURS.surface.gridline} strokeDasharray="3 3"; no borders in component styling |

**Orphaned requirements check:** REQUIREMENTS.md traceability table also maps DASH-06 and DASH-07 to Phase 1 (not Phase 2), and VIS-03 to Phase 1. No Phase 2 orphans found.

All 9 requirement IDs (DASH-01 through DASH-05, VIS-01, VIS-02, VIS-04, VIS-05) are fully satisfied.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| components/dashboard/FilterBar.tsx | 144, 156 | `placeholder="From"` / `placeholder="To"` on date inputs | Info | These are HTML input placeholders for UI guidance, not implementation stubs. No impact on functionality |
| components/dashboard/ChartTooltip.tsx | 24 | `return null` when !active | Info | Correct Recharts tooltip pattern — returning null hides tooltip when inactive. Not a stub |

No blockers or warnings. The anti-patterns found are correct implementation patterns, not stubs.

---

### Human Verification Required

The following items require browser testing to confirm:

#### 1. Account Selector Navigation

**Test:** Open the app, locate the account selector in the sidebar, select an account from the dropdown.
**Expected:** URL changes to `/dashboard?account={account-id}` and the dashboard page loads with that account's data.
**Why human:** Client-side router.push and useRouter/useSearchParams require a live browser session.

#### 2. Date Preset Active State

**Test:** Click the 7d, 30d, and 90d buttons in the filter bar.
**Expected:** The active button shows a blue background (bg-brand-blue text-white); inactive buttons show grey.
**Why human:** CSS class toggling based on URL state requires browser rendering to confirm visual output.

#### 3. Campaign Cascade Clears Ad Group

**Test:** Select a campaign from the campaign dropdown, then select an ad group. Now select a different campaign.
**Expected:** The ad group dropdown resets to "All ad groups" automatically.
**Why human:** setFilters({ campaign: value, adGroup: null }) cascade requires live UI interaction to confirm.

#### 4. Metric Tab Updates Charts Without Page Reload

**Test:** With an account and data loaded, click different metric tabs above the chart section.
**Expected:** Both charts update instantly to show the new metric; no loading skeleton appears; URL does not change.
**Why human:** useState-based re-render vs server navigation distinction requires browser observation.

#### 5. CPA Row Highlighting Inversion

**Test:** In the performance table, click the CPA column header to sort by CPA ascending (lowest first).
**Expected:** The row with the lowest CPA value has a light green background (#E6F4EA); the highest CPA row has a light red background (#FCE8E6).
**Why human:** The inversion logic and its interaction with sort direction requires real data and browser rendering.

#### 6. Bar Chart Conditional Data Labels

**Test:** View the Creative Comparison chart with fewer than 10 creatives.
**Expected:** Value labels appear on the right side of each bar. With 10 or more creatives, no labels appear.
**Why human:** LabelList conditional render depends on live data count; requires a real account with known creative counts.

#### 7. URL Filter Round-Trip

**Test:** Set a filter (e.g., select a campaign, choose 7d range), copy the URL, open in a new tab.
**Expected:** The new tab loads with the same filters applied, showing the same filtered data.
**Why human:** URL persistence and round-trip requires a live browser session with Next.js serving.

---

### Gaps Summary

No functional gaps found. All 19 must-have truths are verified. The phase goal is fully achieved.

Two key links in PerformanceTable use implementation approaches that deviate from the plan's specified patterns:
- Row highlighting uses inline hex strings matching COLOURS exactly (not COLOURS import)
- Column formatters use formatting.ts functions directly (not METRICS record)

These are architectural style deviations with zero functional impact. The dashboard delivers the correct behaviour in both cases.

---

_Verified: 2026-03-02T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
