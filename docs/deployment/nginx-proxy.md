---
title: Nginx Reverse Proxy
sidebar_position: 5
---

# Nginx Reverse Proxy Setup

Configure Nginx as a reverse proxy in front of EmailEngine to enable HTTPS, load balancing, and security features.

:::info Why Use a Reverse Proxy
- **SSL/TLS termination** - Secure HTTPS connections
- **Load balancing** - Distribute traffic across multiple instances
- **Security** - Additional protection layer
- **Rate limiting** - Prevent abuse
- **Caching** - Improve performance
- **WebSocket support** - Proxy WebSocket connections
:::

**Source:** This guide is based on the [original documentation](https://emailengine.app/expose-public-https).

## Prerequisites

- EmailEngine installed and running
- Domain name pointing to your server
- Root/sudo access to server
- Port 80 and 443 available

## Quick Start

### 1. Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

**CentOS/RHEL:**
```bash
sudo yum install nginx -y
```

**Verify installation:**
```bash
nginx -v
sudo systemctl status nginx
```

### 2. Create Dummy SSL Certificates

Create temporary certificates for initial setup:

```bash
sudo openssl req -subj "/CN=emailengine.example.com/O=My Company/C=US" \
  -new -newkey rsa:2048 -days 365 -nodes -x509 \
  -keyout privkey.pem -out fullchain.pem

# Set permissions
sudo chmod 0600 privkey.pem

# Move to SSL directory
sudo mv privkey.pem /etc/ssl/private/emailengine-privkey.pem
sudo mv fullchain.pem /etc/ssl/certs/emailengine-fullchain.pem
```

:::tip Why Dummy Certificates?
We create dummy certificates first so Nginx can start with SSL enabled. We'll replace them with real Let's Encrypt certificates in Step 4.
:::

### 3. Configure Nginx Virtual Host

Create virtual host configuration:

```bash
sudo nano /etc/nginx/sites-available/emailengine.conf
```

**Basic configuration:**

```nginx
server {
    listen 80;
    listen 443 ssl http2;

    server_name emailengine.example.com;  # Change this

    ssl_certificate_key /etc/ssl/private/emailengine-privkey.pem;
    ssl_certificate /etc/ssl/certs/emailengine-fullchain.pem;

    location / {
        client_max_body_size 50M;
        proxy_http_version 1.1;
        proxy_redirect off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://127.0.0.1:3000;  # EmailEngine port
    }

    # Enforce HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}
```

**Enable configuration:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/emailengine.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Should output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx
```

:::warning Test Before Reload
Always run `nginx -t` before reloading. A configuration error will stop Nginx completely!
:::

### 4. Provision SSL Certificates with Let's Encrypt

Install and configure acme.sh for automatic certificate management:

**Install acme.sh:**

```bash
sudo su
cd ~
curl https://get.acme.sh | sh -s email=your@email.com
```

**Issue certificates:**

```bash
/root/.acme.sh/acme.sh --issue --nginx --server letsencrypt \
    -d emailengine.example.com \
    --key-file       /etc/ssl/private/emailengine-privkey.pem  \
    --ca-file        /etc/ssl/certs/emailengine-chain.pem \
    --fullchain-file /etc/ssl/certs/emailengine-fullchain.pem \
    --reloadcmd     "/bin/systemctl reload nginx"
```

:::success Automatic Renewal
Acme.sh automatically renews certificates before expiry. No manual intervention needed!
:::

**Verify SSL:**

```bash
# Check certificate
openssl s_client -connect emailengine.example.com:443 -servername emailengine.example.com

# Or use online tools
# https://www.ssllabs.com/ssltest/
```

## Production Configuration

### Complete Nginx Configuration

Create `/etc/nginx/sites-available/emailengine.conf`:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=emailengine_limit:10m rate=10r/s;

# Upstream definition (for load balancing)
upstream emailengine_backend {
    least_conn;  # Load balancing method
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    # Add more servers for horizontal scaling:
    # server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    # server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name emailengine.example.com;

    # ACME challenge for Let's Encrypt
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name emailengine.example.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/emailengine-fullchain.pem;
    ssl_certificate_key /etc/ssl/private/emailengine-privkey.pem;
    ssl_trusted_certificate /etc/ssl/certs/emailengine-chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/emailengine-access.log combined;
    error_log /var/log/nginx/emailengine-error.log warn;

    # Main location block
    location / {
        # Rate limiting
        limit_req zone=emailengine_limit burst=20 nodelay;

        # Proxy settings
        proxy_pass http://emailengine_backend;
        proxy_http_version 1.1;
        proxy_redirect off;

        # Client body size (for attachments)
        client_max_body_size 50M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket support (for real-time updates)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://emailengine_backend;
        access_log off;
    }

    # Metrics endpoint (restrict access)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;   # Your internal network
        deny all;

        proxy_pass http://emailengine_backend;
        access_log off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://emailengine_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## Advanced Features

### Load Balancing

**Multiple EmailEngine instances:**

```nginx
upstream emailengine_backend {
    least_conn;  # or: ip_hash, round_robin

    server 127.0.0.1:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=2 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s backup;
}
```

**Load balancing methods:**
- `round_robin` (default) - Distribute evenly
- `least_conn` - Send to least busy server
- `ip_hash` - Sticky sessions based on client IP
- `hash $request_uri` - Route based on URL

### Rate Limiting

**Configure rate limits:**

```nginx
# Define zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

server {
    # API endpoints
    location /v1/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://emailengine_backend;
    }

    # Login endpoint (stricter)
    location /login {
        limit_req zone=login_limit burst=5 nodelay;
        proxy_pass http://emailengine_backend;
    }
}
```

**Rate limit by API key:**

```nginx
# Use API key from header for rate limiting
map $http_authorization $api_key {
    "~^Bearer (.+)$" $1;
    default "";
}

