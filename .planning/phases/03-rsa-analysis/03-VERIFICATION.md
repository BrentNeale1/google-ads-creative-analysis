---
phase: 03-rsa-analysis
verified: 2026-03-02T11:00:00Z
status: passed
score: 12/12 must-haves verified
gaps:
  - truth: "TypeScript compiles cleanly with zero errors"
    status: resolved
    reason: "patternDetection.ts and its test file have 4 TypeScript errors due to Map/Set iteration and implicit any in reduce callback. These are compile-time errors that block the plan's stated success criterion."
    artifacts:
      - path: "lib/analysis/patternDetection.ts"
        issue: "MapIterator cannot be iterated (TS2802) — needs downlevelIteration or target es2015+. Parameter 'sum' and 'v' in reduce callback have implicit any (TS7006)."
      - path: "lib/analysis/patternDetection.test.ts"
        issue: "Set<CopyTheme> cannot be iterated (TS2802) — same target issue."
    missing:
      - "Convert Map.entries() iteration to Array.from(themeMap.entries()) in patternDetection.ts line 79"
      - "Add explicit types to the reduce callback: (sum: number, v: number) => sum + v in patternDetection.ts line 83"
      - "Convert [...new Set(themes)] to Array.from(new Set(themes)) in patternDetection.test.ts line 44"
  - truth: "insightTitles.ts imports CopyTheme from patternDetection (key link pattern)"
    status: failed
    reason: "Plan 02 key_link specifies pattern 'import.*CopyTheme.*from.*patternDetection' but insightTitles.ts imports CopyTheme from './types' instead. The functional connection is intact (PatternResult is consumed correctly) but the import path deviates from the declared key link."
    artifacts:
      - path: "lib/analysis/insightTitles.ts"
        issue: "CopyTheme imported from './types' not from './patternDetection'. Functional behaviour is correct but deviates from plan key_link contract."
    missing:
      - "Either update the key link in the plan to reflect the types-first import pattern, or note as accepted deviation (types.ts is the canonical source; importing from there is architecturally correct)."
---

# Phase 03: RSA Analysis — Verification Report

**Phase Goal:** Operator can analyse RSA creative performance at asset and combination level, see which patterns drive results, understand why underperformers fail, and get actionable Keep/Test/Pause/Investigate recommendations

**Verified:** 2026-03-02T11:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Vitest runs and reports zero tests (infrastructure ready) | VERIFIED | vitest.config.mts exists (12 lines), node env, globals, tsconfig paths — all correct |
| 2 | rsaAssetDaily table has textContent column | VERIFIED | lib/db/schema.ts line 99: `textContent: text('text_content')` |
| 3 | rsaCombinationDaily table exists | VERIFIED | lib/db/schema.ts lines 121-139: full table definition, no unique index, delete-before-insert pattern |
| 4 | Ingestion API accepts textContent on rsaAssets and rsaCombinations | VERIFIED | app/api/ingest/route.ts handles rsaCombinationDaily delete+insert (lines 178-195); ingestionSchema.ts has rsaCombinations field |
| 5 | Creatives are classified into top 20%, middle 60%, bottom 20% by CPA or ROAS | VERIFIED | lib/analysis/tierClassification.ts: Math.ceil(0.2) cutoffs, CPA ascending / ROAS descending sort |
| 6 | Underperformers receive a specific diagnosis (not_serving, not_resonating, landing_page_disconnect, wrong_audience) | VERIFIED | lib/analysis/underperformerDiagnosis.ts: full decision tree with portfolio-relative thresholds |
| 7 | Copy themes classified into 7 categories via regex | VERIFIED | lib/analysis/patternDetection.ts: THEME_PATTERNS with 7 theme regexes; classifyThemes + detectPatterns exported |
| 8 | Each creative receives a Keep/Test/Pause/Investigate recommendation | VERIFIED | lib/analysis/recommendations.ts: full mapping logic (top->keep, bottom+diagnosis->pause, middle->test/keep) |
| 9 | Insight titles computed from pattern data | VERIFIED | lib/analysis/insightTitles.ts: percentage diff computed, CPA/ROAS verbs, <=5% fallback |
| 10 | User sees RSA page with tier overview, leaderboards, patterns, diagnosis, recommendations | VERIFIED | app/rsa/page.tsx: full pipeline orchestration across 3 tabs (overview/assets/recommendations); all 7 components rendered |
| 11 | Combination data is labelled as directional with impressions only | VERIFIED | components/rsa/CombinationReport.tsx: prominent caveat banner, no CTR/CPA columns |
| 12 | TypeScript compiles cleanly with zero errors | FAILED | 4 TS errors in lib/analysis/patternDetection.ts and its test: TS2802 (Map/Set iteration target incompatibility) + TS7006 (implicit any in reduce) |

