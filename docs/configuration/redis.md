---
title: Redis Configuration
description: Redis configuration requirements, connection settings, and performance tuning
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Redis Configuration

EmailEngine requires Redis as its primary data store for mailbox indexes, OAuth credentials, job queues, and webhook events. This guide covers how to configure Redis for EmailEngine and optimize its performance.

## Connecting EmailEngine to Redis

### Connection String Format

EmailEngine connects to Redis using a connection string specified via the `EENGINE_REDIS` environment variable or `--dbs.redis` command-line argument.

**Format:**
```
redis://[[username:]password@]host[:port][/database]
```

**Examples:**

```bash
# Local Redis (default port 6379, database 0)
EENGINE_REDIS="redis://localhost:6379"

# Local Redis with database 8
EENGINE_REDIS="redis://localhost:6379/8"

# Remote Redis with password
EENGINE_REDIS="redis://:mypassword@redis.example.com:6379"

# Redis with username and password (Redis 6+)
EENGINE_REDIS="redis://admin:mypassword@redis.example.com:6379"

# Redis over TLS
EENGINE_REDIS="rediss://redis.example.com:6380"
```

### Deployment Examples

<Tabs groupId="deployment-platform">
<TabItem value="docker" label="Docker Compose">

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory-policy noeviction
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  emailengine:
    image: postalsys/emailengine:latest
    environment:
      - EENGINE_REDIS=redis://redis:6379
      - EENGINE_HOST=0.0.0.0
      - EENGINE_PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
```

</TabItem>
<TabItem value="kubernetes" label="Kubernetes">

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: emailengine-config
data:
  EENGINE_REDIS: "redis://redis-service:6379"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emailengine
spec:
  replicas: 1
  selector:
    matchLabels:
      app: emailengine
  template:
    metadata:
      labels:
        app: emailengine
    spec:
      containers:
      - name: emailengine
        image: postalsys/emailengine:latest
        envFrom:
        - configMapRef:
            name: emailengine-config
        ports:
        - containerPort: 3000
```

</TabItem>
<TabItem value="env" label="Environment Variable">

```bash
# .env file
EENGINE_REDIS="redis://localhost:6379"

# Or command line
export EENGINE_REDIS="redis://localhost:6379"
emailengine
```

</TabItem>
<TabItem value="cli" label="CLI Argument">

```bash
# Start with CLI argument
emailengine --dbs.redis="redis://localhost:6379"

# With password
emailengine --dbs.redis="redis://:mypassword@redis.example.com:6379"
```

</TabItem>
</Tabs>

### Connection Options

For advanced Redis configurations, you can pass connection options as query parameters:

```bash
# Connect with TLS
EENGINE_REDIS="rediss://redis.example.com:6380"

# Specify IPv4 or IPv6
EENGINE_REDIS="redis://redis.example.com:6379?family=4"  # Force IPv4
EENGINE_REDIS="redis://redis.example.com:6379?family=6"  # Force IPv6
```

## Required Redis Configuration

EmailEngine requires specific Redis settings to function correctly.

### Memory Eviction Policy (Required)

EmailEngine requires that all keys remain in memory. Set the eviction policy to `noeviction`:

```ini
maxmemory-policy noeviction
```

**Why this matters:** If Redis evicts mailbox indexes or OAuth tokens, EmailEngine must resynchronize entire mailboxes, which is expensive and time-consuming.

**Verification:**
```bash
redis-cli CONFIG GET maxmemory-policy
```

**Set at runtime:**
```bash
redis-cli CONFIG SET maxmemory-policy noeviction
```

**Alternative (if memory limits required):** Use a `volatile-*` policy so only keys with TTL are evicted:
```ini
maxmemory-policy volatile-lru
```

**Never use:** `allkeys-*` policies, as they may evict critical mailbox data.

### Persistence Configuration (Recommended)

Enable persistence to prevent data loss on Redis restarts.

<Tabs groupId="redis-persistence">
<TabItem value="rdb" label="RDB Snapshots (Recommended)">

```ini
# Save after 1 change in 15 minutes
save 900 1

# Save after 10 changes in 5 minutes
save 300 10

# Save after 10000 changes in 1 minute
save 60 10000
```

**Verification:**
```bash
redis-cli CONFIG GET save
```

