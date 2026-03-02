---
phase: 01-data-pipeline-and-foundation
plan: 01
subsystem: ui, infra
tags: [next.js, tailwind, typescript, lucide-react, intl-numberformat, design-system]

# Dependency graph
requires: []
provides:
  - "Next.js 14 App Router project scaffold with TypeScript"
  - "Tailwind CSS design system with CLAUDE.md colour tokens (brand + surface palettes)"
  - "COLOURS JS constant for chart library usage"
  - "AU locale formatting utilities (currency, percentage, compact numbers, micros conversion)"
  - "Responsive app shell with sidebar navigation (6 sections)"
  - "Setup guide empty state for first-time visitors"
affects: [01-02, 01-03, 02-dashboard-core, 03-rsa-analysis, 04-multi-campaign]

# Tech tracking
tech-stack:
  added: [next.js-14, tailwind-3.4, typescript-5, drizzle-orm, "@neondatabase/serverless", zod, nanoid, lucide-react, drizzle-kit, dotenv]
  patterns: [app-router, design-system-tokens, au-locale-formatting, responsive-sidebar-layout]

key-files:
  created:
    - tailwind.config.ts
    - lib/constants/colours.ts
    - lib/constants/formatting.ts
    - components/layout/Sidebar.tsx
    - components/layout/AppShell.tsx
  modified:
    - app/layout.tsx
    - app/page.tsx
    - app/globals.css
    - package.json

key-decisions:
  - "Used Inter font via next/font/google instead of Geist local fonts from create-next-app template"
  - "Sidebar uses slide-in/out on mobile rather than icon-only collapse for better UX"
  - "Disabled navigation items show 'Soon' label with opacity-50 and cursor-not-allowed"

patterns-established:
  - "Design system colours: use bg-brand-blue, text-brand-red etc. Tailwind classes for components; COLOURS constant for chart libraries"
  - "AU locale formatting: always use formatCurrency/formatPercentage etc. from lib/constants/formatting.ts"
  - "Component structure: PascalCase files in components/, camelCase utilities in lib/"
  - "Layout pattern: AppShell wraps all pages with Sidebar + scrollable main content area"

requirements-completed: [VIS-03, DASH-06, DASH-07]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 1 Plan 1: Project Scaffold Summary

**Next.js 14 scaffold with Tailwind design system tokens, responsive sidebar app shell, AU locale formatting utilities, and setup guide empty state**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T04:26:24Z
- **Completed:** 2026-03-02T04:31:43Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Next.js 14 App Router project with full TypeScript setup and all dependencies installed
- Tailwind CSS configured with complete CLAUDE.md design system (brand + surface colour palettes)
- Responsive sidebar navigation with 6 sections, disabled states for unshipped features, and mobile hamburger menu
- AU locale formatting utilities producing correct output ($1,234.56, 3.2%, $12.4K, micros conversion)
- Clean setup guide empty state with numbered step cards and connection status badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with Tailwind design system and formatting utilities** - `bcfaef0` (feat)
2. **Task 2: Build responsive app shell with sidebar navigation and setup guide empty state** - `3844910` (feat)

## Files Created/Modified
- `package.json` - Project dependencies including drizzle-orm, zod, nanoid, lucide-react
- `tailwind.config.ts` - Design system colour tokens (brand.blue, brand.green, brand.red, brand.grey, brand.amber, surface.*)
- `lib/constants/colours.ts` - COLOURS constant for JS contexts (Recharts, inline styles)
- `lib/constants/formatting.ts` - AU locale formatters: formatCurrency, formatCurrencyCompact, formatPercentage, formatNumber, formatNumberCompact, convertMicrosToAud
- `components/layout/Sidebar.tsx` - Left sidebar with 6 nav sections, responsive slide-in/out, disabled states
- `components/layout/AppShell.tsx` - Layout wrapper with sidebar + scrollable content area
- `app/layout.tsx` - Root layout with Inter font, AppShell wrapper, metadata
- `app/page.tsx` - Setup guide empty state with 4 numbered steps and status badge
- `app/globals.css` - Clean base styles with surface background
- `.gitignore` - Standard Next.js gitignore

## Decisions Made
- Used Inter font from next/font/google instead of the Geist local fonts bundled by create-next-app, as Inter is a cleaner match for the Linear-style aesthetic
- Sidebar uses a slide-in/out panel on mobile (hamburger toggle) rather than collapsing to icon-only width, which provides a clearer navigation experience on small screens
- Disabled navigation items display a "Soon" label alongside reduced opacity, making it clear to users that these sections are planned but not yet available
- Created project in temp directory and moved files since create-next-app refuses to run in non-empty directories

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created .gitignore missing from template copy**
- **Found during:** Task 1 (project scaffold)
- **Issue:** Copying files from temp directory to root skipped hidden files (.gitignore)
- **Fix:** Created standard Next.js .gitignore manually
- **Files modified:** .gitignore
- **Verification:** git status shows correct tracking
- **Committed in:** bcfaef0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor operational fix, no scope creep.

## Issues Encountered
- create-next-app refused to run in non-empty directory (CLAUDE.md and .planning/ existed) -- used temp directory and moved files back as the plan suggested

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Project scaffold is ready for data pipeline development (Plan 02: database schema, API routes)
- All design system tokens available for chart components in later phases
- Formatting utilities ready for dashboard number display
- App shell provides the navigation frame for all future pages

## Self-Check: PASSED

All 10 created/modified files verified present on disk. Both task commits (bcfaef0, 3844910) verified in git history. Tailwind config contains all CLAUDE.md colour tokens. Sidebar.tsx exceeds 40 lines (161). AppShell.tsx exceeds 20 lines (28). formatting.ts exports all 5 formatters. colours.ts exports COLOURS constant. Build passes without errors.

---
*Phase: 01-data-pipeline-and-foundation*
*Completed: 2026-03-02*
