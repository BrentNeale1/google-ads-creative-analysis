import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sum, sql, desc } from "drizzle-orm";
import { convertMicrosToAud } from "@/lib/constants/formatting";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface RsaCreativeAggregated {
  adId: string;
  campaignName: string;
  adGroupName: string;
  headlines: unknown;
  descriptions: unknown;
  adStrength: string | null;
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

export interface RsaAssetAggregated {
  adId: string;
  assetResource: string;
  fieldType: string;
  textContent: string | null;
  performanceLabel: string | null;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  /** Cost in AUD (converted from micros) */
  costAud: number;
  /** Click-through rate: clicks / impressions */
  ctr: number;
  /** Cost per acquisition: costAud / conversions */
  cpa: number;
}

export interface RsaCombinationAggregated {
  adId: string;
  headlines: unknown;
  descriptions: unknown;
  impressions: number;
}

export interface PortfolioAvg {
  avgImpressions: number;
  avgCtr: number;
  avgCvr: number;
  avgCpa: number;
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
  return {
    rsaDaily: [
      eq(schema.rsaDaily.accountId, accountId),
      gte(schema.rsaDaily.date, dateFrom),
      lte(schema.rsaDaily.date, dateTo),
    ],
    rsaAssetDaily: [
      eq(schema.rsaAssetDaily.accountId, accountId),
      gte(schema.rsaAssetDaily.date, dateFrom),
      lte(schema.rsaAssetDaily.date, dateTo),
    ],
    rsaCombinationDaily: [
      eq(schema.rsaCombinationDaily.accountId, accountId),
      gte(schema.rsaCombinationDaily.date, dateFrom),
      lte(schema.rsaCombinationDaily.date, dateTo),
    ],
  };
}

/** Safe division: returns 0 when denominator is 0 */
function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/* ------------------------------------------------------------------ */
/*  Exported query functions                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetch RSA creatives aggregated over the date range.
 * Groups by adId, campaignName, adGroupName, headlines, descriptions, adStrength.
 * Returns raw + derived metrics (CTR, CVR, CPA, ROAS).
 */
export async function fetchRsaCreatives(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<RsaCreativeAggregated[]> {
  const conditions = [...baseConditions(accountId, dateFrom, dateTo).rsaDaily];

  if (campaignId) {
    conditions.push(eq(schema.rsaDaily.campaignId, campaignId));
  }
  if (adGroupId) {
    conditions.push(eq(schema.rsaDaily.adGroupId, adGroupId));
  }

  const rows = await db
    .select({
      adId: schema.rsaDaily.adId,
      campaignName: schema.rsaDaily.campaignName,
      adGroupName: schema.rsaDaily.adGroupName,
      headlines: schema.rsaDaily.headlines,
      descriptions: schema.rsaDaily.descriptions,
      adStrength: schema.rsaDaily.adStrength,
      impressions: sum(schema.rsaDaily.impressions).mapWith(Number),
      clicks: sum(schema.rsaDaily.clicks).mapWith(Number),
      costMicros: sum(schema.rsaDaily.costMicros).mapWith(Number),
      conversions: sum(schema.rsaDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.rsaDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.rsaDaily)
    .where(and(...conditions))
    .groupBy(
      schema.rsaDaily.adId,
      schema.rsaDaily.campaignName,
      schema.rsaDaily.adGroupName,
      schema.rsaDaily.headlines,
      schema.rsaDaily.descriptions,
      schema.rsaDaily.adStrength,
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
      campaignName: row.campaignName,
      adGroupName: row.adGroupName,
      headlines: row.headlines,
      descriptions: row.descriptions,
      adStrength: row.adStrength,
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
 * Fetch RSA asset-level data aggregated over the date range.
 * Groups by adId, assetResource, fieldType, textContent, performanceLabel.
 * Returns raw + derived metrics (CTR, CPA).
 */
export async function fetchRsaAssets(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  adId?: string | null,
): Promise<RsaAssetAggregated[]> {
  const conditions = [...baseConditions(accountId, dateFrom, dateTo).rsaAssetDaily];

  if (adId) {
    conditions.push(eq(schema.rsaAssetDaily.adId, adId));
  }

  const rows = await db
    .select({
      adId: schema.rsaAssetDaily.adId,
      assetResource: schema.rsaAssetDaily.assetResource,
      fieldType: schema.rsaAssetDaily.fieldType,
      textContent: schema.rsaAssetDaily.textContent,
      performanceLabel: schema.rsaAssetDaily.performanceLabel,
      impressions: sum(schema.rsaAssetDaily.impressions).mapWith(Number),
      clicks: sum(schema.rsaAssetDaily.clicks).mapWith(Number),
      costMicros: sum(schema.rsaAssetDaily.costMicros).mapWith(Number),
      conversions: sum(schema.rsaAssetDaily.conversions).mapWith(Number),
    })
    .from(schema.rsaAssetDaily)
    .where(and(...conditions))
    .groupBy(
      schema.rsaAssetDaily.adId,
      schema.rsaAssetDaily.assetResource,
      schema.rsaAssetDaily.fieldType,
      schema.rsaAssetDaily.textContent,
      schema.rsaAssetDaily.performanceLabel,
    );

  return rows.map((row) => {
    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const costMicros = row.costMicros ?? 0;
    const conversions = row.conversions ?? 0;
    const costAud = convertMicrosToAud(costMicros);

    return {
      adId: row.adId,
      assetResource: row.assetResource,
      fieldType: row.fieldType,
      textContent: row.textContent,
      performanceLabel: row.performanceLabel,
      impressions,
      clicks,
      costMicros,
      conversions,
      costAud,
      ctr: safeDivide(clicks, impressions),
      cpa: safeDivide(costAud, conversions),
    };
  });
}

/**
 * Fetch RSA headline+description combination data aggregated over the date range.
 * Groups by adId, headlines, descriptions.
 * Returns impressions only (Google does not provide clicks/conversions for combinations).
 * Sorted by impressions descending (most-served combinations first).
 */
export async function fetchRsaCombinations(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  adId?: string | null,
): Promise<RsaCombinationAggregated[]> {
  const conditions = [...baseConditions(accountId, dateFrom, dateTo).rsaCombinationDaily];

  if (adId) {
    conditions.push(eq(schema.rsaCombinationDaily.adId, adId));
  }

  const rows = await db
    .select({
      adId: schema.rsaCombinationDaily.adId,
      headlines: schema.rsaCombinationDaily.headlines,
      descriptions: schema.rsaCombinationDaily.descriptions,
      impressions: sum(schema.rsaCombinationDaily.impressions).mapWith(Number),
    })
    .from(schema.rsaCombinationDaily)
    .where(and(...conditions))
    .groupBy(
      schema.rsaCombinationDaily.adId,
      schema.rsaCombinationDaily.headlines,
      schema.rsaCombinationDaily.descriptions,
    )
    .orderBy(desc(sum(schema.rsaCombinationDaily.impressions)));

  return rows.map((row) => ({
    adId: row.adId,
    headlines: row.headlines,
    descriptions: row.descriptions,
    impressions: row.impressions ?? 0,
  }));
}

/**
 * Fetch portfolio-wide average metrics for RSA creatives over the date range.
 * Used for underperformer diagnosis (comparing individual creatives to the portfolio).
 * Returns average impressions per creative, average CTR, CVR, and CPA.
 */
export async function fetchRsaPortfolioAvg(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<PortfolioAvg> {
  // First aggregate per-creative totals, then compute averages across creatives
  const conditions = baseConditions(accountId, dateFrom, dateTo).rsaDaily;

  const perCreative = await db
    .select({
      adId: schema.rsaDaily.adId,
      impressions: sum(schema.rsaDaily.impressions).mapWith(Number),
      clicks: sum(schema.rsaDaily.clicks).mapWith(Number),
      costMicros: sum(schema.rsaDaily.costMicros).mapWith(Number),
      conversions: sum(schema.rsaDaily.conversions).mapWith(Number),
    })
    .from(schema.rsaDaily)
    .where(and(...conditions))
    .groupBy(schema.rsaDaily.adId);

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
