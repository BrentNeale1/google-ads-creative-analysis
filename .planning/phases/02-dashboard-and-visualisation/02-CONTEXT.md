# Phase 2: Dashboard and Visualisation - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Operator can open the app, select an account, view key performance metrics (impressions, clicks, CTR, conversions, CPA/ROAS) with period-over-period comparison, filter by date range and campaign/ad group, and see creative performance in time-series line charts, horizontal bar charts, and sortable tables. RSA-specific analysis, tier classification, and recommendations belong in Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Single scrollable page (no tabs)
- KPI metric cards in a responsive card grid at the top
- Charts section below KPIs — line chart and bar chart side-by-side on desktop, stacking on tablet
- Full sortable data table at the bottom for drill-down
- Flow: KPIs → Charts → Table (top-down review workflow)

### Period comparison display
- Delta arrow + percentage change shown below the main value in each metric card (e.g., green up arrow "+12.3%" or red down arrow "-5.1%")
- Comparison period is the previous equivalent period (viewing last 7d compares to the 7d before that)
- Colour direction inverted for cost metrics: CPA decrease = green (good), CPA increase = red (bad); ROAS increase = green, ROAS decrease = red
- Comparison stays in metric cards only — charts show the selected period cleanly without overlay lines

### Chart behaviour
- Default metric on page load: conversions
- Metric selector tabs above each chart to switch between metrics (clicks, impressions, CTR, conversions, CPA/ROAS)
- Rich tooltips on hover showing date, metric value, and percentage of total, formatted to AU locale
- Charts are read-only — no click-to-filter interactions for v1
- Line chart for time-series trends, horizontal bar chart for creative comparisons (per CLAUDE.md chart rules)

### Filter and account UX
- Account selector lives in the left sidebar (existing app shell from Phase 1), always visible
- Horizontal filter bar sits below the header, above content — always visible
- Date range: preset buttons (7d, 30d, 90d) plus custom date range picker
- Campaign and ad group filters are cascading — selecting a campaign narrows the ad group dropdown to that campaign's ad groups only
- Filter state (account, date range, campaign, ad group) persisted in URL query params — bookmarkable, shareable, survives page refresh

### Claude's Discretion
- Exact card spacing, typography sizing, and responsive breakpoints
- Loading skeleton design while data fetches
- Empty state design when no data exists for selected filters
- Error state handling for failed API calls
- Custom date range picker implementation details
- Table pagination vs infinite scroll (if dataset is large)

</decisions>

<specifics>
## Specific Ideas

- Dashboard should feel like a weekly review tool — open it Monday morning, scan the KPIs, check the charts, dig into the table if something looks off
- Charts follow CLAUDE.md design system strictly: insight-led titles, bars sorted by value descending, data labels when < 10 items, no borders/3D/decoration, subtle gridlines
- All numbers AU locale: AUD $1,234.56, percentages to 1dp, K/M shorthand in charts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-and-visualisation*
*Context gathered: 2026-03-02*
