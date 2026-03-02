# Google Ads Script Setup

Push creative performance data from your Google Ads account to the Creative Analyser app automatically.

## Prerequisites

- A Google Ads account with manager-level access
- The Creative Analyser app deployed (e.g. on Vercel)

## Setup Steps

### Step 1: Open Scripts Editor

Go to **Google Ads** > **Tools & Settings** > **Bulk Actions** > **Scripts**.

### Step 2: Create a New Script

Click **+ New script** (or the blue "+" button).

Give it a name like "Creative Analyser Push".

### Step 3: Paste the Script

Delete any existing code in the editor and paste the entire contents of [`creative-analyser.js`](./creative-analyser.js).

### Step 4: Update the API Endpoint

In the `CONFIG` block at the top of the script, replace the placeholder URL with your actual app URL:

```javascript
var CONFIG = {
  API_ENDPOINT: 'https://your-app.vercel.app/api/ingest',  // <-- your URL here
  API_KEY: 'YOUR_API_KEY_HERE',
  DATE_RANGE: 'YESTERDAY',
};
```

### Step 5: Authorise and Run Once

Click **Authorise** when prompted, then click **Run** (or **Preview**).

The script will connect to Google Ads and push data to your app. Since this is the first run, the app will auto-register your account.

### Step 6: Copy Your API Key

After the script runs, check the **Logs** (at the bottom of the script editor). Look for a message like:

```
============================================================
IMPORTANT: Update CONFIG.API_KEY with: ca_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
============================================================
```

Copy that API key.

### Step 7: Update CONFIG.API_KEY

Replace `YOUR_API_KEY_HERE` in the script with the API key from Step 6:

```javascript
API_KEY: 'ca_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
```

### Step 8: Run Again to Verify

Click **Run** again. This time the script will authenticate with your API key. Check the logs for a success message like:

```
Successfully pushed 42 records.
```

### Step 9: Set Up Daily Schedule

1. Go back to **Scripts** list
2. Find your script and click the **pencil** icon in the Frequency column
3. Set frequency to **Daily**
4. Set time to **3:00 AM - 4:00 AM** (in your account timezone)
5. Click **Save**

Running at 3am+ ensures Google Ads stats from the previous day have finalised.

## Troubleshooting

### "Invalid JSON body" or "Validation failed"

The app rejected the payload. Check the response body in the logs for specific field errors. This usually means the script and app versions are mismatched -- update to the latest script.

### "Invalid API key for this account"

Your API key does not match what the app has on record. Double-check:
- You copied the full key (starts with `ca_`)
- You are pushing from the same Google Ads account that was originally registered

### "Response code: 500"

Server error on the app side. Check your app's deployment logs (e.g. Vercel dashboard) for details.

### "No data found for YYYY-MM-DD. Skipping push."

No ads had impressions on that date. This is normal for new or paused accounts.

### Script times out

Google Ads Scripts have a 30-minute execution limit. If you have a very large account, the script may time out. Consider reducing the date range or splitting queries.

### "UrlFetchApp is not defined"

You are running the script outside of Google Ads Scripts (e.g. in a local Node.js environment). This script is designed to run only inside the Google Ads Scripts editor.

## What Data Is Collected

The script queries 4 campaign types via Google Ads Query Language (GAQL):

| Type | What | Key Metrics |
|------|------|-------------|
| **RSA** | Responsive Search Ads (headlines, descriptions, ad strength) | Impressions, clicks, cost, conversions |
| **RSA Assets** | Individual headline/description performance labels | Impressions, clicks, cost, conversions |
| **PMax** | Performance Max campaign and asset group data | Campaign-level impressions, clicks, cost, conversions |
| **Display** | Display and Demand Gen ads | Impressions, clicks, cost, conversions |
| **Video** | Video campaign ads | Views, view rate, CPV, quartile completion rates |

All data is scoped to the previous day (`YESTERDAY`) by default. No personal or customer data is collected -- only ad creative metadata and aggregate performance metrics.
