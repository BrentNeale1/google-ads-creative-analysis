# Google Ads Creative Analyser — brentneale.au

## Project Overview
Web app that accepts Google Ads data exports (CSV/Excel) and produces visual creative performance reports. Built for marketing managers and business owners. Hosted at brentneale.au.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **File parsing:** Papaparse (CSV), SheetJS (XLSX)
- **Deployment:** Vercel → custom domain brentneale.au
- **Language:** TypeScript

## Commands
- `npm run dev` — local dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint check
- `vercel --prod` — deploy to production

## Architecture
```
/app              → Next.js pages and layouts
/app/api          → API routes for file processing
/components/ui    → Reusable UI components (buttons, cards, tables)
/components/charts → Chart components (bar, line, scatter, heatmap)
/lib/analysis     → Core analysis logic (tier classification, pattern detection)
/lib/parsers      → CSV/XLSX file parsers and data normalisation
/lib/constants    → Colour palette, chart config, formatting rules
/public           → Static assets
```

## Design System — MANDATORY
All charts and visuals MUST follow these rules exactly.

### Colour Palette
| Role | Hex | Usage |
|------|-----|-------|
| Primary Blue | #1A73E8 | Main data series, highlights |
| Positive Green | #34A853 | Improvements, top performers |
| Negative Red | #EA4335 | Declines, underperformers |
| Neutral Grey | #9AA0A6 | Secondary data, baselines |
| Accent Amber | #FBBC04 | Warnings, middle tier |
| Background | #F8F9FA | Chart backgrounds |
| Subtle Gridline | #E8EAED | Gridlines (very subtle or hidden) |

### Chart Rules
- Insight-led titles ("Benefit-led headlines outperform by 34%" not "CTR Comparison")
- Sort bar charts by value descending, never alphabetically
- Data labels on bars when fewer than 10 items
- No chart borders, no 3D effects, no unnecessary decoration
- Gridlines subtle (#E8EAED) or removed entirely
- Legend only when 2+ data series
- Max 3–4 lines on line charts
- Horizontal bar charts for creative comparisons (long labels)

### Table Rules
- Header: bold, background #F1F3F4
- Numbers right-aligned, text left-aligned
- Top performer row: light green background #E6F4EA
- Worst performer row: light red background #FCE8E6
- Include "Portfolio Avg" row for context where useful

### Number Formatting (AU Client Default)
- Currency: AUD `$1,234.56` (comma thousands)
- Percentages: one decimal place (3.2%)
- Charts: use K/M shorthand ($12.4K); tables: full numbers

## Analysis Framework — MANDATORY
When analysing creative performance data, ALWAYS follow this hierarchy:

### 1. Performance Tier Classification
- **Top Performers:** Top 20% by primary KPI (CPA or ROAS)
- **Middle Pack:** 20th–80th percentile
- **Underperformers:** Bottom 20%
Classify BEFORE detailed analysis. No cherry-picking.

### 2. Pattern Recognition (across top performers)
- Copy themes: urgency, social proof, benefit-led, feature-led
- Structural patterns: headline length, description length, CTA type, numbers/stats
- Audience signals: geo, device, demographic performance differences
- RSA asset combos: which headline + description pairings serve most and convert best

### 3. Underperformer Diagnosis
- Low impressions → not serving (check ad strength, auction competitiveness)
- High impressions + low CTR → creative not resonating
- High CTR + low CVR → ad/landing page disconnect
- High CPA → attracting wrong audience

### 4. Recommendations (every analysis ends with these)
- **Keep:** top performers to maintain/scale
- **Test:** new hypotheses based on winner patterns
- **Pause/Replace:** underperformers with specific replacements suggested
- **Investigate:** mixed signals needing more data

## Campaign Type Notes
- **RSAs:** Analyse at asset level AND combination level. Google ratings are directional only — cross-reference with conversion data. Check pin impact.
- **PMax:** Asset group level analysis. Focus on theme vs performance. Note Google controls creative assembly.
- **Display/Demand Gen:** Image/video analysis. Format performance (square vs landscape vs portrait).

## Report Structure
1. Executive Summary (2–3 sentences)
2. Performance Overview (metrics table, period comparison)
3. Top Performers (what's working and why)
4. Underperformers (what's not working, what to do)
5. Creative Patterns (themes across portfolio)
6. Recommendations (prioritised actions)

## Code Style
- AU English spelling in all UI copy and comments (analyse, optimise, colour, etc.)
- Prefer named exports
- Use Tailwind utility classes, no custom CSS files
- Components: PascalCase filenames
- Utilities: camelCase filenames