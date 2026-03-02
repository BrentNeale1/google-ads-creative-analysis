# Phase 2: Dashboard and Visualisation - Research

**Researched:** 2026-03-02
**Domain:** Next.js 14 dashboard with Recharts charting, URL-based filter state, Drizzle ORM aggregation
**Confidence:** HIGH

## Summary

Phase 2 builds the primary dashboard experience on top of the Phase 1 data pipeline foundation. The user selects an account (via the existing sidebar), applies date range and campaign/ad group filters, then views KPI metric cards, time-series line charts, horizontal bar charts, and a sortable data table -- all on a single scrollable page.

The existing codebase already provides: the AppShell layout with sidebar, Drizzle ORM schema with daily tables for RSA/PMax/Display/Video, colour constants and AU locale formatting utilities, and Tailwind CSS theme tokens. The dashboard needs to add: data aggregation queries, a filter bar with URL-persisted state (nuqs), Recharts charts, metric cards with period-over-period deltas, and a sortable table component.

**Primary recommendation:** Use Recharts 2.x (stable, well-documented), nuqs for type-safe URL filter state, native HTML date inputs for the custom range picker (avoiding heavyweight calendar libraries), and Drizzle ORM `db.select()` with `sum()`/`groupBy()` for server-side aggregation. All chart and table rendering is client-side; all data fetching is server-side via React Server Components with search params passed down.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single scrollable page (no tabs)
- KPI metric cards in a responsive card grid at the top
- Charts section below KPIs -- line chart and bar chart side-by-side on desktop, stacking on tablet
- Full sortable data table at the bottom for drill-down
- Flow: KPIs -> Charts -> Table (top-down review workflow)
- Delta arrow + percentage change shown below the main value in each metric card (e.g., green up arrow "+12.3%" or red down arrow "-5.1%")
- Comparison period is the previous equivalent period (viewing last 7d compares to the 7d before that)
- Colour direction inverted for cost metrics: CPA decrease = green (good), CPA increase = red (bad); ROAS increase = green, ROAS decrease = red
- Comparison stays in metric cards only -- charts show the selected period cleanly without overlay lines
- Default metric on page load: conversions
- Metric selector tabs above each chart to switch between metrics (clicks, impressions, CTR, conversions, CPA/ROAS)
- Rich tooltips on hover showing date, metric value, and percentage of total, formatted to AU locale
- Charts are read-only -- no click-to-filter interactions for v1
- Line chart for time-series trends, horizontal bar chart for creative comparisons (per CLAUDE.md chart rules)
- Account selector lives in the left sidebar (existing app shell from Phase 1), always visible
- Horizontal filter bar sits below the header, above content -- always visible
- Date range: preset buttons (7d, 30d, 90d) plus custom date range picker
- Campaign and ad group filters are cascading -- selecting a campaign narrows the ad group dropdown to that campaign's ad groups only
- Filter state (account, date range, campaign, ad group) persisted in URL query params -- bookmarkable, shareable, survives page refresh

