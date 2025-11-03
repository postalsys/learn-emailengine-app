---
title: Prepared Configuration
description: Pre-configure settings via environment variables for automated deployments
sidebar_position: 7
---

# Prepared Configuration

Prepared configuration allows you to pre-configure EmailEngine settings, access tokens, and license keys before the application starts. This is essential for automated deployments, CI/CD pipelines, and containerized environments where manual configuration is impractical.

## Overview

EmailEngine supports three types of prepared configuration:

1. **Prepared Settings** - Runtime configuration (webhooks, OAuth2, etc.)
2. **Prepared Access Tokens** - API authentication tokens
3. **Prepared License Keys** - License activation

All prepared configuration is applied on application startup. If the configuration already exists, it's skipped to avoid duplicates.

## Use Cases

**Automated Deployments:**
- Docker/Kubernetes deployments
- Infrastructure as Code (Terraform, Ansible)
- CI/CD pipelines

**Testing:**
- End-to-end automated testing
- Integration test environments
- Staging environment setup

**Multi-Environment Setup:**
- Development, staging, production configs
- Multi-tenant deployments
- Rapid environment provisioning

## Prepared Settings

Pre-configure runtime settings that would normally be set via the Settings API or web interface.

### What Can Be Pre-Configured

Any setting available via the `/v1/settings` API endpoint:

- Webhook URLs and event filters
- OAuth2 application credentials
- SMTP gateway configuration
- Email templates
- Default email signatures
- Custom service settings

### Configuration Methods

#### Environment Variable

Set the `EENGINE_SETTINGS` environment variable with a JSON string:

```bash
export EENGINE_SETTINGS='{"webhooks": "https://webhook.site/abc123","webhookEvents":["messageNew"]}'
emailengine
```

#### Command-Line Argument

Use the `--settings` flag:

```bash
emailengine --settings='{"webhooks": "https://your-app.com/webhook","webhookEvents":["messageNew"]}'
```

#### Docker

**Single-line environment variable:**
```dockerfile
ENV EENGINE_SETTINGS='{"webhooks":"https://your-app.com/webhook","webhookEvents":["messageNew","messageSent"]}'
```

#### Docker Compose

**Multi-line YAML format (recommended):**
```yaml
version: '3.8'
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      EENGINE_SETTINGS: >
        {
          "webhooks": "https://your-app.com/webhook",
          "webhookEvents": [
            "messageNew",
            "messageDeleted",
            "messageSent",
            "messageDeliveryError"
          ],
          "notifyText": "EmailEngine notification",
          "serviceUrl": "https://emailengine.example.com"
        }
```

**Using external file:**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    env_file:
      - ./config/emailengine.env
```

```bash
# config/emailengine.env
EENGINE_SETTINGS={"webhooks":"https://your-app.com/webhook","webhookEvents":["messageNew"]}
```

### Examples

**Basic webhook configuration:**
```bash
EENGINE_SETTINGS='{
  "webhooks": "https://your-app.com/webhook",
  "webhookEvents": ["messageNew", "messageSent"]
}'
```

**Complete configuration:**
```bash
EENGINE_SETTINGS='{
  "webhooks": "https://your-app.com/webhook",
  "webhookEvents": [
    "messageNew",
    "messageDeleted",
    "messageSent",
    "messageDeliveryError"
  ],
  "notifyText": "New email notification",
  "notifyTextSize": 100,
  "serviceUrl": "https://emailengine.example.com"
}'
```

**OAuth2 applications:**
```bash
EENGINE_SETTINGS='{
  "gmailEnabled": true,
  "gmailClientId": "123456.apps.googleusercontent.com",
  "gmailClientSecret": "GOCSPX-abc123",
  "outlookEnabled": true,
  "outlookClientId": "abc-def-ghi",
  "outlookClientSecret": "secret123"
}'
```

### Validation

Settings are validated on startup. If validation fails, the application won't start:

```
Error: Invalid settings configuration
  - webhooks: must be a valid URL
  - webhookEvents: must be an array
