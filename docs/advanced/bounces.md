---
title: Bounce Detection and Handling
sidebar_position: 7
description: Automatically detect and track email bounces with EmailEngine's bounce detection system
keywords:
  - bounces
  - bounce detection
  - DSN
  - delivery status
  - hard bounce
  - soft bounce
  - email delivery
---

<!--
SOURCES:
- docs/usage/bounces.md
- sources/blog/2022-10-12-tracking-bounces.md
This guide covers EmailEngine's automatic bounce detection and tracking capabilities.
-->

# Bounce Detection and Handling

EmailEngine automatically detects and tracks email bounces, providing detailed bounce information through webhooks and message listings. Learn how to handle bounce notifications and maintain email list hygiene.

## Overview

Email bounces occur when a sent message cannot be delivered to the recipient. EmailEngine monitors incoming emails for bounce responses and extracts detailed bounce information, including:

- **Recipient address** that bounced
- **Bounce type** (hard bounce, soft bounce)
- **Error message** from the receiving server
- **Original message** headers and content
- **SMTP status codes** and diagnostic information

Note: EmailEngine does not use [VERP addresses](https://en.wikipedia.org/wiki/Variable_envelope_return_path). It detects bounces by parsing standard bounce message formats sent by mail servers.

## How Bounce Detection Works

EmailEngine continuously monitors the inbox for bounce messages (Delivery Status Notifications - DSN). When a bounce is detected:

1. **Parse Bounce Message** - Extract bounce information from DSN format
2. **Match Original Message** - Link bounce to sent message via Message-ID
3. **Send Webhook** - Deliver `messageBounce` webhook to your application
4. **Add to Message** - Attach bounce data to sent message in listings

### Bounce Detection Flow

```
Send Email
    ↓
Store Message-ID: <abc@example.com>
    ↓
Email Bounces
    ↓
Receive DSN (Delivery Status Notification)
    ↓
Parse Bounce Information
    ↓
Match to Original Message-ID
    ↓
Send messageBounce Webhook
    ↓
Add bounces[] array to message listing
```

## Bounce Types

### Hard Bounces

Permanent delivery failures that will not succeed on retry:

- **User unknown** - Email address doesn't exist
- **Domain not found** - Domain doesn't exist or has no MX records
- **Mailbox full** - Recipient's mailbox is over quota (often permanent)
- **Account disabled** - Recipient account has been closed

**Example error messages:**
```
550 No such user here
550 5.1.1 User unknown
550 Requested action not taken: mailbox unavailable
```

### Soft Bounces

Temporary delivery failures that might succeed on retry:

- **Mailbox temporarily unavailable** - Server issues
- **Message too large** - Exceeds recipient's size limit
- **Spam filter rejection** - Message blocked by content filter
- **Rate limiting** - Too many messages sent too quickly

**Example error messages:**
```
450 4.2.1 The user you are trying to contact is receiving mail too quickly
452 4.2.2 The email account that you tried to reach is over quota
```

### Bounce Action Codes

EmailEngine includes the DSN action code:

- `failed` - Permanent failure (hard bounce)
- `delayed` - Temporary failure (soft bounce)
- `delivered` - Successfully delivered (not a bounce)
- `relayed` - Relayed to another server
- `expanded` - Mailing list expansion

## Sending Email and Tracking Bounces

### Send an Email

Send an email and capture the Message-ID:

```bash
curl -XPOST "https://emailengine.example.com/v1/account/john@example.com/submit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": {
      "address": "unknown@ethereal.email"
    },
    "subject": "Test message",
    "text": "This email should bounce!"
  }'
```

Response includes the Message-ID needed to track bounces:

```json
{
  "response": "Queued for delivery",
  "messageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>",
  "sendAt": "2024-10-13T12:10:34.845Z",
  "queueId": "183cc1a89ddfe365bbb"
}
```

**Save this `messageId` value** - you'll need it to correlate bounce notifications.

### Receive Bounce Webhook

When the email bounces, EmailEngine sends a `messageBounce` webhook:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "john@example.com",
  "date": "2024-10-13T12:10:40.980Z",
  "event": "messageBounce",
  "data": {
    "bounceMessage": "AAAADAAAByc",
    "recipient": "unknown@ethereal.email",
    "action": "failed",
    "response": {
      "source": "smtp",
      "message": "550 No such user here",
      "status": "5.0.0"
    },
    "mta": "mx.ethereal.email",
    "queueId": "B7D3F8220C",
    "messageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>",
    "messageHeaders": {
      "return-path": ["<john@example.com>"],
      "content-type": ["text/plain; charset=utf-8"],
      "from": ["John Doe <john@example.com>"],
      "to": ["unknown@ethereal.email"],
      "subject": ["Test message"],
      "message-id": ["<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>"],
      "date": ["Wed, 12 Oct 2022 12:10:34 +0000"]
    }
  }
}
```

### Webhook Payload Fields

| Field | Description |
|-------|-------------|
| `bounceMessage` | ID of the bounce notification message |
| `recipient` | Email address that bounced |
| `action` | DSN action: `failed`, `delayed`, etc. |
| `response.message` | Error message from receiving server |
| `response.status` | SMTP status code (e.g., `5.0.0`) |
| `response.source` | Source of error: `smtp`, `dns`, etc. |
| `mta` | Hostname of the MTA that generated the bounce |
| `queueId` | Queue ID from the bouncing MTA |
| `messageId` | Message-ID of the original sent email |
| `messageHeaders` | Original email headers |

## Checking Bounce Information

### Via Message Listing

Bounce information is also attached to sent messages in folder listings.

List sent messages:

```bash
curl "https://emailengine.example.com/v1/account/john@example.com/messages?path=Sent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Messages with bounces include a `bounces` array:

