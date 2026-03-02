# Project Research Summary

**Project:** Google Ads Creative Analyser
**Domain:** Google Ads Creative Performance Analysis Platform
**Researched:** 2026-03-02
**Confidence:** MEDIUM

## Executive Summary

This is a creative intelligence dashboard for a single operator managing 3-10 Google Ads accounts. The product occupies a clear niche between raw reporting tools (Looker Studio, Supermetrics) that surface numbers without insight and full PPC management suites (Optmyzr, Adalysis) that charge $200-800/month and bundle creative analysis with bid management. The recommended approach is a Next.js 14 App Router application backed by PostgreSQL (Neon), with Google Ads Scripts pushing data daily via a secure API endpoint. The stack is mandated largely by CLAUDE.md, and the architectural decisions (Server Components for data fetching, Drizzle ORM, Zod validation at ingestion boundaries, analysis cache with hash invalidation) fit cleanly with those constraints.

The key differentiator is moving from "here is your data" to "here is what it means and what to do." Four intelligence layers achieve this: performance tier classification (top/middle/bottom 20%), pattern detection across top performers (copy themes, structural signals), underperformer diagnosis (why an ad is failing, not just that it is failing), and a Keep/Test/Pause/Investigate action framework. AI-generated copy recommendations sit on top of these layers and should be deferred to v2 until the analytical foundation is solid. The data pipeline — Google Ads Scripts to ingestion API to PostgreSQL — is the critical path; nothing else works without it.

The most consequential risk is building on false data assumptions from the start. Three mistakes cause rewrites: treating RSA combination data as exhaustive (Google only reports top combinations), designing a snapshot-only database that cannot support historical comparisons (append-only time-series is required from day one), and failing to model the fundamentally different data fidelity across campaign types (RSA, PMax, Display, Video cannot be treated identically). These must be addressed at the schema and ingestion layer before any dashboard or analysis work begins.

---

## Key Findings

### Recommended Stack

The stack is largely mandated by CLAUDE.md (Next.js 14, TypeScript, Tailwind CSS, Recharts, Papaparse, SheetJS, Vercel deployment) with logical extensions filling gaps. Drizzle ORM is preferred over Prisma for lighter cold starts on Vercel serverless and better SQL control for analytical queries. Vercel Postgres (Neon) is the right database: zero-config Vercel integration, serverless driver, JSONB for flexible creative metadata, and PostgreSQL window functions for percentile calculations. Zod serves as the contract between Google Ads Scripts output and the ingestion API. The Vercel AI SDK with gpt-4o-mini is recommended for AI recommendations when that feature is built in v2.

