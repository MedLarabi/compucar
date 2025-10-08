# Fix nginx 413 Request Entity Too Large Error

Your video uploads are failing because nginx has a default upload limit that's too small. Here's how to fix it:

## 1. Check Current nginx Configuration

```bash
# Find your nginx configuration files
sudo nginx -T | grep -i client_max_body_size

# Check your site configuration
sudo ls /etc/nginx/sites-available/
sudo ls /etc/nginx/sites-enabled/
```

## 2. Update nginx Configuration

### Option A: Global Configuration (affects all sites)

Edit the main nginx config:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add this inside the `http` block:
```nginx
http {
    # ... existing configuration ...
    
    # Increase upload limits
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_body_buffer_size 16K;
    
    # ... rest of configuration ...
}
```

### Option B: Site-Specific Configuration (recommended)

Edit your site's configuration:
```bash
# Replace 'your-site' with your actual site config name
sudo nano /etc/nginx/sites-available/your-site
```

Add these lines inside your `server` block:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Increase upload limits for this site
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_body_buffer_size 16K;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase proxy timeouts for large uploads
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_request_buffering off;
    }
}
```

## 3. Test and Reload nginx

```bash
# Test the configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

## 4. Alternative: PM2/Direct Node.js

If you're running Node.js directly or with PM2 (not behind nginx), you might also need to check:

```bash
# Check if you have any reverse proxy limits
# Look for any other web servers or load balancers
ps aux | grep nginx
ps aux | grep apache
ps aux | grep node
```

## 5. Verify the Fix

After updating nginx:
1. Try uploading your 10MB video again
2. Check the browser console for any remaining errors
3. The upload should now succeed

## Common Upload Limits to Set:

- **Small sites**: `client_max_body_size 10M;`
- **Medium sites**: `client_max_body_size 50M;`
- **Large sites**: `client_max_body_size 100M;`

For your use case with video uploads, 50M should be sufficient.

## Troubleshooting:

If you still get 413 errors after updating nginx:
1. Check if there are multiple nginx configs overriding your settings
2. Verify you reloaded nginx: `sudo systemctl reload nginx`
3. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
4. Try a smaller test video first

## Your Current Situation:

- Video file: `MMV00991431.mov` (10.1MB)
- Current limit: Less than 10MB (causing 413 error)
- Recommended setting: `client_max_body_size 50M;`
