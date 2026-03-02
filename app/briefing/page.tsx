import { fetchBriefingData } from "@/lib/queries/briefing";
import type { CreativeAgg } from "@/lib/queries/briefing";
import { db } from "@/lib/db";
import * as dbSchema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyTiers } from "@/lib/analysis/tierClassification";
import { detectPatterns } from "@/lib/analysis/patternDetection";
import { detectFatigue } from "@/lib/analysis/fatigueDetection";
import { identifyGaps } from "@/lib/analysis/gapAnalysis";
import { diagnoseUnderperformers } from "@/lib/analysis/underperformerDiagnosis";
import { generateRecommendations } from "@/lib/analysis/recommendations";
import type {
  PrimaryKpi,
  CreativeInput,
  Recommendation,
} from "@/lib/analysis/types";
import type { CreativeMetrics } from "@/lib/analysis/fatigueDetection";
import { BriefingSection } from "@/components/briefing/BriefingSection";
import { ChangeIndicator } from "@/components/briefing/ChangeIndicator";
import {
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ClipboardList,
} from "lucide-react";

/** Force dynamic rendering -- data depends on URL params and DB */
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FormatName = "RSA" | "PMax" | "Display" | "Video";

interface Mover {
  format: FormatName;
  adId: string;
  label: string;
  priorKpi: number;
  currentKpi: number;
  changePercent: number;
}

interface FatigueItem {
  format: FormatName;
  adId: string;
  label: string;
  changePercent: number;
}

