---
title: Linux Installation
description: Install EmailEngine on Linux using binary, automated installer, or from source
sidebar_position: 2
---

# Installing EmailEngine on Linux

Complete guide for installing EmailEngine on Linux systems (Ubuntu, Debian, CentOS, RHEL).

## Overview

EmailEngine can be installed on Linux using three methods:

1. **Automated Installer** (Ubuntu/Debian) - One-click script for fresh servers
2. **Binary Installation** - Standalone executable (all distributions)
3. **Source Installation** - Run from source for production (requires Node.js 20+)

## Prerequisites

### System Requirements

**Minimum (development/testing):**
- 1-2 CPU cores
- 2 GB RAM
- 10 GB storage

**Recommended (production):**
- 4+ CPU cores
- 4-8 GB RAM or more
- 20+ GB SSD storage

### Required Software

- **Redis 6.0+** (stand-alone mode, persistence enabled)
- **Node.js 20+** (only for source installation)
- **OpenSSL** (for generating secrets)

## Method 1: Automated Installer (Ubuntu/Debian)

The easiest way to install EmailEngine on Ubuntu 20.04+ or Debian 11+.

### What It Installs

- EmailEngine binary
- Redis server (configured for production)
- Caddy reverse proxy with automatic HTTPS
- SystemD service
- Upgrade helper script at `/opt/upgrade-emailengine.sh`

### Features

- Supports both fresh installations and upgrades
- Automatically detects existing installations
- Preserves Redis configuration during upgrades
- Can install specific versions
- Generates secure credentials

### Installation Steps

#### 1. Download Installer

```bash
wget https://go.emailengine.app -O install.sh
# or
curl -L https://go.emailengine.app -o install.sh
```

#### 2. Run Installer

```bash
chmod +x install.sh
sudo su
./install.sh example.com
```

Replace `example.com` with your domain name, or leave empty to auto-generate one.

**Install specific version:**
```bash
./install.sh example.com 2.55.4
```

#### 3. Wait for Completion

The script will:
1. Install dependencies (Redis, Caddy, tools)
2. Download EmailEngine binary
3. Generate secure credentials
4. Configure Redis for production
5. Set up reverse proxy with TLS
6. Create SystemD service
7. Start EmailEngine

#### 4. Access EmailEngine

Once complete, open `https://example.com` to create your admin account.

**Credentials saved to:** `/root/emailengine-credentials.txt`

### Important Notes

- **Fresh servers only** for new installations (rewrites network settings)
- **Supports upgrades** on existing installations (preserves configuration)
- **VPS with 2+ GB RAM** recommended during installation
- **Public-facing server required** (for TLS certificate provisioning)

### Upgrading

For servers installed with the automated installer:

```bash
# Upgrade to latest
sudo /opt/upgrade-emailengine.sh

# Or re-run installer for specific version
sudo ./install.sh example.com 2.55.4
```

The upgrade process:
1. Detects existing installation
2. Shows current and target versions
3. Prompts for confirmation
4. Preserves all configuration and data
5. Downloads new binary
6. Restarts service

## Method 2: Binary Installation

Manual installation using the standalone binary.

### Step 1: Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return: PONG
```

**CentOS/RHEL:**
```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

### Step 2: Configure Redis

Edit `/etc/redis/redis.conf`:

```bash
sudo nano /etc/redis/redis.conf
```

Add or modify:
```
# Production settings
maxmemory-policy noeviction
maxmemory 2gb

# Persistence
save 900 1
save 300 10
save 60 10000
```

Restart Redis:
```bash
sudo systemctl restart redis
```

### Step 3: Download EmailEngine

```bash
# Download latest binary
wget https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz

# Extract
tar xzf emailengine.tar.gz
rm emailengine.tar.gz

# Install to system path
sudo mv emailengine /usr/local/bin/
sudo chmod +x /usr/local/bin/emailengine

# Verify
emailengine --version
```

### Step 4: Create Configuration