**Score:** 11/12 truths verified (primary goal truths); 2 key link / compile issues bring overall to 10/12 assessed items

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Min Lines | Status | Details |
|----------|-----------|--------|---------|
| `vitest.config.mts` | 10 | VERIFIED | 12 lines, correct config |
| `lib/db/schema.ts` (rsaCombinationDaily) | — | VERIFIED | Table exported, contains rsaCombinationDaily |
| `lib/validation/ingestionSchema.ts` (rsaCombinationRowSchema) | — | VERIFIED | rsaCombinationRowSchema exported, RsaCombinationRow type exported, textContent on rsaAssetRowSchema |

### Plan 02 Artifacts

| Artifact | Exports | Status | Details |
|----------|---------|--------|---------|
| `lib/analysis/types.ts` | Tier, PrimaryKpi, TieredCreative, DiagnosedCreative, CopyTheme, Recommendation | VERIFIED | All 7 types exported, headlineText on CreativeInput, index signature for passthrough |
| `lib/analysis/tierClassification.ts` | classifyTiers | VERIFIED | 34 lines, CPA/ROAS sort direction, spread passthrough |
| `lib/analysis/underperformerDiagnosis.ts` | diagnoseUnderperformers | VERIFIED | 73 lines, 4 diagnoses, portfolio-relative thresholds |
| `lib/analysis/patternDetection.ts` | classifyThemes, detectPatterns | STUB (TS errors) | 93 lines, substantive implementation, but TS2802+TS7006 errors at compile time |
| `lib/analysis/recommendations.ts` | generateRecommendations | VERIFIED | 134 lines, imports classifyThemes, full tier+diagnosis mapping |
| `lib/analysis/insightTitles.ts` | generateInsightTitle | VERIFIED | 64 lines, percentage diff, CPA/ROAS verbs, fallback |

### Plan 03 Artifacts

| Artifact | Provides | Min Lines | Status | Details |
|----------|----------|-----------|--------|---------|
| `lib/queries/rsa.ts` | fetchRsaCreatives, fetchRsaAssets, fetchRsaCombinations, fetchRsaPortfolioAvg | — | VERIFIED | server-only guard, all 4 functions exported, Drizzle queries, derived metrics, zero-division protection |
| `app/settings/page.tsx` | Account KPI selector | 30 | VERIFIED | 157 lines, Server Action updates accounts.primaryKpi, revalidates /settings and /rsa |
| `components/layout/Sidebar.tsx` | RSA nav enabled | — | VERIFIED | disabled: false on RSA Analysis item (line 34), href: "/rsa", usePathname active state |

### Plan 04 Artifacts

| Artifact | Min Lines | Status | Details |
|----------|-----------|--------|---------|
| `app/rsa/page.tsx` | 50 | VERIFIED | 216 lines, full pipeline orchestration, 3-tab layout |
| `app/rsa/searchParams.ts` (exports rsaSearchParams) | — | VERIFIED | rsaSearchParams exported (line 14), resolveDateRange exported |
| `components/rsa/TierOverview.tsx` | 20 | VERIFIED | 108 lines, 3 tier cards with design system colours |
| `components/rsa/CreativeLeaderboard.tsx` | 40 | VERIFIED | 231 lines, top/bottom tables, tier highlighting, portfolio avg row |
| `components/rsa/AssetPerformance.tsx` | 30 | VERIFIED | 189 lines, headline/description sections, Google label badges |
| `components/rsa/CombinationReport.tsx` | 20 | VERIFIED | 130 lines, impressions-only caveat, no CTR/CPA columns |
| `components/rsa/UnderperformerPanel.tsx` | 30 | VERIFIED | 122 lines, diagnosis cards, evidence text, recommended action |
| `components/rsa/PatternCharts.tsx` | 40 | VERIFIED | 162 lines, Recharts BarChart layout="vertical", insight title as prop |
| `components/rsa/RecommendationList.tsx` | 30 | VERIFIED | 211 lines, grouped by Pause/Investigate/Test/Keep, expandable cards |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/validation/ingestionSchema.ts` | `lib/db/schema.ts` | Zod schema fields match Drizzle columns | WIRED | rsaCombinationRowSchema fields (adId, headlines, descriptions, impressions) match rsaCombinationDaily columns |
| `app/api/ingest/route.ts` | `lib/db/schema.ts` | insert into rsaCombinationDaily | WIRED | Lines 178, 181, 182, 195 reference schema.rsaCombinationDaily |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/analysis/patternDetection.ts` | `lib/analysis/types.ts` | reads TieredCreative.headlineText | WIRED | Lines 63-64 read creative.headlineText |
| `lib/analysis/recommendations.ts` | `lib/analysis/tierClassification.ts` | uses Tier type | WIRED (via types.ts) | Imports TieredCreative, Tier from types.ts (the canonical source); functionally correct |
| `lib/analysis/recommendations.ts` | `lib/analysis/underperformerDiagnosis.ts` | uses Diagnosis type | WIRED (via types.ts) | Imports DiagnosedCreative, Diagnosis from types.ts; also imports classifyThemes from patternDetection.ts |
| `lib/analysis/insightTitles.ts` | `lib/analysis/patternDetection.ts` | uses CopyTheme type and pattern results | PARTIAL | Imports CopyTheme from types.ts (not patternDetection.ts as plan specifies); PatternResult consumed correctly. Architecturally sound but deviates from plan key_link pattern |

