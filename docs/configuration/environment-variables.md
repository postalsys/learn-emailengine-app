---
title: Environment Variables Reference
description: Complete reference of all environment variables for configuring EmailEngine
sidebar_position: 2
---

# Environment Variables Reference

Complete reference for all EmailEngine environment variables. These settings are loaded at application startup and require a restart to take effect.

## Quick Start

Minimal production configuration:

```bash
REDIS_URL=redis://localhost:6379
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
EENGINE_SECRET=your-random-secret-at-least-32-characters
```

## Server & Connection

Configure HTTP server, public URLs, and proxy settings.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_HOST` | string | `127.0.0.1` | HTTP server bind address | `0.0.0.0` |
| `EENGINE_PORT` | number | `3000` | HTTP server port | `8080` |
| `EENGINE_BASE_URL` | string | auto-detected | Public base URL for OAuth2 callbacks | `https://emailengine.example.com` |
| `EENGINE_PROXY` | string | none | HTTP proxy for outgoing connections | `http://proxy.example.com:8080` |
| `EENGINE_SECRET` | string | random | Session encryption secret (min 32 chars) | `abc123def456...` |
| `EENGINE_APP_PASSWORD` | string | none | Admin panel password | `secure-password` |
| `EENGINE_TIMEOUT` | number | `10000` | HTTP request timeout (ms) | `30000` |

**Examples:**

**Public deployment:**
```bash
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
EENGINE_BASE_URL=https://emailengine.yourdomain.com
```

**Behind reverse proxy:**
```bash
EENGINE_HOST=127.0.0.1
EENGINE_PORT=3000
EENGINE_BASE_URL=https://mail-api.company.com
```

**With HTTP proxy:**
```bash
EENGINE_PROXY=http://corporate-proxy:8080
```

## Redis

Redis database connection and configuration.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `REDIS_URL` | string | `redis://127.0.0.1:6379` | Redis connection URL | `redis://user:pass@redis.example.com:6379/0` |
| `REDIS_PREFIX` | string | `{emailengine}` | Key prefix for Redis keys | `{ee-prod}` |
| `REDIS_CONF` | JSON | `{}` | Additional Redis client options | `{"enableAutoPipelining":true}` |
| `REDIS_WAIT_FOR_CONNECTION` | boolean | `false` | Wait for Redis on startup | `true` |

**Connection URL Format:**
```
redis://[username:password@]host[:port][/database]
rediss://...  (with TLS)
```

**Examples:**

**Basic connection:**
```bash
REDIS_URL=redis://localhost:6379
```

**With authentication:**
```bash
REDIS_URL=redis://username:password@redis.example.com:6379
```

**With TLS:**
```bash
REDIS_URL=rediss://redis.example.com:6380
```

**With database selection:**
```bash
REDIS_URL=redis://localhost:6379/8
```

**Multiple hosts (Sentinel):**
```bash
REDIS_URL="redis://sentinel1:26379,sentinel2:26379/mymaster"
```

**Advanced configuration:**
```bash
REDIS_PREFIX="{emailengine-prod}"
REDIS_CONF='{"enableAutoPipelining":true,"maxRetriesPerRequest":3}'
REDIS_WAIT_FOR_CONNECTION=true
```

[Detailed Redis configuration →](./redis.md)

## Email & IMAP

Email protocol settings and limits.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_MAX_ATTACHMENT_SIZE` | bytes | `5242880` | Max attachment size (5 MB) | `10485760` |
| `EENGINE_IMAP_TIMEOUT` | ms | `90000` | IMAP command timeout | `120000` |
| `EENGINE_IMAP_IDLE_TIMEOUT` | ms | `1740000` | IMAP IDLE timeout (29 min) | `1800000` |
| `EENGINE_SMTP_TIMEOUT` | ms | `60000` | SMTP command timeout | `90000` |
| `EENGINE_IMAP_DOWNLOAD_SIZE` | bytes | none | Max message download size | `52428800` |

**Examples:**

**High attachment limit:**
```bash
EENGINE_MAX_ATTACHMENT_SIZE=20971520  # 20 MB
```

**Extended timeouts for slow servers:**
```bash
EENGINE_IMAP_TIMEOUT=180000   # 3 minutes
EENGINE_SMTP_TIMEOUT=120000   # 2 minutes
```

**Limit message downloads:**
```bash
EENGINE_IMAP_DOWNLOAD_SIZE=10485760  # 10 MB max
```

## Features

Core application features and limits.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_WORKERS` | number | CPU count | Worker thread count | `4` |
| `EENGINE_MAX_CONNECTIONS` | number | `10` | Max IMAP connections per account | `5` |
| `EENGINE_CHUNK_SIZE` | number | `2500` | Messages per sync chunk | `5000` |
| `EENGINE_MAX_PAYLOAD_SIZE` | bytes | `5242880` | Max API request body size | `10485760` |
| `EENGINE_ENABLE_IMAP_PROXY` | boolean | `false` | Enable IMAP proxy feature | `true` |
| `EENGINE_MAX_ACCOUNTS` | number | unlimited | Max account limit | `1000` |

