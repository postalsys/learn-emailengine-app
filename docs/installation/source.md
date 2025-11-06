---
title: Source Installation
description: Run EmailEngine from source for production deployments
sidebar_position: 6
---

# Installing EmailEngine from Source

Complete guide for running EmailEngine from source code - the recommended method for production deployments.

## Why Install from Source?

Running EmailEngine from source provides several advantages over binary distributions:

### Production Benefits

**Lower Memory Usage:**
- **Binary**: ~200-400 MB base memory consumption
- **Source**: ~100-200 MB base memory consumption
- **Savings**: Up to 50% less RAM usage

**Better Performance:**
- Native Node.js execution without packaging overhead
- Faster startup times
- More efficient resource utilization

**Enhanced Control:**
- Full access to source code for debugging
- Ability to apply custom patches if needed
- Direct configuration without binary limitations
- Easier integration with monitoring tools

**Production Recommendation:**
For production environments, especially those managing many email accounts or running on resource-constrained servers, source installation is the recommended approach.

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

- **Node.js 20+** (LTS version recommended)
- **Redis 6.0+** (stand-alone mode, persistence enabled)
- **Git** (for cloning repository) or **wget/curl** (for release tarballs)
- **Build tools** (for native dependencies)

## Installation Methods

Choose between stable releases or development versions:

1. **Release Tarball** (recommended for production) - Stable, tested releases
2. **Git Repository** (for development) - Latest features, may be unstable

## Method 1: Release Tarball (Recommended)

### Linux Installation

#### Step 1: Install Node.js 20+

**Ubuntu/Debian (using NodeSource):**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be 20.x or higher
npm --version
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**Alternative: Using NVM (Node Version Manager):**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart shell or source profile
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

#### Step 2: Install Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return: PONG
```

Configure Redis for production (`/etc/redis/redis.conf`):
```conf
# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes

# Memory
maxmemory-policy noeviction
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

#### Step 3: Download and Install EmailEngine

```bash
# Create installation directory
sudo mkdir -p /opt/emailengine
cd /opt/emailengine

# Download latest source distribution
sudo wget https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz

# Extract
sudo tar xzf source-dist.tar.gz --strip-components=1
sudo rm source-dist.tar.gz

# Install dependencies (production only)
sudo npm install --production --ignore-scripts

# Or for specific version
# sudo wget https://github.com/postalsys/emailengine/releases/download/v2.55.4/source-dist.tar.gz
```

:::tip
The `--production` flag installs only runtime dependencies, not development tools, reducing installation size and time.
:::

#### Step 4: Configure Environment

Create `.env` file:
```bash
sudo nano /opt/emailengine/.env
```

Add configuration:
```bash
# Redis connection
EENGINE_REDIS=redis://127.0.0.1:6379

# Security secrets (generate secure values!)
EENGINE_SECRET=your-secret-key-at-least-32-characters
EENGINE_SECRET=your-encryption-secret-32-chars

# Performance
EENGINE_WORKERS=4

# Logging
EENGINE_LOG_LEVEL=info
EENGINE_LOG_RAW=false

# API settings
EENGINE_PORT=3000
EENGINE_HOST=0.0.0.0
```

**Generate secure secrets:**
```bash
# Generate random secrets
openssl rand -hex 32  # Use for EENGINE_SECRET
openssl rand -hex 32  # Use for EENGINE_SECRET
```

#### Step 5: Test Installation

```bash
cd /opt/emailengine
node server.js
```

In another terminal:
```bash
curl http://localhost:3000/health
# Should return: {"success":true}
```

Press `Ctrl+C` to stop.

#### Step 6: Create System User

```bash
# Create dedicated user
sudo useradd --system --home /opt/emailengine --shell /bin/false emailengine

# Set ownership
sudo chown -R emailengine:emailengine /opt/emailengine
sudo chmod 600 /opt/emailengine/.env
```

