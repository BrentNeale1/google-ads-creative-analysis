# Requirements: Google Ads Creative Analyser

**Defined:** 2026-03-02
**Core Value:** Surface what's working, what's not, and what to test next — so every creative decision is backed by performance data rather than gut feel.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Ingestion

- [x] **DATA-01**: Google Ads Script pushes creative performance data daily to app API endpoint
- [x] **DATA-02**: App supports 3-10 Google Ads accounts with isolated data per account
- [x] **DATA-03**: Ingestion API validates incoming data schema and rejects malformed payloads
- [x] **DATA-04**: App displays data freshness indicator per account (last synced timestamp)
- [x] **DATA-05**: Append-only time-series storage enables date-range queries and period comparisons

### Dashboard

- [x] **DASH-01**: User can switch between client accounts via account selector
- [x] **DASH-02**: Performance overview shows key metrics (impressions, clicks, CTR, conversions, CPA/ROAS)
- [x] **DASH-03**: User can select date ranges (7d, 30d, 90d presets + custom range)
- [x] **DASH-04**: User can filter by campaign and ad group
- [x] **DASH-05**: User can sort tables by any metric column
- [x] **DASH-06**: All numbers formatted for AU locale (AUD $1,234.56, percentages to 1dp, K/M shorthand in charts)
- [x] **DASH-07**: Layout is responsive and usable on laptop and tablet

### Analysis — RSA

- [x] **RSA-01**: Performance tier classification — top 20%, middle 60%, bottom 20% by primary KPI
- [x] **RSA-02**: Primary KPI is configurable per account (CPA or ROAS)
- [x] **RSA-03**: Top/bottom creative leaderboards sorted by performance
- [x] **RSA-04**: RSA asset-level analysis (individual headline and description performance)
- [x] **RSA-05**: RSA combination reporting (which headline+description pairings serve and convert)
- [x] **RSA-06**: Underperformer diagnosis (low impressions, low CTR, low CVR, high CPA mapping)
- [x] **RSA-07**: Pattern detection across top performers (copy themes, headline length, CTA type, numbers/stats)
- [x] **RSA-08**: Keep/Test/Pause/Investigate recommendation framework per creative
- [x] **RSA-09**: Insight-led chart titles computed from data ("Benefit-led headlines outperform by 34%")

### Analysis — PMax

- [x] **PMAX-01**: Performance tier classification for PMax asset groups
- [x] **PMAX-02**: Asset group performance leaderboard
- [x] **PMAX-03**: Asset group theme analysis (creative theme vs performance)
- [x] **PMAX-04**: Underperformer diagnosis for asset groups
- [x] **PMAX-05**: Pattern detection across top-performing asset groups
- [x] **PMAX-06**: Keep/Test/Pause/Investigate recommendations for asset groups

### Analysis — Display/Demand Gen

- [x] **DISP-01**: Performance tier classification for display/demand gen creatives
- [x] **DISP-02**: Creative leaderboard for display ads
- [x] **DISP-03**: Format performance comparison (square vs landscape vs portrait)
- [x] **DISP-04**: Underperformer diagnosis for display creatives
- [x] **DISP-05**: Pattern detection across top-performing display creatives
- [x] **DISP-06**: Keep/Test/Pause/Investigate recommendations for display

### Analysis — Video

- [x] **VID-01**: Performance tier classification for video creatives
- [x] **VID-02**: Video creative leaderboard
- [x] **VID-03**: Video-specific metrics (view rate, watch time, VTR)
- [x] **VID-04**: Underperformer diagnosis for video creatives
- [x] **VID-05**: Pattern detection across top-performing videos
- [x] **VID-06**: Keep/Test/Pause/Investigate recommendations for video

### Visualisation

- [x] **VIS-01**: Time-series line charts showing creative performance trends
- [x] **VIS-02**: Horizontal bar charts for creative comparisons (sorted by value descending)
- [x] **VIS-03**: Design system compliance (colour palette, chart rules, table rules per CLAUDE.md)
- [x] **VIS-04**: Data labels on bar charts when fewer than 10 items
- [x] **VIS-05**: Charts use subtle gridlines or none; no borders, no 3D effects

### Intelligence

- [x] **INTL-01**: Gap analysis — identify untested creative angles and selling points
- [x] **INTL-02**: Creative fatigue detection (performance declining over time)
- [ ] **INTL-03**: Monday morning briefing view (what changed, what needs attention, what to do)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Creative Generation

- **AIGEN-01**: AI-generated headline drafts based on winning patterns
- **AIGEN-02**: AI-generated description drafts respecting character limits
- **AIGEN-03**: Brand voice matching from existing top performers

### Advanced Intelligence

- **ADVINT-01**: Cross-client pattern insights ("urgency works across 3 of 4 clients")
- **ADVINT-02**: Selling point taxonomy per client (systematic tracking of tested angles)
- **ADVINT-03**: AI-assisted copy theme classification (replace heuristics with LLM)

### Platform

- **PLAT-01**: Client-facing login portal with per-account access
- **PLAT-02**: PDF/report export
- **PLAT-03**: Google Ads API direct integration (replace Scripts)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bid management / budget pacing | Scope creep into full PPC management; Optmyzr does this well |
| Keyword research/management | Different domain entirely; not a creative feature |
| Automated ad pausing/activation | Analysis tool recommends, never automates; requires API write access |
| A/B test statistical engine | Google Ads doesn't run controlled creative tests; would mislead users |
| Landing page analysis | Requires website crawling; infer from CVR patterns instead |
| Competitor creative analysis | Requires third-party data scraping; different product (SpyFu territory) |
| Real-time data / live sync | Daily refresh sufficient for creative analysis; reduces complexity |
| Mobile app | Web-only; weekly review happens on laptop |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| DASH-06 | Phase 1 | Complete |
| DASH-07 | Phase 1 | Complete |
| VIS-03 | Phase 1 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| DASH-05 | Phase 2 | Complete |
| VIS-01 | Phase 2 | Complete |
| VIS-02 | Phase 2 | Complete |
| VIS-04 | Phase 2 | Complete |
| VIS-05 | Phase 2 | Complete |
| RSA-01 | Phase 3 | Complete |
| RSA-02 | Phase 3 | Complete |
| RSA-03 | Phase 3 | Complete |
| RSA-04 | Phase 3 | Complete |
| RSA-05 | Phase 3 | Complete |
| RSA-06 | Phase 3 | Complete |
| RSA-07 | Phase 3 | Complete |
| RSA-08 | Phase 3 | Complete |
| RSA-09 | Phase 3 | Complete |
| PMAX-01 | Phase 4 | Complete |
| PMAX-02 | Phase 4 | Complete |
| PMAX-03 | Phase 4 | Complete |
| PMAX-04 | Phase 4 | Complete |
| PMAX-05 | Phase 4 | Complete |
| PMAX-06 | Phase 4 | Complete |
| DISP-01 | Phase 4 | Complete |
| DISP-02 | Phase 4 | Complete |
| DISP-03 | Phase 4 | Complete |
| DISP-04 | Phase 4 | Complete |
| DISP-05 | Phase 4 | Complete |
| DISP-06 | Phase 4 | Complete |
| VID-01 | Phase 4 | Complete |
| VID-02 | Phase 4 | Complete |
| VID-03 | Phase 4 | Complete |
| VID-04 | Phase 4 | Complete |
| VID-05 | Phase 4 | Complete |
| VID-06 | Phase 4 | Complete |
| INTL-01 | Phase 4 | Complete |
| INTL-02 | Phase 4 | Complete |
| INTL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
