# Architecture Patterns

**Domain:** Google Ads Creative Analysis Platform
**Researched:** 2026-03-02
**Confidence:** MEDIUM (training data only -- web search unavailable, recommendations based on established Next.js/Vercel patterns)

## Recommended Architecture

### High-Level System Diagram

```
Google Ads Scripts (per account)
        |
        | HTTPS POST (daily, JSON payload)
        v
+---------------------------+
| Next.js API Routes        |
| /api/ingest/[accountId]   |
|  - Validate & normalise   |
|  - Write to database      |
+---------------------------+
        |
        v
+---------------------------+
| PostgreSQL (Neon/Supabase)|
|  - accounts               |
|  - creatives              |
|  - daily_snapshots        |
|  - rsa_assets             |
|  - rsa_combinations       |
|  - pmax_asset_groups      |
|  - display_creatives      |
|  - video_creatives        |
|  - analysis_cache         |
+---------------------------+
        ^
        |
+---------------------------+
| Next.js App Router        |
| Server Components         |
|  - Dashboard pages        |
|  - Analysis logic (server)|
|  - AI recommendation gen  |
+---------------------------+
        |
        v
+---------------------------+
| Client Components         |
|  - Recharts visualisations|
|  - Account selector       |
|  - Interactive filters    |
|  - Leaderboard tables     |
+---------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Runtime |
|-----------|---------------|-------------------|---------|
| **Ingestion API** (`/app/api/ingest/`) | Accept daily data push from Google Ads Scripts, validate payload schema, normalise data, write to database | Database, Google Ads Scripts (inbound) | Vercel Serverless Function |
| **Database** (PostgreSQL via Neon) | Persistent storage for all account data, creative snapshots, computed analyses | All server-side components | Managed service (Neon) |
| **Analysis Engine** (`/lib/analysis/`) | Tier classification, pattern detection, underperformer diagnosis, gap analysis, trend computation | Database (read), AI service (for recommendations) | Server Components / Serverless |
| **AI Recommendations** (`/lib/ai/`) | Generate creative copy suggestions, strategic recommendations using LLM | Analysis Engine (inputs), OpenAI API (external) | Vercel Serverless Function |
| **Dashboard Pages** (`/app/[accountId]/`) | Server-rendered pages with data fetching, layout, composition | Analysis Engine, Client Components | Server Components |
| **Chart Components** (`/components/charts/`) | Recharts-based visualisations following design system | Dashboard Pages (props) | Client Components |
| **UI Components** (`/components/ui/`) | Reusable tables, cards, selectors, navigation | Dashboard Pages, Chart Components | Client/Server mixed |
| **Google Ads Scripts** (external) | Run daily in each Google Ads account, extract creative data, POST to ingestion API | Ingestion API (outbound) | Google Ads infrastructure |

## Data Flow

### 1. Ingestion Flow (Daily, Per Account)

```
Google Ads Script (runs daily at 6am AEST per account)
  |
  | POST /api/ingest/[accountId]
  | Headers: x-api-key: [shared-secret]
  | Body: JSON { accountId, date, campaigns[], creatives[], rsaAssets[], ... }
  |
  v
Ingestion API Route
  |-- Validate x-api-key header (simple shared secret per account)
  |-- Validate payload against Zod schema
  |-- Normalise data (consistent field names, AUD currency, date formats)
  |-- Upsert account record
  |-- Insert daily snapshot (append-only -- one row per creative per day)
  |-- Insert/update RSA assets, combinations, PMax asset groups, etc.
  |-- Trigger analysis cache invalidation for this account
  |
  v
Database updated. Dashboard reads fresh data on next page load.
```

### 2. Dashboard Read Flow (On-Demand)

```
Operator opens /[accountId]/dashboard
  |
  v
Next.js Server Component
  |-- Read account config (primary KPI, date range defaults)
  |-- Fetch aggregated data from database
  |     |-- Performance overview (current period vs previous)
  |     |-- Creative leaderboards (top/bottom by primary KPI)
  |     |-- Time-series data (daily snapshots for trend charts)
  |     |-- RSA asset performance + combination data
  |     |-- PMax asset group summaries
  |     |-- Display/Video format breakdowns
  |
  v