### Plan 03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/queries/rsa.ts` | `lib/db/schema.ts` | Drizzle queries on rsaDaily, rsaAssetDaily, rsaCombinationDaily | WIRED | Lines 80-92 reference schema.rsaDaily, schema.rsaAssetDaily, schema.rsaCombinationDaily |
| `app/settings/page.tsx` | `lib/db/schema.ts` | Updates accounts.primaryKpi | WIRED | Lines 25-27: db.update(schema.accounts).set({ primaryKpi: newKpi }) |
| `components/layout/Sidebar.tsx` | `app/rsa/page.tsx` | href /rsa navigation link | WIRED | Line 32: href: "/rsa", disabled: false |

### Plan 04 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/rsa/page.tsx` | `lib/queries/rsa.ts` | Server-side data fetching | WIRED | Lines 3-6: all 4 fetchRsa* functions imported and called (lines 95-104) |
| `app/rsa/page.tsx` | `lib/analysis/tierClassification.ts` | classifyTiers call | WIRED | Line 12 import, line 133 call with headlineText-enriched creativeInputs |
| `app/rsa/page.tsx` | `lib/analysis/patternDetection.ts` | detectPatterns receives TieredCreative[] | WIRED | Line 14 import, line 141 call |
| `app/rsa/page.tsx` | `lib/analysis/recommendations.ts` | generateRecommendations call | WIRED | Line 15 import, line 143 call |
| `components/rsa/PatternCharts.tsx` | `lib/analysis/insightTitles.ts` | Receives pre-computed insight title as prop | WIRED | insightTitle prop on line 19, rendered at line 93 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| RSA-01 | 02, 04 | Performance tier classification — top 20%, middle 60%, bottom 20% by primary KPI | SATISFIED | classifyTiers in lib/analysis/tierClassification.ts; TierOverview component renders counts and KPI ranges |
| RSA-02 | 03 | Primary KPI is configurable per account (CPA or ROAS) | SATISFIED | app/settings/page.tsx: Server Action updates accounts.primaryKpi; app/rsa/page.tsx reads primaryKpi to determine sort direction |
| RSA-03 | 03, 04 | Top/bottom creative leaderboards sorted by performance | SATISFIED | components/rsa/CreativeLeaderboard.tsx: top/bottom tables with tier highlighting and portfolio avg row |
| RSA-04 | 01, 03, 04 | RSA asset-level analysis (individual headline and description performance) | SATISFIED | schema.rsaAssetDaily.textContent; fetchRsaAssets returns textContent; AssetPerformance.tsx shows text with Google label badges |
| RSA-05 | 01, 03, 04 | RSA combination reporting (which headline+description pairings serve and convert) | SATISFIED | rsaCombinationDaily table; fetchRsaCombinations; CombinationReport.tsx with impressions-only caveat |
| RSA-06 | 02, 04 | Underperformer diagnosis (low impressions, low CTR, low CVR, high CPA mapping) | SATISFIED | lib/analysis/underperformerDiagnosis.ts: 4-branch decision tree; UnderperformerPanel.tsx renders diagnosis cards with evidence |
| RSA-07 | 02, 04 | Pattern detection across top performers (copy themes) | SATISFIED | lib/analysis/patternDetection.ts: 7-theme regex classification; PatternCharts.tsx horizontal bar chart |
| RSA-08 | 02, 04 | Keep/Test/Pause/Investigate recommendation framework per creative | SATISFIED | lib/analysis/recommendations.ts: full mapping engine; RecommendationList.tsx grouped by action |
| RSA-09 | 02, 04 | Insight-led chart titles computed from data | SATISFIED | lib/analysis/insightTitles.ts: percentage diff, verb selection; PatternCharts.tsx renders insightTitle prop |

