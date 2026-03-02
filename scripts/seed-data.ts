/**
 * Seed data script for local development and testing.
 *
 * Generates 30 days of realistic Google Ads creative performance data
 * for 2 sample accounts and pushes it to the local /api/ingest endpoint.
 *
 * Run with: npx tsx scripts/seed-data.ts
 * Or:       npm run seed
 *
 * Requires the dev server running at http://localhost:3000 (or set SEED_API_URL).
 */

const API_URL = process.env.SEED_API_URL || 'http://localhost:3000/api/ingest';

// ---------------------------------------------------------------
//  Sample accounts
// ---------------------------------------------------------------

const ACCOUNTS = [
  { id: '123-456-7890', name: 'Demo Client A' },
  { id: '098-765-4321', name: 'Demo Client B' },
];

// ---------------------------------------------------------------
//  Realistic data pools
// ---------------------------------------------------------------

const RSA_HEADLINES = [
  'Get 50% Off Today',
  'Free Shipping Australia-Wide',
  'Trusted by 10,000+ Customers',
  'Award-Winning Service',
  'Shop Our New Collection',
  'Limited Time Offer',
  'Expert Support 24/7',
  'Best Price Guarantee',
  'Join Thousands of Happy Clients',
  'Premium Quality Products',
  'Fast Delivery Nationwide',
  'Try Risk-Free for 30 Days',
];

const RSA_DESCRIPTIONS = [
  'Order now and save big on our top-rated products. Free returns on all orders.',
  'Discover why Australian businesses choose us. Read our 5-star reviews.',
  'Premium quality at affordable prices. Shop the collection today.',
  'Expert team ready to help. Contact us for a free consultation.',
  'Join our loyalty program and earn rewards on every purchase.',
  'Satisfaction guaranteed or your money back. No questions asked.',
];

const CAMPAIGN_NAMES_SEARCH = ['Brand - AU', 'Non-Brand - Generic', 'Non-Brand - Competitor', 'Remarketing - Search'];
const CAMPAIGN_NAMES_PMAX = ['PMax - All Products', 'PMax - Top Sellers'];
const CAMPAIGN_NAMES_DISPLAY = ['Display - Prospecting', 'Display - Remarketing', 'Demand Gen - Lookalike'];
const CAMPAIGN_NAMES_VIDEO = ['YouTube - Brand Awareness', 'YouTube - Product Demo'];
const AD_GROUP_NAMES = ['Core Keywords', 'Long Tail', 'Exact Match', 'Broad Match'];
const AD_STRENGTHS = ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'];
const PERFORMANCE_LABELS = ['BEST', 'GOOD', 'LOW', 'LEARNING'];
const PMAX_ASSET_GROUP_NAMES = ['All Products', 'Best Sellers', 'New Arrivals', 'Sale Items'];
const AD_TYPES = ['RESPONSIVE_DISPLAY_AD', 'IMAGE_AD', 'DISCOVERY_MULTI_ASSET_AD'];
const PMAX_FIELD_TYPES = ['HEADLINE', 'DESCRIPTION', 'LONG_HEADLINE', 'MARKETING_IMAGE', 'SQUARE_MARKETING_IMAGE', 'LOGO', 'YOUTUBE_VIDEO'];

// ---------------------------------------------------------------
//  Utility functions
// ---------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInt(min, Math.min(max, arr.length));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------
//  Data generators
// ---------------------------------------------------------------

function generateRsaAds(campaignSeed: number): Array<Record<string, unknown>> {
  const count = randomInt(3, 5);
  const ads = [];
  const campaignName = CAMPAIGN_NAMES_SEARCH[campaignSeed % CAMPAIGN_NAMES_SEARCH.length];

  for (let i = 0; i < count; i++) {
    const impressions = randomInt(200, 5000);
    const ctr = randomFloat(0.02, 0.08);
    const clicks = Math.round(impressions * ctr);
    const cpc = randomFloat(0.5, 4.0);
    const costMicros = Math.round(clicks * cpc * 1_000_000);
    const cvr = randomFloat(0.02, 0.12);
    const conversions = parseFloat((clicks * cvr).toFixed(1));
    const convValue = parseFloat((conversions * randomFloat(30, 150)).toFixed(2));

    ads.push({
      campaignId: String(1000 + campaignSeed),
      campaignName,
      adGroupId: String(2000 + campaignSeed * 10 + i),
      adGroupName: randomPick(AD_GROUP_NAMES),
      adId: String(3000 + campaignSeed * 100 + i),
      headlines: randomSubset(RSA_HEADLINES, 3, 6).map((text) => ({
        text,
        pinnedField: Math.random() > 0.7 ? 'HEADLINE_' + randomInt(1, 3) : undefined,
      })),
      descriptions: randomSubset(RSA_DESCRIPTIONS, 2, 4).map((text) => ({ text })),
      adStrength: randomPick(AD_STRENGTHS),
      impressions,
      clicks,
      costMicros,
      conversions,
      conversionsValue: convValue,
    });
  }

  return ads;
}

