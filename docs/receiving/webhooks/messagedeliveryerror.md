---
title: "messageDeliveryError"
sidebar_position: 6
description: "Webhook event triggered when EmailEngine fails to deliver an email to the SMTP server (may be retried)"
---

# messageDeliveryError

The `messageDeliveryError` webhook event is triggered when EmailEngine encounters an SMTP error while attempting to deliver an email. Unlike `messageFailed`, this event indicates a temporary failure that may be retried automatically.

## When This Event is Triggered

The `messageDeliveryError` event fires when:

- The SMTP server returns an error response during message submission
- A connection timeout occurs while communicating with the SMTP server
- TLS negotiation fails with the mail server
- DNS resolution fails for the SMTP hostname
- Authentication with the SMTP server fails
- The TCP connection to the SMTP server cannot be established

This event is triggered for each failed delivery attempt. If retries are configured, the message will be re-queued for another attempt. Monitor this event to track delivery issues and diagnose SMTP connectivity problems.

## Common Use Cases

- **Delivery monitoring** - Track SMTP failures in real-time to identify connectivity issues
- **Alerting** - Trigger alerts when delivery errors exceed a threshold
- **Retry tracking** - Monitor how many attempts have been made for problematic messages
- **Diagnostics** - Log detailed error information for troubleshooting SMTP configuration
- **Failover logic** - Switch to backup SMTP servers when primary server errors occur
- **Rate limiting detection** - Identify when SMTP servers are rejecting messages due to sending limits

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that attempted to send the message |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "messageDeliveryError" for this event |
| `data` | object | Yes | Event data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `queueId` | string | Yes | EmailEngine's internal queue ID for this submission |
| `envelope` | object | Yes | SMTP envelope with sender and recipients |
| `messageId` | string | No | Message-ID header of the email being sent |
| `error` | string | Yes | Human-readable error message |
| `errorCode` | string | No | Error code (e.g., "ETIMEDOUT", "EAUTH", "ECONNECTION") |
| `smtpResponse` | string | No | Raw SMTP server response (if available) |
| `smtpResponseCode` | number | No | SMTP response code (e.g., 421, 450, 550) |
| `smtpCommand` | string | No | SMTP command that triggered the error (e.g., "RCPT TO", "DATA") |
| `networkRouting` | object | No | Network routing information (if local address or proxy was used) |
| `job` | object | Yes | Job queue information including retry details |

### Envelope Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Envelope sender (MAIL FROM address) |
| `to` | array | Array of envelope recipient addresses (RCPT TO) |

### Network Routing Object Structure

Present only when a custom local address or proxy is configured:

| Field | Type | Description |
|-------|------|-------------|
| `localAddress` | string | Local IP address used for the SMTP connection |
| `proxy` | string | SOCKS proxy URL used for the connection |

### Job Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Internal job ID in the queue system |
| `attemptsMade` | number | Number of delivery attempts made so far |
| `attempts` | number | Maximum number of attempts configured |
| `nextAttempt` | string | ISO 8601 timestamp of the next scheduled retry (or false if no more retries) |

## Example Payload

### Connection Timeout

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T08:15:32.456Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "183e4b18f0ffe977476",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@destination.com"]
    },
    "messageId": "<305eabf4-9538-2747-acec-dc32cb651a0e@example.com>",
    "error": "Request timed out. Possibly a firewall issue or a wrong hostname/port (smtp.destination.com:587).",
    "errorCode": "ETIMEDOUT",
    "job": {
      "id": "42",
      "attemptsMade": 1,
      "attempts": 10,
      "nextAttempt": "2025-10-17T08:20:32.456Z"
    }
  }
}
```

### Authentication Failure

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T09:30:15.123Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "184a5c29e1aaf988567",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@destination.com"]
    },
    "messageId": "<abc123@example.com>",
    "error": "Authentication failed",
    "errorCode": "EAUTH",
    "smtpResponse": "535 5.7.8 Authentication credentials invalid",
    "smtpResponseCode": 535,
    "smtpCommand": "AUTH",
    "job": {
      "id": "43",
      "attemptsMade": 2,
      "attempts": 10,
      "nextAttempt": "2025-10-17T09:40:15.123Z"
    }
  }
}
```

