---
title: Performance Tuning
sidebar_position: 1
description: Optimize EmailEngine performance for production workloads with proper configuration and scaling strategies
---

# Performance Tuning

Learn how to optimize EmailEngine for production workloads by tuning worker threads, Redis configuration, and implementing scaling strategies.

**Source**: [Performance Tuning](https://emailengine.app/blog/tuning-performance) (September 6, 2025)

## Overview

When you start with EmailEngine and only have a handful of test accounts, a modest server with default configuration is usually enough. As your usage grows, however, you'll want to review both your hardware and your EmailEngine configuration.

### Rule of Thumb

- **Waiting mainly for webhooks?** A smaller server is fine
- **Issuing many API calls?** Provision more CPU/RAM and tune settings

This guide walks through the main configuration options that affect performance and how to pick sensible values.

## IMAP Configuration

### Worker Threads

EmailEngine spawns a fixed pool of worker threads to keep IMAP sessions alive.

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS` | `4` | Number of IMAP worker threads |

**How it works**: If you have 100 accounts and `EENGINE_WORKERS=4`, each thread handles ~25 accounts.

**Tuning guideline**: On a machine with many CPU cores (or VPS with several vCPUs), you can safely raise this value so that each core has fewer accounts to juggle.

**Example**:
```bash
# 8-core server with 400 accounts
EENGINE_WORKERS=8  # Each thread handles ~50 accounts
```

### Connection Setup Delay

Opening TCP connections and running IMAP handshakes is CPU-intensive. Doing this for hundreds or thousands of accounts at once can spike CPU usage and even trigger the host's OOM-killer.

**Solution**: Use an artificial delay so EmailEngine brings accounts online one-by-one.

```bash
EENGINE_CONNECTION_SETUP_DELAY=3s   # 3 second delay between connections
```

**Impact calculation**:
- With 3s delay and 1,000 accounts: Full warm-up takes ~50 minutes
- This is perfectly fine if you're only waiting for webhooks
- API requests for an account will fail until that account is connected

**Recommendation**:
- Small deployments (< 100 accounts): 1-2s
- Medium deployments (100-1000 accounts): 3-5s
- Large deployments (> 1000 accounts): 5-10s

### Sub-Connections for Selected Folders

If you need near real-time updates for specific folders (e.g., Inbox and Sent), enable **sub-connections**:

```json
{
  "account": "user@example.com",
  "subconnections": ["\\Sent"]
}
```

**How it works**:
- EmailEngine opens a second TCP connection dedicated to that folder
- Main connection still polls the rest of the mailbox
- Sub-connection fires webhooks instantly for the selected folder
- Saves both CPU and network traffic

**Benefits**:
- Instant notifications for critical folders
- Reduced polling overhead
- Lower latency for important emails

**Considerations**:
- Each sub-connection uses one parallel IMAP session
- Most servers limit parallel connections (typically 3-5)
- Only use for folders you genuinely need instant updates

### Limiting Indexed Folders

If you never care about the rest of the mailbox, limit indexing completely:

```json
{
  "account": "user@example.com",
  "path": ["INBOX", "\\Sent"],
  "subconnections": ["\\Sent"]
}
```

With this configuration, EmailEngine ignores every other folder, significantly reducing resource usage.

**Use case**: Support systems that only need Inbox and Sent Mail.

## Webhook Configuration

EmailEngine enqueues every event, even if webhooks are disabled. By default, the queue is processed serially by one worker.

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS_WEBHOOKS` | `1` | Number of webhook worker threads |
| `EENGINE_NOTIFY_QC` | `1` | Concurrency per worker |

**Maximum in-flight webhooks**:
```
ACTIVE_WH = EENGINE_WORKERS_WEBHOOKS × EENGINE_NOTIFY_QC
```

**Example configurations**:

```bash
# Configuration 1: Single threaded (default)
EENGINE_WORKERS_WEBHOOKS=1
EENGINE_NOTIFY_QC=1
# Result: 1 webhook at a time

# Configuration 2: Multi-threaded
EENGINE_WORKERS_WEBHOOKS=4
EENGINE_NOTIFY_QC=2
# Result: 8 concurrent webhooks

# Configuration 3: High concurrency
EENGINE_WORKERS_WEBHOOKS=8
EENGINE_NOTIFY_QC=4
# Result: 32 concurrent webhooks
```

**Important**: Ensure your webhook handler can cope with events arriving out-of-order if you raise either value.

### Webhook Handler Best Practices

**Keep the handler tiny**: Ideally it writes the payload to an internal queue (Kafka, SQS, Postgres, etc.) in a few milliseconds and returns `2xx`, leaving the heavy lifting to downstream workers.

**Benefits**:
- Predictable EmailEngine Redis memory usage
- Fast webhook processing
- Better error handling
- Easier to scale processing independently

**Example lightweight handler**:

```javascript
// Express.js webhook endpoint
app.post('/webhook', async (req, res) => {
  // Return 2xx immediately
  res.status(200).send('OK');

  // Queue for background processing
  await redis.lpush('webhook_queue', JSON.stringify(req.body));
});

// Separate worker processes the queue
async function processWebhookQueue() {
  while (true) {
    const payload = await redis.brpop('webhook_queue', 0);
    await heavyProcessing(payload);
  }
}
```

## Email Sending Configuration

Queued messages live in Redis, so RAM usage scales with the size and number of messages. Like webhooks, email submissions are handled by a worker pool:

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS_SUBMIT` | `1` | Number of submission worker threads |
| `EENGINE_SUBMIT_QC` | `1` | Concurrency per worker |

**Maximum concurrent submissions**:
```
ACTIVE_SUBMIT = EENGINE_WORKERS_SUBMIT × EENGINE_SUBMIT_QC
```

**Example configurations**:

```bash
# Low volume (default)
EENGINE_WORKERS_SUBMIT=1
EENGINE_SUBMIT_QC=1
# Result: 1 email sending at a time

# Medium volume
EENGINE_WORKERS_SUBMIT=2
EENGINE_SUBMIT_QC=2
# Result: 4 concurrent email sends

# High volume
EENGINE_WORKERS_SUBMIT=4
EENGINE_SUBMIT_QC=4
# Result: 16 concurrent email sends
```

**Important**: Be conservative when increasing `EENGINE_SUBMIT_QC`. Each active submission loads the full RFC 822 message into the worker's heap.

**Memory impact**: With average email size of 1MB and `EENGINE_SUBMIT_QC=16`, you need at least 16MB heap just for active submissions.

## Redis Optimization

Redis is critical for EmailEngine performance. Follow these best practices:

### 1. Minimize Latency

**Keep Redis and EmailEngine in the same availability zone or LAN**:
- Same datacenter: < 1ms latency
- Same region: < 5ms latency
- Cross-region: 50-200ms latency (not recommended)

**Impact**: With 1000 accounts and cross-region Redis, you'll see significant performance degradation.

### 2. Provision Enough RAM

**Aim for < 80% memory usage** in normal operation with 2× headroom for snapshots.

**Storage budget**: Plan for **1-2 MB per account** (more for very large mailboxes).

**Example calculations**:
- 100 accounts: 100-200 MB
- 1,000 accounts: 1-2 GB
- 10,000 accounts: 10-20 GB

**Redis configuration**:
```bash
# redis.conf
maxmemory 4gb
maxmemory-policy noeviction  # or volatile-* policy
```

### 3. Enable Persistence

**RDB Snapshots**: Enable for data durability
```bash
# redis.conf
save 900 1      # Save if 1 key changes in 15 minutes
save 300 10     # Save if 10 keys change in 5 minutes
save 60 10000   # Save if 10000 keys change in 1 minute
```

**AOF (Append Only File)**: Enable only if you have very fast disks
```bash
# redis.conf
appendonly yes
appendfsync everysec  # Good balance of safety and performance
```

**Recommendation**: Start with RDB only, add AOF if you need better durability guarantees.

### 4. Set Eviction Policy

**Critical**: Never use `allkeys-*` eviction policies. EmailEngine needs all data.

```bash
# redis.conf
maxmemory-policy noeviction  # Recommended
# or
maxmemory-policy volatile-lru  # If you use TTLs
```

**Why**: `allkeys-lru` or `allkeys-random` will evict critical account data, causing failures.

### 5. TCP Keep-Alive

Leave the default value. Setting to `0` (disabling keep-alive) may lead to half-open TCP connections.

```bash
# redis.conf
tcp-keepalive 300  # Default, recommended
```

### Redis-Compatible Alternatives

| Provider/Project | Compatible | Caveats |
|-----------------|------------|---------|
| **Upstash Redis** | ✅ Yes | 1 MB command size limit – large attachments cannot be queued. Locate EmailEngine in same GCP/AWS region. |
| **AWS ElastiCache** | ⚠️ Technically | Treats itself as a cache; data loss on restarts. **Not recommended**. |
| **Memurai** | ✅ Yes | Tested only in staging. |
| **Dragonfly** | ✅ Yes | Start with `--default_lua_flags=allow-undeclared-keys`. |
| **KeyDB** | ✅ Yes | Tested only in staging. |

## Complete Configuration Example

Here's a production-ready configuration for a medium deployment (500 accounts):

```bash
# config.env

# Server
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000

# Redis
REDIS_URL=redis://redis.internal:6379
REDIS_PREFIX=ee

# IMAP Workers
EENGINE_WORKERS=8                      # 8 worker threads
EENGINE_CONNECTION_SETUP_DELAY=3s      # 3 second startup delay

# Webhook Processing
EENGINE_WORKERS_WEBHOOKS=4             # 4 webhook workers
EENGINE_NOTIFY_QC=2                    # 2 concurrent per worker
                                       # = 8 total concurrent webhooks

# Email Sending
EENGINE_WORKERS_SUBMIT=2               # 2 submission workers
EENGINE_SUBMIT_QC=2                    # 2 concurrent per worker
                                       # = 4 total concurrent sends

# Security
EENGINE_SECRET=your-encryption-secret-here

# Logging
EENGINE_LOG_LEVEL=info

# Monitoring
EENGINE_METRICS_PORT=9090
```

## Horizontal Scaling

:::warning
EmailEngine does not coordinate across nodes. If multiple instances connect to the same Redis, each will attempt to sync every account independently.
:::

**Current solution**: Manual sharding

> Divide your accounts across independent EmailEngine instances.
>
> **Example**: Accounts 0-999 → Instance A, 1000-1999 → Instance B, etc.

### Sharding Strategy

**Option 1: Hash-based sharding**
```javascript
// Assign account to instance based on hash
const instanceId = hashCode(accountEmail) % NUM_INSTANCES;
```

**Option 2: Range-based sharding**
```javascript
// Assign account to instance based on ID range
if (accountId < 1000) {
  instance = 'A';
} else if (accountId < 2000) {
  instance = 'B';
} else {
  instance = 'C';
}
```

**Option 3: Domain-based sharding**
```javascript
// Assign accounts from same domain to same instance
const domain = email.split('@')[1];
const instanceId = hashCode(domain) % NUM_INSTANCES;
```

### Sharding Implementation

Each instance gets:
- Separate Redis database or prefix
- Separate configuration
- Separate monitoring

```bash
# Instance A
REDIS_PREFIX=ee-a
EENGINE_PORT=3000

# Instance B
REDIS_PREFIX=ee-b
EENGINE_PORT=3001

# Instance C
REDIS_PREFIX=ee-c
EENGINE_PORT=3002
```

Your application routes requests to appropriate instance based on account assignment.

## Monitoring and Metrics

### Key Metrics to Track

**IMAP Performance**:
- Connection success rate
- Average connection time
- IMAP errors per minute

**Webhook Performance**:
- Webhook queue depth
- Webhook processing time
- Webhook failure rate

**Email Sending**:
- Submission queue depth
- Send success rate
- Send latency

**Redis**:
- Memory usage
- Commands per second
- Latency
- Connection count

### Health Check Endpoint

```bash
curl http://localhost:3000/health

{
  "status": "ok",
  "version": "2.40.0",
  "accounts": 450,
  "connections": 448
}
```

### Prometheus Metrics

Enable Prometheus metrics:

```bash
EENGINE_METRICS_PORT=9090
```

Access metrics:
```bash
curl http://localhost:9090/metrics
```

**Read more**: [Monitoring](/docs/advanced/monitoring.md)

## Performance Troubleshooting

### High CPU Usage

**Possible causes**:
1. Too many accounts for available workers
2. Frequent account reconnections
3. Heavy API request load

**Solutions**:
```bash
# Increase workers
EENGINE_WORKERS=16

# Add connection delay
EENGINE_CONNECTION_SETUP_DELAY=5s

# Reduce API call frequency
```

### High Memory Usage

**Possible causes**:
1. Redis memory exhaustion
2. Large email queue
3. Too many concurrent operations

**Solutions**:
```bash
# Reduce submission concurrency
EENGINE_SUBMIT_QC=1

# Scale up Redis
# Reduce retention
```

### Slow Webhook Processing

**Possible causes**:
1. Webhook handler is slow
2. Not enough webhook workers
3. Network issues

**Solutions**:
```bash
# Increase webhook workers
EENGINE_WORKERS_WEBHOOKS=8
EENGINE_NOTIFY_QC=4

# Optimize webhook handler (queue-based)
```

### API Request Timeouts

**Possible causes**:
1. Account not connected yet
2. Redis latency issues
3. IMAP server slow

**Solutions**:
- Wait for account connection before API calls
- Reduce Redis latency
- Check IMAP server performance

## Best Practices Summary

1. **Start Conservative**: Begin with default settings, scale up based on actual load
2. **Monitor First**: Implement monitoring before tuning
3. **Tune Incrementally**: Change one setting at a time, measure impact
4. **Match Your Use Case**: Webhook-heavy vs API-heavy workloads need different tuning
5. **Plan for Growth**: Leave headroom for traffic spikes
6. **Keep Redis Local**: Minimize network latency to Redis
7. **Lightweight Webhooks**: Queue payloads, process asynchronously
8. **Shard When Needed**: Use horizontal scaling for very large deployments

## See Also

- [Monitoring](/docs/advanced/monitoring.md)
- [Redis Configuration](/docs/configuration/redis.md)
- [Deployment](/docs/deployment/index.md)
- [Security](/docs/deployment/security.md)

## Resources

- **Redis Documentation**: [redis.io/documentation](https://redis.io/documentation)
- **Redis Memory Optimization**: [redis.io/topics/memory-optimization](https://redis.io/topics/memory-optimization)
- **Prometheus**: [prometheus.io](https://prometheus.io/)
