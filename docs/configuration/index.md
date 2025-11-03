---
title: Configuration Overview
description: Configure EmailEngine with environment variables, command-line arguments, and runtime settings
sidebar_position: 1
---

# EmailEngine Configuration

EmailEngine provides flexible configuration options to adapt to various deployment scenarios. This guide covers the configuration methods, precedence, and best practices.

## Configuration Types

EmailEngine uses two distinct types of configuration:

### 1. Application Configuration

**Loaded at startup** and cannot be changed without restarting the application.

**Examples:**
- HTTP server port
- Redis connection URL
- Encryption secrets
- Log levels

**Configure via:**
- [Environment variables](/docs/configuration/environment-variables) (recommended)
- [Command-line arguments](/docs/configuration/cli)
- Configuration files

### 2. Runtime Configuration

**Can be updated** at any time via the Settings API or web interface.

**Examples:**
- Webhook URLs
- Webhook event filters
- OAuth2 application credentials
- Email templates

**Configure via:**
- Web interface (Settings page)
- [Settings API endpoint](/docs/api/post-v-1-settings)
- [Prepared settings](/docs/configuration/prepared-settings) (environment variable)

## Configuration Methods

### Environment Variables

**Recommended for production deployments.**

```bash
export EENGINE_HOST="0.0.0.0"
export EENGINE_PORT="3000"
export REDIS_URL="redis://localhost:6379"

emailengine
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      - EENGINE_HOST=0.0.0.0
      - EENGINE_PORT=3000
      - REDIS_URL=redis://redis:6379
```

[Complete environment variables reference →](./environment-variables.md)

### Command-Line Arguments

**Useful for development and testing.**

```bash
emailengine \
  --dbs.redis="redis://localhost:6379" \
  --api.port=3000 \
  --api.host="0.0.0.0" \
  --log.level="trace"
```

