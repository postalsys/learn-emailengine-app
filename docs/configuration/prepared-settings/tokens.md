---
title: Access Tokens
sidebar_position: 1
description: Pre-configure API access tokens via environment variables
---

# Prepared Access Tokens

Pre-configure API access tokens for automated API access without manual token generation.

## Why Prepared Tokens

Manual token generation requires:
1. Starting EmailEngine
2. Logging into web interface
3. Navigating to Access Tokens
4. Clicking "Create new"
5. Copying the token

Prepared tokens eliminate these manual steps, enabling:
- Fully automated deployments
- Automated testing
- CI/CD integration
- Programmatic environment setup

## Token Management via CLI

EmailEngine CLI provides commands for token management:

### 1. Issue New Token

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

### 2. Export Token

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

### 3. Import Token

Import a previously exported token:

```bash
emailengine tokens import -t hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
```

**Output:**
```
Token was imported
```

The original token value (the actual API key) is preserved during import.

## Prepared Token Configuration

Load a token automatically on startup using the exported token string.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="config-method">
<TabItem value="env" label="Environment Variable">

```bash
export EENGINE_PREPARED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
emailengine
```

**Output:**
```
{"level":20,"time":1638811265629,"msg":"Imported prepared token"}
```

</TabItem>
<TabItem value="cli" label="Command-Line">

```bash
emailengine --preparedToken="hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN..."
```

</TabItem>
<TabItem value="docker" label="Docker">

```dockerfile
ENV EENGINE_PREPARED_TOKEN=hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
```

</TabItem>
<TabItem value="docker-compose" label="Docker Compose">

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

</TabItem>
</Tabs>

## Complete Workflow

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

## Multiple Prepared Tokens

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

## See Also

- [Prepared Settings](./index) - Pre-configure runtime settings
- [Prepared License](./license) - Pre-configure license keys
- [Access Tokens](/docs/api-reference/access-tokens) - Access token management and security
- [API Authentication](/docs/api-reference/#authentication) - Using tokens for API access
