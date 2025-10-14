---
title: SystemD Service
description: Run EmailEngine as a SystemD service on Linux servers with automatic restart
sidebar_position: 3
---

# SystemD Service Deployment

Run EmailEngine as a background service on Linux systems using SystemD.

:::info Prerequisites
- Linux system with SystemD (Ubuntu 16.04+, Debian 8+, CentOS 7+, RHEL 7+)
- Node.js 20+ installed (for source installation)
- Redis 6.0+ installed and running
- EmailEngine binary installed in `/usr/local/bin/` or `/opt/emailengine`
:::

## Overview

SystemD is the standard init system for most modern Linux distributions. Running EmailEngine as a SystemD service provides:

- **Automatic startup** on system boot
- **Process management** (restart on failure)
- **Log management** with journald
- **Resource limits** and security isolation
- **Service dependencies** (start after Redis)

EmailEngine is well-suited for SystemD because it:
- Doesn't fork itself (runs in foreground)
- Logs to stdout/stderr (captured by journald)
- Responds to SIGTERM for graceful shutdown

## Basic Setup

### 1. Install EmailEngine

```bash
# Install globally
sudo npm install -g emailengine

# Verify installation
emailengine --version
```

### 2. Create Service User

Create dedicated user for security:

```bash
# Create system user
sudo useradd --system --no-create-home --shell /bin/false emailengine

# Or with home directory for config files
sudo useradd --system --home /opt/emailengine --shell /bin/false emailengine
```

### 3. Create Configuration Directory

```bash
# Create directories
sudo mkdir -p /etc/emailengine
sudo mkdir -p /var/log/emailengine

# Set permissions
sudo chown emailengine:emailengine /etc/emailengine
sudo chown emailengine:emailengine /var/log/emailengine
```

### 4. Create Configuration File

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
  "workers": 4,
  "log": {
    "level": "info"
  }
}
```

**Set permissions:**
```bash
sudo chown emailengine:emailengine /etc/emailengine/config.json
sudo chmod 640 /etc/emailengine/config.json
```

### 5. Create SystemD Service File

Create `/etc/systemd/system/emailengine.service`:

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

# Working directory
WorkingDirectory=/opt/emailengine

# Start command
ExecStart=/usr/bin/emailengine --config=/etc/emailengine/config.json

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=300
StartLimitBurst=5

# Environment variables
Environment="NODE_ENV=production"
Environment="EENGINE_REDIS=redis://localhost:6379"
Environment="EENGINE_SECRET=your-secret-key-at-least-32-characters"

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=emailengine

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/emailengine

# Resource limits
LimitNOFILE=65536
MemoryLimit=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

:::warning Security
Replace `your-secret-key-at-least-32-characters` with a strong random string.
:::

### 6. Enable and Start Service

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable emailengine

# Start service
sudo systemctl start emailengine

# Check status
sudo systemctl status emailengine
```

## Configuration Options

### Environment Variables

**Method 1: In service file**

```ini
[Service]
Environment="EENGINE_REDIS=redis://localhost:6379"
Environment="EENGINE_SECRET=your-secret-key"
Environment="EENGINE_WORKERS=4"
```

**Method 2: Environment file**

Create `/etc/emailengine/environment`:

```bash
EENGINE_REDIS=redis://localhost:6379
EENGINE_SECRET=your-secret-key-at-least-32-characters
EENGINE_ENCRYPTION_SECRET=another-secret-for-encryption
EENGINE_WORKERS=4
EENGINE_LOG_LEVEL=info
EENGINE_METRICS_SERVER=true
```

**Reference in service file:**

```ini
[Service]
EnvironmentFile=/etc/emailengine/environment
```

**Set permissions:**
```bash
sudo chown root:emailengine /etc/emailengine/environment
sudo chmod 640 /etc/emailengine/environment
```

### Configuration File

**Complete `/etc/emailengine/config.json`:**

```json
{
  "dbs": {
    "redis": "redis://localhost:6379"
  },
  "api": {
    "port": 3000,
    "host": "127.0.0.1",
    "proxy": true
  },
  "workers": 4,
  "maxConnections": 20,
  "secret": "${EENGINE_SECRET}",
  "encryptionSecret": "${EENGINE_ENCRYPTION_SECRET}",
  "log": {
    "level": "info",
    "file": "/var/log/emailengine/app.log"
  },
  "webhooks": {
    "enabled": true,
    "timeout": 10000
  },
  "gmail": {
    "clientId": "${GMAIL_CLIENT_ID}",
    "clientSecret": "${GMAIL_CLIENT_SECRET}"
  }
}
```

