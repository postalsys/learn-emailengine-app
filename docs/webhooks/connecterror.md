---
title: "connectError"
sidebar_position: 20
description: "Webhook event triggered when EmailEngine fails to establish a connection to an email server"
---

# connectError

The `connectError` webhook event is triggered when EmailEngine fails to establish a connection to an email server. This event indicates network-level or server-level connection failures that are distinct from authentication errors.

## When This Event is Triggered

The `connectError` event fires when:

- The email server is unreachable (network timeout, DNS failure)
- The server refuses the connection (port closed, firewall blocking)
- TLS/SSL handshake fails
- The server returns a connection-level error before authentication
- The IMAP or SMTP connection is interrupted unexpectedly

This event is specifically for connection failures that occur **before or outside of authentication**. If the connection succeeds but authentication fails, an [authenticationError](/docs/webhooks/authenticationerror) event is triggered instead.

EmailEngine uses intelligent error tracking to avoid spamming your webhook endpoint. The event is only sent on the **first occurrence** of a connection error for an account. Subsequent identical errors are suppressed until the account successfully connects again or the error state changes.

## Common Use Cases

- **Infrastructure monitoring** - Detect when email servers become unavailable
- **Network diagnostics** - Identify connectivity issues between EmailEngine and mail servers
- **Account health dashboards** - Display connection status in your application
- **Automated alerting** - Notify administrators of server outages
- **Failover triggers** - Initiate backup connection strategies
- **SLA tracking** - Monitor uptime and connection reliability

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that experienced the connection failure |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "connectError" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Error details object (see below) |

### Error Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `response` | string | Yes | Error message describing the connection failure |
| `serverResponseCode` | string | No | Error code identifying the failure type |

## Server Response Codes

Common `serverResponseCode` values you may encounter:

| Code | Description |
|------|-------------|
| `ECONNREFUSED` | Connection refused - server not accepting connections on the specified port |
| `ECONNRESET` | Connection reset - server closed the connection unexpectedly |
| `ETIMEDOUT` | Connection timed out - no response from server |
| `ENOTFOUND` | DNS lookup failed - hostname could not be resolved |
| `EHOSTUNREACH` | Host unreachable - no route to the server |
| `ECONNABORTED` | Connection aborted - operation was cancelled |
| `CERT_HAS_EXPIRED` | TLS certificate has expired |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | TLS certificate verification failed |
| `SELF_SIGNED_CERT_IN_CHAIN` | Self-signed certificate detected |
| `DEPTH_ZERO_SELF_SIGNED_CERT` | Server using self-signed certificate |

## Example Payload (Connection Refused)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:30:00.000Z",
  "event": "connectError",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": {
    "response": "connect ECONNREFUSED 192.168.1.100:993",
    "serverResponseCode": "ECONNREFUSED"
  }
}
```

## Example Payload (Connection Timeout)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "office-account",
  "date": "2025-10-17T15:45:00.000Z",
  "event": "connectError",
  "eventId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "data": {
    "response": "connect ETIMEDOUT 10.0.0.50:993",
    "serverResponseCode": "ETIMEDOUT"
  }
}
```

