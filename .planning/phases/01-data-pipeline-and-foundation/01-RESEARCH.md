# Phase 1: Data Pipeline and Foundation - Research

**Researched:** 2026-03-02
**Domain:** Data ingestion API, time-series storage, Google Ads Scripts, Next.js scaffold, Tailwind design system
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Capture all four campaign types from day 1: RSA, PMax, Display, Video
- Daily push frequency via Google Ads scheduled trigger
- Project generates a ready-to-deploy Google Ads Script (user copy-pastes into Google Ads)
- Script is part of this codebase, maintained alongside the app
- Auto-register on first data push -- no pre-registration or config needed
- Account identified by Google Ads Customer ID (xxx-xxx-xxxx) plus a display name sent with the first push
- Primary KPI defaults to CPA per account, changeable later in the app (Phase 2+)
- Single operator (Brent) -- no login or auth system for the app itself in v1
- API key per account for Script authentication (included in request headers)
- Duplicate pushes for the same account+date overwrite silently -- handles Script re-runs gracefully
- Detailed field-level validation errors returned on malformed payloads
- Basic sync log: last 10 pushes per account with timestamp, record count, success/failure status -- visible in app
- Setup guide shown on first load (no data state): "Welcome to Creative Analyser" with steps to set up Script and push first data, showing connection status
- Minimal/unbranded for v1 -- no prominent branding, just clean and functional
- Left sidebar navigation with sections: Dashboard, RSA Analysis, PMax, Display, Video, Settings -- sections activate as phases ship
- Linear-style aesthetic: clean, modern SaaS feel, minimal chrome, focus on data

### Claude's Discretion
- Exact data fields per campaign type (informed by downstream analysis requirements)
- Database/storage technology choice (Vercel-compatible)
- API route structure and endpoint design
- Script deployment instructions format
- Sidebar section naming and iconography
- Loading states and transition animations

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Google Ads Script pushes creative performance data daily to app API endpoint | Google Ads Scripts UrlFetchApp POST with JSON, GAQL queries for all 4 campaign types, Next.js App Router route handlers |
| DATA-02 | App supports 3-10 Google Ads accounts with isolated data per account | Neon Postgres with account_id column isolation, Drizzle ORM schema with composite keys |
| DATA-03 | Ingestion API validates incoming data schema and rejects malformed payloads | Zod validation via drizzle-orm/zod createInsertSchema, field-level error reporting |
| DATA-04 | App displays data freshness indicator per account (last synced timestamp) | accounts table with last_synced_at timestamp, sync_log table for push history |
| DATA-05 | Append-only time-series storage enables date-range queries and period comparisons | Postgres tables with date column + composite unique constraints for upsert-on-duplicate behaviour |
| DASH-06 | All numbers formatted for AU locale (AUD $1,234.56, percentages to 1dp, K/M shorthand in charts) | Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'}) plus utility functions |
| DASH-07 | Layout is responsive and usable on laptop and tablet | Tailwind responsive prefixes (md:, lg:), sidebar layout pattern |
| VIS-03 | Design system compliance (colour palette, chart rules, table rules per CLAUDE.md) | Tailwind v3 config extending theme.colors with CLAUDE.md palette |

</phase_requirements>

## Summary

This phase establishes the full data pipeline from Google Ads accounts to the application database, plus the Next.js project scaffold with design system. The core technical challenge is building a Google Ads Script that queries performance data across four campaign types (RSA, PMax, Display, Video) using GAQL and POSTs it to a Next.js API route, which validates, normalises, and stores it in Neon Postgres as append-only time-series data.