### Claude's Discretion
- Exact card spacing, typography sizing, and responsive breakpoints
- Loading skeleton design while data fetches
- Empty state design when no data exists for selected filters
- Error state handling for failed API calls
- Custom date range picker implementation details
- Table pagination vs infinite scroll (if dataset is large)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | User can switch between client accounts via account selector | Sidebar modification to make account selector dynamic + nuqs `account` URL param |
| DASH-02 | Performance overview shows key metrics (impressions, clicks, CTR, conversions, CPA/ROAS) | MetricCard component with period-over-period delta; server-side aggregation query |
| DASH-03 | User can select date ranges (7d, 30d, 90d presets + custom range) | nuqs `parseAsStringLiteral` for presets, `parseAsIsoDate` for custom start/end |
| DASH-04 | User can filter by campaign and ad group | Cascading dropdowns with nuqs URL params; server-side filter in SQL WHERE clause |
| DASH-05 | User can sort tables by any metric column | Client-side sort state on the sortable table component |
| VIS-01 | Time-series line charts showing creative performance trends | Recharts LineChart + ResponsiveContainer with daily-granularity data |
| VIS-02 | Horizontal bar charts for creative comparisons (sorted by value descending) | Recharts BarChart layout="vertical" with YAxis type="category" |
| VIS-04 | Data labels on bar charts when fewer than 10 items | Recharts `<LabelList>` component conditionally rendered based on data.length |
| VIS-05 | Charts use subtle gridlines or none; no borders, no 3D effects | Recharts CartesianGrid stroke={COLOURS.surface.gridline} strokeDasharray="3 3" |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15.4 (latest v2) | Charts (line, horizontal bar) | Already specified in CLAUDE.md; v2 is stable and well-documented; v3 has breaking tooltip API changes |
| nuqs | ^2.8.9 | Type-safe URL search param state | De facto standard for Next.js App Router URL state; used by Vercel, Sentry, Supabase |
| date-fns | ^4.1.0 | Date arithmetic (subDays, startOfDay, format) | Lightweight tree-shakable date library; no heavy moment.js |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | ^0.45.1 | Database queries with aggregation | Server-side data fetching in RSC |
| lucide-react | ^0.575.0 | Icons (arrows, filter icons) | Metric card delta arrows, filter bar icons |
| tailwindcss | ^3.4.1 | Styling | All component styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts v2 | recharts v3 (3.7.0) | v3 removes tooltip `formatter` passthrough, changes z-index behaviour, requires JSX reordering. Not worth migration risk for this project. |
| nuqs | Manual useSearchParams + useRouter | Loses type safety, requires manual serialisation/deserialisation, no server-side cache. nuqs solves all this. |
| date-fns | dayjs | dayjs requires plugin imports for date arithmetic. date-fns is tree-shakable and has no plugin system. |
| react-day-picker v9 | Native HTML date inputs | react-day-picker pulls date-fns v4 + other deps (70KB+). For preset buttons + custom range, two native `<input type="date">` fields in a small popover are sufficient and zero-dependency. |

**Installation:**
```bash
npm install recharts@^2.15.4 nuqs@^2.8.9 date-fns@^4.1.0
```

Note: `recharts` has peer dependency on `react-is` -- check if already satisfied. The project has React 18, which is compatible with all three libraries.

## Architecture Patterns

### Recommended Project Structure
```
app/
  dashboard/
    page.tsx              # Server Component: parse search params, fetch data, render
    loading.tsx           # Next.js loading skeleton (Suspense boundary)
    searchParams.ts       # nuqs createSearchParamsCache definition (shared)
components/
  dashboard/
    FilterBar.tsx         # Client Component: date presets, campaign/ad group dropdowns
    MetricCards.tsx        # Server Component: KPI grid with delta arrows
    MetricCard.tsx         # Presentational: single metric card
    TimeSeriesChart.tsx   # Client Component: Recharts LineChart wrapper
    CreativeBarChart.tsx  # Client Component: Recharts horizontal BarChart wrapper
    MetricTabs.tsx        # Client Component: metric selector tabs for charts
    PerformanceTable.tsx  # Client Component: sortable data table
    ChartTooltip.tsx      # Custom Recharts tooltip component
  layout/
    Sidebar.tsx           # Modified: add account selector dropdown
    AppShell.tsx          # Existing: unchanged
lib/
  queries/
    dashboard.ts          # Server-only: aggregation queries for dashboard data
  constants/
    metrics.ts            # Metric definitions (label, key, format function, colour direction)
    colours.ts            # Existing: unchanged
    formatting.ts         # Existing: add formatCpa, formatRoas helpers
```

### Pattern 1: URL-Driven Server Component Data Fetching
**What:** All filter state lives in URL search params. The page Server Component reads params, fetches aggregated data, and passes it to child components.
**When to use:** Any dashboard page where filters should be bookmarkable and shareable.
**Example:**
```typescript
// app/dashboard/searchParams.ts
import { createSearchParamsCache, parseAsStringLiteral, parseAsString, parseAsIsoDate } from 'nuqs/server';

export const dashboardSearchParams = createSearchParamsCache({
  account: parseAsString.withDefault(''),
  range: parseAsStringLiteral(['7d', '30d', '90d', 'custom'] as const).withDefault('30d'),
  from: parseAsIsoDate,
  to: parseAsIsoDate,
  campaign: parseAsString,
  adGroup: parseAsString,
});

// app/dashboard/page.tsx
import { dashboardSearchParams } from './searchParams';
import type { SearchParams } from 'nuqs/server';

type PageProps = { searchParams: Promise<SearchParams> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await dashboardSearchParams.parse(searchParams);
  const { dateFrom, dateTo } = resolveDateRange(params.range, params.from, params.to);
  const data = await fetchDashboardData(params.account, dateFrom, dateTo, params.campaign, params.adGroup);
  // Render MetricCards, charts, table with data
}
```