limit_req_zone $api_key zone=api_key_limit:10m rate=100r/s;

location /v1/ {
    limit_req zone=api_key_limit burst=200 nodelay;
    proxy_pass http://emailengine_backend;
}
```

### IP Whitelisting

**Restrict access by IP:**

```nginx
# Admin interface
location /admin {
    allow 203.0.113.0/24;  # Office network
    allow 198.51.100.42;   # VPN server
    deny all;

    proxy_pass http://emailengine_backend;
}

# API access
location /v1/ {
    # Whitelist
    allow 203.0.113.0/24;
    allow 198.51.100.0/24;
    deny all;

    proxy_pass http://emailengine_backend;
}
```

**Using geo-blocking:**

```nginx
# Block countries
geo $blocked_country {
    default 0;
    CN 1;  # China
    RU 1;  # Russia
}

server {
    if ($blocked_country) {
        return 403;
    }
}
```

### Caching

**Cache API responses:**

```nginx
# Define cache path
proxy_cache_path /var/cache/nginx/emailengine
    levels=1:2
    keys_zone=emailengine_cache:10m
    max_size=1g
    inactive=60m
    use_temp_path=off;

server {
    # Cache GET requests
    location /v1/accounts {
        proxy_cache emailengine_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 1m;
        proxy_cache_bypass $http_cache_control;
        add_header X-Cache-Status $upstream_cache_status;

        proxy_pass http://emailengine_backend;
    }
}
```

### WebSocket Support

**Full WebSocket configuration:**

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    location /ws {
        proxy_pass http://emailengine_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;

        proxy_read_timeout 86400;  # 24 hours
    }
}
```

### Custom Error Pages

**Branded error pages:**

```nginx
server {
    # Error pages
    error_page 500 502 503 504 /50x.html;
    error_page 404 /404.html;

    location = /50x.html {
        root /var/www/emailengine/errors;
        internal;
    }

    location = /404.html {
        root /var/www/emailengine/errors;
        internal;
    }
}
```

**Create custom error page `/var/www/emailengine/errors/50x.html`:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>EmailEngine - Service Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { font-size: 50px; }
    </style>
</head>
<body>
    <h1>503</h1>
    <p>EmailEngine is temporarily unavailable.</p>
    <p>Please try again in a few moments.</p>
</body>
</html>
```

## Security Hardening

### Basic Authentication

**Add basic auth to admin panel:**

```bash
# Create password file
sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

```nginx
location /admin {
    auth_basic "EmailEngine Admin";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://emailengine_backend;
}
```

### ModSecurity WAF

**Install ModSecurity:**

```bash
sudo apt-get install libnginx-mod-security
```

**Enable in Nginx:**

```nginx
server {
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;
}
```

### Fail2Ban Integration

**Create Nginx filter `/etc/fail2ban/filter.d/nginx-emailengine.conf`:**

```ini
[Definition]
failregex = ^<HOST> -.*"(GET|POST|HEAD).*HTTP.*" (401|403|404)
ignoreregex =
```

**Configure jail `/etc/fail2ban/jail.local`:**

