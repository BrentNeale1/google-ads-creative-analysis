import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  date,
  jsonb,
  real,
  bigint,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/*  accounts                                                          */
/* ------------------------------------------------------------------ */

export const accounts = pgTable('accounts', {
  /** Google Ads Customer ID in xxx-xxx-xxxx format */
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  apiKey: text('api_key').unique().notNull(),
  /** Primary KPI for performance tier classification: 'cpa' or 'roas' */
  primaryKpi: text('primary_kpi').default('cpa').notNull(),
  lastSyncedAt: timestamp('last_synced_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  sync_log                                                          */
/* ------------------------------------------------------------------ */

export const syncLog = pgTable('sync_log', {
  id: serial('id').primaryKey(),
  accountId: text('account_id')
    .references(() => accounts.id)
    .notNull(),
  pushedAt: timestamp('pushed_at', { mode: 'date' }).defaultNow().notNull(),
  recordCount: integer('record_count').notNull(),
  /** 'success' or 'error' */
  status: text('status').notNull(),
  errorMessage: text('error_message'),
});

/* ------------------------------------------------------------------ */
/*  rsa_daily  --  Responsive Search Ad daily metrics                 */
/* ------------------------------------------------------------------ */

export const rsaDaily = pgTable(
  'rsa_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    campaignId: text('campaign_id').notNull(),
    campaignName: text('campaign_name').notNull(),
    adGroupId: text('ad_group_id').notNull(),
    adGroupName: text('ad_group_name').notNull(),
    adId: text('ad_id').notNull(),
    /** Array of { text, pinnedField? } */
    headlines: jsonb('headlines').notNull(),
    /** Array of { text, pinnedField? } */
    descriptions: jsonb('descriptions').notNull(),
    adStrength: text('ad_strength'),
    impressions: integer('impressions').default(0).notNull(),
    clicks: integer('clicks').default(0).notNull(),
    costMicros: bigint('cost_micros', { mode: 'number' }).default(0).notNull(),
    conversions: real('conversions').default(0).notNull(),
    conversionsValue: real('conversions_value').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('rsa_daily_account_date_ad_idx').on(
      table.accountId,
      table.date,
      table.adId,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  rsa_asset_daily  --  RSA asset-level daily metrics                */
/* ------------------------------------------------------------------ */

export const rsaAssetDaily = pgTable(
  'rsa_asset_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    adId: text('ad_id').notNull(),
    assetResource: text('asset_resource').notNull(),
    /** HEADLINE or DESCRIPTION */
    fieldType: text('field_type').notNull(),
    /** Actual headline or description text from asset.text_asset.text */
    textContent: text('text_content'),
    /** BEST, GOOD, LOW, LEARNING */
    performanceLabel: text('performance_label'),
    impressions: integer('impressions').default(0).notNull(),
    clicks: integer('clicks').default(0).notNull(),
    costMicros: bigint('cost_micros', { mode: 'number' }).default(0).notNull(),
    conversions: real('conversions').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('rsa_asset_daily_account_date_ad_asset_idx').on(
      table.accountId,
      table.date,
      table.adId,
      table.assetResource,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  rsa_combination_daily  --  RSA headline+description combinations  */
/* ------------------------------------------------------------------ */

export const rsaCombinationDaily = pgTable(
  'rsa_combination_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    adId: text('ad_id').notNull(),
    /** Headline texts in this combination, JSON array of strings */
    headlines: jsonb('headlines').notNull(),
    /** Description texts in this combination, JSON array of strings */
    descriptions: jsonb('descriptions').notNull(),
    /** Impressions only -- Google does not provide clicks/conversions for combinations */
    impressions: integer('impressions').default(0).notNull(),
  },
  // No unique index: multiple combinations per ad per day are possible.
  // Ingestion uses delete-before-insert for each account+date sync.
);

/* ------------------------------------------------------------------ */
/*  pmax_asset_group_daily  --  PMax asset group daily metrics        */
/* ------------------------------------------------------------------ */

export const pmaxAssetGroupDaily = pgTable(
  'pmax_asset_group_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    campaignId: text('campaign_id').notNull(),
    campaignName: text('campaign_name').notNull(),
    assetGroupId: text('asset_group_id').notNull(),
    assetGroupName: text('asset_group_name').notNull(),
    impressions: integer('impressions').default(0).notNull(),
    clicks: integer('clicks').default(0).notNull(),
    costMicros: bigint('cost_micros', { mode: 'number' }).default(0).notNull(),
    conversions: real('conversions').default(0).notNull(),
    conversionsValue: real('conversions_value').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('pmax_ag_daily_account_date_ag_idx').on(
      table.accountId,
      table.date,
      table.assetGroupId,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  pmax_asset_daily  --  PMax asset-level daily metrics              */
/* ------------------------------------------------------------------ */

export const pmaxAssetDaily = pgTable(
  'pmax_asset_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    assetGroupId: text('asset_group_id').notNull(),
    /** TEXT, IMAGE, or VIDEO */
    assetType: text('asset_type').notNull(),
    fieldType: text('field_type').notNull(),
    textContent: text('text_content'),
    imageUrl: text('image_url'),
    youtubeVideoId: text('youtube_video_id'),
    /** BEST, GOOD, LOW, LEARNING */
    performanceLabel: text('performance_label'),
    /** MD5 hex digest of coalesce(textContent, imageUrl, youtubeVideoId, '') -- computed server-side */
    contentHash: text('content_hash').notNull(),
  },
  (table) => [
    uniqueIndex('pmax_asset_daily_composite_idx').on(
      table.accountId,
      table.date,
      table.assetGroupId,
      table.fieldType,
      table.assetType,
      table.contentHash,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  display_daily  --  Display campaign daily metrics                 */
/* ------------------------------------------------------------------ */

export const displayDaily = pgTable(
  'display_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    campaignId: text('campaign_id').notNull(),
    campaignName: text('campaign_name').notNull(),
    adGroupId: text('ad_group_id').notNull(),
    adGroupName: text('ad_group_name').notNull(),
    adId: text('ad_id').notNull(),
    adName: text('ad_name'),
    adType: text('ad_type').notNull(),
    impressions: integer('impressions').default(0).notNull(),
    clicks: integer('clicks').default(0).notNull(),
    costMicros: bigint('cost_micros', { mode: 'number' }).default(0).notNull(),
    conversions: real('conversions').default(0).notNull(),
    conversionsValue: real('conversions_value').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('display_daily_account_date_ad_idx').on(
      table.accountId,
      table.date,
      table.adId,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  video_daily  --  Video campaign daily metrics                     */
/* ------------------------------------------------------------------ */

export const videoDaily = pgTable(
  'video_daily',
  {
    id: serial('id').primaryKey(),
    accountId: text('account_id')
      .references(() => accounts.id)
      .notNull(),
    date: date('date').notNull(),
    campaignId: text('campaign_id').notNull(),
    campaignName: text('campaign_name').notNull(),
    adGroupId: text('ad_group_id').notNull(),
    adGroupName: text('ad_group_name').notNull(),
    adId: text('ad_id').notNull(),
    adName: text('ad_name'),
    impressions: integer('impressions').default(0).notNull(),
    clicks: integer('clicks').default(0).notNull(),
    costMicros: bigint('cost_micros', { mode: 'number' }).default(0).notNull(),
    conversions: real('conversions').default(0).notNull(),
    conversionsValue: real('conversions_value').default(0).notNull(),
    videoViews: integer('video_views').default(0).notNull(),
    videoViewRate: real('video_view_rate').default(0).notNull(),
    averageCpvMicros: bigint('average_cpv_micros', { mode: 'number' }).default(0).notNull(),
    videoQuartileP25Rate: real('video_quartile_p25_rate').default(0).notNull(),
    videoQuartileP50Rate: real('video_quartile_p50_rate').default(0).notNull(),
    videoQuartileP75Rate: real('video_quartile_p75_rate').default(0).notNull(),
    videoQuartileP100Rate: real('video_quartile_p100_rate').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('video_daily_account_date_ad_idx').on(
      table.accountId,
      table.date,
      table.adId,
    ),
  ],
);
