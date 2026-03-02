---
phase: 02-dashboard-and-visualisation
plan: 03
subsystem: dashboard
tags: [recharts, line-chart, bar-chart, metric-cards, tooltips, delta-arrows, responsive-grid, client-state]

# Dependency graph
requires:
  - phase: 02-dashboard-and-visualisation
    plan: 01
    provides: "METRICS record with formatters, colour direction, and computeFromTotals; COLOURS constants; dashboard query functions"
  - phase: 02-dashboard-and-visualisation
    plan: 02
    provides: "Dashboard page with parallel data fetching, FilterBar, URL-persisted filter state"
provides:
  - "6 KPI metric cards with AU-formatted values and colour-coded period-over-period delta arrows"
  - "TimeSeriesChart wrapping Recharts LineChart with subtle gridlines, custom tooltip with percentage of total"
  - "CreativeBarChart wrapping Recharts horizontal BarChart sorted descending with conditional data labels"
  - "MetricTabs for client-side metric selection without server re-render"
  - "ChartSection with synced metric tabs driving both charts"
  - "ChartTooltip with AU locale date, formatted value, and percentage of total"
affects: [02-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-state-for-chart-tabs, synced-metric-tabs, computed-totals-for-tooltip-percentage]

key-files:
  created:
    - components/dashboard/MetricCard.tsx
    - components/dashboard/MetricCards.tsx
    - components/dashboard/ChartTooltip.tsx
    - components/dashboard/TimeSeriesChart.tsx
    - components/dashboard/CreativeBarChart.tsx
    - components/dashboard/MetricTabs.tsx
    - components/dashboard/ChartSection.tsx
  modified:
    - app/dashboard/page.tsx

key-decisions:
  - "ChartSection extracted as separate 'use client' component to contain useState for metric selection"
  - "Both charts share the same metric tab state (synced) for consistent comparison view"
  - "MetricCards receives raw KpiTotals and computes values internally using METRICS.computeFromTotals"
  - "ChartTooltip computes percentage of total from sum of all data values passed as total prop"
  - "CreativeBarChart uses dynamic height (Math.max(300, length * 40)) to accommodate varying creative counts"

patterns-established:
  - "Client-state chart tabs: useState for metric selection in charts, NOT URL params (avoids server round-trip)"
  - "Synced metric tabs: single selectedMetric state drives both line chart and bar chart data"
  - "Percentage of total in tooltips: parent chart computes total via reduce, passes to ChartTooltip"

requirements-completed: [DASH-02, VIS-01, VIS-02, VIS-04, VIS-05]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 2 Plan 03: Metric Cards, Charts, and Tooltips Summary

**6 KPI metric cards with delta arrows, Recharts line chart for time-series trends, horizontal bar chart for creative comparison sorted descending with conditional data labels, synced metric tabs, and custom tooltips with percentage of total**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T07:38:51Z
- **Completed:** 2026-03-02T07:42:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Built 6 KPI metric cards with AU locale formatting, colour-coded delta arrows, and inverted colour direction for CPA
- Created TimeSeriesChart with Recharts LineChart, subtle dashed gridlines, and custom tooltip showing date, value, and percentage of total
- Created CreativeBarChart with horizontal layout sorted descending, conditional data labels for fewer than 10 items, and rounded bar corners
- Built MetricTabs for client-side metric selection that switches both charts without page reload
- Replaced dashboard page placeholder sections with real MetricCards and ChartSection components

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MetricCard, MetricCards grid, and ChartTooltip components** - `f523c5b` (feat)
2. **Task 2: Create TimeSeriesChart, CreativeBarChart, MetricTabs, and wire into dashboard page** - `bfba46e` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `components/dashboard/MetricCard.tsx` - Single metric card with label, formatted value, and colour-coded delta arrow
- `components/dashboard/MetricCards.tsx` - Responsive grid of 6 metric cards computing values and deltas from raw KPI totals
- `components/dashboard/ChartTooltip.tsx` - Custom Recharts tooltip with AU-formatted date, value, and percentage of total
- `components/dashboard/TimeSeriesChart.tsx` - Recharts LineChart wrapper with subtle gridlines and custom tooltip
- `components/dashboard/CreativeBarChart.tsx` - Recharts horizontal BarChart sorted descending with conditional LabelList
- `components/dashboard/MetricTabs.tsx` - Client-side metric selector tabs using local state
- `components/dashboard/ChartSection.tsx` - Wrapper with synced metric tabs driving both charts
- `app/dashboard/page.tsx` - Replaced placeholder sections with MetricCards and ChartSection components

## Decisions Made
- Extracted ChartSection as a separate "use client" component rather than inline in page.tsx, because the dashboard page is a Server Component and cannot use useState
- Both charts share the same metric selection state for a consistent comparison view (user sees the same metric in line chart and bar chart simultaneously)
- MetricCards receives raw KpiTotals and computes formatted values internally using METRICS definitions, keeping the server page clean
- ChartTooltip receives a total prop computed by the parent chart via reduce, enabling percentage of total display without redundant computation
- CreativeBarChart uses dynamic height scaling (40px per bar) to prevent crowding with many creatives

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing `npm run build` failure in `/api/accounts/[id]` route due to database connection not being available at build time (PostgreSQL query during page data collection). This is not caused by this plan's changes -- TypeScript compilation (`tsc --noEmit`) passes cleanly with zero errors. This issue exists in the codebase prior to this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All chart and metric card components are complete and wired into the dashboard page
- Plan 02-04 can build the sortable creative performance table using the existing `creatives` data already passed to the page
- The ChartSection and MetricCards patterns are established for any future chart or card additions

## Self-Check: PASSED

- All 8 created/modified files verified on disk
- Both task commits (f523c5b, bfba46e) verified in git log

---
*Phase: 02-dashboard-and-visualisation*
*Completed: 2026-03-02*
