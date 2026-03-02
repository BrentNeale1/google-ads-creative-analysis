import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sum, desc } from "drizzle-orm";
import { convertMicrosToAud } from "@/lib/constants/formatting";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface PmaxAssetGroupAggregated {
  assetGroupId: string;
  assetGroupName: string;
  campaignName: string;
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

export interface PmaxTextAsset {
  assetGroupId: string;
  textContent: string | null;
  performanceLabel: string | null;
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
    pmaxAssetGroupDaily: [
      eq(schema.pmaxAssetGroupDaily.accountId, accountId),
      gte(schema.pmaxAssetGroupDaily.date, dateFrom),
      lte(schema.pmaxAssetGroupDaily.date, dateTo),
    ],
    pmaxAssetDaily: [
      eq(schema.pmaxAssetDaily.accountId, accountId),
      gte(schema.pmaxAssetDaily.date, dateFrom),
      lte(schema.pmaxAssetDaily.date, dateTo),
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
 * Fetch PMax asset groups aggregated over the date range.
 * Groups by assetGroupId, assetGroupName, campaignName.
 * Returns raw + derived metrics (CTR, CVR, CPA, ROAS).
 */
export async function fetchPmaxAssetGroups(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
): Promise<PmaxAssetGroupAggregated[]> {
  const conditions = [
    ...baseConditions(accountId, dateFrom, dateTo).pmaxAssetGroupDaily,
  ];

  if (campaignId) {
    conditions.push(
      eq(schema.pmaxAssetGroupDaily.campaignId, campaignId),
    );
  }

  const rows = await db
    .select({
      assetGroupId: schema.pmaxAssetGroupDaily.assetGroupId,
      assetGroupName: schema.pmaxAssetGroupDaily.assetGroupName,
      campaignName: schema.pmaxAssetGroupDaily.campaignName,
      impressions: sum(schema.pmaxAssetGroupDaily.impressions).mapWith(Number),
      clicks: sum(schema.pmaxAssetGroupDaily.clicks).mapWith(Number),
      costMicros: sum(schema.pmaxAssetGroupDaily.costMicros).mapWith(Number),
      conversions: sum(schema.pmaxAssetGroupDaily.conversions).mapWith(Number),
      conversionsValue:
        sum(schema.pmaxAssetGroupDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.pmaxAssetGroupDaily)
    .where(and(...conditions))
    .groupBy(
      schema.pmaxAssetGroupDaily.assetGroupId,
      schema.pmaxAssetGroupDaily.assetGroupName,
      schema.pmaxAssetGroupDaily.campaignName,
    );

  return rows.map((row) => {
    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const costMicros = row.costMicros ?? 0;
    const conversions = row.conversions ?? 0;
    const conversionsValue = row.conversionsValue ?? 0;
    const costAud = convertMicrosToAud(costMicros);

    return {
      assetGroupId: row.assetGroupId,
      assetGroupName: row.assetGroupName,
      campaignName: row.campaignName,
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
 * Fetch portfolio-wide average metrics for PMax asset groups over the date range.
 * Used for underperformer diagnosis (comparing individual asset groups to the portfolio).
 * Returns average impressions per asset group, average CTR, CVR, and CPA.
 */
export async function fetchPmaxPortfolioAvg(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<PortfolioAvg> {
  // First aggregate per-asset-group totals, then compute averages across asset groups
  const conditions =
    baseConditions(accountId, dateFrom, dateTo).pmaxAssetGroupDaily;

  const perAssetGroup = await db
    .select({
      assetGroupId: schema.pmaxAssetGroupDaily.assetGroupId,
      impressions: sum(schema.pmaxAssetGroupDaily.impressions).mapWith(Number),
      clicks: sum(schema.pmaxAssetGroupDaily.clicks).mapWith(Number),
      costMicros: sum(schema.pmaxAssetGroupDaily.costMicros).mapWith(Number),
      conversions: sum(schema.pmaxAssetGroupDaily.conversions).mapWith(Number),
    })
    .from(schema.pmaxAssetGroupDaily)
    .where(and(...conditions))
    .groupBy(schema.pmaxAssetGroupDaily.assetGroupId);

  if (perAssetGroup.length === 0) {
    return { avgImpressions: 0, avgCtr: 0, avgCvr: 0, avgCpa: 0 };
  }

  const count = perAssetGroup.length;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCostMicros = 0;
  let totalConversions = 0;

  for (const row of perAssetGroup) {
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
 * Fetch PMax text assets grouped by asset group.
 * Queries pmaxAssetDaily where assetType='TEXT'.
 * Returns array of { assetGroupId, textContent, performanceLabel }.
 */
export async function fetchPmaxTextAssets(
  accountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<PmaxTextAsset[]> {
  const conditions = [
    ...baseConditions(accountId, dateFrom, dateTo).pmaxAssetDaily,
    eq(schema.pmaxAssetDaily.assetType, "TEXT"),
  ];

  const rows = await db
    .selectDistinct({
      assetGroupId: schema.pmaxAssetDaily.assetGroupId,
      textContent: schema.pmaxAssetDaily.textContent,
      performanceLabel: schema.pmaxAssetDaily.performanceLabel,
    })
    .from(schema.pmaxAssetDaily)
    .where(and(...conditions));

  return rows.map((row) => ({
    assetGroupId: row.assetGroupId,
    textContent: row.textContent,
    performanceLabel: row.performanceLabel,
  }));
}
