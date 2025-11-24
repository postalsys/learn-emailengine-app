---
title: Configuration Options Reference
description: Complete reference of all configuration options and settings
sidebar_position: 3
---

# Complete Configuration Reference

Comprehensive reference for all EmailEngine configuration options.

:::info Configuration Methods
EmailEngine can be configured via:
1. **Environment variables** (highest priority)
2. **Command-line arguments**
3. **Configuration file** (config.toml)
:::

## Configuration Types

### Application Configuration
Loaded at startup. Requires restart to apply changes.
- HTTP port, workers, Redis connection
- OAuth2 credentials
- License key
- Logging settings

### Runtime Configuration
Can be updated via Settings API or web interface without restart.
- Webhook URLs
- Email sending limits
- SMTP gateways
- Queue settings

## Core Settings

### Server Configuration

#### Port

**Environment:** `EENGINE_PORT` or `EENGINE_API_PORT`
**Command line:** `--port=3000` or `--api.port=3000`
**Config file:** `api.port`
**Default:** `3000`

HTTP port for the web interface and API.

```bash
# Environment
export EENGINE_PORT=8080

# Command line
emailengine --port=8080

# Config file
{
  "api": {
    "port": 8080
  }
}
```

#### Host

**Environment:** `EENGINE_HOST` or `EENGINE_API_HOST`
**Command line:** `--host=0.0.0.0` or `--api.host=0.0.0.0`
**Config file:** `api.host`
**Default:** `127.0.0.1`

IP address to bind to. Use `0.0.0.0` to listen on all interfaces.

```bash
EENGINE_HOST=0.0.0.0
```

:::warning Security
Only use `0.0.0.0` if behind a reverse proxy. Otherwise, bind to `127.0.0.1`.
:::

#### Base URL

**Environment:** `EENGINE_BASE_URL`
**Command line:** `--baseUrl=https://example.com`
**Default:** Auto-detected

Base URL for generating links (OAuth redirects, etc.).

```bash
EENGINE_BASE_URL=https://emailengine.example.com
```

### Workers

#### Worker Threads

**Environment:** `EENGINE_WORKERS`
**Command line:** `--workers=4`
**Config file:** `workers`
**Default:** `1`

Number of worker threads for processing accounts.

```bash
EENGINE_WORKERS=4
```

**Recommendation:** Set to number of CPU cores.

```bash
# Auto-detect CPU cores
EENGINE_WORKERS=$(nproc)
```

### Redis Configuration

#### Connection URL

**Environment:** `EENGINE_REDIS`
**Command line:** `--dbs.redis=redis://localhost:6379/8`
**Config file:** `dbs.redis`
**Default:** `redis://127.0.0.1:6379/8`

Redis connection URL. The default database number is 8.

```bash
# Default (database 8)
EENGINE_REDIS=redis://localhost:6379/8

# With password
EENGINE_REDIS=redis://:password@localhost:6379/8

# With different database number
EENGINE_REDIS=redis://localhost:6379/5

# TLS
EENGINE_REDIS=rediss://localhost:6379

# Sentinel
EENGINE_REDIS=redis://sentinel1:26379,sentinel2:26379/mymaster
```

### Security

#### Secret

**Environment:** `EENGINE_SECRET`
**Command line:** `--service.secret=...`
**Config file:** `service.secret`
**Required:** Yes

Secret for encrypting session tokens and account credentials. **Minimum 32 characters.**

**Generate and save:**
```bash
# Generate and save to .env file
echo "EENGINE_SECRET=$(openssl rand -hex 32)" > .env
```

:::danger Required
EmailEngine will not start without this. Generate a strong random value.
:::

#### Encryption Secret

**Environment:** `EENGINE_SECRET`
**Command line:** `--encryptionSecret=...`
**Config file:** `encryptionSecret`
**Recommended:** Yes

Secret for field encryption (passwords, tokens). **Minimum 32 characters.**

```bash
# Generate a secret and save it to .env file
openssl rand -hex 32

# Add to .env file:
EENGINE_SECRET=generated-secret-value-here
```

