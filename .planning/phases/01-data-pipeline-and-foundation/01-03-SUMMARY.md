---
phase: 01-data-pipeline-and-foundation
plan: 03
subsystem: scripts, ui
tags: [google-ads-scripts, gaql, seed-data, tsx, dotenv, server-component, sync-status]

# Dependency graph
requires:
  - phase: 01-02
    provides: "POST /api/ingest endpoint, Drizzle schema, accounts/sync_log tables, API key auth"
provides:
  - "Copy-paste ready Google Ads Script querying all 4 campaign types via GAQL and POSTing to app API"
  - "Step-by-step README for deploying the Script in Google Ads"
  - "Seed data script generating 30 days of realistic data for 2 accounts across all campaign types"
  - "Dynamic home page showing connected accounts with colour-coded sync status and recent sync entries"
affects: [02-dashboard-core, 03-rsa-analysis]

# Tech tracking
tech-stack:
  added: [tsx]
  patterns: [google-ads-script-es5-syntax, seed-data-with-cleanup, server-component-db-query, relative-time-formatting]

key-files:
  created:
    - scripts/google-ads/creative-analyser.js
    - scripts/google-ads/README.md
    - scripts/seed-data.ts
  modified:
    - app/page.tsx
    - app/api/accounts/route.ts

key-decisions:
  - "Google Ads Script uses var/function (ES5) for Rhino engine compatibility -- no let/const/arrow functions"
  - "Seed script directly deletes seed accounts from DB before re-seeding to avoid 403 on re-run"
  - "Home page queries DB directly in Server Component instead of HTTP round-trip to /api/accounts"
  - "orderBy uses createdAt instead of nullable lastSyncedAt to avoid Drizzle empty result bug"

patterns-established:
  - "Google Ads Script pattern: CONFIG block at top, main() entry point, GAQL via AdsApp.search(), UrlFetchApp.fetch POST"
  - "Seed data pattern: cleanup existing records, then push 30 days of data per account via API"
  - "Sync status UI: green Active (<48h), amber Stale (2-7d), red Inactive (>7d) colour coding"

requirements-completed: [DATA-01, DATA-04]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 1 Plan 3: Google Ads Script, Seed Data, and Dynamic Sync Status Summary

**Copy-paste ready Google Ads Script for all 4 campaign types via GAQL, seed data script with 30 days of realistic data, and dynamic home page showing colour-coded sync status per account**

## Performance

- **Duration:** 8 min (across multiple sessions including checkpoint verification)
- **Started:** 2026-03-02T04:40:00Z
- **Completed:** 2026-03-02T05:51:06Z
- **Tasks:** 3 (2 auto + 1 checkpoint verification)
- **Files modified:** 7

## Accomplishments
- Complete Google Ads Script (creative-analyser.js) querying RSA, RSA Assets, PMax campaigns, PMax assets, Display/Demand Gen, and Video campaigns via GAQL, with auto-registration flow and ES5 syntax for Rhino engine compatibility
- Seed data script generating 30 days of realistic performance data for 2 sample accounts across all 4 campaign types, with database cleanup on re-run
- Dynamic home page that shows empty state setup guide for new users and connected accounts with colour-coded sync status (Active/Stale/Inactive), relative timestamps, and last 10 sync entries when accounts exist
- End-to-end data pipeline verified: seed script pushes data through API, API validates and stores, home page displays sync status

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Google Ads Script and seed data script** - `45c67a5` (feat)
2. **Task 2: Update home page with dynamic sync status** - `905fbc7` (feat)
3. **Bug fix: bigint mode, error handling, seed deduplication** - `12790df` (fix)
4. **Task 3: Verification bug fixes (seed cleanup, orderBy)** - `ad7baa2` (fix)

## Files Created/Modified
- `scripts/google-ads/creative-analyser.js` - Complete Google Ads Script with CONFIG block, GAQL queries for all 4 campaign types, UrlFetchApp POST, ES5 syntax (280+ lines)
- `scripts/google-ads/README.md` - Step-by-step deployment instructions with troubleshooting section
- `scripts/seed-data.ts` - Seed data generator: 30 days x 2 accounts, realistic metrics, DB cleanup before re-seed, dotenv loading
- `app/page.tsx` - Server Component with direct DB query showing setup guide (empty state) or connected accounts with sync status cards
- `app/api/accounts/route.ts` - Fixed orderBy to use createdAt instead of nullable lastSyncedAt
- `drizzle.config.ts` - Fixed Drizzle Kit config (bigint mode consistency)
- `app/api/ingest/route.ts` - Improved error handling for database operations
- `lib/db/schema.ts` - Fixed bigint mode on cost_micros columns

