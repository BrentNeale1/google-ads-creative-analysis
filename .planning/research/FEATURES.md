# Feature Landscape

**Domain:** Google Ads Creative Performance Analysis Platform
**Researched:** 2026-03-02
**Confidence:** MEDIUM (training data only -- WebSearch unavailable; based on extensive pre-training coverage of Optmyzr, Adalysis, WordStream, Supermetrics, agency tooling patterns, and Google Ads ecosystem through May 2025)

---

## Competitive Context

The competitive set breaks into three tiers:

1. **Full PPC management suites** (Optmyzr, Adalysis, WordStream/LocaliQ) -- creative analysis is one module among many (bid management, budget pacing, keyword tools). They charge $200-800+/month and bundle creative analysis with broader account management.
2. **Reporting/BI platforms** (Supermetrics, Looker Studio, Databox) -- strong on data visualisation but zero creative intelligence. They surface numbers, not insights.
3. **Custom agency dashboards** -- typically Looker Studio + Google Sheets, sometimes with Apps Script automation. Powerful for the builder, fragile and hard to maintain.

This project sits in a unique niche: **creative-first intelligence** without the bloat of full PPC management or the dumbness of raw reporting. That positioning informs what's table stakes (what users expect from any analysis tool) vs. differentiating (what existing tools do poorly or not at all).

---

## Table Stakes

Features users expect from any creative analysis tool. Missing any of these means the product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-account data ingestion** | Operator manages 3-10 clients; single-account tools are useless | Medium | Google Ads Scripts push daily to API endpoint. Need schema validation, error handling, deduplication |
| **Account selector/switcher** | Must isolate client data and switch contexts quickly | Low | Dropdown or sidebar nav. Every competitor has this |
| **Performance metrics dashboard** | Users need at-a-glance health: impressions, clicks, CTR, conversions, CPA/ROAS | Medium | Time-series trends + summary cards. Recharts handles this well |
| **Date range selection** | Users compare periods (this week vs last, this month vs prior) | Medium | Preset ranges (7d, 30d, 90d) + custom picker. Period-over-period comparison is expected |
| **Performance tier classification** | Top/middle/bottom segmentation is how every PPC manager thinks | Medium | Top 20% / middle 60% / bottom 20% by primary KPI. Configurable KPI (CPA or ROAS) per account |
| **Top/bottom creative leaderboards** | "Show me my best and worst ads" is the #1 question | Low | Sorted tables with performance labels. Horizontal bar charts for visual comparison |
| **RSA asset-level analysis** | RSAs are the dominant Search ad format; asset-level performance is table stakes | High | Must show headline and description performance individually. Google provides asset ratings (Best/Good/Low) plus impression and conversion data |
| **RSA combination reporting** | Users need to see which headline+description pairings actually serve and convert | High | Google's combination reports are notoriously limited. Parsing serving frequency and performance per combination is complex but expected |
| **Campaign-type-specific views** | RSAs, PMax, Display, Video each have different creative structures | High | Four distinct analysis UIs. PMax has asset groups; Display has format dimensions; Video has view metrics. Cannot treat them identically |
| **Metric formatting (AU locale)** | AUD currency, AU number formatting, percentages to 1dp | Low | Per CLAUDE.md: $1,234.56 AUD, 3.2%, K/M shorthand in charts |
| **Data freshness indicator** | Users need to know when data was last updated | Low | "Last synced: [timestamp]" per account. Builds trust |
| **Basic filtering and sorting** | Filter by campaign, ad group, date range; sort by any metric | Medium | Standard table interactions. Every reporting tool has this |
| **Responsive web layout** | Operator may check on tablet or laptop; must work on both | Medium | Tailwind responsive utilities. Not mobile-first but must not break on smaller screens |

---

## Differentiators