#### Encryption Enabled

**Environment:** `EENGINE_ENCRYPT`
**Config file:** `encrypt`
**Default:** `true` (if encryptionSecret set)

Enable field-level encryption.

```bash
EENGINE_ENCRYPT=true
```

### Logging

#### Log Level

**Environment:** `EENGINE_LOG_LEVEL`
**Command line:** `--log.level=info`
**Config file:** `log.level`
**Default:** `trace`

Logging verbosity level.

**Levels:** `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`

```bash
# Production
EENGINE_LOG_LEVEL=info

# Development
EENGINE_LOG_LEVEL=trace

# Minimal
EENGINE_LOG_LEVEL=warn
```

#### Log File

**Environment:** `EENGINE_LOG_FILE`
**Config file:** `log.file`
**Default:** None (stdout only)

Log file path.

```bash
EENGINE_LOG_FILE=/var/log/emailengine/app.log
```

#### Log Raw

**Environment:** `EENGINE_LOG_RAW`
**Config file:** `log.raw`
**Default:** `false`

Log raw IMAP/SMTP protocol messages.

```bash
EENGINE_LOG_RAW=true
```

:::warning Performance
Enabling this creates very large log files. Only use for debugging.
:::

## OAuth2 Configuration

### Gmail OAuth2

#### Client ID

**Environment:** `EENGINE_GMAIL_CLIENT_ID`
**Config file:** `gmail.clientId`

Google OAuth2 client ID.

```bash
EENGINE_GMAIL_CLIENT_ID=123456789.apps.googleusercontent.com
```

#### Client Secret

**Environment:** `EENGINE_GMAIL_CLIENT_SECRET`
**Config file:** `gmail.clientSecret`

Google OAuth2 client secret.

```bash
EENGINE_GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

#### Service Client

**Environment:** `EENGINE_GMAIL_SERVICE_CLIENT`
**Config file:** `gmail.serviceClient`

Path to Google Service Account JSON file.

```bash
EENGINE_GMAIL_SERVICE_CLIENT=/etc/emailengine/service-account.json
```

#### Service Key

**Environment:** `EENGINE_GMAIL_SERVICE_KEY`
**Config file:** `gmail.serviceKey`

Google Service Account private key (PEM format).

### Outlook/Office 365 OAuth2

#### Authority

**Environment:** `EENGINE_OUTLOOK_AUTHORITY`
**Config file:** `outlook.authority`
**Default:** `https://login.microsoftonline.com/common`

Microsoft OAuth2 authority URL.

```bash
# Multi-tenant (default)
EENGINE_OUTLOOK_AUTHORITY=https://login.microsoftonline.com/common

# Single tenant
EENGINE_OUTLOOK_AUTHORITY=https://login.microsoftonline.com/{tenant-id}
```

#### Client ID

**Environment:** `EENGINE_OUTLOOK_CLIENT_ID`
**Config file:** `outlook.clientId`

Microsoft OAuth2 application ID.

```bash
EENGINE_OUTLOOK_CLIENT_ID=12345678-1234-1234-1234-123456789012
```

#### Client Secret

**Environment:** `EENGINE_OUTLOOK_CLIENT_SECRET`
**Config file:** `outlook.clientSecret`

Microsoft OAuth2 client secret.

```bash
EENGINE_OUTLOOK_CLIENT_SECRET=abc~123456789
```

### Generic OAuth2

#### Provider

**Config file:** `oauth2.{provider}.provider`

OAuth2 provider type: `gmail`, `outlook`, or `custom`.

#### Auth URL

**Config file:** `oauth2.{provider}.authUrl`

Authorization endpoint URL.

#### Token URL

**Config file:** `oauth2.{provider}.tokenUrl`

Token endpoint URL.

#### Scopes

**Config file:** `oauth2.{provider}.scopes`

OAuth2 scopes array.