:::tip Environment Substitution
Use `${VAR_NAME}` syntax to reference environment variables in config.json.
:::

## Service Management

### Basic Commands

```bash
# Start service
sudo systemctl start emailengine

# Stop service
sudo systemctl stop emailengine

# Restart service
sudo systemctl restart emailengine

# Reload configuration (if supported)
sudo systemctl reload emailengine

# Check status
sudo systemctl status emailengine

# Enable auto-start on boot
sudo systemctl enable emailengine

# Disable auto-start
sudo systemctl disable emailengine
```

### Check Service Status

```bash
# Detailed status
sudo systemctl status emailengine

# Check if running
sudo systemctl is-active emailengine

# Check if enabled
sudo systemctl is-enabled emailengine

# Show service properties
sudo systemctl show emailengine
```

**Example status output:**

```
● emailengine.service - EmailEngine Email API Service
   Loaded: loaded (/etc/systemd/system/emailengine.service; enabled; vendor preset: enabled)
   Active: active (running) since Mon 2025-10-13 10:00:00 UTC; 2h 30min ago
     Docs: https://emailengine.app
 Main PID: 12345 (node)
    Tasks: 15 (limit: 4915)
   Memory: 512.5M (limit: 2.0G)
   CGroup: /system.slice/emailengine.service
           └─12345 /usr/bin/node /usr/local/bin/emailengine --config=/etc/emailengine/config.json
```

## Log Management

### View Logs with Journalctl

```bash
# View recent logs
sudo journalctl -u emailengine

# Follow logs in real-time
sudo journalctl -u emailengine -f

# View logs from last boot
sudo journalctl -u emailengine -b

# View logs from specific time
sudo journalctl -u emailengine --since "2025-10-13 10:00:00"
sudo journalctl -u emailengine --since "1 hour ago"

# View last 100 lines
sudo journalctl -u emailengine -n 100

# View logs with priority (errors only)
sudo journalctl -u emailengine -p err

# Export logs to file
sudo journalctl -u emailengine > emailengine.log
```

### Log Rotation

**SystemD automatically rotates journal logs**, but you can configure retention:

Edit `/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=1G
SystemMaxFileSize=100M
MaxRetentionSec=7day
```

**Apply changes:**
```bash
sudo systemctl restart systemd-journald
```

### File-Based Logging

**Configure in config.json:**

```json
{
  "log": {
    "level": "info",
    "file": "/var/log/emailengine/app.log",
    "rotate": {
      "maxFiles": 10,
      "maxSize": "100m"
    }
  }
}
```

**Set up logrotate:**

Create `/etc/logrotate.d/emailengine`:

```
/var/log/emailengine/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 emailengine emailengine
    sharedscripts
    postrotate
        /bin/systemctl reload emailengine > /dev/null 2>&1 || true
    endscript
}
```

## Security Hardening

### Minimal Service File

```ini
[Unit]
Description=EmailEngine Email API Service
After=network.target redis.service
Requires=redis.service

[Service]
Type=simple
User=emailengine
Group=emailengine
WorkingDirectory=/opt/emailengine
ExecStart=/usr/bin/emailengine --config=/etc/emailengine/config.json
Restart=always

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/emailengine
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

# Capabilities
CapabilityBoundingSet=
AmbientCapabilities=

# System calls
SystemCallFilter=@system-service
SystemCallFilter=~@privileged @resources
SystemCallErrorNumber=EPERM

[Install]
WantedBy=multi-user.target
```

### File Permissions

```bash
# Service file
sudo chmod 644 /etc/systemd/system/emailengine.service

# Configuration files (secrets)
sudo chmod 640 /etc/emailengine/config.json
sudo chown root:emailengine /etc/emailengine/config.json

# Environment file (secrets)
sudo chmod 640 /etc/emailengine/environment
sudo chown root:emailengine /etc/emailengine/environment

# Log directory
sudo chmod 750 /var/log/emailengine
sudo chown emailengine:emailengine /var/log/emailengine
```

