# Database Deployment Guide

This guide covers setting up the production database for the CompuCar e-commerce platform.

## Supported Database Providers

### 1. Neon (Recommended)
- **Pros**: Serverless PostgreSQL, auto-scaling, built-in connection pooling
- **Setup**: 
  1. Sign up at [neon.tech](https://neon.tech)
  2. Create a new project
  3. Copy the connection string
  4. Set as `DATABASE_URL` environment variable

### 2. Railway
- **Pros**: Easy setup, integrated with Git deployments
- **Setup**:
  1. Sign up at [railway.app](https://railway.app)
  2. Create PostgreSQL service
  3. Copy connection string from dashboard
  4. Set as `DATABASE_URL` environment variable

### 3. Supabase
- **Pros**: Full backend-as-a-service, includes auth and real-time features
- **Setup**:
  1. Sign up at [supabase.com](https://supabase.com)
  2. Create new project
  3. Get database URL from settings
  4. Set as `DATABASE_URL` environment variable

### 4. PlanetScale
- **Pros**: MySQL-compatible, serverless, branching
- **Setup**:
  1. Sign up at [planetscale.com](https://planetscale.com)
  2. Create database
  3. Create branch for production
  4. Get connection string
  5. Update Prisma schema to use MySQL

## Environment Variables

Set these environment variables in your production environment:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# OAuth Providers (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Upload (UploadThing)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# Email (Resend)
RESEND_API_KEY="re_..."

# Monitoring (Sentry)
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."
```

## Database Migration

### Automatic Migration (Recommended)
The deployment pipeline automatically runs migrations:

```bash
npx prisma db push
```

### Manual Migration
If you need to run migrations manually:

```bash
# Set your production database URL
export DATABASE_URL="your-production-url"

# Run the setup script
chmod +x scripts/setup-production-db.sh
./scripts/setup-production-db.sh
```

## Data Seeding

### Initial Data
The platform includes seed data for:
- Categories (Electronics, Gaming, Accessories, etc.)
- Sample products
- Initial admin user

### Custom Seeding
To add custom seed data:

1. Edit `prisma/seed.ts`
2. Add your custom data
3. Run: `npx prisma db seed`

## Backup Strategy

### Automated Backups
Most cloud providers offer automated backups:

- **Neon**: Automatic daily backups with point-in-time recovery
- **Railway**: Automated backups with retention policies
- **Supabase**: Daily backups with 7-day retention (free tier)

### Manual Backup
Create manual backups before major deployments:

```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240115.sql
```

## Performance Optimization

### Connection Pooling
For high-traffic applications, use connection pooling:

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}
```

### Indexes
Key indexes are automatically created by Prisma:
- Primary keys
- Unique constraints
- Foreign keys

### Monitoring
Monitor database performance:
- Query performance
- Connection usage
- Storage growth
- Backup status

## Security Checklist

- [ ] Database URL uses SSL (`?sslmode=require`)
- [ ] Strong password with special characters
- [ ] Limited database user permissions
- [ ] Network access restricted to application servers
- [ ] Regular security updates applied
- [ ] Audit logging enabled
- [ ] Backup encryption enabled

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check network connectivity
   - Verify connection string format
   - Ensure SSL is properly configured

2. **Migration Failures**
   - Check for schema conflicts
   - Verify database permissions
   - Review migration logs

3. **Performance Issues**
   - Enable query logging
   - Analyze slow queries
   - Consider adding indexes

### Support Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Railway Documentation](https://docs.railway.app)