```json
{
  "total": 472,
  "page": 0,
  "pages": 24,
  "messages": [
    {
      "id": "AAAABgAAAdk",
      "uid": 473,
      "date": "2024-10-13T12:10:34.000Z",
      "subject": "Test message",
      "from": {
        "name": "John Doe",
        "address": "john@example.com"
      },
      "to": [
        {
          "address": "unknown@ethereal.email"
        }
      ],
      "bounces": [
        {
          "message": "AAAADAAAByc",
          "recipient": "unknown@ethereal.email",
          "action": "failed",
          "response": {
            "message": "550 No such user here",
            "status": "5.0.0"
          },
          "date": "2024-10-13T12:10:40.003Z"
        }
      ]
    }
  ]
}
```

**Why an array?** Each email can have multiple recipients, and each can bounce with different errors.

### Via API Query

Get bounce information for a specific message:

```bash
curl "https://emailengine.example.com/v1/account/john@example.com/message/AAAABgAAAdk" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes full bounce details in the `bounces` array.

## Handling Bounces in Your Application

### Node.js Example

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Store sent message IDs
const sentMessages = new Map();

// Send email
async function sendEmail(to, subject, text) {
  const response = await fetch('https://emailengine.example.com/v1/account/john@example.com/submit', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: { address: to }, subject, text })
  });

  const data = await response.json();

  // Store message ID for bounce tracking
  sentMessages.set(data.messageId, {
    to,
    subject,
    sentAt: new Date(),
    bounced: false
  });

  return data.messageId;
}

// Webhook endpoint
app.post('/webhooks/emailengine', async (req, res) => {
  const webhook = req.body;

  if (webhook.event === 'messageBounce') {
    const { messageId, recipient, action, response } = webhook.data;

    // Find original sent message
    const sentMessage = sentMessages.get(messageId);

    if (sentMessage) {
      console.log(`Bounce detected for ${recipient}`);
      console.log(`Original subject: ${sentMessage.subject}`);
      console.log(`Bounce type: ${action}`);
      console.log(`Error: ${response.message}`);

      // Mark as bounced
      sentMessage.bounced = true;
      sentMessage.bounceReason = response.message;
      sentMessage.bounceAction = action;

      // Handle hard bounces
      if (action === 'failed') {
        console.log(`Hard bounce - removing ${recipient} from list`);
        await removeFromMailingList(recipient);
      }

      // Handle soft bounces
      if (action === 'delayed') {
        console.log(`Soft bounce - retry ${recipient} later`);
        await scheduleRetry(recipient, sentMessage.subject);
      }
    }
  }

  res.json({ success: true });
});

async function removeFromMailingList(email) {
  // Remove from your database
  await db.mailingList.update(
    { email },
    { status: 'bounced', bouncedAt: new Date() }
  );
}

async function scheduleRetry(email, subject) {
  // Schedule retry for soft bounces
  await db.retryQueue.insert({
    email,
    subject,
    retryAt: new Date(Date.now() + 3600000) // Retry in 1 hour
  });
}

app.listen(3000);
```

### Python Example