```ini
[nginx-emailengine]
enabled = true
port = http,https
filter = nginx-emailengine
logpath = /var/log/nginx/emailengine-access.log
maxretry = 5
bantime = 3600
```

## Monitoring and Logging

### Log Rotation

**Configure logrotate `/etc/logrotate.d/nginx-emailengine`:**

```
/var/log/nginx/emailengine-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### Access Log Analysis

**Useful commands:**

```bash
# Top IPs
awk '{print $1}' /var/log/nginx/emailengine-access.log | sort | uniq -c | sort -rn | head -10

# Status codes
awk '{print $9}' /var/log/nginx/emailengine-access.log | sort | uniq -c | sort -rn

# Top endpoints
awk '{print $7}' /var/log/nginx/emailengine-access.log | sort | uniq -c | sort -rn | head -10

# Response times
awk '{print $NF}' /var/log/nginx/emailengine-access.log | sort -n | tail -20
```

### Metrics Export

**Export metrics to Prometheus:**

```nginx
# Install nginx-prometheus-exporter
# https://github.com/nginxinc/nginx-prometheus-exporter

location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

## Performance Optimization

### Connection Optimization

```nginx
# nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Keep-alive
    keepalive_timeout 65;
    keepalive_requests 100;

    # Buffers
    client_body_buffer_size 128k;
    client_max_body_size 50m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;

    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
}
```

### Compression

```nginx
http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/rss+xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;
    gzip_disable "msie6";

    # Brotli compression (if available)
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**

```bash
# Check if EmailEngine is running
curl http://localhost:3000/health

# Check Nginx error log
sudo tail -f /var/log/nginx/emailengine-error.log

# Common causes:
# - EmailEngine not running
# - Wrong port in proxy_pass
# - Firewall blocking connection
```

**2. SSL Certificate Errors**

```bash
# Test certificate
openssl s_client -connect emailengine.example.com:443

# Check certificate files
ls -la /etc/ssl/certs/emailengine-fullchain.pem
ls -la /etc/ssl/private/emailengine-privkey.pem

# Renew certificate
/root/.acme.sh/acme.sh --renew -d emailengine.example.com --force
```

**3. High Memory Usage**

```bash
# Check Nginx worker processes
ps aux | grep nginx

# Reduce worker processes
# In nginx.conf:
worker_processes 2;  # Instead of auto

# Reduce cache size
proxy_cache_path ... max_size=100m;
```

**4. Slow Response Times**

```bash
# Check upstream response time
tail -f /var/log/nginx/emailengine-access.log | awk '{print $NF}'

# Increase timeouts
proxy_read_timeout 120s;
proxy_connect_timeout 120s;

# Check EmailEngine performance
curl http://localhost:3000/v1/accounts -H "Authorization: Bearer TOKEN"
```

### Debug Mode

**Enable debug logging:**

```nginx
error_log /var/log/nginx/emailengine-debug.log debug;
```

**Check configuration:**

```bash
# Test configuration
sudo nginx -t

# Check configuration dump
sudo nginx -T

# Reload safely
sudo nginx -t && sudo systemctl reload nginx
```

## Example Configurations

### Single Instance

```nginx
upstream emailengine {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl http2;
    server_name emailengine.example.com;

    ssl_certificate /etc/ssl/certs/emailengine-fullchain.pem;
    ssl_certificate_key /etc/ssl/private/emailengine-privkey.pem;

    location / {
        proxy_pass http://emailengine;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### High Availability

```nginx
upstream emailengine {
    least_conn;
    server emailengine1.internal:3000 max_fails=3 fail_timeout=30s;
    server emailengine2.internal:3000 max_fails=3 fail_timeout=30s;
    server emailengine3.internal:3000 max_fails=3 fail_timeout=30s;
    server emailengine4.internal:3000 backup;
}

server {
    listen 443 ssl http2;
    server_name emailengine.example.com;

    location / {
        proxy_pass http://emailengine;
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
    }
}
```

## See Also

- [Installation Guide](/docs/installation/set-up)
- [Docker Deployment](/docs/deployment/docker)
- [SystemD Service](/docs/deployment/systemd)
- [Security Guide](/docs/deployment/security)
- [Monitoring Setup](/docs/advanced/monitoring)
- [Performance Tuning](/docs/advanced/performance-tuning)

## References

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx Proxy Module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Complete Nginx Config Example](https://raw.githubusercontent.com/postalsys/emailengine/master/systemd/nginx-proxy.conf)
- [Let's Encrypt](https://letsencrypt.org/)
- [Acme.sh](https://acme.sh/)
