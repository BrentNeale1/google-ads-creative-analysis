import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { ingestionSchema } from '@/lib/validation/ingestionSchema';
import { generateApiKey } from '@/lib/utils/apiKey';

/**
 * POST /api/ingest
 *
 * Accepts Google Ads creative performance data from the Apps Script push.
 * Handles auto-registration on first push, API key authentication for
 * subsequent pushes, Zod validation, ON CONFLICT upsert for deduplication,
 * and sync logging.
 */
export async function POST(request: NextRequest) {
  /* ---------------------------------------------------------------- */
  /*  1. Parse JSON body                                              */
  /* ---------------------------------------------------------------- */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', details: [] },
      { status: 400 },
    );
  }

  /* ---------------------------------------------------------------- */
  /*  2. Validate with Zod                                            */
  /* ---------------------------------------------------------------- */
  const parsed = ingestionSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return NextResponse.json(
      { error: 'Validation failed', details },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const apiKeyHeader = request.headers.get('x-api-key') || '';

  /* ---------------------------------------------------------------- */
  /*  3. Authentication + auto-registration                           */
  /* ---------------------------------------------------------------- */
  let isNewAccount = false;
  let generatedApiKey: string | undefined;

  const existingAccount = await db.query.accounts.findFirst({
    where: eq(schema.accounts.id, data.accountId),
  });

  if (!existingAccount) {
    // Case 1: New account -- auto-register
    isNewAccount = true;
    generatedApiKey = generateApiKey();
    await db.insert(schema.accounts).values({
      id: data.accountId,
      displayName: data.accountName,
      apiKey: generatedApiKey,
      primaryKpi: 'cpa',
    });
  } else if (existingAccount.apiKey !== apiKeyHeader) {
    // Case 3: Existing account, wrong or missing key
    return NextResponse.json(
      { error: 'Invalid API key for this account', details: [] },
      { status: 403 },
    );
  }
  // Case 2: Existing account, valid key -- continue

  /* ---------------------------------------------------------------- */
  /*  4. Upsert performance data                                      */
  /* ---------------------------------------------------------------- */
  let totalRecords = 0;

  try {
    // --- RSA daily ---
    if (data.rsa && data.rsa.length > 0) {
      const rows = data.rsa.map((r) => ({
        accountId: data.accountId,
        date: data.date,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        adGroupId: r.adGroupId,
        adGroupName: r.adGroupName,
        adId: r.adId,
        headlines: r.headlines,
        descriptions: r.descriptions,
        adStrength: r.adStrength ?? null,
        impressions: r.impressions,
        clicks: r.clicks,
        costMicros: BigInt(r.costMicros),
        conversions: r.conversions,
        conversionsValue: r.conversionsValue,
      }));

      await db
        .insert(schema.rsaDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: [schema.rsaDaily.accountId, schema.rsaDaily.date, schema.rsaDaily.adId],
          set: {
            campaignName: sql`excluded.campaign_name`,
            adGroupName: sql`excluded.ad_group_name`,
            headlines: sql`excluded.headlines`,
            descriptions: sql`excluded.descriptions`,
            adStrength: sql`excluded.ad_strength`,
            impressions: sql`excluded.impressions`,
            clicks: sql`excluded.clicks`,
            costMicros: sql`excluded.cost_micros`,
            conversions: sql`excluded.conversions`,
            conversionsValue: sql`excluded.conversions_value`,
          },
        });

      totalRecords += data.rsa.length;
    }

    // --- RSA asset daily ---
    if (data.rsaAssets && data.rsaAssets.length > 0) {
      const rows = data.rsaAssets.map((r) => ({
        accountId: data.accountId,
        date: data.date,
        adId: r.adId,
        assetResource: r.assetResource,
        fieldType: r.fieldType,
        performanceLabel: r.performanceLabel ?? null,
        impressions: r.impressions,
        clicks: r.clicks,
        costMicros: BigInt(r.costMicros),
        conversions: r.conversions,
      }));

      await db
        .insert(schema.rsaAssetDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: [
            schema.rsaAssetDaily.accountId,
            schema.rsaAssetDaily.date,
            schema.rsaAssetDaily.adId,
            schema.rsaAssetDaily.assetResource,
          ],
          set: {
            fieldType: sql`excluded.field_type`,
            performanceLabel: sql`excluded.performance_label`,
            impressions: sql`excluded.impressions`,
            clicks: sql`excluded.clicks`,
            costMicros: sql`excluded.cost_micros`,
            conversions: sql`excluded.conversions`,
          },
        });

      totalRecords += data.rsaAssets.length;
    }

    // --- PMax asset group daily ---
    if (data.pmax && data.pmax.length > 0) {
      const rows = data.pmax.map((r) => ({
        accountId: data.accountId,
        date: data.date,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        assetGroupId: r.assetGroupId,
        assetGroupName: r.assetGroupName,
        impressions: r.impressions,
        clicks: r.clicks,
        costMicros: BigInt(r.costMicros),
        conversions: r.conversions,
        conversionsValue: r.conversionsValue,
      }));

      await db
        .insert(schema.pmaxAssetGroupDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: [
            schema.pmaxAssetGroupDaily.accountId,
            schema.pmaxAssetGroupDaily.date,
            schema.pmaxAssetGroupDaily.assetGroupId,
          ],
          set: {
            campaignName: sql`excluded.campaign_name`,
            assetGroupName: sql`excluded.asset_group_name`,
            impressions: sql`excluded.impressions`,
            clicks: sql`excluded.clicks`,
            costMicros: sql`excluded.cost_micros`,
            conversions: sql`excluded.conversions`,
            conversionsValue: sql`excluded.conversions_value`,
          },
        });

      totalRecords += data.pmax.length;
    }

    // --- PMax asset daily ---
    if (data.pmaxAssets && data.pmaxAssets.length > 0) {
      const rows = data.pmaxAssets.map((r) => {
        // Compute content_hash server-side: MD5 of coalesce(textContent, imageUrl, youtubeVideoId, '')
        const content = r.textContent || r.imageUrl || r.youtubeVideoId || '';
        const contentHash = createHash('md5').update(content).digest('hex');

        return {
          accountId: data.accountId,
          date: data.date,
          assetGroupId: r.assetGroupId,
          assetType: r.assetType,
          fieldType: r.fieldType,
          textContent: r.textContent ?? null,
          imageUrl: r.imageUrl ?? null,
          youtubeVideoId: r.youtubeVideoId ?? null,
          performanceLabel: r.performanceLabel ?? null,
          contentHash,
        };
      });

      await db
        .insert(schema.pmaxAssetDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: [
            schema.pmaxAssetDaily.accountId,
            schema.pmaxAssetDaily.date,
            schema.pmaxAssetDaily.assetGroupId,
            schema.pmaxAssetDaily.fieldType,
            schema.pmaxAssetDaily.assetType,
            schema.pmaxAssetDaily.contentHash,
          ],
          set: {
            textContent: sql`excluded.text_content`,
            imageUrl: sql`excluded.image_url`,
            youtubeVideoId: sql`excluded.youtube_video_id`,
            performanceLabel: sql`excluded.performance_label`,
          },
        });

      totalRecords += data.pmaxAssets.length;
    }

    // --- Display daily ---
    if (data.display && data.display.length > 0) {
      const rows = data.display.map((r) => ({
        accountId: data.accountId,
        date: data.date,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        adGroupId: r.adGroupId,
        adGroupName: r.adGroupName,
        adId: r.adId,
        adName: r.adName ?? null,
        adType: r.adType,
        impressions: r.impressions,
        clicks: r.clicks,
        costMicros: BigInt(r.costMicros),
        conversions: r.conversions,
        conversionsValue: r.conversionsValue,
      }));

      await db
        .insert(schema.displayDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: [schema.displayDaily.accountId, schema.displayDaily.date, schema.displayDaily.adId],
          set: {
            campaignName: sql`excluded.campaign_name`,
            adGroupName: sql`excluded.ad_group_name`,
            adName: sql`excluded.ad_name`,
            adType: sql`excluded.ad_type`,
            impressions: sql`excluded.impressions`,
            clicks: sql`excluded.clicks`,
            costMicros: sql`excluded.cost_micros`,
            conversions: sql`excluded.conversions`,
            conversionsValue: sql`excluded.conversions_value`,
          },
        });

      totalRecords += data.display.length;
    }

    // --- Video daily ---
    if (data.video && data.video.length > 0) {
      const rows = data.video.map((r) => ({
        accountId: data.accountId,
        date: data.date,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        adGroupId: r.adGroupId,
        adGroupName: r.adGroupName,
        adId: r.adId,
        adName: r.adName ?? null,
        impressions: r.impressions,
        clicks: r.clicks,
        costMicros: BigInt(r.costMicros),
        conversions: r.conversions,
        conversionsValue: r.conversionsValue,
        videoViews: r.videoViews,
        videoViewRate: r.videoViewRate,
        averageCpvMicros: BigInt(r.averageCpvMicros),
        videoQuartileP25Rate: r.videoQuartileP25Rate,
        videoQuartileP50Rate: r.videoQuartileP50Rate,
        videoQuartileP75Rate: r.videoQuartileP75Rate,
        videoQuartileP100Rate: r.videoQuartileP100Rate,
      }));

      await db
        .insert(schema.videoDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: [schema.videoDaily.accountId, schema.videoDaily.date, schema.videoDaily.adId],
          set: {
            campaignName: sql`excluded.campaign_name`,
            adGroupName: sql`excluded.ad_group_name`,
            adName: sql`excluded.ad_name`,
            impressions: sql`excluded.impressions`,
            clicks: sql`excluded.clicks`,
            costMicros: sql`excluded.cost_micros`,
            conversions: sql`excluded.conversions`,
            conversionsValue: sql`excluded.conversions_value`,
            videoViews: sql`excluded.video_views`,
            videoViewRate: sql`excluded.video_view_rate`,
            averageCpvMicros: sql`excluded.average_cpv_micros`,
            videoQuartileP25Rate: sql`excluded.video_quartile_p25_rate`,
            videoQuartileP50Rate: sql`excluded.video_quartile_p50_rate`,
            videoQuartileP75Rate: sql`excluded.video_quartile_p75_rate`,
            videoQuartileP100Rate: sql`excluded.video_quartile_p100_rate`,
          },
        });

      totalRecords += data.video.length;
    }

    /* -------------------------------------------------------------- */
    /*  5. Update account last_synced_at                              */
    /* -------------------------------------------------------------- */
    await db
      .update(schema.accounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(schema.accounts.id, data.accountId));

    /* -------------------------------------------------------------- */
    /*  6. Create sync_log entry (success)                            */
    /* -------------------------------------------------------------- */
    await db.insert(schema.syncLog).values({
      accountId: data.accountId,
      recordCount: totalRecords,
      status: 'success',
    });

    /* -------------------------------------------------------------- */
    /*  7. Return success response                                    */
    /* -------------------------------------------------------------- */
    const response: Record<string, unknown> = {
      status: 'ok',
      recordCount: totalRecords,
      accountId: data.accountId,
    };

    if (isNewAccount && generatedApiKey) {
      response.apiKey = generatedApiKey;
      response.message = 'Account registered. Update your script with this API key.';
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    /* -------------------------------------------------------------- */
    /*  Error handling: log sync failure                               */
    /* -------------------------------------------------------------- */
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Only attempt sync_log if the account exists (it was created or already existed)
    try {
      await db.insert(schema.syncLog).values({
        accountId: data.accountId,
        recordCount: 0,
        status: 'error',
        errorMessage,
      });
    } catch {
      // If even sync_log fails, we still return the error to the client
      console.error('Failed to write sync_log error entry:', errorMessage);
    }

    return NextResponse.json(
      { error: 'Ingestion failed', details: [{ field: '', message: errorMessage }] },
      { status: 500 },
    );
  }
}
