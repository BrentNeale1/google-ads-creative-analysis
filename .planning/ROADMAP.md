# Roadmap: Google Ads Creative Analyser

## Overview

This roadmap delivers a creative intelligence dashboard in four phases. Phase 1 lays the data pipeline and project scaffold -- nothing works without data arriving correctly. Phase 2 builds the dashboard shell (account selector, metrics, charts, filtering). Phase 3 delivers RSA analysis as the deepest and most important creative format. Phase 4 extends the same analysis framework to PMax, Display, and Video, then adds cross-cutting intelligence features (gap analysis, fatigue detection, Monday briefing). AI-generated copy is deferred to v2.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Pipeline and Foundation** - Ingestion API, database schema, project scaffold, design system config (completed 2026-03-02)
- [x] **Phase 2: Dashboard and Visualisation** - Account selector, metrics overview, date ranges, filtering, charts (completed 2026-03-02)
- [ ] **Phase 3: RSA Analysis** - Tier classification, asset and combination analysis, pattern detection, recommendations
- [ ] **Phase 4: Multi-Format Analysis and Intelligence** - PMax, Display, Video analysis plus gap analysis, fatigue detection, Monday briefing

## Phase Details

### Phase 1: Data Pipeline and Foundation
**Goal**: Data flows reliably from Google Ads Scripts into the app, stored as append-only time-series, with a working Next.js scaffold and design system configured
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DASH-06, DASH-07, VIS-03
**Success Criteria** (what must be TRUE):
  1. Google Ads Script can POST creative data to the app's API endpoint and receive a success/failure response with validation errors
  2. Data for multiple accounts is stored in isolation and each account shows its last-synced timestamp
  3. Historical daily snapshots accumulate over time (append-only) and are queryable by date range
  4. The app runs on Vercel with Tailwind design system colours configured and responsive layout working on laptop and tablet
  5. All number formatting follows AU locale (AUD currency, percentages to 1dp, K/M shorthand ready)
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, Tailwind design system, responsive app shell with sidebar, AU locale formatting
- [ ] 01-02-PLAN.md — Database schema (Drizzle + Neon), Zod validation, ingestion API endpoint with auth and upsert
- [ ] 01-03-PLAN.md — Google Ads Script, seed data script, dynamic home page with sync status

### Phase 2: Dashboard and Visualisation
**Goal**: Operator can open the app, select an account, view key performance metrics, filter by date and campaign, and see creative performance in charts and sortable tables
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, VIS-01, VIS-02, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. User can switch between client accounts and each shows its own data
  2. Performance overview displays impressions, clicks, CTR, conversions, and CPA/ROAS with period-over-period comparison
  3. User can select date ranges (7d, 30d, 90d presets and custom) and filter by campaign and ad group
  4. Time-series line charts show creative performance trends over selected date range
  5. Horizontal bar charts compare creatives sorted by value descending, with data labels when fewer than 10 items and no visual clutter (no borders, no 3D, subtle or no gridlines)
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Install deps (recharts, nuqs, date-fns), NuqsAdapter, search params, data aggregation queries, metric definitions
- [ ] 02-02-PLAN.md — Account selector in sidebar, filter bar with date presets and cascading dropdowns, dashboard page shell
- [ ] 02-03-PLAN.md — Metric cards with period deltas, time-series line chart, horizontal bar chart, metric tabs, tooltips
- [ ] 02-04-PLAN.md — Sortable paginated performance table, end-to-end dashboard verification

### Phase 3: RSA Analysis
**Goal**: Operator can analyse RSA creative performance at asset and combination level, see which patterns drive results, understand why underperformers fail, and get actionable Keep/Test/Pause/Investigate recommendations
**Depends on**: Phase 2
**Requirements**: RSA-01, RSA-02, RSA-03, RSA-04, RSA-05, RSA-06, RSA-07, RSA-08, RSA-09
**Success Criteria** (what must be TRUE):
  1. Creatives are classified into top 20%, middle 60%, and bottom 20% tiers by the account's configured primary KPI (CPA or ROAS)
  2. User can view individual headline and description performance, and RSA combination data is clearly labelled as directional ("Top combinations reported by Google")
  3. Underperforming creatives show a specific diagnosis (not serving / not resonating / landing page disconnect / wrong audience) with mapped recommended actions
  4. Pattern detection surfaces what top performers have in common (copy themes, headline length, CTA type, numbers/stats) with insight-led chart titles computed from the data
  5. Every creative has a Keep/Test/Pause/Investigate classification with a prioritised action list
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Vitest test infrastructure, schema updates (textContent on rsaAssetDaily, rsaCombinationDaily table), Zod and ingestion route updates
- [ ] 03-02-PLAN.md — TDD core analysis engine: tier classification, underperformer diagnosis, pattern detection, recommendations, insight titles
- [ ] 03-03-PLAN.md — Seed data updates, RSA-specific DB queries, settings page with KPI toggle, sidebar RSA link activation
- [ ] 03-04-PLAN.md — RSA analysis page with all UI components: tier overview, leaderboard, asset performance, combinations, diagnosis, patterns, recommendations

### Phase 4: Multi-Format Analysis and Intelligence
**Goal**: All four creative formats (RSA, PMax, Display, Video) have full analysis coverage, and cross-cutting intelligence features surface what to do next
**Depends on**: Phase 3
**Requirements**: PMAX-01, PMAX-02, PMAX-03, PMAX-04, PMAX-05, PMAX-06, DISP-01, DISP-02, DISP-03, DISP-04, DISP-05, DISP-06, VID-01, VID-02, VID-03, VID-04, VID-05, VID-06, INTL-01, INTL-02, INTL-03
**Success Criteria** (what must be TRUE):
  1. PMax asset groups have their own tier classification, leaderboard, theme analysis, and Keep/Test/Pause/Investigate recommendations with explicit "directional only" caveats
  2. Display/Demand Gen creatives have tier classification, leaderboard, format comparison (square vs landscape vs portrait), and recommendations
  3. Video creatives have tier classification, leaderboard, video-specific metrics (view rate, watch time, VTR), and recommendations
  4. Gap analysis identifies untested creative angles and selling points across the portfolio
  5. Monday morning briefing view shows what changed, what needs attention, and prioritised actions in a single screen
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Pipeline and Foundation | 3/3 | Complete   | 2026-03-02 |
| 2. Dashboard and Visualisation | 4/4 | Complete   | 2026-03-02 |
| 3. RSA Analysis | 0/4 | Not started | - |
| 4. Multi-Format Analysis and Intelligence | 0/3 | Not started | - |
