# Deployment Guide

This guide covers deploying the CompuCar e-commerce platform to production.

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with your code
- [ ] Production database set up (see DATABASE_DEPLOYMENT.md)
- [ ] Domain name configured
- [ ] Environment variables ready
- [ ] Stripe account configured
- [ ] Email service configured

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended deployment platform for Next.js applications.

#### Quick Deploy
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   Set in Vercel dashboard or via CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add STRIPE_SECRET_KEY
   # ... add all required env vars
   ```

3. **Custom Domain**
   - Add domain in Vercel dashboard
   - Configure DNS records
   - SSL certificate is automatic

#### Advanced Configuration
- **Build Settings**: Configured in `vercel.json`
- **Functions**: API routes auto-configured
- **Edge Functions**: For global performance
- **Analytics**: Built-in performance monitoring

### Option 2: Railway

Railway offers integrated database and application hosting.

#### Setup
1. **Create Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Deploy
   railway up
   ```

2. **Database Integration**
   ```bash
   # Add PostgreSQL service
   railway add postgresql
   
   # Get connection string
   railway connect
   ```

3. **Environment Variables**
   Set in Railway dashboard or via CLI.

### Option 3: DigitalOcean App Platform

For more control over the deployment environment.

#### Setup
1. **Create App**
   - Connect GitHub repository
   - Select Node.js environment
   - Configure build settings

2. **Database**
   - Create managed PostgreSQL database
   - Configure connection pooling
   - Set up automated backups

3. **Scaling**
   - Configure auto-scaling rules
   - Set up load balancing
   - Monitor resource usage

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For migrations

# Authentication
NEXTAUTH_SECRET="random-32-char-string"
NEXTAUTH_URL="https://your-domain.com"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Payments
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# File Uploads
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# Email
RESEND_API_KEY="re_..."

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="CompuCar"
```

### Optional Variables
```bash
# Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# Error Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES="false"
NEXT_PUBLIC_MAINTENANCE_MODE="false"
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Build completes successfully (`npm run build`)

### Security
- [ ] Environment variables secured
- [ ] API endpoints authenticated
- [ ] CORS configured properly
- [ ] Security headers enabled
- [ ] SSL/TLS certificate configured

### Performance
- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] CDN configured

### Functionality
- [ ] Authentication working
- [ ] Payment processing tested
- [ ] Email notifications working
- [ ] File uploads functional
- [ ] Admin panel accessible

## Deployment Process

### 1. Prepare for Deployment
```bash
# Update dependencies
npm update

# Run full test suite
npm run check-all

# Build and test locally
npm run build
npm start
```

### 2. Deploy to Staging
```bash
# Deploy to preview environment
vercel

# Test staging environment
# - User registration/login
# - Product browsing
# - Cart functionality
# - Checkout process
# - Admin functions
```

### 3. Deploy to Production
```bash
# Deploy to production
vercel --prod

# Run database migrations
npx prisma db push

# Verify deployment
curl -I https://your-domain.com
```

### 4. Post-Deployment
```bash
# Monitor logs
vercel logs

# Check error rates
# Monitor performance metrics
# Test critical user flows
```

## Monitoring & Maintenance

### Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **API Response Times**: Track endpoint performance
- **Database Performance**: Monitor query times
- **Error Rates**: Track 4xx and 5xx errors

### Health Checks
```bash
# API health check
curl https://your-domain.com/api/health

# Database connectivity
curl https://your-domain.com/api/health/database

# Authentication
curl https://your-domain.com/api/auth/session
```

### Backup & Recovery
- **Database Backups**: Automated daily backups
- **Code Backups**: Git repository with tags
- **Asset Backups**: CDN with versioning
- **Configuration Backups**: Environment variables documented

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   vercel logs
   
   # Debug locally
   npm run build
   ```

2. **Database Connection Issues**
   ```bash
   # Test connection
   npx prisma db push --force-reset
   
   # Check connection string
   echo $DATABASE_URL
   ```

3. **Environment Variable Issues**
   ```bash
   # List all env vars
   vercel env ls
   
   # Update env var
   vercel env add VARIABLE_NAME
   ```

4. **Performance Issues**
   - Enable caching headers
   - Optimize images
   - Implement code splitting
   - Use edge functions

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## Rollback Procedure

If issues arise after deployment:

1. **Quick Rollback**
   ```bash
   # Rollback to previous deployment
   vercel rollback
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup-latest.sql
   ```

3. **DNS Rollback**
   - Update DNS records to previous server
   - Wait for propagation (up to 48 hours)

## Scaling Considerations

### Horizontal Scaling
- **Multiple Regions**: Deploy to multiple Vercel regions
- **CDN**: Use Vercel's global CDN
- **Database Read Replicas**: For read-heavy workloads

### Vertical Scaling
- **Compute**: Upgrade Vercel plan for more resources
- **Database**: Scale database tier as needed
- **Storage**: Monitor and scale file storage

### Auto-Scaling
- Configure based on:
  - CPU usage
  - Memory usage
  - Request volume
  - Response times
