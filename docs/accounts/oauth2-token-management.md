---
title: OAuth2 Token Management
sidebar_position: 7
description: Using EmailEngine to manage OAuth2 tokens and access provider APIs
---

<!--
Sources merged:
- blog/2022-08-02-using-emailengine-to-manage-oauth2-tokens.md (primary - detailed examples)
-->

# OAuth2 Token Management

EmailEngine automatically manages OAuth2 tokens for registered accounts, including refreshing expired access tokens. You can also retrieve these tokens to use with other Google or Microsoft APIs directly.

## Overview

When you register OAuth2 accounts in EmailEngine:

- EmailEngine stores OAuth2 tokens securely in Redis
- Access tokens are automatically refreshed before expiration
- You never need to handle token refresh logic
- Tokens can be retrieved for use with other APIs

This makes EmailEngine a convenient OAuth2 token manager for your entire application, not just for email access.

## Use Cases

### Email-Only Access

Most applications only need EmailEngine for email operations:
- Reading emails via webhooks
- Sending emails via REST API
- Managing folders and messages

EmailEngine handles all OAuth2 complexity transparently.

### Multi-Service Access

Some applications need to access multiple Google/Microsoft services:

**Example with Gmail:**
- EmailEngine accesses Gmail for email operations
- Your app accesses Google Calendar API
- Your app accesses Google Drive API
- All using the same OAuth2 tokens

**Example with Outlook:**
- EmailEngine accesses Outlook for email operations
- Your app accesses Microsoft Calendar API
- Your app accesses OneDrive API
- All using the same OAuth2 tokens

Instead of implementing separate OAuth2 flows, you can:
1. Use EmailEngine for OAuth2 authentication
2. Request additional scopes during setup
3. Retrieve tokens from EmailEngine when needed
4. Use tokens to call provider APIs directly

## Setting Up Multi-Service Access

### Step 1: Configure OAuth2 Scopes

When creating your OAuth2 application (Google Cloud Console or Azure AD), request all scopes you need.

#### Google Example

In Google Cloud Console, add all required scopes:

```
https://mail.google.com/                                    (for email)
https://www.googleapis.com/auth/calendar                    (for calendar)
https://www.googleapis.com/auth/postmaster.readonly         (for postmaster)
https://www.googleapis.com/auth/drive.readonly              (for drive)
```

#### Microsoft Example

In Azure AD, add all required permissions:

```
Mail.ReadWrite        (for email)
Mail.Send             (for sending)
Calendars.ReadWrite   (for calendar)
Files.Read            (for OneDrive)
offline_access        (for token refresh)
```

### Step 2: Configure Additional Scopes in EmailEngine

When setting up the OAuth2 application in EmailEngine, add extra scopes to the **Additional scopes** field.

**Google Example:**

Navigate to **Configuration** → **OAuth2** → Edit your Gmail app.

