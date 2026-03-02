---
phase: 02-dashboard-and-visualisation
plan: 02
subsystem: dashboard
tags: [nuqs, url-state, sidebar, account-selector, filter-bar, cascading-dropdowns, server-component, data-fetching]

# Dependency graph
requires:
  - phase: 02-dashboard-and-visualisation
    plan: 01
    provides: "nuqs search param cache, dashboard query functions, metric definitions, NuqsAdapter in layout"
provides:
  - "Account selector dropdown in sidebar fed by server-side DB query"
  - "Dashboard page with parallel data fetching for KPIs, comparison, time-series, creatives, and filter options"
  - "FilterBar with date presets (7d/30d/90d), custom date range, cascading campaign/ad group dropdowns"
  - "URL-persisted filter state via nuqs useQueryStates"
  - "getComparisonRange helper for period-over-period date arithmetic"
  - "Loading skeleton mirroring dashboard layout structure"
affects: [02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [async-server-component-with-db-query, cascading-dropdown-with-url-state, parallel-data-fetching-in-page]

key-files:
  created:
    - app/dashboard/page.tsx
    - app/dashboard/loading.tsx
    - components/dashboard/FilterBar.tsx
  modified:
    - components/layout/Sidebar.tsx
    - components/layout/AppShell.tsx
    - app/dashboard/searchParams.ts

key-decisions:
  - "AppShell converted to async Server Component to query accounts server-side and pass as prop to Sidebar"
  - "Sidebar account selector preserves existing URL search params when navigating"
  - "Dashboard page renders raw JSON in placeholder sections to verify data flow before Plans 03-04 add charts and tables"
  - "getComparisonRange uses inclusive day count (differenceInDays + 1) for accurate period matching"
  - "FilterBar campaign change clears adGroup to prevent stale selection (per research pitfall #4)"

patterns-established:
  - "Async Server Component DB query: AppShell fetches account data server-side, passes to client Sidebar via props"
  - "Cascading filter pattern: campaign change nullifies adGroup, ad groups filtered client-side by campaignId"
  - "Parallel data fetching: Promise.all with 5 concurrent queries in Server Component page"

requirements-completed: [DASH-01, DASH-03, DASH-04]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 2 Plan 02: Dashboard Shell and Filters Summary

**Account selector in sidebar, FilterBar with date presets and cascading campaign/ad group dropdowns, and dashboard page shell fetching 5 data sets in parallel via URL params**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T07:30:35Z
- **Completed:** 2026-03-02T07:34:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added account selector dropdown to sidebar with server-side account data passed from async AppShell
- Created dashboard page that parses URL search params and fetches KPIs (current + comparison), time-series, creative comparison, and filter options in parallel
- Built FilterBar with 7d/30d/90d date presets, custom date range picker, cascading campaign/ad group dropdowns, and clear-all button
- Added getComparisonRange helper for period-over-period comparison date arithmetic
- Created loading skeleton mirroring the full dashboard layout with pulsing placeholders

## Task Commits

Each task was committed atomically:

1. **Task 1: Add account selector to sidebar and create dashboard page with data fetching** - `886725b` (feat)
2. **Task 2: Build the FilterBar client component with date presets, custom range, and cascading dropdowns** - `fa80bca` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `components/layout/Sidebar.tsx` - Added accounts prop, account selector dropdown, navigation to /dashboard?account=xxx
- `components/layout/AppShell.tsx` - Converted to async Server Component querying accounts from DB
- `app/dashboard/page.tsx` - Server Component parsing URL params, fetching 5 data sets in parallel, rendering placeholder sections
- `app/dashboard/loading.tsx` - Loading skeleton with filter bar, metric cards, charts, and table placeholders
- `app/dashboard/searchParams.ts` - Added getComparisonRange helper for period-over-period comparison
- `components/dashboard/FilterBar.tsx` - Client component with date presets, custom range, cascading campaign/ad group dropdowns, clear button

## Decisions Made
- Converted AppShell from simple wrapper to async Server Component to avoid additional API calls for account data
- Sidebar uses useRouter().push() with preserved search params so switching accounts keeps existing filters
- Dashboard page renders raw JSON for data verification -- Plans 03 and 04 will replace with MetricCards, Charts, and Table components
- getComparisonRange calculates inclusive day count (differenceInDays + 1) so a 30-day period compares to exactly 30 prior days
- FilterBar cascading logic: campaign change always clears adGroup to null, preventing stale ad group from a different campaign

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created FilterBar placeholder stub for Task 1**
- **Found during:** Task 1
- **Issue:** Dashboard page imports FilterBar which does not exist yet (Task 2 creates it), causing TypeScript error
- **Fix:** Created a minimal FilterBar stub with correct prop types so Task 1 could pass type checking independently
- **Files modified:** components/dashboard/FilterBar.tsx
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** 886725b (Task 1 commit, overwritten by Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal -- temporary stub replaced by full implementation in Task 2. No scope creep.

## Issues Encountered
None - all tasks executed smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dashboard shell with data fetching is complete -- raw data flows from DB to page via URL params
- Plan 02-03 can build MetricCards and charts on top of the passed data props
- Plan 02-04 can build the sortable data table from the creatives array
- FilterBar and account selector are fully functional and persist state in URL

## Self-Check: PASSED

- All 6 created/modified files verified on disk
- Both task commits (886725b, fa80bca) verified in git log

---
*Phase: 02-dashboard-and-visualisation*
*Completed: 2026-03-02*