Analysis Engine (runs server-side)
  |-- Tier classification (top 20%, middle, bottom 20%)
  |-- Pattern detection across top performers
  |-- Underperformer diagnosis
  |-- Gap analysis
  |-- Check analysis_cache -- recompute only if data changed
  |
  v
Server Component renders page shell + passes data as props
  |
  v
Client Components hydrate
  |-- Recharts renders time-series, bar charts, scatter plots
  |-- Interactive filters (date range, campaign type, KPI toggle)
  |-- Leaderboard tables with conditional formatting
```

### 3. AI Recommendation Flow (On-Demand or Background)

```
Operator clicks "Generate Recommendations" or views recommendation tab
  |
  v
API Route /api/recommendations/[accountId]
  |-- Fetch analysis results (tier data, patterns, gaps)
  |-- Construct LLM prompt with:
  |     - Top performer patterns
  |     - Underperformer diagnosis
  |     - Gap analysis results
  |     - Account context (industry, KPI focus)
  |-- Call OpenAI API (gpt-4o-mini for cost efficiency)
  |-- Parse structured response (headlines, descriptions, rationale)
  |-- Cache results in database (valid until next data refresh)
  |
  v
Return recommendations to dashboard
```

## Database Schema Design

Use PostgreSQL (via Neon) because:
- Vercel has first-class Neon integration (Neon Postgres)
- PostgreSQL handles time-series queries well with date indexes
- JSON columns for flexible creative metadata that varies by format
- Neon's serverless driver (`@neondatabase/serverless`) works in Vercel edge/serverless without connection pooling headaches

### Core Tables

```sql
-- Account registry
accounts (
  id              TEXT PRIMARY KEY,       -- Google Ads CID (xxx-xxx-xxxx)
  name            TEXT NOT NULL,
  primary_kpi     TEXT DEFAULT 'cpa',     -- 'cpa' or 'roas'
  industry        TEXT,
  api_key         TEXT NOT NULL,          -- shared secret for ingestion
  settings        JSONB DEFAULT '{}',     -- account-specific config
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)

-- Daily creative performance snapshots (append-only, core of time-series)
daily_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  account_id      TEXT REFERENCES accounts(id),
  date            DATE NOT NULL,
  campaign_id     TEXT NOT NULL,
  campaign_name   TEXT,
  campaign_type   TEXT,                   -- 'search', 'pmax', 'display', 'video'
  ad_group_id     TEXT,
  creative_id     TEXT NOT NULL,          -- ad ID or asset group ID
  creative_type   TEXT,                   -- 'rsa', 'pmax_asset_group', 'display', 'video'
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  conversions     DECIMAL(10,2) DEFAULT 0,
  cost            DECIMAL(10,2) DEFAULT 0,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  -- Computed at query time: CTR, CPA, ROAS, CVR
  metadata        JSONB DEFAULT '{}',     -- format-specific fields
  UNIQUE(account_id, date, creative_id)
)
-- Index: (account_id, date), (account_id, creative_id, date)

-- RSA-specific: asset-level performance
rsa_assets (
  id              BIGSERIAL PRIMARY KEY,
  account_id      TEXT REFERENCES accounts(id),
  campaign_id     TEXT,
  ad_group_id     TEXT,
  ad_id           TEXT NOT NULL,
  asset_type      TEXT NOT NULL,          -- 'headline' or 'description'
  asset_text      TEXT NOT NULL,
  pin_position    INTEGER,               -- NULL if unpinned
  google_rating   TEXT,                   -- 'best', 'good', 'low', 'learning', '--'
  impressions     INTEGER DEFAULT 0,
  -- Updated on each daily push (cumulative or period-based)
  last_updated    DATE,
  metadata        JSONB DEFAULT '{}',
  UNIQUE(account_id, ad_id, asset_text)
)

