---
phase: 04-multi-format-analysis-and-intelligence
plan: 02
subsystem: ui, api
tags: [pmax, performance-max, asset-groups, drizzle, nextjs, server-components]

# Dependency graph
requires:
  - phase: 03-rsa-analysis
    provides: "Analysis pipeline (tierClassification, underperformerDiagnosis, patternDetection, recommendations), RSA UI components pattern"
  - phase: 01-data-pipeline
    provides: "PMax DB schema (pmaxAssetGroupDaily, pmaxAssetDaily), ingestion pipeline"
provides:
  - "PMax analysis page at /pmax with 3-tab layout"
  - "PMax query module with asset group aggregation, portfolio averages, and text asset queries"
  - "PMax-specific UI components: PmaxLeaderboard, PmaxThemeAnalysis, PmaxTabNav"
affects: [display-analysis, video-analysis, sidebar-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["PMax analysis follows RSA pattern with asset group adaptation"]

key-files:
  created:
    - "lib/queries/pmax.ts"
    - "app/pmax/searchParams.ts"
    - "app/pmax/page.tsx"
    - "components/pmax/PmaxTabNav.tsx"
    - "components/pmax/PmaxLeaderboard.tsx"
    - "components/pmax/PmaxThemeAnalysis.tsx"
  modified:
    - "components/layout/Sidebar.tsx"
    - "app/settings/page.tsx"

key-decisions:
  - "Reused TierOverview, PatternCharts, UnderperformerPanel, RecommendationList from RSA -- components accept generic props"
  - "PMax leaderboard shows asset group name (not headline text) as primary identifier with campaign as secondary"
  - "Top 5 / Bottom 5 slice on leaderboard tables to keep PMax page concise"
  - "Text assets grouped by asset group for theme analysis with performance label colour coding"
  - "PortfolioAvg type duplicated in pmax queries (same shape as RSA) for module independence"

patterns-established:
  - "Campaign-type analysis pages follow identical Server Component orchestration pattern: fetch, enrich as CreativeInput, run shared pipeline, render with tab nav"
  - "Caveat banners for Google-controlled creative assembly use amber/warning colour scheme"

requirements-completed: [PMAX-01, PMAX-02, PMAX-03, PMAX-04, PMAX-05, PMAX-06]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 04 Plan 02: PMax Analysis Page Summary

**PMax asset group analysis page with tier classification, leaderboard, theme detection, underperformer diagnosis, and recommendations -- with prominent caveat about Google controlling creative assembly**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T10:59:48Z
- **Completed:** 2026-03-02T11:04:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- PMax query module with 3 server-only functions: asset group aggregation, portfolio averages, text asset queries
- Full PMax analysis page at /pmax reusing shared analysis pipeline (classifyTiers, detectPatterns, diagnoseUnderperformers, generateRecommendations)
- 3-tab layout (Overview, Asset Groups, Recommendations) with URL-driven navigation
- Prominent PMax caveat banner about Google controlling creative assembly

## Task Commits

Each task was committed atomically:

1. **Task 1: PMax query module and search params** - `e12a416` (feat)
2. **Task 2: PMax analysis page with all UI components** - `1e08cc1` (feat)
3. **Deviation fix: Enable PMax nav and settings revalidation** - `7d7504b` (fix)

## Files Created/Modified
- `lib/queries/pmax.ts` - PMax asset group aggregation, portfolio averages, text asset queries with server-only protection
- `app/pmax/searchParams.ts` - URL search param cache for PMax page (account, range, campaign, tab)
- `app/pmax/page.tsx` - Server Component orchestrating data fetch, analysis pipeline, and tab-based rendering
- `components/pmax/PmaxTabNav.tsx` - Client-side tab navigation (Overview, Asset Groups, Recommendations)
- `components/pmax/PmaxLeaderboard.tsx` - Top 5 / Bottom 5 asset group leaderboard with portfolio average row
- `components/pmax/PmaxThemeAnalysis.tsx` - Text asset theme analysis grouped by asset group with performance labels
- `components/layout/Sidebar.tsx` - Enabled PMax nav link (was disabled: true)
- `app/settings/page.tsx` - Added revalidatePath('/pmax') for KPI change propagation

## Decisions Made
- Reused TierOverview, PatternCharts, UnderperformerPanel, RecommendationList from RSA -- these components accept generic TieredCreative props and work for any campaign type
- PMax leaderboard shows asset group name as primary column (not headline text like RSA) with campaign name as secondary info
- Top 5 / Bottom 5 slice on leaderboard keeps the page focused
- Text assets displayed grouped by asset group with BEST/GOOD/LOW/LEARNING performance label badges
- PortfolioAvg interface duplicated in pmax.ts rather than importing from rsa.ts -- keeps modules independent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Enabled PMax sidebar navigation link**
- **Found during:** Task 2 (PMax page creation)
- **Issue:** PMax nav item in Sidebar.tsx was disabled: true, making the new page inaccessible
- **Fix:** Changed disabled: false for the PMax nav item
- **Files modified:** components/layout/Sidebar.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 7d7504b

**2. [Rule 2 - Missing Critical] Added revalidatePath for PMax in settings**
- **Found during:** Task 2 (PMax page creation)
- **Issue:** Settings page only revalidated /settings and /rsa on KPI change, PMax page would show stale data
- **Fix:** Added revalidatePath("/pmax") to updatePrimaryKpi server action
- **Files modified:** app/settings/page.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 7d7504b

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both fixes necessary for the PMax page to be accessible and receive KPI updates. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in lib/analysis/fatigueDetection.ts (from plan 04-01) -- out of scope, not caused by this plan's changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PMax analysis page complete, Display and Video pages can follow the same pattern
- Shared analysis pipeline (classifyTiers, detectPatterns, etc.) proven reusable across campaign types
- Sidebar nav ready for Display and Video page enablement

## Self-Check: PASSED

All 6 created files verified on disk. All 3 commit hashes (e12a416, 1e08cc1, 7d7504b) found in git log.

---
*Phase: 04-multi-format-analysis-and-intelligence*
*Completed: 2026-03-02*
