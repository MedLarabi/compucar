#!/bin/bash

# Production Environment Update Script for CompuCar
# This script helps update environment variables on your VPS

echo "🚀 CompuCar Production Environment Update"
echo "========================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your production variables."
    exit 1
fi

echo "📋 Current environment variables that need updating:"
echo ""

# Show current NEXTAUTH_URL
echo "1. NEXTAUTH_URL:"
grep "NEXTAUTH_URL" .env || echo "   Not found in .env"
echo "   Should be: NEXTAUTH_URL=\"https://compucar.pro\""
echo ""

# Show current NEXT_PUBLIC_APP_URL
echo "2. NEXT_PUBLIC_APP_URL:"
grep "NEXT_PUBLIC_APP_URL" .env || echo "   Not found in .env"
echo "   Should be: NEXT_PUBLIC_APP_URL=\"https://compucar.pro\""
echo ""

# Show Telegram configuration
echo "3. Telegram Configuration:"
grep "TELEGRAM.*TOKEN" .env | head -3
echo ""

echo "🔧 To update your production environment:"
echo "1. Edit your .env file:"
echo "   nano .env"
echo ""
echo "2. Update these variables:"
echo "   NEXTAUTH_URL=\"https://compucar.pro\""
echo "   NEXT_PUBLIC_APP_URL=\"https://compucar.pro\""
echo ""
echo "3. Restart your application:"
echo "   pm2 restart nextjs"
echo ""
echo "4. Update Telegram webhooks:"
echo "   npx tsx scripts/update-production-webhooks.ts"
echo ""

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    echo "📊 Current PM2 status:"
    pm2 list
else
    echo "⚠️  PM2 not found. Make sure to restart your Node.js application after updating .env"
fi

echo ""
echo "🎯 After making these changes, your performance issues should be resolved!"
echo "   - No more localhost API calls"
echo "   - Proper webhook URLs"
echo "   - Optimized SSE connections"
