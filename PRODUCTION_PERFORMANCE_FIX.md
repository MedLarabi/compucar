# CompuCar Production Performance Fix Guide

## 🚨 Critical Issues Identified

Your `compucar.pro/files` page is experiencing performance issues due to several problems:

### 1. **CRITICAL: Localhost API Calls in Production**
- Your logs show: `Products API called: http://localhost:3000/api/products?limit=8&featured=true`
- This means your production app is trying to call localhost instead of your domain
- **Root Cause**: `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` are set to localhost

### 2. **SSE Connection Churning**
- Connections are constantly opening/closing: `SSE connection closed/established`
- This creates unnecessary load and slow performance

### 3. **Repeated API Calls**
- Products API is being called multiple times unnecessarily
- This happens because of improper environment configuration

## 🔧 **IMMEDIATE FIXES REQUIRED**

### Step 1: Update Environment Variables on Your VPS

SSH into your VPS and update your `.env` file:

```bash
# Edit your environment file
nano .env

# Update these variables:
NEXTAUTH_URL="https://compucar.pro"
NEXT_PUBLIC_APP_URL="https://compucar.pro"

# Make sure these are also set correctly:
TELEGRAM_BOT_TOKEN=your_actual_token
TELEGRAM_SUPER_ADMIN_BOT_TOKEN=your_actual_token
```

### Step 2: Restart Your Application

```bash
# If using PM2:
pm2 restart nextjs

# If using systemd:
sudo systemctl restart your-app-service

# If using Docker:
docker-compose restart
```

### Step 3: Update Telegram Webhooks

```bash
# Run the webhook update script:
npx tsx scripts/update-production-webhooks.ts
```

## 🎯 **Expected Results After Fix**

1. **✅ No More Localhost Calls**: All API calls will use `https://compucar.pro`
2. **✅ Stable SSE Connections**: Connections will stay open and not churn
3. **✅ Faster Page Loading**: `/files` page will load much faster
4. **✅ Working Webhooks**: Telegram notifications will work properly

## 🔍 **How to Verify the Fix**

### 1. Check Your Logs
After the fix, your logs should show:
```
Products API called: https://compucar.pro/api/products?limit=8&featured=true
SSE connection established for user: xxx (and stay connected)
```

### 2. Test the Files Page
- Navigate to `https://compucar.pro/files`
- Page should load quickly without freezing
- Check browser developer tools - no localhost calls

### 3. Test Telegram Webhooks
- Upload a file or change file status
- You should receive Telegram notifications

## 🛠️ **Additional Optimizations Applied**

1. **SSE Connection Management**: 
   - Connections now reuse existing open connections
   - Reduced connection churning
   - Better error handling

2. **Email Templates**: 
   - Fixed all localhost references in email templates
   - Now use production domain dynamically

3. **CORS Configuration**: 
   - Updated to use production domain
   - Better security and performance

## 📊 **Performance Monitoring**

Monitor these metrics after the fix:
- Page load time for `/files` should be < 2 seconds
- SSE connections should stay stable
- No localhost errors in logs
- Telegram webhooks working consistently

## 🆘 **If Issues Persist**

1. **Check Environment Variables**:
   ```bash
   echo $NEXTAUTH_URL
   echo $NEXT_PUBLIC_APP_URL
   ```

2. **Check Application Logs**:
   ```bash
   pm2 logs nextjs
   # or
   journalctl -u your-app-service -f
   ```

3. **Verify Webhook Status**:
   ```bash
   npx tsx scripts/test-production-webhooks.ts
   ```

## 🎉 **Summary**

The main issue was that your production application was configured with localhost URLs instead of your production domain `https://compucar.pro`. This caused:
- API calls to fail or timeout
- SSE connections to behave erratically  
- Slow page loading
- Non-functional webhooks

After updating the environment variables and restarting your application, all these issues should be resolved!
