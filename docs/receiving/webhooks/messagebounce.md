---
title: "messageBounce"
sidebar_position: 8
description: "Webhook event triggered when a bounce response email is received"
---

# messageBounce

The `messageBounce` webhook event is triggered when EmailEngine detects a bounce notification (Delivery Status Notification) in a monitored mailbox. This event helps you track email deliverability by identifying messages that failed to reach their intended recipients.

## When This Event is Triggered

The `messageBounce` event fires when:

- A bounce message (DSN - Delivery Status Notification) is received in a monitored mailbox
- EmailEngine successfully parses the bounce and extracts delivery failure information
- The bounce contains identifiable information about the failed recipient and original message

EmailEngine analyzes incoming messages for bounce patterns from various email providers including:

- Standard RFC 3464 delivery status notifications
- Amazon WorkMail bounce notifications
- Gmail bounce messages
- Microsoft Exchange bounce reports
- Postfix mailer-daemon responses
- Zoho Mail bounce notifications
- Generic SMTP server bounces

## Common Use Cases

- **Deliverability monitoring** - Track bounce rates across your email campaigns
- **List hygiene** - Automatically remove or flag invalid email addresses
- **Reputation management** - Identify and address delivery issues before they impact sender reputation
- **Customer notification** - Alert users when their messages fail to deliver
- **Analytics** - Build dashboards showing delivery success rates
- **Retry logic** - Implement custom retry strategies for soft bounces

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that received the bounce message |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "messageBounce" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Bounce data object (see below) |

### Bounce Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | EmailEngine message ID of the original bounced message (if found) |
| `bounceMessage` | string | Yes | EmailEngine message ID of the bounce notification email itself |
| `recipient` | string | Yes | Email address that bounced |
| `action` | string | Yes | Bounce action type (typically "failed" for hard bounces, "delayed" for soft bounces) |
| `response` | object | No | SMTP response details from the receiving server |
| `mta` | string | No | Mail Transfer Agent (server) that reported the bounce |
| `queueId` | string | No | Queue ID from the sending MTA (e.g., Postfix queue ID) |
| `messageId` | string | No | Message-ID header of the original message that bounced |
| `messageHeaders` | object | No | Headers from the original bounced message |

### Response Object Structure

The `response` object contains details about the SMTP error:

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Source of the diagnostic code (typically "smtp") |
| `message` | string | The full SMTP error message from the receiving server |
| `status` | string | Enhanced status code (e.g., "5.1.1" for invalid mailbox, "5.2.2" for mailbox full) |

### Message Headers Object Structure

The `messageHeaders` object contains headers from the original bounced message (when available):

