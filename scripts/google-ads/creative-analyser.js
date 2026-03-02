/**
 * Google Ads Script: Creative Performance Analyser
 *
 * Pushes RSA, PMax, Display, and Video creative data to your
 * Creative Analyser web app via its /api/ingest endpoint.
 *
 * Schedule this script to run daily at 3am+ in your account timezone
 * (allows Google Ads stats to finalise).
 *
 * First run auto-registers the account and returns an API key --
 * update CONFIG.API_KEY with the key from the script logs.
 *
 * Syntax: ES5 (var, function declarations, string concatenation)
 * compatible with Google Ads Scripts Rhino engine.
 */

var CONFIG = {
  API_ENDPOINT: 'https://YOUR-APP.vercel.app/api/ingest',
  API_KEY: 'YOUR_API_KEY_HERE',
  DATE_RANGE: 'YESTERDAY',
};

// ---------------------------------------------------------------
//  Main entry point
// ---------------------------------------------------------------

function main() {
  var account = AdsApp.currentAccount();
  var customerId = account.getCustomerId();
  var accountName = account.getName();

  // Format today's date as YYYY-MM-DD for the data being pushed
  var now = new Date();
  var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  var date = formatDate(yesterday);

  Logger.log('Creative Analyser: Starting data push for ' + accountName + ' (' + customerId + ')');
  Logger.log('Date range: ' + CONFIG.DATE_RANGE + ' (' + date + ')');

  var payload = {
    accountId: customerId,
    accountName: accountName,
    date: date,
    rsa: [],
    rsaAssets: [],
    pmax: [],
    pmaxAssets: [],
    display: [],
    video: [],
  };

  // Query each campaign type
  payload.rsa = queryRsaPerformance(date);
  Logger.log('RSA ads found: ' + payload.rsa.length);

  payload.rsaAssets = queryRsaAssetPerformance(date);
  Logger.log('RSA assets found: ' + payload.rsaAssets.length);

  payload.pmax = queryPmaxPerformance(date);
  Logger.log('PMax asset groups found: ' + payload.pmax.length);

  payload.pmaxAssets = queryPmaxAssetData(date);
  Logger.log('PMax assets found: ' + payload.pmaxAssets.length);

  payload.display = queryDisplayPerformance(date);
  Logger.log('Display ads found: ' + payload.display.length);

  payload.video = queryVideoPerformance(date);
  Logger.log('Video ads found: ' + payload.video.length);

  var totalRecords = payload.rsa.length + payload.rsaAssets.length +
    payload.pmax.length + payload.pmaxAssets.length +
    payload.display.length + payload.video.length;

  if (totalRecords === 0) {
    Logger.log('No data found for ' + date + '. Skipping push.');
    return;
  }

  // POST to the app API
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {},
    muteHttpExceptions: true,
  };

  if (CONFIG.API_KEY !== 'YOUR_API_KEY_HERE') {
    options.headers['x-api-key'] = CONFIG.API_KEY;
  }

  var response = UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);
  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();

  Logger.log('Response code: ' + responseCode);
  Logger.log('Response body: ' + responseBody);

  if (responseCode === 200) {
    var result = JSON.parse(responseBody);
    if (result.apiKey) {
      Logger.log('');
      Logger.log('============================================================');
      Logger.log('IMPORTANT: Update CONFIG.API_KEY with: ' + result.apiKey);
      Logger.log('============================================================');
      Logger.log('');
    }
    Logger.log('Successfully pushed ' + totalRecords + ' records.');
  } else {
    Logger.log('ERROR: Push failed with status ' + responseCode);
  }
}

// ---------------------------------------------------------------
//  Query helpers
// ---------------------------------------------------------------

/**
 * Iterate AdsApp.search() results and collect into an array.
 * @param {string} query - GAQL query string
 * @return {Array<Object>} Array of result row objects
 */
function collectSearchResults(query) {
  var results = [];
  var iterator = AdsApp.search(query);
  while (iterator.hasNext()) {
    results.push(iterator.next());
  }
  return results;
}