**Additional scopes** field:
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/postmaster.readonly
```

![Adding additional scopes in EmailEngine](https://cldup.com/content/images/2022/08/Screenshot-2022-08-02-at-11.42.56.png)
<!-- Shows: Additional scopes field in EmailEngine OAuth2 configuration -->

**Microsoft Example:**

Additional Microsoft Graph scopes are automatically included if you add them as delegated permissions in Azure AD. Just ensure they're configured in the Azure app.

### Step 3: Enable OAuth2 Token API Endpoint

For security, the OAuth2 token API endpoint is disabled by default.

Enable it in EmailEngine:

1. Navigate to **Configuration** → **Service**
2. Find the **Security** section
3. Check **Allow the API endpoint for fetching OAuth2 access tokens**
4. Save settings

![Enabling OAuth2 API endpoint](https://cldup.com/content/images/2022/08/Screenshot-2022-08-02-at-11.23.20.png)
<!-- Shows: Security settings with OAuth2 API endpoint checkbox -->

:::warning Security Consideration
The OAuth2 token endpoint returns access tokens that can access user data. Only enable this if you need it, and ensure your EmailEngine API is properly secured with strong access tokens and appropriate access controls.
:::

### Step 4: Enable Required APIs

Make sure the APIs you want to use are enabled in the provider console.

**Google Cloud Console:**

Navigate to **APIs & Services** → **Enabled APIs and services**.

Search for and enable required APIs (e.g., "Google Calendar API", "Gmail Postmaster API").

![Enabling Google Calendar API](https://cldup.com/content/images/2022/08/Screenshot-2022-08-02-at-11.40.56.png)
<!-- Shows: Enabling APIs in Google Cloud Console -->

**Azure AD:**

Permissions added in Azure AD are automatically linked to their respective APIs.

### Step 5: Add Accounts

Add accounts via hosted authentication or API. Users will be asked to grant all configured permissions during consent.

:::important Add Accounts After Scope Configuration
If you add accounts before configuring all scopes, those accounts will be missing the required permissions. You'll need to have users re-authenticate to grant the new permissions.
:::

## Retrieving OAuth2 Tokens

### Get Current Access Token

Retrieve a currently valid access token for an account using the [OAuth2 token API](/docs/api/get-v-1-account-account-oauth-token):

```bash
curl https://your-ee.com/v1/account/example/oauth-token \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN"
```

**Response:**

```json
{
  "account": "example",
  "user": "user@example.com",
  "accessToken": "ya29.a0AVA9y1sXQ....CP1A",
  "registeredScopes": [
    "https://www.googleapis.com/auth/postmaster.readonly",
    "https://mail.google.com/"
  ],
  "expires": "2022-07-08T14:25:27.780Z"
}
```

**Response Fields:**

- `account` - Account ID in EmailEngine
- `user` - Email address of the account
- `accessToken` - Currently valid OAuth2 access token
- `registeredScopes` - List of scopes this token has access to
- `expires` - When the access token expires (ISO 8601)

:::tip Token Validity
EmailEngine ensures the returned access token is valid and not expired. If the token is about to expire, EmailEngine automatically refreshes it before returning.
:::

### Token Lifetime

**Google:**
- Access tokens expire after 1 hour
- EmailEngine refreshes them automatically
- Refresh tokens don't expire (unless revoked)

**Microsoft:**
- Access tokens expire after 1 hour
- Refresh tokens expire after 90 days of inactivity
- EmailEngine keeps them active by regular refresh

## Using Tokens with Provider APIs

### Google API Example

Retrieve token from EmailEngine:

```bash
curl https://your-ee.com/v1/account/example/oauth-token \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN"
```

Use the access token with Google APIs:

```bash
curl https://gmailpostmastertools.googleapis.com/v1/domains \
  -H "Authorization: Bearer ya29.a0AVA9y1sXQ....CP1A"
```

**Response:**

```json
{
  "domains": [
    {
      "name": "domains/example.com",
      "createTime": "2020-01-15T12:30:00Z",
      "permission": "OWNER"
    }
  ]
}
```

### Google Calendar Example

```bash
# Get token
TOKEN=$(curl -s https://your-ee.com/v1/account/example/oauth-token \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  | jq -r '.accessToken')

# List calendars
curl https://www.googleapis.com/calendar/v3/users/me/calendarList \
  -H "Authorization: Bearer $TOKEN"
```

### Microsoft Graph Example

```bash
# Get token
curl https://your-ee.com/v1/account/example/oauth-token \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN"

# Use with Microsoft Graph
curl https://graph.microsoft.com/v1.0/me/calendars \
  -H "Authorization: Bearer EwBIA8l6..."
```

### Example: Creating a Calendar Event

Using EmailEngine's OAuth2 tokens to create a Google Calendar event:

```javascript
// Get current access token from EmailEngine
const tokenResponse = await fetch(
  'https://your-ee.com/v1/account/user123/oauth-token',
  {
    headers: {
      'Authorization': 'Bearer YOUR_EMAILENGINE_TOKEN'
    }
  }
);

const { accessToken } = await tokenResponse.json();

// Create calendar event
const eventResponse = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: 'Team Meeting',
      start: {
        dateTime: '2024-01-15T10:00:00-07:00',
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: '2024-01-15T11:00:00-07:00',
        timeZone: 'America/Los_Angeles'
      },
      attendees: [
        { email: 'colleague@example.com' }
      ]
    })
  }
);

