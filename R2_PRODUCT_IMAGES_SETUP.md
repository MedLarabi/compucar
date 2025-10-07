# 🚀 Cloudflare R2 Setup for Product Images

## Overview
This guide will help you configure Cloudflare R2 to store and serve product images instead of using the local filesystem. This is much better for production deployments.

## 📋 Prerequisites
- Cloudflare account
- R2 storage enabled on your account
- Domain for public access (optional but recommended)

## 🔧 Step 1: Create R2 Bucket

1. **Login to Cloudflare Dashboard**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to "R2 Object Storage"

2. **Create Bucket**
   - Click "Create bucket"
   - Name: `compucar-products` (or any name you prefer)
   - Region: Choose closest to your users or leave as "auto"
   - Click "Create bucket"

## 🔑 Step 2: Create API Token

1. **Go to R2 API Tokens**
   - In R2 dashboard, click "Manage R2 API tokens"
   - Click "Create API token"

2. **Configure Token**
   - Name: `CompuCar Product Images`
   - Permissions: **Object Read & Write**
   - Bucket: Select your bucket or "Apply to all buckets"
   - Click "Create API token"

3. **Save Credentials**
   - Copy the **Access Key ID**
   - Copy the **Secret Access Key**
   - **Important**: Save these immediately, you won't see them again!

## 🌐 Step 3: Setup Public Domain (Recommended)

### Option A: Custom Domain (Best)
1. **Add Custom Domain**
   - In your R2 bucket settings, go to "Settings" → "Custom Domains"
   - Click "Connect Domain"
   - Enter your domain: `cdn.compucar.pro` (or subdomain of your choice)
   - Follow DNS setup instructions

2. **Configure DNS**
   - Add CNAME record: `cdn.compucar.pro` → `your-bucket.r2.cloudflarestorage.com`

### Option B: R2.dev Domain (Quick)
1. **Enable Public Access**
   - In bucket settings, go to "Settings" → "Public Access"
   - Click "Allow Access" and "Save"
   - Your public URL will be: `https://pub-[hash].r2.dev`

## ⚙️ Step 4: Environment Variables

Add these to your `.env` file on both localhost and VPS:

```env
# Cloudflare R2 Configuration for Product Images
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_BUCKET="compucar-products"
R2_ACCESS_KEY_ID="your-access-key-from-step-2"
R2_SECRET_ACCESS_KEY="your-secret-key-from-step-2"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_REGION="auto"

# Public URL for serving images (choose one):
# Option A: Custom domain
R2_PUBLIC_URL="https://cdn.compucar.pro"
# Option B: R2.dev domain
# R2_PUBLIC_URL="https://pub-[your-hash].r2.dev"

# File Upload Settings
PRESIGNED_URL_EXPIRES=900
MAX_UPLOAD_MB=200
```

### 🔍 How to Find Your Account ID
- In Cloudflare dashboard, look at the right sidebar
- Copy the "Account ID" value

## 🧪 Step 5: Test the Setup

1. **Build and Run**
   ```bash
   npm run build
   npm run dev  # or deploy to VPS
   ```

2. **Upload Test Image**
   - Go to admin panel → Products → Create Product
   - Upload an image
   - Check if it appears correctly

3. **Verify R2 Storage**
   - Go to your R2 bucket in Cloudflare dashboard
   - Check "Objects" tab - you should see uploaded files in `products/` folder

## 🎯 Expected Results

After setup:
- ✅ **Images upload to R2** instead of local filesystem
- ✅ **Images served from CDN** for fast loading
- ✅ **Works on both localhost and VPS** 
- ✅ **No VPS storage issues** - unlimited cloud storage
- ✅ **Better performance** - CDN distribution
- ✅ **Automatic backups** - Cloudflare handles redundancy

## 🔧 File Structure in R2

Your images will be organized like this:
```
compucar-products/
└── products/
    ├── image_1640995200000_abc123.jpg
    ├── image_1640995300000_def456.png
    └── video_1640995400000_ghi789.mp4
```

## 🚨 Troubleshooting

### Images Not Uploading
- Check R2 credentials in `.env`
- Verify API token has "Object Read & Write" permissions
- Check console logs for error messages

### Images Not Displaying
- Verify `R2_PUBLIC_URL` is set correctly
- Check if bucket has public access enabled
- Test direct URL in browser

### 403 Forbidden Errors
- API token permissions insufficient
- Bucket name incorrect
- Account ID mismatch

### CORS Issues
- In R2 bucket settings → CORS policy:
```json
[
  {
    "AllowedOrigins": ["https://compucar.pro", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

## 💡 Benefits of R2 vs Local Storage

| Feature | Local Storage | Cloudflare R2 |
|---------|---------------|----------------|
| **Scalability** | Limited by VPS disk | Unlimited |
| **Performance** | Single server | Global CDN |
| **Backup** | Manual | Automatic |
| **Cost** | VPS storage costs | Pay per use |
| **Reliability** | Single point failure | 99.9% uptime |
| **Bandwidth** | VPS bandwidth | R2 bandwidth |

## 🎉 Success!

Once configured, your product images will be stored in Cloudflare R2 and served via CDN, providing:
- **Faster loading times** worldwide
- **Unlimited storage** capacity  
- **Better reliability** and uptime
- **No VPS storage concerns**

Your image URLs will look like:
- `https://cdn.compucar.pro/products/image_1640995200000_abc123.jpg`
- `https://pub-abc123.r2.dev/products/video_1640995400000_ghi789.mp4`