-- RSA-specific: combination-level performance
rsa_combinations (
  id              BIGSERIAL PRIMARY KEY,
  account_id      TEXT REFERENCES accounts(id),
  ad_id           TEXT NOT NULL,
  headline_combo  TEXT[],                 -- array of headline texts
  description_combo TEXT[],              -- array of description texts
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  conversions     DECIMAL(10,2) DEFAULT 0,
  cost            DECIMAL(10,2) DEFAULT 0,
  last_updated    DATE,
  UNIQUE(account_id, ad_id, headline_combo, description_combo)
)

-- Analysis cache (avoid recomputing on every page load)
analysis_cache (
  id              BIGSERIAL PRIMARY KEY,
  account_id      TEXT REFERENCES accounts(id),
  analysis_type   TEXT NOT NULL,          -- 'tiers', 'patterns', 'diagnosis', 'gaps'
  date_range      DATERANGE,
  result          JSONB NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL,
  data_hash       TEXT,                   -- hash of input data, invalidate when changed
  UNIQUE(account_id, analysis_type, date_range)
)

-- AI recommendation cache
recommendations (
  id              BIGSERIAL PRIMARY KEY,
  account_id      TEXT REFERENCES accounts(id),
  generated_at    TIMESTAMPTZ NOT NULL,
  input_hash      TEXT,                   -- hash of analysis inputs
  recommendations JSONB NOT NULL,         -- structured: keep[], test[], pause[], investigate[]
  ai_copy         JSONB,                  -- generated headlines/descriptions
  expires_at      TIMESTAMPTZ             -- invalidate after next data refresh
)
```

### Why Not a Simpler Database?

| Option | Verdict | Reason |
|--------|---------|--------|
| **SQLite / Turso** | Rejected | Poor fit for Vercel serverless (no persistent filesystem). Turso's edge DB is interesting but adds complexity for marginal benefit at this scale. |
| **Vercel KV (Redis)** | Rejected | Good for caching, poor for relational queries and time-series analysis. Would need awkward data modelling. |
| **Vercel Blob** | Rejected | Object storage, not queryable. Would need to load entire datasets into memory. |
| **Supabase** | Viable alternative | Also PostgreSQL, good Vercel integration. Neon preferred because Vercel's native integration is tighter and serverless-first. |
| **PlanetScale (MySQL)** | Rejected | MySQL lacks PostgreSQL's JSONB, array types, and daterange -- all useful for this schema. PlanetScale also sunset free tier. |

## Patterns to Follow

### Pattern 1: Server Components as Data Layer

**What:** Use Next.js Server Components for all data fetching. No client-side data fetching for initial page loads. Pass pre-computed data to Client Components as serialisable props.

**When:** Every dashboard page, every analysis view.

**Why:** Eliminates waterfall requests, keeps database credentials server-side, reduces client bundle size. The operator's Monday morning dashboard load should be a single server render that fetches everything in parallel.

**Example:**
```typescript
// app/[accountId]/dashboard/page.tsx (Server Component)
export default async function DashboardPage({
  params,
}: {
  params: { accountId: string }
}) {
  const [overview, leaderboard, trends] = await Promise.all([
    getPerformanceOverview(params.accountId),
    getCreativeLeaderboard(params.accountId),
    getTrendData(params.accountId),
  ])

  return (
    <div>
      <PerformanceOverview data={overview} />
      <CreativeLeaderboard data={leaderboard} />
      <TrendCharts data={trends} />  {/* Client Component */}
    </div>
  )
}
```

### Pattern 2: Append-Only Snapshots for Time-Series

**What:** Store one row per creative per day in `daily_snapshots`. Never update past rows. Compute derived metrics (CTR, CPA, ROAS) at query time or in the analysis engine.

**When:** Every data ingestion event.

**Why:** Enables arbitrary date range queries, period-over-period comparisons, and trend analysis without data loss. Append-only is simpler to reason about and debug. At 3-10 accounts with maybe 50-200 creatives each, this produces ~500-2000 rows per day, entirely manageable.

**Storage estimate:** 2000 rows/day * 365 days * ~500 bytes/row = ~365MB/year. Well within Neon free/starter tier.

### Pattern 3: Shared Secret API Key Authentication for Ingestion

**What:** Each account gets a unique API key (UUID). Google Ads Script includes this in `x-api-key` header. Ingestion endpoint validates before processing.

**When:** Every inbound data push.

**Why:** Google Ads Scripts cannot perform OAuth flows. A shared secret is the pragmatic choice for a single-operator system where the operator controls both the scripts and the app. Store keys hashed in database, check on each request. Rotate if compromised.

**Example:**
```typescript
// app/api/ingest/[accountId]/route.ts
export async function POST(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 401 })

  const account = await getAccount(params.accountId)
  if (!account || !verifyApiKey(apiKey, account.apiKeyHash)) {
    return Response.json({ error: 'Invalid API key' }, { status: 403 })
  }

  const body = await request.json()
  const validated = ingestPayloadSchema.safeParse(body)
  if (!validated.success) {
    return Response.json({ error: validated.error.issues }, { status: 400 })
  }

  await processIngestion(params.accountId, validated.data)
  return Response.json({ status: 'ok', rows: validated.data.creatives.length })
}
```

### Pattern 4: Analysis Cache with Hash Invalidation

**What:** Compute analysis results (tier classification, patterns, etc.) once, cache in database. Invalidate when new data arrives by comparing a hash of the input data.

**When:** Any analysis computation that takes more than a few milliseconds or requires scanning many rows.

**Why:** Pattern detection and tier classification scan the full creative portfolio. Caching avoids recomputing on every page load. Hash-based invalidation ensures freshness without complex invalidation logic -- when the daily push arrives, the hash changes, next dashboard load recomputes.

### Pattern 5: Zod Schemas as Contract Between Scripts and API

**What:** Define strict Zod schemas for the ingestion payload. The Google Ads Script output format and the API route validation use the same schema definition. Type errors at the boundary, not deep in analysis code.

**When:** Every ingestion endpoint.

**Why:** Google Ads Scripts are JavaScript, not TypeScript. The boundary between the script and the app is the most likely place for data format mismatches. Strict validation catches issues immediately with clear error messages, rather than corrupt data silently breaking charts later.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Data Fetching for Dashboard

**What:** Using `useEffect` + `fetch` to load dashboard data in Client Components.

**Why bad:** Creates loading spinners on every page load, waterfall requests, exposes API routes unnecessarily, increases client bundle with data fetching libraries. The operator opens this Monday morning -- it should render fast.

**Instead:** Server Components fetch data, pass as props. Use Suspense boundaries for progressive loading if needed.

### Anti-Pattern 2: Storing Data in Vercel Blob/KV as Primary Store

**What:** Using Vercel's key-value or blob storage as the primary data store instead of a relational database.

**Why bad:** KV has no query capabilities beyond key lookup. Blob requires loading entire files into memory. Neither supports the kind of date-range filtering, aggregation, and joining this system needs. You end up building a bad database on top of a good cache.

**Instead:** PostgreSQL (Neon) as primary store. KV only if you need sub-millisecond caching for hot paths (unlikely at this scale).

### Anti-Pattern 3: One Giant Google Ads Script Payload

**What:** Having the Google Ads Script export everything -- every campaign, every creative, every asset, every combination -- in a single massive JSON payload.

**Why bad:** Vercel serverless functions have a 4.5MB request body limit (on the Hobby plan). Large accounts could exceed this. Also, a single failed request loses all data for the day.

**Instead:** Structure the script to send data in sections: one request for campaign/creative snapshots, one for RSA assets, one for RSA combinations, etc. Or chunk by campaign. Each request is smaller, more resilient, and easier to debug.

### Anti-Pattern 4: Computing Derived Metrics at Ingestion Time

**What:** Calculating CTR, CPA, ROAS at ingestion time and storing them in the snapshot.

**Why bad:** These metrics depend on the aggregation period. CTR for a single day is different from CTR over 30 days. Storing pre-computed metrics locks you into one time window and forces recomputation when the user changes date ranges.

**Instead:** Store raw metrics (impressions, clicks, conversions, cost, conversion_value). Compute derived metrics at query time: `CTR = SUM(clicks) / SUM(impressions)` for any date range. The scale (a few thousand rows) makes this instantaneous.

### Anti-Pattern 5: Premature Multi-Tenancy Architecture

**What:** Building a full multi-tenant system with row-level security, tenant isolation middleware, and tenant-aware connection pooling.

**Why bad:** This is a single-operator tool managing 3-10 accounts. Account-level data separation via `account_id` foreign keys with WHERE clauses is sufficient. Full multi-tenancy adds weeks of complexity for zero user benefit.

**Instead:** Simple `account_id` filtering on all queries. If the system ever needs true multi-tenancy (multiple operators), that is a future architectural decision.

## Suggested Directory Structure

```
/app
  /layout.tsx                       -- Root layout, navigation shell
  /page.tsx                         -- Home: account selector / overview
  /[accountId]
    /layout.tsx                     -- Account-scoped layout (sidebar, account header)
    /dashboard/page.tsx             -- Performance overview dashboard
    /creatives/page.tsx             -- Creative leaderboard (all types)
    /rsa/page.tsx                   -- RSA asset + combination analysis
    /pmax/page.tsx                  -- PMax asset group analysis
    /display/page.tsx               -- Display/Demand Gen format analysis
    /video/page.tsx                 -- Video creative analysis
    /patterns/page.tsx              -- Cross-portfolio pattern detection
    /recommendations/page.tsx       -- AI recommendations + Keep/Test/Pause/Investigate
  /api
    /ingest/[accountId]/route.ts    -- Data ingestion endpoint
    /recommendations/[accountId]/route.ts  -- AI recommendation generation
    /accounts/route.ts              -- Account management

