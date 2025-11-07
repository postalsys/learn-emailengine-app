---
title: macOS Installation
description: Install EmailEngine on macOS using PKG installer or Homebrew
sidebar_position: 3
---

# Installing EmailEngine on macOS

Complete guide for installing EmailEngine on macOS systems (Intel and Apple Silicon).

## Overview

EmailEngine can be installed on macOS using three methods:

1. **PKG Installer** - Graphical installer for both Intel and Apple Silicon Macs
2. **Binary Installation** - Standalone executable with Homebrew Redis
3. **Source Installation** - Run from source (requires Node.js 20+)

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
- **Node.js 20+** (only for source installation)
- **Homebrew** (recommended for Redis installation)

## Method 1: PKG Installer

The easiest way to install EmailEngine on macOS.

### Download Installer

**For Intel Macs:**
```bash
curl -LO https://go.emailengine.app/emailengine.pkg
```

**For Apple Silicon (M1/M2/M3):**
```bash
curl -LO https://go.emailengine.app/emailengine-arm.pkg
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

Generate secret:
```bash
# Generate a random secret (minimum 32 characters)
openssl rand -hex 32
```

Save this value securely. You'll use it in the configuration below.

**Save these values securely!**

Start EmailEngine:
```bash
emailengine \
  --dbs.redis="redis://127.0.0.1:6379" \
  --secret="$EENGINE_SECRET" \
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
        <string>your-secret-here</string>
        <key>EENGINE_SECRET</key>
        <string>your-encryption-secret-here</string>
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

## Method 2: Binary Installation

Manual installation using the standalone binary.

### Step 1: Install Redis

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install and start Redis
brew install redis
brew services start redis

# Verify
redis-cli ping
```

### Step 2: Download EmailEngine Binary

**For Intel Macs:**
```bash
curl -LO https://go.emailengine.app/emailengine-macos-x64
mv emailengine-macos-x64 emailengine
chmod +x emailengine
sudo mv emailengine /usr/local/bin/
```

**For Apple Silicon:**
```bash
curl -LO https://go.emailengine.app/emailengine-macos-arm64
mv emailengine-macos-arm64 emailengine
chmod +x emailengine
sudo mv emailengine /usr/local/bin/
```

### Step 3: Verify Installation

```bash
emailengine --version
```

### Step 4: Configure and Run

Create a `.env` file in the directory where you'll run EmailEngine:

```bash
# Generate secret and save to .env file
echo "EENGINE_SECRET=$(openssl rand -hex 32)" > .env
echo "EENGINE_REDIS=redis://127.0.0.1:6379" >> .env
```

**Note:** EmailEngine automatically loads environment variables from a `.env` file in the current working directory.

Start EmailEngine:
```bash
emailengine \
  --dbs.redis="redis://127.0.0.1:6379" \
  --secret="$EENGINE_SECRET" \
  --api.port=3000
```

Test:
```bash
curl http://localhost:3000/health
```

### Upgrading Binary Installation

```bash
# Download latest binary for your architecture
curl -LO https://go.emailengine.app/emailengine-macos-arm64

# Stop EmailEngine (if running as launch agent)
launchctl stop com.emailengine

# Replace binary
mv emailengine-macos-arm64 emailengine
chmod +x emailengine
sudo mv emailengine /usr/local/bin/

# Restart
launchctl start com.emailengine

# Verify
emailengine --version
```

## Method 3: Source Installation

Running from source is recommended for production as it uses less RAM than the binary.

### Step 1: Install Node.js 20+

**Using Homebrew:**
```bash
brew install node@20

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="/usr/local/opt/node@20/bin:$PATH"

# Verify
node --version  # Should be 20.x
npm --version
```

**Using NVM (alternative):**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

### Step 2: Install Redis

```bash
brew install redis
brew services start redis
```

### Step 3: Download Source

**Option A: From releases (stable):**
```bash
# Create directory
sudo mkdir -p /opt/emailengine
cd /opt/emailengine

# Download source distribution
curl -L https://go.emailengine.app/source-dist.tar.gz | tar xz
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
EENGINE_REDIS=redis://127.0.0.1:6379
EENGINE_SECRET=your-secret-key-at-least-32-chars
EENGINE_SECRET=your-encryption-secret-32-chars
EENGINE_WORKERS=4
EENGINE_LOG_LEVEL=info
EENGINE_PORT=3000
```

Generate secrets:
```bash
openssl rand -hex 32  # Use for EENGINE_SECRET
openssl rand -hex 32  # Use for EENGINE_SECRET
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

### Step 6: Run as Launch Agent

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
    <key>EnvironmentVariables</key>
    <dict>
        <key>EENGINE_REDIS</key>
        <string>redis://127.0.0.1:6379</string>
        <key>EENGINE_SECRET</key>
        <string>your-secret-here</string>
        <key>EENGINE_SECRET</key>
        <string>your-encryption-secret-here</string>
        <key>EENGINE_WORKERS</key>
        <string>4</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>/opt/emailengine</string>
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

### Upgrading Source Installation

```bash
cd /opt/emailengine

# Stop service
launchctl stop com.emailengine

# Update (Git)
git pull
npm install --production

# Or download new release
# curl -L https://go.emailengine.app/source-dist.tar.gz | tar xz

# Start service
launchctl start com.emailengine
```