Features that set this product apart from existing tools. These are what make it worth building rather than just using Looker Studio.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Pattern detection across top performers** | Automatically identifies WHY top ads work -- copy themes (urgency, social proof, benefit-led), structural patterns (headline length, CTA type, numbers in copy), audience signals. Optmyzr and Adalysis flag winners but rarely explain patterns | High | NLP/heuristic analysis of ad copy. Categorise headlines by theme (benefit-led, feature-led, urgency, social proof, price-anchored). Detect structural signals (character count, punctuation, numbers). Cross-reference with performance tiers |
| **Underperformer diagnosis framework** | Not just "this ad is bad" but WHY it's bad: low impressions = not serving (ad strength?), high impressions + low CTR = creative not resonating, high CTR + low CVR = landing page disconnect, high CPA = wrong audience. No competitor does this systematically | Medium | Decision tree based on metric thresholds. Map each underperformer to a diagnosis category with specific recommended action |
| **Gap analysis -- untested creative angles** | Identifies selling points, themes, and formats the operator has NOT tested yet. "You have no urgency-driven headlines for Client X" or "No video ads for Campaign Y". Competitors show what exists; this shows what's missing | High | Requires a taxonomy of creative angles/selling points. Compare what's been tested against the taxonomy. Surface gaps as opportunities |
| **AI-generated creative recommendations** | Draft ready-to-use headlines and descriptions based on winning patterns. "Your top performers use benefit-led headlines with numbers. Here are 5 new headlines in that style." Goes beyond "test more" to "test THIS specifically" | High | LLM integration (likely OpenAI API or Anthropic). Needs winning patterns as context, brand voice from existing top performers, Google Ads character limits as constraints. Must produce usable copy, not generic suggestions |
| **Keep/Test/Pause/Investigate framework** | Every analysis ends with clear, prioritised actions. Not just data -- decisions. Adalysis has pause recommendations but lacks the full framework | Medium | Algorithmic classification: Keep (top tier, maintain), Test (new hypotheses from patterns), Pause (bottom tier with clear replacements), Investigate (mixed signals needing more data) |
| **Insight-led chart titles** | Charts that tell you the finding, not just the metric. "Benefit-led headlines outperform by 34%" not "CTR by Headline Type". No competitor does this; it's a significant UX differentiator | Medium | Requires computing the insight before rendering the chart. Titles generated from data analysis, not static labels |
| **Selling point taxonomy per client** | Track which selling points (price, quality, speed, trust, etc.) have been tested for each client, and how each performs. Builds a knowledge base over time | High | Need a tagging/categorisation system. Could be manual initially, AI-assisted later. Creates compounding value -- the tool gets smarter the longer you use it |
| **Cross-client pattern insights** | "Urgency-driven CTAs work well across 3 of your 4 clients" -- patterns that emerge across the portfolio, not just within single accounts | Medium | Aggregate pattern analysis across accounts. Only possible when you manage multiple accounts in one tool. Agencies would love this |
| **Creative fatigue detection** | Identify ads whose performance is declining over time -- they may have been top performers but are now fatiguing. "Ad X CTR dropped 25% over 30 days despite stable impressions" | Medium | Time-series trend analysis per creative. Detect statistically significant declines. Flag before performance craters |
| **PMax asset group theme analysis** | Analyse PMax asset groups by creative theme rather than just raw metrics. PMax's black-box nature means creative themes are the main lever operators have | Medium | Group assets by theme, compare theme-level performance. PMax-specific analysis that most tools treat as an afterthought |
| **Monday morning briefing view** | A single-screen summary designed for the weekly review use case: what changed, what needs attention, what to do. Purpose-built for the operator's workflow | Medium | Combines alerts (significant changes), top/bottom movers, and prioritised actions into one view. Not a generic dashboard -- a briefing |

---

## Anti-Features

Features to explicitly NOT build. These would add complexity, dilute focus, or move the product away from its core value proposition.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Bid management / budget pacing** | Scope creep into full PPC management. Optmyzr and Google's own tools do this well. Building it would take months and distract from creative intelligence | Stay focused on creative analysis. If users want bid management, they use Optmyzr alongside this tool |
| **Keyword research/management** | Not a creative feature. Different domain entirely. Google Keyword Planner and SEMrush own this | Out of scope permanently. Creative-only tool |
| **Client-facing login portal** | Adds auth complexity, multi-tenant security, permissions. Operator shares insights verbally or via screenshots. Per PROJECT.md: explicitly out of scope | Single-operator tool. Add auth only if/when the product expands to multi-user |
| **PDF/report export** | Per PROJECT.md: live dashboard only for v1. PDF generation is surprisingly complex (layout, pagination, chart rendering to static images) and the operator doesn't need it | Screenshots for now. Revisit only if client demand materialises |
| **Google Ads API direct integration** | Per PROJECT.md: Google Ads Scripts first. API requires OAuth, credential management, rate limiting, and a Google Ads Developer Token application process that can take weeks | Google Ads Scripts push data to API endpoint. Simpler, faster, and sufficient for 3-10 accounts |
| **Real-time data / live sync** | Daily refresh is sufficient for creative analysis. Real-time adds WebSocket complexity, higher API costs, and encourages micro-optimisation that hurts creative strategy | Daily batch via Google Ads Scripts. "Last synced" timestamp gives transparency |
| **A/B test statistical engine** | Formal A/B testing with statistical significance requires controlled experiments. Google Ads doesn't run true A/B tests on creatives (it optimises serving dynamically). Building a stat engine for non-controlled data misleads users | Use directional performance analysis with volume thresholds. Flag when sample sizes are too small for conclusions rather than pretending statistical rigour exists |
| **Automated ad pausing/activation** | Write-back to Google Ads requires API access and carries risk. An analysis tool should recommend actions, not take them | Always recommend, never automate. Operator reviews and acts in Google Ads UI |
| **Landing page analysis** | Requires crawling client websites, which is a different product. Landing page performance is inferred from CVR data, not measured directly | Diagnose landing page issues via CVR patterns ("high CTR + low CVR = likely landing page disconnect") without actually analysing the page |
| **Competitor creative analysis** | Would require scraping Google Ads auction insights or third-party data. Different product entirely (SpyFu, SEMrush territory) | Focus on first-party performance data. Competitor analysis is a separate tool |
| **Mobile app** | Per PROJECT.md: web only. The weekly review workflow happens on a laptop. Mobile adds platform complexity with minimal benefit | Responsive web design covers tablet use cases |

