---
status: diagnosed
phase: 04-multi-format-analysis-and-intelligence
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md
started: 2026-03-02T12:00:00Z
updated: 2026-03-02T12:20:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Sidebar Navigation — All Format Pages Accessible
expected: Sidebar shows clickable links for PMax, Display, Video, and Briefing (with CalendarDays icon). None are greyed out or disabled.
result: pass

### 2. PMax Overview Tab
expected: Navigating to /pmax shows a 3-tab layout (Overview, Asset Groups, Recommendations). Overview tab displays tier classification with Top/Middle/Bottom performer counts and a tier overview visualisation.
result: pass

### 3. PMax Caveat Banner
expected: PMax page displays a prominent amber/warning-coloured banner explaining that Google controls creative assembly for Performance Max campaigns.
result: pass

### 4. PMax Asset Groups Tab
expected: Clicking "Asset Groups" tab shows a leaderboard with Top 5 and Bottom 5 asset groups. Each row shows asset group name (primary) and campaign name (secondary). Portfolio average row included for context.
result: pass

### 5. PMax Theme Analysis
expected: Asset Groups tab includes a theme analysis section showing text assets grouped by asset group with coloured performance labels (BEST/GOOD/LOW/LEARNING).
result: pass

### 6. Display Overview Tab
expected: Navigating to /display shows a 3-tab layout (Overview, Formats, Recommendations). Overview tab displays tier classification for Display ads.
result: pass

### 7. Display Format Comparison
expected: Clicking "Formats" tab shows a horizontal bar chart comparing primary KPI across ad types (Responsive Display, Image Ad, Discovery). Chart has an insight-led title (e.g. "Responsive Display ads achieve 23% lower CPA") computed from the data.
result: pass

### 8. Display Leaderboard with Ad Type Badges
expected: Display leaderboard shows Top 5 and Bottom 5 creatives. Each row has a coloured ad type badge — Responsive Display (blue), Image Ad (grey), Discovery (amber). Portfolio average row included.
result: pass

### 9. Video Overview Tab
expected: Navigating to /video shows a 3-tab layout (Overview, Engagement, Recommendations). Overview tab displays tier classification for Video ads with standard tier overview.
result: pass

### 10. Video Leaderboard with Video Metrics
expected: Video leaderboard shows Top 5 and Bottom 5 video creatives with video-specific columns: View Rate, VTR (view-through rate), and CPV (cost per view) alongside standard metrics.
result: pass

### 11. Video Engagement Chart
expected: Clicking "Engagement" tab shows a quartile completion funnel chart (horizontal bars) displaying P25, P50, P75, P100 completion rates for video creatives.
result: pass

### 12. Monday Briefing Page
expected: Navigating to /briefing shows 4 intelligence sections: "What Changed" (biggest movers with change indicators), "Needs Attention" (fatigued creatives), "Creative Gaps" (underrepresented themes), and "What to Do" (prioritised actions excluding "keep" recommendations).
result: issue
reported: "Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with \"use server\". Or maybe you meant to call this function rather than return it. {$$typeof: ..., render: function TrendingUp}"
severity: blocker

### 13. Settings KPI Propagation
expected: Changing primary KPI toggle in /settings causes all format pages (/rsa, /pmax, /display, /video, /briefing) to reflect the new KPI on next load (no stale data).
result: pass

## Summary

total: 13
passed: 12
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Briefing page loads and shows 4 intelligence sections"
  status: failed
  reason: "User reported: Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'. Or maybe you meant to call this function rather than return it. {$$typeof: ..., render: function TrendingUp}"
  severity: blocker
  test: 12
  root_cause: "Server Component app/briefing/page.tsx passes Lucide icon components (TrendingUp, AlertTriangle, Lightbulb, CheckCircle2) as props to Client Component components/briefing/BriefingSection.tsx. React component functions are not serialisable across the Server/Client boundary."
  artifacts:
    - path: "app/briefing/page.tsx"
      issue: "Lines 20-26 import Lucide icons, lines 371-373/460-462/534-536/565-567 pass them as icon prop to BriefingSection"
    - path: "components/briefing/BriefingSection.tsx"
      issue: "Line 1 has 'use client', line 9 accepts icon: ElementType — receives non-serialisable function from Server Component"
  missing:
    - "Remove 'use client' from BriefingSection.tsx (has no interactive features) OR change icon prop to string name and map to component inside client boundary"
  debug_session: ".planning/debug/briefing-server-client-boundary.md"