## Decisions Made
- Google Ads Script uses `var` declarations and `function` keywords throughout (no `let`/`const`, no arrow functions, no template literals) for compatibility with Google Ads Scripts' Rhino JS engine (ES5-ish)
- Seed script imports dotenv and loads `.env.local` to get DATABASE_URL, then uses Drizzle ORM directly to clean up existing seed accounts (deleting child tables first for foreign key ordering) before pushing fresh data through the API
- Home page queries the database directly in the Server Component (`import { db } from '@/lib/db'`) rather than making an HTTP round-trip to `/api/accounts` -- simpler and faster for server-rendered pages
- Changed `orderBy` from `desc(schema.accounts.lastSyncedAt)` to `desc(schema.accounts.createdAt)` in both `app/page.tsx` and `app/api/accounts/route.ts` because ordering by a nullable column caused Drizzle's query builder to return empty results

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed bigint mode inconsistency in Drizzle config**
- **Found during:** Task 2 (build verification)
- **Issue:** Drizzle Kit config did not match schema's bigint mode setting, causing migration/push inconsistencies
- **Fix:** Updated drizzle.config.ts to align with schema bigint configuration
- **Files modified:** drizzle.config.ts, lib/db/schema.ts
- **Committed in:** `12790df`

**2. [Rule 1 - Bug] Fixed database error handling in ingestion API**
- **Found during:** Task 2 (build verification)
- **Issue:** Database errors during upsert were not properly caught, causing unhelpful 500 responses
- **Fix:** Added proper try/catch with descriptive error messages in ingest route
- **Files modified:** app/api/ingest/route.ts
- **Committed in:** `12790df`

**3. [Rule 1 - Bug] Fixed seed script missing dotenv and cleanup function**
- **Found during:** Task 3 (end-to-end verification)
- **Issue:** Seed script could not load DATABASE_URL from .env.local, and re-running seed caused 403 errors because accounts already existed with different API keys
- **Fix:** Added dotenv import with `.env.local` path, added `cleanupSeedAccounts()` function that deletes existing seed data (child tables first for FK ordering) before re-seeding
- **Files modified:** scripts/seed-data.ts
- **Committed in:** `ad7baa2`

**4. [Rule 1 - Bug] Fixed orderBy on nullable lastSyncedAt column**
- **Found during:** Task 3 (end-to-end verification)
- **Issue:** Ordering accounts by nullable `lastSyncedAt` column caused Drizzle query builder to return empty results when all values were null (freshly seeded accounts)
- **Fix:** Changed orderBy to use `createdAt` (non-nullable) in both the accounts API route and home page Server Component
- **Files modified:** app/api/accounts/route.ts, app/page.tsx
- **Committed in:** `ad7baa2`

---

**Total deviations:** 4 auto-fixed (4 x Rule 1 bugs)
**Impact on plan:** All fixes necessary for correct end-to-end pipeline operation. No scope creep.

## Issues Encountered
- Google Ads Scripts' Rhino engine requires ES5 syntax -- verified no let/const, arrow functions, or template literals in the Script
- Drizzle ORM's `findMany` with `orderBy` on nullable columns returns empty results instead of null-last ordering -- worked around by using a non-nullable column

## User Setup Required

**External services require manual configuration.** See 01-02-SUMMARY.md for Neon Postgres setup. For this plan:
- Deploy the Google Ads Script per `scripts/google-ads/README.md` instructions
- Set up daily schedule (3am recommended) in Google Ads Scripts editor

## Next Phase Readiness
- Complete Phase 1 data pipeline is operational end-to-end: Google Ads Script (or seed data) -> POST /api/ingest -> Neon Postgres -> Home page sync status
- All 4 campaign types flow through the pipeline with validation, auth, and deduplication
- Seed data enables development without a real Google Ads account
- Phase 2 can build the dashboard shell on top of this data foundation
- Account selector (Phase 2) can query the accounts table that now has working list and detail endpoints

## Self-Check: PASSED

All 8 referenced files verified present. All 4 commit hashes verified in git log.

---
*Phase: 01-data-pipeline-and-foundation*
*Completed: 2026-03-02*
