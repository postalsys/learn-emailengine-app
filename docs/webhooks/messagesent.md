---
title: "messageSent"
sidebar_position: 7
description: "Webhook event triggered when a queued email is successfully accepted by the SMTP server"
---

# messageSent

The `messageSent` webhook event is triggered when EmailEngine successfully delivers a queued email to the SMTP server (or Gmail/Outlook API). This event confirms that the message has been accepted for delivery by the mail transfer agent (MTA).

## When This Event is Triggered

The `messageSent` event fires when:

- A message submitted via the [Submit API](/docs/api/post-v-1-account-account-submit) is accepted by the SMTP server
- An email sent through Gmail API is successfully delivered
- An email sent through Microsoft Graph API is successfully delivered
- The SMTP server returns a 250 OK response

This event indicates successful handoff to the mail server. It does not guarantee final delivery to the recipient's inbox, as the message may still bounce or be rejected by downstream servers.

## Common Use Cases

- **Delivery confirmation** - Update your application when emails are successfully queued for delivery
- **Tracking correlation** - Associate the EmailEngine queue ID with the MTA's message ID
- **Audit logging** - Maintain a log of all successfully sent emails
- **Workflow triggers** - Initiate follow-up actions after email is sent
- **Analytics** - Track send volumes and success rates per account
- **CRM integration** - Update contact records with communication history

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that sent the message |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "messageSent" for this event |
| `data` | object | Yes | Event data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | string | Yes | Message-ID header of the sent email (may be assigned by MTA) |
| `originalMessageId` | string | No | Original Message-ID if the MTA assigned a different one |
| `response` | string | No | SMTP server response (for SMTP submissions only) |
| `queueId` | string | Yes | EmailEngine's internal queue ID for this submission |
| `envelope` | object | Yes | SMTP envelope with sender and recipients |
| `networkRouting` | object | No | Network routing information (if local address or proxy was used) |

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
| `name` | string | EHLO hostname used in the SMTP session |
| `requestedLocalAddress` | string | Originally requested local address (if different from actual) |

## Example Payload

### Standard SMTP Submission

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:46:26.954Z",
  "event": "messageSent",
  "data": {
    "messageId": "<305eabf4-9538-2747-acec-dc32cb651a0e@example.com>",
    "response": "250 2.0.0 Ok: queued as 9441D8220E",
    "queueId": "183e4b18f0ffe977476",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@destination.com"]
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
  "date": "2025-10-17T08:30:15.123Z",
  "event": "messageSent",
  "data": {
    "messageId": "<abc123@example.com>",
    "response": "250 2.0.0 Ok: queued as XYZ789",
    "queueId": "184a5c29e1aaf988567",
    "envelope": {
      "from": "marketing@company.com",
      "to": ["customer1@email.com", "customer2@email.com"]
    },
    "networkRouting": {
      "localAddress": "192.168.1.100",
      "name": "mail.company.com"
    }
  }
}
```

### Gmail API Submission

When sending via Gmail API, the response field is not present:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T09:15:42.000Z",
  "event": "messageSent",
  "data": {
    "messageId": "<CABcd123@mail.gmail.com>",
    "originalMessageId": "<local-id-456@example.com>",
    "queueId": "184b6d30f2bbg099678",
    "envelope": {
      "from": "user@gmail.com",
      "to": ["recipient@example.com"]
    }
  }
}
```

### Microsoft Outlook API Submission

When sending via Microsoft Graph API:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user",
  "date": "2025-10-17T10:22:33.456Z",
  "event": "messageSent",
  "data": {
    "messageId": "<DM6PR01MB1234@outlook.com>",
    "originalMessageId": "<local-id-789@example.com>",
    "queueId": "184c7e41g3cch110789",
    "envelope": {
      "from": "user@outlook.com",
      "to": ["recipient@example.com"]
    }
  }
}
```

### With MTA Message-ID Override

Some MTAs (like Hotmail/Outlook SMTP or AWS SES) assign their own Message-ID:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T11:45:00.000Z",
  "event": "messageSent",
  "data": {
    "messageId": "<0102018b9c8d7e6f-a1b2c3d4-5678-90ab-cdef-123456789012-000000@us-east-1.amazonses.com>",
    "originalMessageId": "<local-message-id@example.com>",
    "response": "250 Ok 0102018b9c8d7e6f-a1b2c3d4-5678-90ab-cdef-123456789012-000000",
    "queueId": "184d8f52h4ddi221890",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@destination.com"]
    }
  }
}
```

## Field Details

### messageId vs originalMessageId