function generateRsaAssets(rsaAds: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const assets = [];

  for (const ad of rsaAds) {
    const adId = ad.adId as string;
    // Generate 2-4 asset entries per ad
    const assetCount = randomInt(2, 4);
    for (let i = 0; i < assetCount; i++) {
      const impressions = randomInt(50, 2000);
      const clicks = Math.round(impressions * randomFloat(0.02, 0.08));
      const costMicros = Math.round(clicks * randomFloat(0.5, 3.0) * 1_000_000);
      const conversions = parseFloat((clicks * randomFloat(0.02, 0.10)).toFixed(1));

      assets.push({
        adId,
        assetResource: 'customers/1234567890/assets/' + (5000 + parseInt(adId) * 10 + i),
        fieldType: i < assetCount / 2 ? 'HEADLINE' : 'DESCRIPTION',
        performanceLabel: randomPick(PERFORMANCE_LABELS),
        impressions,
        clicks,
        costMicros,
        conversions,
      });
    }
  }

  return assets;
}

function generatePmaxAssetGroups(): Array<Record<string, unknown>> {
  const count = randomInt(1, 2);
  const groups = [];

  for (let i = 0; i < count; i++) {
    const campaignName = CAMPAIGN_NAMES_PMAX[i % CAMPAIGN_NAMES_PMAX.length];
    const impressions = randomInt(500, 10000);
    const clicks = Math.round(impressions * randomFloat(0.01, 0.05));
    const costMicros = Math.round(clicks * randomFloat(0.3, 2.0) * 1_000_000);
    const conversions = parseFloat((clicks * randomFloat(0.03, 0.10)).toFixed(1));
    const convValue = parseFloat((conversions * randomFloat(40, 120)).toFixed(2));

    groups.push({
      campaignId: String(4000 + i),
      campaignName,
      assetGroupId: String(5000 + i),
      assetGroupName: randomPick(PMAX_ASSET_GROUP_NAMES),
      impressions,
      clicks,
      costMicros,
      conversions,
      conversionsValue: convValue,
    });
  }

  return groups;
}

function generatePmaxAssets(assetGroups: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const assets = [];

  for (const group of assetGroups) {
    const agId = group.assetGroupId as string;
    // Generate 3-5 assets per group
    const assetCount = randomInt(3, 5);
    for (let i = 0; i < assetCount; i++) {
      const fieldType = randomPick(PMAX_FIELD_TYPES);
      const isText = fieldType === 'HEADLINE' || fieldType === 'DESCRIPTION' || fieldType === 'LONG_HEADLINE';
      const isImage = fieldType.includes('IMAGE') || fieldType === 'LOGO';
      const isVideo = fieldType === 'YOUTUBE_VIDEO';

      assets.push({
        assetGroupId: agId,
        assetType: isImage ? 'IMAGE' : isVideo ? 'YOUTUBE_VIDEO' : 'TEXT',
        fieldType,
        textContent: isText ? randomPick(RSA_HEADLINES) : undefined,
        imageUrl: isImage ? 'https://example.com/images/asset-' + randomInt(1, 50) + '.jpg' : undefined,
        youtubeVideoId: isVideo ? 'dQw4w9WgXcQ' : undefined,
        performanceLabel: randomPick(PERFORMANCE_LABELS),
      });
    }
  }

  return assets;
}

function generateDisplayAds(): Array<Record<string, unknown>> {
  const count = randomInt(3, 4);
  const ads = [];

  for (let i = 0; i < count; i++) {
    const campaignName = CAMPAIGN_NAMES_DISPLAY[i % CAMPAIGN_NAMES_DISPLAY.length];
    const impressions = randomInt(1000, 20000);
    const ctr = randomFloat(0.002, 0.015);
    const clicks = Math.round(impressions * ctr);
    const costMicros = Math.round(clicks * randomFloat(0.2, 1.5) * 1_000_000);
    const conversions = parseFloat((clicks * randomFloat(0.01, 0.06)).toFixed(1));
    const convValue = parseFloat((conversions * randomFloat(25, 100)).toFixed(2));

    ads.push({
      campaignId: String(6000 + i),
      campaignName,
      adGroupId: String(7000 + i),
      adGroupName: 'Display Group ' + (i + 1),
      adId: String(8000 + i),
      adName: campaignName + ' - Ad ' + (i + 1),
      adType: randomPick(AD_TYPES),
      impressions,
      clicks,
      costMicros,
      conversions,
      conversionsValue: convValue,
    });
  }

  return ads;
}