**Examples:**

**High-performance setup:**
```bash
EENGINE_WORKERS=8
EENGINE_MAX_CONNECTIONS=20
EENGINE_CHUNK_SIZE=5000
```

**Resource-constrained environment:**
```bash
EENGINE_WORKERS=2
EENGINE_MAX_CONNECTIONS=5
EENGINE_CHUNK_SIZE=1000
```

**Large payload support:**
```bash
EENGINE_MAX_PAYLOAD_SIZE=20971520  # 20 MB
```

**Account limits (licensing):**
```bash
EENGINE_MAX_ACCOUNTS=100
```

## Webhooks

Default webhook configuration.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_DEFAULT_WEBHOOK` | string | none | Default webhook URL | `https://your-app.com/webhook` |
| `EENGINE_DEFAULT_WEBHOOK_TIMEOUT` | ms | `10000` | Webhook request timeout | `30000` |
| `EENGINE_WEBHOOK_RETRY_ATTEMPTS` | number | `3` | Max webhook retry attempts | `5` |
| `EENGINE_WEBHOOK_RETRY_DELAY` | ms | `5000` | Initial retry delay | `10000` |

**Examples:**

**Default webhook for all accounts:**
```bash
EENGINE_DEFAULT_WEBHOOK=https://your-app.com/emailengine/webhook
EENGINE_DEFAULT_WEBHOOK_TIMEOUT=30000
```

**Aggressive retry policy:**
```bash
EENGINE_WEBHOOK_RETRY_ATTEMPTS=5
EENGINE_WEBHOOK_RETRY_DELAY=3000
```

[Webhook configuration guide →](../receiving/webhooks.md)

## OAuth2

OAuth2 provider credentials.

### Gmail (Google)

| Variable | Description |
|----------|-------------|
| `EENGINE_OAUTH2_PROVIDER_GMAIL_ENABLED` | Enable Gmail OAuth2 |
| `EENGINE_OAUTH2_PROVIDER_GMAIL_CLIENT_ID` | Google OAuth2 client ID |
| `EENGINE_OAUTH2_PROVIDER_GMAIL_CLIENT_SECRET` | Google OAuth2 client secret |
| `EENGINE_OAUTH2_PROVIDER_GMAIL_REDIRECT_URL` | OAuth2 redirect URL |

**Example:**
```bash
EENGINE_OAUTH2_PROVIDER_GMAIL_ENABLED=true
EENGINE_OAUTH2_PROVIDER_GMAIL_CLIENT_ID=123456789-abc.apps.googleusercontent.com
EENGINE_OAUTH2_PROVIDER_GMAIL_CLIENT_SECRET=GOCSPX-abc123def456
EENGINE_OAUTH2_PROVIDER_GMAIL_REDIRECT_URL=https://emailengine.example.com/oauth
```

### Outlook (Microsoft)

| Variable | Description |
|----------|-------------|
| `EENGINE_OAUTH2_PROVIDER_OUTLOOK_ENABLED` | Enable Outlook OAuth2 |
| `EENGINE_OAUTH2_PROVIDER_OUTLOOK_CLIENT_ID` | Microsoft OAuth2 client ID |
| `EENGINE_OAUTH2_PROVIDER_OUTLOOK_CLIENT_SECRET` | Microsoft OAuth2 client secret |
| `EENGINE_OAUTH2_PROVIDER_OUTLOOK_REDIRECT_URL` | OAuth2 redirect URL |
| `EENGINE_OAUTH2_PROVIDER_OUTLOOK_AUTHORITY` | Azure AD authority URL |