The database choice is Neon Postgres via the Vercel Marketplace (Vercel's own Postgres offering was sunsetted and replaced by Neon in Q4 2024). Drizzle ORM provides the schema layer with built-in Zod validation generation. The schema uses composite unique constraints (account_id + date + entity identifiers) to support the "duplicate push overwrites silently" requirement via Postgres ON CONFLICT upsert.

The app scaffold uses Next.js 14 App Router with Tailwind CSS v3 (the default with create-next-app). The design system colours from CLAUDE.md are configured as custom Tailwind theme extensions. AU locale formatting uses native Intl.NumberFormat with a small utility library.

**Primary recommendation:** Use Neon Postgres + Drizzle ORM for storage, with a single POST endpoint that accepts batched daily snapshots per campaign type, validated by Zod schemas generated from Drizzle table definitions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14 (App Router) | Framework, API routes, rendering | Per CLAUDE.md, locked decision |
| Tailwind CSS | 3.4.x | Styling, design system | Default with Next.js 14 create-next-app |
| TypeScript | 5.x | Type safety | Per CLAUDE.md |
| Drizzle ORM | 0.33+ | Database schema, queries, migrations | Type-safe, built-in Zod integration, lightweight, Neon-native |
| @neondatabase/serverless | latest | Neon Postgres driver | HTTP-based, serverless-optimised for Vercel |
| Zod | 3.x | Runtime validation | Built into Drizzle ORM schema generation, industry standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | latest | Schema migrations CLI | Development: generate and push migrations |
| dotenv | latest | Environment variables | Local development only (Vercel handles prod) |
| nanoid | 5.x | API key generation | One-time account setup: generate secure API keys |
| lucide-react | latest | Icons | Sidebar navigation icons, status indicators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma is heavier, slower cold starts on serverless, less Neon-optimised |
| Neon Postgres | Supabase | Supabase has more features but adds complexity; Neon is Vercel's default Postgres partner |
| Neon Postgres | Vercel KV (Redis) | KV lacks relational queries needed for date-range filtering and joins |
| nanoid | crypto.randomUUID | nanoid produces shorter, URL-safe keys; either works |

**Installation:**
```bash
npx create-next-app@14 google-ads-analyser --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install drizzle-orm @neondatabase/serverless zod nanoid lucide-react
npm install -D drizzle-kit dotenv
```

## Architecture Patterns

### Recommended Project Structure
```
/app
  /api
    /ingest/route.ts          # POST: receive data from Google Ads Script
    /accounts/route.ts        # GET: list accounts with sync status
    /accounts/[id]/route.ts   # GET: single account details
  /layout.tsx                 # Root layout with sidebar
  /page.tsx                   # Home/setup guide (empty state)
  /settings/page.tsx          # Settings placeholder
/components
  /ui/                        # Reusable UI: Button, Card, Badge, etc.
  /layout/
    Sidebar.tsx               # Left sidebar navigation
    AppShell.tsx              # Main layout wrapper
/lib
  /db/
    index.ts                  # Drizzle client initialisation
    schema.ts                 # All Drizzle table definitions
    migrations/               # Generated migration files
  /validation/
    ingestionSchema.ts        # Zod schemas for API validation
  /constants/
    colours.ts                # Design system colour tokens
    formatting.ts             # AU locale number formatters
  /utils/
    apiKey.ts                 # API key generation and validation
/scripts
  /google-ads/
    creative-analyser.js      # The Google Ads Script (copy-paste ready)
    README.md                 # Setup instructions for the Script
/drizzle.config.ts            # Drizzle Kit configuration
```

### Pattern 1: Next.js App Router API Route with Zod Validation
**What:** POST route handler that parses JSON body, validates with Zod, returns typed errors
**When to use:** Every API endpoint that accepts external data

```typescript
// Source: Next.js docs + Drizzle/Zod docs
// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ingestionSchema } from '@/lib/validation/ingestionSchema';

export async function POST(request: NextRequest) {
  // Authenticate via API key header
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key', details: [] },
      { status: 401 }
    );
  }

  // Parse and validate body
  const body = await request.json();
  const result = ingestionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: result.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  // Process validated data...
  return NextResponse.json({ status: 'ok', recordCount: result.data.records.length });
}
```

### Pattern 2: Drizzle Schema with Composite Unique for Upsert
**What:** Append-only tables with date-based deduplication using ON CONFLICT
**When to use:** All performance data tables

```typescript
// Source: Drizzle ORM docs
// lib/db/schema.ts
import { pgTable, text, integer, real, date, timestamp, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),                    // Google Ads Customer ID (xxx-xxx-xxxx)
  displayName: text('display_name').notNull(),
  apiKey: text('api_key').notNull().unique(),
  primaryKpi: text('primary_kpi').notNull().default('cpa'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rsaPerformance = pgTable('rsa_performance', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  date: date('date').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  adGroupId: text('ad_group_id').notNull(),
  adGroupName: text('ad_group_name').notNull(),
  adId: text('ad_id').notNull(),
  adStrength: text('ad_strength'),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  costMicros: integer('cost_micros').notNull().default(0),
  conversions: real('conversions').notNull().default(0),
  conversionsValue: real('conversions_value').notNull().default(0),
  // ... additional fields
}, (table) => [
  uniqueIndex('rsa_perf_unique').on(table.accountId, table.date, table.adId),
]);
```

### Pattern 3: Google Ads Script with UrlFetchApp POST
**What:** Script that runs GAQL queries and POSTs results to the app API
**When to use:** The single Google Ads Script that users copy-paste

```javascript
// Source: Google Ads Scripts docs
// scripts/google-ads/creative-analyser.js
const CONFIG = {
  API_ENDPOINT: 'https://your-app.vercel.app/api/ingest',
  API_KEY: 'YOUR_API_KEY_HERE',
  DATE_RANGE: 'YESTERDAY',
};

function main() {
  const customerId = AdsApp.currentAccount().getCustomerId();
  const accountName = AdsApp.currentAccount().getName();
  const today = Utilities.formatDate(new Date(), AdsApp.currentAccount().getTimeZone(), 'yyyy-MM-dd');

  const data = {
    accountId: customerId,
    accountName: accountName,
    date: today,
    rsa: queryRsaPerformance(),
    pmax: queryPmaxPerformance(),
    display: queryDisplayPerformance(),
    video: queryVideoPerformance(),
  };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'x-api-key': CONFIG.API_KEY },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);
  const responseCode = response.getResponseCode();

  if (responseCode >= 400) {
    Logger.log('ERROR: ' + response.getContentText());
  } else {
    Logger.log('SUCCESS: Data pushed for ' + customerId);
  }
}

function queryRsaPerformance() {
  const query = `
    SELECT
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad_strength,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value
    FROM ad_group_ad
    WHERE campaign.advertising_channel_type = 'SEARCH'
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      AND segments.date DURING ${CONFIG.DATE_RANGE}
  `;
  return collectSearchResults(query);
}
```

### Pattern 4: Neon Postgres Connection (Serverless HTTP)
**What:** Single database client module for Vercel serverless functions
**When to use:** All database operations

```typescript
// Source: Drizzle ORM + Neon docs
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

### Anti-Patterns to Avoid
- **Importing db client at top level in client components:** The database module must only be imported in server-side code (API routes, server components). Never import in client components.
- **Using WebSocket driver for simple queries:** The neon-http driver is correct for Vercel serverless. WebSocket driver is for long-running connections (not needed here).
- **Storing cost as float:** Google Ads returns cost_micros (integer, millionths of currency unit). Store as integer, convert to dollars only at display time.
- **Creating one API route per campaign type:** Use a single /api/ingest endpoint that accepts all campaign types in one payload. This simplifies the Google Ads Script (one HTTP call per execution).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL query builder | Raw SQL strings | Drizzle ORM | Type safety, SQL injection prevention, migration management |
| Schema validation | Manual field checks | Zod (via drizzle-orm/zod) | Handles nested objects, arrays, type coercion, detailed error messages |
| Database migrations | Manual ALTER TABLE | drizzle-kit push/generate | Tracks schema changes, handles rollbacks, generates SQL |
| API key generation | Math.random strings | nanoid | Cryptographically secure, collision-resistant, URL-safe |
| Date formatting | Custom date parsers | date-fns or native Date | Timezone handling, date arithmetic edge cases |
| Number formatting | Custom formatters | Intl.NumberFormat | Handles locale-specific thousands separators, currency symbols, decimal places |
| Postgres connection pooling | Manual pool management | Neon serverless driver | Handles connection lifecycle in serverless automatically |

**Key insight:** The Neon serverless driver + Drizzle ORM combination eliminates the entire class of problems around database connections in serverless environments (cold starts, connection limits, pool exhaustion). Do not try to manage connections manually.

## Common Pitfalls

### Pitfall 1: Google Ads Scripts Execution Time Limit
**What goes wrong:** Scripts have a 30-minute execution limit. Querying all 4 campaign types with complex GAQL across large accounts can approach this.
**Why it happens:** Each AdsApp.search() call is a network round-trip to Google's API. Large accounts with thousands of ads multiply this.
**How to avoid:** Keep GAQL queries lean (only needed fields). Use pagination-aware iteration. Consider splitting into separate script executions if needed (one per campaign type, staggered by 15 min).
**Warning signs:** Script timeout errors in Google Ads Script logs.

### Pitfall 2: Vercel Serverless Function Payload Size
**What goes wrong:** Vercel serverless functions have a 4.5MB request body limit (on Hobby plan). A large account pushing all campaign types in one payload could exceed this.
**Why it happens:** RSA data includes full headline/description text for every ad, and PMax includes image URLs.
**How to avoid:** The Google Ads Script should send only text data (not images). Image URLs can be stored but actual images are not transferred. For very large accounts, chunk payloads by campaign type.
**Warning signs:** 413 Payload Too Large errors from Vercel.

### Pitfall 3: Neon Cold Start on Free Tier
**What goes wrong:** Neon free tier scales to zero after 5 minutes of inactivity. First query after cold start adds 500ms-2s latency.
**Why it happens:** Serverless database scaling. The compute node needs to wake up.
**How to avoid:** Acceptable for this use case (daily batch ingestion, not real-time). The API response will be slightly slower on first hit but the Script doesn't care about 2s latency. For the web UI, consider a lightweight health-check query on page load.
**Warning signs:** Intermittent slow responses on first request after idle period.

### Pitfall 4: cost_micros Integer Overflow
**What goes wrong:** Google Ads returns cost in micros (millionths of currency unit). $1,000 = 1,000,000,000 micros. Large accounts could have daily costs exceeding 2^31 (2.1 billion micros = ~$2,100).
**Why it happens:** Using integer (32-bit) instead of bigint for cost_micros.
**How to avoid:** Use `bigint` type in Drizzle schema for cost_micros columns, or use `real`/`numeric` and convert from micros at ingestion time. Given accounts are AU-based SMBs, regular `integer` is likely fine (max ~$2,147 per day per entity), but `bigint` is safer.
**Warning signs:** Negative cost values appearing in the database.

### Pitfall 5: GAQL Date Range Timezone Mismatch
**What goes wrong:** The Script runs in the Google Ads account timezone, but YESTERDAY in GAQL is relative to that timezone. If the Script runs at midnight, "yesterday" might not have complete data.
**Why it happens:** Google Ads stats can be delayed up to 3 hours.
**How to avoid:** Schedule the Script to run at 3am or later in the account timezone. Document this in the Script README.
**Warning signs:** Missing or low impression counts for the most recent day.

### Pitfall 6: Tailwind Purge Removing Custom Colours
**What goes wrong:** Custom colour classes defined in tailwind.config.ts but used dynamically (e.g., template literals) get purged in production builds.
**Why it happens:** Tailwind's JIT compiler can only detect class names that appear as complete strings in source files.
**How to avoid:** Always use complete class names (e.g., `bg-brand-blue`) never dynamic construction (e.g., `bg-brand-${colour}`). Use a safelist for any programmatically-generated classes.
**Warning signs:** Styles present in dev but missing in production build.

## Code Examples

Verified patterns from official sources:

### AU Locale Number Formatting Utilities
```typescript
// Source: MDN Intl.NumberFormat docs
// lib/constants/formatting.ts

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-AU').format(value);
};

