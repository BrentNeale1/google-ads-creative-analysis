import { displaySearchParams, resolveDateRange } from "./searchParams";
import {
  fetchDisplayCreatives,
  fetchDisplayPortfolioAvg,
  fetchDisplayFormatBreakdown,
} from "@/lib/queries/display";
import { fetchFilterOptions } from "@/lib/queries/dashboard";
import { db } from "@/lib/db";
import * as dbSchema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyTiers } from "@/lib/analysis/tierClassification";
import { diagnoseUnderperformers } from "@/lib/analysis/underperformerDiagnosis";
import { detectPatterns } from "@/lib/analysis/patternDetection";
import { generateRecommendations } from "@/lib/analysis/recommendations";
import type { PrimaryKpi, CreativeInput } from "@/lib/analysis/types";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { TierOverview } from "@/components/rsa/TierOverview";
import { UnderperformerPanel } from "@/components/rsa/UnderperformerPanel";
import { RecommendationList } from "@/components/rsa/RecommendationList";
import { DisplayTabNav } from "@/components/display/DisplayTabNav";
import { DisplayLeaderboard } from "@/components/display/DisplayLeaderboard";
import { FormatComparison } from "@/components/display/FormatComparison";
import { MonitorPlay } from "lucide-react";

/** Force dynamic rendering -- data depends on URL params and DB */
export const dynamic = "force-dynamic";

interface DisplayPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DisplayPage({ searchParams }: DisplayPageProps) {
  const params = displaySearchParams.parse(await searchParams);

  // No account selected -- show prompt
  if (!params.account) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-surface-gridline p-10 shadow-sm text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10 text-brand-blue mx-auto mb-4">
            <MonitorPlay size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Select an account
          </h2>
          <p className="text-sm text-gray-500">
            Choose an account from the sidebar to view Display analysis with
            tier classification, format comparison, and recommendations.
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
  const [creatives, portfolioAvg, formatBreakdown, filterOptions] =
    await Promise.all([
      fetchDisplayCreatives(
        params.account,
        dateFrom,
        dateTo,
        params.campaign,
        params.adGroup,
      ),
      fetchDisplayPortfolioAvg(params.account, dateFrom, dateTo),
      fetchDisplayFormatBreakdown(params.account, dateFrom, dateTo),
      fetchFilterOptions(params.account),
    ]);

  // Enrich creatives as CreativeInput[] for the analysis pipeline
  // Display ads do not have headline text, so headlineText is undefined.
  // Pattern detection will return limited results -- this is expected.
  const creativeInputs: CreativeInput[] = creatives.map((c) => ({
    adId: c.adId,
    kpiValue: primaryKpi === "cpa" ? c.cpa : c.roas,
    headlineText: undefined,
    // Pass through raw metrics needed by UI components
    impressions: c.impressions,
    clicks: c.clicks,
    ctr: c.ctr,
    cvr: c.cvr,
    conversions: c.conversions,
    cpa: c.cpa,
    roas: c.roas,
    campaignName: c.campaignName,
    adGroupName: c.adGroupName,
    adName: c.adName,
    adType: c.adType,
  }));

  // Run analysis pipeline
  const tiered = classifyTiers(creativeInputs, primaryKpi);

  const diagnosed = diagnoseUnderperformers(tiered, {
    impressions: portfolioAvg.avgImpressions,
    ctr: portfolioAvg.avgCtr,
    cvr: portfolioAvg.avgCvr,
  });

  // Pattern detection will return limited/empty results since headlineText is undefined
  // This is expected for Display ads which lack text-based creative content
  const patterns = detectPatterns(tiered);

  const recommendations = generateRecommendations(tiered, diagnosed, patterns);

  const activeTab = params.tab;

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Display Analysis
        </h1>
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
      <DisplayTabNav activeTab={activeTab} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <TierOverview tieredCreatives={tiered} kpiType={primaryKpi} />
          <DisplayLeaderboard
            tieredCreatives={tiered}
            portfolioAvg={portfolioAvg}
            kpiType={primaryKpi}
          />
        </div>
      )}

      {activeTab === "formats" && (
        <div className="space-y-6">
          <FormatComparison
            formatBreakdown={formatBreakdown}
            kpiType={primaryKpi}
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