/components
  /ui
    /AccountSelector.tsx
    /DataTable.tsx                  -- Reusable table with sorting, conditional formatting
    /MetricCard.tsx                 -- Single KPI display card
    /PerformanceBadge.tsx           -- Top/Middle/Bottom tier badge
    /DateRangePicker.tsx
    /Navigation.tsx
  /charts
    /TrendLineChart.tsx             -- Time-series line chart
    /CreativeBarChart.tsx           -- Horizontal bar chart for creative comparisons
    /ScatterPlot.tsx                -- CTR vs CVR or similar
    /HeatmapChart.tsx               -- Day-of-week or format performance
    /PerformanceOverview.tsx        -- Multi-metric summary visualisation

/lib
  /db
    /client.ts                      -- Neon database client setup
    /queries.ts                     -- Parameterised SQL queries
    /schema.ts                      -- Drizzle ORM schema definitions
  /analysis
    /tiers.ts                       -- Performance tier classification
    /patterns.ts                    -- Pattern detection across top performers
    /diagnosis.ts                   -- Underperformer diagnosis
    /gaps.ts                        -- Gap analysis (untested angles)
    /trends.ts                      -- Time-series trend computation
    /cache.ts                       -- Analysis cache management
  /parsers
    /ingestSchema.ts                -- Zod schemas for ingestion payloads
    /normalise.ts                   -- Data normalisation utilities
  /ai
    /recommendations.ts             -- LLM prompt construction + response parsing
    /prompts.ts                     -- Prompt templates
  /constants
    /colours.ts                     -- Design system colour palette
    /chartConfig.ts                 -- Default chart configurations
    /formatting.ts                  -- AUD currency, percentage formatting
  /utils
    /metrics.ts                     -- CTR, CPA, ROAS, CVR computation
    /dates.ts                       -- Date range helpers, period comparison

