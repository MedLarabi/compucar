# File Tuning System - R2 Storage Configuration Guide

## Issue Identified
The NetworkError occurs because Cloudflare R2 storage is not properly configured. The system successfully generates presigned URLs but fails when the browser tries to upload directly to R2.

## Required Environment Variables

You need to add these variables to your `.env.local` file:

```env
# Cloudflare R2 Configuration (Required for File Tuning System)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_BUCKET="compucar-tuning-files"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_REGION="auto"

# File Upload Settings
PRESIGNED_URL_EXPIRES=900
MAX_UPLOAD_MB=200
ALLOWED_FILE_TYPES=".bin,.hex,.ecu,.map,.ori,.mod,.kess,.ktag,.pcm,.edc,.damos,.a2l"

# Email Configuration for Tuning Notifications (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_NAME="CompuCar File Tuning"
FROM_EMAIL="noreply@compucar.com"
ADMIN_EMAIL="admin@compucar.com"
```

## Steps to Set Up Cloudflare R2

### 1. Create Cloudflare Account
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Sign up or log in to your account

### 2. Enable R2 Storage
- In the Cloudflare dashboard, go to "R2 Object Storage"
- Click "Create bucket"
- Name your bucket: `compucar-tuning-files`
- Choose a region (or leave as auto)

### 3. Create API Token
- Go to "Manage R2 API tokens"
- Click "Create API token"
- Give it a name like "CompuCar Tuning Files"
- Set permissions to "Object Read & Write"
- Select your bucket or leave as "Apply to all buckets"
- Click "Create API token"
- **Important**: Copy the Access Key ID and Secret Access Key

### 4. Get Your Account ID
- In the Cloudflare dashboard, the Account ID is shown in the right sidebar
- Copy this value

### 5. Update Environment Variables
Create or update your `.env.local` file with the values from steps 3 and 4:

```env
R2_ACCOUNT_ID="your-account-id-from-step-4"
R2_BUCKET="compucar-tuning-files"
R2_ACCESS_KEY_ID="access-key-from-step-3"
R2_SECRET_ACCESS_KEY="secret-key-from-step-3"
R2_ENDPOINT="https://your-account-id-from-step-4.r2.cloudflarestorage.com"
```

### 6. Restart Development Server
After updating the environment variables:
```bash
npm run dev
```

## Alternative: Local Development Mock

If you want to test without setting up R2, I can create a mock storage system for local development. Let me know if you'd prefer this approach.

## Testing the Setup

1. Go to `http://localhost:3000/files/upload`
2. Select a file (any small file for testing)
3. Choose at least one modification
4. Click upload

If configured correctly, you should see the upload progress and success message.

## Troubleshooting

- **NetworkError**: R2 credentials are missing or incorrect
- **CORS Error**: R2 bucket CORS settings need configuration
- **403 Forbidden**: API token doesn't have correct permissions
- **404 Not Found**: Bucket name is incorrect or doesn't exist

Let me know if you need help with any of these steps!
