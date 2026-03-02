import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface KpiTotals {
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
}

export interface TimeSeriesRow {
  date: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
}

export interface CreativeRow {
  name: string;
  adId: string;
  type: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
}

export interface FilterOptions {
  campaigns: Array<{ id: string; name: string }>;
  adGroups: Array<{ id: string; name: string; campaignId: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build base WHERE conditions for a table: accountId + date range. */
function baseConditions(
  table: {
    accountId: PgColumn;
    date: PgColumn;
  },
  accountId: string,
  dateFrom: string,
  dateTo: string,
) {
  return [
    eq(table.accountId, accountId),
    gte(table.date, dateFrom),
    lte(table.date, dateTo),
  ];
}

/**
 * Aggregate KPI totals from a single daily table.
 * Handles optional campaignId and adGroupId filters.
 * PMax tables do not have adGroupId so it is skipped for those.
 */
async function aggregateTable(
  table: typeof schema.rsaDaily | typeof schema.pmaxAssetGroupDaily | typeof schema.displayDaily | typeof schema.videoDaily,
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<KpiTotals> {
  const conditions = baseConditions(table, accountId, dateFrom, dateTo);

  if (campaignId) {
    conditions.push(eq(table.campaignId, campaignId));
  }

  // adGroupId filter -- only for tables that have it (not PMax)
  if (adGroupId && "adGroupId" in table) {
    conditions.push(
      eq(
        (table as typeof schema.rsaDaily).adGroupId,
        adGroupId,
      ),
    );
  }

  const result = await db
    .select({
      impressions: sum(table.impressions).mapWith(Number),
      clicks: sum(table.clicks).mapWith(Number),
      costMicros: sum(table.costMicros).mapWith(Number),
      conversions: sum(table.conversions).mapWith(Number),
      conversionsValue: sum(table.conversionsValue).mapWith(Number),
    })
    .from(table)
    .where(and(...conditions));

  const row = result[0];
  return {
    impressions: row?.impressions ?? 0,
    clicks: row?.clicks ?? 0,
    costMicros: row?.costMicros ?? 0,
    conversions: row?.conversions ?? 0,
    conversionsValue: row?.conversionsValue ?? 0,
  };
}

/**
 * Aggregate time-series data from a single daily table grouped by date.
 */
async function aggregateTableTimeSeries(
  table: typeof schema.rsaDaily | typeof schema.pmaxAssetGroupDaily | typeof schema.displayDaily | typeof schema.videoDaily,
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<TimeSeriesRow[]> {
  const conditions = baseConditions(table, accountId, dateFrom, dateTo);

  if (campaignId) {
    conditions.push(eq(table.campaignId, campaignId));
  }

  if (adGroupId && "adGroupId" in table) {
    conditions.push(
      eq(
        (table as typeof schema.rsaDaily).adGroupId,
        adGroupId,
      ),
    );
  }

  const result = await db
    .select({
      date: table.date,
      impressions: sum(table.impressions).mapWith(Number),
      clicks: sum(table.clicks).mapWith(Number),
      costMicros: sum(table.costMicros).mapWith(Number),
      conversions: sum(table.conversions).mapWith(Number),
      conversionsValue: sum(table.conversionsValue).mapWith(Number),
    })
    .from(table)
    .where(and(...conditions))
    .groupBy(table.date)
    .orderBy(table.date);

  return result.map((row) => ({
    date: row.date,
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    costMicros: row.costMicros ?? 0,
    conversions: row.conversions ?? 0,
    conversionsValue: row.conversionsValue ?? 0,
  }));
}

/** Sum two KpiTotals objects together. */
function sumTotals(a: KpiTotals, b: KpiTotals): KpiTotals {
  return {
    impressions: a.impressions + b.impressions,
    clicks: a.clicks + b.clicks,
    costMicros: a.costMicros + b.costMicros,
    conversions: a.conversions + b.conversions,
    conversionsValue: a.conversionsValue + b.conversionsValue,
  };
}

/** Merge multiple time-series arrays into one, summing values per date. */
function mergeTimeSeries(...arrays: TimeSeriesRow[][]): TimeSeriesRow[] {
  const map = new Map<string, TimeSeriesRow>();

  for (const arr of arrays) {
    for (const row of arr) {
      const existing = map.get(row.date);
      if (existing) {
        existing.impressions += row.impressions;
        existing.clicks += row.clicks;
        existing.costMicros += row.costMicros;
        existing.conversions += row.conversions;
        existing.conversionsValue += row.conversionsValue;
      } else {
        map.set(row.date, { ...row });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/* ------------------------------------------------------------------ */
/*  Exported query functions                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetch aggregated KPI totals across ALL 4 daily tables.
 * Returns combined impressions, clicks, costMicros, conversions, conversionsValue.
 */
export async function fetchKpiMetrics(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<KpiTotals> {
  const [rsa, pmax, display, video] = await Promise.all([
    aggregateTable(schema.rsaDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
    aggregateTable(schema.pmaxAssetGroupDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
    aggregateTable(schema.displayDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
    aggregateTable(schema.videoDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
  ]);

  return [rsa, pmax, display, video].reduce(sumTotals);
}

/**
 * Fetch daily time-series data across ALL 4 daily tables.
 * Returns an array sorted by date ascending with all metrics per day.
 */
export async function fetchTimeSeries(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<TimeSeriesRow[]> {
  const [rsa, pmax, display, video] = await Promise.all([
    aggregateTableTimeSeries(schema.rsaDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
    aggregateTableTimeSeries(schema.pmaxAssetGroupDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
    aggregateTableTimeSeries(schema.displayDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
    aggregateTableTimeSeries(schema.videoDaily, accountId, dateFrom, dateTo, campaignId, adGroupId),
  ]);

  return mergeTimeSeries(rsa, pmax, display, video);
}

/**
 * Fetch per-creative aggregated totals for the horizontal bar chart.
 * Queries each table for per-creative totals and combines into a single array.
 */
export async function fetchCreativeComparison(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: string | null,
  adGroupId?: string | null,
): Promise<CreativeRow[]> {
  const baseConds = (table: { accountId: PgColumn; date: PgColumn }) =>
    baseConditions(table, accountId, dateFrom, dateTo);

  // RSA: grouped by adId, name = adGroupName + " / Ad " + adId
  const rsaConditions = [...baseConds(schema.rsaDaily)];
  if (campaignId) rsaConditions.push(eq(schema.rsaDaily.campaignId, campaignId));
  if (adGroupId) rsaConditions.push(eq(schema.rsaDaily.adGroupId, adGroupId));

  const rsaCreatives = db
    .select({
      name: sql<string>`${schema.rsaDaily.adGroupName} || ' / Ad ' || ${schema.rsaDaily.adId}`,
      adId: schema.rsaDaily.adId,
      impressions: sum(schema.rsaDaily.impressions).mapWith(Number),
      clicks: sum(schema.rsaDaily.clicks).mapWith(Number),
      costMicros: sum(schema.rsaDaily.costMicros).mapWith(Number),
      conversions: sum(schema.rsaDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.rsaDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.rsaDaily)
    .where(and(...rsaConditions))
    .groupBy(schema.rsaDaily.adId, schema.rsaDaily.adGroupName);

  // PMax: grouped by assetGroupId, name = assetGroupName
  const pmaxConditions = [...baseConds(schema.pmaxAssetGroupDaily)];
  if (campaignId) pmaxConditions.push(eq(schema.pmaxAssetGroupDaily.campaignId, campaignId));

  const pmaxCreatives = db
    .select({
      name: schema.pmaxAssetGroupDaily.assetGroupName,
      adId: schema.pmaxAssetGroupDaily.assetGroupId,
      impressions: sum(schema.pmaxAssetGroupDaily.impressions).mapWith(Number),
      clicks: sum(schema.pmaxAssetGroupDaily.clicks).mapWith(Number),
      costMicros: sum(schema.pmaxAssetGroupDaily.costMicros).mapWith(Number),
      conversions: sum(schema.pmaxAssetGroupDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.pmaxAssetGroupDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.pmaxAssetGroupDaily)
    .where(and(...pmaxConditions))
    .groupBy(schema.pmaxAssetGroupDaily.assetGroupId, schema.pmaxAssetGroupDaily.assetGroupName);

  // Display: grouped by adId, name = adName or adId
  const displayConditions = [...baseConds(schema.displayDaily)];
  if (campaignId) displayConditions.push(eq(schema.displayDaily.campaignId, campaignId));
  if (adGroupId) displayConditions.push(eq(schema.displayDaily.adGroupId, adGroupId));

  const displayCreatives = db
    .select({
      name: sql<string>`coalesce(${schema.displayDaily.adName}, ${schema.displayDaily.adId})`,
      adId: schema.displayDaily.adId,
      impressions: sum(schema.displayDaily.impressions).mapWith(Number),
      clicks: sum(schema.displayDaily.clicks).mapWith(Number),
      costMicros: sum(schema.displayDaily.costMicros).mapWith(Number),
      conversions: sum(schema.displayDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.displayDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.displayDaily)
    .where(and(...displayConditions))
    .groupBy(schema.displayDaily.adId, schema.displayDaily.adName);

  // Video: grouped by adId, name = adName or adId
  const videoConditions = [...baseConds(schema.videoDaily)];
  if (campaignId) videoConditions.push(eq(schema.videoDaily.campaignId, campaignId));
  if (adGroupId) videoConditions.push(eq(schema.videoDaily.adGroupId, adGroupId));

  const videoCreatives = db
    .select({
      name: sql<string>`coalesce(${schema.videoDaily.adName}, ${schema.videoDaily.adId})`,
      adId: schema.videoDaily.adId,
      impressions: sum(schema.videoDaily.impressions).mapWith(Number),
      clicks: sum(schema.videoDaily.clicks).mapWith(Number),
      costMicros: sum(schema.videoDaily.costMicros).mapWith(Number),
      conversions: sum(schema.videoDaily.conversions).mapWith(Number),
      conversionsValue: sum(schema.videoDaily.conversionsValue).mapWith(Number),
    })
    .from(schema.videoDaily)
    .where(and(...videoConditions))
    .groupBy(schema.videoDaily.adId, schema.videoDaily.adName);

  const [rsaRows, pmaxRows, displayRows, videoRows] = await Promise.all([
    rsaCreatives,
    pmaxCreatives,
    displayCreatives,
    videoCreatives,
  ]);

  const toCreativeRow = (
    row: { name: string | null; adId: string; impressions: number; clicks: number; costMicros: number; conversions: number; conversionsValue: number },
    type: string,
  ): CreativeRow => ({
    name: row.name ?? row.adId,
    adId: row.adId,
    type,
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    costMicros: row.costMicros ?? 0,
    conversions: row.conversions ?? 0,
    conversionsValue: row.conversionsValue ?? 0,
  });

  return [
    ...rsaRows.map((r) => toCreativeRow(r, "rsa")),
    ...pmaxRows.map((r) => toCreativeRow(r, "pmax")),
    ...displayRows.map((r) => toCreativeRow(r, "display")),
    ...videoRows.map((r) => toCreativeRow(r, "video")),
  ];
}

/**
 * Fetch distinct campaign and ad group options for filter dropdowns.
 * Queries RSA, Display, and Video tables for campaign/ad group pairs.
 * PMax campaigns are included but without ad groups (they use asset groups).
 */
export async function fetchFilterOptions(
  accountId: string,
): Promise<FilterOptions> {
  // Gather distinct campaigns from all 4 tables
  const [rsaCampaigns, pmaxCampaigns, displayCampaigns, videoCampaigns] =
    await Promise.all([
      db
        .selectDistinct({
          id: schema.rsaDaily.campaignId,
          name: schema.rsaDaily.campaignName,
        })
        .from(schema.rsaDaily)
        .where(eq(schema.rsaDaily.accountId, accountId)),
      db
        .selectDistinct({
          id: schema.pmaxAssetGroupDaily.campaignId,
          name: schema.pmaxAssetGroupDaily.campaignName,
        })
        .from(schema.pmaxAssetGroupDaily)
        .where(eq(schema.pmaxAssetGroupDaily.accountId, accountId)),
      db
        .selectDistinct({
          id: schema.displayDaily.campaignId,
          name: schema.displayDaily.campaignName,
        })
        .from(schema.displayDaily)
        .where(eq(schema.displayDaily.accountId, accountId)),
      db
        .selectDistinct({
          id: schema.videoDaily.campaignId,
          name: schema.videoDaily.campaignName,
        })
        .from(schema.videoDaily)
        .where(eq(schema.videoDaily.accountId, accountId)),
    ]);

  // Deduplicate campaigns by ID
  const campaignMap = new Map<string, { id: string; name: string }>();
  for (const c of [
    ...rsaCampaigns,
    ...pmaxCampaigns,
    ...displayCampaigns,
    ...videoCampaigns,
  ]) {
    if (!campaignMap.has(c.id)) {
      campaignMap.set(c.id, { id: c.id, name: c.name });
    }
  }

  // Gather distinct ad groups from RSA, Display, and Video (not PMax)
  const [rsaAdGroups, displayAdGroups, videoAdGroups] = await Promise.all([
    db
      .selectDistinct({
        id: schema.rsaDaily.adGroupId,
        name: schema.rsaDaily.adGroupName,
        campaignId: schema.rsaDaily.campaignId,
      })
      .from(schema.rsaDaily)
      .where(eq(schema.rsaDaily.accountId, accountId)),
    db
      .selectDistinct({
        id: schema.displayDaily.adGroupId,
        name: schema.displayDaily.adGroupName,
        campaignId: schema.displayDaily.campaignId,
      })
      .from(schema.displayDaily)
      .where(eq(schema.displayDaily.accountId, accountId)),
    db
      .selectDistinct({
        id: schema.videoDaily.adGroupId,
        name: schema.videoDaily.adGroupName,
        campaignId: schema.videoDaily.campaignId,
      })
      .from(schema.videoDaily)
      .where(eq(schema.videoDaily.accountId, accountId)),
  ]);

  // Deduplicate ad groups by ID
  const adGroupMap = new Map<
    string,
    { id: string; name: string; campaignId: string }
  >();
  for (const ag of [...rsaAdGroups, ...displayAdGroups, ...videoAdGroups]) {
    if (!adGroupMap.has(ag.id)) {
      adGroupMap.set(ag.id, {
        id: ag.id,
        name: ag.name,
        campaignId: ag.campaignId,
      });
    }
  }

  return {
    campaigns: Array.from(campaignMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    adGroups: Array.from(adGroupMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}