#### Step 7: Set Up SystemD Service

Create service file:
```bash
sudo nano /etc/systemd/system/emailengine.service
```

Add configuration:
```ini
[Unit]
Description=EmailEngine Email API Service
Documentation=https://emailengine.app
After=network.target redis.service
Requires=redis.service

[Service]
Type=simple
User=emailengine
Group=emailengine
WorkingDirectory=/opt/emailengine

# Load environment variables
EnvironmentFile=/opt/emailengine/.env

# Start command
ExecStart=/usr/bin/node server.js

# Restart policy
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=emailengine

# Resource limits
LimitNOFILE=65536

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/emailengine

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable emailengine
sudo systemctl start emailengine
sudo systemctl status emailengine
```

View logs:
```bash
sudo journalctl -u emailengine -f
```

### macOS Installation

#### Step 1: Install Node.js 20+

**Using Homebrew:**
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 20
brew install node@20

# Add to PATH
echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
node --version
```

**Using NVM (alternative):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20
```

#### Step 2: Install Redis

```bash
brew install redis
brew services start redis

# Verify
redis-cli ping
```

#### Step 3: Download and Install EmailEngine

```bash
# Create directory
sudo mkdir -p /opt/emailengine
cd /opt/emailengine

# Download source
sudo curl -L https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz | sudo tar xz --strip-components=1

# Install dependencies
sudo npm install --production --ignore-scripts
```

#### Step 4: Configure Environment

Create `/opt/emailengine/.env` with the same configuration as Linux.

#### Step 5: Run as Launch Agent

Create `~/Library/LaunchAgents/com.emailengine.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.emailengine</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/opt/emailengine/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/opt/emailengine</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/usr/local/var/log/emailengine.log</string>
    <key>StandardErrorPath</key>
    <string>/usr/local/var/log/emailengine.error.log</string>
</dict>
</plist>
```

Load and start:
```bash
launchctl load ~/Library/LaunchAgents/com.emailengine.plist
```

### Windows Installation

For Windows, use **WSL2** (Windows Subsystem for Linux) and follow the Linux installation steps above.

See [Windows Installation Guide](/docs/installation/windows) for WSL2 setup.

## Method 2: Git Repository

For development or tracking the latest features:

### Clone Repository

```bash
# Clone repository
sudo git clone https://github.com/postalsys/emailengine.git /opt/emailengine
cd /opt/emailengine

# Install all dependencies (including dev dependencies)
sudo npm install

# For production use
sudo npm install --production
```

### Update from Git

```bash
cd /opt/emailengine

# Stop service
sudo systemctl stop emailengine

# Pull latest changes
sudo git pull

# Install/update dependencies
sudo npm install --production

# Start service
sudo systemctl start emailengine
```

## Alternative Process Managers

### PM2 (Production Process Manager)

PM2 is an excellent alternative to SystemD for process management.

#### Install PM2

```bash
sudo npm install -g pm2
```

#### Create PM2 Ecosystem File

Create `/opt/emailengine/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'emailengine',
    script: './server.js',
    cwd: '/opt/emailengine',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'production',
      EENGINE_REDIS: 'redis://127.0.0.1:6379',
      EENGINE_SECRET: 'your-secret-here',
      EENGINE_SECRET: 'your-encryption-secret',
      EENGINE_WORKERS: '4',
      EENGINE_PORT: '3000'
    },
    error_file: '/var/log/emailengine/error.log',
    out_file: '/var/log/emailengine/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### Start with PM2

```bash
# Start EmailEngine
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# View logs
pm2 logs emailengine

# Monitor
pm2 monit

# Restart
pm2 restart emailengine

# Stop
pm2 stop emailengine
```

### Docker Compose with Source

Run from source in Docker:

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy source
COPY . .

# Install dependencies
RUN npm install --production --ignore-scripts

# Expose ports
EXPOSE 3000

# Start EmailEngine
CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  emailengine:
    build: .
    ports:
      - "3000:3000"
    environment:
      - EENGINE_REDIS=redis://redis:6379
      - EENGINE_SECRET=${EENGINE_SECRET}
    depends_on:
      - redis

volumes:
  redis-data:
```