**Example:**
```bash
EENGINE_OAUTH2_PROVIDER_OUTLOOK_ENABLED=true
EENGINE_OAUTH2_PROVIDER_OUTLOOK_CLIENT_ID=abc123-def456-ghi789
EENGINE_OAUTH2_PROVIDER_OUTLOOK_CLIENT_SECRET=secretvalue
EENGINE_OAUTH2_PROVIDER_OUTLOOK_REDIRECT_URL=https://emailengine.example.com/oauth
EENGINE_OAUTH2_PROVIDER_OUTLOOK_AUTHORITY=https://login.microsoftonline.com/common
```

### Generic OAuth2

| Variable | Description |
|----------|-------------|
| `EENGINE_OAUTH2_CALLBACK_URL` | Global OAuth2 callback URL |

**Example:**
```bash
EENGINE_OAUTH2_CALLBACK_URL=https://emailengine.example.com/oauth/callback
```

[Complete OAuth2 setup guide →](./oauth2-configuration.md)

## Security & Encryption

Encryption and security settings.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_ENCRYPTION_SECRET` | string | none | Encryption key for sensitive data | `32-char-hex-key` |
| `EENGINE_ENCRYPTION_ALGO` | string | `aes-256-cbc` | Encryption algorithm | `aes-256-gcm` |
| `EENGINE_SECRET` | string | random | Session secret (min 32 chars) | `session-secret-key` |

**Supported Algorithms:**
- `aes-256-cbc` (default)
- `aes-256-gcm` (recommended for new deployments)
- `aes-192-cbc`
- `aes-128-cbc`

**Examples:**

**Enable field encryption:**
```bash
# Generate encryption key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

EENGINE_ENCRYPTION_SECRET=$ENCRYPTION_KEY
EENGINE_ENCRYPTION_ALGO=aes-256-gcm
```

**Session security:**
```bash
# Generate session secret
SESSION_SECRET=$(openssl rand -hex 32)

EENGINE_SECRET=$SESSION_SECRET
```

**Important:** Once encryption is enabled and data is stored, changing the encryption secret or algorithm will make existing encrypted data unreadable.

[Encryption guide →](../advanced/encryption.md)

## Logging & Monitoring

Logging configuration and monitoring endpoints.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EENGINE_LOG_LEVEL` | string | `info` | Log level (trace, debug, info, warn, error) | `debug` |
| `EENGINE_LOG_RAW` | boolean | `false` | Log raw IMAP/SMTP protocol | `true` |
| `EENGINE_METRICS_SERVER` | boolean | `false` | Enable Prometheus metrics endpoint | `true` |
| `EENGINE_METRICS_PORT` | number | `9090` | Metrics server port | `9091` |

**Log Levels:**
- `trace` - Very detailed, includes all protocol messages
- `debug` - Detailed operational information
- `info` - General operational messages (default)
- `warn` - Warning messages
- `error` - Error messages only

**Examples:**

**Development/debugging:**
```bash
EENGINE_LOG_LEVEL=trace
EENGINE_LOG_RAW=true
```

**Production:**
```bash
EENGINE_LOG_LEVEL=info
EENGINE_LOG_RAW=false
```

**Enable monitoring:**
```bash
EENGINE_METRICS_SERVER=true
EENGINE_METRICS_PORT=9090
```

[Logging configuration →](./logging.md)
[Monitoring setup →](./monitoring.md)

## Prepared Configuration

Pre-configured settings for automated deployments.

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `EENGINE_SETTINGS` | JSON | Pre-configured runtime settings | See below |
| `EENGINE_PREPARED_TOKEN` | string | Pre-configured API access token | `base64-encoded-token` |
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

**Prepared license:**
```bash
EENGINE_PREPARED_LICENSE=your-license-key-here
```

[Prepared configuration guide →](./prepared-settings.md)

## Development

Development and debugging settings.

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `NODE_ENV` | string | `production` | Node.js environment | `development` |
| `DEBUG` | string | none | Debug namespace filter | `emailengine:*` |

**Examples:**

**Development mode:**
```bash
NODE_ENV=development
DEBUG=emailengine:*
EENGINE_LOG_LEVEL=trace
```

**Production mode:**
```bash
NODE_ENV=production
EENGINE_LOG_LEVEL=info
```

## Complete Examples

### Minimal Production

