import { rsaSearchParams, resolveDateRange } from "./searchParams";
import {
  fetchRsaCreatives,
  fetchRsaAssets,
  fetchRsaCombinations,
  fetchRsaPortfolioAvg,
} from "@/lib/queries/rsa";
import { fetchFilterOptions } from "@/lib/queries/dashboard";
import { db } from "@/lib/db";
import * as dbSchema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyTiers } from "@/lib/analysis/tierClassification";
import { diagnoseUnderperformers } from "@/lib/analysis/underperformerDiagnosis";
import { detectPatterns } from "@/lib/analysis/patternDetection";
import { generateRecommendations } from "@/lib/analysis/recommendations";
import { generateInsightTitle } from "@/lib/analysis/insightTitles";
import { formatCurrency } from "@/lib/constants/formatting";
import type { PrimaryKpi, CreativeInput } from "@/lib/analysis/types";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { TierOverview } from "@/components/rsa/TierOverview";
import { CreativeLeaderboard } from "@/components/rsa/CreativeLeaderboard";
import { AssetPerformance } from "@/components/rsa/AssetPerformance";
import { CombinationReport } from "@/components/rsa/CombinationReport";
import { UnderperformerPanel } from "@/components/rsa/UnderperformerPanel";
import { PatternCharts } from "@/components/rsa/PatternCharts";
import { RecommendationList } from "@/components/rsa/RecommendationList";
import { RsaTabNav } from "@/components/rsa/RsaTabNav";
import { BarChart3 } from "lucide-react";

/** Force dynamic rendering -- data depends on URL params and DB */
export const dynamic = "force-dynamic";

interface RsaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RsaPage({ searchParams }: RsaPageProps) {
  const params = rsaSearchParams.parse(await searchParams);

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
            Choose an account from the sidebar to view RSA analysis with
            tier classification, pattern detection, and recommendations.
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
  const [creatives, assets, combinations, portfolioAvg, filterOptions] =
    await Promise.all([
      fetchRsaCreatives(
        params.account,
        dateFrom,
        dateTo,
        params.campaign,
        params.adGroup,
      ),
      fetchRsaAssets(params.account, dateFrom, dateTo),
      fetchRsaCombinations(params.account, dateFrom, dateTo),
      fetchRsaPortfolioAvg(params.account, dateFrom, dateTo),
      fetchFilterOptions(params.account),
    ]);

  // Enrich creatives with headlineText before tier classification
  const creativeInputs: CreativeInput[] = creatives.map((c) => ({
    adId: c.adId,
    kpiValue: primaryKpi === "cpa" ? c.cpa : c.roas,
    headlineText:
      (c.headlines as string[])?.join(" | ") ??
      "",
    // Pass through raw metrics needed by UI components
    impressions: c.impressions,
    clicks: c.clicks,
    ctr: c.ctr,
    conversions: c.conversions,
    cpa: c.cpa,
    roas: c.roas,
    campaignName: c.campaignName,
    adGroupName: c.adGroupName,
    adStrength: c.adStrength,
    headlines: c.headlines,
    descriptions: c.descriptions,
  }));

  // Run analysis pipeline with enriched data
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

  // KPI formatter for components
  const formatKpi =
    primaryKpi === "cpa"
      ? formatCurrency
      : (v: number) => `${v.toFixed(2)}x`;

  const activeTab = params.tab;

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">RSA Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          {account.displayName} &middot; {dateFrom} to {dateTo} &middot;
          Primary KPI: {primaryKpi.toUpperCase()}
        </p>
      </div>

      {/* Filter bar -- reused from dashboard */}
      <FilterBar
        campaigns={filterOptions.campaigns}
        adGroups={filterOptions.adGroups}
      />

      {/* Tab navigation */}
      <RsaTabNav activeTab={activeTab} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <TierOverview
            tieredCreatives={tiered}
            kpiType={primaryKpi}
            formatKpi={formatKpi}
          />
          <CreativeLeaderboard
            tieredCreatives={tiered}
            portfolioAvg={portfolioAvg}
            kpiType={primaryKpi}
          />
          <PatternCharts
            patterns={patterns}
            insightTitle={insightTitle}
            kpiType={primaryKpi}
            formatKpi={formatKpi}
          />
        </div>
      )}

      {activeTab === "assets" && (
        <div className="space-y-6">
          <AssetPerformance assets={assets} kpiType={primaryKpi} />
          <CombinationReport combinations={combinations} />
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
