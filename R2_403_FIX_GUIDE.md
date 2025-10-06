# 🔧 R2 403 Forbidden Error - Complete Fix Guide

## 🎯 **Problem Identified**
- ✅ R2 is properly configured
- ✅ Files exist in R2 bucket
- ✅ Presigned URLs are generated correctly
- ❌ **403 Forbidden** when accessing files

## 🔍 **Root Cause**
The issue is **Cloudflare R2 bucket permissions**. The bucket is not configured to allow public access or presigned URL access.

## 🛠️ **Solution Steps**

### Step 1: Enable R2 Public Access
1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Navigate to **R2 Object Storage**

2. **Select Your Bucket**
   - Click on the `compucar` bucket

3. **Configure Public Access**
   - Go to **Settings** tab
   - Scroll down to **Public Access**
   - Click **"Allow Access"** or **"Configure"**

4. **Set Up Custom Domain (Recommended)**
   - Go to **Settings** → **Custom Domains**
   - Add a custom domain like `files.compucar.com`
   - This will give you a cleaner URL structure

### Step 2: Configure CORS (Cross-Origin Resource Sharing)
1. **In R2 Dashboard**
   - Go to **Settings** → **CORS**
   - Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 3: Verify R2 Token Permissions
1. **Check R2 Token**
   - Go to **R2** → **Manage R2 API Tokens**
   - Find your token: `5d1a909ff187d5c31398f955bf36f21c`
   - Ensure it has **"Object Read"** permissions

2. **If Needed, Create New Token**
   - Click **"Create API Token"**
   - Name: `CompuCar-Files-Access`
   - Permissions: **Object Read** and **Object Write**
   - Copy the new credentials

### Step 4: Test the Fix
Run this command to test if the fix worked:

```bash
npx tsx scripts/test-existing-files.ts
```

## 🔄 **Alternative Solutions**

### Option A: Use R2 Public URLs (Simpler)
Instead of presigned URLs, make files publicly accessible:

1. **Enable Public Access** (Step 1 above)
2. **Update your code** to use direct URLs:
   ```typescript
   const publicUrl = `https://compucar.c6c9249d5e4c4fb0308413fd8c4e7239.r2.cloudflarestorage.com/${file.r2Key}`;
   ```

### Option B: Use Custom Domain
1. **Set up custom domain** (Step 1 above)
2. **Update R2 configuration** in your `.env.local`:
   ```env
   R2_PUBLIC_URL=https://files.compucar.com
   ```

### Option C: Fix Presigned URLs (Current Approach)
1. **Follow all steps above**
2. **Ensure R2 token has correct permissions**
3. **Verify CORS configuration**

## 🧪 **Testing Commands**

### Test 1: Check R2 Access
```bash
npx tsx scripts/test-existing-files.ts
```

### Test 2: Check Database vs R2 Sync
```bash
npx tsx scripts/check-r2-objects.ts
```

### Test 3: Test Full File Flow
```bash
# Start your app
npm run dev

# In another terminal, test the API
curl -X GET "http://localhost:3000/api/files?page=1&limit=5"
```

## 📊 **Current Status**
- **Database**: ✅ 21 files
- **R2 Storage**: ✅ 7 files (some missing due to upload issues)
- **Presigned URLs**: ✅ Generated correctly
- **File Access**: ❌ 403 Forbidden (permissions issue)

## 🎯 **Expected Result After Fix**
- All files should be accessible via presigned URLs
- Status should be **200 OK** instead of **403 Forbidden**
- Files should download properly in the browser

## 🚨 **Important Notes**
1. **Public Access**: Enabling public access means files can be accessed by anyone with the URL
2. **Security**: Consider using presigned URLs for better security
3. **Custom Domain**: Recommended for production use
4. **CORS**: Required for browser-based file downloads

## 🔧 **Quick Fix (5 minutes)**
1. Go to Cloudflare R2 Dashboard
2. Select `compucar` bucket
3. Go to Settings → Public Access
4. Click "Allow Access"
5. Test with: `npx tsx scripts/test-existing-files.ts`

The 403 error should be resolved! 🎉