```json
{
  "oauth2": {
    "custom-provider": {
      "provider": "custom",
      "clientId": "...",
      "clientSecret": "...",
      "authUrl": "https://oauth.example.com/auth",
      "tokenUrl": "https://oauth.example.com/token",
      "scopes": ["email", "profile"]
    }
  }
}
```

## Performance Tuning

### Max Connections

**Environment:** `EENGINE_MAX_CONNECTIONS`
**Config file:** `maxConnections`
**Default:** `10`

Maximum concurrent IMAP connections per account.

```bash
EENGINE_MAX_CONNECTIONS=20
```

**Recommendation:** 10-20 for most use cases.

### Chunk Size

**Environment:** `EENGINE_CHUNK_SIZE`
**Config file:** `chunkSize`
**Default:** `5000`

Number of messages to fetch per batch during initial sync.

```bash
EENGINE_CHUNK_SIZE=2500
```

**Lower values:** Slower sync, less memory
**Higher values:** Faster sync, more memory

### Fetch Timeout

**Environment:** `EENGINE_FETCH_TIMEOUT`
**Config file:** `fetchTimeout`
**Default:** `90000` (90 seconds)

Timeout for fetching message content in milliseconds.

```bash
EENGINE_FETCH_TIMEOUT=120000
```

### Pool Size

**Environment:** `EENGINE_POOL_SIZE`
**Config file:** `poolSize`
**Default:** `10`

Redis connection pool size.

```bash
EENGINE_POOL_SIZE=20
```

## Webhooks

### Webhook URL

**Runtime config:** Settings API or web interface
**Default:** None

Webhook destination URL.

```bash
# Via API
curl -X POST https://emailengine.example.com/v1/settings \
  -H "Authorization: Bearer TOKEN" \
  -d '{"webhooksUrl": "https://your-app.com/webhooks"}'
```

### Webhook Timeout

**Config file:** `webhooks.timeout`
**Default:** `10000` (10 seconds)

Webhook request timeout in milliseconds.

```json
{
  "webhooks": {
    "timeout": 15000
  }
}
```

### Webhook Retry

**Config file:** `webhooks.retry`
**Default:** `3`

Number of retry attempts for failed webhooks.

```json
{
  "webhooks": {
    "retry": 5
  }
}
```

## Monitoring

### Metrics Endpoint

The Prometheus metrics endpoint is available at `/metrics` on the main API server. It requires authentication with a token that has the `metrics` scope.

**Endpoint:** `http://localhost:3000/metrics`

**Authentication:** Requires API token with `metrics` scope (or `*` for full access)

```bash
# Create a metrics-only token
emailengine tokens issue -d "Prometheus" -s "metrics"

# Access metrics
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/metrics
```

**Note:** There is no separate metrics server. Metrics are served on the same port as the main API (configured via `EENGINE_PORT` or `PORT` environment variable, default: 3000).

### Health Check

**Endpoint:** `/health`
**Always enabled**

Returns health status.

```bash
curl http://localhost:3000/health
```

## License

### License Key

**Environment:** `EENGINE_PREPARED_LICENSE`
**Command line:** `--preparedLicense=...`
**Default:** 14-day trial

Production license key in PEM format or exported format.

```bash
# PEM format (recommended)
EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Your Company

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
-----END LICENSE-----"

# Exported format
EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7..."
```

:::info Trial Mode
Without a license key, EmailEngine runs in 14-day trial mode with full functionality. Activate trial via dashboard button.
:::

## Advanced Settings

### Pre-processing

**Config file:** `preProcessing`

JavaScript code for pre-processing incoming messages.

```json
{
  "preProcessing": "if (payload.from.address === 'spam@example.com') { return false; }"
}
```

### Local Addresses

**Config file:** `localAddresses`

Array of local IP addresses for outbound connections.

```json
{
  "localAddresses": [
    "192.0.2.1",
    "192.0.2.2",
    "192.0.2.3"
  ]
}
```

### Proxy

#### IMAP Proxy

**Config file:** `imap.proxy`

SOCKS5 proxy for IMAP connections.

```json
{
  "imap": {
    "proxy": "socks5://proxy.example.com:1080"
  }
}
```

