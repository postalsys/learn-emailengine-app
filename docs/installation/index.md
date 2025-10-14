---
title: Installation Guide
description: Install EmailEngine using npm, Docker, or from source with system requirements
sidebar_position: 1
---

# Installing EmailEngine

Complete guide to installing EmailEngine across different platforms and environments.

:::tip Quick Start
```bash
# NPM installation
npm install -g emailengine

# Or Docker
docker run -p 3000:3000 --env EENGINE_REDIS="redis://host.docker.internal:6379" postalsys/emailengine:v2
```
:::

## Prerequisites

Before installing EmailEngine, ensure you have:

### System Requirements

**Minimum:**
- **CPU:** 1 core
- **RAM:** 1 GB
- **Storage:** 10 GB
- **Network:** Stable internet connection

**Recommended for production:**
- **CPU:** 2-4 cores
- **RAM:** 2-4 GB
- **Storage:** 20+ GB SSD
- **Network:** Low-latency connection

### Required Software

1. **Redis 6.0+**
   - Stand-alone mode (Cluster not supported)
   - Persistence enabled (RDB or AOF)
   - `noeviction` memory policy

2. **Node.js 18+** (for NPM installation)
   - Check version: `node --version`
   - Install from: [nodejs.org](https://nodejs.org/)

3. **Operating System:**
   - Linux (Ubuntu 20.04+, Debian 10+, CentOS 8+, RHEL 8+)
   - macOS 11+
   - Windows 10+ (with WSL2 recommended)

### Network Access

- **IMAP/SMTP ports:** 143, 993 (IMAP), 25, 465, 587 (SMTP)
- **HTTPS:** 443 (for OAuth2 redirects)
- **Redis:** 6379 (internal only)
- **HTTP:** 3000 (default EmailEngine port)

## Installation Methods

### 1. NPM Installation (Recommended)

Install EmailEngine globally using NPM:

```bash
# Install globally
npm install -g emailengine

# Verify installation
emailengine --version

# Start EmailEngine
emailengine --dbs.redis="redis://localhost:6379"
```

**Advantages:**
- Simple and straightforward
- Easy updates with `npm update -g emailengine`
- Direct access to command-line options
- No containerization overhead

**Disadvantages:**
- Requires Node.js installation
- Manual process management
- System-wide installation

**Best for:** Development, VPS hosting, traditional server setups

[Detailed NPM setup guide →](#npm-detailed-setup)

---

### 2. Docker Installation

Run EmailEngine in a Docker container:

```bash
# Pull image
docker pull postalsys/emailengine:v2

# Run container
docker run -d \
  --name emailengine \
  -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379" \
  --env EENGINE_SECRET="your-secret-key" \
  --restart unless-stopped \
  postalsys/emailengine:v2
```

**Advantages:**
- Isolated environment
- Consistent across platforms
- Easy updates and rollbacks
- Portable configuration

**Disadvantages:**
- Requires Docker knowledge
- Slight performance overhead
- More complex networking

**Best for:** Containerized environments, Kubernetes, cloud deployments

[Complete Docker guide →](/docs/deployment/docker)

---

### 3. Install from Source

Build EmailEngine from the GitHub repository:

```bash
# Clone repository
git clone https://github.com/postalsys/emailengine.git
cd emailengine

# Install dependencies
npm install --production

# Build (if needed)
npm run build

# Start
npm start
```

**Advantages:**
- Latest features (master branch)
- Full source code access
- Customization possible
- Development-friendly

**Disadvantages:**
- Manual updates
- Build requirements
- Less stable than releases

**Best for:** Development, testing new features, custom builds

[Development setup →](#development-setup)

---

### 4. Cloud Platforms

Deploy to managed platforms:

#### Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/postalsys/emailengine)

One-click deployment with automatic Redis setup.

[Render deployment guide →](/docs/deployment/render)

#### DigitalOcean

Deploy as a Droplet or App Platform application.

```bash
# Deploy to App Platform
# Use GitHub repository: https://github.com/postalsys/emailengine
```

#### Heroku

```bash
# Add Heroku Redis
heroku addons:create heroku-redis:mini

# Deploy
git push heroku master
```

[Cloud deployment guides →](/docs/deployment)

## Detailed Setup Instructions

### NPM Detailed Setup

#### Step 1: Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Should return: PONG
```

**macOS:**
```bash
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
```

**CentOS/RHEL:**
```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### Step 2: Configure Redis

Edit `/etc/redis/redis.conf`:

```bash
# Set eviction policy
maxmemory-policy noeviction

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Set max memory (e.g., 1GB)
maxmemory 1gb
```

Restart Redis:
```bash
sudo systemctl restart redis
```

#### Step 3: Install EmailEngine

```bash
# Install globally
sudo npm install -g emailengine

# Or install for current user
npm install -g emailengine

# Verify installation
emailengine --version
```

#### Step 4: Create Configuration

Create `/etc/emailengine/config.json`:

```json
{
  "dbs": {
    "redis": "redis://localhost:6379"
  },
  "api": {
    "port": 3000,
    "host": "127.0.0.1"
  },
  "workers": 2,
  "log": {
    "level": "info"
  }
}
```

#### Step 5: Start EmailEngine

```bash
# Start with config file
emailengine --config=/etc/emailengine/config.json

# Or with environment variables
EENGINE_REDIS="redis://localhost:6379" \
EENGINE_SECRET="your-secret-key" \
EENGINE_WORKERS=2 \
emailengine

# Access web interface
open http://localhost:3000
```

#### Step 6: Run as Service (Optional)

See [SystemD service guide](/docs/deployment/systemd) for running as a background service.

---

### Development Setup

For development and testing:

#### 1. Clone Repository

```bash
git clone https://github.com/postalsys/emailengine.git
cd emailengine
```

#### 2. Install Dependencies

```bash
# Install all dependencies (including dev)
npm install

# Or production only
npm install --production
```

#### 3. Configure Environment

Create `.env` file:

```bash
EENGINE_REDIS=redis://localhost:6379
EENGINE_SECRET=development-secret-key
EENGINE_LOG_LEVEL=trace
EENGINE_WORKERS=1
```

#### 4. Start Development Server

```bash
# Start with auto-reload
npm run dev

# Or normal start
npm start
```

#### 5. Run Tests

```bash
# Run test suite
npm test

# Run specific test
npm test -- test/account-test.js

# Check code coverage
npm run coverage
```

## Post-Installation Setup

### 1. Initial Configuration

Access web interface at `http://localhost:3000`:

1. **Set admin password** on first login
2. **Configure OAuth2** credentials (Gmail, Outlook)
3. **Set webhook URL** if using webhooks
4. **Enter license key** for production features

### 2. Register First Account

**Via web interface:**
1. Click "Add Account"
2. Enter email and credentials
3. Test connection
4. Save account

**Via API:**
```bash
curl -X POST http://localhost:3000/v1/account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account": "user@example.com",
    "name": "User Name",
    "email": "user@example.com",
    "imap": {
      "host": "imap.gmail.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "user@example.com",
        "pass": "password"
      }
    },
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "user@example.com",
        "pass": "password"
      }
    }
  }'
```

### 3. Verify Installation

**Check health endpoint:**
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "redis": "connected",
  "version": "2.48.5",
  "license": "development"
}
```

**Check metrics (if enabled):**
```bash
curl http://localhost:9090/metrics
```

### 4. Configure Security

For production deployments:

1. **Set strong secrets:**
   ```bash
   export EENGINE_SECRET=$(openssl rand -hex 32)
   export EENGINE_ENCRYPTION_SECRET=$(openssl rand -hex 32)
   ```

2. **Enable HTTPS** with Nginx reverse proxy
   [Nginx setup guide →](/docs/deployment/nginx-proxy)

3. **Configure firewall:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw deny 3000/tcp  # Block direct access
   ```

4. **Enable monitoring:**
   ```bash
   export EENGINE_METRICS_SERVER=true
   ```

[Complete security guide →](/docs/deployment/security)

## Platform-Specific Notes

### Ubuntu/Debian

```bash
# Install all prerequisites
sudo apt update
sudo apt install -y nodejs npm redis-server

# Install EmailEngine
sudo npm install -g emailengine

# Run as SystemD service
sudo systemctl enable emailengine
sudo systemctl start emailengine
```

### macOS

```bash
# Install prerequisites with Homebrew
brew install node redis

# Start Redis
brew services start redis

# Install EmailEngine
npm install -g emailengine

# Run in background
emailengine &
```

### Windows (WSL2)

```bash
# Enable WSL2
wsl --install

# Inside WSL2 (Ubuntu)
sudo apt update
sudo apt install -y nodejs npm redis-server

# Install EmailEngine
npm install -g emailengine

# Start Redis
sudo service redis-server start

# Start EmailEngine
emailengine
```

:::tip Windows Native
For native Windows installation, use Docker Desktop or WSL2. Native Windows support is limited.
:::

### CentOS/RHEL

```bash
# Install Node.js
sudo yum install -y nodejs npm

# Install Redis
sudo yum install -y redis
sudo systemctl enable redis
sudo systemctl start redis

# Install EmailEngine
sudo npm install -g emailengine
```

## Troubleshooting Installation

### Common Issues

#### 1. Redis Connection Failed

```
Error: Redis connection to 127.0.0.1:6379 failed
```

**Solutions:**
```bash
# Check Redis is running
redis-cli ping

# Start Redis
sudo systemctl start redis

# Check Redis logs
sudo journalctl -u redis -n 50
```

#### 2. Permission Denied

```
Error: EACCES: permission denied
```

**Solutions:**
```bash
# Install without sudo (user-level)
npm install -g emailengine --prefix ~/.npm-global

# Add to PATH
export PATH=~/.npm-global/bin:$PATH
```

#### 3. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
emailengine --port=3001
```

#### 4. Node.js Version Too Old

```
Error: Node.js version 14.x is not supported
```

**Solutions:**
```bash
# Update Node.js with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify
node --version
```

#### 5. NPM Install Fails

```
Error: gyp ERR! build error
```

**Solutions:**
```bash
# Install build tools
# Ubuntu/Debian
sudo apt install build-essential

# macOS
xcode-select --install

# Clear npm cache
npm cache clean --force

# Retry
npm install -g emailengine
```

### Getting Help

If issues persist:

1. **Check logs:**
   ```bash
   # NPM installation
   emailengine 2>&1 | tee emailengine.log

   # SystemD service
   sudo journalctl -u emailengine -f
   ```

2. **Enable debug mode:**
   ```bash
   EENGINE_LOG_LEVEL=trace emailengine
   ```

3. **Visit troubleshooting guide:**
   [Troubleshooting documentation →](/docs/troubleshooting)

4. **Get support:**
   [Support page →](/docs/support/license)

## Next Steps

After successful installation:

1. **Register email accounts**
   [Account setup guide →](/docs/accounts)

2. **Configure OAuth2**
   [OAuth2 setup →](/docs/accounts/oauth2-setup)

3. **Set up webhooks**
   [Webhooks guide →](/docs/receiving/webhooks)

4. **Deploy to production**
   [Deployment guides →](/docs/deployment)

5. **Integrate with your app**
   [API reference →](/docs/api-reference)

## See Also

- [Configuration Options](/docs/configuration)
- [Docker Deployment](/docs/deployment/docker)
- [SystemD Service](/docs/deployment/systemd)
- [Render Deployment](/docs/deployment/render)
- [Quick Start Guide](/docs/getting-started/quick-start)
- [Account Setup](/docs/accounts)