---

## Feature Dependencies

```
Data Ingestion (Scripts API endpoint)
  |
  +---> Schema Validation & Normalisation
  |       |
  |       +---> Account Selector
  |       |
  |       +---> Date Range Selection
  |       |
  |       +---> Performance Metrics Dashboard
  |               |
  |               +---> Performance Tier Classification (requires metrics + configurable KPI)
  |               |       |
  |               |       +---> Top/Bottom Leaderboards
  |               |       |
  |               |       +---> Underperformer Diagnosis (requires tiers + metric thresholds)
  |               |       |
  |               |       +---> Keep/Test/Pause/Investigate Framework (requires tiers + diagnosis)
  |               |
  |               +---> Campaign-Type Views (RSA, PMax, Display, Video)
  |               |       |
  |               |       +---> RSA Asset-Level Analysis
  |               |       |       |
  |               |       |       +---> RSA Combination Reporting
  |               |       |
  |               |       +---> PMax Asset Group Theme Analysis
  |               |       |
  |               |       +---> Display Format Performance
  |               |       |
  |               |       +---> Video Creative Performance
  |               |
  |               +---> Time-Series Trend Charts
  |                       |
  |                       +---> Creative Fatigue Detection (requires trend data)
  |
  +---> Pattern Detection (requires tier classification + copy analysis)
          |
          +---> Gap Analysis (requires pattern taxonomy)
          |
          +---> AI Creative Recommendations (requires patterns + gap analysis)
          |
          +---> Cross-Client Pattern Insights (requires patterns across accounts)
          |
          +---> Insight-Led Chart Titles (requires computed insights)
          |
          +---> Monday Morning Briefing (requires all above)

Selling Point Taxonomy (semi-independent, can start manual)
  |
  +---> Gap Analysis (enriched by taxonomy)
  +---> AI Recommendations (informed by taxonomy)
```

Key dependency chains:

1. **Nothing works without data ingestion** -- the Scripts API endpoint is the foundation
2. **Tier classification gates all analysis** -- leaderboards, diagnosis, recommendations all need tiers
3. **Pattern detection gates intelligence features** -- gap analysis, AI recommendations, and cross-client insights all need patterns identified first
4. **Campaign-type views are parallel** -- RSA, PMax, Display, and Video analysis can be built independently
5. **Monday morning briefing is the capstone** -- it synthesises everything else

---

## MVP Recommendation

### Must ship in v1 (table stakes + minimum viable differentiation):

1. **Data ingestion from Google Ads Scripts** -- the foundation; nothing else works without it
2. **Multi-account support with account selector** -- operator manages multiple clients
3. **Performance metrics dashboard with date ranges** -- basic visibility
4. **Performance tier classification** -- the core analytical lens
5. **Top/bottom leaderboards** -- the #1 thing users look for
6. **RSA asset-level analysis** -- RSAs are the dominant ad format
7. **Underperformer diagnosis** -- the first real differentiator; turns data into actionable insight
8. **Keep/Test/Pause/Investigate framework** -- makes every analysis end with a decision
9. **Pattern detection (basic)** -- even simple heuristic pattern detection (headline length, theme classification by keyword matching) differentiates from Looker Studio

### Defer to v2:

