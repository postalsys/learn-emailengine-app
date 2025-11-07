---
title: Windows Installation
description: Install EmailEngine on Windows using standalone executable or WSL2
sidebar_position: 4
---

# Installing EmailEngine on Windows

Complete guide for installing EmailEngine on Windows systems.

## Overview

EmailEngine can be installed on Windows using two methods:

1. **Windows Executable** - Native Windows binary with Memurai or Redis alternatives
2. **WSL2** - Linux installation inside Windows Subsystem for Linux

:::tip Production Recommendation
For production deployments on Windows Server, consider using **WSL2** or running EmailEngine on a dedicated Linux VM for better performance and reliability.
:::

## Method 1: Windows Executable

Native Windows installation using the standalone executable.

### Step 1: Install Redis Alternative

EmailEngine requires Redis, which doesn't officially support Windows. Use one of these alternatives:

#### Option A: Memurai (Recommended)

[Memurai](https://www.memurai.com/) is a Redis-compatible server for Windows.

1. Download Memurai from [https://www.memurai.com/get-memurai](https://www.memurai.com/get-memurai)
2. Run the installer (requires admin rights)
3. Memurai starts automatically as a Windows service

**Verify installation:**
```powershell
# Using Memurai CLI
memurai-cli ping
# Should return: PONG
```

#### Option B: Redis on WSL2

If you have WSL2 installed:

```powershell
# Start WSL2
wsl

# Install Redis in WSL2
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# Exit WSL2
exit
```

Connect to WSL2 Redis from Windows using `redis://localhost:6379`

#### Option C: Redis Docker Container

```powershell
# Pull Redis image
docker pull redis:latest

# Run Redis
docker run -d --name redis -p 6379:6379 redis:latest

# Verify
docker exec redis redis-cli ping
```

### Step 2: Download EmailEngine

Open PowerShell and download the Windows executable:

```powershell
# Download latest version
Invoke-WebRequest -Uri "https://go.emailengine.app/emailengine.exe" -OutFile "emailengine.exe"

# Or for specific version (e.g., 2.55.4)
Invoke-WebRequest -Uri "https://github.com/postalsys/emailengine/releases/download/v2.55.4/emailengine-win-x64.exe" -OutFile "emailengine.exe"
```

**Alternative: Browser download**
1. Visit [https://github.com/postalsys/emailengine/releases/latest](https://github.com/postalsys/emailengine/releases/latest)
2. Download `emailengine-win-x64.exe`
3. Save to a permanent location (e.g., `C:\Program Files\EmailEngine\`)

### Step 3: Configure EmailEngine

Generate secrets using PowerShell:

```powershell
# Generate random secrets
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$encSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "EENGINE_SECRET=$secret"
Write-Host "EENGINE_SECRET=$encSecret"
```

**Save these values securely!**

Create environment variables or a configuration file.

### Step 4: Test Run

```powershell
# Set environment variables for this session
$env:EENGINE_REDIS = "redis://127.0.0.1:6379"
$env:EENGINE_SECRET = "your-secret-here"
$env:EENGINE_SECRET = "your-encryption-secret-here"
$env:EENGINE_PORT = "3000"

# Run EmailEngine
.\emailengine.exe
```

In another PowerShell window:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" | Select-Object -Expand Content
# Should return: {"success":true}
```

### Step 5: Run as Windows Service

To run EmailEngine as a Windows service, use [NSSM (Non-Sucking Service Manager)](https://nssm.cc/).

**Install NSSM:**
```powershell
# Using Chocolatey
choco install nssm

# Or download from https://nssm.cc/download
```

**Create service:**
```powershell
# Open NSSM service installer
nssm install EmailEngine

# In the NSSM GUI:
# - Path: C:\Program Files\EmailEngine\emailengine.exe
# - Startup directory: C:\Program Files\EmailEngine
# - Service name: EmailEngine

# Or via command line
nssm install EmailEngine "C:\Program Files\EmailEngine\emailengine.exe"
nssm set EmailEngine AppDirectory "C:\Program Files\EmailEngine"
nssm set EmailEngine AppEnvironmentExtra EENGINE_REDIS=redis://127.0.0.1:6379 EENGINE_SECRET=your-secret-at-least-32-chars EENGINE_WORKERS=4
nssm set EmailEngine DisplayName "EmailEngine"
nssm set EmailEngine Description "EmailEngine IMAP/SMTP API service"
nssm set EmailEngine Start SERVICE_AUTO_START

# Start service
nssm start EmailEngine

# Check status
nssm status EmailEngine
```

**Service management:**
```powershell
# Start service
nssm start EmailEngine

# Stop service
nssm stop EmailEngine

# Restart service
nssm restart EmailEngine

# Remove service
nssm remove EmailEngine confirm
```

### Upgrading Windows Installation

```powershell
# Stop service
nssm stop EmailEngine

# Download latest version
Invoke-WebRequest -Uri "https://go.emailengine.app/emailengine.exe" -OutFile "emailengine.exe"

# Replace existing binary
Move-Item -Path "emailengine.exe" -Destination "C:\Program Files\EmailEngine\emailengine.exe" -Force

# Start service
nssm start EmailEngine

# Verify version
& "C:\Program Files\EmailEngine\emailengine.exe" --version
```

## Method 2: WSL2 Installation (Recommended for Production)

Windows Subsystem for Linux 2 provides better performance and compatibility.

### Step 1: Enable WSL2

```powershell
# Run as Administrator
wsl --install

# Restart your computer

# Set WSL2 as default
wsl --set-default-version 2

# Install Ubuntu
wsl --install -d Ubuntu-22.04
```

### Step 2: Install EmailEngine in WSL2

```powershell
# Start WSL2
wsl
```

Inside WSL2, follow the [Linux installation guide](/docs/installation/linux):

```bash
# Quick install using automated installer
wget https://go.emailengine.app -O install.sh
chmod +x install.sh
sudo ./install.sh

# Or manual installation
sudo apt update
sudo apt install redis-server
wget https://go.emailengine.app/emailengine.tar.gz
tar xzf emailengine.tar.gz
sudo mv emailengine /usr/local/bin/
```

### Step 3: Access from Windows

EmailEngine running in WSL2 is accessible from Windows at:
- `http://localhost:3000` (if configured on port 3000)

### Step 4: Auto-start with Windows

Create a Windows startup script to launch EmailEngine in WSL2.

**Create `start-emailengine.bat` in `C:\Program Files\EmailEngine\`:**

```batch
@echo off
wsl sudo service redis-server start
wsl sudo service emailengine start
```

**Add to Windows startup:**
1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create a shortcut to `start-emailengine.bat`

### Advantages of WSL2

- Full Linux compatibility
- Better performance than native Windows
- Access to all Linux tools and packages
- Easier updates and maintenance
- Production-ready environment

## Configuration Options

### Environment Variables

Set these in NSSM service configuration or `.env` file:

```bash
# Required
EENGINE_REDIS=redis://127.0.0.1:6379
EENGINE_SECRET=your-secret-key-at-least-32-chars
EENGINE_SECRET=your-encryption-secret-32-chars

# Optional
EENGINE_WORKERS=4
EENGINE_PORT=3000
EENGINE_LOG_LEVEL=info
EENGINE_LOG_RAW=false
```

### Using Configuration File

Create `config.json` in the same directory as `emailengine.exe`:

```json
{
  "dbs": {
    "redis": "redis://127.0.0.1:6379"
  },
  "api": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "workers": 4,
  "log": {
    "level": "info",
    "raw": false
  }
}
```

Run with config file:
```powershell
.\emailengine.exe --config=config.json --secret=your-secret
```

## Performance Considerations

### Windows vs WSL2

| Feature | Native Windows | WSL2 |
|---------|---------------|------|
| Performance | Good | Better |
| Memory usage | Higher | Lower (with source) |
| Compatibility | Limited | Full |
| Updates | Manual | Easy |
| Production use | Development only | Recommended |

### RAM Usage

- **Windows executable**: ~200-400 MB base memory
- **Source in WSL2**: ~100-200 MB base memory (recommended for production)
