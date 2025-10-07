# NextAuth Production Fix Guide

## Problem Analysis
Your NextAuth is failing with "Configuration" error on production server. This is typically caused by:

1. Missing or incorrect environment variables
2. Database connection issues
3. Missing NextAuth database tables
4. Configuration errors

## Solution Steps

### Step 1: Update Your Production .env File
Your current production `.env` is missing several required variables. Update it to include:

```bash
# Environment variables for CompuCar E-commerce
DATABASE_URL="postgresql://turbodigitt:turbodigitt202520000@localhost:5432/tuning?schema=public"
NODE_ENV="production"
NEXTAUTH_SECRET="LN0AD4kA8Ljjp1Xcdh03D7tFBJX/GYjqYGz8uULqRqE="
NEXTAUTH_URL="https://compucar.pro"

# Add these missing variables:
NEXT_PUBLIC_SITE_URL="https://compucar.pro"
NEXT_PUBLIC_APP_NAME="CompuCar"

# Email settings (optional but recommended)
FROM_EMAIL="noreply@compucar.pro"
FROM_NAME="CompuCar"

# Disable OAuth providers if not configured
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""
```

### Step 2: Verify Database Tables
Run this SQL to ensure NextAuth tables exist:

```sql
-- Connect to your database and run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Account', 'Session', 'User', 'VerificationToken');
```

If tables are missing, run:
```bash
npx prisma db push
```

### Step 3: Test Database Connection
Create a simple test script to verify database connectivity:

```javascript
// test-db-connection.js
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
```

### Step 4: Use Production-Safe Auth Config
If you continue having issues, temporarily use the production-safe config I created:

1. Backup your current config:
```bash
cp src/lib/auth/config.ts src/lib/auth/config-backup.ts
```

2. Replace with production-safe version:
```bash
cp src/lib/auth/config-production.ts src/lib/auth/config.ts
```

### Step 5: Debug on Server
Run the diagnostic script on your server:

```bash
# Upload the debug script to your server
npx tsx scripts/debug-auth-production.ts
```

### Step 6: Check Server Logs
Check your server logs for more detailed error messages:

```bash
# Check PM2 logs if using PM2
pm2 logs

# Or check application logs
tail -f /var/log/your-app.log
```

## Quick Fix Commands

Run these commands on your production server:

```bash
# 1. Update environment variables (edit your .env file)
nano .env

# 2. Restart your application
pm2 restart all
# or
systemctl restart your-app-service

# 3. Check if it's working
curl -I https://compucar.pro/api/auth/session
```

## Common Issues & Solutions

### Issue 1: "NEXTAUTH_URL mismatch"
- Ensure NEXTAUTH_URL exactly matches your domain: `https://compucar.pro`
- No trailing slash

### Issue 2: "Database connection failed"
- Verify PostgreSQL is running: `systemctl status postgresql`
- Check database credentials
- Ensure database exists and is accessible

### Issue 3: "Missing tables"
- Run migrations: `npx prisma db push`
- Or generate and run: `npx prisma migrate deploy`

### Issue 4: "NEXTAUTH_SECRET missing"
- Generate a new secret: `openssl rand -base64 32`
- Add to your .env file

## Verification Steps

After applying fixes:

1. ✅ Check `/api/auth/session` returns proper response
2. ✅ Try logging in with existing credentials
3. ✅ Check browser network tab for any remaining errors
4. ✅ Verify session persistence after page refresh

## Need More Help?

If issues persist, run the diagnostic script and share the output:

```bash
npx tsx scripts/debug-auth-production.ts
```

This will provide detailed information about what's failing in your auth setup.