#### SMTP Proxy

**Config file:** `smtp.proxy`

SOCKS5 proxy for SMTP connections.

```json
{
  "smtp": {
    "proxy": "socks5://proxy.example.com:1080"
  }
}
```

### Custom Headers

#### IMAP Headers

**Config file:** `imap.headers`

Custom headers to fetch.

```json
{
  "imap": {
    "headers": ["X-Custom-Header", "X-Priority"]
  }
}
```

### Queue Settings

#### Queue Concurrency

**Runtime config:** Settings API
**Default:** `4`

Number of concurrent webhook/email processing jobs.

```bash
curl -X PUT https://emailengine.example.com/v1/settings/queue/webhooks \
  -d '{"concurrency": 8}'
```

#### Queue Timeout

**Runtime config:** Settings API
**Default:** `10000` (10 seconds)

Job timeout in milliseconds.

## Email Sending

### SMTP Server

#### Default SMTP

**Config file:** `smtp`

Default SMTP settings for sending.

```json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "user@gmail.com",
      "pass": "password"
    }
  }
}
```

### Sending Limits

#### Daily Limit

**Runtime config:** Settings API
**Default:** Unlimited

Maximum emails per account per day.

```bash
curl -X POST https://emailengine.example.com/v1/settings \
  -d '{"sendingLimitDaily": 500}'
```

#### Rate Limit

**Runtime config:** Settings API
**Default:** Unlimited

Maximum emails per account per hour.

```bash
curl -X POST https://emailengine.example.com/v1/settings \
  -d '{"sendingLimitHourly": 50}'
```

## Environment Variable Reference

### Quick Reference Table

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `EENGINE_PORT` | `3000` | HTTP port |
| `EENGINE_HOST` | `127.0.0.1` | Bind address |
| `EENGINE_BASE_URL` | Auto | Base URL |
| `EENGINE_REDIS` | `redis://127.0.0.1:6379/8` | Redis URL |
| `EENGINE_SECRET` | Recommended | Encryption secret |
| `EENGINE_WORKERS` | `4` | Worker threads |
| `EENGINE_LOG_LEVEL` | `trace` | Log level |
| `EENGINE_PREPARED_LICENSE` | None | License key (PEM or exported format) |
| `EENGINE_GMAIL_CLIENT_ID` | None | Gmail OAuth2 client ID |
| `EENGINE_GMAIL_CLIENT_SECRET` | None | Gmail OAuth2 secret |
| `EENGINE_OUTLOOK_CLIENT_ID` | None | Outlook OAuth2 client ID |
| `EENGINE_OUTLOOK_CLIENT_SECRET` | None | Outlook OAuth2 secret |
| `EENGINE_MAX_CONNECTIONS` | `10` | Max IMAP connections |

## Configuration File Example

### Complete config.toml

```toml
[service]
secret = "your-encryption-secret-at-least-64-chars"

[api]
port = 3000
host = "127.0.0.1"

[dbs]
redis = "redis://localhost:6379/8"

workers = 4
maxConnections = 20
chunkSize = 5000

[log]
level = "info"
file = "/var/log/emailengine/app.log"

[gmail]
clientId = "your-gmail-client-id"
clientSecret = "your-gmail-client-secret"

[outlook]
authority = "https://login.microsoftonline.com/common"
clientId = "your-outlook-client-id"
clientSecret = "your-outlook-client-secret"

[webhooks]
timeout = 10000
retry = 3

[metrics]
enabled = true
port = 9090

[imap]
connectionTimeout = 90000

poolSize = 10
```

:::tip Using TOML Config
TOML is the native configuration format for EmailEngine. All settings including `service.secret` can be stored in the config file.
:::

## Priority Order

When the same setting is configured in multiple ways:

1. **Environment variables** (highest priority)
2. **Command-line arguments**
3. **Configuration file** (lowest priority)

Example:
```bash
# Config file: port = 3000
# Command line: --port=4000
# Environment: EENGINE_PORT=5000

# Result: Port 5000 (environment wins)
```