### Pattern 2: Client Filter Bar with nuqs
**What:** A "use client" FilterBar component uses `useQueryStates` to read/write URL params. Changes trigger a server re-render of the page.
**When to use:** Interactive filter controls that update URL state.
**Example:**
```typescript
// components/dashboard/FilterBar.tsx
'use client';
import { useQueryStates, parseAsStringLiteral, parseAsString, parseAsIsoDate } from 'nuqs';

export function FilterBar({ campaigns, adGroups }: { campaigns: string[], adGroups: Record<string, string[]> }) {
  const [filters, setFilters] = useQueryStates({
    range: parseAsStringLiteral(['7d', '30d', '90d', 'custom'] as const).withDefault('30d'),
    from: parseAsIsoDate,
    to: parseAsIsoDate,
    campaign: parseAsString,
    adGroup: parseAsString,
  });

  return (
    <div className="flex items-center gap-3 ...">
      {/* Preset buttons */}
      {(['7d', '30d', '90d'] as const).map((preset) => (
        <button
          key={preset}
          onClick={() => setFilters({ range: preset, from: null, to: null })}
          className={filters.range === preset ? 'bg-brand-blue text-white' : '...'}
        >
          {preset}
        </button>
      ))}
      {/* Campaign dropdown, etc. */}
    </div>
  );
}
```

### Pattern 3: Server-Side Aggregation with Drizzle ORM
**What:** Use `db.select()` with `sum()`, `count()`, and `groupBy()` for aggregated dashboard data. Never send raw rows to the client.
**When to use:** Any dashboard metric that aggregates across creatives or dates.
**Example:**
```typescript
// lib/queries/dashboard.ts
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, gte, lte, sum, sql } from 'drizzle-orm';

export async function fetchKpiMetrics(accountId: string, dateFrom: string, dateTo: string, campaignId?: string) {
  const conditions = [
    eq(schema.rsaDaily.accountId, accountId),
    gte(schema.rsaDaily.date, dateFrom),
    lte(schema.rsaDaily.date, dateTo),
  ];
  if (campaignId) conditions.push(eq(schema.rsaDaily.campaignId, campaignId));

  const result = await db
    .select({
      impressions: sum(schema.rsaDaily.impressions).mapWith(Number),
      clicks: sum(schema.rsaDaily.clicks).mapWith(Number),
      costMicros: sum(schema.rsaDaily.costMicros).mapWith(Number),
      conversions: sum(schema.rsaDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.rsaDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.rsaDaily)
    .where(and(...conditions));

  return result[0];
}
```

### Pattern 4: Period-Over-Period Comparison
**What:** Fetch the same aggregation for the comparison period (previous equivalent window) and compute deltas.
**When to use:** Metric cards with percentage change arrows.
**Example:**
```typescript
// Given range 7d ending today, comparison is the 7d before that
import { subDays, format } from 'date-fns';

function getComparisonRange(dateFrom: Date, dateTo: Date): { compFrom: string; compTo: string } {
  const periodDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const compTo = subDays(dateFrom, 1);
  const compFrom = subDays(compTo, periodDays - 1);
  return {
    compFrom: format(compFrom, 'yyyy-MM-dd'),
    compTo: format(compTo, 'yyyy-MM-dd'),
  };
}

function computeDelta(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { value: 0, direction: 'flat' };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}
```

### Pattern 5: Cross-Table Aggregation
**What:** The dashboard aggregates across ALL campaign types (RSA + PMax + Display + Video) for account-level KPIs and filters. Use UNION ALL or parallel queries.
**When to use:** Account-wide metrics that span multiple daily tables.
**Example:**
```typescript
// Use parallel Promise.all for multi-table aggregation
const [rsaMetrics, pmaxMetrics, displayMetrics, videoMetrics] = await Promise.all([
  fetchTableMetrics(schema.rsaDaily, accountId, dateFrom, dateTo, filters),
  fetchTableMetrics(schema.pmaxAssetGroupDaily, accountId, dateFrom, dateTo, filters),
  fetchTableMetrics(schema.displayDaily, accountId, dateFrom, dateTo, filters),
  fetchTableMetrics(schema.videoDaily, accountId, dateFrom, dateTo, filters),
]);
// Sum across all tables for total KPIs
```

