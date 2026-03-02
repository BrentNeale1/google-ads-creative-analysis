---
phase: 03-rsa-analysis
plan: 03
subsystem: database, ui, api
tags: [drizzle, server-actions, rsa, queries, seed-data, google-ads-script]

# Dependency graph
requires:
  - phase: 03-rsa-analysis/01
    provides: RSA schema tables (rsaDaily, rsaAssetDaily, rsaCombinationDaily) with textContent and combination columns
provides:
  - RSA query module with 4 aggregation functions (fetchRsaCreatives, fetchRsaAssets, fetchRsaCombinations, fetchRsaPortfolioAvg)
  - Settings page with per-account KPI toggle (CPA/ROAS)
  - Sidebar RSA Analysis link enabled with route-aware active state
  - Seed data with textContent on RSA assets and rsaCombinations arrays
  - Google Ads Script updated with asset text query and combination view
affects: [03-rsa-analysis/04, 04-additional-types]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-actions-for-settings, route-aware-sidebar-nav, rsa-query-with-derived-metrics]

key-files:
  created:
    - lib/queries/rsa.ts
    - app/settings/page.tsx
  modified:
    - scripts/seed-data.ts
    - scripts/google-ads/creative-analyser.js
    - components/layout/Sidebar.tsx

key-decisions:
  - "RSA queries compute derived metrics (CTR, CVR, CPA, ROAS) server-side with zero-division guards"
  - "Combination queries return impressions only -- no CTR/CPA since Google does not provide clicks/conversions for combinations"
  - "Portfolio averages computed by first aggregating per-creative then averaging across creatives (not raw row averages)"
  - "Settings page uses Server Action with revalidatePath for minimal client-side complexity"
  - "Sidebar active state determined dynamically via usePathname instead of hardcoded boolean"

patterns-established:
  - "RSA query pattern: Drizzle groupBy with sum aggregations, conditional filters, derived metric computation"
  - "Server Action pattern: form-based mutation with revalidatePath for Server Component refresh"
  - "Route-aware nav: usePathname().startsWith(href) for dynamic active state across all nav items"

requirements-completed: [RSA-02, RSA-03, RSA-04, RSA-05]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 03 Plan 03: RSA Data Layer and Infrastructure Summary

**RSA query module with 4 aggregation functions, settings page with CPA/ROAS KPI toggle, and sidebar with enabled RSA navigation link**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T09:30:37Z
- **Completed:** 2026-03-02T09:36:27Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- RSA query module with fetchRsaCreatives, fetchRsaAssets, fetchRsaCombinations, fetchRsaPortfolioAvg -- all with proper types, server-only guard, conditional filters, and zero-division protection
- Seed data updated with textContent on RSA assets and rsaCombinations arrays for full pipeline testing
- Google Ads Script updated to query asset.text_asset.text and ad_group_ad_asset_combination_view
- Settings page at /settings with per-account CPA/ROAS primary KPI selector using Server Actions
- Sidebar RSA Analysis link enabled with route-aware active state using usePathname

## Task Commits

Each task was committed atomically:

1. **Task 1: Update seed data and Google Ads Script for textContent and combinations** - `6d642d7` (feat)
2. **Task 2: Create RSA-specific database queries** - `06c4471` (feat)
3. **Task 3: Settings page with KPI toggle and sidebar RSA link activation** - `9529270` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `lib/queries/rsa.ts` - Server-only RSA data fetching functions with 4 exports and derived metrics
- `app/settings/page.tsx` - Settings page with account KPI selector (Server Component + Server Action)
- `scripts/seed-data.ts` - Added textContent to RSA assets, generateRsaCombinations function, cleanup for combinations
- `scripts/google-ads/creative-analyser.js` - Added asset.text_asset.text to asset query, new queryRsaCombinationPerformance function
- `components/layout/Sidebar.tsx` - RSA link enabled, route-aware active state, account nav to current page

## Decisions Made
- RSA queries compute derived metrics (CTR, CVR, CPA, ROAS) server-side with zero-division guards rather than pushing to client
- Combination queries explicitly do NOT compute CTR or CPA since Google only provides impressions for combinations
- Portfolio averages aggregate per-creative first, then average across creatives (weighted average approach)
- Settings page uses Server Action with revalidatePath for minimal client-side complexity (no useState, no optimistic updates)
- Sidebar active state changed from hardcoded booleans to dynamic usePathname-based detection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All prerequisites for Plan 04 (RSA page + UI) are in place:
  - RSA queries return properly shaped data with derived metrics
  - Seed data exercises the full pipeline including text content and combinations
  - Settings page allows KPI configuration (RSA-02 requirement)
  - Sidebar provides navigation to /rsa
- Pre-existing TS errors in plan 03-02 test files are out of scope (parallel execution)

## Self-Check: PASSED

All files verified present. All 3 task commits verified in git log.

---
*Phase: 03-rsa-analysis*
*Completed: 2026-03-02*
