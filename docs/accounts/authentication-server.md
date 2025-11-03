---
title: Using an Authentication Server
sidebar_position: 9
description: Delegate OAuth2 flows to an external authentication server for centralized token management
---

<!--
Sources merged:
- blog/2025-09-01-using-an-authentication-server.md (primary - detailed guide)
- docs/usage/hosted-authentication.md (reference to alternative approaches)
-->

# Using an Authentication Server

The authentication server feature allows you to manage OAuth2 tokens externally while still using EmailEngine for email operations. This is useful when you already have an OAuth2 integration in your application and don't want to ask users for permission twice.

## Overview

### Standard OAuth2 Flow

Normally with EmailEngine:

```mermaid
flowchart TD
    A[User clicks 'Connect Email'] --> B[Redirected to EmailEngine's hosted auth form]
    B --> C[EmailEngine redirects to Google/Microsoft OAuth]
    C --> D[User grants permissions]
    D --> E[EmailEngine stores tokens]
    E --> F[EmailEngine uses tokens for email access]
```

EmailEngine manages the entire OAuth2 lifecycle.

### Authentication Server Flow

With an authentication server:

```mermaid
flowchart TD
    A[User authenticates via YOUR OAuth2 flow] --> B[Your app stores tokens]
    B --> C[You register account in EmailEngine with useAuthServer: true]
    C --> D[When EmailEngine needs authentication]
    D --> E[EmailEngine calls YOUR authentication server]
    E --> F[Your server returns current access token]
    F --> G[EmailEngine uses token for IMAP/SMTP/API]
```

Your application manages tokens, EmailEngine just uses them.

## When to Use Authentication Server

### Good Use Cases

**Existing OAuth2 Integration:**

- You already authenticate users with Google/Microsoft
- Users grant permissions for multiple services at once
- You want to manage tokens centrally
- Avoid asking users for permission multiple times

**Centralized Token Management:**

- Single source of truth for OAuth2 tokens
- Consistent token refresh logic across services
- Easier to audit and monitor token usage
- Simplified token revocation

**Custom Authentication Flows:**

- Non-standard OAuth2 providers
- Custom token acquisition logic
- Special security requirements
- Integration with existing identity systems

### When NOT to Use Authentication Server

**Simple Deployments:**

- EmailEngine is your only OAuth2 integration
- Hosted authentication form is sufficient
- Don't want to maintain a separate authentication service

**Quick Setup:**

- Want to get started fast
- Don't need custom OAuth2 flows
- EmailEngine's built-in OAuth2 is sufficient

:::tip Alternative Approach
If you don't need external OAuth2 management, consider using [Hosted Authentication](/docs/accounts/hosted-authentication) instead. It's simpler and handles everything automatically.
:::

## How It Works

### Authentication Server Protocol

Your authentication server is a simple HTTP endpoint:

**Request from EmailEngine:**

```http
GET /authenticate?account=user123
```

**Response from your server:**

```json
{
  "user": "user@example.com",
  "accessToken": "ya29.a0AWY7Ckl..."
}
```

**Key Points:**

- EmailEngine calls your server when it needs to authenticate
- You must return a **currently valid** (not expired) access token
- Your server handles token refresh logic
- EmailEngine doesn't store tokens, it fetches them on-demand

## Setup Guide

### Step 1: Configure OAuth2 App with Provider

First, set up your OAuth2 application with Google or Microsoft.

#### For Outlook/Microsoft 365

In your Azure AD application, include the required scopes:

**For IMAP/SMTP:**

```
IMAP.AccessAsUser.All
SMTP.Send
offline_access
```

**For MS Graph API:**

```
Mail.ReadWrite
Mail.Send
offline_access
```

Ensure when redirecting users to Microsoft's sign-in page, you include the appropriate scopes in the `scope` parameter.

#### For Gmail

In your Google Cloud Console application, configure the required scopes:

**For IMAP/SMTP:**

```
https://mail.google.com/
```

**For Gmail API:**

```
gmail.modify
```

[See Gmail OAuth2 setup guide for details →](./gmail-imap)
[See Outlook OAuth2 setup guide for details →](./outlook-365)

### Step 2: Build Authentication Server

