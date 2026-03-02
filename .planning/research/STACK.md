# Technology Stack

**Project:** Google Ads Creative Analyser
**Researched:** 2026-03-02
**Overall Confidence:** MEDIUM (versions based on training data through early 2025; web verification was unavailable during research -- verify exact versions with `npm info <package> version` before installing)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 14.2.x | Full-stack React framework | Mandated by CLAUDE.md. App Router provides server components for data-heavy dashboard pages, API routes for Google Ads Script endpoints, and static generation for layout shells. Vercel deployment is zero-config. Pin to 14.x -- do NOT upgrade to 15.x mid-project as it introduced breaking changes to caching and async request APIs. | HIGH |
| TypeScript | 5.4+ | Type safety | Mandated by CLAUDE.md. Essential for the complex data schemas coming from Google Ads (RSA assets, PMax asset groups, multiple KPI types). Strict mode prevents the "any-soup" that kills analytics projects. | HIGH |
| React | 18.x | UI library | Ships with Next.js 14. Do NOT install React 19 separately -- Next.js 14 is not compatible with it. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 3.4.x | Utility-first CSS | Mandated by CLAUDE.md. Perfect for dashboard UIs where you need consistent spacing, colour tokens, and responsive layouts without custom CSS files. Configure the design system colours (#1A73E8, #34A853, etc.) as Tailwind theme extensions. | HIGH |
| tailwind-merge | 2.x | Class conflict resolution | Prevents duplicate/conflicting Tailwind classes when composing components. Essential when building reusable chart wrappers and card components. | HIGH |
| clsx | 2.x | Conditional classnames | Cleaner conditional styling than template literals. Lightweight (< 1KB). | HIGH |

### Charts and Visualisation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 2.12+ | Chart library | Mandated by CLAUDE.md. React-native composable API, good customisation for the design system requirements (custom colours, data labels, horizontal bars). Handles bar, line, scatter, and heatmap patterns needed for creative analysis. | HIGH |

**Recharts implementation notes:**
- Use `<ResponsiveContainer>` on every chart for dashboard layout flexibility
- Configure the design system colours as a shared palette constant, not inline
- Horizontal `<BarChart layout="vertical">` for creative comparisons (long headline text)
- `<Tooltip>` with custom formatter for AUD currency and percentage formatting
- `<Cell>` components for per-bar colouring (green for top performers, red for underperformers)

**Why NOT other charting libraries:**
- **Nivo:** Better defaults but heavier bundle, less flexible for the specific customisation rules in CLAUDE.md (insight-led titles, sorted bars, conditional colouring)
- **Tremor:** Opinionated dashboard components -- conflicts with the custom design system. Also tightly coupled to its own styling
- **Chart.js / react-chartjs-2:** Canvas-based, worse for accessibility and SSR. Recharts' SVG approach works better with Next.js server components
- **D3 directly:** Overkill for this use case. Recharts wraps D3 internals already

### Data Ingestion and Parsing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Papaparse | 5.4+ | CSV parsing | Mandated by CLAUDE.md. Handles streaming large CSV files, auto-detects delimiters, robust header parsing. Google Ads Script output is typically CSV. | HIGH |
| SheetJS (xlsx) | 0.20+ | XLSX parsing | Mandated by CLAUDE.md. Community edition is free and sufficient. Parses Excel workbooks from Google Ads Script output. Use `read` with `type: 'buffer'` in API routes. | MEDIUM |
| zod | 3.23+ | Schema validation | Validate and transform incoming Google Ads data at the API boundary. Ensures scripts pushing malformed data get clear errors. Define schemas for each creative type (RSA, PMax, Display, Video). | HIGH |

**Why zod over alternatives:**
- **yup:** Older, less TypeScript-native, worse inference
- **joi:** Node-only, heavier, designed for Express-era validation
- **valibot:** Newer alternative with smaller bundle, but less ecosystem support and docs. Zod is the standard for Next.js projects.

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel Postgres (Neon) | Latest | Primary data store | Time-series creative data needs relational queries (JOIN across accounts, campaigns, date ranges). Vercel Postgres is Neon under the hood -- zero-config on Vercel, connection pooling built in, generous free tier (256MB). SQL is the right tool for the analytical queries this app needs. | HIGH |
| Drizzle ORM | 0.30+ | Database access | Type-safe SQL builder that generates clean queries. Lighter than Prisma (no engine binary), better for Vercel serverless (cold starts). Schema-as-code with migrations. Plays well with Neon/Vercel Postgres. | HIGH |
| drizzle-kit | 0.22+ | Schema migrations | Companion CLI for Drizzle. Generates SQL migrations from schema changes. | HIGH |

**Why NOT other database options:**
- **Prisma:** Larger cold starts on Vercel serverless due to engine binary. Drizzle is faster to boot and produces more predictable SQL for analytical queries
- **Supabase:** Good product but adds a separate service to manage. Vercel Postgres keeps everything in one platform
- **SQLite/Turso:** Good for simpler apps but this needs proper relational queries across accounts, campaigns, dates, and creative types. PostgreSQL's window functions and CTEs are valuable for percentile calculations (tier classification)
- **MongoDB:** Wrong tool for analytical/relational data. Time-series creative data with account relationships is inherently relational
- **Plain JSON/files:** Will not scale past the first account. Daily data from 3-10 accounts accumulates fast

**Why Vercel Postgres specifically:**
- The project deploys to Vercel (mandated constraint)
- Zero-config connection from Vercel serverless functions
- Neon's serverless driver means no connection pool issues
- Free tier is sufficient for 3-10 accounts with daily data
- If data grows beyond 256MB, Neon's paid tier is straightforward

### AI / LLM Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel AI SDK | 4.x+ | AI integration framework | Standardised interface for calling LLMs from Next.js. Supports streaming responses, structured output (for generating headline/description recommendations in specific formats), and multiple providers. Works natively with Next.js App Router and Server Actions. | MEDIUM |
| OpenAI API (via AI SDK) | gpt-4o-mini | Creative recommendation generation | Best cost/quality ratio for generating ad copy variations. gpt-4o-mini is cheap enough to run on every analysis without budget concerns. Use structured output to get recommendations in the Keep/Test/Pause/Investigate format. | MEDIUM |

**AI integration approach:**
- Do NOT call OpenAI directly -- use Vercel AI SDK as the abstraction layer
- Use `generateObject()` with zod schemas to get structured recommendations (not free-text)
- Pattern detection runs as pure TypeScript logic first (no LLM needed for percentile classification, copy theme tagging, or structural analysis)
- LLM is used for: (1) generating new headline/description suggestions based on winner patterns, (2) synthesising natural-language strategic insights, (3) gap analysis narrative
- Keep LLM calls server-side only (API routes or Server Actions) -- never expose API keys to client

**Why NOT other AI approaches:**
- **Anthropic Claude API:** Excellent quality but higher cost per token for high-volume copy generation. OpenAI's structured output mode is more mature for generating formatted ad copy
- **Local/open-source models:** Unnecessary complexity for this use case. The operator is a single user, not serving thousands of concurrent requests
- **No AI at all:** The project spec explicitly requires "AI-generated creative recommendations" -- it's a core feature, not a nice-to-have

### Authentication (Future)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| (None for v1) | -- | -- | PROJECT.md explicitly scopes auth out: "Single operator, no auth system needed for v1." Do not add auth complexity to the first version. | HIGH |
| NextAuth.js / Auth.js | 5.x | Future auth | When auth is needed later, Auth.js v5 is the standard for Next.js App Router. Supports Google OAuth (natural for a Google Ads tool). | MEDIUM |

### Date and Time

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | 3.x+ | Date manipulation | Lightweight, tree-shakeable, immutable. Needed for time-series data: period comparisons, date range filtering, "last 7/30/90 days" calculations. | HIGH |

**Why NOT other date libraries:**
- **dayjs:** Fine alternative but date-fns v3 is fully tree-shakeable and has better TypeScript types
- **Moment.js:** Deprecated. Do not use.
- **Temporal API:** Not yet widely available in all runtimes. Use date-fns now, migrate to Temporal when stable.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| nuqs | 2.x | URL query state | Sync dashboard filters (account selector, date range, KPI toggle) with URL search params. Users can bookmark/share specific views. Works natively with Next.js App Router. | MEDIUM |
| React Server Components | (built-in) | Server state | Next.js 14 App Router uses RSC by default. Fetch data on the server, pass to client chart components. No need for React Query or SWR for initial data loads. | HIGH |

**Why NOT other state management:**
- **Redux / Zustand:** Overkill for a single-operator dashboard. URL state + server components + local component state covers all needs
- **React Query / TanStack Query:** Useful for client-side data fetching, but this app should fetch data on the server (server components + API routes). If client-side revalidation is needed later, add it then -- not upfront
- **SWR:** Same reasoning as React Query. YAGNI for v1.

### Infrastructure and DevOps

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | -- | Hosting and deployment | Mandated by project constraints. Zero-config Next.js deployment. Edge functions for API routes receiving Google Ads Script pushes. | HIGH |
| Vercel Cron | -- | Scheduled analysis | Trigger daily analysis recalculation after Google Ads Scripts push data. Free tier includes cron jobs via vercel.json. | MEDIUM |
| Vercel Blob | -- | File storage (optional) | If raw Google Ads Script output needs to be archived before processing. Simpler than S3 for small-scale storage. | LOW |

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 8.x | Linting | Standard for Next.js projects. Use `next/core-web-vitals` config. | HIGH |
| Prettier | 3.x | Code formatting | Consistent formatting. Configure with Tailwind plugin for class sorting. | HIGH |
| prettier-plugin-tailwindcss | 0.6+ | Tailwind class sorting | Automatically sorts Tailwind classes in a consistent order. Prevents bikeshedding. | HIGH |

### Testing (Add Incrementally)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | 2.x | Unit/integration tests | Faster than Jest, native ESM support, compatible with Next.js. Test the analysis logic (tier classification, pattern detection) which is the core value of the app. | HIGH |

**Testing strategy for v1:**
- Focus tests on `lib/analysis/` (tier classification, pattern detection, underperformer diagnosis) -- this is pure logic, easy to test, and the highest-value code to protect
- Do NOT invest in E2E tests for v1. The UI will change rapidly. Test the data pipeline and analysis logic instead.

## Full Dependency List

### Production Dependencies

```bash
# Core framework
npm install next@14 react@18 react-dom@18

# Styling
npm install tailwindcss@3 postcss autoprefixer tailwind-merge clsx

# Charts
npm install recharts

# Data parsing
npm install papaparse xlsx

# Validation
npm install zod

# Database
npm install drizzle-orm @vercel/postgres

# Dates
npm install date-fns

# URL state
npm install nuqs

# AI (add when building recommendation features)
npm install ai @ai-sdk/openai
```

### Development Dependencies

```bash
# Types
npm install -D typescript @types/react @types/react-dom @types/papaparse

# Database tooling
npm install -D drizzle-kit

# Linting and formatting
npm install -D eslint eslint-config-next prettier prettier-plugin-tailwindcss

# Testing (add when analysis logic stabilises)
npm install -D vitest @testing-library/react
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 14 | Next.js 15 | Breaking changes to caching and async request APIs. 14.x is stable and well-documented. Upgrade when 15.x matures and if specific features are needed. |
| Framework | Next.js 14 | Remix/React Router 7 | Different deployment model, less Vercel-native, would fight the project constraints |
| ORM | Drizzle | Prisma | Larger cold starts on serverless, heavier dependency, less control over generated SQL for analytical queries |
| Database | Vercel Postgres | Supabase | Adds a separate platform to manage. Vercel Postgres keeps hosting + database in one place |
| Database | PostgreSQL | SQLite/Turso | Multi-account relational data with analytical queries (percentiles, window functions) benefits from full PostgreSQL |
| Charts | Recharts | Tremor | Opinionated styling conflicts with the custom design system. Tremor is great for generic dashboards but fights customisation |
| Charts | Recharts | Nivo | Heavier bundle, less flexible for specific CLAUDE.md requirements (conditional per-bar colouring, custom labels) |
| Validation | Zod | Valibot | Smaller bundle but less ecosystem maturity. Zod is the standard for Next.js + TypeScript |
| AI SDK | Vercel AI SDK | Direct OpenAI SDK | AI SDK provides streaming, structured output, and provider-agnostic abstraction. Switching LLM providers later is trivial |
| State | nuqs + RSC | React Query + Zustand | Overkill. Server components handle data fetching; URL state handles filters. No need for client-side data caching or global stores |
| Dates | date-fns | dayjs | date-fns v3 has better tree-shaking and TypeScript types. Both are fine; date-fns edges out for this stack |
| Testing | Vitest | Jest | Vitest is faster, native ESM, better DX. Jest works but requires more config for Next.js App Router projects |

## Architecture Fit

This stack supports the three key architectural patterns the project needs:

1. **Data Pipeline:** Google Ads Scripts push CSV/JSON to Next.js API routes -> Papaparse/zod validate and transform -> Drizzle inserts to Vercel Postgres -> Cron triggers analysis recalculation
2. **Dashboard Rendering:** Server components query Postgres via Drizzle -> Pass data to client-side Recharts components -> nuqs manages filter state in URL
3. **AI Recommendations:** Server Actions call Vercel AI SDK -> Structured output via zod schemas -> Recommendations stored in Postgres alongside creative data

## Version Verification Note

**IMPORTANT:** Exact version numbers in this document are based on training data through early 2025. Before running `npm install`, verify current versions:

```bash
npm info next version
npm info recharts version
npm info drizzle-orm version
npm info zod version
npm info papaparse version
npm info xlsx version
npm info ai version
npm info date-fns version
npm info nuqs version
```

Use the major versions recommended here (Next.js 14.x, not 15.x; React 18.x, not 19.x; Tailwind 3.x, not 4.x) but install the latest patch within those ranges.

## Sources

- CLAUDE.md (project specification, mandated technologies)
- PROJECT.md (project requirements, constraints, scope)
- Training data (library ecosystem knowledge through early 2025) -- MEDIUM confidence on exact version numbers
- Direct library experience patterns (architectural recommendations) -- HIGH confidence on patterns, MEDIUM on specific API details

**Gaps:** Could not verify exact latest patch versions via npm registry or official docs due to tool access limitations during this research session. Version numbers should be confirmed before project initialisation.