- **`messageId`**: The final Message-ID that will be used for tracking and correlation. This may be assigned by the MTA.
- **`originalMessageId`**: Present only when the MTA overrides the Message-ID. Contains the original Message-ID that was in the email before submission.

MTAs that commonly override Message-ID:
- **AWS SES**: Returns a new ID in the format `<uuid@region.amazonses.com>`
- **Microsoft Outlook SMTP**: Returns a new ID in the format `<...@prod.outlook.com>`
- **Gmail API**: Assigns a Gmail-specific Message-ID

### response Field

The `response` field contains the raw SMTP server response. Common formats:

- **Standard**: `250 2.0.0 Ok: queued as 9441D8220E`
- **AWS SES**: `250 Ok 0102018b9c8d7e6f-...`
- **Gmail SMTP**: `250 2.0.0 OK 1234567890 abc123.456 - gsmtp`

This field is not present for Gmail API or Microsoft Graph API submissions.

### queueId Field

The `queueId` is EmailEngine's internal identifier for the submission job. Use this to:

- Correlate with the original [Submit API](/docs/api/post-v-1-account-account-submit) response
- Track the message through EmailEngine's queue system
- Reference in support requests

## Handling the Event

### Basic Handler

```javascript
async function handleMessageSent(event) {
  const { account, data } = event;

  console.log(`Email sent successfully for account ${account}`);
  console.log(`  Queue ID: ${data.queueId}`);
  console.log(`  Message ID: ${data.messageId}`);
  console.log(`  Recipients: ${data.envelope.to.join(', ')}`);

  if (data.response) {
    console.log(`  Server Response: ${data.response}`);
  }

  // Update your database
  await db.emailLogs.update({
    queueId: data.queueId,
    status: 'sent',
    messageId: data.messageId,
    sentAt: event.date
  });
}
```

### Tracking with Original Message-ID

```javascript
async function handleMessageSent(event) {
  const { data } = event;

  // Use originalMessageId for correlation if the MTA changed it
  const trackingId = data.originalMessageId || data.messageId;

  await db.emails.update(
    { messageId: trackingId },
    {
      finalMessageId: data.messageId,
      status: 'delivered_to_mta',
      mtaResponse: data.response
    }
  );
}
```

### With Error Handling

```javascript
async function handleMessageSent(event) {
  try {
    const { account, data, date } = event;

    // Log the successful send
    await auditLog.create({
      type: 'email_sent',
      account,
      queueId: data.queueId,
      messageId: data.messageId,
      recipients: data.envelope.to,
      timestamp: new Date(date)
    });

    // Notify other systems
    await notifyWebhookSubscribers('email.sent', {
      messageId: data.messageId,
      recipients: data.envelope.to
    });

  } catch (error) {
    console.error('Failed to process messageSent webhook:', error);
    // Re-throw to trigger webhook retry
    throw error;
  }
}
```

## Relationship to Other Events

The `messageSent` event is part of the email delivery lifecycle:

1. **Submit API call** - Email is queued for sending
2. **messageSent** - Email accepted by SMTP server (this event)
3. **messageDeliveryError** - Temporary delivery failure (may retry)
4. **messageFailed** - Permanent delivery failure (no more retries)
5. **messageBounce** - Bounce notification received from recipient server

A successful `messageSent` event means the MTA accepted the message, but delivery issues may still occur:

- The recipient server may later bounce the message
- The message may be filtered as spam
- The recipient mailbox may be full

Monitor `messageBounce`, `messageDeliveryError`, and `messageFailed` events for complete delivery tracking.

## Best Practices

1. **Store the queue ID** - Save `queueId` when calling the Submit API to correlate with this webhook
2. **Handle Message-ID changes** - Check for `originalMessageId` to maintain tracking when MTAs override IDs
3. **Don't assume delivery** - This event confirms MTA acceptance, not inbox delivery
4. **Process quickly** - Return 2xx status within 5 seconds
5. **Use for audit trails** - Log all sent emails for compliance and debugging
6. **Correlate with bounces** - Match `messageId` with bounce notifications for delivery verification

## Related Events

- [messageDeliveryError](/docs/webhooks/messagedeliveryerror) - Temporary SMTP delivery failure (will retry)
- [messageFailed](/docs/webhooks/messagefailed) - Permanent delivery failure
- [messageBounce](/docs/webhooks/overview) - Bounce message received

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Submit API](/docs/api/post-v-1-account-account-submit) - Send emails via EmailEngine
- [Outbox API](/docs/api/get-v-1-outbox) - Check queued message status
- [Sending Emails](/docs/sending) - Email sending guide