/public
  /favicon.ico
```

## Build Order (Dependencies)

The system has clear dependency chains that dictate build order:

```
Phase 1: Foundation
  Database schema + Neon setup
  Ingestion API endpoint
  Google Ads Script (at least one account)
  -----> Data flows in. Nothing else works without data.

Phase 2: Core Dashboard
  Account selector + routing
  Performance overview (metrics cards, basic table)
  Creative leaderboard (sorted table with tier badges)
  -----> Depends on: Phase 1 (needs data to display)

Phase 3: Visualisation
  Time-series trend charts
  Creative comparison bar charts
  -----> Depends on: Phase 2 (pages exist to embed charts in)

Phase 4: Deep Analysis
  RSA asset-level + combination analysis
  PMax asset group analysis
  Display format analysis
  Video creative analysis
  Pattern detection engine
  Underperformer diagnosis
  -----> Depends on: Phase 1 (data), Phase 2 (display framework)
         Can partially parallel with Phase 3

Phase 5: Intelligence
  Gap analysis
  AI recommendation generation
  Keep/Test/Pause/Investigate framework
  -----> Depends on: Phase 4 (analysis results feed recommendations)
```

### Critical Path

The longest dependency chain is: **Database -> Ingestion -> Dashboard -> Analysis -> AI Recommendations**. Each phase unlocks the next. The Google Ads Script and the ingestion API are the foundation everything else depends on -- if the script does not push data correctly, nothing downstream works.

### Parallelisation Opportunities

- **Chart components** can be built as standalone components with mock data while waiting for real data pipeline
- **Analysis algorithms** (tier classification, pattern detection) can be developed and tested with fixture data independently of the UI
- **Design system components** (tables, cards, badges) can be built once and reused across all pages

## Scalability Considerations

| Concern | At 3 accounts | At 10 accounts | At 50 accounts (future) |
|---------|---------------|----------------|-------------------------|
| **Data volume** | ~200 rows/day, trivial | ~2000 rows/day, still trivial | ~10K rows/day, may need partitioning by account or date |
| **Query performance** | No optimisation needed | Index on (account_id, date) sufficient | May need materialised views for aggregations |
| **Ingestion** | Single serverless function handles it | Same, scripts run at staggered times | May need queue (but unlikely) |
| **Vercel costs** | Free tier sufficient | Hobby plan likely sufficient | Pro plan, possibly need dedicated compute |
| **Database size** | <100MB/year | <500MB/year | 2-5GB/year, Neon starter handles this |
| **AI costs** | Negligible (on-demand) | ~$5-10/month if daily recommendations | May need caching strategy, batch generation |

**Bottom line:** At 3-10 accounts, this system is firmly in "small data" territory. Do not over-engineer for scale. A single PostgreSQL database with good indexes and the Neon serverless driver handles everything comfortably. The architecture should optimise for developer speed and clarity, not throughput.

## Technology Decisions Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | Per project constraints. Server Components are ideal for this read-heavy dashboard. |
| **Database** | PostgreSQL via Neon | Vercel-native integration, serverless driver, JSONB for flexible metadata, good time-series query support. |
| **ORM** | Drizzle ORM | Lightweight, TypeScript-first, excellent Neon integration, does not hide SQL. Preferred over Prisma for performance and bundle size on Vercel. |
| **Validation** | Zod | Runtime schema validation for ingestion payloads, tight TypeScript integration. |
| **Charts** | Recharts | Per project constraints. Sufficient for bar, line, scatter charts needed. |
| **Styling** | Tailwind CSS | Per project constraints. |
| **AI** | OpenAI API (gpt-4o-mini) | Cost-effective for generating creative copy. Structured output mode for reliable JSON responses. |
| **Auth (ingestion)** | Shared secret API keys | Simplest option for single-operator system with Google Ads Scripts. |
| **Auth (dashboard)** | None for v1 | Single operator, per project constraints. Add NextAuth later if needed. |

## Sources

- Next.js App Router documentation (training data, MEDIUM confidence)
- Neon serverless PostgreSQL documentation (training data, MEDIUM confidence)
- Drizzle ORM documentation (training data, MEDIUM confidence)
- Vercel platform limits and integration documentation (training data, MEDIUM confidence)
- Google Ads Scripts documentation (training data, MEDIUM confidence)
- Project CLAUDE.md and PROJECT.md (direct source, HIGH confidence)

**Note:** Web search was unavailable during this research session. All recommendations are based on training data (cutoff May 2025) and the project's own documentation. Specific version numbers and pricing should be verified against current documentation before implementation. The core architectural patterns (Server Components for data fetching, PostgreSQL for time-series, append-only snapshots, Zod validation at boundaries) are well-established and unlikely to have changed.
