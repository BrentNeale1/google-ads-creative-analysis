# Domain Pitfalls

**Domain:** Google Ads Creative Performance Analysis Platform
**Researched:** 2026-03-02
**Overall Confidence:** MEDIUM (based on training data; web search unavailable for verification of latest API/reporting changes)

---

## Critical Pitfalls

Mistakes that cause rewrites, bad recommendations, or fundamental data integrity issues.

---

### Pitfall 1: RSA Combination Reporting Does Not Give You What You Think

**What goes wrong:** Builders assume Google reports performance data for every headline+description combination an RSA served. In reality, Google only reports the *top combinations* and rolls everything else into aggregate metrics. The `ad_group_ad_asset_view` resource gives per-asset metrics (impressions, clicks, conversions for each headline or description individually), but the *combination* report (`ad_group_ad_asset_combination_view`) only surfaces combinations that served frequently enough for Google to report. You will never see a complete matrix of "headline X + description Y = Z conversions."

**Why it happens:** Google assembles RSA combinations dynamically and does not persist per-impression combination data at the granularity analysts want. The combination report is a convenience summary, not a complete dataset.

**Consequences:**
- Building a "combination performance matrix" that shows gaps (missing combos) and treating missing = bad. Missing just means unreported.
- Overfitting recommendations to the few combinations Google surfaces, which are already the ones Google favoured in its own auction-time model.
- Circular reasoning: "This combo performs best" when Google already biased serving toward it.