/**
 * Safely extract RSA headlines or descriptions from the search result.
 * These come as repeated fields and need careful handling.
 * @param {Object} repeatedField - The repeated text asset field from the API
 * @return {Array<Object>} Array of { text, pinnedField } objects
 */
function extractRsaTextAssets(repeatedField) {
  var assets = [];
  if (!repeatedField) {
    return assets;
  }
  // The repeated field may be an array-like object
  var length = repeatedField.length || 0;
  for (var i = 0; i < length; i++) {
    var item = repeatedField[i];
    var asset = { text: '' };
    if (typeof item === 'string') {
      asset.text = item;
    } else if (item && item.text) {
      asset.text = item.text;
      if (item.pinnedField) {
        asset.pinnedField = item.pinnedField;
      }
    }
    assets.push(asset);
  }
  return assets;
}

/**
 * Format a Date object as YYYY-MM-DD.
 * @param {Date} d
 * @return {string}
 */
function formatDate(d) {
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return year + '-' +
    (month < 10 ? '0' : '') + month + '-' +
    (day < 10 ? '0' : '') + day;
}

// ---------------------------------------------------------------
//  RSA Performance (Responsive Search Ads)
// ---------------------------------------------------------------

function queryRsaPerformance(date) {
  var query =
    'SELECT ' +
      'campaign.id, ' +
      'campaign.name, ' +
      'ad_group.id, ' +
      'ad_group.name, ' +
      'ad_group_ad.ad.id, ' +
      'ad_group_ad.ad.responsive_search_ad.headlines, ' +
      'ad_group_ad.ad.responsive_search_ad.descriptions, ' +
      'ad_group_ad.ad_strength, ' +
      'metrics.impressions, ' +
      'metrics.clicks, ' +
      'metrics.cost_micros, ' +
      'metrics.conversions, ' +
      'metrics.conversions_value ' +
    'FROM ad_group_ad ' +
    'WHERE campaign.advertising_channel_type = "SEARCH" ' +
      'AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD" ' +
      'AND segments.date = "' + date + '" ' +
      'AND metrics.impressions > 0';

  var rows = collectSearchResults(query);
  var results = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    results.push({
      campaignId: String(row.campaign.id),
      campaignName: row.campaign.name,
      adGroupId: String(row.adGroup.id),
      adGroupName: row.adGroup.name,
      adId: String(row.adGroupAd.ad.id),
      headlines: extractRsaTextAssets(row.adGroupAd.ad.responsiveSearchAd.headlines),
      descriptions: extractRsaTextAssets(row.adGroupAd.ad.responsiveSearchAd.descriptions),
      adStrength: row.adGroupAd.adStrength || null,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      costMicros: row.metrics.costMicros || 0,
      conversions: row.metrics.conversions || 0,
      conversionsValue: row.metrics.conversionsValue || 0,
    });
  }

  return results;
}

// ---------------------------------------------------------------
//  RSA Asset Performance
// ---------------------------------------------------------------

function queryRsaAssetPerformance(date) {
  var query =
    'SELECT ' +
      'ad_group_ad_asset_view.ad_group_ad, ' +
      'ad_group_ad_asset_view.asset, ' +
      'ad_group_ad_asset_view.field_type, ' +
      'ad_group_ad_asset_view.performance_label, ' +
      'metrics.impressions, ' +
      'metrics.clicks, ' +
      'metrics.cost_micros, ' +
      'metrics.conversions ' +
    'FROM ad_group_ad_asset_view ' +
    'WHERE segments.date = "' + date + '" ' +
      'AND ad_group_ad_asset_view.enabled = TRUE ' +
      'AND metrics.impressions > 0';

  var rows = collectSearchResults(query);
  var results = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    // Extract ad ID from the ad_group_ad resource name
    // Format: customers/{cid}/adGroupAds/{ag_id}~{ad_id}
    var adGroupAdResource = row.adGroupAdAssetView.adGroupAd || '';
    var adId = '';
    var tildeParts = adGroupAdResource.split('~');
    if (tildeParts.length > 1) {
      adId = tildeParts[tildeParts.length - 1];
    }

    results.push({
      adId: adId,
      assetResource: row.adGroupAdAssetView.asset || '',
      fieldType: row.adGroupAdAssetView.fieldType || '',
      performanceLabel: row.adGroupAdAssetView.performanceLabel || null,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      costMicros: row.metrics.costMicros || 0,
      conversions: row.metrics.conversions || 0,
    });
  }

  return results;
}