### TLS Certificate Error

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T10:45:00.000Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "184b6d30f2bbg099678",
    "envelope": {
      "from": "sender@company.com",
      "to": ["customer@external.com"]
    },
    "messageId": "<msg-456@company.com>",
    "error": "Certificate check for smtp.external.com:465 failed. CERT_HAS_EXPIRED",
    "errorCode": "ESOCKET",
    "job": {
      "id": "44",
      "attemptsMade": 1,
      "attempts": 10,
      "nextAttempt": "2025-10-17T10:50:00.000Z"
    }
  }
}
```

### DNS Resolution Failure

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T11:22:33.789Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "184c7e41g3cch110789",
    "envelope": {
      "from": "sender@example.com",
      "to": ["user@typo-domain.com"]
    },
    "messageId": "<dns-err-789@example.com>",
    "error": "EmailEngine failed to resolve DNS record for smtp.typo-domain.com",
    "errorCode": "EDNS",
    "job": {
      "id": "45",
      "attemptsMade": 3,
      "attempts": 10,
      "nextAttempt": "2025-10-17T11:42:33.789Z"
    }
  }
}
```

### SMTP Rejection with Response Code

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T12:00:00.000Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "184d8f52h4ddi221890",
    "envelope": {
      "from": "sender@example.com",
      "to": ["blocked@strict-server.com"]
    },
    "messageId": "<rejected-msg@example.com>",
    "error": "Message rejected by server",
    "errorCode": "EMESSAGE",
    "smtpResponse": "450 4.7.1 Client host rejected: cannot find your hostname",
    "smtpResponseCode": 450,
    "smtpCommand": "RCPT TO",
    "job": {
      "id": "46",
      "attemptsMade": 1,
      "attempts": 10,
      "nextAttempt": "2025-10-17T12:05:00.000Z"
    }
  }
}
```

### With Network Routing Information

When EmailEngine uses a custom local address or proxy for the SMTP connection:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T13:15:45.678Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "184e9g63i5eej332901",
    "envelope": {
      "from": "marketing@company.com",
      "to": ["customer@email.com"]
    },
    "messageId": "<campaign-123@company.com>",
    "error": "EmailEngine failed to establish TCP connection against smtp.email.com",
    "errorCode": "ECONNECTION",
    "networkRouting": {
      "localAddress": "192.168.1.100",
      "proxy": "socks5://proxy.company.com:1080"
    },
    "job": {
      "id": "47",
      "attemptsMade": 2,
      "attempts": 10,
      "nextAttempt": "2025-10-17T13:25:45.678Z"
    }
  }
}
```

## Error Codes Reference

| Error Code | Description |
|------------|-------------|
| `ETIMEDOUT` | Connection timed out - firewall issue or wrong hostname/port |
| `EAUTH` | SMTP authentication failed |
| `ETLS` | TLS/SSL negotiation failed |
| `EDNS` | DNS resolution failed for the SMTP hostname |
| `ECONNECTION` | Failed to establish TCP connection to SMTP server |
| `EPROTOCOL` | Unexpected response from SMTP server |
| `ESOCKET` | Socket-level error (often TLS certificate issues) |
| `EMESSAGE` | Message-related error from SMTP server |
| `ESTREAM` | Stream error during message transmission |
| `EENVELOPE` | Invalid envelope (sender/recipient) |

## Handling the Event

### Basic Handler

```javascript
async function handleMessageDeliveryError(event) {
  const { account, data } = event;

  console.log(`Delivery error for account ${account}`);
  console.log(`  Queue ID: ${data.queueId}`);
  console.log(`  Error: ${data.error}`);
  console.log(`  Error Code: ${data.errorCode}`);
  console.log(`  Attempt: ${data.job.attemptsMade}/${data.job.attempts}`);

  if (data.job.nextAttempt) {
    console.log(`  Next retry: ${data.job.nextAttempt}`);
  } else {
    console.log(`  No more retries scheduled`);
  }

  // Log to your monitoring system
  await monitoring.logDeliveryError({
    account,
    queueId: data.queueId,
    error: data.error,
    errorCode: data.errorCode,
    attempt: data.job.attemptsMade,
    timestamp: event.date
  });
}
```

