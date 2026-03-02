---
phase: 02-dashboard-and-visualisation
plan: 01
subsystem: dashboard
tags: [nuqs, recharts, date-fns, drizzle, aggregation, url-state, metrics]

# Dependency graph
requires:
  - phase: 01-data-pipeline-and-foundation
    provides: "Drizzle ORM schema with 4 daily tables (RSA, PMax, Display, Video), formatting utilities, AppShell layout"
provides:
  - "nuqs search param cache with 6 URL params for dashboard filtering"
  - "resolveDateRange helper for preset and custom date arithmetic"
  - "METRICS record with formatters, colour direction, and computeFromTotals for 6 metrics"
  - "4 server-side query functions aggregating across all daily tables"
  - "NuqsAdapter wired into root layout for URL state management"
affects: [02-02, 02-03, 02-04, 03-rsa-analysis]

# Tech tracking
tech-stack:
  added: [recharts@^2.15.4, nuqs@^2.8.9, date-fns@^4.1.0, server-only]
  patterns: [cross-table-aggregation, url-driven-server-component-fetching, metric-definitions-with-compute]

key-files:
  created:
    - app/dashboard/searchParams.ts
    - lib/constants/metrics.ts
    - lib/queries/dashboard.ts
  modified:
    - app/layout.tsx
    - package.json

key-decisions:
  - "Used server-only package for dashboard queries to prevent client-side import"
  - "ROAS formatted as Nx multiplier (e.g. 2.50x) rather than percentage"
  - "fetchFilterOptions deduplicates campaigns across all 4 tables by campaignId"
  - "PMax tables excluded from adGroup filtering since they use asset groups"

patterns-established:
  - "Cross-table aggregation: Promise.all across 4 daily tables, then sum/merge results"
  - "URL-driven data fetching: nuqs createSearchParamsCache parsed server-side in page component"
  - "Metric definitions: METRICS record maps MetricKey to label, formatters, colour direction, and computeFromTotals"

requirements-completed: [DASH-02, DASH-03]

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 2 Plan 01: Dashboard Data Foundation Summary

**nuqs URL state with 6 search params, 6-metric definitions with formatters and compute functions, and 4 cross-table aggregation queries for KPIs, time-series, creative comparison, and filter options**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T07:20:00Z
- **Completed:** 2026-03-02T07:26:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed recharts, nuqs, date-fns, and server-only as dashboard dependencies
- Wired NuqsAdapter into root layout so useQueryStates works on any page
- Created type-safe URL search param cache with 6 params (account, range, from, to, campaign, adGroup) plus resolveDateRange helper
- Defined METRICS record with formatters, colour direction, and computeFromTotals for all 6 metrics (impressions, clicks, CTR, conversions, CPA, ROAS)
- Built 4 server-side aggregation query functions (fetchKpiMetrics, fetchTimeSeries, fetchCreativeComparison, fetchFilterOptions) that aggregate across all 4 daily tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and wire NuqsAdapter into root layout** - `560e308` (feat)
2. **Task 2: Create search params, metric constants, and dashboard queries** - `9b1a1a0` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `app/dashboard/searchParams.ts` - nuqs search param cache definition with resolveDateRange helper
- `lib/constants/metrics.ts` - MetricKey type and METRICS record with 6 metric definitions
- `lib/queries/dashboard.ts` - Server-only module with fetchKpiMetrics, fetchTimeSeries, fetchCreativeComparison, fetchFilterOptions
- `app/layout.tsx` - Added NuqsAdapter wrapping AppShell
- `package.json` - Added recharts, nuqs, date-fns, server-only dependencies
- `package-lock.json` - Lock file updated

## Decisions Made
- Used `server-only` package import in dashboard.ts to prevent accidental client-side import of server queries
- ROAS formatted as multiplier (e.g. "2.50x") rather than percentage since it's a return ratio
- fetchFilterOptions deduplicates campaigns across all 4 tables using a Map keyed by campaignId, sorted alphabetically
- PMax tables excluded from adGroupId filtering since PMax uses asset groups rather than ad groups
- Creative comparison names: RSA uses "adGroupName / Ad adId", PMax uses assetGroupName, Display/Video use adName with adId fallback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed server-only package**
- **Found during:** Task 1
- **Issue:** Plan mentions checking if server-only package is installed; it was not
- **Fix:** Added server-only to the npm install command alongside recharts, nuqs, and date-fns
- **Files modified:** package.json, package-lock.json
- **Verification:** import "server-only" compiles without error in dashboard.ts
- **Committed in:** 560e308 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor addition of server-only package. No scope creep.

## Issues Encountered
- Pre-existing `npm run build` failure: API route handlers import Drizzle db client which tries to connect at build time without DATABASE_URL env var. Unrelated to this plan's changes. Logged in deferred-items.md.
- TypeScript compilation (`npx tsc --noEmit`) passes cleanly for all new files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dashboard data layer is complete: search params, metrics, and queries are ready for UI components
- Plan 02-02 can build the dashboard page, filter bar, and metric cards on top of this foundation
- All 4 query functions return properly typed data for charts and tables

## Self-Check: PASSED

- All 4 created/modified files verified on disk
- Both task commits (560e308, 9b1a1a0) verified in git log

---
*Phase: 02-dashboard-and-visualisation*
*Completed: 2026-03-02*
