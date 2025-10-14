---
title: Installation Guide
description: Install EmailEngine using binaries, Docker, or from source with system requirements
sidebar_position: 1
---

# Installing EmailEngine

Complete guide to installing EmailEngine across different platforms and environments.

:::tip Quick Start
```bash
# Download binary for Linux
wget https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz
tar xzf emailengine.tar.gz
sudo mv emailengine /usr/local/bin/

# Or use Docker
docker run -p 3000:3000 --env EENGINE_REDIS="redis://host.docker.internal:6379" postalsys/emailengine:v2
```
:::

## Prerequisites

Before installing EmailEngine, ensure you have:

### System Requirements

**Minimum:**
- **CPU:** 1 core
- **RAM:** 1 GB (2 GB recommended)
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

2. **Node.js 18+** (only for source installation)
   - Check version: `node --version`
   - Install from: [nodejs.org](https://nodejs.org/)

3. **Operating System:**
   - Linux (Ubuntu 20.04+, Debian 10+, CentOS 8+, RHEL 8+)
   - macOS 11+
   - Windows 10+ (native executable or WSL2)

### Network Access

- **IMAP/SMTP ports:** 143, 993 (IMAP), 25, 465, 587 (SMTP)
- **HTTPS:** 443 (for OAuth2 redirects)
- **Redis:** 6379 (internal only)
- **HTTP:** 3000 (default EmailEngine port)

## Installation Methods

### 1. Binary Installation (Recommended)

EmailEngine is distributed as standalone executables for all major platforms.

#### Linux

```bash
# Download the latest release
wget https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz

# Extract
tar xzf emailengine.tar.gz
rm emailengine.tar.gz

# Move to system path
sudo mv emailengine /usr/local/bin/

# Verify installation
emailengine --version

# Start EmailEngine
emailengine --dbs.redis="redis://127.0.0.1:6379"
```

**Advantages:**
- No dependencies required (except Redis)
- Fast startup
- Small footprint
- Production-ready

**Best for:** Production deployments, VPS hosting, traditional servers

[Detailed Linux setup →](#linux-setup)

---

#### macOS

Download the signed PKG installer:

- **Intel CPU:** [emailengine.pkg](https://github.com/postalsys/emailengine/releases/latest/download/emailengine.pkg)
- **Apple Silicon:** [emailengine-arm.pkg](https://github.com/postalsys/emailengine/releases/latest/download/emailengine-arm.pkg)

The installer places the `emailengine` binary in `/usr/local/bin`.

```bash
# After installation, start EmailEngine
emailengine --dbs.redis="redis://127.0.0.1:6379"
```

**Uninstall:**
```bash
sudo rm /usr/local/bin/emailengine
```

[macOS setup guide →](#macos-setup)

---

#### Windows

Download the standalone executable: [emailengine.exe](https://github.com/postalsys/emailengine/releases/latest/download/emailengine.exe)

```powershell
# Run from PowerShell
.\emailengine.exe --dbs.redis="redis://127.0.0.1:6379"
```

**Note:** Redis is not officially supported on Windows. Use [Memurai](https://www.memurai.com/) or a remote Redis server.

[Windows setup guide →](#windows-setup)

---

### 2. Docker Installation

Run EmailEngine in a Docker container:

```bash
# Pull latest image
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

### 3. Automated Ubuntu/Debian Installer

Use the one-click installer script for fresh Ubuntu 20.04 LTS or Debian 11 servers:

```bash
# Download installer
wget https://go.emailengine.app -O install.sh

# Make executable and run
chmod +x install.sh
sudo su
./install.sh example.com
```

**What it installs:**
- EmailEngine binary
- Redis server
- Caddy reverse proxy with TLS
- SystemD service
- Upgrade helper script at `/opt/upgrade-emailengine.sh`

**Important:** Only use on fresh servers. It rewrites networking and service settings.

---

### 4. Source Installation (Development)

Build EmailEngine from source for development or customization:

```bash
# Clone repository
git clone https://github.com/postalsys/emailengine.git
cd emailengine

# Install dependencies
npm install --production

# Start
npm start
```

Or use the pre-packaged source distribution:

```bash
# Download source
wget https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz
tar xzf source-dist.tar.gz
rm source-dist.tar.gz

# Configure
echo 'EENGINE_WORKERS=2
EENGINE_REDIS=redis://127.0.0.1:6379' > .env

# Run
node server.js
```

**Advantages:**
- Latest features (master branch)
- Full source code access
- Customization possible

**Disadvantages:**
- Requires Node.js 18+
- Manual updates
- Build requirements

**Best for:** Development, testing new features, custom builds

---

### 5. Cloud Platforms

Deploy to managed platforms:

#### Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/postalsys/emailengine)

One-click deployment with automatic Redis setup.

[Render deployment guide →](/docs/deployment/render)

#### DigitalOcean

One-click application from the DigitalOcean Marketplace:

[![DigitalOcean](https://cldup.com/QBubXuGF1M.svg)](https://marketplace.digitalocean.com/apps/emailengine?refcode=90a107552b31)

**Important:** DigitalOcean blocks SMTP ports 587 and 465 by default. Open a support ticket to unblock them.

**Upgrade on DigitalOcean:**
```bash
sudo /opt/upgrade-emailengine.sh
```

#### CapRover

Deploy via One-Click Apps in CapRover dashboard. Search for "EmailEngine" and deploy.

**Upgrade on CapRover:**
- Go to Deployment tab
- Use Method 6 (Deploy via Image Name)
- Enter: `postalsys/emailengine:v2`
- Click Deploy now

#### Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/postalsys/emailengine)

**Note:** Heroku regularly closes long-running connections. Allocate extra resources (4 GB RAM minimum) and ensure Redis allows 200+ concurrent connections.

[Cloud deployment guides →](/docs/deployment)

## Detailed Setup Instructions

### Linux Setup

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

#### Step 3: Download EmailEngine

```bash
# Download binary
wget https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz

# Extract and install
tar xzf emailengine.tar.gz
sudo mv emailengine /usr/local/bin/
chmod +x /usr/local/bin/emailengine

# Verify
emailengine --version
```

#### Step 4: Start EmailEngine

```bash
# Start with command-line flags
emailengine --dbs.redis="redis://127.0.0.1:6379"

# Or with environment variables
export EENGINE_REDIS="redis://127.0.0.1:6379"
export EENGINE_SECRET="$(openssl rand -hex 32)"
emailengine

# Access web interface
curl http://localhost:3000/health
```

#### Step 5: Run as Service (Optional)

See [SystemD service guide](/docs/deployment/systemd) for running as a background service.

---

### macOS Setup

#### Step 1: Install Redis

```bash
# Install with Homebrew
brew update
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
```

#### Step 2: Download EmailEngine

Download the signed PKG installer for your CPU:

- **Intel:** [emailengine.pkg](https://github.com/postalsys/emailengine/releases/latest/download/emailengine.pkg)
- **Apple Silicon:** [emailengine-arm.pkg](https://github.com/postalsys/emailengine/releases/latest/download/emailengine-arm.pkg)

Double-click to install. The binary is placed in `/usr/local/bin/`.

#### Step 3: Run EmailEngine

```bash
emailengine --dbs.redis="redis://127.0.0.1:6379"

# Or with environment variables
export EENGINE_REDIS="redis://127.0.0.1:6379"
export EENGINE_SECRET="$(openssl rand -hex 32)"
emailengine
```

#### Upgrading

Download the newest PKG for your CPU architecture and run it. The installer replaces the existing binary.

#### Uninstalling

```bash
sudo rm /usr/local/bin/emailengine
```

---

### Windows Setup

#### Step 1: Install Redis Alternative

Windows does not have official Redis support. Options:

1. **Memurai** - Redis-compatible Windows server: [memurai.com](https://www.memurai.com/)
2. **Remote Redis** - Use a cloud Redis service (Upstash, Redis Cloud)
3. **WSL2** - Run Linux and Redis in WSL2

#### Step 2: Download EmailEngine

Download [emailengine.exe](https://github.com/postalsys/emailengine/releases/latest/download/emailengine.exe) and place it in a convenient directory.

#### Step 3: Run

```powershell
# From PowerShell
PS C:\EmailEngine> .\emailengine.exe --dbs.redis="redis://127.0.0.1:6379"
```

Or create a `.env` file in the same directory:
```
EENGINE_REDIS=redis://127.0.0.1:6379
EENGINE_SECRET=your-secret-key-here
```

Then run:
```powershell
.\emailengine.exe
```

#### Upgrading

Download the newest `emailengine.exe` and replace the existing file.

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

## Upgrading

### Binary Installation

```bash
# Download latest release
wget https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz

# Extract and replace
tar xzf emailengine.tar.gz
sudo mv emailengine /usr/local/bin/

# Restart service
sudo systemctl restart emailengine
```

### Docker

```bash
# Pull latest image
docker pull postalsys/emailengine:v2

# Recreate container
docker stop emailengine
docker rm emailengine
docker run -d --name emailengine ... postalsys/emailengine:v2
```

### DigitalOcean Marketplace

```bash
sudo /opt/upgrade-emailengine.sh
```

### CapRover

Use Deployment tab, Method 6 (Deploy via Image Name): `postalsys/emailengine:v2`

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
# Make binary executable
chmod +x /usr/local/bin/emailengine

# Or move to user directory
mv emailengine ~/.local/bin/
export PATH=~/.local/bin:$PATH
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
emailengine --api.port=3001
```

#### 4. Binary Won't Execute

```
Error: cannot execute binary file
```

**Solutions:**
- Verify you downloaded the correct binary for your platform (Linux/macOS/Windows)
- Verify CPU architecture (x64 vs ARM)
- Check file permissions: `chmod +x emailengine`

#### 5. Redis Memory Issues

```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions:**
```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set memory policy
maxmemory-policy noeviction
maxmemory 2gb

# Restart Redis
sudo systemctl restart redis
```

### Getting Help

If issues persist:

1. **Check logs:**
   ```bash
   # Binary installation
   emailengine 2>&1 | tee emailengine.log

   # SystemD service
   sudo journalctl -u emailengine -f

   # Docker
   docker logs emailengine -f
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