- **AI-generated creative recommendations** -- high complexity, requires LLM integration, and pattern detection needs to be solid first. Ship pattern detection in v1, AI recommendations in v2
- **Gap analysis** -- requires a selling point taxonomy which needs time to develop. Start with manual tags in v1, build gap analysis on top in v2
- **Cross-client pattern insights** -- needs enough data and pattern maturity across accounts
- **Selling point taxonomy** -- start simple/manual in v1, systematise in v2
- **Creative fatigue detection** -- needs 30+ days of time-series data before it's useful; can ship after launch
- **Monday morning briefing view** -- the capstone; ship after individual components are solid

### Defer to v3+:

- **PMax, Display, Video analysis** -- controversial call, but RSAs are the primary format. Ship RSA analysis well in v1, add other formats in v2-v3. Per PROJECT.md all formats are in scope, but phasing is smarter than shipping four mediocre analyses at once
- **Cross-client insights** -- needs data maturity and pattern confidence

**Rationale:** Ship a tool that's exceptional for RSA creative analysis with real intelligence features (diagnosis, patterns, action framework) rather than a tool that superficially covers all four creative formats. Depth beats breadth for v1 credibility.

**Counter-argument from PROJECT.md:** The project requirements list all creative formats in v1 ("All creative formats in v1 -- partial coverage limits utility"). This is a valid concern. If the operator truly needs all four formats from day one, then ship basic metrics views for PMax/Display/Video alongside the deeper RSA analysis, and add intelligence features to each format incrementally. The key insight: intelligence features (pattern detection, diagnosis, recommendations) can start RSA-only even if basic metrics views cover all formats.

---

## Complexity Estimates Summary

| Feature | Complexity | Effort Driver |
|---------|------------|---------------|
| Data ingestion API endpoint | Medium | Schema design, validation, error handling, deduplication |
| Account selector | Low | UI component, data filtering |
| Performance dashboard | Medium | Multiple metrics, time-series charts, summary cards |
| Date range selection | Medium | Preset + custom ranges, period-over-period calculation |
| Tier classification | Medium | Percentile calculation, configurable KPI, re-classification on filter change |
| Leaderboards | Low | Sorted tables with conditional formatting |
| RSA asset analysis | High | Multiple data dimensions (asset level + combination level + ratings) |
| RSA combination reporting | High | Complex data structure, Google's limited combination data |
| Pattern detection | High | NLP/heuristics for copy analysis, theme classification, structural pattern extraction |
| Underperformer diagnosis | Medium | Decision tree logic, threshold configuration |
| Keep/Test/Pause/Investigate | Medium | Classification algorithm, presentation as prioritised action list |
| Gap analysis | High | Taxonomy definition, coverage mapping, opportunity scoring |
| AI creative recommendations | High | LLM integration, prompt engineering, character limit constraints, brand voice matching |
| Creative fatigue detection | Medium | Time-series trend analysis, statistical decline detection |
| PMax asset group analysis | Medium | Different data structure from RSAs, theme grouping |
| Display format analysis | Medium | Format dimensions (size, type), visual performance comparison |
| Video analysis | Medium | View metrics (VTR, watch time), different KPI structure |
| Selling point taxonomy | High | Categorisation system, tagging UI, evolving taxonomy |
| Cross-client insights | Medium | Aggregation across accounts, pattern comparison |
| Monday morning briefing | Medium | Synthesis of multiple data sources into single view |
| Insight-led chart titles | Medium | Computing findings before rendering, dynamic title generation |

---

## Sources

- Training data on Optmyzr features (creative analysis, rule engine, ad testing tools) -- MEDIUM confidence
- Training data on Adalysis features (ad testing, RSA analysis, creative recommendations) -- MEDIUM confidence
- Training data on WordStream/LocaliQ Performance Grader -- MEDIUM confidence
- Training data on Google Ads Scripts capabilities and limitations -- HIGH confidence (well-documented, stable API)
- Training data on Google Ads RSA combination reporting limitations -- HIGH confidence (widely documented limitation)
- Training data on PMax asset group reporting structure -- MEDIUM confidence
- Project context from PROJECT.md and CLAUDE.md -- HIGH confidence (first-party)

**Note:** WebSearch was unavailable during this research session. All competitive analysis is based on training data (through May 2025). Feature sets of Optmyzr, Adalysis, and WordStream may have evolved since then. Recommend validating competitive positioning with current product pages before finalising roadmap. Core feature categorisation (table stakes vs differentiators) is likely stable as the fundamental user needs in this domain have not changed significantly.