### Anti-Patterns to Avoid
- **Fetching raw rows for aggregation on the client:** Always aggregate server-side. A dashboard with 30 days x 50 creatives x 4 tables = 6000 rows. Aggregate to ~30 data points server-side.
- **Using useState for filter state instead of URL params:** Breaks bookmarkability, shareability, and back/forward navigation.
- **Putting Recharts components in Server Components:** Recharts requires browser DOM APIs. All chart wrappers must be "use client".
- **Nested client/server waterfalls:** Fetch all data in the page Server Component, then pass as props. Do NOT have client components fetch their own data.
- **Hardcoding account ID:** The sidebar account selector must drive a URL param that the dashboard reads.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL search param serialisation | Custom parse/stringify for dates, enums | nuqs parsers (`parseAsIsoDate`, `parseAsStringLiteral`) | Edge cases around encoding, null handling, type coercion |
| Chart responsive sizing | Manual window resize listeners | Recharts `<ResponsiveContainer width="100%" height={300}>` | Handles debounce, SSR, container-based sizing |
| Date arithmetic | Manual date math with `new Date()` | `date-fns` `subDays`, `startOfDay`, `format` | Timezone bugs, month boundary edge cases |
| Number formatting | Custom format functions | Existing `lib/constants/formatting.ts` utilities | Already built in Phase 1 with `Intl.NumberFormat('en-AU')` |
| Sort algorithm | Custom sort with locale comparison | `Array.sort()` with typed comparator | Simple but must handle null/undefined metric values |

**Key insight:** The biggest time sinks in dashboard development are getting URL state management right (nuqs eliminates this) and making charts responsive (Recharts handles this). Focus implementation time on the data aggregation queries and metric card design.

## Common Pitfalls

### Pitfall 1: Recharts ResponsiveContainer height collapse
**What goes wrong:** ResponsiveContainer renders at 0 height when its parent has no explicit height.
**Why it happens:** ResponsiveContainer measures parent element dimensions. If parent uses auto/flex height without a min-height, it collapses.
**How to avoid:** Always give the parent div an explicit height or min-height. Alternatively, set `height={300}` directly on ResponsiveContainer.
**Warning signs:** Charts appear as blank white space.

### Pitfall 2: Drizzle ORM sum() returns string
**What goes wrong:** `sum()` in Drizzle returns a string (PostgreSQL returns numeric type as text in the driver).
**Why it happens:** The PostgreSQL wire protocol sends aggregate results as strings.
**How to avoid:** Always chain `.mapWith(Number)` after `sum()`, or explicitly `Number()` cast results.
**Warning signs:** Metric values display as "1234" concatenated instead of added.

### Pitfall 3: Period comparison with zero-data comparison period
**What goes wrong:** Division by zero when computing percentage change and the comparison period has zero metrics.
**Why it happens:** New accounts may have less than 14 days of data, so a 7d comparison has no prior period.
**How to avoid:** Guard against `previous === 0` in delta computation. Show "N/A" or "New" instead of Infinity%.
**Warning signs:** NaN or Infinity displayed in metric cards.

### Pitfall 4: Cascading filter producing stale ad group selection
**What goes wrong:** User selects Campaign A -> Ad Group X, then switches to Campaign B. Ad Group X doesn't exist in Campaign B but remains in the URL.
**Why it happens:** Campaign change doesn't automatically clear the ad group param.
**How to avoid:** When campaign changes, set `adGroup: null` in the same `setFilters` call.
**Warning signs:** Empty data displayed with valid-looking filters.

### Pitfall 5: nuqs NuqsAdapter not wrapped at layout level
**What goes wrong:** `useQueryState` throws "missing adapter" error at runtime.
**Why it happens:** nuqs requires NuqsAdapter wrapping the component tree. In Next.js App Router, it must be in the root layout or a layout above the page using nuqs hooks.
**How to avoid:** Add `<NuqsAdapter>` in `app/layout.tsx` (wrapping children inside the body).
**Warning signs:** Runtime error on page load mentioning "NuqsAdapter".

### Pitfall 6: cost_micros aggregation overflow
**What goes wrong:** Summing many bigint cost_micros values could exceed JavaScript's safe integer range.
**Why it happens:** cost_micros are in millionths (1 AUD = 1,000,000 micros). 30 days x 50 creatives x $100 each = 150,000,000,000 micros.
**How to avoid:** The schema uses `bigint({ mode: 'number' })`. For aggregation, PostgreSQL SUM handles arbitrary precision. Convert to AUD ($) immediately after aggregation, before any JavaScript arithmetic.
**Warning signs:** Large cost values showing incorrect numbers.