function generateVideoAds(): Array<Record<string, unknown>> {
  const count = randomInt(1, 2);
  const ads = [];

  for (let i = 0; i < count; i++) {
    const campaignName = CAMPAIGN_NAMES_VIDEO[i % CAMPAIGN_NAMES_VIDEO.length];
    const impressions = randomInt(500, 8000);
    const viewRate = randomFloat(0.15, 0.45);
    const videoViews = Math.round(impressions * viewRate);
    const clicks = Math.round(videoViews * randomFloat(0.01, 0.08));
    const cpvMicros = randomInt(10000, 80000); // $0.01 - $0.08
    const costMicros = videoViews * cpvMicros;
    const conversions = parseFloat((clicks * randomFloat(0.02, 0.10)).toFixed(1));
    const convValue = parseFloat((conversions * randomFloat(30, 100)).toFixed(2));

    ads.push({
      campaignId: String(9000 + i),
      campaignName,
      adGroupId: String(9100 + i),
      adGroupName: 'Video Group ' + (i + 1),
      adId: String(9200 + i),
      adName: campaignName + ' - Creative ' + (i + 1),
      impressions,
      clicks,
      costMicros,
      conversions,
      conversionsValue: convValue,
      videoViews,
      videoViewRate: viewRate,
      averageCpvMicros: cpvMicros,
      videoQuartileP25Rate: randomFloat(0.60, 0.90),
      videoQuartileP50Rate: randomFloat(0.40, 0.70),
      videoQuartileP75Rate: randomFloat(0.25, 0.50),
      videoQuartileP100Rate: randomFloat(0.10, 0.35),
    });
  }

  return ads;
}

// ---------------------------------------------------------------
//  Main push logic
// ---------------------------------------------------------------

interface PushResponse {
  status?: string;
  apiKey?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

async function pushDay(
  account: { id: string; name: string },
  date: string,
  apiKey: string,
): Promise<string> {
  const rsaAds = generateRsaAds(ACCOUNTS.indexOf(account));
  const rsaAssets = generateRsaAssets(rsaAds);
  const pmaxGroups = generatePmaxAssetGroups();
  const pmaxAssetsRaw = generatePmaxAssets(pmaxGroups);
  // Deduplicate PMax assets by composite key to avoid INSERT batch conflicts
  const pmaxAssetsSeen = new Set<string>();
  const pmaxAssets = pmaxAssetsRaw.filter((a) => {
    const key = `${a.assetGroupId}|${a.fieldType}|${a.assetType}|${a.textContent || a.imageUrl || a.youtubeVideoId || ''}`;
    if (pmaxAssetsSeen.has(key)) return false;
    pmaxAssetsSeen.add(key);
    return true;
  });
  const displayAds = generateDisplayAds();
  const videoAds = generateVideoAds();

  const payload = {
    accountId: account.id,
    accountName: account.name,
    date,
    rsa: rsaAds,
    rsaAssets: rsaAssets,
    pmax: pmaxGroups,
    pmaxAssets: pmaxAssets,
    display: displayAds,
    video: videoAds,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const result: PushResponse = await response.json();

  if (!response.ok) {
    throw new Error(
      'Push failed (' + response.status + '): ' +
      (result.error || 'Unknown error') +
      (result.details ? ' - ' + JSON.stringify(result.details) : ''),
    );
  }

  // Return API key if this was auto-registration
  return result.apiKey || apiKey;
}

async function main(): Promise<void> {
  console.log('Seed data script starting...');
  console.log('Target API: ' + API_URL);
  console.log('');

  const now = new Date();
  const days = 30;

  for (const account of ACCOUNTS) {
    console.log('--- Account: ' + account.name + ' (' + account.id + ') ---');
    let apiKey = '';

    for (let d = days; d >= 1; d--) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const dateStr = formatDate(date);

      process.stdout.write(
        'Pushing day ' + (days - d + 1) + '/' + days + ' for ' + account.name + ' (' + dateStr + ')...',
      );

      try {
        apiKey = await pushDay(account, dateStr, apiKey);
        console.log(' OK');
      } catch (err) {
        console.log(' FAILED');
        console.error('  Error: ' + (err instanceof Error ? err.message : String(err)));
        // Continue with next day
      }
    }

    console.log('');
  }

  console.log('Seed data complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