```python
from flask import Flask, request, jsonify
import requests
from datetime import datetime

app = Flask(__name__)

sent_messages = {}

def send_email(to, subject, text):
    """Send email and track Message-ID"""
    response = requests.post(
        'https://emailengine.example.com/v1/account/john@example.com/submit',
        headers={
            'Authorization': 'Bearer YOUR_TOKEN',
            'Content-Type': 'application/json'
        },
        json={
            'to': {'address': to},
            'subject': subject,
            'text': text
        }
    )

    data = response.json()
    message_id = data['messageId']

    # Store for bounce tracking
    sent_messages[message_id] = {
        'to': to,
        'subject': subject,
        'sent_at': datetime.now(),
        'bounced': False
    }

    return message_id

@app.route('/webhooks/emailengine', methods=['POST'])
def webhook_handler():
    webhook = request.json

    if webhook['event'] == 'messageBounce':
        data = webhook['data']
        message_id = data['messageId']
        recipient = data['recipient']
        action = data['action']
        error = data['response']['message']

        # Find original message
        sent_message = sent_messages.get(message_id)

        if sent_message:
            print(f"Bounce detected for {recipient}")
            print(f"Error: {error}")

            # Mark as bounced
            sent_message['bounced'] = True
            sent_message['bounce_reason'] = error

            # Handle hard bounces
            if action == 'failed':
                remove_from_mailing_list(recipient)

            # Handle soft bounces
            if action == 'delayed':
                schedule_retry(recipient, sent_message['subject'])

    return jsonify({'success': True})

def remove_from_mailing_list(email):
    """Remove bounced email from mailing list"""
    # Update your database
    pass

def schedule_retry(email, subject):
    """Schedule retry for soft bounce"""
    # Add to retry queue
    pass

if __name__ == '__main__':
    app.run(port=3000)
```

### PHP Example

```php
<?php
// send-email.php

function sendEmail($to, $subject, $text) {
    $data = [
        'to' => ['address' => $to],
        'subject' => $subject,
        'text' => $text
    ];

    $ch = curl_init('https://emailengine.example.com/v1/account/john@example.com/submit');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer YOUR_TOKEN',
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    $messageId = $result['messageId'];

    // Store for bounce tracking
    $stmt = $pdo->prepare('INSERT INTO sent_messages (message_id, recipient, subject, sent_at) VALUES (?, ?, ?, NOW())');
    $stmt->execute([$messageId, $to, $subject]);

    return $messageId;
}

// webhook-handler.php

$webhook = json_decode(file_get_contents('php://input'), true);

if ($webhook['event'] === 'messageBounce') {
    $messageId = $webhook['data']['messageId'];
    $recipient = $webhook['data']['recipient'];
    $action = $webhook['data']['action'];
    $error = $webhook['data']['response']['message'];

    // Find original message
    $stmt = $pdo->prepare('SELECT * FROM sent_messages WHERE message_id = ?');
    $stmt->execute([$messageId]);
    $sentMessage = $stmt->fetch();

    if ($sentMessage) {
        error_log("Bounce detected for {$recipient}: {$error}");

        // Mark as bounced
        $stmt = $pdo->prepare('UPDATE sent_messages SET bounced = 1, bounce_reason = ?, bounce_action = ? WHERE message_id = ?');
        $stmt->execute([$error, $action, $messageId]);

        // Handle hard bounces
        if ($action === 'failed') {
            removeFromMailingList($recipient);
        }

        // Handle soft bounces
        if ($action === 'delayed') {
            scheduleRetry($recipient, $sentMessage['subject']);
        }
    }
}

echo json_encode(['success' => true]);

function removeFromMailingList($email) {
    global $pdo;
    $stmt = $pdo->prepare('UPDATE mailing_list SET status = "bounced", bounced_at = NOW() WHERE email = ?');
    $stmt->execute([$email]);
}

function scheduleRetry($email, $subject) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO retry_queue (email, subject, retry_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))');
    $stmt->execute([$email, $subject]);
}
```

## Best Practices

### 1. Always Store Message-ID

Save the Message-ID when sending emails so you can correlate bounces:

```javascript
const messageId = await sendEmail(to, subject, text);

// Store in your database
await db.sentEmails.insert({
  messageId,
  to,
  subject,
  sentAt: new Date()
});
```

### 2. Differentiate Hard and Soft Bounces

Handle them differently:

```javascript
if (webhook.data.action === 'failed') {
  // Hard bounce - permanent failure
  // Remove from mailing list immediately
  await removeFromMailingList(recipient);
}

if (webhook.data.action === 'delayed') {
  // Soft bounce - temporary failure
  // Retry after delay
  await scheduleRetry(recipient);
}
```

### 3. Implement Retry Logic for Soft Bounces

Retry soft bounces with exponential backoff:

```javascript
async function scheduleRetry(recipient, attempt = 1) {
  const maxAttempts = 3;

  if (attempt > maxAttempts) {
    // Treat as hard bounce after max attempts
    await removeFromMailingList(recipient);
    return;
  }

  // Exponential backoff: 1h, 4h, 16h
  const delayMs = Math.pow(4, attempt - 1) * 3600000;

  await db.retryQueue.insert({
    recipient,
    attempt,
    retryAt: new Date(Date.now() + delayMs)
  });
}
```

