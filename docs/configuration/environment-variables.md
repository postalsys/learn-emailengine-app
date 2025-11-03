---
title: Environment Variables Reference
description: Complete reference of all environment variables for configuring EmailEngine
sidebar_position: 2
---

# Environment Variables Reference

Complete reference for all EmailEngine environment variables. These settings are loaded at application startup and require a restart to take effect.

:::tip Command-Line Alternative
Every environment variable can also be set via command-line arguments using the format `--section.key=value`. For example, `EENGINE_HOST=0.0.0.0` can be set as `--api.host=0.0.0.0`. [See CLI reference →](./cli)
:::

## Quick Start

Minimal production configuration:

**Using environment variables:**
```bash
EENGINE_REDIS=redis://localhost:6379
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
```

**Using command-line arguments:**
```bash
emailengine \
  --dbs.redis="redis://localhost:6379" \
  --api.host="0.0.0.0" \
  --api.port=3000
```

[Complete CLI reference →](./cli)

## Server & Connection

Configure HTTP server and connection settings.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_HOST` | string | `127.0.0.1` | HTTP server bind address | `0.0.0.0` |
| `EENGINE_PORT` | number | `3000` | HTTP server port | `8080` |
| `PORT` | number | `3000` | Alternative to EENGINE_PORT (used by some platforms) | `8080` |
| `EENGINE_TIMEOUT` | number | `10000` | HTTP request timeout (ms) | `30000` |
| `EENGINE_API_PROXY` | boolean | `false` | Trust reverse proxy headers (X-Forwarded-For) for client IP | `true` |

[Access token management →](./access-tokens)

**Examples:**

**Public deployment:**
```bash
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
```

**Behind reverse proxy (Nginx, Apache, etc):**
```bash
EENGINE_HOST=127.0.0.1
EENGINE_PORT=3000
EENGINE_API_PROXY=true  # Trust X-Forwarded-For headers for client IP
```

## Redis

Redis database connection and configuration.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_REDIS` | string | `redis://127.0.0.1:6379` | Redis connection URL (primary) | `redis://user:pass@redis.example.com:6379/0` |
| `REDIS_URL` | string | `redis://127.0.0.1:6379` | Redis connection URL (fallback if EENGINE_REDIS not set) | `redis://localhost:6379` |
| `EENGINE_REDIS_PREFIX` | string | none | Optional key prefix for Redis keys | `{ee-prod}` |

**Connection URL Format:**
```
redis://[username:password@]host[:port][/database]
rediss://...  (with TLS)
```

**Examples:**

**Basic connection:**
```bash
EENGINE_REDIS=redis://localhost:6379
```

**With authentication:**
```bash
EENGINE_REDIS=redis://username:password@redis.example.com:6379
```

**With TLS:**
```bash
EENGINE_REDIS=rediss://redis.example.com:6380
```

**With database selection:**
```bash
EENGINE_REDIS=redis://localhost:6379/8
```

**Custom Redis key prefix:**
```bash
EENGINE_REDIS_PREFIX="{emailengine-prod}"
```

[Detailed Redis configuration →](./redis.md)

## Email Protocol Settings

Email protocol timeouts and limits.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_MAX_SIZE` | bytes | `5242880` | Max attachment size (5 MB) | `10485760` |
| `EENGINE_MAX_BODY_SIZE` | bytes | `52428800` | Max POST body size for message uploads (50 MB) | `104857600` |
| `EENGINE_MAX_SMTP_MESSAGE_SIZE` | bytes | `26214400` | Max message size for SMTP submission (25 MB) | `52428800` |
| `EENGINE_MAX_PAYLOAD_TIMEOUT` | ms | `10000` | Payload reception timeout for message uploads | `30000` |
| `EENGINE_TIMEOUT` | ms | `10000` | General timeout for operations | `30000` |
| `EENGINE_FETCH_TIMEOUT` | ms | `10000` | Timeout for HTTP fetch operations | `30000` |
| `EENGINE_IMAP_SOCKET_TIMEOUT` | ms | none | Custom socket timeout for IMAP connections | `60000` |
| `EENGINE_CONNECTION_SETUP_DELAY` | ms | `0` | Delay before setting up account connections | `5000` |
| `EENGINE_CHUNK_SIZE` | bytes | `1000000` | Download chunk size for streaming attachments (1 MB) | `5000000` |
| `EENGINE_MAX_IMAP_AUTH_FAILURE_TIME` | ms | `259200000` | Max time to wait before disabling IMAP on auth failures (3 days) | `86400000` |

**Examples:**

**High attachment limit:**
```bash
EENGINE_MAX_SIZE=20971520  # 20 MB
```

**Extended timeouts for slow servers:**
```bash
EENGINE_TIMEOUT=30000      # 30 seconds
EENGINE_FETCH_TIMEOUT=60000  # 60 seconds
```

**Delay connection setup on startup (useful for high account count):**
```bash
EENGINE_CONNECTION_SETUP_DELAY=10000  # 10 seconds
```

## Worker Threads

Control worker thread configuration for processing workload.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_WORKERS` | number | CPU count | General worker thread count | `4` |
| `EENGINE_WORKERS_SUBMIT` | number | CPU count | Worker threads for email submission | `2` |
| `EENGINE_WORKERS_WEBHOOKS` | number | CPU count | Worker threads for webhook delivery | `2` |