Create an HTTP endpoint that returns access tokens for accounts.

#### Example Implementation (Node.js)

```javascript
const express = require("express");
const app = express();

// Your token storage (e.g., database, Redis)
const tokenStore = {
  user123: {
    accessToken: "ya29.a0AWY7Ckl...",
    refreshToken: "1//0gDj5...",
    expiresAt: "2024-01-15T10:30:00Z",
  },
};

app.get("/authenticate", async (req, res) => {
  const { account } = req.query;

  if (!account) {
    return res.status(400).json({ error: "Missing account parameter" });
  }

  // Fetch tokens for this account
  const tokens = tokenStore[account];

  if (!tokens) {
    return res.status(404).json({ error: "Account not found" });
  }

  // Check if token is expired
  if (new Date(tokens.expiresAt) <= new Date()) {
    // Token expired, refresh it
    const newTokens = await refreshAccessToken(tokens.refreshToken);

    // Update storage
    tokenStore[account] = newTokens;

    return res.json({
      user: tokens.email,
      accessToken: newTokens.accessToken,
    });
  }

  // Return current token
  res.json({
    user: tokens.email,
    accessToken: tokens.accessToken,
  });
});

async function refreshAccessToken(refreshToken) {
  // Implement token refresh logic for your provider
  // This is provider-specific (Google, Microsoft, etc.)
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    email: data.email,
  };
}

app.listen(3001, () => {
  console.log("Authentication server running on port 3001");
});
```

:::tip Reference Implementation
See the [test implementation on GitHub](https://github.com/postalsys/emailengine/blob/master/examples/auth-server.js) for a complete example.
:::

#### Response Format

Your authentication server must return:

```json
{
  "user": "user@example.com",
  "accessToken": "current-valid-token"
}
```

**Fields:**

- `user` - Email address of the account
- `accessToken` - Currently valid OAuth2 access token (must not be expired)

**Important:** EmailEngine expects the token to be valid immediately. If it's expired, authentication will fail.

### Step 3: Configure EmailEngine

Set the authentication server URL in EmailEngine settings using the [Update Settings API endpoint](/docs/api/post-v-1-settings):

```bash
curl -X POST https://your-ee.com/v1/settings \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "authServer": "https://myservice.com/authenticate"
  }'
```

This tells EmailEngine where to fetch access tokens.

### Step 4: Register Accounts

#### For IMAP/SMTP (Outlook Example)

Register accounts using the [Register Account API endpoint](/docs/api/post-v-1-account):

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@outlook.com",
    "imap": {
      "useAuthServer": true,
      "host": "outlook.office365.com",
      "port": 993,
      "secure": true
    },
    "smtp": {
      "useAuthServer": true,
      "host": "smtp-mail.outlook.com",
      "port": 587,
      "secure": false
    }
  }'
```

**Key Points:**

- Set `useAuthServer: true` in both `imap` and `smtp` sections
- No credentials provided (EmailEngine fetches them from your server)
- Specify IMAP/SMTP host and port normally

#### For Gmail API or MS Graph API

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@gmail.com",
    "oauth2": {
      "useAuthServer": true,
      "provider": "<app-id>",
      "auth": {
        "user": "john@gmail.com"
      }
    }
  }'
```

**Key Points:**

- Set `useAuthServer: true` in `oauth2` section
- Specify `provider` as your OAuth2 app ID in EmailEngine
- `auth.user` should match the email address

:::info OAuth2 App Still Required
Even when using an authentication server with Gmail API or MS Graph API, you must still create the OAuth2 application in EmailEngine. EmailEngine uses the application information for reference (scopes, endpoints, etc.) but doesn't use it to manage tokens - it fetches them from your authentication server instead.
:::

## Authentication Flow

### When EmailEngine Needs to Authenticate

EmailEngine calls your authentication server when:

1. **Initial connection** - When account is first registered
2. **Reconnection** - When connection is lost and needs to be re-established
3. **Token expiration** - When current token expires (IMAP/SMTP sessions)
4. **API operations** - Before each Gmail API or MS Graph API call

### Request from EmailEngine

```http
GET https://myservice.com/authenticate?account=user123
Host: myservice.com
```