### 4. Maintain Bounce Statistics

Track bounce rates to identify problems:

```javascript
async function updateBounceStats(account, action) {
  await db.stats.increment({
    account,
    metric: action === 'failed' ? 'hard_bounces' : 'soft_bounces',
    date: new Date().toISOString().split('T')[0]
  });

  // Alert if bounce rate too high
  const stats = await db.stats.find({ account, date: today });
  const bounceRate = (stats.hard_bounces + stats.soft_bounces) / stats.sent;

  if (bounceRate > 0.05) { // 5% threshold
    await sendAlert(`High bounce rate: ${bounceRate * 100}%`);
  }
}
```

### 5. Clean Your Mailing Lists

Remove bounced addresses:

```javascript
async function removeFromMailingList(email) {
  await db.mailingList.update(
    { email },
    {
      status: 'bounced',
      bouncedAt: new Date(),
      unsubscribed: true
    }
  );

  console.log(`Removed ${email} from mailing list`);
}
```

### 6. Log Bounce Details

Keep detailed bounce logs for analysis:

```javascript
async function logBounce(webhook) {
  await db.bounceLogs.insert({
    messageId: webhook.data.messageId,
    recipient: webhook.data.recipient,
    action: webhook.data.action,
    errorMessage: webhook.data.response.message,
    smtpStatus: webhook.data.response.status,
    mta: webhook.data.mta,
    bouncedAt: new Date(webhook.date)
  });
}
```

## SMTP Status Codes

Understanding SMTP status codes helps interpret bounces:

### 5.x.x - Permanent Failures (Hard Bounces)

| Code | Description |
|------|-------------|
| 5.1.1 | Bad destination mailbox address (user unknown) |
| 5.1.2 | Bad destination system address (domain not found) |
| 5.2.1 | Mailbox disabled, not accepting messages |
| 5.2.2 | Mailbox full |
| 5.4.4 | Unable to route (no DNS records) |
| 5.7.1 | Delivery not authorized, message refused |

### 4.x.x - Temporary Failures (Soft Bounces)

| Code | Description |
|------|-------------|
| 4.2.1 | Mailbox temporarily unavailable |
| 4.2.2 | Mailbox full (temporary - might clear space) |
| 4.4.1 | Connection timed out |
| 4.7.1 | Delivery temporarily suspended (greylisting) |

### Common Bounce Messages

```
# Hard bounces
550 5.1.1 User unknown
550 5.1.2 Host or domain name not found
550 5.2.1 Mailbox disabled
550 5.2.2 Mailbox full
550 5.7.1 Message rejected due to content

# Soft bounces
450 4.2.1 Mailbox temporarily unavailable
452 4.2.2 Mailbox full
451 4.4.1 Connection timeout
450 4.7.1 Greylisting in effect
```

## Troubleshooting

### Bounces Not Detected

**Check bounce message format:**

EmailEngine requires standard DSN format. Some servers send non-standard bounces.

**Verify inbox monitoring:**

Ensure EmailEngine is monitoring the inbox where bounces arrive:

```bash
curl "https://emailengine.example.com/v1/account/john@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Check `state` is `connected`.

**Check webhook configuration:**

Verify `messageBounce` event is enabled in webhook settings.

### Wrong Message-ID Matching

**Ensure Message-ID is preserved:**

Some email servers modify Message-IDs. Use EmailEngine's outbox to ensure consistency.

**Check sent folder path:**

Make sure sent messages are stored in the correct folder.

### High Bounce Rate

**Verify email list quality:**

- Remove old addresses
- Use double opt-in for signups
- Clean list regularly

**Check sending reputation:**

- Warm up new IPs slowly
- Monitor sender score
- Implement DKIM/SPF/DMARC

**Review email content:**

- Avoid spam trigger words
- Include unsubscribe link
- Use proper email formatting

## Next Steps

- Configure [Webhooks](/docs/receiving/webhooks) to receive bounce notifications
- Set up [Pre-Processing Functions](/docs/advanced/pre-processing) to filter bounce types
- Implement [Delivery Testing](/docs/advanced/delivery-testing) to monitor inbox placement
- Review [Sending Best Practices](/docs/sending)

## Related Resources

- [DSN (Delivery Status Notification) RFC 3464](https://tools.ietf.org/html/rfc3464)
- [SMTP Status Codes RFC 5321](https://tools.ietf.org/html/rfc5321)
- [Webhook Events Reference](/docs/reference/webhook-events)
- [Email Deliverability Best Practices](https://www.emaildoctor.org/)
