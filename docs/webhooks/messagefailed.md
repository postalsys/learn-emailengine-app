---
title: "messageFailed"
sidebar_position: 9
description: "Webhook event triggered when EmailEngine permanently fails to deliver an email after all retry attempts are exhausted"
---

# messageFailed

The `messageFailed` webhook event is triggered when EmailEngine permanently fails to deliver a queued email. This event fires after all retry attempts have been exhausted, indicating that the message will not be delivered.

## When This Event is Triggered

The `messageFailed` event fires when:

- All configured retry attempts have been exhausted (default: 10 attempts)
- A permanent SMTP error occurs (5xx response code)
- The submission job is discarded from the queue
- The message cannot be delivered after exponential backoff retries

This is a terminal event - no further delivery attempts will be made for this message. It represents the final state in the failed delivery lifecycle.

## Common Use Cases

- **Sender notification** - Notify the original sender that their email could not be delivered
- **Queue cleanup** - Remove the message from any pending send tracking
- **Audit logging** - Maintain a record of all permanently failed deliveries
- **Analytics** - Track failure rates and identify problematic patterns
- **Retry via alternative method** - Attempt delivery through a backup SMTP server or different channel
- **CRM updates** - Mark contacts as unreachable or flag delivery issues
- **Alerting** - Trigger alerts for high failure rates or critical email failures

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that attempted to send the message |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "messageFailed" for this event |
| `data` | object | Yes | Event data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | string | Yes | Message-ID header of the email that failed to send |
| `queueId` | string | Yes | EmailEngine's internal queue ID for this submission |
| `error` | string | Yes | Human-readable error message from the final delivery attempt |
| `networkRouting` | object | No | Network routing information (if local address was configured) |

### Network Routing Object Structure

Present only when a custom local address was configured for the SMTP connection:

| Field | Type | Description |
|-------|------|-------------|
| `localAddress` | string | Local IP address used for the SMTP connection |
| `localPort` | number | Local port number used for the connection |

## Example Payload

### Authentication Failure

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T08:15:32.456Z",
  "event": "messageFailed",
  "data": {
    "messageId": "<305eabf4-9538-2747-acec-dc32cb651a0e@example.com>",
    "queueId": "183e4b18f0ffe977476",
    "error": "Error: Invalid login: 535 5.7.8 Error: authentication failed"
  }
}
```

### Connection Timeout

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T09:30:15.123Z",
  "event": "messageFailed",
  "data": {
    "messageId": "<abc123@example.com>",
    "queueId": "184a5c29e1aaf988567",
    "error": "Error: Connect timeout"
  }
}
```

### Recipient Unknown

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T10:45:00.000Z",
  "event": "messageFailed",
  "data": {
    "messageId": "<msg-456@company.com>",
    "queueId": "184b6d30f2bbg099678",
    "error": "Error: 550 5.1.1 The email account that you tried to reach does not exist"
  }
}
```

### With Network Routing Information

When EmailEngine used a custom local address for the SMTP connection:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T11:22:33.789Z",
  "event": "messageFailed",
  "data": {
    "messageId": "<campaign-789@marketing.com>",
    "queueId": "184c7e41g3cch110789",
    "error": "Error: Connection refused",
    "networkRouting": {
      "localAddress": "192.168.1.100",
      "localPort": 54321
    }
  }
}
```

## Field Details

### messageId

The Message-ID header from the original email. This is an RFC 5322 compliant identifier that can be used to:

- Correlate with the original submission request
- Match with any `messageDeliveryError` events that preceded this failure
- Track the message through your email pipeline

Format: `<unique-identifier@hostname.domain>`

### queueId

EmailEngine's internal queue identifier for this submission. Use this to:

- Correlate with the original [Submit API](/docs/api/post-v-1-account-account-submit) response
- Match with `messageDeliveryError` events during retry attempts
- Reference in support requests or debugging

### error

The error message from the final failed delivery attempt. This is extracted from the first line of the error stack trace. Common error patterns include:

| Error Pattern | Description |
|---------------|-------------|
| `Error: Invalid login: 535...` | SMTP authentication failure |
| `Error: Connect timeout` | Unable to connect to SMTP server within timeout |
| `Error: 550 5.1.1 ...` | Recipient mailbox does not exist |
| `Error: 550 5.7.1 ...` | Sender rejected by recipient server |
| `Error: Connection refused` | SMTP server refused the connection |
| `Error: CERT_HAS_EXPIRED` | TLS certificate validation failed |

## Handling the Event

### Basic Handler

```javascript
async function handleMessageFailed(event) {
  const { account, data } = event;

  console.log(`Permanent delivery failure for account ${account}`);
  console.log(`  Queue ID: ${data.queueId}`);
  console.log(`  Message ID: ${data.messageId}`);
  console.log(`  Error: ${data.error}`);

  // Update your database to mark the message as failed
  await db.emailLogs.update({
    queueId: data.queueId,
    status: 'failed',
    error: data.error,
    failedAt: event.date
  });
}
```

### Notify the Sender