interface ActionItem {
  action: Recommendation["action"];
  format: FormatName;
  summary: string;
  priority: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Format badge colours per format */
const FORMAT_COLOURS: Record<FormatName, string> = {
  RSA: "bg-[#1A73E8]/10 text-[#1A73E8]",
  PMax: "bg-[#FBBC04]/10 text-[#9A7400]",
  Display: "bg-[#9AA0A6]/10 text-[#5F6368]",
  Video: "bg-[#34A853]/10 text-[#137333]",
};

/** Action badge colours per action type */
const ACTION_COLOURS: Record<string, string> = {
  keep: "bg-[#34A853]/10 text-[#137333]",
  test: "bg-[#1A73E8]/10 text-[#1A73E8]",
  pause: "bg-[#EA4335]/10 text-[#EA4335]",
  investigate: "bg-[#FBBC04]/10 text-[#9A7400]",
};

/** Compute biggest movers across all formats */
function computeMovers(
  briefing: Awaited<ReturnType<typeof fetchBriefingData>>,
): Mover[] {
  const movers: Mover[] = [];
  const formats: { name: FormatName; data: { current: CreativeAgg[]; prior: CreativeAgg[] } }[] = [
    { name: "RSA", data: briefing.rsa },
    { name: "PMax", data: briefing.pmax },
    { name: "Display", data: briefing.display },
    { name: "Video", data: briefing.video },
  ];

  for (const fmt of formats) {
    const priorMap = new Map(fmt.data.prior.map((c) => [c.adId, c]));

    for (const current of fmt.data.current) {
      const prior = priorMap.get(current.adId);
      if (!prior || prior.kpiValue === 0 || prior.impressions < 10) continue;

      const changePercent =
        (current.kpiValue - prior.kpiValue) / prior.kpiValue;

      movers.push({
        format: fmt.name,
        adId: current.adId,
        label: current.label ?? `${fmt.name} Ad`,
        priorKpi: prior.kpiValue,
        currentKpi: current.kpiValue,
        changePercent,
      });
    }
  }

  return movers;
}

/** Run fatigue detection across all formats */
function computeFatigue(
  briefing: Awaited<ReturnType<typeof fetchBriefingData>>,
  kpiType: PrimaryKpi,
): FatigueItem[] {
  const items: FatigueItem[] = [];
  const formats: { name: FormatName; data: { current: CreativeAgg[]; prior: CreativeAgg[] } }[] = [
    { name: "RSA", data: briefing.rsa },
    { name: "PMax", data: briefing.pmax },
    { name: "Display", data: briefing.display },
    { name: "Video", data: briefing.video },
  ];

  for (const fmt of formats) {
    const currentMetrics: CreativeMetrics[] = fmt.data.current.map((c) => ({
      adId: c.adId,
      kpiValue: c.kpiValue,
      impressions: c.impressions,
    }));

    const priorMetrics: CreativeMetrics[] = fmt.data.prior.map((c) => ({
      adId: c.adId,
      kpiValue: c.kpiValue,
      impressions: c.impressions,
    }));

    const fatigued = detectFatigue(currentMetrics, priorMetrics, kpiType);

    // Find labels for fatigued creatives
    const labelMap = new Map(
      fmt.data.current.map((c) => [c.adId, c.label ?? `${fmt.name} Ad`]),
    );

    for (const f of fatigued) {
      items.push({
        format: fmt.name,
        adId: f.adId,
        label: labelMap.get(f.adId) ?? `${fmt.name} Ad`,
        changePercent: f.changePercent,
      });
    }
  }

  return items;
}

/** Compute bottom-tier counts per format */
function computeUnderperformerCounts(
  briefing: Awaited<ReturnType<typeof fetchBriefingData>>,
  kpiType: PrimaryKpi,
): Record<FormatName, number> {
  const counts: Record<FormatName, number> = { RSA: 0, PMax: 0, Display: 0, Video: 0 };
  const formats: { name: FormatName; data: CreativeAgg[] }[] = [
    { name: "RSA", data: briefing.rsa.current },
    { name: "PMax", data: briefing.pmax.current },
    { name: "Display", data: briefing.display.current },
    { name: "Video", data: briefing.video.current },
  ];

  for (const fmt of formats) {
    const inputs: CreativeInput[] = fmt.data.map((c) => ({
      adId: c.adId,
      kpiValue: c.kpiValue,
    }));
    const tiered = classifyTiers(inputs, kpiType);
    counts[fmt.name] = tiered.filter((t) => t.tier === "bottom").length;
  }

  return counts;
}

/** Aggregate recommendations across all formats, return top 5 */
function computeTopActions(
  briefing: Awaited<ReturnType<typeof fetchBriefingData>>,
  kpiType: PrimaryKpi,
): ActionItem[] {
  const allRecs: ActionItem[] = [];

  const formats: { name: FormatName; data: CreativeAgg[] }[] = [
    { name: "RSA", data: briefing.rsa.current },
    { name: "PMax", data: briefing.pmax.current },
    { name: "Display", data: briefing.display.current },
    { name: "Video", data: briefing.video.current },
  ];

  for (const fmt of formats) {
    const inputs: CreativeInput[] = fmt.data.map((c) => ({
      adId: c.adId,
      kpiValue: c.kpiValue,
      headlineText: undefined,
    }));

    const tiered = classifyTiers(inputs, kpiType);

    const diagnosed = diagnoseUnderperformers(tiered, {
      impressions:
        fmt.data.length > 0
          ? fmt.data.reduce((s, c) => s + c.impressions, 0) / fmt.data.length
          : 0,
      ctr: 0,
      cvr: 0,
    });

    const patterns = detectPatterns(tiered);
    const recs = generateRecommendations(tiered, diagnosed, patterns);

    for (const rec of recs) {
      // Only include actionable items (not "keep")
      if (rec.action === "keep") continue;
      allRecs.push({
        action: rec.action,
        format: fmt.name,
        summary: rec.summary,
        priority: rec.priority,
      });
    }
  }

  // Sort by priority ascending (1 = highest priority)
  allRecs.sort((a, b) => a.priority - b.priority);

  return allRecs.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

interface BriefingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BriefingPage({
  searchParams,
}: BriefingPageProps) {
  const params = await searchParams;
  const accountId =
    typeof params.account === "string" ? params.account : "";

  // No account selected -- show prompt
  if (!accountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-surface-gridline p-10 shadow-sm text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10 text-brand-blue mx-auto mb-4">
            <CalendarDays size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Select an account
          </h2>
          <p className="text-sm text-gray-500">
            Choose an account from the sidebar to view the Monday Briefing
            with cross-format intelligence and prioritised actions.
          </p>
        </div>
      </div>
    );
  }

  // Fetch account for primaryKpi
  const accountRows = await db
    .select({
      id: dbSchema.accounts.id,
      displayName: dbSchema.accounts.displayName,
      primaryKpi: dbSchema.accounts.primaryKpi,
    })
    .from(dbSchema.accounts)
    .where(eq(dbSchema.accounts.id, accountId))
    .limit(1);

  const account = accountRows[0];
  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-surface-gridline p-10 shadow-sm text-center max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Account not found
          </h2>
          <p className="text-sm text-gray-500">
            The selected account could not be found. Please choose a different
            account from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const primaryKpi = account.primaryKpi as PrimaryKpi;

  // Fetch briefing data (8 parallel queries across 4 formats x 2 periods)
  const briefing = await fetchBriefingData(accountId);

  // Section 1: What Changed -- biggest movers
  const movers = computeMovers(briefing);
  const sortedByAbsChange = [...movers].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent),
  );
  const improvers = movers
    .filter((m) =>
      primaryKpi === "cpa" ? m.changePercent < 0 : m.changePercent > 0,
    )
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);
  const decliners = movers
    .filter((m) =>
      primaryKpi === "cpa" ? m.changePercent > 0 : m.changePercent < 0,
    )
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  // Section 2: Needs Attention -- fatigue + underperformers
  const fatigueItems = computeFatigue(briefing, primaryKpi);
  const underperformerCounts = computeUnderperformerCounts(briefing, primaryKpi);
  const totalAttention =
    fatigueItems.length +
    Object.values(underperformerCounts).reduce((s, v) => s + v, 0);

  // Section 3: Creative Gaps -- RSA and PMax gap analysis
  // Enrich RSA current period with headlineText for pattern detection
  const rsaInputs: CreativeInput[] = briefing.rsa.current.map((c) => ({
    adId: c.adId,
    kpiValue: c.kpiValue,
    headlineText: c.label,
  }));
  const rsaTiered = classifyTiers(rsaInputs, primaryKpi);
  const rsaPatterns = detectPatterns(rsaTiered);
  const gaps = identifyGaps(rsaPatterns);

  // Section 4: What to Do -- top 5 prioritised actions
  const topActions = computeTopActions(briefing, primaryKpi);

  // KPI formatting helper
  const formatKpi = (value: number): string => {
    if (primaryKpi === "cpa") {
      return `$${value.toFixed(2)}`;
    }
    return `${value.toFixed(2)}x`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Monday Briefing
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {account.displayName} &middot; Comparing{" "}
          {briefing.currentPeriod.from} to {briefing.currentPeriod.to} vs{" "}
          {briefing.priorPeriod.from} to {briefing.priorPeriod.to} &middot;
          Primary KPI: {primaryKpi.toUpperCase()}
        </p>
      </div>

      {/* Section 1: What Changed */}
      <BriefingSection
        title="What Changed"
        icon={TrendingUp}
        count={sortedByAbsChange.length}
      >
        {sortedByAbsChange.length === 0 ? (
          <p className="text-sm text-gray-500">
            No comparable creatives found between the two periods.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Top improvers */}
            {improvers.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#34A853] mb-2">
                  Top Improvers
                </h3>
                <div className="space-y-1.5">
                  {improvers.map((m) => (
                    <div
                      key={`${m.format}-${m.adId}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${FORMAT_COLOURS[m.format]}`}
                      >
                        {m.format}
                      </span>
                      <span className="flex-1 truncate text-gray-700">
                        {m.label}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatKpi(m.priorKpi)}
                      </span>
                      <span className="text-gray-700 text-xs font-medium">
                        {formatKpi(m.currentKpi)}
                      </span>
                      <ChangeIndicator
                        value={m.changePercent}
                        kpiType={primaryKpi}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top decliners */}
            {decliners.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EA4335] mb-2">
                  Top Decliners
                </h3>
                <div className="space-y-1.5">
                  {decliners.map((m) => (
                    <div
                      key={`${m.format}-${m.adId}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${FORMAT_COLOURS[m.format]}`}
                      >
                        {m.format}
                      </span>
                      <span className="flex-1 truncate text-gray-700">
                        {m.label}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatKpi(m.priorKpi)}
                      </span>
                      <span className="text-gray-700 text-xs font-medium">
                        {formatKpi(m.currentKpi)}
                      </span>
                      <ChangeIndicator
                        value={m.changePercent}
                        kpiType={primaryKpi}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BriefingSection>

      {/* Section 2: Needs Attention */}
      <BriefingSection
        title="Needs Attention"
        icon={AlertTriangle}
        count={totalAttention}
      >
        {totalAttention === 0 ? (
          <p className="text-sm text-gray-500">
            No creatives flagged for attention this week.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Fatigued creatives */}
            {fatigueItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EA4335] mb-2">
                  Fatigued Creatives ({fatigueItems.length})
                </h3>
                <div className="space-y-1.5">
                  {fatigueItems.slice(0, 5).map((item) => (
                    <div
                      key={`fatigue-${item.format}-${item.adId}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${FORMAT_COLOURS[item.format]}`}
                      >
                        {item.format}
                      </span>
                      <span className="flex-1 truncate text-gray-700">
                        {item.label}
                      </span>
                      <ChangeIndicator
                        value={item.changePercent}
                        kpiType={primaryKpi}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Underperformer counts */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FBBC04] mb-2">
                Underperformers by Format
              </h3>
              <div className="flex gap-4">
                {(
                  Object.entries(underperformerCounts) as [FormatName, number][]
                ).map(([fmt, count]) => (
                  <div
                    key={fmt}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${FORMAT_COLOURS[fmt]}`}
                    >
                      {fmt}
                    </span>
                    <span
                      className={`font-medium ${count > 0 ? "text-[#EA4335]" : "text-gray-400"}`}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </BriefingSection>

      {/* Section 3: Creative Gaps */}
      <BriefingSection
        title="Creative Gaps"
        icon={Lightbulb}
        count={gaps.length}
      >
        {gaps.length === 0 ? (
          <p className="text-sm text-gray-500">
            All creative themes are well represented in the portfolio.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">
              Themes underrepresented in your RSA portfolio. Test these angles
              to broaden creative coverage.
            </p>
            {gaps.map((gap) => (
              <div
                key={gap.theme}
                className="flex items-start gap-3 text-sm py-1.5"
              >
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1A73E8]/10 text-[#1A73E8] flex-shrink-0">
                  {gap.label}
                </span>
                <span className="text-gray-600">{gap.suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </BriefingSection>

      {/* Section 4: What to Do */}
      <BriefingSection
        title="What to Do"
        icon={ClipboardList}
        count={topActions.length}
      >
        {topActions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No actions to prioritise this week. All creatives are performing
            adequately.
          </p>
        ) : (
          <div className="space-y-2">
            {topActions.map((action, idx) => (
              <div
                key={`action-${idx}`}
                className="flex items-center gap-3 text-sm py-1.5"
              >
                <span className="text-gray-400 text-xs font-medium w-4">
                  {idx + 1}.
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${ACTION_COLOURS[action.action] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {action.action}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${FORMAT_COLOURS[action.format]}`}
                >
                  {action.format}
                </span>
                <span className="flex-1 text-gray-700">{action.summary}</span>
              </div>
            ))}
          </div>
        )}
      </BriefingSection>
    </div>
  );
}