// ---------------------------------------------------------------
//  PMax Campaign Performance (campaign-level metrics)
// ---------------------------------------------------------------

function queryPmaxPerformance(date) {
  // PMax aggregate metrics are at campaign level.
  // We query campaign-level data and link to asset groups separately.
  var campaignQuery =
    'SELECT ' +
      'campaign.id, ' +
      'campaign.name, ' +
      'metrics.impressions, ' +
      'metrics.clicks, ' +
      'metrics.cost_micros, ' +
      'metrics.conversions, ' +
      'metrics.conversions_value ' +
    'FROM campaign ' +
    'WHERE campaign.advertising_channel_type = "PERFORMANCE_MAX" ' +
      'AND segments.date = "' + date + '" ' +
      'AND metrics.impressions > 0';

  var campaignRows = collectSearchResults(campaignQuery);

  // Also query asset groups to get their names and IDs
  var agQuery =
    'SELECT ' +
      'asset_group.id, ' +
      'asset_group.name, ' +
      'asset_group.campaign, ' +
      'campaign.id, ' +
      'campaign.name ' +
    'FROM asset_group ' +
    'WHERE campaign.advertising_channel_type = "PERFORMANCE_MAX"';

  var agRows = collectSearchResults(agQuery);

  // Build a map of campaign ID -> campaign metrics
  var campaignMap = {};
  for (var i = 0; i < campaignRows.length; i++) {
    var cr = campaignRows[i];
    campaignMap[String(cr.campaign.id)] = {
      campaignName: cr.campaign.name,
      impressions: cr.metrics.impressions || 0,
      clicks: cr.metrics.clicks || 0,
      costMicros: cr.metrics.costMicros || 0,
      conversions: cr.metrics.conversions || 0,
      conversionsValue: cr.metrics.conversionsValue || 0,
    };
  }

  // Create asset group rows with campaign-level metrics distributed
  var results = [];
  for (var j = 0; j < agRows.length; j++) {
    var ag = agRows[j];
    var campId = String(ag.campaign.id);
    var campData = campaignMap[campId];
    if (!campData) {
      continue; // Campaign had no impressions
    }

    results.push({
      campaignId: campId,
      campaignName: campData.campaignName,
      assetGroupId: String(ag.assetGroup.id),
      assetGroupName: ag.assetGroup.name,
      impressions: campData.impressions,
      clicks: campData.clicks,
      costMicros: campData.costMicros,
      conversions: campData.conversions,
      conversionsValue: campData.conversionsValue,
    });
  }

  return results;
}

// ---------------------------------------------------------------
//  PMax Asset Data
// ---------------------------------------------------------------

function queryPmaxAssetData(date) {
  var query =
    'SELECT ' +
      'asset_group_asset.asset_group, ' +
      'asset_group_asset.asset, ' +
      'asset_group_asset.field_type, ' +
      'asset_group_asset.performance_label, ' +
      'asset.id, ' +
      'asset.type, ' +
      'asset.text_asset.text, ' +
      'asset.image_asset.full_size.url, ' +
      'asset.youtube_video_asset.youtube_video_id ' +
    'FROM asset_group_asset ' +
    'WHERE campaign.advertising_channel_type = "PERFORMANCE_MAX"';

  var rows = collectSearchResults(query);
  var results = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    // Extract asset group ID from the resource name
    // Format: customers/{cid}/assetGroups/{ag_id}
    var agResource = row.assetGroupAsset.assetGroup || '';
    var agParts = agResource.split('/');
    var assetGroupId = agParts.length > 0 ? agParts[agParts.length - 1] : '';

    // Determine asset type
    var assetType = row.asset.type || 'TEXT';

    results.push({
      assetGroupId: assetGroupId,
      assetType: assetType,
      fieldType: row.assetGroupAsset.fieldType || '',
      textContent: (row.asset.textAsset && row.asset.textAsset.text) || null,
      imageUrl: (row.asset.imageAsset && row.asset.imageAsset.fullSize && row.asset.imageAsset.fullSize.url) || null,
      youtubeVideoId: (row.asset.youtubeVideoAsset && row.asset.youtubeVideoAsset.youtubeVideoId) || null,
      performanceLabel: row.assetGroupAsset.performanceLabel || null,
    });
  }

  return results;
}

