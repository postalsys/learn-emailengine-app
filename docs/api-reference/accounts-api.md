---
title: Accounts API
description: API endpoints for managing email accounts - register, update, delete, and retrieve account details
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Accounts API

The Accounts API allows you to programmatically manage email accounts in EmailEngine. You can register new accounts, update settings, monitor connection status, and handle OAuth2 authentication.

## Overview

Email accounts are the core resource in EmailEngine. Each account represents a connection to an email service (Gmail, Outlook, IMAP/SMTP server) and maintains:

- Connection credentials (OAuth2 tokens or passwords)
- Mailbox synchronization state
- Account-specific settings
- Connection status and health

### Account Object Structure

```json
{
  "account": "user@example.com",
  "name": "John Doe",
  "email": "user@example.com",
  "state": "connected",
  "syncTime": 1640995200000,
  "syncFrom": "2025-01-01T00:00:00.000Z",
  "lastError": null,
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "disabled": false
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "disabled": false
  },
  "oauth2": {
    "enabled": true,
    "provider": "gmail",
    "auth": {
      "user": "user@example.com"
    }
  }
}
```

### Account States

| State | Description |
|-------|-------------|
| `init` | Account registered, connection not attempted |
| `connecting` | Attempting to connect to mail server |
| `connected` | Successfully connected and syncing |
| `authenticationError` | Authentication failed (invalid credentials) |
| `connectError` | Connection failed (network or server issue) |
| `disconnected` | Manually disconnected |
| `suspended` | Temporarily suspended due to repeated errors |

## Common Operations

### 1. Register Account

Register a new email account with EmailEngine.

**Endpoint:** `POST /v1/account`

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `account` | string | Yes | Unique account identifier (usually email address) |
| `name` | string | No | Display name for the account |
| `email` | string | No | Email address (defaults to `account`) |
| `imap` | object | Yes* | IMAP connection settings |
| `smtp` | object | No | SMTP connection settings |
| `oauth2` | object | No | OAuth2 settings |
| `syncFrom` | string | No | ISO date to sync from (default: 1 week ago) |

*Either `imap` or `oauth2` is required.

**IMAP Configuration:**

```json
{
  "host": "imap.example.com",
  "port": 993,
  "secure": true,
  "auth": {
    "user": "username",
    "pass": "password"
  }
}
```

**SMTP Configuration:**

```json
{
  "host": "smtp.example.com",
  "port": 465,
  "secure": true,
  "auth": {
    "user": "username",
    "pass": "password"
  }
}
```

**Examples:**

<Tabs groupId="programming-language">
<TabItem value="curl" label="cURL">

```bash
curl -X POST http://localhost:3000/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user@example.com",
    "name": "John Doe",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "user@example.com",
        "pass": "password"
      }
    }
  }'
```

</TabItem>
<TabItem value="python" label="Python">

```python
import requests

response = requests.post(
    'http://localhost:3000/v1/account',
    headers={
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'account': 'user@example.com',
        'name': 'John Doe',
        'imap': {
            'host': 'imap.example.com',
            'port': 993,
            'secure': True,
            'auth': {
                'user': 'user@example.com',
                'pass': 'password'
            }
        }
    }
)

result = response.json()
print(f"Account registered: {result['account']}")
```

</TabItem>
</Tabs>

**Pseudo code:**
```
// Register a new email account
response = HTTP_POST("http://localhost:3000/v1/account", {
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
  },
  body: {
    account: "user@example.com",
    name: "John Doe",
    imap: {
      host: "imap.example.com",
      port: 993,
      secure: true,
      auth: {
        user: "user@example.com",
        pass: "password"
      }
    },
    smtp: {
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "user@example.com",
        pass: "password"
      }
    }
  }
})

result = PARSE_JSON(response.body)
PRINT("Account registered: " + result.account)
```

**Response:**
```json
{
  "account": "user@example.com",
  "state": "init"
}
```

**Use Cases:**
- Onboarding new users to your application
- Allowing users to connect multiple email accounts
- Automated account provisioning in bulk

[Detailed API reference →](/docs/api/post-v-1-account)

---

### 2. List Accounts

Retrieve all registered accounts.

**Endpoint:** `GET /v1/accounts`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (0-indexed) |
| `pageSize` | number | Items per page (default 20) |
| `state` | string | Filter by account state |
| `query` | string | Filter accounts by string match |

**Examples:**

<Tabs groupId="programming-language">
<TabItem value="curl" label="cURL">

```bash
curl "http://localhost:3000/v1/accounts?pageSize=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

</TabItem>
<TabItem value="pseudocode" label="Pseudo code">


```
// List all accounts with pagination
response = HTTP_GET("http://localhost:3000/v1/accounts?pageSize=50", {
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
  }
})

data = PARSE_JSON(response.body)
PRINT("Total accounts: " + data.total)

