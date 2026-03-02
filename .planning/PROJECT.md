# Google Ads Creative Analyser

## What This Is

A web-based creative intelligence platform for Google Ads. It ingests creative performance data from multiple Google Ads accounts (via Google Ads Scripts pushing daily), analyses which creatives and selling points resonate best, identifies performance patterns and gaps, and generates actionable recommendations — including AI-drafted copy — to drive proactive creative testing. Built for a single operator managing a handful of client accounts.

## Core Value

Surface what's working, what's not, and what to test next — so every creative decision is backed by performance data rather than gut feel.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ingest creative data from Google Ads Scripts (daily push to app endpoint)
- [ ] Support multiple Google Ads accounts (3-10 client accounts)
- [ ] Account selector to switch between clients
- [ ] Performance overview dashboard (improvements, declines, alerts)
- [ ] Time-series charts showing creative performance trends
- [ ] Performance tier classification (top 20%, middle, bottom 20% by configurable primary KPI)
- [ ] Configurable primary KPI per account (CPA or ROAS)
- [ ] Top/bottom creative leaderboards with performance labelling
- [ ] RSA asset-level and combination-level analysis
- [ ] PMax asset group analysis
- [ ] Display/Demand Gen format performance analysis
- [ ] Video (YouTube) creative performance analysis
- [ ] Pattern detection across top performers (copy themes, structural patterns, audience signals)
- [ ] Underperformer diagnosis (low impressions, low CTR, low CVR, high CPA mapping)
- [ ] Gap analysis — identify untested creative angles and selling points
- [ ] AI-generated creative recommendations (draft headlines/descriptions ready to use)
- [ ] Text-based strategic recommendations (what patterns to lean into)
- [ ] Keep/Test/Pause/Investigate recommendation framework
- [ ] Live dashboard (no PDF export needed for v1)
- [ ] Design system following CLAUDE.md colour palette and chart rules (aspirational — simplify where practical)
- [ ] Analysis framework following CLAUDE.md tier classification and report structure (aspirational — simplify where practical)

### Out of Scope

- Client-facing logins — operator-only tool, insights shared verbally or via screenshots
- Multi-user/team access — single operator for now
- Google Ads API integration — Google Ads Scripts first, API later
- PDF/report export — live dashboard only for v1
- Manual CSV upload — scripts handle data ingestion
- Mobile app — web only
- Real-time data — daily refresh is sufficient

## Context

- **Operator:** Marketing manager running Google Ads for a handful of AU-based clients
- **Data flow:** Google Ads Script runs daily in each account, pushes structured data to the app's API endpoint
- **Creative formats:** RSAs (headlines + descriptions + combinations), PMax (asset groups), Display/Demand Gen (image formats), Video (YouTube)
- **Primary use case:** Monday morning review — open app, see what's changed, decide what to scale/pause/test
- **Client value:** Practical business insight into what customers respond to, not just ad metrics
- **Design reference:** CLAUDE.md contains a detailed design system and analysis framework — treat as aspirational, simplify where practical for v1
- **Hosting:** Vercel with custom domain brentneale.au
- **Tech stack:** Next.js 14 (App Router), Tailwind CSS, Recharts, TypeScript

## Constraints

- **Tech stack**: Next.js 14, Tailwind, Recharts, TypeScript — per CLAUDE.md
- **Deployment**: Vercel → brentneale.au
- **Data source**: Google Ads Scripts (not API) for v1
- **Locale**: AU English spelling, AUD currency formatting
- **Single operator**: No auth system needed for v1 — can add later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google Ads Scripts over API | Lower barrier to start, no OAuth flow needed, can upgrade later | — Pending |
| Single operator, no auth | Simplifies v1 massively, auth adds complexity with no immediate value | — Pending |
| Configurable KPI per account | Different clients optimise for CPA vs ROAS — must support both | — Pending |
| All creative formats in v1 | Operator works across RSA, PMax, Display, Video — partial coverage limits utility | — Pending |
| Live dashboard over PDF export | Operator prefers live view, shares insights verbally with clients | — Pending |

---
*Last updated: 2026-03-02 after initialization*
