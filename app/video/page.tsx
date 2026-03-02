import { videoSearchParams, resolveDateRange } from "./searchParams";
import {
  fetchVideoCreatives,
  fetchVideoPortfolioAvg,
} from "@/lib/queries/video";
import { fetchFilterOptions } from "@/lib/queries/dashboard";
import { db } from "@/lib/db";
import * as dbSchema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyTiers } from "@/lib/analysis/tierClassification";
import { generateRecommendations } from "@/lib/analysis/recommendations";
import { detectPatterns } from "@/lib/analysis/patternDetection";
import { diagnoseVideoCreative } from "@/lib/analysis/videoAnalysis";
import type {
  PrimaryKpi,
  CreativeInput,
  DiagnosedCreative,
  Diagnosis,
} from "@/lib/analysis/types";
import type {
  VideoCreativeMetrics,
  VideoPortfolioAvg as VideoPortfolioAvgInput,
} from "@/lib/analysis/videoAnalysis";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { TierOverview } from "@/components/rsa/TierOverview";
import { UnderperformerPanel } from "@/components/rsa/UnderperformerPanel";
import { RecommendationList } from "@/components/rsa/RecommendationList";
import { VideoTabNav } from "@/components/video/VideoTabNav";
import { VideoLeaderboard } from "@/components/video/VideoLeaderboard";
import { VideoEngagementChart } from "@/components/video/VideoEngagementChart";
import { Video } from "lucide-react";

/** Force dynamic rendering -- data depends on URL params and DB */
export const dynamic = "force-dynamic";

/**
 * Map video diagnosis string to a standard Diagnosis union for
 * UnderperformerPanel compatibility.
 */
function mapVideoDiagnosis(videoDiag: string): Diagnosis {
  switch (videoDiag) {
    case "not_serving":
      return "not_serving";
    case "not_engaging":
      return "not_resonating";
    case "missing_cta":
      return "not_resonating";
    case "landing_page_disconnect":
      return "landing_page_disconnect";
    default:
      return "wrong_audience";
  }
}

interface VideoPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VideoPage({ searchParams }: VideoPageProps) {
  const params = videoSearchParams.parse(await searchParams);

  // No account selected -- show prompt
  if (!params.account) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-surface-gridline p-10 shadow-sm text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10 text-brand-blue mx-auto mb-4">
            <Video size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Select an account
          </h2>
          <p className="text-sm text-gray-500">
            Choose an account from the sidebar to view Video analysis with
            tier classification, engagement metrics, and recommendations.
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
  const [creatives, portfolioAvg, filterOptions] = await Promise.all([
    fetchVideoCreatives(
      params.account,
      dateFrom,
      dateTo,
      params.campaign,
      params.adGroup,
    ),
    fetchVideoPortfolioAvg(params.account, dateFrom, dateTo),
    fetchFilterOptions(params.account),
  ]);

  // Enrich creatives as CreativeInput[] for the analysis pipeline
  // Video ads do not have headline text, so headlineText is undefined.
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
    // Video-specific fields passed through for leaderboard and engagement chart
    videoViews: c.videoViews,
    videoViewRate: c.videoViewRate,
    averageCpvMicros: c.averageCpvMicros,
    averageCpvAud: c.averageCpvAud,
    videoQuartileP25Rate: c.videoQuartileP25Rate,
    videoQuartileP50Rate: c.videoQuartileP50Rate,
    videoQuartileP75Rate: c.videoQuartileP75Rate,
    videoQuartileP100Rate: c.videoQuartileP100Rate,
  }));

  // Run standard analysis pipeline
  const tiered = classifyTiers(creativeInputs, primaryKpi);

  // Pattern detection will return limited/empty results since headlineText is undefined
  // This is expected for Video ads which lack text-based creative content
  const patterns = detectPatterns(tiered);

  // Video-specific diagnosis for bottom-tier creatives
  // Uses diagnoseVideoCreative instead of generic diagnoseUnderperformers
  const videoPortfolioAvgInput: VideoPortfolioAvgInput = {
    impressions: portfolioAvg.avgImpressions,
    videoViewRate: portfolioAvg.avgVideoViewRate,
    ctr: portfolioAvg.avgCtr,
    cvr: portfolioAvg.avgCvr,
  };

  const diagnosed: DiagnosedCreative[] = tiered
    .filter((c) => c.tier === "bottom")
    .map((creative) => {
      const metrics: VideoCreativeMetrics = {
        adId: creative.adId,
        impressions: Number(creative.impressions) || 0,
        videoViewRate: Number(creative.videoViewRate) || 0,
        ctr: Number(creative.ctr) || 0,
        cvr: Number(creative.cvr) || 0,
        videoQuartileP100Rate: Number(creative.videoQuartileP100Rate) || 0,
      };

      const result = diagnoseVideoCreative(metrics, videoPortfolioAvgInput);

      if (result) {
        return {
          adId: result.adId,
          tier: creative.tier,
          diagnosis: mapVideoDiagnosis(result.diagnosis),
          evidence: result.evidence,
          recommendedAction: result.recommendedAction,
        };
      }

      // Fallback: no specific diagnosis identified
      return {
        adId: creative.adId,
        tier: creative.tier,
        diagnosis: "wrong_audience" as Diagnosis,
        evidence:
          "Mediocre performance across all metrics suggests targeting mismatch",
        recommendedAction:
          "Review targeting settings and audience segments. Consider pausing and reallocating budget.",
      };
    });

  const recommendations = generateRecommendations(tiered, diagnosed, patterns);

  const activeTab = params.tab;

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Video Analysis
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
      <VideoTabNav activeTab={activeTab} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <TierOverview tieredCreatives={tiered} kpiType={primaryKpi} />
          <VideoLeaderboard
            tieredCreatives={tiered}
            portfolioAvg={portfolioAvg}
            kpiType={primaryKpi}
          />
        </div>
      )}

      {activeTab === "engagement" && (
        <div className="space-y-6">
          <VideoEngagementChart creatives={tiered} kpiType={primaryKpi} />
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