// ---------------------------------------------------------------
//  Video Performance
// ---------------------------------------------------------------

function queryVideoPerformance(date) {
  var query =
    'SELECT ' +
      'campaign.id, ' +
      'campaign.name, ' +
      'ad_group.id, ' +
      'ad_group.name, ' +
      'ad_group_ad.ad.id, ' +
      'ad_group_ad.ad.name, ' +
      'metrics.impressions, ' +
      'metrics.clicks, ' +
      'metrics.cost_micros, ' +
      'metrics.conversions, ' +
      'metrics.conversions_value, ' +
      'metrics.video_views, ' +
      'metrics.video_view_rate, ' +
      'metrics.average_cpv, ' +
      'metrics.video_quartile_p25_rate, ' +
      'metrics.video_quartile_p50_rate, ' +
      'metrics.video_quartile_p75_rate, ' +
      'metrics.video_quartile_p100_rate ' +
    'FROM ad_group_ad ' +
    'WHERE campaign.advertising_channel_type = "VIDEO" ' +
      'AND segments.date = "' + date + '" ' +
      'AND metrics.impressions > 0';

  var rows = collectSearchResults(query);
  var results = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    results.push({
      campaignId: String(row.campaign.id),
      campaignName: row.campaign.name,
      adGroupId: String(row.adGroup.id),
      adGroupName: row.adGroup.name,
      adId: String(row.adGroupAd.ad.id),
      adName: row.adGroupAd.ad.name || null,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      costMicros: row.metrics.costMicros || 0,
      conversions: row.metrics.conversions || 0,
      conversionsValue: row.metrics.conversionsValue || 0,
      videoViews: row.metrics.videoViews || 0,
      videoViewRate: row.metrics.videoViewRate || 0,
      averageCpvMicros: row.metrics.averageCpv || 0,
      videoQuartileP25Rate: row.metrics.videoQuartileP25Rate || 0,
      videoQuartileP50Rate: row.metrics.videoQuartileP50Rate || 0,
      videoQuartileP75Rate: row.metrics.videoQuartileP75Rate || 0,
      videoQuartileP100Rate: row.metrics.videoQuartileP100Rate || 0,
    });
  }

  return results;
}

// ---------------------------------------------------------------
//  Display / Demand Gen Performance
// ---------------------------------------------------------------

function queryDisplayPerformance(date) {
  var query =
    'SELECT ' +
      'campaign.id, ' +
      'campaign.name, ' +
      'ad_group.id, ' +
      'ad_group.name, ' +
      'ad_group_ad.ad.id, ' +
      'ad_group_ad.ad.name, ' +
      'ad_group_ad.ad.type, ' +
      'metrics.impressions, ' +
      'metrics.clicks, ' +
      'metrics.cost_micros, ' +
      'metrics.conversions, ' +
      'metrics.conversions_value ' +
    'FROM ad_group_ad ' +
    'WHERE campaign.advertising_channel_type IN ("DISPLAY", "DEMAND_GEN") ' +
      'AND segments.date = "' + date + '" ' +
      'AND metrics.impressions > 0';

  var rows = collectSearchResults(query);
  var results = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    results.push({
      campaignId: String(row.campaign.id),
      campaignName: row.campaign.name,
      adGroupId: String(row.adGroup.id),
      adGroupName: row.adGroup.name,
      adId: String(row.adGroupAd.ad.id),
      adName: row.adGroupAd.ad.name || null,
      adType: row.adGroupAd.ad.type || 'RESPONSIVE_DISPLAY_AD',
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      costMicros: row.metrics.costMicros || 0,
      conversions: row.metrics.conversions || 0,
      conversionsValue: row.metrics.conversionsValue || 0,
    });
  }

  return results;
}