for each account in data.accounts {
  PRINT(account.account + ": " + account.state)
}
```

</TabItem>
</Tabs>

**Response:**
```json
{
  "total": 2,
  "page": 0,
  "pages": 1,
  "accounts": [
    {
      "account": "user1@example.com",
      "name": "John Doe",
      "email": "user1@example.com",
      "state": "connected"
    },
    {
      "account": "user2@example.com",
      "name": "Jane Smith",
      "email": "user2@example.com",
      "state": "authenticationError"
    }
  ]
}
```

**Use Cases:**
- Dashboard displaying all connected accounts
- Health monitoring across accounts
- Bulk operations on multiple accounts

[Detailed API reference →](/docs/api/get-v-1-accounts)

---

### 3. Get Account Details

Retrieve detailed information about a specific account.

**Endpoint:** `GET /v1/account/:account`

**Path Parameters:**

| Parameter | Description |
|-----------|-------------|
| `account` | Account identifier |

**Examples:**

<Tabs groupId="programming-language">
<TabItem value="curl" label="cURL">

```bash
curl "http://localhost:3000/v1/account/user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

</TabItem>
<TabItem value="pseudocode" label="Pseudo code">


```
// Get detailed information about a specific account
account = "user@example.com"

response = HTTP_GET(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account),
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

details = PARSE_JSON(response.body)
PRINT("Connection state: " + details.state)
PRINT("Last sync: " + details.syncTime)
```

</TabItem>
</Tabs>

**Response:**
```json
{
  "account": "user@example.com",
  "name": "John Doe",
  "email": "user@example.com",
  "state": "connected",
  "syncTime": 1640995200000,
  "lastError": null,
  "counters": {
    "sent": 42,
    "received": 128
  }
}
```

**Use Cases:**
- Displaying account status in user interface
- Checking connection health
- Retrieving account statistics

[Detailed API reference →](/docs/api/get-v-1-account-account)

---

### 4. Update Account

Update account settings or credentials.

**Endpoint:** `PUT /v1/account/:account`

**Request Body:**
```json
{
  "name": "New Display Name",
  "imap": {
    "partial": true,
    "port": 993
  },
  "smtp": {
    "partial": true,
    "port": 465
  }
}
```

:::tip Partial Updates
Use `"partial": true` inside `imap`, `smtp`, or `oauth2` objects to update only the specified fields instead of replacing the entire configuration. Without this flag, the entire object will be replaced, potentially losing existing settings.

**Note:** The `partial` flag only works for main-level objects (`imap`, `smtp`, `oauth2`), not for nested objects like `imap.auth`.
:::

**Examples:**

<Tabs groupId="programming-language">
<TabItem value="curl" label="cURL">

```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "imap": {
      "partial": true,
      "port": 993
    }
  }'
```

</TabItem>
<TabItem value="pseudocode" label="Pseudo code">


```
// Update account settings or credentials
account = "user@example.com"

response = HTTP_PUT(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account),
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      name: "Updated Name",
      imap: {
        partial: true,
        port: 993
      }
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Account updated: " + result.success)
```

</TabItem>
</Tabs>

**Use Cases:**
- Updating account credentials after password change
- Changing display names
- Modifying connection settings

[Detailed API reference →](/docs/api/put-v-1-account-account)

---

### 5. Delete Account

Remove an account and stop synchronization.

**Endpoint:** `DELETE /v1/account/:account`

**Examples:**

<Tabs groupId="programming-language">
<TabItem value="curl" label="cURL">

```bash
curl -X DELETE "http://localhost:3000/v1/account/user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

</TabItem>
<TabItem value="pseudocode" label="Pseudo code">


```
// Delete an account
account = "user@example.com"

response = HTTP_DELETE(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account),
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Account deleted: " + result.success)
```

</TabItem>
</Tabs>

**Response:**
```json
{
  "success": true,
  "account": "user@example.com"
}
```

**Use Cases:**
- User disconnecting their email account
- Removing inactive accounts
- Cleanup during offboarding

[Detailed API reference →](/docs/api/delete-v-1-account-account)

---

### 6. Reconnect Account

Force reconnection to mail server (useful after credential updates).

**Endpoint:** `PUT /v1/account/:account/reconnect`

**Examples:**

<Tabs groupId="programming-language">
<TabItem value="curl" label="cURL">

```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com/reconnect" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

</TabItem>
<TabItem value="pseudocode" label="Pseudo code">


```
// Force account reconnection
account = "user@example.com"

response = HTTP_PUT(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/reconnect",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Reconnection initiated: " + result.success)
```

</TabItem>
</Tabs>

**Use Cases:**
- Testing connection after credential update
- Recovering from connection errors
- Manual reconnection trigger

[Detailed API reference →](/docs/api/put-v-1-account-account-reconnect)

---

## Account Object Reference

### Complete Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `account` | string | Unique account identifier |
| `name` | string | Display name |
| `email` | string | Email address |
| `state` | string | Connection state (see Account States) |
| `syncTime` | number | Unix timestamp of last sync |
| `syncFrom` | string | ISO date to sync messages from |
| `lastError` | object | Last error details (if any) |
| `imap` | object | IMAP connection settings |
| `smtp` | object | SMTP connection settings |
| `oauth2` | object | OAuth2 configuration |
| `counters` | object | Message statistics |

