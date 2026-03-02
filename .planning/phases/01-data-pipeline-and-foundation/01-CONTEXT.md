# Phase 1: Data Pipeline and Foundation - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Data flows reliably from Google Ads Scripts into the app via API, stored as append-only time-series, with a working Next.js scaffold and design system configured. Covers ingestion API, data validation, multi-account isolation, AU locale formatting, responsive layout, and design system colours. Dashboard features, analysis, and reporting are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Script data scope
- Capture all four campaign types from day 1: RSA, PMax, Display, Video
- Daily push frequency via Google Ads scheduled trigger
- Project generates a ready-to-deploy Google Ads Script (user copy-pastes into Google Ads)
- Script is part of this codebase, maintained alongside the app

### Data field depth
- Claude's Discretion: Determine the right field set per campaign type based on what Phases 2-4 analysis features need
- Capture enough detail for asset-level RSA analysis (headlines, descriptions, combination data) since all types are collected from day 1

### Account setup
- Auto-register on first data push — no pre-registration or config needed
- Account identified by Google Ads Customer ID (xxx-xxx-xxxx) plus a display name sent with the first push
- Primary KPI defaults to CPA per account, changeable later in the app (Phase 2+)
- Single operator (Brent) — no login or auth system for the app itself in v1

### Data push and security
- API key per account for Script authentication (included in request headers)
- Duplicate pushes for the same account+date overwrite silently — handles Script re-runs gracefully
- Detailed field-level validation errors returned on malformed payloads (e.g., "missing headline_1", "invalid date format")
- Basic sync log: last 10 pushes per account with timestamp, record count, success/failure status — visible in app

### App shell
- Setup guide shown on first load (no data state): "Welcome to Creative Analyser" with steps to set up Script and push first data, showing connection status
- Minimal/unbranded for v1 — no prominent branding, just clean and functional
- Left sidebar navigation with sections: Dashboard, RSA Analysis, PMax, Display, Video, Settings — sections activate as phases ship
- Linear-style aesthetic: clean, modern SaaS feel, minimal chrome, focus on data

### Claude's Discretion
- Exact data fields per campaign type (informed by downstream analysis requirements)
- Database/storage technology choice (Vercel-compatible)
- API route structure and endpoint design
- Script deployment instructions format
- Sidebar section naming and iconography
- Loading states and transition animations

</decisions>

<specifics>
## Specific Ideas

- Visual reference: Linear, Vercel Dashboard, PostHog — clean modern SaaS with minimal chrome
- Script should be copy-paste ready into Google Ads Scripts editor
- Sync log helps debug Script issues without needing to check server logs
- Auto-registration removes friction: just deploy Script and data starts flowing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-pipeline-and-foundation*
*Context gathered: 2026-03-02*