</TabItem>
<TabItem value="aof" label="Append-Only File">

```ini
appendonly yes
appendfsync everysec
```

**Verification:**
```bash
redis-cli CONFIG GET appendonly
redis-cli CONFIG GET appendfsync
```

</TabItem>
<TabItem value="both" label="Both (Maximum Safety)">

```ini
# RDB snapshots
save 900 1
save 300 10
save 60 10000

# AOF
appendonly yes
appendfsync everysec
```

**Verification:**
```bash
redis-cli CONFIG GET save
redis-cli CONFIG GET appendonly
```

</TabItem>
</Tabs>

### TCP Keep-Alive (Recommended)

Configure TCP keep-alive to maintain long-lived Pub/Sub connections:

```ini
tcp-keepalive 300
```

**Why this matters:** EmailEngine uses Redis Pub/Sub for real-time updates. Without keep-alive, NAT devices or load balancers may silently drop idle connections.

## Redis Configuration File Example

Create a `redis.conf` file with EmailEngine-optimized settings:

```ini
# Bind to all interfaces (adjust for security)
bind 0.0.0.0

# Port
port 6379

# Memory limit (adjust based on your needs)
maxmemory 2gb

# Eviction policy - REQUIRED for EmailEngine
maxmemory-policy noeviction

# Persistence - RDB snapshots
save 900 1
save 300 10
save 60 10000

# Persistence - AOF (optional, choose RDB or AOF)
appendonly yes
appendfsync everysec

# TCP keep-alive
tcp-keepalive 300

# Log level
loglevel notice

# Log file
logfile /var/log/redis/redis.log

# Working directory
dir /var/lib/redis
```

**Start Redis with config file:**
```bash
redis-server /etc/redis/redis.conf
```

## Testing Redis Connection

### From Command Line

```bash
# Test basic connectivity
redis-cli -h localhost -p 6379 ping
# Expected: PONG

# Test with password
redis-cli -h localhost -p 6379 -a mypassword ping

# Check EmailEngine keys
redis-cli -h localhost -p 6379 --scan --pattern "ee:*" | head -10
```

### From EmailEngine

Check the EmailEngine logs on startup:

```
[2025-01-15 10:30:45] INFO: Redis connection established
[2025-01-15 10:30:45] INFO: Redis info: redis_version=7.0.5, used_memory_human=45.2M
```

**If connection fails:**
```
[2025-01-15 10:30:45] ERROR: Failed to connect to Redis: ECONNREFUSED
```

Check:
1. Redis is running: `redis-cli ping`
2. Connection string is correct
3. Firewall allows connection
4. Redis is bound to correct interface

## Data Stored in Redis

EmailEngine stores the following data in Redis:

| Data Type | Key Pattern | Purpose | Size Impact |
|-----------|-------------|---------|-------------|
| Mailbox indexes | `ee:account:{id}:mailbox:*` | Message UIDs and flags | 1-2 MiB per account |
| OAuth tokens | `ee:account:{id}:oauth` | Access and refresh tokens | ~1 KiB per account |
| Webhook queue | `ee:webhook:queue` | Pending webhook deliveries | Varies by queue depth |
| Outbox queue | `ee:account:{id}:outbox:*` | Pending email sends | Varies by queue depth |
| Account metadata | `ee:account:{id}:meta` | Account configuration | ~2 KiB per account |
| Session data | `ee:session:*` | Web UI sessions | ~500 bytes per session |

**View EmailEngine keys:**
```bash
# Count total EmailEngine keys
redis-cli --scan --pattern "ee:*" | wc -l

# View key types
redis-cli --scan --pattern "ee:*" | head -20 | xargs redis-cli TYPE

# Check memory usage
redis-cli INFO memory
```

## General Redis Overview

### Why Redis is Required

EmailEngine stores mailbox indexes, OAuth credentials, job queues, and webhook events in Redis. Performance and data consistency therefore depend directly on the health and configuration of Redis. Treat Redis as a primary operational database, not as a transient cache.

### Redis Deployment Considerations

#### Minimize Network Latency

Maintain a TCP round-trip time (RTT) below **5 ms**, preferably below **1 ms**.

- Deploy Redis and EmailEngine in the same **availability zone** or **local network segment**
- Avoid Internet-facing or cross-region endpoints
- Measure RTT with:

