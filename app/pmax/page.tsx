import { pmaxSearchParams, resolveDateRange } from "./searchParams";
import {
  fetchPmaxAssetGroups,
  fetchPmaxPortfolioAvg,
  fetchPmaxTextAssets,
} from "@/lib/queries/pmax";
import { fetchFilterOptions } from "@/lib/queries/dashboard";
import { db } from "@/lib/db";
import * as dbSchema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyTiers } from "@/lib/analysis/tierClassification";
import { diagnoseUnderperformers } from "@/lib/analysis/underperformerDiagnosis";
import { detectPatterns } from "@/lib/analysis/patternDetection";
import { generateRecommendations } from "@/lib/analysis/recommendations";
import { generateInsightTitle } from "@/lib/analysis/insightTitles";
import type { PrimaryKpi, CreativeInput } from "@/lib/analysis/types";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { TierOverview } from "@/components/rsa/TierOverview";
import { UnderperformerPanel } from "@/components/rsa/UnderperformerPanel";
import { PatternCharts } from "@/components/rsa/PatternCharts";
import { RecommendationList } from "@/components/rsa/RecommendationList";
import { PmaxTabNav } from "@/components/pmax/PmaxTabNav";
import { PmaxLeaderboard } from "@/components/pmax/PmaxLeaderboard";
import { PmaxThemeAnalysis } from "@/components/pmax/PmaxThemeAnalysis";
import { BarChart3, AlertTriangle } from "lucide-react";

/** Force dynamic rendering -- data depends on URL params and DB */
export const dynamic = "force-dynamic";

interface PmaxPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PmaxPage({ searchParams }: PmaxPageProps) {
  const params = pmaxSearchParams.parse(await searchParams);

  // No account selected -- show prompt
  if (!params.account) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-surface-gridline p-10 shadow-sm text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10 text-brand-blue mx-auto mb-4">
            <BarChart3 size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Select an account
          </h2>
          <p className="text-sm text-gray-500">
            Choose an account from the sidebar to view Performance Max analysis
            with asset group classification, theme detection, and recommendations.
          </p>
        </div>
      </div>
    );
  }

  // Fetch account record to get primaryKpi setting
  const accountRows = await db
    .select({
      id: dbSchema.accounts.id,
      displayName: dbSchema.accounts.displayName,
      primaryKpi: dbSchema.accounts.primaryKpi,
    })
    .from(dbSchema.accounts)
    .where(eq(dbSchema.accounts.id, params.account))
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

  // Resolve date range from params
  const { dateFrom, dateTo } = resolveDateRange(params);

  // Fetch data in parallel
  const [assetGroups, portfolioAvg, textAssets, filterOptions] =
    await Promise.all([
      fetchPmaxAssetGroups(
        params.account,
        dateFrom,
        dateTo,
        params.campaign,
      ),
      fetchPmaxPortfolioAvg(params.account, dateFrom, dateTo),
      fetchPmaxTextAssets(params.account, dateFrom, dateTo),
      fetchFilterOptions(params.account),
    ]);

  // Build text content lookup per asset group for headlineText enrichment
  const textByAssetGroup = new Map<string, string[]>();
  for (const ta of textAssets) {
    if (ta.textContent) {
      const existing = textByAssetGroup.get(ta.assetGroupId) ?? [];
      existing.push(ta.textContent);
      textByAssetGroup.set(ta.assetGroupId, existing);
    }
  }

  // Enrich asset groups as CreativeInput[] for the shared analysis pipeline
  const creativeInputs: CreativeInput[] = assetGroups.map((ag) => ({
    adId: ag.assetGroupId,
    kpiValue: primaryKpi === "cpa" ? ag.cpa : ag.roas,
    headlineText: (textByAssetGroup.get(ag.assetGroupId) ?? []).join(" | "),
    // Pass through raw metrics needed by UI components
    impressions: ag.impressions,
    clicks: ag.clicks,
    ctr: ag.ctr,
    conversions: ag.conversions,
    cpa: ag.cpa,
    roas: ag.roas,
    campaignName: ag.campaignName,
    assetGroupName: ag.assetGroupName,
  }));

  // Run shared analysis pipeline
  const tiered = classifyTiers(creativeInputs, primaryKpi);

  const diagnosed = diagnoseUnderperformers(tiered, {
    impressions: portfolioAvg.avgImpressions,
    ctr: portfolioAvg.avgCtr,
    cvr: portfolioAvg.avgCvr,
  });

  const patterns = detectPatterns(tiered);

  const recommendations = generateRecommendations(tiered, diagnosed, patterns);

  // Compute overall average KPI for insight title
  const overallAvgKpi =
    tiered.length > 0
      ? tiered.reduce((sum, c) => sum + c.kpiValue, 0) / tiered.length
      : 0;

  const insightTitle = generateInsightTitle(patterns, overallAvgKpi, primaryKpi);

  // Build asset group name lookup for theme analysis component
  const assetGroupNames: Record<string, string> = {};
  for (const ag of assetGroups) {
    assetGroupNames[ag.assetGroupId] = ag.assetGroupName;
  }

  const activeTab = params.tab;

  return (
    <div className="space-y-6 p-6">
      {/* PMax caveat banner */}
      <div className="bg-[#FBBC04]/10 border border-[#FBBC04]/30 rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="text-[#9A7400] flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="text-sm font-medium text-[#9A7400]">
            Performance Max: Google controls creative assembly
          </p>
          <p className="text-xs text-[#9A7400]/80 mt-0.5">
            Data is directional -- it reflects Google&apos;s optimisation
            choices, not controlled creative tests. Use these insights to
            inform asset composition, not to make direct A/B test conclusions.
          </p>
        </div>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          PMax Analysis
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {account.displayName} &middot; {dateFrom} to {dateTo} &middot;
          Primary KPI: {primaryKpi.toUpperCase()}
        </p>
      </div>

      {/* Filter bar -- campaigns only for PMax (no ad groups) */}
      <FilterBar
        campaigns={filterOptions.campaigns}
        adGroups={filterOptions.adGroups}
      />

      {/* Tab navigation */}
      <PmaxTabNav activeTab={activeTab} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <TierOverview
            tieredCreatives={tiered}
            kpiType={primaryKpi}
          />
          <PmaxLeaderboard
            tieredCreatives={tiered}
            portfolioAvg={portfolioAvg}
            kpiType={primaryKpi}
          />
          <PatternCharts
            patterns={patterns}
            insightTitle={insightTitle}
            kpiType={primaryKpi}
          />
        </div>
      )}

      {activeTab === "assets" && (
        <div className="space-y-6">
          <PmaxThemeAnalysis
            textAssets={textAssets}
            assetGroupNames={assetGroupNames}
          />
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <UnderperformerPanel
            diagnosedCreatives={diagnosed}
            portfolioAvg={portfolioAvg}
          />
          <RecommendationList
            recommendations={recommendations}
            creatives={tiered}
          />
        </div>
      )}
    </div>
  );
}