const event = await eventResponse.json();
console.log('Event created:', event.htmlLink);
```

## Token Refresh

EmailEngine handles token refresh automatically:

**When EmailEngine Refreshes Tokens:**
- Before access token expires (proactive refresh)
- When an API operation fails with token expiration error (reactive refresh)
- During account reconnection
- When you request a token via the API (if expired)

**What EmailEngine Does:**
1. Checks if access token is expired or about to expire
2. Uses refresh token to get a new access token
3. Updates stored credentials in Redis
4. Returns the fresh access token

**Your Responsibility:**
- Nothing! EmailEngine handles everything
- Just retrieve tokens when you need them
- They'll always be valid and up-to-date

:::tip Caching Tokens
While you can cache tokens in your application for a short time (e.g., 5-10 minutes), it's usually simpler to just request them from EmailEngine on-demand. EmailEngine's token retrieval is fast and guarantees validity.
:::

## Token Expiration Handling

Even though EmailEngine provides valid tokens, API calls can still fail due to timing:

```javascript
async function callGoogleAPI(account, endpoint) {
  // Get token
  const tokenResponse = await fetch(
    `https://your-ee.com/v1/account/${account}/oauth-token`,
    {
      headers: { 'Authorization': `Bearer ${EMAILENGINE_TOKEN}` }
    }
  );

  const { accessToken } = await tokenResponse.json();

  // Call Google API
  const apiResponse = await fetch(endpoint, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  // Handle token expiration
  if (apiResponse.status === 401) {
    console.log('Token expired between retrieval and use, retrying...');

    // Get fresh token and retry
    const newTokenResponse = await fetch(
      `https://your-ee.com/v1/account/${account}/oauth-token`,
      {
        headers: { 'Authorization': `Bearer ${EMAILENGINE_TOKEN}` }
      }
    );

    const { accessToken: newToken } = await newTokenResponse.json();

    // Retry with new token
    return fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
  }

  return apiResponse;
}
```

## Security Considerations

### Protecting Access Tokens

OAuth2 access tokens are powerful:
- They provide access to user data
- They should be treated like passwords
- Never log them or expose them in client-side code

**Best Practices:**

- Store EmailEngine API token securely (environment variable, secret manager)
- Make token requests from server-side code only
- Never send access tokens to client browsers
- Use HTTPS for all API communications
- Set appropriate API token permissions in EmailEngine

### Access Control

Control who can retrieve tokens:

**EmailEngine API Tokens:**
- Create separate tokens for different services
- Use scopes to limit token permissions (if available)
- Rotate tokens regularly
- Revoke unused tokens

**IP Restrictions:**
- Configure EmailEngine to accept API requests only from trusted IPs
- Use firewall rules to protect EmailEngine instance

**Monitoring:**
- Log OAuth2 token retrievals
- Alert on unusual token access patterns
- Monitor for failed authentication attempts

### Token Scope Limitation

Only request scopes you actually need:

**Bad Example:**
```
https://www.googleapis.com/auth/drive        (full Drive access)
```

**Good Example:**
```
https://www.googleapis.com/auth/drive.readonly    (read-only)
```

Limiting scopes:
- Reduces security risk
- Makes approval easier
- Builds user trust
- May be required by provider review

## Troubleshooting

### Token Endpoint Returns 403 Forbidden

**Cause:** OAuth2 token API endpoint is disabled.

**Solution:** Enable it in EmailEngine settings:
- Configuration → Service → Security
- Check "Allow the API endpoint for fetching OAuth2 access tokens"

### Token Has Missing Scopes

**Cause:** Scopes were added after account was registered.

**Solution:** Have user re-authenticate:
1. Update OAuth2 app configuration with new scopes
2. Generate new authentication form URL
3. User completes OAuth flow again
4. New scopes will be granted

### API Call Returns "Insufficient Permissions"

**Possible Causes:**
1. Required scope not configured in OAuth2 app
2. Required API not enabled in provider console
3. User didn't grant permission during consent
4. Token doesn't have the required scope

**Solution:**
1. Verify scope is configured in provider console (Google Cloud / Azure AD)
2. Verify API is enabled
3. Check `registeredScopes` in token response
4. Have user re-authenticate if needed

### Refresh Token Expired (Microsoft)

**Cause:** Microsoft refresh tokens expire after 90 days of inactivity.

**Solution:**
- EmailEngine keeps tokens active by regular use
- If expired, user must re-authenticate
- Cannot be prevented, but rare in active accounts

### Token Request Returns "Account Not Found"

**Cause:** Account ID is incorrect or account was deleted.

**Solution:**
- Verify account ID
- Check account exists: `GET /v1/account/{account}`
- Account may have been deleted

## Advanced Patterns

### Token Caching Strategy

For high-volume applications:

```javascript
const tokenCache = new Map();

async function getCachedToken(account) {
  const cached = tokenCache.get(account);

  // Use cached token if valid for at least 5 more minutes
  if (cached && cached.expires > Date.now() + 5 * 60 * 1000) {
    return cached.accessToken;
  }

  // Fetch fresh token
  const response = await fetch(
    `https://your-ee.com/v1/account/${account}/oauth-token`,
    {
      headers: { 'Authorization': `Bearer ${EMAILENGINE_TOKEN}` }
    }
  );

  const data = await response.json();

  // Cache it
  tokenCache.set(account, {
    accessToken: data.accessToken,
    expires: new Date(data.expires).getTime()
  });

  return data.accessToken;
}
```

### Batch Token Retrieval

If you need tokens for multiple accounts:

```javascript
async function getMultipleTokens(accounts) {
  const requests = accounts.map(account =>
    fetch(`https://your-ee.com/v1/account/${account}/oauth-token`, {
      headers: { 'Authorization': `Bearer ${EMAILENGINE_TOKEN}` }
    }).then(r => r.json())
  );

  const tokens = await Promise.all(requests);

  return tokens.reduce((acc, token) => {
    acc[token.account] = token.accessToken;
    return acc;
  }, {});
}

// Usage
const tokens = await getMultipleTokens(['user1', 'user2', 'user3']);
console.log(tokens.user1);  // Access token for user1
```

### Service-Specific Wrappers

Create reusable wrappers for different services:

```javascript
class GoogleCalendarClient {
  constructor(emailengineUrl, emailengineToken) {
    this.emailengineUrl = emailengineUrl;
    this.emailengineToken = emailengineToken;
  }

  async getToken(account) {
    const response = await fetch(
      `${this.emailengineUrl}/v1/account/${account}/oauth-token`,
      {
        headers: { 'Authorization': `Bearer ${this.emailengineToken}` }
      }
    );

    const { accessToken } = await response.json();
    return accessToken;
  }

  async listCalendars(account) {
    const token = await this.getToken(account);

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    return response.json();
  }

  async createEvent(account, calendarId, event) {
    const token = await this.getToken(account);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    return response.json();
  }
}

// Usage
const calendar = new GoogleCalendarClient(
  'https://your-ee.com',
  process.env.EMAILENGINE_TOKEN
);

const calendars = await calendar.listCalendars('user123');
console.log('Calendars:', calendars);
```