Simple GET request with account ID as query parameter.

### Your Server's Response

**Success (200 OK):**

```json
{
  "user": "john@outlook.com",
  "accessToken": "EwBIA8l6..."
}
```

**Account Not Found (404 Not Found):**

```json
{
  "error": "Account not found"
}
```

**Server Error (500 Internal Server Error):**

```json
{
  "error": "Failed to retrieve token"
}
```

### EmailEngine's Behavior

**On Success:**

- Uses the provided access token to authenticate IMAP/SMTP or API connection
- Proceeds with email operations

**On Failure:**

- Account enters error state
- Retries periodically
- Logs error for debugging

## Troubleshooting

### Account Stays in "connecting" State

**Possible Causes:**

1. Authentication server not reachable
2. Authentication server returning errors
3. Returned token is expired
4. Network connectivity issues

**Solution:**

- Check EmailEngine logs for specific errors
- Test authentication server manually: `curl https://myservice.com/authenticate?account=user123`
- Verify token validity
- Check firewall rules

### "authenticationError" State

**Possible Causes:**

1. Access token is invalid or expired
2. User revoked access
3. OAuth2 app configuration changed
4. Token doesn't have required scopes

**Solution:**

- Verify token is valid before returning it
- Implement proper token refresh logic
- Have user re-authenticate in your OAuth2 flow
- Check token scopes match requirements

### Authentication Server Returns 404

**Cause:** Account not found in your token storage.

**Solution:**

- Verify account ID matches between EmailEngine and your storage
- Ensure account was added to your system
- Check for typos in account ID

### Token Expired Despite Refresh

**Possible Issues:**

- Refresh token expired (Microsoft tokens expire after 90 days of inactivity)
- OAuth2 app credentials changed
- User revoked access

**Solution:**

- Have user re-authenticate in your OAuth2 flow
- Update refresh token in your storage
- For Microsoft, ensure regular token refresh to keep refresh token valid

### EmailEngine Makes Too Many Requests

**Cause:** EmailEngine calls authentication server before each operation.

**Solution:**

- This is expected behavior
- Implement caching in your authentication server
- Cache tokens for 5-10 minutes
- Only refresh when needed

**Example with Caching:**

```javascript
const tokenCache = new Map();

app.get("/authenticate", async (req, res) => {
  const { account } = req.query;

  // Check cache
  const cached = tokenCache.get(account);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    // Token valid for at least 5 more minutes
    return res.json({
      user: cached.user,
      accessToken: cached.accessToken,
    });
  }

  // Fetch/refresh token
  const tokens = await getOrRefreshToken(account);

  // Cache it
  tokenCache.set(account, {
    user: tokens.user,
    accessToken: tokens.accessToken,
    expiresAt: new Date(tokens.expiresAt).getTime(),
  });

  res.json({
    user: tokens.user,
    accessToken: tokens.accessToken,
  });
});
```

## Advanced Patterns

### Multiple EmailEngine Instances

If you have multiple EmailEngine instances:

```bash
# Each instance uses the same authentication server
curl -X POST https://ee1.company.com/v1/settings \
  -H "Authorization: Bearer TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{ "authServer": "https://auth.company.com/authenticate" }'

curl -X POST https://ee2.company.com/v1/settings \
  -H "Authorization: Bearer TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{ "authServer": "https://auth.company.com/authenticate" }'
```

All instances share the same centralized token management.

### Per-Account Authentication URLs

For different OAuth2 providers or account types:

Store authentication URLs per account and use a router:

```javascript
const authEndpoints = {
  user123: "https://auth.company.com/google",
  user456: "https://auth.company.com/microsoft",
};

app.get("/authenticate", (req, res) => {
  const { account } = req.query;
  const endpoint = authEndpoints[account];

  if (!endpoint) {
    return res.status(404).json({ error: "Account not found" });
  }

  // Proxy to appropriate endpoint
  fetch(`${endpoint}?account=${account}`)
    .then((r) => r.json())
    .then((data) => res.json(data))
    .catch((err) => res.status(500).json({ error: err.message }));
});
```

### Health Checks

Implement health check endpoint:

```javascript
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
```

Monitor this endpoint to ensure authentication server is running.
