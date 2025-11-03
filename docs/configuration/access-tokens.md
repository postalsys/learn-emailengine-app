---
title: Access Tokens
description: Complete guide to managing API access tokens in EmailEngine
sidebar_position: 7
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

- Web interface (Settings → Access Tokens)
- CLI: `emailengine tokens issue`

**Characteristics:**

- Access all accounts
- Access all API endpoints
- Can create other tokens
- Cannot be scoped to specific account
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
2. Navigate to **Settings** → **Access Tokens**
3. Click **Generate new token**
4. Enter description and select scopes
5. Click **Create**
6. Copy the token (shown only once)

**Pros:**

- Simple and intuitive
- Visual scope selection
- Immediate feedback

**Cons:**

- Requires manual interaction
- Not suitable for automation

### Method 2: CLI

**Best for:** Automation, CI/CD, Docker deployments

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

**Parameters:**

| Parameter       | Short | Description             | Values                                                |
| --------------- | ----- | ----------------------- | ----------------------------------------------------- |
| `--description` | `-d`  | Token description       | Any string                                            |
| `--scope`       | `-s`  | Token scopes            | `"*"`, `"api"`, `"metrics"`, `"smtp"`, `"imap-proxy"` |
| `--account`     | `-a`  | Account ID (optional)   | Account identifier                                    |
| `--dbs.redis`   |       | Redis connection string | Required if not in env                                |

**Output:**

```
f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

**Important:** Use the same Redis database configuration as your main EmailEngine instance.

### Method 3: API

**Best for:** Programmatic token creation, multi-tenant applications

**Endpoint:** `POST /v1/token`

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

| Scope        | Description     | Access                            |
| ------------ | --------------- | --------------------------------- |
| `*`          | Full access     | All API endpoints, all operations |
| `api`        | API access only | Standard API calls, no metrics    |
| `metrics`    | Metrics only    | Prometheus metrics endpoint only  |
| `smtp`       | SMTP proxy      | SMTP gateway access               |
| `imap-proxy` | IMAP proxy      | IMAP proxy access                 |

**Multiple scopes:**

```json
{
  "scopes": ["api", "smtp"]
}
```

**Default scope:** `["api"]`

## Token Management

### Exporting Tokens

Export a token for backup or transfer to another instance:

```bash
emailengine tokens export \
  -t f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

**Output:**

```
hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxNTYzYTFlM2I1NjVkYmEzZWJjMzk4ZjI4OWZjNjgzN...
```

**Use cases:**

- Backup tokens before migration
- Transfer tokens between instances
- Pre-configure tokens via environment variables

### Importing Tokens

Import previously exported token data:

```bash
emailengine tokens import \
  -t hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxNTYzYTFlM2I1NjVkYmEzZWJjMzk4ZjI4OWZjNjgzN...
```

**Output:**

```
Token was imported
```

**Important:** Use the exported base64-encoded data, not the original token.

### Prepared Tokens

Pre-configure tokens on application startup via environment variables:

**Environment variable:**

```bash
export EENGINE_PREPARED_TOKEN="hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN..."
emailengine
```

**Command-line argument:**

```bash
emailengine --preparedToken="hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN..."
```

**Use cases:**

- Docker/container deployments
- Automated testing
- CI/CD pipelines
- Infrastructure as code

See [Prepared Access Token](/docs/configuration/prepared-access-token) for details.

### Revoking Tokens

**Via web interface:**

1. Navigate to **Settings** → **Access Tokens**
2. Find the token to revoke
3. Click **Delete**
4. Confirm deletion

**Via CLI:**

```bash
emailengine tokens delete \
  -t f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

**Via API:**

```bash
curl -X DELETE http://localhost:3000/v1/token/TOKEN_HASH \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

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

## Security Best Practices

### 1. Never Expose Tokens Client-Side

Tokens should never appear in:

- Frontend JavaScript code
- HTML source
- Client-side configuration files
- Browser localStorage/sessionStorage
- URLs or query parameters

**Correct approach:**

- Store tokens server-side only
- Use backend API proxy
- Never send tokens to browsers

### 2. Use Environment Variables

Store tokens in environment variables, not code:

```bash
# .env file
EMAILENGINE_TOKEN=f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```

```javascript
// Node.js
const token = process.env.EMAILENGINE_TOKEN;
```

**Never commit `.env` files to version control:**

```.gitignore
.env
.env.local
.env.*.local
```

### 3. Use Account-Specific Tokens

For multi-tenant applications, create account-specific tokens:

```javascript
// When user signs up
const response = await fetch("/v1/token", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account: userId,
    description: `Token for user ${userId}`,
    scopes: ["api"],
  }),
});

const { token } = await response.json();

// Store token in your database associated with user
await db.users.update(userId, { emailEngineToken: token });
```

**Benefits:**

- Limits blast radius if token is compromised
- Users can only access their own data
- Easier to audit and revoke individual users

### 4. Rotate Tokens Periodically

Implement token rotation:

```javascript
// Every 90 days
async function rotateUserToken(userId) {
  // Create new token
  const newToken = await createToken(userId);

  // Update user's token
  await db.users.update(userId, { emailEngineToken: newToken });

  // Delete old token (after grace period)
  await deleteOldToken(oldToken);
}
```

### 5. Monitor Token Usage

Track token activity:

- Log authentication attempts
- Monitor unusual access patterns
- Set up alerts for suspicious activity
- Review token usage regularly

### 6. Principle of Least Privilege

Use minimal required scopes:

```javascript
// WRONG: Full access when only API is needed
{
  "scopes": ["*"]
}

// CORRECT: Minimal required scope
{
  "scopes": ["api"]
}
```

