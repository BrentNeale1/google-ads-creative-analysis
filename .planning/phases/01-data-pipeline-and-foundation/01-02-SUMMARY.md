---
phase: 01-data-pipeline-and-foundation
plan: 02
subsystem: database, api
tags: [drizzle-orm, neon-postgres, zod, nanoid, api-routes, upsert, bigint, jsonb]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Next.js 14 scaffold with dependencies (drizzle-orm, zod, nanoid, @neondatabase/serverless)"
provides:
  - "8 Drizzle ORM tables for multi-account Google Ads creative performance data"
  - "POST /api/ingest endpoint with Zod validation, API key auth, auto-registration, ON CONFLICT upsert, sync logging"
  - "GET /api/accounts and GET /api/accounts/[id] endpoints for account listing and sync status"
  - "Zod ingestion schema validating all 4 campaign types (RSA, PMax, Display, Video)"
  - "API key generation utility with ca_ prefix"
  - "Drizzle Kit configuration for Neon Postgres migrations"
affects: [01-03, 02-dashboard-core, 03-rsa-analysis, 04-multi-campaign]

# Tech tracking
tech-stack:
  added: []
  patterns: [neon-http-driver, drizzle-schema-with-composite-unique-indexes, zod-v4-validation, on-conflict-upsert, api-key-auto-registration, bigint-for-micros]

key-files:
  created:
    - lib/db/schema.ts
    - lib/db/index.ts
    - lib/validation/ingestionSchema.ts
    - lib/utils/apiKey.ts
    - drizzle.config.ts
    - app/api/ingest/route.ts
    - app/api/accounts/route.ts
    - app/api/accounts/[id]/route.ts
  modified: []

key-decisions:
  - "Used bigint mode for cost_micros columns to prevent integer overflow from Google Ads micro amounts"
  - "PMax asset content_hash computed server-side via MD5 before insert for deduplication"
  - "Auto-registration returns API key in response body -- user updates their Google Ads Script with the key"
  - "Zod v4 with .default(0) on all metric fields so partial payloads from Google Ads Scripts work correctly"

patterns-established:
  - "Database access: import { db } from '@/lib/db' for Drizzle client, import * as schema from '@/lib/db/schema' for table references"
  - "Upsert pattern: insert().values().onConflictDoUpdate() with composite unique target and sql`excluded.column_name` set clauses"
  - "API key auth: x-api-key header checked against accounts table; first push auto-registers without key"
  - "Sync logging: every push creates sync_log entry with success/error status and record count"
  - "BigInt conversion: costMicros and averageCpvMicros stored as bigint, converted from number via BigInt() at insert time"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, DATA-05]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 1 Plan 2: Data Pipeline Summary

**Drizzle ORM schema for 8 tables with composite unique indexes, Zod-validated POST /api/ingest with API key auth and ON CONFLICT upsert for all 4 Google Ads campaign types, plus account listing endpoints**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T04:35:05Z
- **Completed:** 2026-03-02T04:39:24Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 8 Drizzle tables covering accounts, sync log, and all 4 campaign types (RSA, RSA Assets, PMax Asset Groups, PMax Assets, Display, Video) with composite unique indexes for deduplication
- POST /api/ingest endpoint handling the full pipeline: JSON parse, Zod validation with field-level errors, API key authentication with auto-registration on first push, ON CONFLICT upsert for all 6 data tables, sync logging
- GET /api/accounts and GET /api/accounts/[id] endpoints returning account list with last 10 sync entries and sync status
- Zod ingestion schema validating accountId format (xxx-xxx-xxxx), date format (YYYY-MM-DD), and all campaign type arrays with metric defaults

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Drizzle schema, Neon connection, and Zod validation** - `b01a751` (feat)
2. **Task 2: Build ingestion API endpoint with auth, upsert, sync logging, and accounts endpoint** - `292f178` (feat)

## Files Created/Modified
- `lib/db/schema.ts` - 8 Drizzle table definitions (accounts, sync_log, rsa_daily, rsa_asset_daily, pmax_asset_group_daily, pmax_asset_daily, display_daily, video_daily) with composite unique indexes (254 lines)
- `lib/db/index.ts` - Drizzle client initialised with Neon HTTP driver
- `lib/validation/ingestionSchema.ts` - Zod v4 schemas for ingestion payload with format validation and metric defaults (159 lines)
- `lib/utils/apiKey.ts` - API key generator producing ca_ prefixed 32-char nanoid keys
- `drizzle.config.ts` - Drizzle Kit config for Neon Postgres migrations
- `app/api/ingest/route.ts` - POST endpoint: parse, validate, authenticate, upsert all campaign types, sync log (295 lines)
- `app/api/accounts/route.ts` - GET endpoint: list all accounts with recent sync history
- `app/api/accounts/[id]/route.ts` - GET endpoint: single account detail with sync history and 404 handling

## Decisions Made
- Used `bigint` mode (`{ mode: 'bigint' }`) for all cost_micros and average_cpv_micros columns to prevent integer overflow from Google Ads micro amounts (research pitfall #4)
- PMax asset `content_hash` is computed server-side via Node.js `createHash('md5')` before insert, using coalesce logic (textContent || imageUrl || youtubeVideoId || '') for reliable deduplication
- Auto-registration flow: first push from unknown accountId creates account record, generates API key, returns it in response body so the user can update their Google Ads Script CONFIG
- Zod v4 `.default(0)` on all metric fields ensures partial payloads from Google Ads Scripts (where some metrics might be missing) still parse correctly
- `.env.local` created with placeholder DATABASE_URL but correctly excluded from git (already in .gitignore) -- user must set real Neon connection string

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**External services require manual configuration.** The Neon Postgres database needs to be set up:
- Create a Neon project (free tier) at https://console.neon.tech
- Copy the connection string from Project -> Connection Details
- Set `DATABASE_URL` in `.env.local` to the connection string
- Run `npx drizzle-kit push` to create the database tables

## Next Phase Readiness
- Complete data pipeline from HTTP POST to Postgres storage is ready
- All 4 campaign types handled in single endpoint with deduplication
- Account listing and sync status endpoints available for the dashboard
- Schema supports multi-account isolation via account_id on every table
- Next plan (01-03) can build the Google Ads Script that pushes data to this endpoint

## Self-Check: PASSED
