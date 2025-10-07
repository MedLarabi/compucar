# 🚨 PRODUCTION AUTH 500 ERROR - EMERGENCY FIX

## Current Issue
Your production server is returning 500 errors for `/api/auth/session` even though localhost works fine.

## 🔥 IMMEDIATE STEPS TO FIX

### Step 1: Check Your Server Logs
First, check your server logs to see the actual error:

```bash
# If using PM2
pm2 logs

# If using systemd
sudo journalctl -u your-app-service -f

# If using Docker
docker logs your-container-name

# Generic log locations
tail -f /var/log/your-app.log
```

### Step 2: Run Quick Diagnostic
Upload and run this diagnostic script on your production server:

```bash
# On your production server
npx tsx scripts/quick-auth-debug.ts
```

### Step 3: Verify Environment Variables
SSH into your production server and check:

```bash
# Check if environment variables are loaded
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET
echo $DATABASE_URL
echo $NODE_ENV

# Or check the .env file
cat .env
```

### Step 4: Most Common Production Issues

#### Issue A: Environment Variables Not Loaded
```bash
# Make sure your .env file is in the right location
ls -la .env

# Ensure it has the right permissions
chmod 600 .env

# Restart your application after changes
pm2 restart all
```

#### Issue B: Database Connection Issues
```bash
# Test database connection directly
psql "postgresql://turbodigitt:turbodigitt202520000@localhost:5432/tuning" -c "SELECT COUNT(*) FROM users;"

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

#### Issue C: NextAuth Tables Missing
```bash
# Run Prisma migrations
npx prisma db push
# or
npx prisma migrate deploy
```

### Step 5: Emergency Environment Fix
If environment variables aren't loading, create this exact `.env` file:

```bash
# Create/update .env file on production server
cat > .env << 'EOF'
DATABASE_URL="postgresql://turbodigitt:turbodigitt202520000@localhost:5432/tuning?schema=public"
NODE_ENV="production"
NEXTAUTH_SECRET="LN0AD4kA8Ljjp1Xcdh03D7tFBJX/GYjqYGz8uULqRqE="
NEXTAUTH_URL="https://compucar.pro"
NEXT_PUBLIC_SITE_URL="https://compucar.pro"

# OAuth (keep empty if not using)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""

# Your other variables...
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
UPLOADTHING_SECRET="sk_live_b66f69ccfd021b1fc6cdd67938a0df8e5d36ff0de7992b86fa990e5bdc8dbbde"
UPLOADTHING_APP_ID="jknfeiioyw"
RESEND_API_KEY="re_your_resend_api_key"

# Yalidine API
YALIDINE_API_BASE=https://api.yalidine.app/v1/
YALIDINE_API_ID=85933786977171395065
YALIDINE_API_TOKEN=Dfbe2rA8BCnoUzRu31yKIYO0LF5WVxv4qGHlhEtwSgspkPXT6mNQMZJcad7j9i
YALIDINE_FROM_WILAYA_ID=16
YALIDINE_API_URL=https://api.yalidine.app/v1
YALIDINE_WEBHOOK_SECRET=11dc9f1415764525ac2a509fa7ce4ffd79c7aa95d887ecb25fa6252f48525be2
YALIDINE_ENABLE_AUTO_CREATE=true
DEFAULT_FROM_WILAYA_NAME=Alger
DEFAULT_FROM_ADDRESS=Your Business Address
CURRENCY=DZD
CRON_SECRET=some-long-random

# Cloudflare R2
R2_ACCOUNT_ID=c6c9249d5e4c4fb0308413fd8c4e7239
R2_BUCKET=compucar
R2_ACCESS_KEY_ID=5d1a909ff187d5c31398f955bf36f21c
R2_SECRET_ACCESS_KEY=5b949efb2beb6d01ebce4b794165e24750f4b36031b129fca7e1507cb1465548
R2_ENDPOINT=https://c6c9249d5e4c4fb0308413fd8c4e7239.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_URL=https://pub-540795e0ce01450bb2eabc5acd5c3dcd.r2.dev

# Telegram
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=8316665939:AAGTyMEUgYfDNbnPdWPcwZtG7S3BrYWfZ8M
TELEGRAM_CHAT_ID=1583993249
TELEGRAM_SUPER_ADMIN_BOT_TOKEN=8316665939:AAGTyMEUgYfDNbnPdWPcwZtG7S3BrYWfZ8M
TELEGRAM_SUPER_ADMIN_CHAT_ID=1583993249
TELEGRAM_SUPER_ADMIN_ENABLED=true
TELEGRAM_FILE_ADMIN_BOT_TOKEN=8316665939:AAGTyMEUgYfDNbnPdWPcwZtG7S3BrYWfZ8M
TELEGRAM_FILE_ADMIN_CHAT_ID=1583993249
TELEGRAM_FILE_ADMIN_ENABLED=true
TELEGRAM_CUSTOMER_BOT_TOKEN=8316665939:AAGTyMEUgYfDNbnPdWPcwZtG7S3BrYWfZ8M
TELEGRAM_CUSTOMER_BOT_ENABLED=true
EOF
```

### Step 6: Restart and Test
```bash
# Restart your application
pm2 restart all
# or
sudo systemctl restart your-app-service

# Wait 10 seconds, then test
sleep 10

# Test the auth endpoint
curl -v "https://compucar.pro/api/auth/session"
```

## 🔍 Quick Tests

### Test 1: Environment Variables
```bash
node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL); console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');"
```

### Test 2: Database Connection
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  console.log('Users:', count);
  process.exit(0);
}).catch(err => {
  console.error('DB Error:', err.message);
  process.exit(1);
});
"
```

### Test 3: Auth Endpoint Direct Test
```bash
# Should return JSON, not 500 error
curl -H "Accept: application/json" "https://compucar.pro/api/auth/session"
```

## 🆘 If Still Not Working

1. **Share your server logs** - The exact error message will tell us what's wrong
2. **Run the diagnostic script** and share the output
3. **Check file permissions** - Make sure your app can read the .env file
4. **Verify the build** - Make sure you deployed the latest code with our fixes

## 📞 Emergency Contact Points

If you need immediate help:
1. Share the exact error from server logs
2. Share the output of the diagnostic script
3. Confirm which process manager you're using (PM2, systemd, Docker, etc.)

The 500 error means there's a runtime issue on the server that we need to identify from the logs!