### Alert on Repeated Failures

```javascript
async function handleMessageDeliveryError(event) {
  const { account, data } = event;

  // Alert if message has failed multiple times
  if (data.job.attemptsMade >= 5) {
    await alerting.send({
      severity: 'warning',
      title: 'Email delivery struggling',
      message: `Message ${data.queueId} has failed ${data.job.attemptsMade} times`,
      details: {
        account,
        error: data.error,
        errorCode: data.errorCode,
        recipients: data.envelope.to
      }
    });
  }

  // Track error patterns
  await analytics.trackError({
    type: 'smtp_delivery_error',
    account,
    errorCode: data.errorCode,
    smtpCode: data.smtpResponseCode
  });
}
```

### Detect Authentication Issues

```javascript
async function handleMessageDeliveryError(event) {
  const { account, data } = event;

  // Authentication errors require immediate attention
  if (data.errorCode === 'EAUTH') {
    await notifyAdmin({
      title: 'SMTP Authentication Failed',
      message: `Account ${account} failed to authenticate with SMTP server`,
      action: 'Check SMTP credentials in account configuration'
    });

    // Optionally disable the account to prevent further failures
    await disableAccountSending(account);
  }
}
```

## Retry Behavior

EmailEngine uses exponential backoff for delivery retries:

1. **Default configuration**: 10 retry attempts with exponential delay
2. **Backoff formula**: `2^attemptsMade * baseDelay` (base delay is typically 5 seconds)
3. **Example delays**: 10s, 20s, 40s, 80s, 160s, 320s, 640s, 1280s, 2560s, 5120s

The `job.nextAttempt` field shows when the next retry is scheduled. If `nextAttempt` is `false`, no more retries will be attempted.

### Permanent vs Temporary Failures

- **5xx SMTP codes** (500-599): Considered permanent failures - no more retries
- **4xx SMTP codes** (400-499): Considered temporary - will be retried
- **Connection errors**: Will be retried (may be transient network issues)

When all retries are exhausted or a permanent failure occurs, a `messageFailed` webhook is triggered instead.

## Relationship to Other Events

The `messageDeliveryError` event is part of the email delivery lifecycle:

1. **Submit API call** - Email is queued for sending
2. **messageDeliveryError** - Temporary delivery failure (this event, may occur multiple times)
3. **messageSent** - Email accepted by SMTP server (success path)
4. **messageFailed** - Permanent delivery failure (failure path, no more retries)

```
Submit API
    │
    ▼
┌─────────────────────────────────────────┐
│  Delivery Attempt                        │
└─────────────────────────────────────────┘
    │                        │
    │ Success                │ Error
    ▼                        ▼
messageSent             messageDeliveryError
                             │
                             │ Retry?
                   ┌─────────┴─────────┐
                   │ Yes               │ No
                   ▼                   ▼
              [Retry loop]        messageFailed
```

## Best Practices

1. **Monitor error patterns** - Track error codes to identify systemic issues (DNS, TLS, auth)
2. **Set up alerts** - Notify operators when error rates spike or specific errors occur
3. **Log for debugging** - Store full webhook payloads to diagnose delivery problems
4. **Handle auth errors specially** - Authentication failures often indicate configuration problems
5. **Track retry counts** - Know which messages are struggling to deliver
6. **Consider circuit breakers** - Temporarily pause sending to problematic SMTP servers
7. **Process quickly** - Return 2xx status within 5 seconds

## Related Events

- [messageSent](/docs/receiving/webhooks/messagesent) - Successful delivery to SMTP server
- [messageFailed](/docs/receiving/webhooks) - Permanent delivery failure
- [messageBounce](/docs/receiving/webhooks) - Bounce message received

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Submit API](/docs/api/post-v-1-account-account-submit) - Send emails via EmailEngine
- [Outbox API](/docs/api/get-v-1-outbox) - Check queued message status
- [Sending Emails](/docs/sending) - Email sending guide
