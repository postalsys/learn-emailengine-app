---
title: Access Tokens
description: Complete guide to managing API access tokens in EmailEngine
sidebar_position: 2
---

# Access Tokens

Access tokens are required to authenticate all API requests to EmailEngine. This guide covers token types, creation methods, security best practices, and management strategies.

## Overview

### What are Access Tokens

Access tokens are 64-character hexadecimal strings that authenticate API requests. EmailEngine supports two types of tokens:

1. **System-wide tokens**: Full access to all EmailEngine endpoints and all accounts
2. **Account-specific tokens**: Restricted to operations on a single account

### Token Format

All tokens are 64-character hexadecimal strings (32 bytes):

```
f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

## Token Types

### System-Wide Tokens

**Created via:**

- Web interface (Dashboard side menu → Access Tokens)
- CLI: `emailengine tokens issue`

**Characteristics:**

- Access all accounts
- Access all API endpoints
- Can create other tokens
- Can optionally be scoped to specific account using `-a` flag in CLI
- Recommended for administrative tasks

**Example use cases:**

- Account management (create, update, delete accounts)
- System configuration
- Multi-account operations
- Administrative automation

### Account-Specific Tokens

**Created via:**

- API: `POST /v1/token` (requires `account` field)

**Characteristics:**

- Bound to single account
- Can only access that account's data
- Cannot create other tokens
- Cannot access system-wide endpoints
- Recommended for user-facing applications

**Example use cases:**

- Per-user API access in multi-tenant applications
- Limited scope for third-party integrations
- Security-sensitive deployments

**Important:** Tokens created via the API are ALWAYS account-specific. You must provide the `account` field.

## Creating Tokens

### Method 1: Web Interface

**Best for:** Manual token creation, administrative tokens

1. Log in to EmailEngine web interface
2. Navigate to **Dashboard side menu** → **Access Tokens**
3. Click **Create new**
4. Enter description and select scopes
5. Click **Generate a token**
6. Copy the token (shown only once)

**Pros:**

- Simple and intuitive
- Visual scope selection
- Immediate feedback

**Cons:**

- Requires manual interaction
- Not suitable for automation

### Method 2: CLI

**Best for:** Automation, CI/CD, Docker deployments, infrastructure-as-code

The EmailEngine CLI provides commands to generate, export, import, and manage tokens programmatically. This is particularly useful for automated deployments and prepared token configuration.

:::tip CLI Documentation
For complete CLI usage, installation, and configuration options, see the [Command Line Interface (CLI)](/docs/configuration/cli) documentation.
:::

**Generate system-wide token:**

```bash
emailengine tokens issue \
  -d "My admin token" \
  -s "*" \
  --dbs.redis="redis://127.0.0.1:6379/8"
```

**Generate account-specific token:**

```bash
emailengine tokens issue \
  -d "User token" \
  -s "api" \
  -a "user123" \
  --dbs.redis="redis://127.0.0.1:6379/8"
```

**Output:**

```
f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

For detailed CLI usage, export/import workflows, and prepared token configuration for automated deployments, see [Prepared Tokens](/docs/configuration/prepared-settings/tokens).

### Method 3: API

**Best for:** Programmatic token creation, multi-tenant applications

**Endpoint:** `POST /v1/token`

[Detailed API reference →](/docs/api/post-v-1-token)

**Authentication:** Requires existing valid token

```bash
curl -X POST http://localhost:3000/v1/token \
  -H "Authorization: Bearer EXISTING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "description": "User API token",
    "scopes": ["api"]
  }'
```

**Required fields:**

- `account` (string, required): Account ID this token is bound to
- `description` (string, required): Token description
- `scopes` (array, required): Token scopes

**Response:**

```json
{
  "token": "a1b2c3d4e5f6...64-char-hex-string"
}
```

**Important notes:**

- API-generated tokens are ALWAYS account-specific
- The `account` field is mandatory
- Tokens can only access the specified account
- You need an existing system-wide token to create account-specific tokens