### Pitfall 7: Chart metric tabs causing full page re-render
**What goes wrong:** Switching between "clicks" and "conversions" on the chart triggers a full server re-render.
**Why it happens:** If metric tab selection is stored in URL params via nuqs, each change triggers a server round-trip.
**How to avoid:** Keep chart metric selection as local client state (useState), NOT in URL params. Only filters that affect data fetching (account, date, campaign, ad group) go in the URL.
**Warning signs:** Slow chart metric tab switching with loading flashes.

## Code Examples

### Recharts Horizontal Bar Chart (sorted descending, data labels)
```typescript
// Source: Recharts v2 API docs
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { COLOURS } from '@/lib/constants/colours';

interface CreativeBarChartProps {
  data: Array<{ name: string; value: number }>;
  formatValue: (v: number) => string;
}

export function CreativeBarChart({ data, formatValue }: CreativeBarChartProps) {
  // Sort by value descending (per CLAUDE.md chart rules)
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const showLabels = sorted.length < 10;

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 120, right: showLabels ? 60 : 20 }}>
        <CartesianGrid
          stroke={COLOURS.surface.gridline}
          strokeDasharray="3 3"
          horizontal={false}
        />
        <XAxis type="number" tickFormatter={formatValue} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => formatValue(value)} />
        <Bar dataKey="value" fill={COLOURS.brand.blue} radius={[0, 4, 4, 0]}>
          {showLabels && <LabelList dataKey="value" position="right" formatter={formatValue} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Recharts Time-Series Line Chart
```typescript
'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLOURS } from '@/lib/constants/colours';

interface TimeSeriesChartProps {
  data: Array<{ date: string; value: number }>;
  formatValue: (v: number) => string;
}

