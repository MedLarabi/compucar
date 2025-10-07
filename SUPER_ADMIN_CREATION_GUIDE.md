# 🔐 Super Admin User Creation Guide

This guide provides multiple methods to create a super admin user for your CompuCar application.

## 🎯 Quick Start (Recommended)

**The easiest method is to use the existing script:**

```bash
npx tsx scripts/create-admin-user.ts
```

This creates a super admin with:
- **Email:** `admin@compucar.com`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`
- **isAdmin:** `true`

## 📋 All Available Methods

### Method 1: Existing Script (Fastest)
```bash
npx tsx scripts/create-admin-user.ts
```
- ✅ Creates/updates admin@compucar.com
- ✅ Sets password to admin123
- ✅ Handles existing users

### Method 2: Interactive Custom Script
```bash
npx tsx scripts/create-super-admin.ts
```
- ✅ Custom email and password
- ✅ Custom name
- ✅ Interactive prompts
- ✅ Handles existing users

### Method 3: PowerShell Script (Windows)
```powershell
.\create-super-admin.ps1
```
- ✅ Windows-friendly
- ✅ Menu-driven interface
- ✅ Multiple options

### Method 4: Direct SQL (Database Access)
Use the SQL script: `create-super-admin.sql`

```sql
-- Quick update existing user
UPDATE users 
SET role = 'SUPER_ADMIN', "isAdmin" = true 
WHERE email = 'your-email@example.com';
```

### Method 5: Database Seeding
```bash
npx prisma db seed
```
- ✅ Creates admin@compucar.com
- ✅ Also creates sample data

## 🔑 Default Credentials Created

When using the quick scripts, you get:

| Field | Value |
|-------|-------|
| Email | admin@compucar.com |
| Password | admin123 |
| Role | SUPER_ADMIN |
| isAdmin | true |
| Status | Active |

## 🌐 Login URLs

After creating the admin user:

- **Local Development:** http://localhost:3000/auth/login
- **Production:** https://compucar.pro/auth/login
- **Admin Panel:** `/admin` (after login)

## 🔒 User Roles Available

Your system supports these roles:

- `CUSTOMER` - Regular users
- `ADMIN` - Admin users  
- `SUPER_ADMIN` - Super admin users

## 📊 Verification Commands

Check if your admin user was created:

```bash
# Using TypeScript
npx tsx scripts/check-admin-users.ts

# Using SQL
psql -d your_database -c "SELECT id, email, role, \"isAdmin\" FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN');"
```

## 🛠️ Troubleshooting

### Issue: "User already exists"
- The scripts handle this automatically
- Existing users are updated to admin role

### Issue: "Database connection failed"
- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database credentials

### Issue: "Permission denied"
- Ensure you have database write permissions
- Check if the database and tables exist

### Issue: "Script not found"
```bash
# Make sure you're in the project root
cd /path/to/your/project

# Check if scripts exist
ls scripts/create-admin-user.ts
```

## 🔐 Security Best Practices

1. **Change default password** after first login
2. **Use strong passwords** in production
3. **Limit admin access** to necessary personnel
4. **Enable 2FA** if available
5. **Regular password updates**

## 📝 Custom Admin Creation

If you need to create multiple admins or with specific details:

```typescript
// Example custom admin creation
const adminData = {
  email: 'your-admin@company.com',
  password: 'your-secure-password',
  firstName: 'Admin',
  lastName: 'User',
  role: 'SUPER_ADMIN',
  isAdmin: true
};
```

## 🚨 Emergency Access

If you're locked out and need emergency admin access:

1. **Use SQL method** directly on the database
2. **Update existing user** to admin role
3. **Create new admin** via database

```sql
-- Emergency admin creation
UPDATE users SET role = 'SUPER_ADMIN', "isAdmin" = true WHERE email = 'your-email@example.com';
```

## ✅ Success Verification

After creating admin user, verify:

- [ ] Can login with credentials
- [ ] Has access to `/admin` panel
- [ ] Can see admin-only features
- [ ] Role shows as SUPER_ADMIN
- [ ] isAdmin flag is true

## 📞 Need Help?

If you encounter issues:

1. Check the database connection
2. Verify environment variables
3. Run the diagnostic scripts
4. Check application logs
5. Ensure database tables exist

---

**🎉 You're all set!** Your super admin user should now be ready to use.