```javascript
async function handleMessageFailed(event) {
  const { account, data, date } = event;

  // Find the original email record
  const emailRecord = await db.emails.findOne({
    queueId: data.queueId
  });

  if (emailRecord && emailRecord.senderEmail) {
    // Send notification to the original sender
    await notificationService.sendEmail({
      to: emailRecord.senderEmail,
      subject: 'Email delivery failed',
      body: `Your email to ${emailRecord.recipientEmail} could not be delivered.\n\n` +
            `Error: ${data.error}\n\n` +
            `Message ID: ${data.messageId}`
    });
  }

  // Log the failure
  await auditLog.create({
    type: 'email_delivery_failed',
    account,
    queueId: data.queueId,
    error: data.error,
    timestamp: new Date(date)
  });
}
```

### Track Failure Patterns

```javascript
async function handleMessageFailed(event) {
  const { account, data } = event;

  // Parse error type from the error message
  let errorType = 'unknown';
  if (data.error.includes('authentication')) {
    errorType = 'auth_failure';
  } else if (data.error.includes('timeout')) {
    errorType = 'timeout';
  } else if (data.error.includes('5.1.1')) {
    errorType = 'invalid_recipient';
  } else if (data.error.includes('5.7.')) {
    errorType = 'policy_rejection';
  }

  // Track for analytics
  await analytics.track({
    event: 'email_failed',
    properties: {
      account,
      errorType,
      queueId: data.queueId
    }
  });

  // Alert on authentication failures (may indicate credential issues)
  if (errorType === 'auth_failure') {
    await alerting.send({
      severity: 'high',
      title: 'SMTP Authentication Failure',
      message: `Account ${account} has authentication issues`,
      details: { error: data.error }
    });
  }
}
```

### Retry via Alternative Method

```javascript
async function handleMessageFailed(event) {
  const { account, data } = event;

  // Retrieve the original message content
  const originalMessage = await db.outbox.findOne({
    queueId: data.queueId
  });

  if (originalMessage && originalMessage.retryCount < 1) {
    // Try sending via backup SMTP server
    try {
      await emailService.sendViaBackup({
        to: originalMessage.to,
        subject: originalMessage.subject,
        body: originalMessage.body,
        originalQueueId: data.queueId
      });

      await db.outbox.update({
        queueId: data.queueId,
        retryCount: originalMessage.retryCount + 1,
        lastRetryMethod: 'backup_smtp'
      });
    } catch (backupError) {
      console.error('Backup delivery also failed:', backupError);
    }
  }
}
```

## Retry Behavior

Before the `messageFailed` event is triggered, EmailEngine attempts delivery multiple times:

- **Default attempts**: 10 retry attempts
- **Backoff strategy**: Exponential backoff with 5-second base delay
- **Typical delays**: 10s, 20s, 40s, 80s, 160s, 320s, 640s, 1280s, 2560s, 5120s

The `messageFailed` event fires only after:
1. All retry attempts are exhausted, OR
2. A permanent failure occurs (5xx SMTP response)

Monitor `messageDeliveryError` events to track individual retry attempts before the final failure.

## Relationship to Other Events

The `messageFailed` event is the terminal failure state in the email delivery lifecycle:

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
                   │ Yes               │ No (exhausted)
                   ▼                   ▼
              [Retry loop]        messageFailed
```

| Event | Description |
|-------|-------------|
| `messageSent` | Successful delivery to SMTP server |
| `messageDeliveryError` | Temporary failure, may be retried |
| `messageFailed` | Permanent failure, no more retries (this event) |
| `messageBounce` | Bounce notification received after delivery |

## Difference from messageDeliveryError

| Aspect | messageDeliveryError | messageFailed |
|--------|---------------------|---------------|
| When triggered | Each failed attempt | After all retries exhausted |
| Retries remaining | Yes (usually) | No |
| Action required | Monitor, may self-resolve | Intervention needed |
| Job status | Active or delayed | Discarded |
| Payload detail | Includes retry info | Final error only |

## Best Practices

1. **Always handle this event** - These are permanent failures that require attention
2. **Notify senders** - Let users know their emails failed to deliver
3. **Track error patterns** - Identify systemic issues (bad credentials, blocked IPs)
4. **Clean up references** - Remove failed messages from pending queues
5. **Alert on spikes** - Monitor for unusual increases in failure rates
6. **Log for compliance** - Maintain records of delivery failures for audit purposes
7. **Consider alternatives** - Implement fallback delivery methods for critical emails
8. **Process quickly** - Return 2xx status within 5 seconds

## Related Events

- [messageSent](/docs/webhooks/messagesent) - Successful delivery to SMTP server
- [messageDeliveryError](/docs/webhooks/messagedeliveryerror) - Temporary delivery failure (may retry)
- [messageBounce](/docs/webhooks/overview) - Bounce message received after delivery

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Submit API](/docs/api/post-v-1-account-account-submit) - Send emails via EmailEngine
- [Outbox API](/docs/api/get-v-1-outbox) - Check queued message status
- [Sending Emails](/docs/sending) - Email sending guide