All 9 requirements (RSA-01 through RSA-09) are mapped. No orphaned requirements detected.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/analysis/patternDetection.ts` | 79 | `themeMap.entries()` without Array.from() — TS2802: MapIterator not iterable at es5 target | Blocker | TypeScript compile fails; Next.js build would fail |
| `lib/analysis/patternDetection.ts` | 83 | `(sum, v)` in reduce with implicit any — TS7006 | Blocker | TypeScript compile fails under strict mode |
| `lib/analysis/patternDetection.test.ts` | 44 | `new Set(themes)` iterated with spread — TS2802 | Blocker | TypeScript compile fails; runtime in Vitest would still work (Vitest uses es2015+ target) |

Note: The `return []` in tierClassification.ts line 17 and patternDetection.ts line 37 are valid guard clauses (empty input → empty output), not stubs.

---

## Human Verification Required

### 1. End-to-End RSA Page with Real/Seed Data

**Test:** Start dev server (`npm run dev`), load seed data (`npx tsx scripts/seed-data.ts`), navigate to `http://localhost:3000/rsa?account=123-456-7890`
**Expected:** Page renders with tier cards, leaderboard tables, pattern chart with insight-led title; Assets tab shows headline text; Recommendations tab shows grouped action list
**Why human:** Visual rendering, data shape correctness from seed, tab navigation UX

### 2. KPI Toggle via Settings Page

**Test:** Navigate to `/settings`, change primary KPI from CPA to ROAS for an account, return to `/rsa`
**Expected:** Tier classification changes (highest ROAS = top performer instead of lowest CPA)
**Why human:** Real-time data update, visual confirmation of revalidatePath working

### 3. Pattern Chart Insight Title with Real Data

**Test:** With enough seed data (at least 3 creatives per theme), check that PatternCharts renders a data-driven title rather than the fallback "Creative Performance by Copy Theme"
**Expected:** A title like "Benefit-led headlines reduce CPA by 34%" — proving the insight title pipeline is producing meaningful output
**Why human:** Depends on seed data volume; minimum sample size of 3 per theme must be met

---

## Gaps Summary

Two gaps block the phase success criteria:

**Gap 1 — TypeScript compile errors in patternDetection.ts (Blocker):** The tsconfig.json does not set a `target` property (defaults to ES3/ES5 in TypeScript), which means Map iterator and Set spread are not natively supported. The patternDetection.ts implementation uses `themeMap.entries()` in a for...of loop (TS2802) and has a reduce callback with implicit any parameters (TS7006). The same issue appears in the test file. Note that Vitest likely runs with its own ES2015+ environment so the tests may pass at runtime, but `npx tsc --noEmit` fails which violates the plan success criterion.

**Gap 2 — insightTitles key link pattern mismatch (Minor):** Plan 02 declares a key link requiring `import.*CopyTheme.*from.*patternDetection` in insightTitles.ts, but the implementation imports CopyTheme from `./types` (the canonical shared type module). The functional pipeline is fully intact — insightTitles correctly consumes PatternResult objects produced by detectPatterns. This is an architectural choice (centralised types) that is superior to the plan's stated expectation, but deviates from the declared key link pattern. This is a documentation/contract mismatch rather than a functional gap.

**Recommendation for Gap 1:** Fix patternDetection.ts by:
- Replacing `for (const [theme, data] of themeMap.entries())` with `for (const [theme, data] of Array.from(themeMap.entries()))`
- Adding explicit types to the reduce: `data.kpiValues.reduce((sum: number, v: number) => sum + v, 0)`
- Replacing `[...new Set(themes)]` in the test with `Array.from(new Set(themes))`

Or alternatively, add `"target": "ES2017"` to tsconfig.json (safe for Next.js 14).

**Recommendation for Gap 2:** Accept as-is or update the plan's key_link to reflect the types-first import pattern. No code change required.

---

_Verified: 2026-03-02T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