## Upgrading

### From Release Tarball

```bash
cd /opt/emailengine

# Stop service
sudo systemctl stop emailengine

# Backup current installation
sudo cp -r /opt/emailengine /opt/emailengine.backup.$(date +%Y%m%d)

# Download new version
sudo wget https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz

# Extract (overwrites files)
sudo tar xzf source-dist.tar.gz --strip-components=1
sudo rm source-dist.tar.gz

# Update dependencies
sudo npm install --production --ignore-scripts

# Restore ownership
sudo chown -R emailengine:emailengine /opt/emailengine

# Start service
sudo systemctl start emailengine

# Verify
sudo systemctl status emailengine
curl http://localhost:3000/health
```

### From Git Repository

```bash
cd /opt/emailengine

# Stop service
sudo systemctl stop emailengine

# Backup (optional)
sudo cp -r /opt/emailengine /opt/emailengine.backup.$(date +%Y%m%d)

# Update from Git
sudo git pull

# Update dependencies
sudo npm install --production

# Restore ownership
sudo chown -R emailengine:emailengine /opt/emailengine

# Start service
sudo systemctl start emailengine
```

### With PM2

```bash
cd /opt/emailengine

# Update source
sudo git pull
sudo npm install --production

# Reload with zero-downtime
pm2 reload emailengine
```

## Configuration Options

### Environment Variables

All configuration can be set via environment variables in `.env` file:

```bash
# Core settings
EENGINE_REDIS=redis://127.0.0.1:6379
EENGINE_SECRET=your-secret-32-chars-min
EENGINE_SECRET=your-encryption-secret

# Performance
EENGINE_WORKERS=4
EENGINE_QUEUE_CONCURRENCY=4

# API
EENGINE_PORT=3000
EENGINE_HOST=0.0.0.0

# Logging
EENGINE_LOG_LEVEL=info
EENGINE_LOG_RAW=false

# Features
EENGINE_MAX_ATTACHMENT_SIZE=5242880
```

See [Configuration Options](/docs/configuration) for complete reference.

## Performance Optimization

### Node.js Optimization

```bash
# Set Node.js options in SystemD service
Environment="NODE_OPTIONS=--max-old-space-size=2048"

# Or in ecosystem.config.js for PM2
node_args: '--max-old-space-size=2048'
```

### Worker Configuration

```bash
# Set workers to CPU core count
EENGINE_WORKERS=4

# For high-load servers
EENGINE_WORKERS=8
EENGINE_QUEUE_CONCURRENCY=8
```

### Redis Optimization

See [Linux Installation - Performance Tuning](/docs/installation/linux#performance-tuning) for Redis optimization.

## Monitoring

### Health Checks

```bash
# HTTP health endpoint
curl http://localhost:3000/health

# Returns: {"success":true}
```

### Prometheus Metrics

Create a token with metrics scope:
```bash
emailengine tokens issue -d "Prometheus" -s "metrics"
```

Access metrics at `/metrics` endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/metrics
```

### Logs

```bash
# SystemD logs
sudo journalctl -u emailengine -f

# PM2 logs
pm2 logs emailengine

# Log files
tail -f /var/log/emailengine/*.log
```

## Security Best Practices

1. **Run as dedicated user** (not root)
2. **Secure `.env` file** with `chmod 600`
3. **Use strong secrets** (32+ characters)
4. **Enable firewall** and restrict port access
5. **Use reverse proxy** with TLS/HTTPS
6. **Keep Node.js updated** to latest LTS version
7. **Regular backups** of Redis data
8. **Monitor logs** for suspicious activity

See [Security Best Practices](/docs/deployment/security) for detailed guidance.
