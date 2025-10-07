# NextAuth Production Fix Guide

## 🚨 **Immediate Fix for Your Production Server**

Based on your error and environment, here are the **immediate steps** to fix the authentication issue:

### Step 1: Update Your Production Environment Variables

Your current `.env` on the server needs these additions/corrections:

```bash
# Environment variables for CompuCar E-commerce
DATABASE_URL="postgresql://turbodigitt:turbodigitt202520000@localhost:5432/tuning?schema=public"
NODE_ENV="production"
NEXTAUTH_SECRET="LN0AD4kA8Ljjp1Xcdh03D7tFBJX/GYjqYGz8uULqRqE="
NEXTAUTH_URL="https://compucar.pro"

# Add these missing required variables:
NEXT_PUBLIC_SITE_URL="https://compucar.pro"

# OAuth Provider Configuration (keep empty if not using)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""

# Your existing API keys (keep as is)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
UPLOADTHING_SECRET="sk_live_b66f69ccfd021b1fc6cdd67938a0df8e5d36ff0de7992b86fa990e5bdc8dbbde"
UPLOADTHING_APP_ID="jknfeiioyw"
RESEND_API_KEY="re_your_resend_api_key"

# Rest of your config...
```

### Step 2: Run Diagnostic Script on Your Server

Upload and run this diagnostic script on your production server:

```bash
# On your production server
npx tsx scripts/diagnose-production-auth.ts
```

### Step 3: Common Production Issues & Fixes

#### Issue 1: HTTPS/SSL Certificate Problems
```bash
# Check if your SSL certificate is working
curl -I https://compucar.pro/api/auth/session

# If SSL issues, temporarily test with HTTP (NOT for production use):
# NEXTAUTH_URL="http://compucar.pro"  # ONLY FOR TESTING
```

#### Issue 2: Database Connection Issues
```bash
# Test database connection on server
psql -h localhost -U turbodigitt -d tuning -c "SELECT COUNT(*) FROM users;"
```

#### Issue 3: Missing NextAuth Tables
```bash
# Run Prisma migrations on server
npx prisma db push
# or
npx prisma migrate deploy
```

### Step 4: Restart Your Application

After making changes:

```bash
# If using PM2
pm2 restart all

# If using systemd
sudo systemctl restart your-app-service

# If using Docker
docker-compose restart
```

### Step 5: Test Authentication

```bash
# Test the auth endpoint
curl -X GET "https://compucar.pro/api/auth/session" \
  -H "Content-Type: application/json"

# Should return 200 status, not 500
```

## 🔍 **Most Likely Causes**

Based on your setup, the issue is probably one of these:

1. **Cookie Security Settings** - Fixed in the code update
2. **Missing Environment Variables** - Add NEXT_PUBLIC_SITE_URL
3. **Database Connection** - Verify PostgreSQL is accessible
4. **SSL/HTTPS Issues** - Check certificate validity

## 🚀 **Quick Test Commands**

Run these on your production server to verify:

```bash
# 1. Check environment variables
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET
echo $DATABASE_URL

# 2. Test database
psql $DATABASE_URL -c "SELECT email, role FROM users LIMIT 5;"

# 3. Check if app is running
curl -I https://compucar.pro

# 4. Test auth endpoint specifically
curl -v https://compucar.pro/api/auth/session
```

## 📋 **Checklist**

- [ ] All environment variables set correctly
- [ ] NEXTAUTH_URL matches your domain exactly
- [ ] Database is accessible and has required tables
- [ ] SSL certificate is valid
- [ ] Application restarted after changes
- [ ] No firewall blocking database connections

## 🆘 **If Still Not Working**

1. **Check server logs** for detailed error messages:
   ```bash
   # PM2 logs
   pm2 logs
   
   # System logs
   sudo journalctl -u your-app-service -f
   ```

2. **Enable debug mode temporarily**:
   ```bash
   # Add to .env temporarily
   NODE_ENV="development"
   ```

3. **Test with the diagnostic script** and share the output.

## 📞 **Next Steps**

1. Apply the environment variable changes
2. Restart your application
3. Run the diagnostic script
4. Test authentication
5. Share the diagnostic output if issues persist

The fix should resolve the "server configuration" error you're experiencing!