**Generate secrets:**
```bash
export EENGINE_SECRET=$(openssl rand -hex 32)
export EENGINE_ENCRYPTION_SECRET=$(openssl rand -hex 32)

echo "EENGINE_SECRET=$EENGINE_SECRET"
echo "EENGINE_ENCRYPTION_SECRET=$EENGINE_ENCRYPTION_SECRET"
```

**Save these values securely!**

### Step 5: Test Run

```bash
# Start EmailEngine
emailengine \
  --dbs.redis="redis://127.0.0.1:6379" \
  --secret="$EENGINE_SECRET" \
  --api.port=3000

# In another terminal, test
curl http://localhost:3000/health
# Should return: {"success":true}
```

### Step 6: Run as Service

See [SystemD Service Guide](/docs/deployment/systemd) for production setup.

**Quick SystemD setup:**

```bash
# Create service file
sudo nano /etc/systemd/system/emailengine.service
```

```ini
[Unit]
Description=EmailEngine
After=redis.service
Requires=redis.service

[Service]
Type=simple
User=emailengine
Group=emailengine
WorkingDirectory=/opt/emailengine

Environment="EENGINE_REDIS=redis://127.0.0.1:6379"
Environment="EENGINE_SECRET=your-secret-here"
Environment="EENGINE_ENCRYPTION_SECRET=your-encryption-secret"
Environment="EENGINE_WORKERS=4"

ExecStart=/usr/local/bin/emailengine
Restart=always
RestartSec=10

StandardOutput=journal
StandardError=journal
SyslogIdentifier=emailengine

LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

```bash
# Create user
sudo useradd --system --home /opt/emailengine --shell /bin/false emailengine

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable emailengine
sudo systemctl start emailengine
sudo systemctl status emailengine
```

### Upgrading Binary Installation

```bash
# Download latest
wget https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz

# Extract and replace
tar xzf emailengine.tar.gz
sudo systemctl stop emailengine
sudo mv emailengine /usr/local/bin/
sudo chmod +x /usr/local/bin/emailengine

# Restart
sudo systemctl start emailengine

# Verify
emailengine --version
```

## Method 3: Source Installation (Production)

Running from source is recommended for production as it requires less RAM.

### Step 1: Install Node.js 20+

**Ubuntu/Debian (using NodeSource):**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be 20.x
npm --version
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Step 2: Install Redis

Same as binary installation method (see above).

### Step 3: Download Source

**Option A: From releases (stable):**
```bash
# Create directory
sudo mkdir -p /opt/emailengine
cd /opt/emailengine

# Download source distribution
wget https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz
tar xzf source-dist.tar.gz
rm source-dist.tar.gz
```

**Option B: From Git (development):**
```bash
git clone https://github.com/postalsys/emailengine.git /opt/emailengine
cd /opt/emailengine
npm install --production
```

### Step 4: Configure Environment

Create `/opt/emailengine/.env`:

```bash
sudo nano /opt/emailengine/.env
```

```bash
EENGINE_REDIS=redis://127.0.0.1:6379
EENGINE_SECRET=your-secret-key-at-least-32-chars
EENGINE_ENCRYPTION_SECRET=your-encryption-secret-32-chars
EENGINE_WORKERS=4
EENGINE_LOG_LEVEL=info
EENGINE_PORT=3000
```

### Step 5: Test Run

```bash
cd /opt/emailengine
node server.js
```

In another terminal:
```bash
curl http://localhost:3000/health
```

### Step 6: Run as Service

Create `/etc/systemd/system/emailengine.service`:

```ini
[Unit]
Description=EmailEngine
After=redis.service
Requires=redis.service

[Service]
Type=simple
User=emailengine
Group=emailengine
WorkingDirectory=/opt/emailengine

EnvironmentFile=/opt/emailengine/.env

ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

StandardOutput=journal
StandardError=journal
SyslogIdentifier=emailengine

LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

