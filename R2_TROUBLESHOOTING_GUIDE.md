# 🔧 R2 Upload Issues - Troubleshooting Guide

## 🚨 **Current Issues**

### 1. **Images Upload but Don't Display**
- ✅ **Upload successful** - Images reach R2 storage
- ❌ **Display fails** - Next.js Image component hostname error
- 🔄 **Status**: Dev server restarted, should be fixed

### 2. **Video Upload JSON Parse Error**  
- ❌ **Upload fails** - "JSON.parse unexpected character"
- 🔍 **Likely cause**: R2 configuration or authentication issue

## 🛠️ **Immediate Debugging Steps**

### Step 1: Check R2 Configuration
Visit this URL in your browser: `http://localhost:3002/api/upload/debug`

This will show you:
```json
{
  "success": true,
  "r2Config": {
    "R2_ACCOUNT_ID": "✅ Set" or "❌ Missing",
    "R2_BUCKET": "✅ Set" or "❌ Missing", 
    "R2_ACCESS_KEY_ID": "✅ Set" or "❌ Missing",
    "R2_SECRET_ACCESS_KEY": "✅ Set" or "❌ Missing",
    "R2_ENDPOINT": "✅ Set" or "❌ Missing",
    "R2_PUBLIC_URL": "✅ Set" or "❌ Missing"
  }
}
```

### Step 2: Test Image Display (After Dev Server Restart)
1. **Refresh your browser** on the product creation page
2. **Upload a new image** 
3. **Check if it displays** without hostname errors

### Step 3: Check Console Logs
Open browser developer tools and look for:
- **Upload API calls** - Check network tab
- **Error messages** - Check console tab
- **R2 responses** - Look for detailed error logs

## 🔍 **Common Issues & Solutions**

### Issue 1: Missing R2 Environment Variables
**Symptoms**: JSON parse errors, upload failures
**Solution**: Add to your `.env` file:
```env
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_BUCKET="your-bucket-name" 
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_REGION="auto"
R2_PUBLIC_URL="https://carworkshop.org"
```

### Issue 2: Wrong R2 Permissions
**Symptoms**: 403 Forbidden errors
**Solution**: Ensure R2 API token has:
- ✅ **Object Read & Write** permissions
- ✅ **Correct bucket access**

### Issue 3: CORS Issues
**Symptoms**: Network errors, blocked requests
**Solution**: Configure R2 bucket CORS:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3002", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

### Issue 4: Image Hostname Not Configured
**Symptoms**: "hostname not configured" errors
**Solution**: ✅ **Already fixed** - `carworkshop.org` added to `next.config.ts`

## 📋 **Testing Checklist**

### ✅ **Environment Check**
- [ ] Visit `/api/upload/debug` to verify R2 config
- [ ] All R2 variables show "✅ Set"
- [ ] R2_PUBLIC_URL matches your domain

### ✅ **Image Upload Test**  
- [ ] Upload new image after dev server restart
- [ ] Image displays without hostname errors
- [ ] Check browser console for errors

### ✅ **Video Upload Test**
- [ ] Try uploading small video file (< 5MB)
- [ ] Check browser console for detailed error
- [ ] Look for specific R2 error messages

## 🚀 **Next Steps**

1. **Check debug endpoint**: `http://localhost:3002/api/upload/debug`
2. **Share results**: Tell me what the debug endpoint shows
3. **Test image upload**: Try uploading after refresh
4. **Test video upload**: Try with small video file

## 📞 **If Issues Persist**

Share with me:
1. **Debug endpoint output** - What does `/api/upload/debug` show?
2. **Console errors** - Any error messages in browser console?
3. **Network tab** - Status codes of failed requests?
4. **Environment setup** - Are all R2 variables set correctly?

The R2 integration should work perfectly once we identify the specific configuration issue! 🎯