export function TimeSeriesChart({ data, formatValue }: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid stroke={COLOURS.surface.gridline} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        />
        <YAxis tickFormatter={formatValue} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white rounded-lg shadow-lg border border-surface-gridline p-3">
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(label).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-sm font-semibold">{formatValue(payload[0].value as number)}</p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={COLOURS.brand.blue}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: COLOURS.brand.blue }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Metric Card with Period Delta
```typescript
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  delta: { value: number; direction: 'up' | 'down' | 'flat' } | null;
  invertColour?: boolean; // true for cost metrics (CPA) where down = good
}

export function MetricCard({ label, value, delta, invertColour = false }: MetricCardProps) {
  const getColour = (dir: 'up' | 'down' | 'flat') => {
    if (dir === 'flat') return 'text-brand-grey';
    const isPositive = invertColour ? dir === 'down' : dir === 'up';
    return isPositive ? 'text-brand-green' : 'text-brand-red';
  };

  const DeltaIcon = delta?.direction === 'up' ? ArrowUp : delta?.direction === 'down' ? ArrowDown : Minus;

  return (
    <div className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {delta && (
        <div className={`flex items-center gap-1 mt-1 text-sm ${getColour(delta.direction)}`}>
          <DeltaIcon size={14} />
          <span>{delta.value.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
```

### NuqsAdapter Setup in Root Layout
```typescript
// app/layout.tsx -- add NuqsAdapter wrapping
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="...">
        <NuqsAdapter>
          <AppShell>{children}</AppShell>
        </NuqsAdapter>
      </body>
    </html>
  );
}
```

### Drizzle Time-Series Aggregation
```typescript
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, gte, lte, sum, sql } from 'drizzle-orm';

export async function fetchTimeSeries(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  metric: 'impressions' | 'clicks' | 'conversions',
) {
  const result = await db
    .select({
      date: schema.rsaDaily.date,
      value: sum(schema.rsaDaily[metric]).mapWith(Number),
    })
    .from(schema.rsaDaily)
    .where(
      and(
        eq(schema.rsaDaily.accountId, accountId),
        gte(schema.rsaDaily.date, dateFrom),
        lte(schema.rsaDaily.date, dateTo),
      ),
    )
    .groupBy(schema.rsaDaily.date)
    .orderBy(schema.rsaDaily.date);

  return result; // [{ date: '2024-01-15', value: 1234 }, ...]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState + useEffect for filters | URL search params with nuqs | 2024 | Filters are bookmarkable, shareable, survive refresh |
| Client-side data fetching (useEffect/SWR) | Server Component data fetching | Next.js 14 (2023) | No client JS for data layer, faster initial load |
| Chart.js/Victory Charts | Recharts v2 | Already in CLAUDE.md | Declarative JSX API, good React integration |
| Custom responsive logic | ResponsiveContainer | Recharts standard | Handles resize debounce automatically |
| Moment.js for dates | date-fns v4 | 2024+ | Tree-shakable, no global mutation, smaller bundle |

**Deprecated/outdated:**
- Recharts v3 `formatter` prop passthrough: v3 removed the ability to pass custom tooltip `formatter` through chart components. Use `content` prop with a custom component instead. Since we're using v2, this isn't an issue, but worth noting if upgrading later.
- nuqs v1 import paths: v2 changed import paths. Use `nuqs/server` for server-side cache, `nuqs` for client hooks, `nuqs/adapters/next/app` for adapter.

## Open Questions

1. **Cross-table creative comparison in bar chart**
   - What we know: The bar chart compares creatives. RSA creatives have ad IDs, PMax has asset group IDs, Display/Video have ad IDs. Each table has different name fields.
   - What's unclear: Should the bar chart show creatives across ALL campaign types on one chart, or should it be scoped to the type visible in the current filter context?
   - Recommendation: Show all creatives for the selected account/filters. Use `adId` as the unique key, `adGroupName + " / " + adName` as the display label. Group PMax by asset group name. This gives a unified creative comparison.

2. **Account selector placement in sidebar**
   - What we know: CONTEXT.md says "Account selector lives in the left sidebar". The current Sidebar has hardcoded nav items.
   - What's unclear: Should it be a dropdown at the top of the sidebar, or should accounts be listed as nav items?
   - Recommendation: Add a dropdown/select at the top of the sidebar (above nav items). This matches the "always visible" requirement and doesn't conflict with the nav structure.

3. **Table pagination approach**
   - What we know: CONTEXT.md marks this as Claude's discretion. Datasets could range from 10-200 creatives.
   - What's unclear: Exact row counts per account in production.
   - Recommendation: Use client-side pagination with 25 rows per page. Simpler than infinite scroll, works well for scan-and-compare review workflows. All data is already loaded server-side (it's aggregated, not raw rows).

## Sources

### Primary (HIGH confidence)
- Recharts v2 API documentation (https://recharts.github.io/en-US/api/) - BarChart, LineChart, Tooltip, ResponsiveContainer APIs
- Recharts v3 migration guide (https://github.com/recharts/recharts/wiki/3.0-migration-guide) - Breaking changes informing v2 decision
- nuqs official documentation (https://nuqs.dev/) - Built-in parsers, NuqsAdapter setup, createSearchParamsCache
- nuqs built-in parsers (https://nuqs.dev/docs/parsers/built-in) - parseAsStringLiteral, parseAsIsoDate, parseAsString
- nuqs server-side usage (https://nuqs.dev/docs/server-side) - createSearchParamsCache API
- Next.js 14 App Router data fetching docs (https://nextjs.org/learn/dashboard-app/fetching-data) - Server Component patterns
- Next.js useSearchParams docs (https://nextjs.org/docs/app/api-reference/functions/use-search-params) - Client-side param access
- Drizzle ORM select/aggregation docs (https://orm.drizzle.team/docs/select) - sum(), groupBy(), mapWith()
- npm registry - verified versions: recharts 2.15.4 (latest v2), recharts 3.7.0 (latest v3), nuqs 2.8.9, date-fns 4.1.0

### Secondary (MEDIUM confidence)
- Drizzle ORM group-by-date discussion (https://github.com/drizzle-team/drizzle-orm/discussions/2893) - TO_CHAR pattern for date grouping
- Recharts tooltip v3 changes issue (https://github.com/recharts/recharts/issues/6210) - Confirms v3 formatter removal

### Tertiary (LOW confidence)
- None. All findings verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm registry, versions confirmed, peer dependencies checked against project
- Architecture: HIGH - Patterns based on Next.js 14 official docs and existing Phase 1 codebase patterns
- Pitfalls: HIGH - Based on Recharts GitHub issues, Drizzle ORM discussions, and nuqs documentation warnings

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days - stable ecosystem, no fast-moving changes expected)
