import "server-only";

import { fetchRsaCreatives } from "@/lib/queries/rsa";
import { fetchPmaxAssetGroups, fetchPmaxTextAssets } from "@/lib/queries/pmax";
import { fetchDisplayCreatives } from "@/lib/queries/display";
import { fetchVideoCreatives } from "@/lib/queries/video";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { subDays, format, startOfDay } from "date-fns";
import type { PrimaryKpi } from "@/lib/analysis/types";
import { convertMicrosToAud } from "@/lib/constants/formatting";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Minimal aggregated creative for cross-format comparison */
export interface CreativeAgg {
  adId: string;
  kpiValue: number;
  impressions: number;
  label?: string;
}

/** Briefing data spanning two 7-day periods across all formats */
export interface BriefingData {
  currentPeriod: { from: string; to: string };
  priorPeriod: { from: string; to: string };
  rsa: { current: CreativeAgg[]; prior: CreativeAgg[] };
  pmax: { current: CreativeAgg[]; prior: CreativeAgg[] };
  display: { current: CreativeAgg[]; prior: CreativeAgg[] };
  video: { current: CreativeAgg[]; prior: CreativeAgg[] };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Safe division: returns 0 when denominator is 0 */
function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Format date as YYYY-MM-DD */
function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Compute KPI value based on account's primary KPI setting.
 * CPA = costAud / conversions. ROAS = conversionsValue / costAud.
 */
function computeKpi(
  kpiType: PrimaryKpi,
  costMicros: number,
  conversions: number,
  conversionsValue: number,
): number {
  const costAud = convertMicrosToAud(costMicros);
  if (kpiType === "cpa") {
    return safeDivide(costAud, conversions);
  }
  return safeDivide(conversionsValue, costAud);
}

/** Join RSA headlines into a label string */
function joinHeadlines(headlines: unknown): string {
  if (!Array.isArray(headlines)) return "RSA Ad";
  return (
    (headlines as Array<string | { text?: string }>)
      .map((h) => (typeof h === "string" ? h : h?.text ?? ""))
      .filter(Boolean)
      .slice(0, 3)
      .join(" | ") || "RSA Ad"
  );
}

/* ------------------------------------------------------------------ */
/*  Exported query function                                            */
/* ------------------------------------------------------------------ */

/**
 * Fetch cross-format briefing data for two 7-day periods.
 *
 * Current period: today - 7 days to today
 * Prior period: today - 14 days to today - 7 days
 *
 * Returns CreativeAgg arrays per format per period, with kpiValue
 * computed from the account's primary KPI setting.
 */
export async function fetchBriefingData(
  accountId: string,
): Promise<BriefingData> {
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 7);
  const fourteenDaysAgo = subDays(today, 14);

  const currentFrom = fmt(sevenDaysAgo);
  const currentTo = fmt(today);
  const priorFrom = fmt(fourteenDaysAgo);
  const priorTo = fmt(sevenDaysAgo);

  // Fetch account for primaryKpi
  const accountRows = await db
    .select({ primaryKpi: schema.accounts.primaryKpi })
    .from(schema.accounts)
    .where(eq(schema.accounts.id, accountId))
    .limit(1);

  const kpiType = (accountRows[0]?.primaryKpi ?? "cpa") as PrimaryKpi;

  // Fetch 8 queries in parallel: 4 formats x 2 periods
  const [
    rsaCurrent,
    rsaPrior,
    pmaxCurrent,
    pmaxPrior,
    displayCurrent,
    displayPrior,
    videoCurrent,
    videoPrior,
  ] = await Promise.all([
    fetchRsaCreatives(accountId, currentFrom, currentTo),
    fetchRsaCreatives(accountId, priorFrom, priorTo),
    fetchPmaxAssetGroups(accountId, currentFrom, currentTo),
    fetchPmaxAssetGroups(accountId, priorFrom, priorTo),
    fetchDisplayCreatives(accountId, currentFrom, currentTo),
    fetchDisplayCreatives(accountId, priorFrom, priorTo),
    fetchVideoCreatives(accountId, currentFrom, currentTo),
    fetchVideoCreatives(accountId, priorFrom, priorTo),
  ]);

  // Map RSA creatives to CreativeAgg
  const mapRsa = (rows: typeof rsaCurrent): CreativeAgg[] =>
    rows.map((r) => ({
      adId: r.adId,
      kpiValue: computeKpi(kpiType, r.costMicros, r.conversions, r.conversionsValue),
      impressions: r.impressions,
      label: joinHeadlines(r.headlines),
    }));

  // Map PMax asset groups to CreativeAgg
  const mapPmax = (rows: typeof pmaxCurrent): CreativeAgg[] =>
    rows.map((r) => ({
      adId: r.assetGroupId,
      kpiValue: computeKpi(kpiType, r.costMicros, r.conversions, r.conversionsValue),
      impressions: r.impressions,
      label: r.assetGroupName,
    }));

  // Map Display creatives to CreativeAgg
  const mapDisplay = (rows: typeof displayCurrent): CreativeAgg[] =>
    rows.map((r) => ({
      adId: r.adId,
      kpiValue: computeKpi(kpiType, r.costMicros, r.conversions, r.conversionsValue),
      impressions: r.impressions,
      label: r.adName ?? "Display Ad",
    }));

  // Map Video creatives to CreativeAgg
  const mapVideo = (rows: typeof videoCurrent): CreativeAgg[] =>
    rows.map((r) => ({
      adId: r.adId,
      kpiValue: computeKpi(kpiType, r.costMicros, r.conversions, r.conversionsValue),
      impressions: r.impressions,
      label: r.adName ?? "Video Ad",
    }));

  return {
    currentPeriod: { from: currentFrom, to: currentTo },
    priorPeriod: { from: priorFrom, to: priorTo },
    rsa: { current: mapRsa(rsaCurrent), prior: mapRsa(rsaPrior) },
    pmax: { current: mapPmax(pmaxCurrent), prior: mapPmax(pmaxPrior) },
    display: {
      current: mapDisplay(displayCurrent),
      prior: mapDisplay(displayPrior),
    },
    video: {
      current: mapVideo(videoCurrent),
      prior: mapVideo(videoPrior),
    },
  };
}
