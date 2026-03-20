---
title: "authenticationError"
sidebar_position: 19
description: "Webhook event triggered when EmailEngine fails to authenticate an email account"
---

# authenticationError

The `authenticationError` webhook event is triggered when EmailEngine fails to authenticate an email account. This event helps you monitor account health and take action when credentials become invalid or authentication issues arise.

## When This Event is Triggered

The `authenticationError` event fires when:

- IMAP authentication fails due to invalid credentials
- OAuth2 access token renewal fails
- OAuth2 API request returns an authentication error (Gmail API, Microsoft Graph API)
- The email server rejects the login attempt

EmailEngine uses intelligent error tracking to avoid spamming your webhook endpoint. The event is only sent on the **first occurrence** of an authentication error for an account. Subsequent identical errors are suppressed until the account successfully authenticates again or the error state changes.

## Common Use Cases

- **Account monitoring** - Alert administrators when user accounts fail authentication
- **Credential rotation** - Trigger workflows to refresh or request new credentials
- **User notification** - Inform users that their email connection needs attention
- **Dashboard updates** - Update account status in your application's UI
- **Automated remediation** - Attempt to refresh OAuth2 tokens or re-authenticate
- **Compliance logging** - Track authentication failures for security audits

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that failed authentication |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "authenticationError" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Error details object (see below) |

### Error Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `response` | string | Yes | Error message describing the authentication failure |
| `serverResponseCode` | string | No | Server or API error code identifying the failure type |
| `tokenRequest` | object | No | OAuth2 token request details (for OAuth2 errors only) |

### Token Request Object (`tokenRequest`)

When OAuth2 token renewal fails, additional details may be included:

| Field | Type | Description |
|-------|------|-------------|
| `grant` | string | OAuth2 grant type used (e.g., "refresh_token") |
| `provider` | string | OAuth2 provider (e.g., "gmail", "outlook", "mailRu") |
| `status` | number | HTTP status code from the token endpoint |
| `clientId` | string | OAuth2 client ID used (partially masked) |
| `scopes` | array | OAuth2 scopes requested |

## Server Response Codes

Common `serverResponseCode` values you may encounter:

| Code | Description |
|------|-------------|
| `AUTHENTICATIONFAILED` | IMAP server rejected the credentials |
| `OauthRenewError` | Failed to renew OAuth2 access token |
| `ApiRequestError` | API request returned an authentication error |
| `AUTHORIZATIONFAILED` | Authorization was denied by the server |
| `WEBALERT` | Gmail requires web login for security verification |

## Example Payload (IMAP Authentication)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:30:00.000Z",
  "event": "authenticationError",
  "data": {
    "response": "Invalid credentials (Failure)",
    "serverResponseCode": "AUTHENTICATIONFAILED"
  }
}
```

## Example Payload (OAuth2 Token Renewal)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user456",
  "date": "2025-10-17T15:45:00.000Z",
  "event": "authenticationError",
  "data": {
    "response": "Token has been expired or revoked.",
    "serverResponseCode": "OauthRenewError",
    "tokenRequest": {
      "grant": "refresh_token",
      "provider": "gmail",
      "status": 400,
      "clientId": "12345...apps.googleusercontent.com",
      "scopes": [
        "https://mail.google.com/",
        "https://www.googleapis.com/auth/gmail.send"
      ]
    }
  }
}
```

## Example Payload (API Request Error)