**Core technologies:**
- Next.js 14 (App Router): Full-stack framework — mandated; Server Components eliminate client-side waterfall requests for a fast Monday morning dashboard load
- TypeScript (strict mode): Type safety — essential for complex Google Ads data schemas (RSA assets, PMax asset groups, multiple KPI types)
- Tailwind CSS 3.x: Styling — mandated; configure design system colours (#1A73E8, #34A853, etc.) as Tailwind theme extensions
- Recharts 2.12+: Charts — mandated; use `ResponsiveContainer` everywhere and `Cell` components for per-bar conditional colouring
- Vercel Postgres (Neon): Database — zero-config Vercel integration, serverless-first driver, PostgreSQL for analytical queries and time-series
- Drizzle ORM: Database access — lighter than Prisma, faster cold starts, transparent SQL generation for analytical queries
- Zod: Validation — runtime schema validation at the ingestion boundary, tight TypeScript integration, doubles as the contract with Google Ads Scripts
- Papaparse + SheetJS: Parsing — mandated; CSV and XLSX ingestion from Google Ads Script output
- date-fns 3.x: Dates — tree-shakeable, immutable, needed for period-over-period calculations and date range filtering
- nuqs 2.x: URL state — sync dashboard filters (account, date range, KPI) to URL for bookmarkable views
- Vercel AI SDK + gpt-4o-mini: AI recommendations — defer to v2; use `generateObject()` with Zod schemas for structured output
- Vitest: Testing — focus tests on `lib/analysis/` (tier classification, pattern detection); pure logic, highest value to protect

**Version note:** Major-version guidance is reliable (Next.js 14.x not 15.x — breaking caching changes; React 18.x not 19.x — incompatible with Next.js 14; Tailwind 3.x not 4.x — significant API changes). Verify exact patch versions with `npm info <package> version` before installing.

### Expected Features

**Must have (table stakes):**
- Data ingestion from Google Ads Scripts — nothing else works without this
- Multi-account support with account selector — operator manages 3-10 clients
- Performance metrics dashboard with date range selection — at-a-glance health and period-over-period comparison (7d/30d/90d presets)
- Performance tier classification (top 20% / middle / bottom 20% by CPA or ROAS) — the core analytical lens; configurable primary KPI per account
- Top/bottom creative leaderboards — the first question every operator asks
- RSA asset-level analysis — RSAs are the dominant Search ad format
- Basic filtering and sorting — expected in every reporting tool
- Data freshness indicator — "Last synced: [timestamp]" per account; builds trust
- Metric formatting (AUD, AU locale, K/M shorthand in charts, full numbers in tables)

**Should have (differentiators):**
- Underperformer diagnosis — WHY an ad fails (not serving / creative not resonating / landing page disconnect / wrong audience)
- Keep/Test/Pause/Investigate framework — every analysis ends with prioritised decisions, not just data
- Pattern detection across top performers — structural signals first (headline length, numbers in copy, CTA verb, question mark), then copy themes
- Insight-led chart titles — "Benefit-led headlines outperform by 34%" not "CTR Comparison"
- RSA combination reporting — sparse and directional; must be clearly labelled as "Top combinations reported by Google"
- Creative fatigue detection — identify ads with statistically significant CTR/CPA decline over time
- PMax asset group theme analysis — limited by Google's black box; separate module with explicit directional caveats
- Monday morning briefing view — single-screen weekly review: what changed, what needs attention, prioritised actions

**Defer to v2:**
- AI-generated creative recommendations — requires solid pattern detection first; high LLM integration complexity
- Gap analysis (untested creative angles) — needs a selling point taxonomy that develops through actual usage
- Cross-client pattern insights — needs data maturity across multiple accounts
- Selling point taxonomy — start manual in v1, systematise in v2
- Display and Video-specific deep analysis — ship basic metrics coverage in v1, add intelligence features in v2-v3

**Explicit anti-features (do not build):**
- Bid management or budget pacing
- Keyword research or management
- Client-facing login portal (single operator, no auth for v1)
- PDF/report export
- Direct Google Ads API integration (Scripts-first per PROJECT.md)
- Automated ad pausing or activation (recommend only, never automate)
- A/B test statistical engine (Google does not run true controlled A/B tests)

### Architecture Approach

The system has three distinct data flows: (1) Ingestion — Google Ads Scripts POST daily JSON payloads per account to `/api/ingest/[accountId]`, validated via Zod, normalised, and written to PostgreSQL as append-only daily snapshots; (2) Dashboard — Next.js Server Components query PostgreSQL via Drizzle, run the analysis engine (tier classification, pattern detection, diagnosis), and pass pre-computed data as props to client-side Recharts components; (3) AI recommendations — on-demand API route calls Vercel AI SDK, constructs prompt from analysis results, returns structured copy suggestions cached in the database until the next data refresh.

The analysis cache with hash-based invalidation prevents recomputing on every page load while guaranteeing freshness: when the daily script push arrives, the hash changes, and the next dashboard load recomputes. The Google Ads Script must chunk its payloads by campaign type (one POST per type) to stay within Vercel's 4.5MB request body limit and Google's `UrlFetchApp` ~10MB payload limit.

**Major components:**
1. Ingestion API (`/app/api/ingest/[accountId]`) — validates shared-secret API key, runs Zod schema validation, upserts to PostgreSQL, invalidates analysis cache; kept fast and dumb (no heavy processing inline)
2. Database (PostgreSQL/Neon) — append-only `daily_snapshots` (one row per creative per day), separate `rsa_assets` and `rsa_combinations` tables, `analysis_cache` with hash invalidation, `recommendations` cache
3. Analysis Engine (`/lib/analysis/`) — `tiers.ts`, `patterns.ts`, `diagnosis.ts`, `gaps.ts`, `trends.ts`, `cache.ts` — pure TypeScript functions, server-side only, independently testable with fixture data
4. Dashboard Pages (`/app/[accountId]/`) — Server Components fetch in parallel via `Promise.all`, pass pre-computed data as serialisable props to client components; nuqs manages filter state in URL
5. Chart Components (`/components/charts/`) — Recharts-based, client-side only, receive pre-computed data as props; `ResponsiveContainer` on every chart; design system colour palette from shared constants
6. AI Recommendations (`/lib/ai/`) — server-only, Vercel AI SDK + `generateObject()` with Zod schemas, results cached until next data refresh
7. Google Ads Scripts (external) — run daily per account, chunk data by campaign type, POST with `x-api-key` header, send manifest/completeness signal with expected record counts

### Critical Pitfalls

1. **RSA combination data is not exhaustive** — Google only reports top serving combinations, not a full performance matrix. Design asset-level analysis as the primary signal; treat combination data as supplementary and directional only. Label in the UI: "Top combinations reported by Google." Build this correctly in Phase 1 schema design or the entire analysis layer rests on false assumptions.

2. **Append-only time-series is non-negotiable from day one** — A snapshot-only schema (overwrite on each sync) cannot support period-over-period comparison, trend charts, or fatigue detection. The `daily_snapshots` table must be append-only from the very first data push. This cannot be retrofitted without a full schema rewrite.

3. **Google Ads Scripts fail silently** — Scripts hit execution time limits (30 minutes) and `UrlFetchApp` payload size limits (~10MB). Silent failures produce partial data that looks like performance declines. Mitigate with: chunked payloads per campaign type, a manifest check (script sends expected record count at the end), and a data health dashboard showing per-account sync status and record counts.

4. **Low-volume creative ranking produces noise that destroys trust** — A headline with 50 impressions and 10% CTR ranked above a headline with 5,000 impressions and 7% CTR causes bad recommendations and loss of operator trust. Implement minimum impression thresholds (configurable, e.g., 100 or 1,000) and a "Data Maturity" indicator (Reliable / Emerging / Too Early) as gates for tier classification.

5. **Campaign types have fundamentally different data fidelity** — RSA metrics are actionable; PMax asset ratings are opaque signals (Google controls creative assembly); Display and Video have different baseline metrics and performance contexts. Never mix campaign types in the same comparison tables or leaderboards. Tier classification must run within each campaign type. PMax analysis must be a separate module with explicit "directional only" caveats.

---

## Implications for Roadmap

Based on the dependency chains in ARCHITECTURE.md and the feature prioritisation in FEATURES.md, a 5-phase structure is recommended:

### Phase 1: Foundation — Data Pipeline and Schema

**Rationale:** The entire product depends on data arriving correctly. Nothing downstream can be built or tested without real data flowing. This phase also locks in architectural decisions that cannot be retrofitted: append-only time-series schema, chunked script design, Zod validation contracts, API key authentication, and raw data preservation for schema change resilience.

**Delivers:** Working data pipeline for at least one Google Ads account. PostgreSQL schema (accounts, daily_snapshots, rsa_assets, rsa_combinations, analysis_cache, recommendations tables). Google Ads Script that pushes chunked payloads by campaign type with manifest/completeness check. Ingestion API endpoint with Zod validation and shared-secret auth. Next.js project scaffold with Tailwind and design system colour tokens configured. Data health dashboard (per-account last sync, record count, schema validation errors).

**Addresses (from FEATURES.md):** Data ingestion, multi-account schema, data freshness indicator, metric formatting groundwork, versioned schema for GAQL resilience.

**Avoids (from PITFALLS.md):** Pitfall 11 (snapshot-only schema — append-only from day one), Pitfall 2 (silent script failures — chunked pushes and manifest check), Pitfall 5 (GAQL schema changes — versioned schema and raw data preservation), Pitfall 9 (payload size limits — chunked pushes), Pitfall 14 (serverless timeout — fast dumb ingestion, async analysis via cron).

**Research flag:** LOW — Neon + Drizzle + Next.js API routes are well-documented. Shared-secret API key pattern is standard. No phase research needed. However, capturing a real Google Ads Script output sample before finalising the Zod schema is strongly recommended (practical validation, not library research).

---

### Phase 2: Core Dashboard — Visibility

**Rationale:** Once data flows, the operator needs basic visibility. This phase delivers the "is it working and what am I looking at?" layer. All subsequent analysis and intelligence features need the account selector, date range controls, and metrics display framework to exist first. Data accuracy should be validated against the Google Ads UI before proceeding to Phase 3.

**Delivers:** Account selector with routing (`/[accountId]/`). Performance metrics dashboard (summary cards: impressions, clicks, CTR, conversions, CPA/ROAS). Date range selection (7d/30d/90d presets and custom range, period-over-period comparison). Creative leaderboard (sorted tables, descending by primary KPI, conditional row formatting: green for top performers, red for bottom). Performance tier classification engine (`lib/analysis/tiers.ts`) with configurable minimum impression thresholds and Data Maturity indicators. Per-account primary KPI configuration (CPA or ROAS, never CTR). Basic filtering and sorting.

**Addresses (from FEATURES.md):** Account selector, performance dashboard, date range selection, tier classification, top/bottom leaderboards, basic filtering and sorting, data freshness indicator, AUD metric formatting.

**Avoids (from PITFALLS.md):** Pitfall 3 (low-volume ranking — minimum thresholds and Data Maturity indicators), Pitfall 6 (CTR as primary KPI — enforce CPA/ROAS as primary), Pitfall 8 (cross-format comparison — segment all analysis by campaign type from day one), Pitfall 7 (seasonality misattribution — show absolute metrics with impression volume context).

**Uses (from STACK.md):** Server Components for data fetching, nuqs for URL filter state, Drizzle for queries, date-fns for period calculations.

**Research flag:** LOW — well-documented Next.js App Router dashboard patterns. No phase research needed.

---

### Phase 3: Visualisation — Charts and Trend Data

**Rationale:** With pages and data in place, this phase adds the visual analytical layer. Time-series charts require accumulated daily snapshot data (Phase 1 must have been running for at least a week before trend charts are meaningful). Chart components can be developed in parallel with Phase 4 analysis logic using fixture data, then wired to real data. Chart components are the one area that can be parallelised.

**Delivers:** Time-series trend line charts per creative (built from daily snapshots). Creative comparison horizontal bar charts (sorted descending, data labels for fewer than 10 items, conditional colouring by tier). Scatter plot (CTR vs CVR). Insight-led chart titles (computed from data before render — the finding goes in the title, not a generic label). Recharts design system configuration: shared colour constants, custom AUD-formatted tooltips, `ResponsiveContainer` on every chart, no borders or 3D effects, gridlines at #E8EAED or hidden.

**Addresses (from FEATURES.md):** Time-series trend charts, creative comparison bar charts, insight-led chart titles, creative fatigue detection foundation (trend data required first).

**Avoids (from PITFALLS.md):** Pitfall 7 (time comparison traps — show impression volume alongside trends, flag periods of >20% volume shift), Pitfall 8 (apples-to-oranges — campaign-type-scoped charts only, never cross-format raw metric comparison).

**Uses (from STACK.md):** Recharts, design system constants (`lib/constants/colours.ts`, `lib/constants/chartConfig.ts`, `lib/constants/formatting.ts`).

**Research flag:** LOW — standard Recharts patterns; design system is fully documented in CLAUDE.md. No phase research needed.

---

### Phase 4: Deep Analysis — Intelligence Features

**Rationale:** This is where the product becomes genuinely differentiated from Looker Studio. Analysis features (pattern detection, underperformer diagnosis, RSA asset analysis) depend on having data (Phase 1) and a display framework (Phase 2). The analysis logic in `lib/analysis/` is pure TypeScript with no UI dependency and can be built and unit-tested with fixture data in parallel with Phase 3. This is the highest-value code in the application; Vitest tests here are worth the investment.

**Delivers:** RSA asset-level analysis (per-headline and per-description performance, Google ratings cross-referenced with actual conversion data, pin impact). RSA combination reporting (clearly labelled as sparse and directional, "Top combinations reported by Google," stored in separate `rsa_combinations` table). Underperformer diagnosis decision tree (not serving / creative not resonating / landing page disconnect / wrong audience, each mapped to a specific recommended action). Pattern detection engine (`lib/analysis/patterns.ts`) — structural signals first (headline length buckets, contains numbers, contains question mark, CTA verb detection), semantic theme classification with operator confirmation as a second pass. Keep/Test/Pause/Investigate framework (algorithmic classification producing a prioritised action list). PMax asset group analysis module (separate, explicitly limited, directional caveats in UI, theme-level analysis of asset groups). Creative fatigue detection (statistically significant CTR/CPA decline over rolling windows). Analysis cache layer (`lib/analysis/cache.ts`) with hash-based invalidation.

**Addresses (from FEATURES.md):** RSA asset-level analysis, RSA combination reporting, underperformer diagnosis, pattern detection (basic), Keep/Test/Pause/Investigate framework, PMax asset group analysis, creative fatigue detection.

**Avoids (from PITFALLS.md):** Pitfall 1 (RSA combination data — asset-level primary, combination supplementary, never present as exhaustive), Pitfall 4 (PMax black box — separate module with explicit "directional only" caveats, focus on what to add/remove not which asset is performing), Pitfall 10 (Google asset ratings — cross-reference with conversion data, surface discrepancies as findings, never auto-recommend pausing on ratings alone), Pitfall 12 (Ad Strength — informational context only, not used in classification), Pitfall 13 (theme classification — start structural, operator-assisted confirmation, multi-label allowed).

**Research flag:** MEDIUM — RSA combination report data structure and available GAQL fields for `ad_group_ad_asset_combination_view` benefit from verification against current Google Ads API documentation before finalising the ingestion schema for this data. This is a targeted research spike, not a full phase research cycle.

---

### Phase 5: Intelligence — AI Recommendations and Briefing

**Rationale:** This is the capstone. AI recommendations require solid pattern detection (Phase 4) as input context — the LLM needs verified winning patterns to produce useful suggestions, not raw metrics. The Monday morning briefing synthesises all previous phases. Gap analysis requires a selling point taxonomy that needs real usage time to develop. These features carry the highest differentiation payoff but also the highest implementation complexity.

**Delivers:** AI-generated creative recommendations (Vercel AI SDK, gpt-4o-mini, `generateObject()` with Zod schemas, output structured as Keep/Test/Pause/Investigate with character-limit-aware headline and description suggestions, cached until next data refresh). Gap analysis (untested creative angles, operator-assisted selling point tagging with AI suggestions). Monday morning briefing view (what changed this week, what needs immediate attention, prioritised action list). Selling point taxonomy (start manual and operator-assisted, AI-suggested labels). Cross-client pattern insights (patterns aggregating across accounts: "Urgency-driven CTAs work across 3 of your 4 clients").

**Addresses (from FEATURES.md):** AI-generated creative recommendations, gap analysis, selling point taxonomy, cross-client pattern insights, Monday morning briefing.

**Avoids (from PITFALLS.md):** Pitfall 13 downstream — use AI to suggest themes, not assert them; operator confirms. Avoid circular reasoning from recommending based on Google's already-favoured combinations (downstream of Pitfall 1 — pattern detection must use asset-level data as primary signal, not combination data).

**Uses (from STACK.md):** Vercel AI SDK, OpenAI gpt-4o-mini, `generateObject()` with Zod schemas, server-side only via API routes or Server Actions. API keys never exposed to client.

**Research flag:** HIGH — LLM prompt engineering for structured ad copy with Google Ads character limits (30-character headlines, 90-character descriptions), brand voice matching from existing top performers, and the Keep/Test/Pause/Investigate output format needs careful design and proof-of-concept testing. Recommend a dedicated research phase before Phase 5 implementation. Also verify current Vercel AI SDK API surface for structured output.

---

### Phase Ordering Rationale

- **Data before everything:** Phase 1 is non-negotiable as the foundation. Every downstream feature is blocked without correctly structured, append-only time-series data flowing in.
- **Visibility before intelligence:** Phase 2 lets the operator validate data accuracy against the Google Ads UI before analysis logic is built on top. Catching a data shape error at Phase 2 is cheap; catching it at Phase 4 is expensive.
- **Charts can be parallelised:** Phase 3 chart components can be built with fixture data while Phase 4 analysis logic is being developed. They converge when wired into pages.
- **Analysis before AI:** The LLM in Phase 5 needs verified pattern detection output as context. AI recommendations built on Phase 1-2 data alone would produce generic, low-value suggestions.
- **Append-only schema is non-negotiable in Phase 1:** Trend charts (Phase 3), fatigue detection (Phase 4), and period comparisons (Phase 2) all depend on accumulated daily snapshots. There is no backfilling this.

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 4 (RSA combination reporting):** Verify current GAQL fields for `ad_group_ad_asset_combination_view` and what data Google actually exposes. The data model design depends on knowing exactly what is available. Targeted research spike before Phase 4 schema design.
- **Phase 5 (AI recommendations):** Vercel AI SDK `generateObject()` API for constrained JSON output, prompt engineering for 30/90-character ad copy constraints, and gpt-4o-mini reliability for this specific task need hands-on proof-of-concept validation before full Phase 5 planning.

**Phases with standard patterns (skip dedicated research):**
- **Phase 1:** Neon + Drizzle + Next.js API routes + shared-secret auth are well-documented. The practical risk is data shape, not library knowledge — validate with a real Google Ads Script output sample.
- **Phase 2:** Next.js App Router dashboard with nuqs and Server Components is well-trodden territory with abundant documentation.
- **Phase 3:** Recharts with a documented design system. No novel patterns. CLAUDE.md provides complete chart rules.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Mandated technologies are certain (HIGH). Exact patch versions need npm registry verification. Major-version guidance (Next.js 14.x, React 18.x, Tailwind 3.x) is HIGH confidence. Drizzle/Neon integration patterns are MEDIUM — stable but specific API details should be confirmed. |
| Features | MEDIUM | Table stakes from first-party project documentation are HIGH confidence. Competitive feature analysis of Optmyzr/Adalysis/WordStream is MEDIUM — based on training data through May 2025; competitors may have added features. Core categorisation (table stakes vs differentiators) is stable. |
| Architecture | MEDIUM | Core patterns (Server Components, append-only snapshots, Zod at boundaries, analysis cache) are well-established — HIGH confidence on patterns. Specific Neon serverless driver API details and Vercel platform limits should be verified against current docs. Database schema design is HIGH confidence. |
| Pitfalls | HIGH | RSA combination reporting limitations, Google Ads Scripts execution limits, PMax data opacity, and statistical significance issues are extensively documented, community-verified, and have been consistent for years. Highly unlikely to have changed. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Exact npm package versions:** Run `npm info <package> version` for all dependencies before project initialisation. Major versions are reliable; patch versions need verification.
- **Real Google Ads Script output sample:** Must capture actual script output from each campaign type (RSA, PMax, Display, Video) before finalising the Zod ingestion schema. The data shape cannot be safely assumed from documentation alone.
- **Current GAQL field availability for RSA combinations:** Before Phase 4 schema design, verify which fields `ad_group_ad_asset_combination_view` exposes in the current Google Ads API. This directly determines what combination analysis is possible.
- **Vercel AI SDK structured output API:** Verify `generateObject()` API against current SDK documentation before Phase 5 design. The pattern is conceptually stable but API surface details may have evolved.
- **Vercel serverless function timeout limits by plan:** Confirm current limits (cited as 10s Hobby, 60s Pro) before choosing between synchronous inline processing and async cron-based analysis in Phase 1.
- **Vercel Postgres free tier limits:** Confirm current free tier storage (cited as 256MB) and whether Neon's serverless driver import paths have changed with recent Drizzle/Neon adapter versions.
- **Tailwind CSS version defaulting:** Confirm that `create-next-app` defaults to Tailwind 3.x or pin explicitly — Tailwind 4.x has significant API changes and should be avoided for this project.

---

## Sources

### Primary (HIGH confidence)
- `CLAUDE.md` — mandated technologies, design system (colours, chart rules, table rules, number formatting), analysis framework (tier classification, pattern recognition, underperformer diagnosis, recommendations), code style
- `PROJECT.md` — scope, constraints (single operator, no auth, no PDF export, Scripts-first ingestion), deployment target (Vercel + brentneale.au), anti-features

### Secondary (MEDIUM confidence)
- Training data: Next.js 14 App Router, Vercel platform, Neon PostgreSQL, Drizzle ORM documentation (through early 2025)
- Training data: Google Ads RSA combination reporting limitations (well-documented, stable behaviour)
- Training data: Google Ads Scripts execution limits and `UrlFetchApp` constraints (well-documented)
- Training data: PMax asset reporting opacity (widely discussed in Google Ads community through 2025)
- Training data: Recharts, Zod, date-fns, nuqs, Vercel AI SDK library documentation
- Training data: Optmyzr, Adalysis, WordStream feature sets (competitive analysis; may be stale as of 2026-03-02)

### Tertiary (LOW confidence)
- Exact current npm package versions — verify before installing
- Specific `UrlFetchApp` payload size limit (~10MB cited) — verify against current Google documentation
- Current Vercel plan pricing and function timeout limits — verify on Vercel pricing page
- Vercel Postgres/Neon free tier storage limits — verify on Neon pricing page

---

*Research completed: 2026-03-02*
*Ready for roadmap: yes*