## Example Payload (DNS Failure)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "remote-user",
  "date": "2025-10-17T16:20:00.000Z",
  "event": "connectError",
  "eventId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": {
    "response": "getaddrinfo ENOTFOUND mail.invalid-domain.example",
    "serverResponseCode": "ENOTFOUND"
  }
}
```

## Example Payload (TLS Certificate Error)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "secure-account",
  "date": "2025-10-17T17:00:00.000Z",
  "event": "connectError",
  "eventId": "d4e5f6a7-b8c9-0123-defa-456789012345",
  "data": {
    "response": "certificate has expired",
    "serverResponseCode": "CERT_HAS_EXPIRED"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleConnectError(event) {
  const { account, data, date } = event;

  console.error(`Connection failed for account ${account}:`);
  console.error(`  Error: ${data.response}`);
  console.error(`  Code: ${data.serverResponseCode || 'N/A'}`);

  // Take appropriate action based on error type
  switch (data.serverResponseCode) {
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'EHOSTUNREACH':
      await handleNetworkError(account, data);
      break;
    case 'ENOTFOUND':
      await handleDnsError(account, data);
      break;
    case 'CERT_HAS_EXPIRED':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      await handleTlsError(account, data);
      break;
    default:
      await notifyAdmin(account, data);
  }
}

async function handleNetworkError(account, data) {
  // Server may be down or network issue
  console.log(`Network error for ${account} - server may be unreachable`);

  // Check if this is affecting multiple accounts
  await checkServerStatus(account);

  // Alert if server appears to be down
  await sendInfrastructureAlert({
    type: 'server_unreachable',
    account,
    error: data.response
  });
}

async function handleDnsError(account, data) {
  // DNS resolution failed - hostname may be incorrect
  console.log(`DNS error for ${account} - check hostname configuration`);
  await notifyAdmin(account, {
    message: 'DNS lookup failed - verify email server hostname',
    error: data.response
  });
}

async function handleTlsError(account, data) {
  // TLS/SSL certificate issue
  console.log(`TLS error for ${account} - certificate problem`);
  await notifyAdmin(account, {
    message: 'TLS certificate error - server certificate may need renewal',
    error: data.response
  });
}
```

### Alerting Administrators

```javascript
async function handleConnectError(event) {
  const { account, data, date } = event;

  // Determine severity based on error type
  let severity = 'warning';
  if (['ECONNREFUSED', 'ETIMEDOUT'].includes(data.serverResponseCode)) {
    severity = 'critical';
  }

  // Send alert to monitoring system
  await sendAlert({
    severity,
    title: 'Email Server Connection Failed',
    message: `Account ${account} cannot connect to email server`,
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
async function handleConnectError(event) {
  const { account, data, date } = event;

  // Update account status in your database
  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'connection_error',
      lastError: data.response,
      lastErrorCode: data.serverResponseCode,
      lastErrorAt: new Date(date)
    }
  });

  // Trigger UI notification if user is online
  await notifyConnectedUser(account, {
    type: 'connection_error',
    message: 'Unable to connect to email server'
  });
}
```

## Distinguishing connectError from authenticationError

It's important to understand the difference between these two error events:

| Aspect | connectError | authenticationError |
|--------|--------------|---------------------|
| **When triggered** | Connection cannot be established | Connection established but login fails |
| **Typical causes** | Network issues, server down, firewall, TLS problems | Invalid credentials, expired tokens, revoked access |
| **User action** | Usually none - wait for server recovery | Update credentials or re-authenticate |
| **Resolution** | Automatic when server becomes available | Requires credential update |

## Webhook Deduplication

EmailEngine tracks error states to prevent webhook flooding. Key behaviors:

1. **First occurrence** - Webhook is sent immediately when connection first fails
2. **Repeated failures** - Subsequent identical errors do NOT trigger new webhooks
3. **State change** - A new webhook is sent only when:
   - The account successfully connects (triggers a state change)
   - The error message or code changes
   - The account is reconnected with updated configuration

This means you can rely on receiving exactly one `connectError` webhook per failure episode, making it safe to trigger alerts without rate limiting on your end.

## Automatic Retry Behavior

When a connection error occurs, EmailEngine will automatically retry connecting with exponential backoff:

- Initial retry after a few seconds
- Subsequent retries with increasing delays
- Maximum backoff capped at 10 minutes

The connection will be retried indefinitely until:
- The connection succeeds
- The account is deleted or disabled
- The account configuration is updated

You do not need to implement retry logic in your webhook handler - EmailEngine handles this automatically.

## Related Events

- [authenticationError](/docs/webhooks/authenticationerror) - Triggered when authentication fails (after connection succeeds)
- [authenticationSuccess](/docs/webhooks/authenticationsuccess) - Triggered when authentication succeeds
- [accountAdded](/docs/webhooks/accountadded) - Triggered when a new account is registered
- [accountDeleted](/docs/webhooks/accountdeleted) - Triggered when an account is removed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Account Management](/docs/accounts) - Managing email accounts
- [Troubleshooting](/docs/troubleshooting) - Common issues and solutions
- [IMAP Configuration](/docs/accounts/imap-smtp) - Setting up IMAP accounts