:::tip Interchangeable Configuration
Environment variables and CLI arguments can be used together. CLI arguments take precedence over environment variables. See the [mapping table](/docs/configuration/environment-variables#environment-variable-to-cli-mapping) for equivalents.
:::

[Complete CLI reference →](./cli)

### Settings API

**For runtime configuration.** (See: [Settings API](/docs/api/post-v-1-settings))

```bash
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhook",
    "webhookEvents": ["messageNew", "messageSent"]
  }'
```

### Web Interface

**User-friendly configuration management.**

1. Navigate to `http://localhost:3000`
2. Log in with admin credentials
3. Go to Settings
4. Update configuration
5. Click "Save"

## Configuration Precedence

When multiple configuration methods are used, they follow this precedence (highest to lowest):

1. **Environment Variables** (highest priority)
2. **Command-Line Arguments**
3. **Configuration Files**
4. **Default Values** (lowest priority)

**Example:**
```bash
# Environment variable takes precedence
export EENGINE_PORT=8080

# This will be ignored
emailengine --api.port=3000

# EmailEngine starts on port 8080
```

## Configuration Best Practices

### Production Deployments

**Use environment variables:**
```yaml
environment:
  - EENGINE_HOST=0.0.0.0
  - EENGINE_PORT=3000
  - REDIS_URL=redis://redis:6379
  - EENGINE_PREPARED_PASSWORD=${ADMIN_PASSWORD}
  - EENGINE_PREPARED_LICENSE=${LICENSE_KEY}
```

**Keep secrets secure:**
- Never commit secrets to version control
- Use secret management systems (AWS Secrets Manager, HashiCorp Vault)
- Use `.env` files only for development
- Rotate secrets regularly

**Document your configuration:**
```bash
# .env.example (commit this)
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
REDIS_URL=redis://localhost:6379
EENGINE_PREPARED_PASSWORD=change-me-in-production
```

### Development Setup

**Use command-line arguments for flexibility:**
```bash
emailengine \
  --dbs.redis="redis://localhost:6379/8" \
  --api.port=3001 \
  --log.level="trace"
```

**Or local `.env` file:**
```bash
# .env (don't commit)
EENGINE_PORT=3001
REDIS_URL=redis://localhost:6379/8
EENGINE_LOG_LEVEL=trace
```

### Docker Deployments

**Use Docker Compose environment variables:**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    env_file:
      - .env.production
    environment:
      - REDIS_URL=redis://redis:6379
```

**Multi-environment setup:**
```
.env.development
.env.staging
.env.production
```

### Kubernetes Deployments

**Use ConfigMaps and Secrets:**

```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: emailengine-config
data:
  EENGINE_HOST: "0.0.0.0"
  EENGINE_PORT: "3000"
  REDIS_URL: "redis://redis-service:6379"

---
# Secret
apiVersion: v1
kind: Secret
metadata:
  name: emailengine-secrets
type: Opaque
stringData:
  EENGINE_PREPARED_PASSWORD: "your-admin-password"
  EENGINE_PREPARED_LICENSE: "your-license-key"

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emailengine
spec:
  template:
    spec:
      containers:
      - name: emailengine
        image: postalsys/emailengine:latest
        envFrom:
        - configMapRef:
            name: emailengine-config
        - secretRef:
            name: emailengine-secrets
```

## Quick Reference

### Essential Configuration

**Minimal production setup:**

| Setting | Environment Variable | Description |
|---------|---------------------|-------------|
| Redis URL | `REDIS_URL` | Redis connection string |
| Server Host | `EENGINE_HOST` | Listen address (0.0.0.0) |
| Server Port | `EENGINE_PORT` | HTTP port (default 3000) |

**Example:**
```bash
REDIS_URL=redis://localhost:6379
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000
```

### Common Configuration Scenarios

**Behind Reverse Proxy:**
```bash
EENGINE_HOST=127.0.0.1
EENGINE_PORT=3000
```

**With Redis Cluster:**
```bash
REDIS_URL=redis://node1:6379,redis://node2:6379
EENGINE_REDIS_PREFIX={ee-prod}
```

**Development Mode:**
```bash
EENGINE_LOG_LEVEL=trace
NODE_ENV=development
```

## Configuration Categories

### Server & Connection
Configure HTTP server, base URL, and proxy settings.

[View details →](./environment-variables.md#server--connection)

### Redis
Redis connection, clustering, and persistence.

[View details →](./redis.md)

### Email Protocol Settings
Email handling, attachment size limits, timeouts.

[View details →](./environment-variables.md#email-protocol-settings)

### Worker Threads
Worker thread configuration for processing workload.

[View details →](./environment-variables.md#worker-threads)

### Queue Management
Job queue retention and cleanup configuration.

[View details →](./environment-variables.md#queue-management)

### OAuth2
OAuth2 provider credentials and configuration.

[View details →](./oauth2-configuration.md)

### TLS Configuration
TLS/SSL settings for secure connections.

[View details →](./environment-variables.md#tls-configuration)

### Logging & Monitoring
Log levels, metrics endpoints, monitoring.

[View details →](../advanced/monitoring)

### Prepared Configuration
Pre-configured settings, tokens, and licenses.

[View details →](./prepared-settings.md)

## Validation

### Check Configuration

**View current settings via API:** (See: [Get Settings](/docs/api/get-v-1-settings))
```bash
curl http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Check application config:**
```bash
# View logs for configuration issues
docker logs emailengine | grep -i config
```

### Common Issues

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change `EENGINE_PORT` to unused port.

**Redis connection failed:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Verify `REDIS_URL` is correct and Redis is running.

**Invalid secret:**
```
Error: EENGINE_SECRET must be at least 32 characters
```
**Solution:** Generate longer secret key.

### Generate Secrets

**Random secret key:**
```bash
# OpenSSL
openssl rand -hex 32

# /dev/urandom
head -c 32 /dev/urandom | base64

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Migration & Updates

### Version Upgrades

When upgrading EmailEngine:

1. **Review changelog** for breaking changes
2. **Backup Redis** database
3. **Test in staging** environment
4. **Update configuration** if needed
5. **Deploy to production**

### Configuration Migration

**From v1.x to v2.x:**
- Update environment variable names (see changelog)
- Migrate runtime settings via Settings API
- Update OAuth2 configuration format