| Field | Type | Description |
|-------|------|-------------|
| `return-path` | array | Return-Path header values |
| `received` | array | Received header chain |
| `dkim-signature` | array | DKIM signature headers |
| `content-type` | array | Content-Type header |
| `from` | array | From header |
| `to` | array | To header |
| `subject` | array | Subject header |
| `message-id` | array | Message-ID header |
| `date` | array | Date header |
| `mime-version` | array | MIME-Version header |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:46:29.436Z",
  "event": "messageBounce",
  "eventId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "data": {
    "id": "AAAAAQAAAeE",
    "bounceMessage": "AAAAAQAABy8",
    "recipient": "missing@example.com",
    "action": "failed",
    "response": {
      "source": "smtp",
      "message": "550 5.1.1 The email account that you tried to reach does not exist",
      "status": "5.1.1"
    },
    "mta": "mx.example.com",
    "queueId": "9441D8220E",
    "messageId": "<305eabf4-9538-2747-acec-dc32cb651a0e@example.com>",
    "messageHeaders": {
      "return-path": ["<sender@example.com>"],
      "from": ["Sender Name <sender@example.com>"],
      "to": ["Recipient <missing@example.com>"],
      "subject": ["Your original message subject"],
      "message-id": ["<305eabf4-9538-2747-acec-dc32cb651a0e@example.com>"],
      "date": ["Mon, 17 Oct 2025 09:46:25 +0300"],
      "mime-version": ["1.0"]
    }
  }
}
```

## Understanding Bounce Types

### Hard Bounces (Permanent Failures)

Hard bounces indicate permanent delivery failures. The `action` field will be "failed" and status codes typically start with "5":

| Status Code | Meaning |
|-------------|---------|
| 5.1.1 | Invalid mailbox / User unknown |
| 5.1.2 | Invalid domain |
| 5.2.1 | Mailbox disabled |
| 5.2.2 | Mailbox full (can also be temporary) |
| 5.4.1 | No answer from host |
| 5.7.1 | Delivery not authorized |

### Soft Bounces (Temporary Failures)

Soft bounces are temporary and may succeed on retry. The `action` field may be "delayed":

| Status Code | Meaning |
|-------------|---------|
| 4.2.2 | Mailbox full (temporary) |
| 4.4.1 | Connection timeout |
| 4.4.2 | Connection dropped |
| 4.7.1 | Temporary authentication failure |

## Handling the Event

### Basic Handler

```javascript
async function handleMessageBounce(event) {
  const { account, data } = event;

  console.log(`Bounce detected for ${account}:`);
  console.log(`  Recipient: ${data.recipient}`);
  console.log(`  Action: ${data.action}`);
  console.log(`  Original Message ID: ${data.messageId}`);

  if (data.response) {
    console.log(`  Status: ${data.response.status}`);
    console.log(`  Message: ${data.response.message}`);
  }

  // Process based on bounce type
  if (data.action === 'failed') {
    await handleHardBounce(data);
  } else if (data.action === 'delayed') {
    await handleSoftBounce(data);
  }
}
```

### Updating Email Lists

```javascript
async function handleHardBounce(bounceData) {
  const { recipient, response } = bounceData;

  // Mark email as invalid in your database
  await db.contacts.update(
    { email: recipient },
    {
      $set: {
        emailValid: false,
        bounceReason: response?.message,
        bounceCode: response?.status,
        bouncedAt: new Date()
      }
    }
  );

  // Optionally notify the sender
  if (bounceData.id) {
    await notifySender(bounceData);
  }
}
```

### Tracking Bounce Metrics

```javascript
async function trackBounceMetrics(event) {
  const { account, data } = event;

  // Extract bounce category from status code
  const statusCode = data.response?.status || '';
  const isHardBounce = statusCode.startsWith('5');
  const category = getBounceCategory(statusCode);

  await metrics.increment('email.bounces', {
    account,
    type: isHardBounce ? 'hard' : 'soft',
    category,
    mta: data.mta || 'unknown'
  });
}

function getBounceCategory(status) {
  if (!status) return 'unknown';

  const [major, minor] = status.split('.');

  if (minor === '1') return 'address';      // Address-related
  if (minor === '2') return 'mailbox';      // Mailbox-related
  if (minor === '3') return 'system';       // Mail system issues
  if (minor === '4') return 'network';      // Network/routing
  if (minor === '5') return 'protocol';     // Protocol issues
  if (minor === '6') return 'content';      // Content issues
  if (minor === '7') return 'security';     // Security/policy

  return 'other';
}
```

## Key Differences from messageFailed

The `messageBounce` and `messageFailed` events serve different purposes:

| Aspect | messageBounce | messageFailed |
|--------|---------------|---------------|
| **Trigger** | Bounce email received in mailbox | EmailEngine fails to deliver after all retries |
| **Source** | Remote mail server's bounce notification | EmailEngine's delivery system |
| **Timing** | Can be minutes to days after sending | Immediate after final retry failure |
| **Detection** | Requires parsing bounce email format | Direct SMTP error response |

Use `messageBounce` when you need to:
- Track bounces from emails sent through other systems
- Get detailed bounce information from the receiving server's perspective
- Monitor mailboxes that receive bounce notifications

Use `messageFailed` when you need to:
- Track delivery failures for emails sent through EmailEngine's queue
- Get immediate feedback on delivery attempts
- Handle failures before bounce notifications arrive

## Best Practices

1. **Track both events** - Use both `messageBounce` and `messageFailed` for complete deliverability monitoring
2. **Deduplicate bounces** - The same delivery failure may trigger both events; use `messageId` to correlate
3. **Handle missing fields** - Not all bounces include complete information; validate fields before use
4. **Distinguish bounce types** - Hard bounces require different handling than soft bounces
5. **Update promptly** - Remove hard-bounced addresses from mailing lists immediately
6. **Log for analysis** - Store bounce data for deliverability trend analysis
7. **Monitor the MTA field** - Track which receiving servers generate the most bounces

## Related Events

- [messageFailed](/docs/receiving/webhooks/messagefailed) - Triggered when EmailEngine fails to deliver a queued email
- [messageDeliveryError](/docs/receiving/webhooks/messagedeliveryerror) - Triggered on temporary SMTP delivery errors
- [messageSent](/docs/receiving/webhooks/messagesent) - Triggered when a message is successfully sent
- [messageNew](/docs/receiving/webhooks/messagenew) - The bounce notification also triggers this event

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Sending Emails](/docs/sending/basic-sending) - How to send emails through EmailEngine
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
