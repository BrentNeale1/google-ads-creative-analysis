import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";
import { convertMicrosToAud } from "@/lib/constants/formatting";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface VideoCreativeAggregated {
  adId: string;
  adName: string | null;
  campaignName: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
  /** Cost in AUD (converted from micros) */
  costAud: number;
  /** Click-through rate: clicks / impressions */
  ctr: number;
  /** Conversion rate: conversions / clicks */
  cvr: number;
  /** Cost per acquisition: costAud / conversions */
  cpa: number;
  /** Return on ad spend: conversionsValue / costAud */
  roas: number;
  /* Video-specific fields */
  videoViews: number;
  /** Video view rate: videoViews / impressions */
  videoViewRate: number;
  /** Average cost per view in micros */
  averageCpvMicros: number;
  /** Average cost per view in AUD */
  averageCpvAud: number;
  /** Quartile completion rates (impression-weighted averages) */
  videoQuartileP25Rate: number;
  videoQuartileP50Rate: number;
  videoQuartileP75Rate: number;
  videoQuartileP100Rate: number;
}

export interface VideoPortfolioAvg {
  avgImpressions: number;
  avgCtr: number;
  avgCvr: number;
  avgCpa: number;
  avgVideoViewRate: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build base WHERE conditions: accountId + date range. */
function baseConditions(
  accountId: string,
  dateFrom: string,
  dateTo: string,
) {
  return [
    eq(schema.videoDaily.accountId, accountId),
    gte(schema.videoDaily.date, dateFrom),
    lte(schema.videoDaily.date, dateTo),
  ];
}

/** Safe division: returns 0 when denominator is 0 */
function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/* ------------------------------------------------------------------ */
/*  Exported query functions                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetch Video creatives aggregated over the date range.
 * Groups by adId+adName+campaignName+adGroupName.
 * Returns raw + derived metrics including video-specific fields.
 *
 * Aggregation logic for video-specific rates:
 * - videoViewRate = sum(videoViews) / sum(impressions)
 * - averageCpvMicros = sum(costMicros) / sum(videoViews)
 * - Quartile rates = impression-weighted average: sum(rate * impressions) / sum(impressions)
 */
export async function fetchVideoCreatives(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<VideoCreativeAggregated[]> {
  const conditions = [...baseConditions(accountId, dateFrom, dateTo)];

  if (campaignId) {
    conditions.push(eq(schema.videoDaily.campaignId, campaignId));
  }
  if (adGroupId) {
    conditions.push(eq(schema.videoDaily.adGroupId, adGroupId));
  }

  const rows = await db
    .select({
      adId: schema.videoDaily.adId,
      adName: schema.videoDaily.adName,
      campaignName: schema.videoDaily.campaignName,
      adGroupName: schema.videoDaily.adGroupName,
      impressions: sum(schema.videoDaily.impressions).mapWith(Number),
      clicks: sum(schema.videoDaily.clicks).mapWith(Number),
      costMicros: sum(schema.videoDaily.costMicros).mapWith(Number),
      conversions: sum(schema.videoDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.videoDaily.conversionsValue).mapWith(Number),
      videoViews: sum(schema.videoDaily.videoViews).mapWith(Number),
      // Impression-weighted quartile rates: sum(rate * impressions)
      weightedP25: sql<number>`sum(${schema.videoDaily.videoQuartileP25Rate} * ${schema.videoDaily.impressions})`.mapWith(Number),
      weightedP50: sql<number>`sum(${schema.videoDaily.videoQuartileP50Rate} * ${schema.videoDaily.impressions})`.mapWith(Number),
      weightedP75: sql<number>`sum(${schema.videoDaily.videoQuartileP75Rate} * ${schema.videoDaily.impressions})`.mapWith(Number),
      weightedP100: sql<number>`sum(${schema.videoDaily.videoQuartileP100Rate} * ${schema.videoDaily.impressions})`.mapWith(Number),
    })
    .from(schema.videoDaily)
    .where(and(...conditions))
    .groupBy(
      schema.videoDaily.adId,
      schema.videoDaily.adName,
      schema.videoDaily.campaignName,
      schema.videoDaily.adGroupName,
    );

  return rows.map((row) => {
    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const costMicros = row.costMicros ?? 0;
    const conversions = row.conversions ?? 0;
    const conversionsValue = row.conversionsValue ?? 0;
    const videoViews = row.videoViews ?? 0;
    const costAud = convertMicrosToAud(costMicros);

    // Compute video-specific aggregate rates
    const videoViewRate = safeDivide(videoViews, impressions);
    const averageCpvMicros = safeDivide(costMicros, videoViews);
    const averageCpvAud = convertMicrosToAud(averageCpvMicros);

    // Impression-weighted quartile rates
    const videoQuartileP25Rate = safeDivide(row.weightedP25 ?? 0, impressions);
    const videoQuartileP50Rate = safeDivide(row.weightedP50 ?? 0, impressions);
    const videoQuartileP75Rate = safeDivide(row.weightedP75 ?? 0, impressions);
    const videoQuartileP100Rate = safeDivide(row.weightedP100 ?? 0, impressions);

    return {
      adId: row.adId,
      adName: row.adName,
      campaignName: row.campaignName,
      adGroupName: row.adGroupName,
      impressions,
      clicks,
      costMicros,
      conversions,
      conversionsValue,
      costAud,
      ctr: safeDivide(clicks, impressions),
      cvr: safeDivide(conversions, clicks),
      cpa: safeDivide(costAud, conversions),
      roas: safeDivide(conversionsValue, costAud),
      videoViews,
      videoViewRate,
      averageCpvMicros,
      averageCpvAud,
      videoQuartileP25Rate,
      videoQuartileP50Rate,
      videoQuartileP75Rate,
      videoQuartileP100Rate,
    };
  });
}

/**
 * Fetch portfolio-wide average metrics for Video creatives over the date range.
 * Used for underperformer diagnosis (comparing individual creatives to the portfolio).
 * Returns average impressions per creative, average CTR, CVR, CPA, and video view rate.
 */
export async function fetchVideoPortfolioAvg(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<VideoPortfolioAvg> {
  // First aggregate per-creative totals, then compute averages across creatives
  const conditions = baseConditions(accountId, dateFrom, dateTo);

  const perCreative = await db
    .select({
      adId: schema.videoDaily.adId,
      impressions: sum(schema.videoDaily.impressions).mapWith(Number),
      clicks: sum(schema.videoDaily.clicks).mapWith(Number),
      costMicros: sum(schema.videoDaily.costMicros).mapWith(Number),
      conversions: sum(schema.videoDaily.conversions).mapWith(Number),
      videoViews: sum(schema.videoDaily.videoViews).mapWith(Number),
    })
    .from(schema.videoDaily)
    .where(and(...conditions))
    .groupBy(schema.videoDaily.adId);

  if (perCreative.length === 0) {
    return {
      avgImpressions: 0,
      avgCtr: 0,
      avgCvr: 0,
      avgCpa: 0,
      avgVideoViewRate: 0,
    };
  }

  const count = perCreative.length;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCostMicros = 0;
  let totalConversions = 0;
  let totalVideoViews = 0;

  for (const row of perCreative) {
    totalImpressions += row.impressions ?? 0;
    totalClicks += row.clicks ?? 0;
    totalCostMicros += row.costMicros ?? 0;
    totalConversions += row.conversions ?? 0;
    totalVideoViews += row.videoViews ?? 0;
  }

  const totalCostAud = convertMicrosToAud(totalCostMicros);

  return {
    avgImpressions: totalImpressions / count,
    avgCtr: safeDivide(totalClicks, totalImpressions),
    avgCvr: safeDivide(totalConversions, totalClicks),
    avgCpa: safeDivide(totalCostAud, totalConversions),
    avgVideoViewRate: safeDivide(totalVideoViews, totalImpressions),
  };
}
