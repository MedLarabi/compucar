# 🚀 CompuCar VPS Deployment Guide - Hostinger

## Complete Step-by-Step Guide for Beginners

This guide will walk you through deploying your CompuCar e-commerce application on a Hostinger VPS from scratch.

---

## 📋 **Prerequisites**

Before starting, ensure you have:
- ✅ Hostinger VPS purchased and running
- ✅ Domain name (optional but recommended)
- ✅ SSH access to your VPS
- ✅ Basic terminal/command line knowledge

---

## 🎯 **Phase 1: Initial VPS Setup**

### **Step 1: Connect to Your VPS**

1. **Get VPS credentials from Hostinger:**
   - IP Address: `your-vps-ip`
   - Username: `root` (or provided username)
   - Password: (from Hostinger panel)

2. **Connect via SSH:**
   ```bash
   # Windows (use PowerShell or install PuTTY)
   ssh root@your-vps-ip
   
   # Enter password when prompted
   ```

### **Step 2: Update System**
```bash
# Update package lists
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip software-properties-common
```

### **Step 3: Install Node.js 20**
```bash
# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### **Step 4: Install PM2 (Process Manager)**
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

## 🗄️ **Phase 2: Database Setup**

### **Step 5: Install PostgreSQL**
```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Check status
systemctl status postgresql
```

### **Step 6: Configure PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL shell, run these commands:
CREATE DATABASE compucar;
CREATE USER compucar_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE compucar TO compucar_user;
ALTER USER compucar_user CREATEDB;
\q

# Exit PostgreSQL shell
```

### **Step 7: Configure PostgreSQL for Remote Access**
```bash
# Edit PostgreSQL configuration
nano /etc/postgresql/*/main/postgresql.conf

# Find and modify this line:
listen_addresses = 'localhost'

# Edit pg_hba.conf for authentication
nano /etc/postgresql/*/main/pg_hba.conf

# Add this line at the end:
local   all             compucar_user                           md5

# Restart PostgreSQL
systemctl restart postgresql
```

---

## 🌐 **Phase 3: Web Server Setup**

### **Step 8: Install and Configure Nginx**
```bash
# Install Nginx
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

### **Step 9: Configure Firewall**
```bash
# Install UFW (if not already installed)
apt install -y ufw

# Configure firewall rules
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443
ufw allow 3000

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 🔐 **Phase 4: SSL Certificate Setup**

### **Step 10: Install Certbot for SSL**
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# If you have a domain, get SSL certificate:
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts to complete SSL setup
```

---

## 📁 **Phase 5: Application Deployment**

### **Step 11: Clone Your Repository**
```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your GitHub repo URL)
git clone https://github.com/yourusername/compucar.git
cd compucar

# Set proper permissions
chown -R www-data:www-data /var/www/compucar
chmod -R 755 /var/www/compucar
```

### **Step 12: Install Dependencies**
```bash
# Install project dependencies
npm install

# Install global dependencies
npm install -g prisma
```

### **Step 13: Environment Configuration**
```bash
# Create production environment file
cp env.example .env.local

# Edit environment variables
nano .env.local
```

**Configure these essential variables in `.env.local`:**
```bash
# Database
DATABASE_URL="postgresql://compucar_user:your_strong_password_here@localhost:5432/compucar"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"  # or http://your-vps-ip:3000
NEXTAUTH_SECRET="generate-32-character-random-string-here"

# Stripe (get from your Stripe dashboard)
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# UploadThing (for file uploads)
UPLOADTHING_SECRET="sk_live_your_uploadthing_secret"
UPLOADTHING_APP_ID="your_uploadthing_app_id"

# Email Configuration (example with Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="CompuCar"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="CompuCar"

# Admin Email
ADMIN_EMAIL="admin@yourdomain.com"
```

### **Step 14: Database Migration**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database with initial data
npm run seed
```

### **Step 15: Build Application**
```bash
# Build the Next.js application
npm run build

# Test the build
npm start
```

---

## 🚀 **Phase 6: Production Deployment**

### **Step 16: Configure PM2**
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this configuration:**
```javascript
module.exports = {
  apps: [
    {
      name: 'compucar',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/compucar',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: '/var/log/compucar/error.log',
      out_file: '/var/log/compucar/out.log',
      log_file: '/var/log/compucar/combined.log',
      time: true
    }
  ]
};
```

### **Step 17: Create Log Directory**
```bash
# Create log directory
mkdir -p /var/log/compucar
chown -R www-data:www-data /var/log/compucar
```

### **Step 18: Start Application with PM2**
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
pm2 save