### Resource Limits

**CPU limits:**
```ini
[Service]
CPUQuota=200%          # Max 2 CPU cores
CPUWeight=100          # Priority (1-10000)
```

**Memory limits:**
```ini
[Service]
MemoryLimit=2G         # Hard limit
MemoryHigh=1.5G        # Soft limit (throttling)
```

**File descriptor limits:**
```ini
[Service]
LimitNOFILE=65536      # Max open files
LimitNPROC=512         # Max processes
```

**IO limits:**
```ini
[Service]
IOWeight=500           # IO priority
IOReadBandwidthMax=/var 10M
IOWriteBandwidthMax=/var 10M
```

## Advanced Configuration

### Multiple Instances

Run multiple EmailEngine instances on different ports:

**Instance 1:** `/etc/systemd/system/emailengine@3001.service`

```ini
[Unit]
Description=EmailEngine Instance on port %i
After=network.target redis.service

[Service]
Type=simple
User=emailengine
ExecStart=/usr/bin/emailengine --port=%i
Restart=always

[Install]
WantedBy=multi-user.target
```

**Start instances:**
```bash
sudo systemctl start emailengine@3001
sudo systemctl start emailengine@3002
sudo systemctl enable emailengine@3001
sudo systemctl enable emailengine@3002
```

### Dependency Management

**Start after Redis:**

```ini
[Unit]
After=redis.service
Requires=redis.service
```

**Wait for network:**

```ini
[Unit]
After=network-online.target
Wants=network-online.target
```

**Start after file system:**

```ini
[Unit]
After=local-fs.target
RequiresMountsFor=/var/log/emailengine
```

### Graceful Shutdown

**Configure timeout:**

```ini
[Service]
TimeoutStopSec=30      # Wait 30s before SIGKILL
KillMode=mixed         # SIGTERM to main, then SIGKILL
```

**Pre-stop script:**

```ini
[Service]
ExecStop=/usr/local/bin/emailengine-stop.sh
```

**Create `/usr/local/bin/emailengine-stop.sh`:**

```bash
#!/bin/bash
# Notify monitoring system
curl -X POST https://monitor.example.com/emailengine/stopping

# Allow connections to drain
sleep 5
```

## Monitoring and Health Checks

### SystemD Health Checks

**Configure watchdog:**

```ini
[Service]
WatchdogSec=60
Restart=on-watchdog
```

**Check health endpoint:**

Create `/usr/local/bin/emailengine-health.sh`:

```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$response" = "200" ]; then
    exit 0
else
    exit 1
fi
```

**Add to service:**

```ini
[Service]
ExecStartPost=/usr/local/bin/emailengine-health.sh
```

### Monitoring Commands

```bash
# CPU and memory usage
sudo systemctl status emailengine | grep -E 'CPU|Memory'

# Detailed resource usage
sudo systemd-cgtop

# Service failures
sudo systemctl list-units --failed

# Restart count
sudo systemctl show emailengine -p NRestarts
```

### Integration with Monitoring Tools

**Prometheus metrics:**

```ini
[Service]
Environment="EENGINE_METRICS_SERVER=true"
Environment="EENGINE_METRICS_PORT=9090"
```

**Export logs to external system:**

```bash
# Forward to syslog
sudo journalctl -u emailengine -f | logger -t emailengine

# Forward to Logstash
sudo journalctl -u emailengine -f -o json | \
  netcat logstash.example.com 5000
```

## Troubleshooting

### Service Won't Start

**Check service status:**
```bash
sudo systemctl status emailengine -l
```

**View detailed logs:**
```bash
sudo journalctl -u emailengine -n 100 --no-pager
```

**Common issues:**

