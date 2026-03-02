# Deferred Items - Phase 04

## Pre-existing TypeScript Errors

- `lib/analysis/fatigueDetection.ts:48` - Type error: `.map()` returns `(T | null)[]` but return type expects `FatiguedCreative[]`. Needs `.filter()` before return or type assertion.
- `lib/analysis/fatigueDetection.ts:75` - Type predicate incompatibility: `FatiguedCreative.direction` includes `"improved"` but filter context expects `"degraded"`.
- These errors existed before Plan 04-04 and are not caused by video page changes.