**Examples:**

**High-performance setup:**
```bash
EENGINE_WORKERS=8
EENGINE_WORKERS_SUBMIT=4
EENGINE_WORKERS_WEBHOOKS=4
```

**Resource-constrained environment:**
```bash
EENGINE_WORKERS=2
EENGINE_WORKERS_SUBMIT=1
EENGINE_WORKERS_WEBHOOKS=1
```

## Queue Management

Configure job queue retention and cleanup.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_QUEUE_REMOVE_AFTER` | number | `0` | Number of completed jobs to keep in queue (0 = remove immediately) | `5000` |

**Examples:**

**Keep job history (retain last 1000 completed jobs):**
```bash
EENGINE_QUEUE_REMOVE_AFTER=1000
```

**Keep extensive job history:**
```bash
EENGINE_QUEUE_REMOVE_AFTER=10000
```

## IMAP Proxy Server

Enable and configure the built-in IMAP proxy server feature.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_IMAP_PROXY_ENABLED` | boolean | `false` | Enable IMAP proxy server | `true` |
| `EENGINE_IMAP_PROXY_HOST` | string | `127.0.0.1` | IMAP proxy bind address | `0.0.0.0` |
| `EENGINE_IMAP_PROXY_PORT` | number | `9993` | IMAP proxy server port | `1993` |
| `EENGINE_IMAP_PROXY_SECRET` | string | random | IMAP proxy authentication secret | `your-secret-key` |
| `EENGINE_IMAP_PROXY_PROXY` | string | none | Proxy server for IMAP proxy connections | `socks5://proxy:1080` |

**Examples:**

**Enable IMAP proxy:**
```bash
EENGINE_IMAP_PROXY_ENABLED=true
EENGINE_IMAP_PROXY_HOST=0.0.0.0
EENGINE_IMAP_PROXY_PORT=9993
EENGINE_IMAP_PROXY_SECRET=my-secure-secret-key
```

**IMAP proxy with upstream proxy:**
```bash
EENGINE_IMAP_PROXY_ENABLED=true
EENGINE_IMAP_PROXY_PROXY=socks5://upstream-proxy:1080
```

## SMTP Submission Server

Enable and configure the built-in SMTP submission server feature.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_SMTP_ENABLED` | boolean | `false` | Enable SMTP submission server | `true` |
| `EENGINE_SMTP_HOST` | string | `127.0.0.1` | SMTP server bind address | `0.0.0.0` |
| `EENGINE_SMTP_PORT` | number | `2525` | SMTP server port | `587` |
| `EENGINE_SMTP_SECRET` | string | random | SMTP authentication secret | `your-secret-key` |
| `EENGINE_SMTP_PROXY` | string | none | Proxy server for SMTP connections | `http://proxy:8080` |

**Examples:**

**Enable SMTP submission server:**
```bash
EENGINE_SMTP_ENABLED=true
EENGINE_SMTP_HOST=0.0.0.0
EENGINE_SMTP_PORT=2525
EENGINE_SMTP_SECRET=my-secure-secret-key
```

**SMTP with upstream proxy:**
```bash
EENGINE_SMTP_ENABLED=true
EENGINE_SMTP_PROXY=http://corporate-proxy:8080
```

## TLS Configuration

Configure TLS/SSL settings for secure connections.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_TLS_MIN_VERSION` | string | `TLSv1.2` | Minimum TLS version | `TLSv1.3` |
| `EENGINE_TLS_MIN_DH_SIZE` | number | `1024` | Minimum Diffie-Hellman key size | `2048` |
| `EENGINE_TLS_CIPHERS` | string | system default | TLS cipher suite list | `TLS_AES_256_GCM_SHA384` |

**Examples:**

**Enforce TLS 1.3 only:**
```bash
EENGINE_TLS_MIN_VERSION=TLSv1.3
```

**Stronger DH parameters:**
```bash
EENGINE_TLS_MIN_DH_SIZE=2048
```

**Custom cipher suite:**
```bash
EENGINE_TLS_CIPHERS="TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256"
```

## Security & Access Control

Security settings and access restrictions.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_SECRET` | string | none | Encryption secret for credentials (required) | `your-random-secret-key` |
| `EENGINE_ADMIN_ACCESS_ADDRESSES` | string | none | Comma-separated list of IP addresses allowed to access admin interface | `192.168.1.0/24,10.0.0.1` |

