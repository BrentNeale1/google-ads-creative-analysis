import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";
import { convertMicrosToAud } from "@/lib/constants/formatting";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface DisplayCreativeAggregated {
  adId: string;
  adName: string | null;
  adType: string;
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
}

export interface DisplayPortfolioAvg {
  avgImpressions: number;
  avgCtr: number;
  avgCvr: number;
  avgCpa: number;
}

export interface DisplayFormatRow {
  adType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
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
    eq(schema.displayDaily.accountId, accountId),
    gte(schema.displayDaily.date, dateFrom),
    lte(schema.displayDaily.date, dateTo),
  ];
}

/** Safe division: returns 0 when denominator is 0 */
function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Map raw adType values to human-readable labels */
const AD_TYPE_LABELS: Record<string, string> = {
  RESPONSIVE_DISPLAY_AD: "Responsive Display",
  IMAGE_AD: "Image Ad",
  DISCOVERY_MULTI_ASSET_AD: "Discovery Multi-Asset",
};

function humanAdType(raw: string): string {
  return AD_TYPE_LABELS[raw] ?? raw;
}

/* ------------------------------------------------------------------ */
/*  Exported query functions                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetch Display creatives aggregated over the date range.
 * Groups by adId+adName+adType+campaignName+adGroupName,
 * computes derived metrics (CTR, CVR, CPA, ROAS).
 */
export async function fetchDisplayCreatives(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<DisplayCreativeAggregated[]> {
  const conditions = [...baseConditions(accountId, dateFrom, dateTo)];

  if (campaignId) {
    conditions.push(eq(schema.displayDaily.campaignId, campaignId));
  }
  if (adGroupId) {
    conditions.push(eq(schema.displayDaily.adGroupId, adGroupId));
  }

  const rows = await db
    .select({
      adId: schema.displayDaily.adId,
      adName: schema.displayDaily.adName,
      adType: schema.displayDaily.adType,
      campaignName: schema.displayDaily.campaignName,
      adGroupName: schema.displayDaily.adGroupName,
      impressions: sum(schema.displayDaily.impressions).mapWith(Number),
      clicks: sum(schema.displayDaily.clicks).mapWith(Number),
      costMicros: sum(schema.displayDaily.costMicros).mapWith(Number),
      conversions: sum(schema.displayDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.displayDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.displayDaily)
    .where(and(...conditions))
    .groupBy(
      schema.displayDaily.adId,
      schema.displayDaily.adName,
      schema.displayDaily.adType,
      schema.displayDaily.campaignName,
      schema.displayDaily.adGroupName,
    );

  return rows.map((row) => {
    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const costMicros = row.costMicros ?? 0;
    const conversions = row.conversions ?? 0;
    const conversionsValue = row.conversionsValue ?? 0;
    const costAud = convertMicrosToAud(costMicros);

    return {
      adId: row.adId,
      adName: row.adName,
      adType: humanAdType(row.adType),
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
    };
  });
}

/**
 * Fetch portfolio-wide average metrics for Display creatives over the date range.
 * Used for underperformer diagnosis (comparing individual creatives to the portfolio).
 * Returns average impressions per creative, average CTR, CVR, and CPA.
 */
export async function fetchDisplayPortfolioAvg(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<DisplayPortfolioAvg> {
  // First aggregate per-creative totals, then compute averages across creatives
  const conditions = baseConditions(accountId, dateFrom, dateTo);

  const perCreative = await db
    .select({
      adId: schema.displayDaily.adId,
      impressions: sum(schema.displayDaily.impressions).mapWith(Number),
      clicks: sum(schema.displayDaily.clicks).mapWith(Number),
      costMicros: sum(schema.displayDaily.costMicros).mapWith(Number),
      conversions: sum(schema.displayDaily.conversions).mapWith(Number),
    })
    .from(schema.displayDaily)
    .where(and(...conditions))
    .groupBy(schema.displayDaily.adId);

  if (perCreative.length === 0) {
    return { avgImpressions: 0, avgCtr: 0, avgCvr: 0, avgCpa: 0 };
  }

  const count = perCreative.length;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCostMicros = 0;
  let totalConversions = 0;

  for (const row of perCreative) {
    totalImpressions += row.impressions ?? 0;
    totalClicks += row.clicks ?? 0;
    totalCostMicros += row.costMicros ?? 0;
    totalConversions += row.conversions ?? 0;
  }

  const totalCostAud = convertMicrosToAud(totalCostMicros);

  return {
    avgImpressions: totalImpressions / count,
    avgCtr: safeDivide(totalClicks, totalImpressions),
    avgCvr: safeDivide(totalConversions, totalClicks),
    avgCpa: safeDivide(totalCostAud, totalConversions),
  };
}

/**
 * Fetch Display creatives aggregated by ad type for format comparison (DISP-03).
 * Returns one row per ad type with aggregated metrics and human-readable labels.
 */
export async function fetchDisplayFormatBreakdown(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<DisplayFormatRow[]> {
  const conditions = baseConditions(accountId, dateFrom, dateTo);

  const rows = await db
    .select({
      adType: schema.displayDaily.adType,
      impressions: sum(schema.displayDaily.impressions).mapWith(Number),
      clicks: sum(schema.displayDaily.clicks).mapWith(Number),
      costMicros: sum(schema.displayDaily.costMicros).mapWith(Number),
      conversions: sum(schema.displayDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.displayDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.displayDaily)
    .where(and(...conditions))
    .groupBy(schema.displayDaily.adType);

  return rows.map((row) => {
    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const costMicros = row.costMicros ?? 0;
    const conversions = row.conversions ?? 0;
    const conversionsValue = row.conversionsValue ?? 0;
    const costAud = convertMicrosToAud(costMicros);

    return {
      adType: humanAdType(row.adType),
      impressions,
      clicks,
      ctr: safeDivide(clicks, impressions),
      conversions,
      cpa: safeDivide(costAud, conversions),
      roas: safeDivide(conversionsValue, costAud),
    };
  });
}
