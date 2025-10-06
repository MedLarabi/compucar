# Yalidine Real-Time Shipping Integration Setup

## Overview
This implementation uses Yalidine's official `/v1/fees` API endpoint to get real-time shipping prices instead of static tables.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Yalidine API Configuration
YALIDINE_API_BASE=https://api.yalidine.app/v1/
YALIDINE_API_ID=your_api_id_here
YALIDINE_API_TOKEN=your_api_token_here
YALIDINE_FROM_WILAYA_ID=16
```

### Getting Your API Credentials

1. **Visit Yalidine Developer Portal**: https://yalidine.app/developers
2. **Login/Register** with your Yalidine account
3. **Create an API App** and get your:
   - `API_ID` (example: `08467949173865045243`)
   - `API_TOKEN` (example: `6tDv0VDFh5MKfvcyQtO3eouLUT8Sc7w5FngPzXRrOHPyq29zWY4Jlpr2dB1jaiRJ`)

### Configuration Details

- **YALIDINE_FROM_WILAYA_ID**: Your business location wilaya ID
  - Default: `16` (Alger)
  - Common IDs: Alger=16, Oran=31, Constantine=25, Blida=9, Chlef=2
  - Update this to match your actual business location

## Features Implemented

### ✅ Real-Time Price Fetching
- Uses Yalidine's `/v1/fees` API endpoint
- Fetches current prices for each wilaya/commune combination
- Includes zone-based pricing and commune-specific rates

### ✅ Advanced Weight Calculation
- **Volumetric Weight**: `width × height × length × 0.0002`
- **Billable Weight**: `max(actual_weight, volumetric_weight)`
- **Overweight Fee**: `(billable_weight - 5) × oversize_fee` (if > 5kg)

### ✅ Delivery Options
- **Express Home Delivery**: `express_home`
- **Express Stopdesk**: `express_desk`
- **Economic Home** (if available): `economic_home`
- **Economic Stopdesk** (if available): `economic_desk`

### ✅ Graceful Fallbacks
- Falls back to static pricing if API is unavailable
- Detailed error logging and reporting
- Never blocks checkout process

## API Response Structure

```json
{
  "shipping": {
    "cost": 1450,
    "currency": "DZD",
    "estimatedDays": 3,
    "details": {
      "source": "yalidine_api",
      "zone": 4,
      "commune": "Akabli",
      "baseDeliveryFee": 1450,
      "billableWeight": 3,
      "overweightFee": 0,
      "oversizeFeePerKg": 100
    }
  }
}
```

## Testing the Integration

### 1. Test Real-Time API (with credentials)
```powershell
$testData = @{ 
  wilaya = "Chlef"
  commune = "Chlef"
  weight = 3
  isStopdesk = $false
  length = 30
  width = 20
  height = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/yalidine/shipping/calculate" -Method POST -Headers @{"Content-Type"="application/json"} -Body $testData
```

### 2. Test Fallback (without credentials)
- Remove API credentials from environment
- Should fall back to static pricing with detailed error info

## Updating Static Prices

If you prefer to update static prices manually, modify the `DELIVERY_FEES_TABLE` in:
`src/lib/yalidine/client.ts` (lines 613-681)

## Migration from Static to Real-Time

The implementation automatically:
1. Tries real-time API first
2. Falls back to static table if API fails
3. Logs the data source in response details

## Troubleshooting

### Common Issues

1. **"Yalidine API credentials not configured"**
   - Add API credentials to `.env.local`
   - Restart the development server

2. **"Unknown wilaya: [name]"**
   - Check wilaya name spelling
   - Ensure it matches exactly (case-sensitive)

3. **API returns 401/403**
   - Verify API credentials are correct
   - Check if API access is enabled for your account

4. **Prices still static**
   - Check browser console for API logs
   - Verify environment variables are loaded
   - Look for `"source": "yalidine_api"` in response details

### Logs to Monitor

- `🔄 Fetching real-time fees from Yalidine`
- `✅ Got real-time fees from Yalidine`
- `💰 Shipping calculation details`
- `⚠️ Failed to get real-time fees, using fallback`

## Benefits of Real-Time Integration

1. **Always Current**: Prices update automatically when Yalidine changes rates
2. **Accurate Zones**: Real zone-based pricing instead of estimates
3. **Commune-Specific**: Different prices for different communes within same wilaya
4. **Weight Accuracy**: Proper volumetric weight and oversize fee calculation
5. **Transparency**: Detailed breakdown of fees for customers