## Token Scopes

Scopes define what a token can access:

| Scope        | Description     | Access                            | Available via           |
| ------------ | --------------- | --------------------------------- | ----------------------- |
| `*`          | Full access     | All API endpoints, all operations | Web UI, CLI only        |
| `api`        | API access only | Standard API calls, no metrics    | Web UI, CLI, API        |
| `metrics`    | Metrics only    | Prometheus metrics endpoint only  | Web UI, CLI only        |
| `smtp`       | SMTP proxy      | SMTP gateway access               | Web UI, CLI, API        |
| `imap-proxy` | IMAP proxy      | IMAP proxy access                 | Web UI, CLI, API        |

:::info API Scope Limitations
When creating tokens via the `POST /v1/token` API endpoint, only `api`, `smtp`, and `imap-proxy` scopes are available. The `*` (full access) and `metrics` scopes can only be assigned through the Web UI or CLI.
:::

**Multiple scopes:**

```json
{
  "scopes": ["api", "smtp"]
}
```

**Default scope:** `["api"]`

## Token Management

### Export and Import Tokens

You can export tokens for backup or to transfer them between EmailEngine instances. Exported tokens can also be used as prepared tokens for automated deployments.

**Important:** Exported tokens are data structures containing the token hash, NOT the actual token value. The exported data CANNOT be used directly as an API token. Only the original token value generated during creation can be used for API authentication.

```bash
# Export a token (exports token metadata and hash)
emailengine tokens export -t TOKEN_VALUE

# Import a previously exported token
emailengine tokens import -t EXPORTED_DATA
```

For complete export/import workflows and prepared token configuration, see [Prepared Tokens](/docs/configuration/prepared-settings/tokens).

### Revoking Tokens

**Via web interface:**

1. Navigate to **Dashboard side menu** → **Access Tokens**
2. Find the token to revoke
3. Click **Delete**
4. Confirm deletion

**Via API:**

```bash
curl -X DELETE http://localhost:3000/v1/token/TOKEN_HASH \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

[Detailed API reference →](/docs/api/delete-v-1-token-token)

:::note CLI Token Deletion
The CLI does not have a `tokens delete` command. To delete tokens programmatically, use the API endpoint above or the web interface.
:::

## Disabling Authentication (Development Only)

:::danger Never Use in Production
Disabling authentication removes all API security. Only use for local development or testing.
:::

You can disable the access token requirement for development purposes:

1. Log in to EmailEngine web interface
2. Navigate to **Configuration** → **General Settings**
3. Uncheck **"Require API Authentication"**
4. Save settings

**When disabled:**
- API calls work without `Authorization` header
- No token validation is performed
- All endpoints are accessible without authentication
- No access control or user tracking

**Example:**
```bash
# With authentication disabled
curl http://localhost:3000/v1/accounts
# Works without Bearer token
```

**Use cases:**
- Local development without tokens
- Quick testing and debugging
- Development environment setup
- Learning the API

**Security warnings:**

:::warning Production Deployment
- **NEVER** disable authentication in production
- **NEVER** disable authentication on publicly accessible instances
- **NEVER** disable authentication on instances with real email accounts
- **ALWAYS** re-enable before deploying to production
:::

**Before going to production:**
1. Re-enable "Require API Authentication"
2. Create proper access tokens
3. Remove any unauthenticated API calls from your code
4. Test with authentication enabled

## See Also

- [Command Line Interface (CLI)](/docs/configuration/cli) - Complete CLI reference for token management and administration
- [Prepared Tokens](/docs/configuration/prepared-settings/tokens) - CLI commands, export/import, and automated deployment configuration
- [API Authentication](/docs/api-reference/#authentication) - Using tokens in API requests
- [Account Management API](/docs/api-reference/accounts-api) - Managing email accounts with tokens
- [Security Best Practices](/docs/deployment/security) - General security guidelines for EmailEngine deployment