```

Check your JSON syntax and setting values if you encounter errors.

### Updating Prepared Settings

Prepared settings are only applied once on first startup. To update:

1. Change the `EENGINE_SETTINGS` value
2. Delete the settings from Redis (or use Settings API to update)
3. Restart EmailEngine

**Clear settings:**
```bash
# Via API
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"webhooks": null}'

# Via Redis CLI
redis-cli DEL "{emailengine}:config"
```

---

## Prepared Access Tokens

Pre-configure API access tokens for automated API access without manual token generation.

### Why Prepared Tokens

Manual token generation requires:
1. Starting EmailEngine
2. Logging into web interface
3. Navigating to Settings
4. Clicking "Generate token"
5. Copying the token

Prepared tokens eliminate these manual steps, enabling:
- Fully automated deployments
- Automated testing
- CI/CD integration
- Programmatic environment setup

### Token Management via CLI

EmailEngine CLI provides commands for token management:

#### 1. Issue New Token

Generate a new token directly:

```bash
emailengine tokens issue \
  -d "API Token" \
  -s "*" \
  --dbs.redis="redis://127.0.0.1:6379"
```

**Output:**
```
f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

**Options:**

| Flag | Long Form | Description | Default |
|------|-----------|-------------|---------|
| `-d` | `--description` | Token description | - |
| `-s` | `--scope` | Token scope | `*` |
| `-a` | `--account` | Bind to specific account | none |

**Scopes:**
- `*` - Full access (all operations)
- `api` - API calls only
- `metrics` - Prometheus metrics only

**Examples:**

```bash
# Full access token
emailengine tokens issue -d "Production API" -s "*"

# API-only token
emailengine tokens issue -d "Read-Only API" -s "api"

# Account-specific token
emailengine tokens issue -d "User Token" -a "user@example.com"

# Metrics token
emailengine tokens issue -d "Monitoring" -s "metrics"
```

**Important:** When running token CLI commands, database settings must be provided, but encryption keys are NOT needed (tokens are hashed, not encrypted).

#### 2. Export Token

Export an existing token for import elsewhere:

```bash
emailengine tokens export -t f05d76644ea39c4a2...
```

**Output:**
```
hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxNTYzYTFlM2I1NjVkYmEzZWJjMzk4ZjI4OWZjNjgzN...
```

The exported string contains:
- Token hash
- Token metadata (description, scope, account)
- Creation timestamp

**Use cases:**
- Share token between EmailEngine instances
- Backup token for prepared configuration
- Migrate token to different environment

#### 3. Import Token

Import a previously exported token:

```bash
emailengine tokens import -t hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
```

**Output:**
```
Token was imported
```

The original token value (the actual API key) is preserved during import.

### Prepared Token Configuration

Load a token automatically on startup using the exported token string.

#### Environment Variable

```bash
export EENGINE_PREPARED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
emailengine
```

**Output:**
```
{"level":20,"time":1638811265629,"msg":"Imported prepared token"}
```

#### Command-Line Argument

```bash
emailengine --preparedToken="hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN..."
```

#### Docker

```dockerfile
ENV EENGINE_PREPARED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
```

#### Docker Compose

```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      - EENGINE_PREPARED_TOKEN=${PREPARED_TOKEN}
```

```bash
# .env file
PREPARED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
```

### Complete Workflow

**1. Generate and export token:**
```bash
# Generate token
TOKEN=$(emailengine tokens issue -d "Production API" -s "*" --dbs.redis="redis://localhost:6379")

echo "Generated token: $TOKEN"

# Export token for prepared config
EXPORTED=$(emailengine tokens export -t $TOKEN --dbs.redis="redis://localhost:6379")

echo "Exported token: $EXPORTED"
```

**2. Use in deployment:**
```yaml
# docker-compose.yml
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      - EENGINE_PREPARED_TOKEN=${EXPORTED_TOKEN}
```

```bash
# .env
EXPORTED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
```

**3. Use the original token for API calls:**
```bash
curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer $TOKEN"
```

### Multiple Prepared Tokens

To prepare multiple tokens:

1. Generate and export each token
2. Import them sequentially on startup
3. Or combine in initialization script

**Example:**
```bash
# Initialization script
emailengine tokens import -t $ADMIN_TOKEN
emailengine tokens import -t $METRICS_TOKEN
emailengine tokens import -t $USER1_TOKEN

# Start EmailEngine
emailengine
```

