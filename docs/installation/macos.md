---
title: macOS Installation
description: Install EmailEngine on macOS using PKG installer or Homebrew
sidebar_position: 3
---

# Installing EmailEngine on macOS

Complete guide for installing EmailEngine on macOS systems (Intel and Apple Silicon).

## Overview

EmailEngine can be installed on macOS using two methods:

1. **PKG Installer** - Graphical installer for both Intel and Apple Silicon Macs
2. **Source Installation** - Run from source (requires Node.js 20+, recommended 24+)

### System Requirements

**Minimum (development/testing):**
- macOS 11 (Big Sur) or later
- 2 GB RAM
- 10 GB storage

**Recommended (production):**
- macOS 12 (Monterey) or later
- 4-8 GB RAM or more
- 20+ GB SSD storage

### Required Software

- **Redis 6.0+** (install via Homebrew)
- **Node.js 20+** (only for source installation, recommended 24+)
- **Homebrew** (recommended for Redis installation)

## Method 1: PKG Installer

The easiest way to install EmailEngine on macOS.

### Download Installer

**For Intel Macs:**
```bash
# Download latest version
curl -LO https://go.emailengine.app/emailengine.pkg

# Or download specific version (e.g., 2.55.4)
curl -LO https://go.emailengine.app/download/v2.55.4/emailengine.pkg
```

**For Apple Silicon (M1 and newer):**
```bash
# Download latest version
curl -LO https://go.emailengine.app/emailengine-arm.pkg

# Or download specific version (e.g., 2.55.4)
curl -LO https://go.emailengine.app/download/v2.55.4/emailengine-arm.pkg
```

### Install

1. Double-click the downloaded `.pkg` file
2. Follow the installation wizard
3. Installer will place binary at `/usr/local/bin/emailengine`

### Verify Installation

```bash
emailengine --version
```

### Install Redis

The PKG installer includes EmailEngine but not Redis. Install Redis separately:

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Redis
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping  # Should return: PONG
```

### Configure and Run

Generate and save encryption secret:
```bash
# Generate a random secret (minimum 32 characters) and save to environment file
echo "EENGINE_SECRET=$(openssl rand -hex 32)" > ~/.emailengine.env
echo "EENGINE_REDIS=redis://127.0.0.1:6379/8" >> ~/.emailengine.env

# Load the environment variables
source ~/.emailengine.env
```

**Important:** Save `~/.emailengine.env` securely. You must source this file and use the same secret every time you start EmailEngine.

Start EmailEngine:
```bash
# Load environment variables first
source ~/.emailengine.env

emailengine \
  --dbs.redis="$EENGINE_REDIS" \
  --service.secret="$EENGINE_SECRET" \
  --api.port=3000
```

Test the installation:
```bash
curl http://localhost:3000/health
# Should return: {"success":true}
```

### Run as Launch Agent

For automatic startup, create a launch agent plist.

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
        <string>/usr/local/bin/emailengine</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>EENGINE_REDIS</key>
        <string>redis://127.0.0.1:6379</string>
        <key>EENGINE_SECRET</key>
        <string>your-encryption-secret-from-openssl-rand-hex-32</string>
        <key>EENGINE_WORKERS</key>
        <string>4</string>
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
launchctl start com.emailengine
```

Check status:
```bash
launchctl list | grep emailengine
tail -f /usr/local/var/log/emailengine.log
```

## Method 2: Source Installation

Running from source is recommended for production as it uses less RAM than the binary.

### Step 1: Install Node.js

**Using Homebrew (recommended):**
```bash
# Install latest Node.js (24+)
brew install node

# Verify
node --version  # Should be 24.x or higher
npm --version
```

**Using NVM (alternative):**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 24 (or latest LTS)
nvm install 24
nvm use 24
nvm alias default 24
```

**Note:** Node.js 20+ is supported, but 24+ is recommended for better performance and latest features.

### Step 2: Install Redis

```bash
brew install redis
brew services start redis
```

### Step 3: Setup Directory Structure

```bash
# Create directories
sudo mkdir -p /opt/emailengine/app
cd /opt/emailengine
```

### Step 4: Configure Environment

Generate and create `.env` file in `/opt/emailengine`:

```bash
# Generate encryption secret and create .env file
sudo bash -c "cat > /opt/emailengine/.env" <<EOF
EENGINE_REDIS=redis://127.0.0.1:6379
EENGINE_SECRET=$(openssl rand -hex 32)
EENGINE_WORKERS=4
EENGINE_LOG_LEVEL=info
EENGINE_PORT=3000
EOF

# Secure the file
sudo chmod 600 /opt/emailengine/.env
```

**Important:** The `.env` file is stored outside the `app/` directory, making upgrades easier. Keep this file safe.

### Step 5: Download Source

```bash
cd /opt/emailengine

# Download and extract to app directory (latest)
sudo curl -L https://go.emailengine.app/source-dist.tar.gz | sudo tar xz -C app --strip-components=1

# Or download specific version (e.g., 2.55.4)
sudo curl -L https://go.emailengine.app/download/v2.55.4/source-dist.tar.gz | sudo tar xz -C app --strip-components=1
```

### Step 6: Test Run

```bash
cd /opt/emailengine
node app/server.js
```

In another terminal:
```bash
curl http://localhost:3000/health
```

### Step 7: Run as Launch Agent

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
        <string>app/server.js</string>
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

**Note:**
- Working directory is `/opt/emailengine` where the `.env` file is located
- EmailEngine runs from `app/server.js`
- This structure makes upgrades easy - just replace the `app/` directory

Load and start:
```bash
launchctl load ~/Library/LaunchAgents/com.emailengine.plist
```

### Upgrading Source Installation

The directory structure makes upgrades simple - just replace the `app/` directory while keeping your `.env` file intact.

```bash
cd /opt/emailengine

# Stop service
launchctl stop com.emailengine

# Backup current version (optional)
sudo mv app app.backup.$(date +%Y%m%d)

# Create new app directory
sudo mkdir -p app

# Download and extract new version (latest)
sudo curl -L https://go.emailengine.app/source-dist.tar.gz | sudo tar xz -C app --strip-components=1

# Or download specific version (e.g., 2.55.4)
sudo curl -L https://go.emailengine.app/download/v2.55.4/source-dist.tar.gz | sudo tar xz -C app --strip-components=1

# Start service
launchctl start com.emailengine

# Verify
curl http://localhost:3000/health
```

**Note:** Your `.env` file in `/opt/emailengine/` is preserved during upgrades.

