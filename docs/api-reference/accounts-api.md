---
title: Accounts API
description: API endpoints for managing email accounts - register, update, delete, and retrieve account details
sidebar_position: 2
---

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

**Node.js:**
```javascript
const response = await fetch('http://localhost:3000/v1/account', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account: 'user@example.com',
    name: 'John Doe',
    imap: {
      host: 'imap.example.com',
      port: 993,
      secure: true,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    },
    smtp: {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    }
  })
});

const result = await response.json();
console.log('Account registered:', result.account);
```

**Python:**
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

**PHP:**
```php
<?php
$ch = curl_init('http://localhost:3000/v1/account');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_ACCESS_TOKEN',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'account' => 'user@example.com',
    'name' => 'John Doe',
    'imap' => [
        'host' => 'imap.example.com',
        'port' => 993,
        'secure' => true,
        'auth' => [
            'user' => 'user@example.com',
            'pass' => 'password'
        ]
    ]
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
echo "Account registered: " . $result['account'];
```

**cURL:**
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
| `limit` | number | Items per page (default 20, max 250) |
| `state` | string | Filter by account state |

**Examples:**

**Node.js:**
```javascript
const response = await fetch('http://localhost:3000/v1/accounts?limit=50', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
});

const data = await response.json();
console.log(`Total accounts: ${data.total}`);
data.accounts.forEach(account => {
  console.log(`${account.account}: ${account.state}`);
});
```

**Python:**
```python
response = requests.get(
    'http://localhost:3000/v1/accounts',
    params={'limit': 50},
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)

data = response.json()
print(f"Total accounts: {data['total']}")
for account in data['accounts']:
    print(f"{account['account']}: {account['state']}")
```

**cURL:**
```bash
curl "http://localhost:3000/v1/accounts?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

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

**Node.js:**
```javascript
const account = 'user@example.com';
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const details = await response.json();
console.log('Connection state:', details.state);
console.log('Last sync:', new Date(details.syncTime));
```

**Python:**
```python
from urllib.parse import quote

account = 'user@example.com'
response = requests.get(
    f'http://localhost:3000/v1/account/{quote(account)}',
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)

details = response.json()
print(f"Connection state: {details['state']}")
```

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

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
    "auth": {
      "pass": "new_password"
    }
  },
  "smtp": {
    "auth": {
      "pass": "new_password"
    }
  }
}
```

**Examples:**

**Node.js:**
```javascript
const account = 'user@example.com';
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Name',
      imap: {
        auth: {
          pass: 'new_password'
        }
      }
    })
  }
);

const result = await response.json();
console.log('Account updated:', result.success);
```

**cURL:**
```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "imap": {
      "auth": {
        "pass": "new_password"
      }
    }
  }'
```

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

**Node.js:**
```javascript
const account = 'user@example.com';
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const result = await response.json();
console.log('Account deleted:', result.success);
```

**cURL:**
```bash
curl -X DELETE "http://localhost:3000/v1/account/user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

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

**Node.js:**
```javascript
const account = 'user@example.com';
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/reconnect`,
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const result = await response.json();
console.log('Reconnection initiated:', result.success);
```

**cURL:**
```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com/reconnect" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

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

```javascript
async function registerAccounts(accounts) {
  const results = await Promise.all(
    accounts.map(acc =>
      fetch('http://localhost:3000/v1/account', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(acc)
      }).then(r => r.json())
    )
  );

  return results;
}

const accounts = [
  { account: 'user1@example.com', name: 'User 1', imap: { /* ... */ } },
  { account: 'user2@example.com', name: 'User 2', imap: { /* ... */ } }
];

const results = await registerAccounts(accounts);
console.log(`Registered ${results.length} accounts`);
```

### Health Monitoring

Monitor account connection health:

```javascript
async function checkAccountHealth() {
  const response = await fetch('http://localhost:3000/v1/accounts', {
    headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
  });

  const { accounts } = await response.json();

  const unhealthy = accounts.filter(
    acc => acc.state !== 'connected' && acc.state !== 'connecting'
  );

  if (unhealthy.length > 0) {
    console.warn('Unhealthy accounts:', unhealthy.map(a => a.account));
    // Send alerts, attempt reconnection, etc.
  }

  return {
    total: accounts.length,
    connected: accounts.filter(a => a.state === 'connected').length,
    unhealthy: unhealthy.length
  };
}

// Run every 5 minutes
setInterval(checkAccountHealth, 5 * 60 * 1000);
```

### Credential Rotation

Update passwords programmatically:

```javascript
async function rotateCredentials(account, newPassword) {
  // 1. Update credentials
  await fetch(`http://localhost:3000/v1/account/${encodeURIComponent(account)}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imap: { auth: { pass: newPassword } },
      smtp: { auth: { pass: newPassword } }
    })
  });

  // 2. Force reconnection
  await fetch(
    `http://localhost:3000/v1/account/${encodeURIComponent(account)}/reconnect`,
    {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  console.log('Credentials rotated and reconnected');
}
```

### Account Synchronization Status

Track sync progress:

```javascript
async function getSyncStatus(account) {
  const response = await fetch(
    `http://localhost:3000/v1/account/${encodeURIComponent(account)}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const details = await response.json();

  return {
    state: details.state,
    lastSync: new Date(details.syncTime),
    timeSinceSync: Date.now() - details.syncTime,
    isHealthy: details.state === 'connected' && !details.lastError
  };
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

## See Also

- [Account Setup Guides](/docs/accounts)
- [OAuth2 Configuration](/docs/accounts/oauth2-setup)
- [Troubleshooting Accounts](/docs/accounts/troubleshooting)
- [Gmail Setup](/docs/accounts/gmail-api)
- [Outlook Setup](/docs/accounts/outlook-365)
- [Managing Accounts](/docs/accounts/managing-accounts)