**Examples:**

**Set encryption secret:**
```bash
EENGINE_SECRET=$(openssl rand -hex 32)
```

**Restrict admin access to specific IPs:**
```bash
EENGINE_ADMIN_ACCESS_ADDRESSES="192.168.1.0/24,10.0.0.1"
```

## Advanced Settings

Advanced configuration options for debugging and performance tuning.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_LOG_RAW` | boolean | `false` | Log raw IMAP protocol traffic (debug only) | `true` |
| `EENGINE_DISABLE_COMPRESSION` | boolean | `false` | Disable IMAP COMPRESS extension | `true` |
| `EENGINE_DISABLE_MESSAGE_BROWSER` | boolean | `false` | Disable web-based message browser | `true` |
| `EENGINE_CORS_ORIGIN` | string | none | CORS allowed origins (space or comma separated) | `https://app.example.com` |

**Examples:**

**Enable protocol debugging:**
```bash
EENGINE_LOG_RAW=true
EENGINE_LOG_LEVEL=trace
```

**Enable CORS for API:**
```bash
EENGINE_CORS_ORIGIN="https://app.example.com https://admin.example.com"
```

**Disable IMAP compression (for debugging):**
```bash
EENGINE_DISABLE_COMPRESSION=true
```

## Logging & Monitoring

Logging configuration and error tracking.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_LOG_LEVEL` | string | `info` | Log level (trace, debug, info, warn, error, fatal) | `debug` |
| `BUGSNAG_API_KEY` | string | none | Bugsnag API key for error tracking | `your-bugsnag-key` |
| `NODE_ENV` | string | `production` | Node.js environment | `development` |

**Log Levels:**
- `trace` - Very detailed, includes all protocol messages
- `debug` - Detailed operational information
- `info` - General operational messages (default)
- `warn` - Warning messages
- `error` - Error messages only
- `fatal` - Fatal errors only

**Examples:**

**Development/debugging:**
```bash
NODE_ENV=development
EENGINE_LOG_LEVEL=trace
```

**Production:**
```bash
NODE_ENV=production
EENGINE_LOG_LEVEL=info
```

**Enable error tracking:**
```bash
BUGSNAG_API_KEY=your-bugsnag-api-key-here
```

[Monitoring and logging →](../advanced/monitoring)

## Prepared Configuration

Pre-configured settings for automated deployments.

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `EENGINE_SETTINGS` | JSON | Pre-configured runtime settings | See below |
| `EENGINE_PREPARED_TOKEN` | string | Pre-configured API access token | `base64-encoded-token` |
| `EENGINE_PREPARED_PASSWORD` | string | Pre-configured admin password | `secure-password` |
| `EENGINE_PREPARED_LICENSE` | string | Pre-configured license key | `license-key-string` |

**Examples:**

**Prepared settings:**
```bash
EENGINE_SETTINGS='{
  "webhooks": "https://your-app.com/webhook",
  "webhookEvents": ["messageNew", "messageSent"]
}'
```

**Docker Compose (multiline):**
```yaml
environment:
  EENGINE_SETTINGS: >
    {
      "webhooks": "https://your-app.com/webhook",
      "webhookEvents": [
        "messageNew",
        "messageDeleted",
        "messageSent"
      ]
    }
```

**Prepared token:**
```bash
# Generate and export token
TOKEN=$(emailengine tokens issue -d "API Token" -s "*")
EXPORTED=$(emailengine tokens export -t $TOKEN)

EENGINE_PREPARED_TOKEN=$EXPORTED
```

**Prepared password (for admin panel):**
```bash
EENGINE_PREPARED_PASSWORD=your-secure-admin-password
```

**Prepared license:**
```bash
EENGINE_PREPARED_LICENSE=your-license-key-here
```

[Prepared configuration guide →](./prepared-settings.md)

## Complete Examples

### Minimal Production

```bash
# Required
EENGINE_REDIS=redis://localhost:6379
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000

# Recommended
EENGINE_LOG_LEVEL=info
```

### High-Performance Production

```bash
# Server
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000