### Account States

Detailed state descriptions:

**`init`**
- Account just registered
- No connection attempt made yet
- Waiting for initial connection

**`connecting`**
- Attempting to establish connection
- Authenticating credentials
- Retrieving mailbox list

**`connected`**
- Successfully connected
- Actively syncing messages
- Healthy state

**`authenticationError`**
- Invalid credentials
- OAuth2 token expired
- Action required: update credentials

**`connectError`**
- Network connectivity issues
- Mail server unavailable
- Temporary state, will auto-retry

**`disconnected`**
- Manually disconnected via API
- Not syncing messages
- Can be reconnected

**`suspended`**
- Too many repeated errors
- Automatic safety mechanism
- Requires manual intervention

## Common Patterns

### Bulk Account Registration

Register multiple accounts efficiently:

```
// Pseudo code: Register multiple accounts in parallel
function registerAccounts(accounts) {
  results = []

  // Process accounts in parallel
  for each acc in accounts {
    response = HTTP_POST("http://localhost:3000/v1/account", {
      headers: {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json"
      },
      body: acc
    })

    result = PARSE_JSON(response.body)
    results = results + [result]
  }

  return results
}

// Example usage
accounts = [
  { account: "user1@example.com", name: "User 1", imap: { /* ... */ } },
  { account: "user2@example.com", name: "User 2", imap: { /* ... */ } }
]

results = registerAccounts(accounts)
PRINT("Registered " + LENGTH(results) + " accounts")
```

### Health Monitoring

Monitor account connection health:

```
// Pseudo code: Monitor account health
function checkAccountHealth() {
  // Get all accounts
  response = HTTP_GET("http://localhost:3000/v1/accounts", {
    headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
  })

  accounts = PARSE_JSON(response.body).accounts

  // Find unhealthy accounts
  unhealthy = []
  for each acc in accounts {
    if (acc.state != "connected" AND acc.state != "connecting") {
      unhealthy = unhealthy + [acc]
    }
  }

  // Alert if issues found
  if (LENGTH(unhealthy) > 0) {
    PRINT("WARNING: Unhealthy accounts found")
    for each acc in unhealthy {
      PRINT("  - " + acc.account + ": " + acc.state)
    }
    // Send alerts, attempt reconnection, etc.
  }

  // Return summary
  connected = FILTER(accounts, state == "connected")
  return {
    total: LENGTH(accounts),
    connected: LENGTH(connected),
    unhealthy: LENGTH(unhealthy)
  }
}

// Run periodically (every 5 minutes)
SCHEDULE(checkAccountHealth, interval: 5 * 60 * 1000)
```

### Credential Rotation

Update passwords programmatically:

```
// Pseudo code: Rotate account credentials
function rotateCredentials(account, newPassword) {
  // Step 1: Update credentials
  HTTP_PUT(
    "http://localhost:3000/v1/account/" + URL_ENCODE(account),
    {
      headers: {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json"
      },
      body: {
        imap: { auth: { pass: newPassword } },
        smtp: { auth: { pass: newPassword } }
      }
    }
  )

  // Step 2: Force reconnection to apply new credentials
  HTTP_PUT(
    "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/reconnect",
    {
      headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
    }
  )

  PRINT("Credentials rotated and reconnected")
}
```

### Account Synchronization Status

Track sync progress:

```
// Pseudo code: Get account sync status
function getSyncStatus(account) {
  // Get account details
  response = HTTP_GET(
    "http://localhost:3000/v1/account/" + URL_ENCODE(account),
    {
      headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
    }
  )

  details = PARSE_JSON(response.body)

  // Calculate status
  currentTime = CURRENT_TIMESTAMP()
  timeSinceSync = currentTime - details.syncTime
  isHealthy = (details.state == "connected" AND details.lastError == null)

  return {
    state: details.state,
    lastSync: details.syncTime,
    timeSinceSync: timeSinceSync,
    isHealthy: isHealthy
  }
}
```

## Error Handling

### Common Errors

**Account Already Exists:**
```json
{
  "error": "Account already exists",
  "code": "AccountExists",
  "statusCode": 409
}
```
**Solution:** Use PUT to update existing account or choose different account ID.

**Authentication Failed:**
```json
{
  "error": "Authentication failed",
  "code": "AuthenticationError",
  "statusCode": 400
}
```
**Solution:** Verify credentials, check if 2FA/app passwords are required.

**Account Not Found:**
```json
{
  "error": "Account not found",
  "code": "AccountNotFound",
  "statusCode": 404
}
```
**Solution:** Verify account ID is correct and account exists.

### Troubleshooting

For accounts stuck in error states:

1. Check `lastError` field for details
2. Verify credentials are current
3. Test connection with manual reconnect
4. Check mail server accessibility
5. Review OAuth2 token expiration