---

## Prepared License Keys

Pre-configure license keys for automated license activation.

### Manual vs Prepared Licensing

**Manual:**
1. Start EmailEngine
2. Log into web interface
3. Navigate to Settings > License
4. Enter license key
5. Click "Activate"

**Prepared (automated):**
```bash
export EENGINE_PREPARED_LICENSE="your-license-key-here"
emailengine
```

### License Key Formats

EENGINE_PREPARED_LICENSE supports two formats:

#### Format 1: Normal License Key (PEM Format)

The standard license key format provided by https://postalsys.com/:

```bash
export EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Postal Systems OÜ

h6FspGM0NTSha6gwY2FlMjY2Y6Fus0V4YW1wbGUgQ29tcGFueSBJbmOhaKNBQ1OhYbFAZXhhbX
BsZS9kZW1vLWFwcKFjzwAAAZnw+ZsOoXPEK0VYQU1QTEVfU0lHTkFUVVJFX05PVF9WQUxJRF9G
T1JfUFVCTElDX0RFTU8=
-----END LICENSE-----"

emailengine
```

**This is the recommended format** - copy the license key exactly as shown in your account at https://postalsys.com/.

#### Format 2: Exported License Key

An encoded single-line format exported from EmailEngine CLI:

```bash
# Export an existing license
emailengine license export --dbs.redis="redis://localhost:6379"

# Output (example):
i0-AgqFsxFWFoWvEDGC7abcdefghijklmnopqrstuvwxyz...

# Use in another instance
export EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7abcdefghijklmnopqrstuvwxyz..."
emailengine
```

**Use case:** Transfer license from one EmailEngine instance to another without accessing the license portal.

### Configuration Methods

#### Environment Variable

**PEM format (recommended):**
```bash
export EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Your Company Name

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz...
-----END LICENSE-----"

emailengine
```

**Exported format:**
```bash
export EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7..."
emailengine
```

#### Command-Line Argument

**PEM format:**
```bash
emailengine --preparedLicense="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Your Company Name

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz...
-----END LICENSE-----"
```

**Exported format:**
```bash
emailengine --preparedLicense="i0-AgqFsxFWFoWvEDGC7..."
```

#### Docker

**PEM format:**
```dockerfile
ENV EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----\nApplication: EmailEngine\nLicensed to: Your Company\n\neyJhbGci...\n-----END LICENSE-----"
```

**Exported format:**
```dockerfile
ENV EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7..."
```

#### Docker Compose

**PEM format (multiline YAML):**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      EENGINE_PREPARED_LICENSE: |
        -----BEGIN LICENSE-----
        Application: EmailEngine
        Licensed to: Your Company Name

        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz...
        -----END LICENSE-----
```

**Exported format (single-line):**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      - EENGINE_PREPARED_LICENSE=${LICENSE_KEY}
```

```bash
# .env
LICENSE_KEY=i0-AgqFsxFWFoWvEDGC7...
```

### Verification

Check license status via API:

```bash
curl http://localhost:3000/v1/license \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "active": true,
  "type": "EmailEngine License",
  "expires": "2026-01-15T00:00:00.000Z",
  "accounts": "unlimited"
}
```

### License Management

**Update license:**
1. Change `EENGINE_PREPARED_LICENSE` value
2. Delete old license from Redis
3. Restart EmailEngine

**Remove license:**
```bash
# Via API
curl -X DELETE http://localhost:3000/v1/license \
  -H "Authorization: Bearer YOUR_TOKEN"

# Via Redis CLI
redis-cli DEL "{emailengine}:license"
```

---

## Complete Examples

### Docker Compose - Full Prepared Config

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
      # Basic config
      - EENGINE_HOST=0.0.0.0
      - EENGINE_PORT=3000
      - REDIS_URL=redis://redis:6379
      - EENGINE_SECRET=${SECRET_KEY}

      # Prepared settings
      - EENGINE_SETTINGS=${PREPARED_SETTINGS}

      # Prepared token
      - EENGINE_PREPARED_TOKEN=${PREPARED_TOKEN}

      # Prepared license
      - EENGINE_PREPARED_LICENSE=${LICENSE_KEY}