# Redis
EENGINE_REDIS=redis://redis-cluster:6379
EENGINE_REDIS_PREFIX={ee-prod}

# Performance
EENGINE_WORKERS=8
EENGINE_WORKERS_SUBMIT=4
EENGINE_WORKERS_WEBHOOKS=4

# Limits
EENGINE_MAX_SIZE=20971520  # 20 MB attachments
EENGINE_TIMEOUT=30000

# Queue
EENGINE_QUEUE_REMOVE_AFTER=5000

# TLS
EENGINE_TLS_MIN_VERSION=TLSv1.3
EENGINE_TLS_MIN_DH_SIZE=2048

# Logging
EENGINE_LOG_LEVEL=info
BUGSNAG_API_KEY=your-bugsnag-key
```

### Development Setup

```bash
# Server
EENGINE_HOST=127.0.0.1
EENGINE_PORT=3001

# Redis (separate DB for dev)
EENGINE_REDIS=redis://localhost:6379/8
EENGINE_REDIS_PREFIX={ee-dev}

# Debugging
NODE_ENV=development
EENGINE_LOG_LEVEL=trace

# Relaxed limits for testing
EENGINE_MAX_SIZE=104857600  # 100 MB
EENGINE_TIMEOUT=180000
```

### Docker Compose Example

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  emailengine:
    image: postalsys/emailengine:latest
    depends_on:
      - redis
    ports:
      - "3000:3000"
    environment:
      # Server
      - EENGINE_HOST=0.0.0.0
      - EENGINE_PORT=3000

      # Redis
      - EENGINE_REDIS=redis://redis:6379
      - EENGINE_REDIS_PREFIX={ee-prod}

      # Performance
      - EENGINE_WORKERS=4
      - EENGINE_WORKERS_SUBMIT=2
      - EENGINE_WORKERS_WEBHOOKS=2

      # Settings
      - EENGINE_SETTINGS=${EENGINE_SETTINGS}

      # Credentials
      - EENGINE_PREPARED_PASSWORD=${ADMIN_PASSWORD}
      - EENGINE_PREPARED_LICENSE=${LICENSE_KEY}

      # Logging
      - EENGINE_LOG_LEVEL=info

volumes:
  redis-data:
```

### With Proxy Servers Enabled

```bash
# Server
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000

# Redis
EENGINE_REDIS=redis://localhost:6379

# IMAP Proxy
EENGINE_IMAP_PROXY_ENABLED=true
EENGINE_IMAP_PROXY_HOST=0.0.0.0
EENGINE_IMAP_PROXY_PORT=9993
EENGINE_IMAP_PROXY_SECRET=imap-proxy-secret

# SMTP Server
EENGINE_SMTP_ENABLED=true
EENGINE_SMTP_HOST=0.0.0.0
EENGINE_SMTP_PORT=2525
EENGINE_SMTP_SECRET=smtp-server-secret

# Logging
EENGINE_LOG_LEVEL=info
```

## Environment Variable to CLI Mapping

Common environment variables and their command-line equivalents:

| Environment Variable | CLI Argument | Description |
|---------------------|--------------|-------------|
| `EENGINE_REDIS` or `REDIS_URL` | `--dbs.redis` | Redis connection URL |
| `EENGINE_HOST` | `--api.host` | HTTP server bind address |
| `EENGINE_PORT` or `PORT` | `--api.port` | HTTP server port |
| `EENGINE_LOG_LEVEL` | `--log.level` | Log level |
| `EENGINE_SECRET` | `--service.secret` | Encryption secret |
| `EENGINE_WORKERS` | `--workers.imap` | IMAP worker count |
| `EENGINE_WORKERS_WEBHOOKS` | `--workers.webhooks` | Webhook worker count |
| `EENGINE_WORKERS_SUBMIT` | `--workers.submit` | Submission worker count |
| `EENGINE_MAX_SIZE` | `--api.maxSize` | Max attachment size |
| `EENGINE_TIMEOUT` | `--service.commandTimeout` | Command timeout |

**Pattern:** Most environment variables follow the pattern `EENGINE_*` → `--section.key`. To find the CLI equivalent, check the [wild-config](https://github.com/nodemailer/wild-config) documentation or use `--help`.

## See Also

- [CLI Reference](./cli) - Command-line arguments as an alternative to environment variables
- [Redis Configuration](./redis.md) - Detailed Redis setup and optimization
- [Prepared Settings](./prepared-settings.md) - Automated deployment configuration
- [Access Tokens](./access-tokens) - API authentication setup
- [Monitoring](../advanced/monitoring) - Logging and monitoring setup