```bash
redis-cli --latency --raw -h <redis-host>
```

#### Memory Sizing Guidelines

**Baseline calculation:**

Allocate **1–2 MiB of RAM per mailbox**. The dominant factor is the count of message UIDs, not the aggregate mailbox size.

**Provisioning rule:**

Provision at least **2×** the calculated baseline and ensure normal utilization remains below **80%**. The additional capacity accommodates:

1. Copy-on-write memory during RDB snapshots
2. Short-lived workload spikes (for example, large webhook bursts)

**Example calculations:**

| Accounts | Base RAM | Provisioned RAM | Max Usage Target |
|----------|----------|-----------------|------------------|
| 100 | 100-200 MiB | 400 MiB | 320 MiB (80%) |
| 1,000 | 1-2 GiB | 4 GiB | 3.2 GiB (80%) |
| 10,000 | 10-20 GiB | 40 GiB | 32 GiB (80%) |

#### Backups

Back up `dump.rdb` (or `appendonly.aof`) regularly - daily or more frequently, depending on your recovery objectives.

**Backup script example:**
```bash
#!/bin/bash
# Backup Redis data
BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Trigger RDB snapshot
redis-cli BGSAVE

# Wait for save to complete
while [ $(redis-cli LASTSAVE) -eq $LASTSAVE ]; do
  sleep 1
done

# Copy snapshot
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/dump-$DATE.rdb"

# Keep last 7 days
find "$BACKUP_DIR" -name "dump-*.rdb" -mtime +7 -delete
```

## Redis Performance Tuning

### Persistence Performance

**RDB Snapshots:**
- Lower overhead than AOF
- Can cause brief performance dips during save
- Recovery point objective (RPO) limited by save frequency

**Append-Only File (AOF):**
- Better RPO (up to 1 second with `appendfsync everysec`)
- Higher I/O overhead
- Only enable if storage can sustain **10,000+ IOPS**

**Verify current settings:**
```bash
redis-cli CONFIG GET appendonly
redis-cli CONFIG GET appendfsync
redis-cli CONFIG GET save
```

### Memory Optimization

**Check memory usage:**
```bash
redis-cli INFO memory
```

**Key metrics to monitor:**
- `used_memory_human` - Current memory usage
- `used_memory_peak_human` - Peak memory usage
- `mem_fragmentation_ratio` - Should be between 1.0-1.5

**If fragmentation is high (>1.5):**
```bash
# Restart Redis to defragment (requires downtime)
redis-cli SHUTDOWN SAVE
redis-server /etc/redis/redis.conf
```

### Connection Pooling

EmailEngine maintains persistent connections to Redis. Monitor connection count:

```bash
redis-cli CLIENT LIST | wc -l
```

**Normal connection count:** 2-5 connections per EmailEngine instance

**If connections are excessive:**
- Check for connection leaks
- Verify EmailEngine isn't restarting frequently
- Review application logs

## Managed Redis Services

### Compatibility Matrix

| Service | Status | Notes |
|---------|--------|-------|
| **Upstash Redis** | Supported with constraints | 1 MB command size limit affects large MIME blobs; free tier quotas are insufficient; must be located in the same cloud region |
| **Amazon ElastiCache** | Partially supported | Operates in stand-alone mode, but data may be lost on node replacement unless Multi-AZ persistence is enabled |
| **Azure Cache for Redis** | Supported | Use Basic, Standard, or Premium tier; verify persistence is enabled |
| **Google Cloud Memorystore** | Supported | Use Standard tier with replication for high availability |
| **Redis Cloud** | Supported | Native Redis service; ensure persistence and eviction policy are configured |
| **Memurai** | Experimental | Passes basic tests on Windows; no long-term performance data |
| **Dragonfly** | Experimental | Requires `--default_lua_flags=allow-undeclared-keys`; validate against production workloads |
| **KeyDB** | Experimental | Multi-threaded fork of Redis; monitor replication lag and memory stability |

**Unsupported:** Redis Cluster is incompatible with EmailEngine's Lua scripts that reference dynamic keys. Use a single Redis instance with persistence enabled.

### Service-Specific Configuration

<Tabs groupId="redis-service">
<TabItem value="upstash" label="Upstash Redis">