**Prevention:**
- Design the analysis layer to clearly separate **asset-level analysis** (each headline's aggregate performance) from **combination-level analysis** (sparse, directional only).
- Never present combination data as exhaustive. UI should indicate "Top combinations reported by Google" not "All combination performance."
- Use asset-level metrics as the primary analytical signal. Treat combination data as supplementary/directional.
- In the database schema, store asset-level and combination-level data in separate tables with different confidence annotations.

**Detection (warning signs):**
- Combination data covers less than 30% of total ad impressions when summed.
- Users/operator asking "why doesn't this headline appear in any combination?" when it clearly has impressions.

**Phase relevance:** Data ingestion and schema design (Phase 1-2). Must be right from the start or the entire analysis layer builds on false assumptions.

**Confidence:** HIGH -- this is well-documented Google Ads behaviour that has been consistent for years.

---

### Pitfall 2: Google Ads Scripts Execution Limits and Silent Failures

**What goes wrong:** Google Ads Scripts have hard execution time limits (30 minutes for MCC-level scripts, 30 minutes for account-level scripts) and daily quota limits on API calls within scripts. For accounts with hundreds of ad groups and thousands of assets, a naive script that iterates row-by-row through `AdsApp.report()` results can hit these limits. When it does, the script silently stops -- no error thrown to your endpoint, just incomplete data.

**Why it happens:** Developers test scripts on small accounts with 5-10 campaigns and assume linear scalability. A client account with 50+ campaigns, 200+ ad groups, and thousands of RSA assets produces GAQL report results far larger than test environments.

**Consequences:**
- Partial data ingestion where the script pushed data for campaigns A-M but silently dropped N-Z.
- Dashboard shows "performance declined" because half the account's data is missing, not because performance actually changed.
- Intermittent failures that are hard to reproduce: works fine Monday (light load), fails Thursday (heavy load after weekly optimisations).

**Prevention:**
- Design scripts with **chunked execution**: break data pulls into campaign-level or date-range chunks, each making a separate HTTP POST to the endpoint.
- Implement a **manifest/completeness check**: the script sends a final "sync complete" signal with expected record counts. The app compares received vs expected and flags incomplete syncs.
- Add a **data freshness indicator** on the dashboard: "Last complete sync: [timestamp]. Records received: X of Y expected."
- Set up script error logging: use `UrlFetchApp` to POST error details to a separate logging endpoint if the script catches an exception.
- Consider using MCC-level scripts that iterate accounts one at a time rather than one mega-script per account.

**Detection (warning signs):**
- Day-over-day record count drops by more than 10% without a corresponding account change.
- Certain campaigns consistently missing from recent data.
- Script execution logs (viewable in Google Ads) showing "Exceeded maximum execution time."

**Phase relevance:** Data ingestion (Phase 1). The script design and endpoint design must handle this from day one.

**Confidence:** HIGH -- Google Ads Scripts execution limits are well-documented and commonly encountered.

---

### Pitfall 3: Statistical Significance Theatre with Low-Volume Creatives

**What goes wrong:** The platform presents CTR/CPA/ROAS comparisons between creatives that have wildly different impression volumes. A headline with 50 impressions and 5 clicks (10% CTR) gets ranked above a headline with 5,000 impressions and 350 clicks (7% CTR). The small-sample headline is noise, not signal, but the tool presents it as a "top performer."

**Why it happens:** Most analysis tools sort by metric value without considering sample size. Building proper statistical confidence intervals is hard and most creative analysis tools skip it.

**Consequences:**
- Operator pauses a reliable workhorse creative in favour of a flash-in-the-pan with 2 days of data.
- Recommendations are unstable: the "top performer" changes every refresh because low-volume creatives bounce around.
- Loss of trust in the tool when last week's "top performer" is this week's "underperformer."

**Prevention:**
- Implement a **minimum threshold filter**: creatives below a configurable minimum (e.g., 100 impressions, 1000 impressions) are excluded from tier classification or shown in a separate "Insufficient Data" category.
- Use **confidence-weighted ranking**: instead of raw CTR, rank by the lower bound of a Wilson score interval or Bayesian estimate. This naturally penalises low-sample items.
- Display **sample size prominently** next to every metric. A bar chart of CTR should show impression count as a secondary annotation.
- In the tier classification (top 20% / middle / bottom 20%), only include creatives that meet the minimum data threshold.
- Show a "Data Maturity" indicator: "Reliable" (>1000 impressions), "Emerging" (100-1000), "Too Early" (<100).

**Detection (warning signs):**
- "Top performer" list changes dramatically week to week.
- Top performers have 10x fewer impressions than the portfolio average.
- Operator makes a change based on tool recommendation, performance does not improve.

**Phase relevance:** Analysis logic (Phase 2-3). Must be designed into the analysis framework, not bolted on later.

**Confidence:** HIGH -- this is a universal analytics pitfall, extremely well-understood.

---

### Pitfall 4: PMax Asset Group Data is a Black Box (and Pretending Otherwise Misleads)

**What goes wrong:** Performance Max campaigns give you asset group-level metrics and individual asset performance ratings (Low/Good/Best), but Google controls which assets are assembled into which creative, on which channel (Search, Display, YouTube, Discover, Gmail, Maps), and to which audience. The platform tries to build the same granular analysis for PMax as for RSAs and ends up presenting misleading specificity.

**Why it happens:** Developers want feature parity across campaign types. RSA analysis has headline-level metrics, so PMax analysis "should too." But PMax assets serve across fundamentally different surfaces and Google does not break down "this image got X clicks on YouTube and Y clicks on Display."

**Consequences:**
- Presenting PMax asset "performance" as if the operator can control the creative assembly (they cannot -- Google assembles it).
- Misleading recommendations like "pause this image" when Google may be using it successfully on a channel the tool cannot see.
- False equivalence between RSA asset metrics (somewhat actionable) and PMax asset ratings (opaque signals).

**Prevention:**
- Design PMax analysis as a **separate, explicitly limited module** with its own UI section and clear caveats.
- PMax analysis should focus on: asset group-level performance trends, which asset groups are scaling vs declining, asset ratings (Low/Good/Best) as directional signals only, and theme/messaging analysis across asset groups.
- Never present PMax data in the same tables/charts as RSA data without clear labelling of the different confidence levels.
- Include a persistent UI note: "PMax creative assembly is controlled by Google. Asset-level insights are directional only."
- Focus PMax recommendations on **what to add/remove from asset groups** rather than **which specific asset is performing**, since Google decides assembly.

**Detection (warning signs):**
- Users asking "why did Google rate this image as Best but it has low conversions?" (answer: ratings are relative within the asset group, not absolute).
- PMax "top performers" not correlating with actual conversion data at the asset group level.

**Phase relevance:** Campaign-type-specific analysis (Phase 3). Can be deferred after RSA analysis is solid, but architecture must plan for the different data model from the start.

**Confidence:** HIGH -- PMax's limited reporting is one of the most discussed issues in the Google Ads community.

---

### Pitfall 5: Google Ads Scripts GAQL Reporting Schema Changes Without Warning

**What goes wrong:** Google periodically updates the Google Ads Query Language (GAQL) schema -- deprecating fields, renaming resources, changing metric calculations, or altering how segmentation works. A script that worked perfectly for 6 months suddenly returns empty results or errors because a field was deprecated in favour of a new one.

**Why it happens:** Google Ads API versions have a defined deprecation lifecycle (typically ~12 months), but Google Ads Scripts do not always map cleanly to a specific API version. Scripts use `AdsApp.report()` which uses GAQL under the hood, but the available fields and their behaviour can shift with Google's internal updates.

**Consequences:**
- Complete data pipeline breakage with no warning in the app -- the script just stops sending data or sends malformed data.
- Subtle data corruption: a metric calculation changes (e.g., how view-through conversions are counted) and historical vs current data is no longer comparable.
- Time-series charts show a false "performance cliff" that is actually a reporting methodology change.

**Prevention:**
- **Version-pin your GAQL queries** where possible and document exactly which fields and resources you depend on.
- Implement **schema validation** on the ingestion endpoint: reject payloads that do not match the expected shape and alert the operator.
- Store **raw ingested data** separately from processed/analysed data. If a schema change corrupts processing, you can re-process from raw data.
- Build a **data health dashboard** visible to the operator: "Last successful sync per account", "Record count trends", "Schema validation errors."
- Subscribe to the Google Ads API changelog and Google Ads Scripts blog for deprecation notices.
- Design the script data contract as a **versioned schema** (e.g., `"schema_version": "1.0"`) so the app can handle old vs new formats gracefully.

**Detection (warning signs):**
- Sudden drop in record counts with no account-level changes.
- New `null` values appearing in fields that were previously always populated.
- GAQL query errors in the Scripts execution log.

**Phase relevance:** Data ingestion architecture (Phase 1). Schema validation and versioning must be designed upfront.

**Confidence:** MEDIUM -- the general pattern is well-known, but specific timing of future changes cannot be predicted. The mitigation strategy is sound regardless.

---

## Moderate Pitfalls

---

### Pitfall 6: Conflating CTR with Creative Quality

**What goes wrong:** The analysis engine treats CTR as the primary creative quality signal. High CTR creatives get labelled "top performers" even when they drive low-quality traffic (high bounce rate, low conversion rate, high CPA). Benefit-led headlines like "Free Shipping on Everything" may get exceptional CTR but attract bargain hunters who never convert.

**Prevention:**
- Primary KPI for tier classification must be a **conversion-based metric** (CPA or ROAS) as specified in PROJECT.md, with CTR as a secondary signal.
- Implement the underperformer diagnosis matrix from CLAUDE.md: High CTR + Low CVR = "ad/landing page disconnect or wrong audience" -- this is the key signal to surface.
- Always show CTR *alongside* conversion metrics, never in isolation.
- When the operator configures the primary KPI per account, enforce that it must be CPA or ROAS, not CTR.

**Detection (warning signs):**
- "Top performers" by CTR show poor CPA/ROAS when you cross-reference.
- Recommendations to "scale" high-CTR creatives lead to budget waste.

**Phase relevance:** Analysis framework design (Phase 2).

**Confidence:** HIGH.

---

### Pitfall 7: Time-Period Comparison Traps (Seasonality and Spend Changes)

**What goes wrong:** The dashboard shows "this headline's CPA improved by 30% this week" without accounting for the fact that the advertiser doubled their budget, changed bidding strategy, or it is a seasonal period (Black Friday, EOFY in Australia). The "improvement" is attributed to the creative when it is actually an external factor.

**Prevention:**
- Always show **absolute metrics alongside changes**: "CPA $45 (was $65)" not just "-30%."
- Include **impression volume context** with every trend: if impressions doubled, the "improvement" may be a spend/bidding change.
- Consider a "portfolio context" approach: show how the creative performed **relative to the account average** in the same period, not just relative to its own history.
- Flag periods where account-level metrics shifted dramatically (>20% impression volume change) with a visual indicator.
- For EOFY (June in Australia) and holiday periods, consider adding optional date annotations.

**Detection (warning signs):**
- All creatives in an account show similar performance shifts in the same direction at the same time (account-level change, not creative-level).
- "Improvements" that reverse immediately after a budget/bid change reverts.

**Phase relevance:** Dashboard and charting (Phase 2-3).

**Confidence:** HIGH.

---

### Pitfall 8: Multi-Format Creative Comparison is Apples to Oranges

**What goes wrong:** The platform tries to rank RSA headlines, display image ads, and YouTube video ads in a single leaderboard. A YouTube TrueView ad with a 0.5% CTR is "underperforming" compared to a search RSA with 8% CTR, but that comparison is meaningless -- they serve in completely different contexts with different expected baselines.

**Prevention:**
- **Never mix campaign types in the same comparison charts/tables.** RSAs, PMax, Display, and Video each get their own analysis section.
- If you want a cross-format view, compare each creative against its **format-specific benchmark** (e.g., "this display ad's CTR is 120% of your display portfolio average").
- Tier classification (top/middle/bottom 20%) must be calculated **within each campaign type**, not across the whole account.
- The "Creative Patterns" section can synthesise themes across formats ("benefit-led messaging works across RSAs and display") but should not compare raw metrics across formats.

**Detection (warning signs):**
- All video assets appearing in the "underperformer" list.
- All search assets appearing in the "top performer" list.
- Operator confused by seemingly contradictory recommendations.

**Phase relevance:** Architecture and analysis framework (Phase 2). The data model must segment by campaign type from the start.

**Confidence:** HIGH.

---

### Pitfall 9: Google Ads Scripts UrlFetchApp Payload Size Limits

**What goes wrong:** Google Ads Scripts use `UrlFetchApp.fetch()` to POST data to external endpoints. There is a payload size limit (approximately 10MB per request, though exact limits are not always clearly documented and may vary). A large account's daily data dump -- especially if including all RSA assets, combinations, PMax asset details, and Display creative URLs -- can exceed this limit.

**Prevention:**
- Design the data push as **multiple smaller payloads** rather than one mega-payload: one POST per campaign or per campaign type.
- Implement **pagination/chunking** in the script: if a report query returns more than N rows, split into multiple POST requests.
- Compress or minimise payloads: only send changed data (delta sync) rather than full daily dumps where possible.
- Test with realistically-sized accounts (50+ campaigns, 1000+ assets) during development, not just toy accounts.

**Detection (warning signs):**
- `UrlFetchApp` throwing "Payload too large" errors in script logs.
- Truncated data arriving at the endpoint.
- Larger accounts consistently having incomplete data while smaller accounts work fine.

**Phase relevance:** Data ingestion (Phase 1). Script and endpoint design must anticipate this.

**Confidence:** MEDIUM -- exact limits may have changed; the mitigation strategy (chunking) is correct regardless.

---

### Pitfall 10: Not Handling Google Ads Asset Ratings Correctly

**What goes wrong:** Google provides asset performance labels for RSA headlines/descriptions: "Best", "Good", "Low", and "Learning." Developers treat these as absolute performance scores. In reality, they are **relative within the ad's asset pool** and influenced by Google's machine learning model, not just raw conversion data. An asset rated "Best" in a weak ad group might perform worse than a "Low" asset in a strong ad group.

**Prevention:**
- Display Google's ratings as **one signal among many**, not as the definitive performance label.
- Cross-reference asset ratings with actual conversion metrics from the `ad_group_ad_asset_view` report.
- When ratings and actual metrics disagree, highlight the discrepancy for the operator: "Google rates this 'Low' but it has the best CPA in the ad group."
- Never auto-recommend pausing an asset based solely on Google's rating.

**Detection (warning signs):**
- Asset rated "Best" but with mediocre/poor conversion metrics.
- Asset rated "Low" but actually converting well (Google may be under-serving it, which is itself a finding worth surfacing).

**Phase relevance:** RSA analysis module (Phase 2-3).

**Confidence:** HIGH.

---

### Pitfall 11: Database/Storage Design That Cannot Handle Historical Comparisons

**What goes wrong:** The data model stores only the latest snapshot of creative performance. When the operator wants to see "how did this headline perform last month vs this month?" or "show me the trend for this asset group over 90 days," there is no historical data to query because each daily sync overwrites the previous data.

**Prevention:**
- Design the data model as **append-only time series**: each daily sync creates new records tagged with the sync date, never overwriting previous records.
- Implement a `date` or `period` dimension on all performance data.
- For storage efficiency with a Vercel/serverless setup, consider a simple approach: one JSON file or database row per account per day, stored in a Postgres database (Vercel Postgres or Supabase) rather than flat files.
- Plan the schema to support: daily snapshots, weekly rollups, and period-over-period comparison queries.

**Detection (warning signs):**
- Dashboard cannot answer "what changed this week?" because there is no "last week" to compare to.
- Time-series charts have no data or only show the current day.
- Schema has no date/period field on performance records.

**Phase relevance:** Database/schema design (Phase 1). This is foundational -- retrofitting time-series into a snapshot model is a significant rewrite.

**Confidence:** HIGH.

---

## Minor Pitfalls

---

### Pitfall 12: Ignoring Ad Strength vs Actual Performance

**What goes wrong:** Google's "Ad Strength" metric (Poor/Average/Good/Excellent) for RSAs is prominently displayed and many tools treat it as important. In reality, Ad Strength measures adherence to Google's best practices (enough headlines, keyword inclusion, uniqueness), not actual conversion performance. An "Excellent" ad strength RSA can underperform a "Poor" one.

**Prevention:**
- Show Ad Strength as informational context but do not use it in tier classification or performance ranking.
- If an ad has high Ad Strength but poor performance, surface this as a finding: "This ad follows Google's best practices but is not converting -- consider testing different messaging angles."

**Phase relevance:** RSA analysis (Phase 2-3).

**Confidence:** HIGH.

---

### Pitfall 13: Copy Theme Classification is Harder Than It Looks

**What goes wrong:** The "pattern detection" feature tries to automatically classify headlines into themes (urgency, social proof, benefit-led, feature-led). Simple keyword matching ("free" = offer, "trusted" = social proof) misclassifies frequently. "Free consultation" is benefit-led, not just a discount offer. A headline can be both benefit-led AND use urgency.

**Prevention:**
- Start with **operator-assisted classification** rather than fully automated: let the operator tag or confirm themes, with the tool suggesting based on keywords.
- Allow **multi-label classification**: a headline can be tagged with multiple themes.
- Begin with simple, high-confidence classifications and expand over time. A v1 might just detect: contains numbers, headline length (short/medium/long), contains question mark, contains CTA verb. These are structural patterns that do not require semantic understanding.
- If using AI for theme classification (later phase), use it to suggest, not to assert.

**Phase relevance:** Pattern detection (Phase 3). Can start simple and iterate.

**Confidence:** HIGH.

---

### Pitfall 14: Vercel Serverless Function Timeout on Large Data Processing

**What goes wrong:** The API endpoint that receives the daily data push from Google Ads Scripts runs as a Vercel serverless function. These have execution time limits (10 seconds on the Hobby plan, 60 seconds on Pro). Processing and storing data from a large account with thousands of assets may exceed these limits.

**Prevention:**
- Keep the ingestion endpoint **fast and dumb**: validate the payload, store it (e.g., to database or blob storage), and return 200 immediately. Do heavy processing (analysis, aggregation) asynchronously or on-demand when the dashboard loads.
- If analysis is expensive, pre-compute it via a **scheduled cron job** (Vercel Cron) rather than doing it inline with the data push.
- Chunk the data push from the Scripts side (as mentioned in Pitfall 9) so each request is small.
- Monitor function execution times from the start.

**Phase relevance:** API and deployment architecture (Phase 1).

**Confidence:** HIGH -- Vercel serverless limits are well-documented.

---

### Pitfall 15: Currency and Locale Handling Across Accounts

**What goes wrong:** The platform assumes all accounts use AUD. A client account set to USD or NZD sends cost/CPA/ROAS data in their account currency. The dashboard shows "$45 CPA" without indicating the currency, and the operator mistakes USD for AUD.

**Prevention:**
- Include **currency code** in the data schema pushed from Scripts (`"currency": "AUD"`).
- Display currency codes or symbols appropriate to each account.
- If cross-account comparisons are ever needed, implement currency conversion or clearly warn that amounts are in different currencies.
- Since PROJECT.md specifies AU clients, this is low risk for v1 but should be designed for in the schema.

**Phase relevance:** Data schema design (Phase 1), UI formatting (Phase 2).

**Confidence:** MEDIUM -- risk depends on actual account configurations.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Data ingestion / Scripts design | Silent script failures, incomplete data (Pitfalls 2, 9) | Chunked pushes, manifest checks, data freshness indicators | Critical |
| Database schema design | No historical data support (Pitfall 11), no schema versioning (Pitfall 5) | Append-only time series, versioned schemas, raw data preservation | Critical |
| RSA analysis | Combination data treated as exhaustive (Pitfall 1), asset ratings as ground truth (Pitfall 10) | Separate asset vs combination analysis, cross-reference ratings with metrics | Critical |
| PMax analysis | False specificity from opaque data (Pitfall 4) | Explicitly limited analysis module with caveats | Moderate |
| Tier classification | Low-volume creatives ranked as top/bottom (Pitfall 3) | Minimum thresholds, confidence-weighted ranking | Critical |
| Cross-format analysis | Apples-to-oranges comparisons (Pitfall 8) | Segment all analysis by campaign type | Moderate |
| Pattern detection | Over-engineered theme classification (Pitfall 13) | Start structural, add semantic later | Low |
| Deployment | Serverless timeouts on ingestion (Pitfall 14) | Fast ingestion, async processing | Moderate |
| Time comparisons | Seasonality/spend changes misattributed (Pitfall 7) | Portfolio-relative metrics, volume context | Moderate |

---

## Summary: The Three Mistakes That Cause Rewrites

1. **Building analysis on RSA combination data as if it is exhaustive.** It is not. Design asset-level analysis as primary from day one.
2. **Not designing for historical/time-series data from the start.** Snapshot-only schemas cannot be retrofitted without a rewrite.
3. **Treating all campaign types as having the same data fidelity.** RSAs, PMax, Display, and Video have fundamentally different data availability. The architecture must model this explicitly.

---

## Sources

- Google Ads Scripts documentation (developers.google.com/google-ads/scripts)
- Google Ads API reporting resources documentation (developers.google.com/google-ads/api/fields)
- Google Ads Help Center: RSA asset reporting, PMax asset groups, Ad Strength
- Community knowledge: Google Ads subreddit, PPC community discussions on PMax limitations
- Vercel documentation: serverless function limits

**Note:** Web search was unavailable during this research session. All findings are based on training data (cutoff: early 2025). Specific API field names, exact execution limits, and latest reporting changes should be verified against current official documentation before implementation. The architectural mitigations recommended are sound regardless of specific current limits.
