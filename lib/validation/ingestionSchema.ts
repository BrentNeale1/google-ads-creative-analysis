import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Shared validators                                                 */
/* ------------------------------------------------------------------ */

/** Google Ads Customer ID format: xxx-xxx-xxxx */
const accountIdSchema = z.string().regex(
  /^\d{3}-\d{3}-\d{4}$/,
  'Account ID must be in xxx-xxx-xxxx format',
);

/** Date in YYYY-MM-DD format */
const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format',
);

/* ------------------------------------------------------------------ */
/*  RSA headline/description asset schema                             */
/* ------------------------------------------------------------------ */

const rsaTextAssetSchema = z.object({
  text: z.string(),
  pinnedField: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  RSA daily row                                                     */
/* ------------------------------------------------------------------ */

export const rsaRowSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  adGroupId: z.string(),
  adGroupName: z.string(),
  adId: z.string(),
  headlines: z.array(rsaTextAssetSchema),
  descriptions: z.array(rsaTextAssetSchema),
  adStrength: z.string().optional(),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  costMicros: z.number().default(0),
  conversions: z.number().default(0),
  conversionsValue: z.number().default(0),
});

/* ------------------------------------------------------------------ */
/*  RSA asset daily row                                               */
/* ------------------------------------------------------------------ */

export const rsaAssetRowSchema = z.object({
  adId: z.string(),
  assetResource: z.string(),
  fieldType: z.string(),
  performanceLabel: z.string().optional(),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  costMicros: z.number().default(0),
  conversions: z.number().default(0),
});

/* ------------------------------------------------------------------ */
/*  PMax asset group daily row                                        */
/* ------------------------------------------------------------------ */

export const pmaxAssetGroupRowSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  assetGroupId: z.string(),
  assetGroupName: z.string(),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  costMicros: z.number().default(0),
  conversions: z.number().default(0),
  conversionsValue: z.number().default(0),
});

/* ------------------------------------------------------------------ */
/*  PMax asset daily row                                              */
/* ------------------------------------------------------------------ */

export const pmaxAssetRowSchema = z.object({
  assetGroupId: z.string(),
  assetType: z.string(),
  fieldType: z.string(),
  textContent: z.string().optional(),
  imageUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  performanceLabel: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  Display daily row                                                 */
/* ------------------------------------------------------------------ */

export const displayRowSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  adGroupId: z.string(),
  adGroupName: z.string(),
  adId: z.string(),
  adName: z.string().optional(),
  adType: z.string(),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  costMicros: z.number().default(0),
  conversions: z.number().default(0),
  conversionsValue: z.number().default(0),
});

/* ------------------------------------------------------------------ */
/*  Video daily row                                                   */
/* ------------------------------------------------------------------ */

export const videoRowSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  adGroupId: z.string(),
  adGroupName: z.string(),
  adId: z.string(),
  adName: z.string().optional(),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  costMicros: z.number().default(0),
  conversions: z.number().default(0),
  conversionsValue: z.number().default(0),
  videoViews: z.number().default(0),
  videoViewRate: z.number().default(0),
  averageCpvMicros: z.number().default(0),
  videoQuartileP25Rate: z.number().default(0),
  videoQuartileP50Rate: z.number().default(0),
  videoQuartileP75Rate: z.number().default(0),
  videoQuartileP100Rate: z.number().default(0),
});

/* ------------------------------------------------------------------ */
/*  Top-level ingestion payload                                       */
/* ------------------------------------------------------------------ */

export const ingestionSchema = z.object({
  accountId: accountIdSchema,
  accountName: z.string(),
  date: dateSchema,
  rsa: z.array(rsaRowSchema).optional(),
  rsaAssets: z.array(rsaAssetRowSchema).optional(),
  pmax: z.array(pmaxAssetGroupRowSchema).optional(),
  pmaxAssets: z.array(pmaxAssetRowSchema).optional(),
  display: z.array(displayRowSchema).optional(),
  video: z.array(videoRowSchema).optional(),
});

export type IngestionPayload = z.infer<typeof ingestionSchema>;
export type RsaRow = z.infer<typeof rsaRowSchema>;
export type RsaAssetRow = z.infer<typeof rsaAssetRowSchema>;
export type PmaxAssetGroupRow = z.infer<typeof pmaxAssetGroupRowSchema>;
export type PmaxAssetRow = z.infer<typeof pmaxAssetRowSchema>;
export type DisplayRow = z.infer<typeof displayRowSchema>;
export type VideoRow = z.infer<typeof videoRowSchema>;