1. **Redis not running**
   ```
   Error: Redis connection failed
   ```
   **Solution:**
   ```bash
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

2. **Permission denied**
   ```
   Error: EACCES: permission denied
   ```
   **Solution:** Check file permissions and user/group ownership.

3. **Port already in use**
   ```
   Error: EADDRINUSE :::3000
   ```
   **Solution:** Find and kill process using port:
   ```bash
   sudo lsof -i :3000
   sudo kill <PID>
   ```

4. **Configuration file not found**
   ```
   Error: Cannot find module '/etc/emailengine/config.json'
   ```
   **Solution:** Create config file or fix path in service file.

### Service Keeps Restarting

**Check restart count:**
```bash
sudo systemctl show emailengine -p NRestarts
```

**View crash logs:**
```bash
sudo journalctl -u emailengine --since "10 minutes ago"
```

**Disable auto-restart temporarily:**
```bash
sudo systemctl edit emailengine
```

Add:
```ini
[Service]
Restart=no
```

### High Memory Usage

**Check memory usage:**
```bash
sudo systemctl status emailengine | grep Memory
```

**Set memory limit:**
```ini
[Service]
MemoryLimit=2G
MemoryHigh=1.5G
```

**Apply changes:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart emailengine
```

### Slow Performance

**Check resource limits:**
```bash
sudo systemctl show emailengine | grep -E 'CPU|Memory|Limit'
```

**Increase workers:**
```bash
# Edit environment file
sudo nano /etc/emailengine/environment

# Add or modify
EENGINE_WORKERS=8
```

**Restart service:**
```bash
sudo systemctl restart emailengine
```

## Updates and Maintenance

### Update EmailEngine

```bash
# Stop service
sudo systemctl stop emailengine

# Update package
sudo npm update -g emailengine

# Or install specific version
sudo npm install -g emailengine@2.48.5

# Reload systemd (if service file changed)
sudo systemctl daemon-reload

# Start service
sudo systemctl start emailengine

# Verify version
emailengine --version
```

### Backup Configuration

```bash
# Backup configuration files
sudo tar czf emailengine-config-$(date +%Y%m%d).tar.gz \
  /etc/emailengine/ \
  /etc/systemd/system/emailengine.service

# Backup Redis data
sudo cp /var/lib/redis/dump.rdb /backup/
```

### Service File Changes

```bash
# Edit service file
sudo systemctl edit --full emailengine

# Or manually edit
sudo nano /etc/systemd/system/emailengine.service

# Reload systemd
sudo systemctl daemon-reload

# Restart service
sudo systemctl restart emailengine
```

## Complete Example

### Production Setup

**1. Install dependencies:**
```bash
sudo apt update
sudo apt install -y nodejs npm redis-server
sudo npm install -g emailengine
```

**2. Create user and directories:**
```bash
sudo useradd --system --home /opt/emailengine --shell /bin/false emailengine
sudo mkdir -p /etc/emailengine /var/log/emailengine
sudo chown emailengine:emailengine /var/log/emailengine
```

**3. Create configuration:**
```bash
sudo tee /etc/emailengine/environment > /dev/null <<EOF
EENGINE_REDIS=redis://localhost:6379
EENGINE_SECRET=$(openssl rand -hex 32)
EENGINE_ENCRYPTION_SECRET=$(openssl rand -hex 32)
EENGINE_WORKERS=4
EENGINE_LOG_LEVEL=info
EOF

sudo chown root:emailengine /etc/emailengine/environment
sudo chmod 640 /etc/emailengine/environment
```

**4. Create service file:**
```bash
sudo tee /etc/systemd/system/emailengine.service > /dev/null <<'EOF'
[Unit]
Description=EmailEngine Email API Service
After=network.target redis.service
Requires=redis.service

[Service]
Type=simple
User=emailengine
Group=emailengine
WorkingDirectory=/opt/emailengine
EnvironmentFile=/etc/emailengine/environment
ExecStart=/usr/local/bin/emailengine
Restart=always
RestartSec=10

StandardOutput=journal
StandardError=journal
SyslogIdentifier=emailengine

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/emailengine

LimitNOFILE=65536
MemoryLimit=2G

[Install]
WantedBy=multi-user.target
EOF
```

**5. Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable emailengine
sudo systemctl start emailengine
sudo systemctl status emailengine
```

**6. Verify:**
```bash
curl http://localhost:3000/health
```

## See Also

- [Installation Guide](/docs/installation/set-up)
- [Docker Deployment](/docs/deployment/docker)
- [Nginx Proxy Setup](/docs/deployment/nginx-proxy)
- [Security Guide](/docs/deployment/security)
- [Configuration Options](/docs/configuration)
- [Logging Configuration](/docs/advanced/logging)