For Gmail API or Microsoft Graph API accounts:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user789",
  "date": "2025-10-17T16:20:00.000Z",
  "event": "authenticationError",
  "data": {
    "response": "The access token has expired or is not yet valid.",
    "serverResponseCode": "ApiRequestError"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleAuthenticationError(event) {
  const { account, data } = event;

  console.error(`Authentication failed for account ${account}:`);
  console.error(`  Error: ${data.response}`);
  console.error(`  Code: ${data.serverResponseCode || 'N/A'}`);

  // Take appropriate action based on error type
  switch (data.serverResponseCode) {
    case 'OauthRenewError':
      await handleOAuthError(account, data);
      break;
    case 'AUTHENTICATIONFAILED':
      await handleCredentialError(account, data);
      break;
    default:
      await notifyAdmin(account, data);
  }
}

async function handleOAuthError(account, data) {
  // OAuth token expired - may need user re-authorization
  console.log(`OAuth token expired for ${account}`);

  // Option 1: Notify user to re-authenticate
  await sendUserNotification(account, 'Please reconnect your email account');

  // Option 2: If using service account, attempt refresh
  // await refreshServiceAccountToken(account);
}

async function handleCredentialError(account, data) {
  // Password may have changed
  console.log(`Credentials invalid for ${account}`);
  await sendUserNotification(account, 'Please update your email password');
}
```

### Alerting Administrators

```javascript
async function handleAuthenticationError(event) {
  const { account, data, date } = event;

  // Send alert to monitoring system
  await sendAlert({
    severity: 'warning',
    title: 'Email Authentication Failed',
    message: `Account ${account} failed to authenticate`,
    details: {
      account,
      error: data.response,
      code: data.serverResponseCode,
      timestamp: date
    }
  });
}
```

### Updating Account Status in Database

```javascript
async function handleAuthenticationError(event) {
  const { account, data, date } = event;

  // Update account status in your database
  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'authentication_error',
      lastError: data.response,
      lastErrorCode: data.serverResponseCode,
      lastErrorAt: new Date(date)
    }
  });

  // Trigger UI notification if user is online
  await notifyConnectedUser(account, {
    type: 'account_error',
    message: 'Email connection lost - please reconnect'
  });
}
```

## Error Recovery

### Automatic IMAP Disabling

EmailEngine has built-in protection against repeated authentication failures. If an account continues to fail authentication over an extended period (default: 3 days), EmailEngine will automatically disable IMAP for that account to prevent:

- Continued failed login attempts that may trigger account lockouts
- Unnecessary load on the mail server
- Repeated webhook spam

When this happens, the account's IMAP configuration will be marked as `disabled: true`. To re-enable:

1. Fix the underlying credential issue
2. Update the account credentials via API
3. The account will attempt to reconnect automatically

### Re-authenticating an Account

If you need to update credentials after an authentication error:

```bash
# Update IMAP credentials
curl -X PUT "https://your-emailengine.com/v1/account/user123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imap": {
      "auth": {
        "user": "user@example.com",
        "pass": "new-password"
      }
    }
  }'
```

For OAuth2 accounts, the user typically needs to go through the authentication flow again to obtain new tokens.

## Webhook Deduplication

EmailEngine tracks error states to prevent webhook flooding. Key behaviors:

1. **First occurrence** - Webhook is sent immediately when authentication first fails
2. **Repeated failures** - Subsequent identical errors do NOT trigger new webhooks
3. **State change** - A new webhook is sent only when:
   - The account successfully authenticates (triggers `authenticationSuccess`)
   - The error message or code changes
   - The account is reconnected after being disabled

This means you can rely on receiving exactly one `authenticationError` webhook per failure episode, making it safe to trigger alerts without rate limiting on your end.

## Related Events

- [authenticationSuccess](/docs/webhooks/authenticationsuccess) - Triggered when authentication succeeds (if documented)
- [connectError](/docs/webhooks/connecterror) - Triggered when connection fails (network-level, not authentication)
- [accountAdded](/docs/webhooks/accountadded) - Triggered when a new account is registered
- [accountDeleted](/docs/webhooks/accountdeleted) - Triggered when an account is removed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Account Management](/docs/accounts) - Managing email accounts
- [Gmail OAuth2 Setup](/docs/accounts/gmail/gmail-imap) - Setting up Gmail with OAuth2
- [Outlook OAuth2 Setup](/docs/accounts/microsoft-365/outlook-365) - Setting up Outlook with OAuth2
- [Troubleshooting](/docs/troubleshooting) - Common issues and solutions