export const formatNumberCompact = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};
```

### Tailwind Design System Colour Configuration
```typescript
// Source: Tailwind CSS v3 docs
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1A73E8',
          green: '#34A853',
          red: '#EA4335',
          grey: '#9AA0A6',
          amber: '#FBBC04',
        },
        surface: {
          background: '#F8F9FA',
          gridline: '#E8EAED',
          'table-header': '#F1F3F4',
          'row-positive': '#E6F4EA',
          'row-negative': '#FCE8E6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Drizzle Upsert Pattern for Append-Only with Dedup
```typescript
// Source: Drizzle ORM docs
// lib/db/operations.ts
import { db } from './index';
import { rsaPerformance } from './schema';
import { sql } from 'drizzle-orm';

export async function upsertRsaPerformance(records: typeof rsaPerformance.$inferInsert[]) {
  await db.insert(rsaPerformance)
    .values(records)
    .onConflictDoUpdate({
      target: [rsaPerformance.accountId, rsaPerformance.date, rsaPerformance.adId],
      set: {
        impressions: sql`excluded.impressions`,
        clicks: sql`excluded.clicks`,
        costMicros: sql`excluded.cost_micros`,
        conversions: sql`excluded.conversions`,
        conversionsValue: sql`excluded.conversions_value`,
        campaignName: sql`excluded.campaign_name`,
        adGroupName: sql`excluded.ad_group_name`,
      },
    });
}
```

### Google Ads Script GAQL Query Functions
```javascript
// Source: Google Ads Scripts docs + Google Ads API fields reference
// scripts/google-ads/creative-analyser.js

function collectSearchResults(query) {
  const results = [];
  const search = AdsApp.search(query);
  while (search.hasNext()) {
    const row = search.next();
    results.push(row);
  }
  return results;
}

function queryRsaPerformance() {
  const query = `
    SELECT
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad_strength,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value
    FROM ad_group_ad
    WHERE campaign.advertising_channel_type = 'SEARCH'
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      AND metrics.impressions > 0
      AND segments.date DURING ${CONFIG.DATE_RANGE}
  `;
  return collectSearchResults(query);
}

function queryRsaAssetPerformance() {
  const query = `
    SELECT
      ad_group_ad_asset_view.ad_group_ad,
      ad_group_ad_asset_view.asset,
      ad_group_ad_asset_view.field_type,
      ad_group_ad_asset_view.performance_label,
      metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions
    FROM ad_group_ad_asset_view
    WHERE segments.date DURING ${CONFIG.DATE_RANGE}
  `;
  return collectSearchResults(query);
}

function queryPmaxPerformance() {
  const query = `
    SELECT
      campaign.id, campaign.name,
      asset_group.id, asset_group.name,
      asset_group_asset.field_type,
      asset_group_asset.performance_label,
      asset.type, asset.text_asset.text,
      asset.image_asset.full_size.url,
      asset.youtube_video_asset.youtube_video_id
    FROM asset_group_asset
    WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
      AND asset_group_asset.status = 'ENABLED'
  `;
  return collectSearchResults(query);
}

function queryVideoPerformance() {
  const query = `
    SELECT
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id, ad_group_ad.ad.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value,
      metrics.video_views, metrics.video_view_rate,
      metrics.video_quartile_p25_rate, metrics.video_quartile_p50_rate,
      metrics.video_quartile_p75_rate, metrics.video_quartile_p100_rate,
      metrics.average_cpv
    FROM ad_group_ad
    WHERE campaign.advertising_channel_type = 'VIDEO'
      AND metrics.impressions > 0
      AND segments.date DURING ${CONFIG.DATE_RANGE}
  `;
  return collectSearchResults(query);
}

function queryDisplayPerformance() {
  const query = `
    SELECT
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id, ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value
    FROM ad_group_ad
    WHERE campaign.advertising_channel_type IN ('DISPLAY', 'DEMAND_GEN')
      AND metrics.impressions > 0
      AND segments.date DURING ${CONFIG.DATE_RANGE}
  `;
  return collectSearchResults(query);
}
```

## Data Schema Design

### Recommended Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `accounts` | Account registry | id (Customer ID), display_name, api_key, primary_kpi, last_synced_at |
| `sync_log` | Push audit trail | account_id, timestamp, record_count, status, error_message |
| `rsa_daily` | RSA ad-level daily snapshots | account_id, date, campaign_id, ad_group_id, ad_id, headlines (jsonb), descriptions (jsonb), ad_strength, impressions, clicks, cost_micros, conversions, conversions_value |
| `rsa_asset_daily` | RSA individual asset daily performance | account_id, date, ad_id, asset_resource, field_type, performance_label, impressions, clicks, cost_micros, conversions |
| `pmax_asset_group_daily` | PMax asset group daily snapshots | account_id, date, campaign_id, asset_group_id, asset_group_name, plus metrics |
| `pmax_asset_daily` | PMax individual asset data | account_id, date, asset_group_id, asset_type, field_type, text/url, performance_label |
| `display_daily` | Display/Demand Gen ad-level daily snapshots | account_id, date, campaign_id, ad_group_id, ad_id, ad_type, impressions, clicks, cost_micros, conversions, conversions_value |
| `video_daily` | Video ad-level daily snapshots | account_id, date, campaign_id, ad_group_id, ad_id, all standard metrics plus video_views, video_view_rate, average_cpv, quartile rates |

### Design Principles
- **Append-only by date:** Each row is a daily snapshot. New dates create new rows. Same date overwrites via upsert.
- **Account isolation:** Every table has account_id. All queries filter by account_id.
- **Denormalised campaign/ad group names:** Stored alongside IDs for query simplicity. Names can change; IDs are stable identifiers.
- **JSONB for RSA assets:** Headlines and descriptions are arrays of objects with text + pinned position. JSONB preserves structure without excessive normalisation.
- **Composite unique indexes:** (account_id, date, entity_id) on every performance table for upsert deduplication.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @vercel/postgres SDK | @neondatabase/serverless driver | Q4 2024 | Vercel Postgres sunsetted; Neon is now the Vercel Marketplace Postgres provider |
| drizzle-zod package | drizzle-orm/zod built-in | drizzle-orm 0.33+ | Zod schema generation moved into core Drizzle ORM; no separate package needed |
| Tailwind CSS v4 (@theme in CSS) | Tailwind CSS v3 (tailwind.config.ts) | v4 released Jan 2025 | Next.js 14 create-next-app defaults to v3; use v3 config approach |
| AdsApp.report() for GAQL | AdsApp.search() for GAQL | Ongoing | search() returns typed objects with dot notation; report() returns flat dictionary. Prefer search() for programmatic processing |
| AdWords scripts API (AWQL) | Google Ads scripts (GAQL) | 2020+ | AWQL is legacy. Always use GAQL syntax |

**Deprecated/outdated:**
- `@vercel/postgres`: Sunsetted. Use `@neondatabase/serverless` directly.
- `drizzle-zod` package: Deprecated from v0.33.0. Use `drizzle-orm/zod` instead.
- AWQL (AdWords Query Language): Legacy. Use GAQL.

## Open Questions

1. **Exact RSA combination data availability from Scripts**
   - What we know: `ad_group_ad_asset_view` provides individual asset metrics (impressions, clicks, cost, conversions) and performance_label (BEST/GOOD/LOW/LEARNING/PENDING). RSA headlines/descriptions are returned as arrays in `ad_group_ad.ad.responsive_search_ad.headlines`.
   - What's unclear: Whether combination-level data (which headline+description pairings were served together and their joint metrics) is queryable from Scripts. The Google Ads UI shows "top combinations" but this may only have impressions, not conversions.
   - Recommendation: Capture what's available now (individual asset performance + ad-level aggregate metrics). Combination analysis in Phase 3 may need to work with directional data (impressions-only for combinations, full metrics for individual assets). Flag as "directional only" per CLAUDE.md guidance.

2. **PMax asset-level metrics granularity**
   - What we know: `asset_group_asset` provides `performance_label` per asset but NOT granular metrics (impressions/clicks/conversions per asset). Campaign-level `segments.asset_interaction_target` can provide some asset-specific metrics but with limitations.
   - What's unclear: Whether the PMax asset performance script pattern (using `segments.asset_interaction_target`) returns reliable per-asset metrics or only aggregate data.
   - Recommendation: Capture performance_label (BEST/GOOD/LOW) for PMax assets, plus aggregate metrics at asset_group level. This matches how Google intends PMax data to be consumed.

3. **Display ad format detection from GAQL**
   - What we know: Display ads have a `type` field (RESPONSIVE_DISPLAY_AD, IMAGE_AD, etc.) and image assets have dimensions.
   - What's unclear: Whether format (square vs landscape vs portrait) can be determined from GAQL fields or requires separate asset metadata queries.
   - Recommendation: Capture `ad_group_ad.ad.type` and any available image dimension fields. Format classification can be inferred from image dimensions in Phase 4 analysis.

## Sources

### Primary (HIGH confidence)
- [Google Ads Scripts - Third Party APIs](https://developers.google.com/google-ads/scripts/docs/integrations/third-party-apis) - UrlFetchApp POST with JSON, authentication headers, error handling
- [Google Ads Scripts - Reporting](https://developers.google.com/google-ads/scripts/docs/concepts/reports) - AdsApp.search() and AdsApp.report() with GAQL syntax
- [Google Ads Scripts - Performance Max](https://developers.google.com/google-ads/scripts/docs/campaigns/performance-max/using-ads-app) - PMax campaign access, asset group management, GAQL queries
- [Google Ads API - Fetching Assets](https://developers.google.com/google-ads/api/docs/assets/fetching-assets) - ad_group_ad_asset_view fields, performance_label values, GAQL examples
- [Google Ads API - Metrics Reference v22](https://developers.google.com/google-ads/api/fields/v22/metrics) - Video metrics: video_views, video_view_rate, average_cpv, quartile rates
- [Drizzle ORM - Neon Setup](https://orm.drizzle.team/docs/get-started/neon-new) - Installation, schema, config, migrations
- [Drizzle ORM - Zod Integration](https://orm.drizzle.team/docs/zod) - createInsertSchema, createSelectSchema, customisation
- [Next.js - Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - App Router API routes, POST handling, NextResponse
- [Neon - Vercel Transition Guide](https://neon.com/docs/guides/vercel-postgres-transition-guide) - Migration from @vercel/postgres to @neondatabase/serverless
- [MDN - Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - en-AU locale, AUD currency formatting

### Secondary (MEDIUM confidence)
- [Neon Pricing/Free Tier](https://neon.com/docs/introduction/plans) - 0.5GB storage, 100 CU-hours/month free, scale-to-zero
- [PMax Asset Performance Script (GitHub Gist)](https://gist.github.com/tonkikh/e89ef3a2e3de7ab28f4e63c23bc52e6d) - Reference GAQL queries for PMax asset data extraction
- [Vercel Marketplace - Neon](https://vercel.com/marketplace/neon) - Neon as Vercel's Postgres provider, integrated billing
- Multiple Drizzle+Neon+Next.js tutorials on dev.to and Medium confirming standard setup patterns

### Tertiary (LOW confidence)
- PMax per-asset granular metrics availability (only performance_label is confirmed; per-asset impressions/clicks via segments.asset_interaction_target needs validation)
- Display ad format detection from GAQL fields (needs validation with actual account data)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Neon+Drizzle+Next.js is Vercel's blessed stack, extensively documented
- Architecture: HIGH - Patterns follow official docs from all libraries involved
- Google Ads Script GAQL fields: MEDIUM - RSA and Video fields are well-documented; PMax and Display have some gaps around granular asset metrics
- Pitfalls: HIGH - Based on documented limitations (serverless payload limits, Neon cold starts, cost_micros types, GAQL timezone behaviour)

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (30 days - stable stack, unlikely to change)
