---
phase: 03-rsa-analysis
plan: 02
subsystem: analysis
tags: [vitest, tdd, tier-classification, pattern-detection, underperformer-diagnosis, recommendations, insight-titles]

# Dependency graph
requires:
  - phase: 03-rsa-analysis
    plan: 01
    provides: "Vitest test infrastructure, rsaAssetDaily.textContent, rsaCombinationDaily table"
provides:
  - "classifyTiers: percentile-based tier assignment (top 20%, middle 60%, bottom 20%)"
  - "diagnoseUnderperformers: decision tree diagnosis for bottom-tier creatives"
  - "classifyThemes + detectPatterns: regex-based copy theme classification with minimum sample protection"
  - "generateRecommendations: Keep/Test/Pause/Investigate engine mapping tier+diagnosis+patterns to actions"
  - "generateInsightTitle: data-driven chart title generation with percentage differences"
  - "Shared analysis types: Tier, PrimaryKpi, Diagnosis, CopyTheme, CreativeInput, TieredCreative, etc."
affects: [03-rsa-analysis, 04-additional-formats]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-analysis, tdd-red-green-refactor, pipeline-passthrough-via-spread, portfolio-relative-thresholds]

key-files:
  created:
    - lib/analysis/types.ts
    - lib/analysis/tierClassification.ts
    - lib/analysis/tierClassification.test.ts
    - lib/analysis/underperformerDiagnosis.ts
    - lib/analysis/underperformerDiagnosis.test.ts
    - lib/analysis/patternDetection.ts
    - lib/analysis/patternDetection.test.ts
    - lib/analysis/recommendations.ts
    - lib/analysis/recommendations.test.ts
    - lib/analysis/insightTitles.ts
    - lib/analysis/insightTitles.test.ts
  modified: []

key-decisions:
  - "CreativeInput uses index signature [key: string]: unknown for pipeline field passthrough instead of explicit optional fields"
  - "TieredCreative extends CreativeInput so headlineText flows through classifyTiers to detectPatterns without a separate join step"
  - "Portfolio-relative thresholds (0.2x impressions, 0.5x CTR/CVR, 0.8x CTR for disconnect) rather than absolute values"
  - "Minimum sample size of 3 for pattern detection to prevent overfitting per research pitfall #5"
  - "Recommendations engine imports classifyThemes from patternDetection to check middle-tier pattern matching"

patterns-established:
  - "Pure analysis functions: accept data arrays, return enriched results, no DB/React/side effects"
  - "TDD RED-GREEN-REFACTOR: write failing tests first, implement to pass, refactor if needed"
  - "Pipeline passthrough via spread: ...creative on output preserves all input fields including headlineText"
  - "Portfolio-relative thresholds: all diagnosis thresholds are fractions of portfolio averages, not absolute values"

requirements-completed: [RSA-01, RSA-06, RSA-07, RSA-08, RSA-09]

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 3 Plan 02: RSA Analysis Engine Summary

**Pure-function analysis engine with TDD: tier classification (CPA/ROAS), underperformer diagnosis decision tree, regex copy theme detection, Keep/Test/Pause/Investigate recommendations, and insight-led title generation -- 49 tests, all green**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T09:30:46Z
- **Completed:** 2026-03-02T09:37:54Z
- **Tasks:** 11 (types + 5 TDD modules x 2 phases each)
- **Files modified:** 11

## Accomplishments
- Complete analysis pipeline: types -> tierClassification -> underperformerDiagnosis -> patternDetection -> recommendations -> insightTitles
- CPA sorts ascending (low=good) and ROAS sorts descending (high=good) for correct tier assignment
- All 49 tests pass with zero failures across 5 test files
- headlineText flows through the entire pipeline from CreativeInput through TieredCreative to detectPatterns without a separate join step
- All functions are pure with no DB, React, or side effect imports

## Task Commits

Each task was committed atomically:

1. **Types: shared analysis pipeline types** - `c0502a4` (feat)
2. **TDD RED: tierClassification tests** - `199aa7f` (test)
3. **TDD GREEN: tierClassification implementation** - `b129422` (feat)
4. **TDD RED: underperformerDiagnosis tests** - `72ff490` (test)
5. **TDD GREEN: underperformerDiagnosis implementation** - `e7a9d8b` (feat)
6. **TDD RED: patternDetection tests** - `e09f5fb` (test)
7. **TDD GREEN: patternDetection implementation** - `693fea5` (feat)
8. **TDD RED: recommendations tests** - `be82694` (test)
9. **TDD GREEN: recommendations implementation** - `5def331` (feat)
10. **TDD RED: insightTitles tests** - `58f884b` (test)
11. **TDD GREEN: insightTitles implementation** - `4fc6c12` (feat)

_Note: No REFACTOR commits needed -- implementations were clean on first pass._

## Files Created/Modified
- `lib/analysis/types.ts` - Shared types: Tier, PrimaryKpi, CreativeInput, TieredCreative, DiagnosedCreative, PatternResult, Recommendation
- `lib/analysis/tierClassification.ts` - Percentile-based tier assignment with CPA/ROAS sort direction
- `lib/analysis/tierClassification.test.ts` - 8 tests covering sort direction, edge cases, field passthrough
- `lib/analysis/underperformerDiagnosis.ts` - Decision tree diagnosis with portfolio-relative thresholds
- `lib/analysis/underperformerDiagnosis.test.ts` - 8 tests covering all 4 diagnoses, tier filtering, evidence strings
- `lib/analysis/patternDetection.ts` - Regex theme classification and aggregate pattern detection
- `lib/analysis/patternDetection.test.ts` - 15 tests covering all 7 themes, sample size enforcement, avgKpi computation
- `lib/analysis/recommendations.ts` - Keep/Test/Pause/Investigate engine with diagnosis-specific advice
- `lib/analysis/recommendations.test.ts` - 9 tests covering all tier+diagnosis combinations
- `lib/analysis/insightTitles.ts` - Dynamic chart title generation with percentage differences
- `lib/analysis/insightTitles.test.ts` - 9 tests covering CPA/ROAS formats, fallbacks, theme selection

## Decisions Made
- CreativeInput uses `[key: string]: unknown` index signature so any extra fields (impressions, clicks, etc.) pass through the pipeline automatically
- TieredCreative extends CreativeInput, meaning `headlineText` flows from input through tier classification to pattern detection without requiring a separate data join
- Underperformer diagnosis uses portfolio-relative thresholds (not absolute values) so analysis works across industries and account sizes
- Minimum sample size of 3 enforced in detectPatterns to prevent overfitting per research pitfall #5
- Recommendations engine imports classifyThemes from patternDetection to determine which top-performer patterns a middle-tier creative is missing

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- Analysis engine complete and tested, ready for Plan 03 (RSA queries) and Plan 04 (RSA page UI)
- All functions are pure and reusable for Phase 4 (PMax, Display, Video)
- headlineText passthrough pattern established for query layer to populate

## Self-Check: PASSED

All 11 files verified present. All 11 commit hashes verified in git log.

---
*Phase: 03-rsa-analysis*
*Completed: 2026-03-02*
