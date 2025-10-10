#!/bin/bash

# Manual Customer Bot Webhook Setup
# Replace YOUR_BOT_TOKEN with your actual bot token

BOT_TOKEN="YOUR_BOT_TOKEN"
WEBHOOK_URL="https://compucar.pro/api/telegram/customer"

echo "Setting up Customer Bot webhook..."
echo "Bot Token: ${BOT_TOKEN:0:10}..."
echo "Webhook URL: $WEBHOOK_URL"

# Set webhook
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$WEBHOOK_URL\",\"allowed_updates\":[\"message\",\"callback_query\"]}"

echo ""
echo "Checking webhook status..."

# Check webhook info
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

echo ""
echo "Customer Bot webhook setup complete!"