```bash
# Upstash connection string format
EENGINE_REDIS="rediss://:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379"
```

**Limitations:**
- 1 MB command size limit (affects large attachments in outbox)
- Free tier: 10,000 commands/day is insufficient for production
- Requires same-region deployment to minimize latency

</TabItem>
<TabItem value="elasticache" label="Amazon ElastiCache">

```bash
# ElastiCache connection string
EENGINE_REDIS="redis://master.your-cluster.cache.amazonaws.com:6379"
```

**Important:** Enable Multi-AZ with automatic failover for data persistence.

**Configuration checklist:**
- ✅ Enable automatic backups
- ✅ Enable Multi-AZ replication
- ✅ Set eviction policy to `noeviction`
- ✅ Deploy in same VPC as EmailEngine
- ✅ Configure security groups to allow EmailEngine access

</TabItem>
<TabItem value="azure" label="Azure Cache for Redis">

```bash
# Azure Redis connection string
EENGINE_REDIS="rediss://:YOUR_ACCESS_KEY@your-cache.redis.cache.windows.net:6380"
```

**Recommended tier:** Standard or Premium (not Basic, which lacks persistence)

**Configuration:**
- Enable data persistence (RDB or AOF)
- Set eviction policy to `noeviction`
- Enable TLS (port 6380)
- Configure firewall rules

</TabItem>
<TabItem value="gcp" label="Google Cloud Memorystore">

```bash
# Memorystore connection string
EENGINE_REDIS="redis://10.0.0.3:6379"
```

**Recommended tier:** Standard tier with replication

**Configuration:**
- Use Standard tier (not Basic)
- Enable high availability
- Configure VPC peering with EmailEngine
- Set eviction policy to `noeviction`

</TabItem>
<TabItem value="redis-cloud" label="Redis Cloud">

```bash
# Redis Cloud connection string
EENGINE_REDIS="redis://:YOUR_PASSWORD@redis-12345.c1.region.cloud.redislabs.com:12345"
```

**Configuration:**
- Ensure persistence is enabled
- Set eviction policy to `noeviction`
- Enable TLS if required
- Monitor memory usage

</TabItem>
</Tabs>

## Monitoring Redis Health

### Key Metrics to Monitor

**Memory:**
```bash
redis-cli INFO memory | grep used_memory_human
redis-cli INFO memory | grep mem_fragmentation_ratio
```

**Performance:**
```bash
redis-cli INFO stats | grep instantaneous_ops_per_sec
redis-cli --latency-history -i 1
```

**Persistence:**
```bash
redis-cli INFO persistence | grep rdb_last_save_time
redis-cli INFO persistence | grep aof_enabled
```

**Connections:**
```bash
redis-cli INFO clients | grep connected_clients
```

### Alert Thresholds

Set up monitoring alerts for:

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory usage | > 70% | > 85% |
| Memory fragmentation | > 1.5 | > 2.0 |
| Latency (p99) | > 10ms | > 50ms |
| Persistence lag | > 60s | > 300s |
| Connected clients | > 1000 | > 5000 |

### EmailEngine Redis Metrics

EmailEngine exposes Redis metrics via Prometheus endpoint (if enabled):

```
# EmailEngine Redis connection status
emailengine_redis_connected 1

# EmailEngine Redis command duration
emailengine_redis_command_duration_seconds{command="get"} 0.002
```

## Quick Reference

**TL;DR:** Deploy Redis in the same data center as EmailEngine, allocate sufficient memory and durable storage, and set the memory policy to **noeviction**. Otherwise queued webhooks and mailbox indexes are at risk.

### Essential Configuration Checklist

- ✅ Set `maxmemory-policy noeviction`
- ✅ Enable persistence (RDB or AOF)
- ✅ Set `tcp-keepalive 300`
- ✅ Deploy in same region/zone as EmailEngine
- ✅ Provision 2× base memory (1-2 MiB per account)
- ✅ Keep memory usage below 80%
- ✅ Configure regular backups
- ✅ Monitor latency (target < 5ms)
- ✅ Avoid Redis Cluster (not supported)

### Connection String Quick Reference

```bash
# Local
redis://localhost:6379

# Remote with password
redis://:password@host:6379

# Remote with TLS
rediss://:password@host:6380

# With database number
redis://host:6379/8
```
