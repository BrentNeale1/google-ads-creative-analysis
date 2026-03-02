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
- [ ] **DASH-05**: User can sort tables by any metric column
- [x] **DASH-06**: All numbers formatted for AU locale (AUD $1,234.56, percentages to 1dp, K/M shorthand in charts)
- [x] **DASH-07**: Layout is responsive and usable on laptop and tablet

### Analysis — RSA

- [ ] **RSA-01**: Performance tier classification — top 20%, middle 60%, bottom 20% by primary KPI
- [ ] **RSA-02**: Primary KPI is configurable per account (CPA or ROAS)
- [ ] **RSA-03**: Top/bottom creative leaderboards sorted by performance
- [ ] **RSA-04**: RSA asset-level analysis (individual headline and description performance)
- [ ] **RSA-05**: RSA combination reporting (which headline+description pairings serve and convert)
- [ ] **RSA-06**: Underperformer diagnosis (low impressions, low CTR, low CVR, high CPA mapping)
- [ ] **RSA-07**: Pattern detection across top performers (copy themes, headline length, CTA type, numbers/stats)
- [ ] **RSA-08**: Keep/Test/Pause/Investigate recommendation framework per creative
- [ ] **RSA-09**: Insight-led chart titles computed from data ("Benefit-led headlines outperform by 34%")

### Analysis — PMax

- [ ] **PMAX-01**: Performance tier classification for PMax asset groups
- [ ] **PMAX-02**: Asset group performance leaderboard
- [ ] **PMAX-03**: Asset group theme analysis (creative theme vs performance)
- [ ] **PMAX-04**: Underperformer diagnosis for asset groups
- [ ] **PMAX-05**: Pattern detection across top-performing asset groups
- [ ] **PMAX-06**: Keep/Test/Pause/Investigate recommendations for asset groups

### Analysis — Display/Demand Gen

- [ ] **DISP-01**: Performance tier classification for display/demand gen creatives
- [ ] **DISP-02**: Creative leaderboard for display ads
- [ ] **DISP-03**: Format performance comparison (square vs landscape vs portrait)
- [ ] **DISP-04**: Underperformer diagnosis for display creatives
- [ ] **DISP-05**: Pattern detection across top-performing display creatives
- [ ] **DISP-06**: Keep/Test/Pause/Investigate recommendations for display

### Analysis — Video

- [ ] **VID-01**: Performance tier classification for video creatives
- [ ] **VID-02**: Video creative leaderboard
- [ ] **VID-03**: Video-specific metrics (view rate, watch time, VTR)
- [ ] **VID-04**: Underperformer diagnosis for video creatives
- [ ] **VID-05**: Pattern detection across top-performing videos
- [ ] **VID-06**: Keep/Test/Pause/Investigate recommendations for video

### Visualisation

- [ ] **VIS-01**: Time-series line charts showing creative performance trends
- [ ] **VIS-02**: Horizontal bar charts for creative comparisons (sorted by value descending)
- [x] **VIS-03**: Design system compliance (colour palette, chart rules, table rules per CLAUDE.md)
- [ ] **VIS-04**: Data labels on bar charts when fewer than 10 items
- [ ] **VIS-05**: Charts use subtle gridlines or none; no borders, no 3D effects

### Intelligence

- [ ] **INTL-01**: Gap analysis — identify untested creative angles and selling points
- [ ] **INTL-02**: Creative fatigue detection (performance declining over time)
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
| DASH-05 | Phase 2 | Pending |
| VIS-01 | Phase 2 | Pending |
| VIS-02 | Phase 2 | Pending |
| VIS-04 | Phase 2 | Pending |
| VIS-05 | Phase 2 | Pending |
| RSA-01 | Phase 3 | Pending |
| RSA-02 | Phase 3 | Pending |
| RSA-03 | Phase 3 | Pending |
| RSA-04 | Phase 3 | Pending |
| RSA-05 | Phase 3 | Pending |
| RSA-06 | Phase 3 | Pending |
| RSA-07 | Phase 3 | Pending |
| RSA-08 | Phase 3 | Pending |
| RSA-09 | Phase 3 | Pending |
| PMAX-01 | Phase 4 | Pending |
| PMAX-02 | Phase 4 | Pending |
| PMAX-03 | Phase 4 | Pending |
| PMAX-04 | Phase 4 | Pending |
| PMAX-05 | Phase 4 | Pending |
| PMAX-06 | Phase 4 | Pending |
| DISP-01 | Phase 4 | Pending |
| DISP-02 | Phase 4 | Pending |
| DISP-03 | Phase 4 | Pending |
| DISP-04 | Phase 4 | Pending |
| DISP-05 | Phase 4 | Pending |
| DISP-06 | Phase 4 | Pending |
| VID-01 | Phase 4 | Pending |
| VID-02 | Phase 4 | Pending |
| VID-03 | Phase 4 | Pending |
| VID-04 | Phase 4 | Pending |
| VID-05 | Phase 4 | Pending |
| VID-06 | Phase 4 | Pending |
| INTL-01 | Phase 4 | Pending |
| INTL-02 | Phase 4 | Pending |
| INTL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