# Check application status
pm2 status
pm2 logs compucar
```

---

## 🌐 **Phase 7: Nginx Configuration**

### **Step 19: Configure Nginx Reverse Proxy**
```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/compucar
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain or VPS IP
    
    # Redirect HTTP to HTTPS (if using SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain

    # SSL Configuration (if using SSL)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Main location
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Images and uploads
    location /uploads {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Step 20: Enable Nginx Configuration**
```bash
# Create symbolic link to enable site
ln -s /etc/nginx/sites-available/compucar /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔍 **Phase 8: Testing and Verification**

### **Step 21: Test Your Deployment**

1. **Check application status:**
   ```bash
   pm2 status
   pm2 logs compucar
   ```

2. **Test database connection:**
   ```bash
   cd /var/www/compucar
   npx prisma db push
   ```

3. **Access your application:**
   - Open browser and go to: `https://yourdomain.com` or `http://your-vps-ip`
   - Test user registration
   - Test product browsing
   - Test admin panel access

### **Step 22: Create Admin User**
```bash
# Connect to database
sudo -u postgres psql -d compucar

# Create admin user (replace with your details)
INSERT INTO "User" (id, email, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt") 
VALUES (
  'admin_' || generate_random_uuid(),
  'admin@yourdomain.com',
  'Admin',
  'User',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);

# Exit database
\q
```

---

## 📊 **Phase 9: Monitoring and Maintenance**

### **Step 23: Set Up Monitoring**
```bash
# Install htop for system monitoring
apt install -y htop

# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Check application logs
pm2 logs compucar --lines 100
```

### **Step 24: Set Up Automated Backups**
```bash
# Create backup script
nano /root/backup-compucar.sh
```

**Add this backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump compucar > $BACKUP_DIR/compucar_db_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/compucar_files_$DATE.tar.gz -C /var/www compucar

# Keep only last 7 days of backups
find $BACKUP_DIR -name "compucar_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
chmod +x /root/backup-compucar.sh

# Add to crontab for daily backups
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /root/backup-compucar.sh >> /var/log/backup.log 2>&1
```

### **Step 25: Set Up Log Rotation**
```bash
# Create logrotate configuration
nano /etc/logrotate.d/compucar
```

**Add this configuration:**
```
/var/log/compucar/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🚨 **Troubleshooting Guide**

### **Common Issues and Solutions:**

1. **Application won't start:**
   ```bash
   # Check PM2 logs
   pm2 logs compucar
   
   # Restart application
   pm2 restart compucar
   ```

2. **Database connection issues:**
   ```bash
   # Check PostgreSQL status
   systemctl status postgresql
   
   # Test database connection
   sudo -u postgres psql -d compucar -c "SELECT 1;"
   ```

3. **Nginx issues:**
   ```bash
   # Check Nginx status
   systemctl status nginx
   
   # Test configuration
   nginx -t
   
   # Check error logs
   tail -f /var/log/nginx/error.log
   ```

4. **SSL certificate issues:**
   ```bash
   # Renew SSL certificate
   certbot renew --dry-run
   
   # Check certificate status
   certbot certificates
   ```

5. **Memory issues:**
   ```bash
   # Check memory usage
   free -h
   
   # Restart application if needed
   pm2 restart compucar
   ```

---

## 🔄 **Updating Your Application**

### **Step 26: Deployment Updates**
```bash
# Navigate to application directory
cd /var/www/compucar

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run database migrations
npx prisma db push

# Rebuild application
npm run build

# Restart application
pm2 restart compucar

# Check status
pm2 status
```

---

## 📞 **Support and Resources**

### **Useful Commands:**
```bash
# System monitoring
htop                    # System resources
df -h                   # Disk space
free -h                 # Memory usage
systemctl status nginx  # Nginx status
systemctl status postgresql  # Database status

# Application monitoring
pm2 status              # Application status
pm2 logs compucar       # Application logs
pm2 monit              # Real-time monitoring

# Database management
sudo -u postgres psql -d compucar  # Connect to database
npx prisma studio       # Database GUI (access via tunnel)
```

### **Important File Locations:**
- Application: `/var/www/compucar`
- Nginx config: `/etc/nginx/sites-available/compucar`
- Application logs: `/var/log/compucar/`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`
- SSL certificates: `/etc/letsencrypt/live/yourdomain.com/`

### **Security Best Practices:**
1. Keep system updated: `apt update && apt upgrade`
2. Use strong passwords
3. Enable firewall with minimal required ports
4. Regular backups
5. Monitor logs for suspicious activity
6. Keep SSL certificates updated

---

## ✅ **Deployment Checklist**

- [ ] VPS connected and updated
- [ ] Node.js 20 installed
- [ ] PostgreSQL installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (if using domain)
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] Application built successfully
- [ ] PM2 configured and application started
- [ ] Nginx reverse proxy configured
- [ ] Application accessible via browser
- [ ] Admin user created
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Log rotation configured

---

## 🎉 **Congratulations!**

Your CompuCar e-commerce application is now live on your Hostinger VPS! 

**Next Steps:**
1. Test all functionality thoroughly
2. Set up domain and SSL if not done already
3. Configure email notifications
4. Set up payment processing
5. Monitor performance and optimize as needed

**Need Help?** 
- Check the troubleshooting section above
- Review application logs: `pm2 logs compucar`
- Monitor system resources: `htop`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`

Happy selling! 🚀🛒