```bash
# Create user
sudo useradd --system --home /opt/emailengine --shell /bin/false emailengine

# Set ownership
sudo chown -R emailengine:emailengine /opt/emailengine
sudo chmod 600 /opt/emailengine/.env

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable emailengine
sudo systemctl start emailengine
sudo systemctl status emailengine
```

### Upgrading Source Installation

```bash
cd /opt/emailengine

# Stop service
sudo systemctl stop emailengine

# Backup
sudo cp -r /opt/emailengine /opt/emailengine.backup

# Update (Git)
git pull
npm install --production

# Or download new release
# wget https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz
# tar xzf source-dist.tar.gz

# Start service
sudo systemctl start emailengine
```

## Post-Installation

### 1. Set Up Reverse Proxy

For production, use Nginx or Caddy as a reverse proxy.

**Quick Nginx setup:**
```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/emailengine
```

```nginx
server {
    listen 80;
    server_name emailengine.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/emailengine /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Enable HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d emailengine.example.com
```

### 3. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to EmailEngine
sudo ufw deny 3000/tcp

# Enable firewall
sudo ufw enable
```

### 4. Verify Installation

```bash
# Check service
sudo systemctl status emailengine

# Check logs
sudo journalctl -u emailengine -f

# Test health endpoint
curl http://localhost:3000/health

# Check Redis
redis-cli ping
```

## Troubleshooting

### Service Won't Start

```bash
# View logs
sudo journalctl -u emailengine -n 100 --no-pager

# Check Redis
sudo systemctl status redis
redis-cli ping

# Check permissions
ls -la /opt/emailengine
ls -la /usr/local/bin/emailengine
```

### Redis Connection Failed

```bash
# Verify Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping

# Check Redis config
sudo nano /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis
```

### Permission Denied

```bash
# For binary
sudo chmod +x /usr/local/bin/emailengine
sudo chown root:root /usr/local/bin/emailengine

# For source
sudo chown -R emailengine:emailengine /opt/emailengine
sudo chmod 600 /opt/emailengine/.env
```

### Port Already in Use

```bash
# Find process
sudo lsof -i :3000
sudo netstat -tlnp | grep :3000

# Kill process
sudo kill -9 <PID>

# Or change port
# Edit service file or .env to use different port
```

### High Memory Usage

```bash
# Check memory
sudo systemctl status emailengine | grep Memory

# Reduce workers
# Edit .env or service file:
EENGINE_WORKERS=2

# Restart
sudo systemctl restart emailengine
```

## Performance Tuning

### Optimize Redis

```bash
sudo nano /etc/redis/redis.conf
```

```
# Memory
maxmemory 4gb
maxmemory-policy noeviction

# Persistence
save 900 1
save 300 10
save 60 10000

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 300

# Limits
maxclients 10000
```

### Optimize EmailEngine

```bash
# Increase workers (1 per CPU core recommended)
EENGINE_WORKERS=8

# Increase file descriptor limit
# In service file:
LimitNOFILE=65536

# Enable metrics
EENGINE_METRICS_SERVER=true
EENGINE_METRICS_PORT=9090
```

### Monitor Performance

```bash
# System resources
sudo systemctl status emailengine | grep -E 'CPU|Memory'

# Redis stats
redis-cli INFO stats

# Prometheus metrics (if enabled)
curl http://localhost:9090/metrics
```

## Next Steps

1. [Create your first email account](/docs/accounts)
2. [Configure OAuth2 for Gmail/Outlook](/docs/accounts/oauth2-setup)
3. [Set up webhooks](/docs/receiving/webhooks)
4. [Review security best practices](/docs/deployment/security)
5. [Configure monitoring](/docs/deployment/monitoring)

## See Also

- [Docker Installation](/docs/installation/docker)
- [macOS Installation](/docs/installation/macos)
- [Windows Installation](/docs/installation/windows)
- [Source Installation](/docs/installation/source)
- [SystemD Service Guide](/docs/deployment/systemd)
- [Configuration Options](/docs/configuration)