volumes:
  redis-data:
```

```bash
# .env
SECRET_KEY=your-random-secret-minimum-32-characters
LICENSE_KEY=EELICENSE-xxxxx-xxxxx-xxxxx-xxxxx
PREPARED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
PREPARED_SETTINGS={"webhooks":"https://your-app.com/webhook","webhookEvents":["messageNew"]}
```

### Kubernetes - ConfigMap & Secrets

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: emailengine-prepared-settings
data:
  EENGINE_SETTINGS: |
    {
      "webhooks": "https://your-app.com/webhook",
      "webhookEvents": ["messageNew", "messageSent"],
      "serviceUrl": "https://emailengine.example.com"
    }

---
apiVersion: v1
kind: Secret
metadata:
  name: emailengine-secrets
type: Opaque
stringData:
  EENGINE_SECRET: "your-session-secret"
  EENGINE_PREPARED_TOKEN: "hKJpZNlAMzAxZThjNTFhZjgxM..."
  EENGINE_PREPARED_LICENSE: "EELICENSE-xxxxx-xxxxx-xxxxx"

---
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
            name: emailengine-prepared-settings
        - secretRef:
            name: emailengine-secrets
```

### Terraform - AWS ECS

```hcl
resource "aws_ecs_task_definition" "emailengine" {
  family = "emailengine"

  container_definitions = jsonencode([
    {
      name  = "emailengine"
      image = "postalsys/emailengine:latest"

      environment = [
        {
          name  = "EENGINE_HOST"
          value = "0.0.0.0"
        },
        {
          name  = "EENGINE_PORT"
          value = "3000"
        },
        {
          name  = "REDIS_URL"
          value = aws_elasticache_cluster.redis.cache_nodes[0].address
        }
      ]

      secrets = [
        {
          name      = "EENGINE_SECRET"
          valueFrom = aws_secretsmanager_secret.eengine_secret.arn
        },
        {
          name      = "EENGINE_PREPARED_TOKEN"
          valueFrom = aws_secretsmanager_secret.eengine_token.arn
        },
        {
          name      = "EENGINE_PREPARED_LICENSE"
          valueFrom = aws_secretsmanager_secret.eengine_license.arn
        },
        {
          name      = "EENGINE_SETTINGS"
          valueFrom = aws_secretsmanager_secret.eengine_settings.arn
        }
      ]
    }
  ])
}
```

### CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Deploy EmailEngine

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to production
        env:
          PREPARED_TOKEN: ${{ secrets.EMAILENGINE_PREPARED_TOKEN }}
          LICENSE_KEY: ${{ secrets.EMAILENGINE_LICENSE }}
          SETTINGS: ${{ secrets.EMAILENGINE_SETTINGS }}
        run: |
          docker-compose up -d
```

## Testing

Test prepared configuration before deployment:

```bash
# Validate settings JSON
echo $EENGINE_SETTINGS | jq .

# Test token works
curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer $TOKEN"

# Verify license
curl http://localhost:3000/v1/license \
  -H "Authorization: Bearer $TOKEN"
```

### Documentation

**Document your prepared config:**
```bash
# .env.example (commit this)
EENGINE_SETTINGS={"webhooks":"https://example.com/webhook"}
EENGINE_PREPARED_TOKEN=get-from-secret-manager
EENGINE_PREPARED_LICENSE=get-from-license-portal
```

## Troubleshooting

### Settings Not Applied

**Check logs:**
```bash
docker logs emailengine | grep -i settings
```

**Verify JSON syntax:**
```bash
echo $EENGINE_SETTINGS | jq .
```

### Token Not Working

**Check token was imported:**
```bash
docker logs emailengine | grep "Imported prepared token"
```

**Verify token via API:**
```bash
curl http://localhost:3000/v1/tokens \
  -H "Authorization: Bearer $TOKEN"
```

### License Not Activated

**Check license status:**
```bash
curl http://localhost:3000/v1/license \
  -H "Authorization: Bearer $TOKEN"
```

**Verify license format:**
```bash
echo $EENGINE_PREPARED_LICENSE
# Should start with: EELICENSE-
```