```bash
# Required
REDIS_URL=redis://localhost:6379
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
EENGINE_SECRET=your-random-secret-minimum-32-characters-long

# Optional but recommended
EENGINE_BASE_URL=https://emailengine.yourdomain.com
EENGINE_ENCRYPTION_SECRET=your-32-char-encryption-key-here
EENGINE_LOG_LEVEL=info
```

### High-Performance Production

```bash
# Server
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
EENGINE_BASE_URL=https://emailengine.example.com
EENGINE_SECRET=your-session-secret-key

# Redis
REDIS_URL=redis://redis-cluster:6379
REDIS_PREFIX={ee-prod}
REDIS_CONF='{"enableAutoPipelining":true}'

# Performance
EENGINE_WORKERS=8
EENGINE_MAX_CONNECTIONS=20
EENGINE_CHUNK_SIZE=5000

# Limits
EENGINE_MAX_ATTACHMENT_SIZE=20971520
EENGINE_MAX_PAYLOAD_SIZE=20971520

# Security
EENGINE_ENCRYPTION_SECRET=your-encryption-key
EENGINE_ENCRYPTION_ALGO=aes-256-gcm

# Webhooks
EENGINE_DEFAULT_WEBHOOK=https://your-app.com/webhook
EENGINE_WEBHOOK_RETRY_ATTEMPTS=5

# Monitoring
EENGINE_METRICS_SERVER=true
EENGINE_METRICS_PORT=9090
EENGINE_LOG_LEVEL=info
```

### Development Setup

```bash
# Server
EENGINE_HOST=127.0.0.1
EENGINE_PORT=3001
EENGINE_SECRET=dev-secret-key-12345678901234567890

# Redis (separate DB for dev)
REDIS_URL=redis://localhost:6379/8
REDIS_PREFIX={ee-dev}

# Debugging
NODE_ENV=development
EENGINE_LOG_LEVEL=trace
EENGINE_LOG_RAW=true
DEBUG=emailengine:*

# Relaxed limits for testing
EENGINE_MAX_ATTACHMENT_SIZE=104857600  # 100 MB
EENGINE_IMAP_TIMEOUT=180000
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
      - "9090:9090"
    environment:
      # Server
      - EENGINE_HOST=0.0.0.0
      - EENGINE_PORT=3000
      - EENGINE_BASE_URL=https://emailengine.example.com
      - EENGINE_SECRET=${EENGINE_SECRET}

      # Redis
      - REDIS_URL=redis://redis:6379
      - REDIS_PREFIX={ee-prod}

      # Performance
      - EENGINE_WORKERS=4
      - EENGINE_MAX_CONNECTIONS=10

      # Security
      - EENGINE_ENCRYPTION_SECRET=${ENCRYPTION_SECRET}
      - EENGINE_ENCRYPTION_ALGO=aes-256-gcm

      # Webhooks
      - EENGINE_DEFAULT_WEBHOOK=${WEBHOOK_URL}

      # Monitoring
      - EENGINE_METRICS_SERVER=true
      - EENGINE_LOG_LEVEL=info

      # OAuth2
      - EENGINE_OAUTH2_PROVIDER_GMAIL_ENABLED=true
      - EENGINE_OAUTH2_PROVIDER_GMAIL_CLIENT_ID=${GMAIL_CLIENT_ID}
      - EENGINE_OAUTH2_PROVIDER_GMAIL_CLIENT_SECRET=${GMAIL_CLIENT_SECRET}

volumes:
  redis-data:
```

## Troubleshooting

### Validation Errors

**Secret too short:**
```
Error: EENGINE_SECRET must be at least 32 characters
```
**Solution:** Generate longer secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Invalid Redis URL:**
```
Error: Invalid Redis connection URL
```
**Solution:** Check format: `redis://host:port/database`

### Common Issues

**Port in use:**
```bash
# Check what's using the port
lsof -i :3000

# Change port
EENGINE_PORT=3001
```

**Redis connection failed:**
```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Verify URL
echo $REDIS_URL
```

**OAuth2 callback mismatch:**
```
Error: redirect_uri_mismatch
```
**Solution:** Ensure `EENGINE_BASE_URL` matches OAuth2 app configuration.

## See Also

- [Configuration Overview](./index.md)
- [Redis Configuration](./redis.md)
- [OAuth2 Configuration](./oauth2-configuration.md)
- [Prepared Settings](./prepared-settings.md)
- [Logging Configuration](./logging.md)
- [Monitoring Setup](./monitoring.md)
- [Production Security](/docs/deployment/security)
