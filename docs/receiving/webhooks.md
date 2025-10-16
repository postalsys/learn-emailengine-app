---
title: Webhooks
sidebar_position: 2
description: "Complete guide to EmailEngine webhooks - setup, event types, testing, debugging, and best practices"
keywords:
  - webhooks
  - real-time notifications
  - webhook events
  - webhook debugging
  - webhook testing
---

# Webhooks

<!--
Source attribution:
- PRIMARY: docs/usage/webhooks.md
- ENHANCED: blog/2022-06-22-tailing-webhooks.md
- ENHANCED: blog/2025-05-05-debugging-webhooks-in-emailengine.md
- Additional patterns and best practices
-->

Webhooks are the primary mechanism for receiving real-time notifications from EmailEngine about mailbox events, message changes, and delivery status. Instead of repeatedly polling for updates, EmailEngine pushes notifications to your application as events occur.

## Why Use Webhooks?

**Real-Time Updates**
- Instant notifications when events occur
- No polling delays or missed events
- Process messages as they arrive

**Efficient**
- Eliminates the need for constant polling
- Reduces API calls and server load
- Lower latency for time-sensitive operations

**Comprehensive Event Coverage**
- Message lifecycle (new, updated, deleted)
- Delivery status (sent, failed, bounced)
- Account status (connected, disconnected, errors)
- User interactions (opens, clicks, unsubscribes)

**Scalable**
- Handle high message volumes effortlessly
- Process events asynchronously
- Built on BullMQ for reliability

## Setting Up Webhooks

### 1. Configure Webhook URL

Set your webhook endpoint URL in EmailEngine:

**Via Web UI:**
1. Navigate to **Configuration → Webhooks**
2. Check **Enable webhooks**
3. Enter your **Webhook URL**: `https://your-app.com/webhooks/emailengine`
4. Select which events to receive
5. Click **Update Settings**

**Via API:**

Use the [settings API](/docs/api/post-v-1-settings) to configure webhooks:

```bash
curl -X PUT "https://your-emailengine.com/admin/config" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhooks/emailengine",
    "webhooksEnabled": true,
    "notifyHeaders": true,
    "notifyTextSize": 65536,
    "notifyWebSafeHtml": true,
    "notifyCalendarEvents": true
  }'
```

### 2. Create Webhook Handler

Your webhook endpoint must:
- Accept HTTP POST requests
- Return a 2xx status code quickly (within 5 seconds)
- Process events asynchronously

**Node.js Example:**

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhooks/emailengine', async (req, res) => {
  const event = req.body;

  // Acknowledge receipt immediately
  res.status(200).json({ success: true });

  // Process asynchronously
  processEvent(event).catch(err => {
    console.error('Webhook processing error:', err);
  });
});

async function processEvent(event) {
  console.log(`Received ${event.event} event for account ${event.account}`);

  switch (event.event) {
    case 'messageNew':
      await handleNewMessage(event);
      break;
    case 'messageSent':
      await handleMessageSent(event);
      break;
    case 'messageFailed':
      await handleMessageFailed(event);
      break;
    // Handle other events...
  }
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

**Python Example:**

```python
from flask import Flask, request, jsonify
import asyncio

app = Flask(__name__)

@app.route('/webhooks/emailengine', methods=['POST'])
def webhook_handler():
    event = request.get_json()

    # Acknowledge immediately
    asyncio.create_task(process_event(event))
    return jsonify({'success': True}), 200

async def process_event(event):
    event_type = event.get('event')
    account = event.get('account')

    print(f"Processing {event_type} for {account}")

    if event_type == 'messageNew':
        await handle_new_message(event)
    elif event_type == 'messageSent':
        await handle_message_sent(event)
    # Handle other events...

if __name__ == '__main__':
    app.run(port=3000)
```

**PHP Example:**

```php
<?php
// webhook.php

// Read the webhook payload
$payload = file_get_contents('php://input');
$event = json_decode($payload, true);

// Respond immediately
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['success' => true]);

// Close connection and process asynchronously
fastcgi_finish_request();

// Process the event
processEvent($event);

function processEvent($event) {
    $eventType = $event['event'] ?? '';
    $account = $event['account'] ?? '';

    error_log("Processing $eventType for $account");

    switch ($eventType) {
        case 'messageNew':
            handleNewMessage($event);
            break;
        case 'messageSent':
            handleMessageSent($event);
            break;
        // Handle other events...
    }
}
?>
```

## Webhook Events

EmailEngine sends different types of events organized into categories:

### Message Events

#### messageNew

Triggered when a new message is detected in a mailbox folder.

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageNew",
  "data": {
    "id": "AAAAAQAAAeE",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "1743d29c-b67d-4747-9016-b8850a5a39bd",
    "threadId": "1743d29c-b67d-4747-9016-b8850a5a39bd",
    "date": "2025-10-13T10:23:45.000Z",
    "flags": ["\\Seen"],
    "labels": ["\\Inbox"],
    "unseen": false,
    "flagged": false,
    "answered": false,
    "draft": false,
    "size": 45678,
    "subject": "Meeting Tomorrow",
    "from": {
      "name": "John Doe",
      "address": "john@example.com"
    },
    "to": [
      {
        "name": "Jane Smith",
        "address": "jane@company.com"
      }
    ],
    "messageId": "<abc123@example.com>",
    "inReplyTo": "<xyz789@example.com>",
    "text": "Plain text body...",
    "html": ["<p>HTML body...</p>"],
    "attachments": [
      {
        "id": "AAAAAgAAAeEBAAAAAQAAAeE",
        "contentType": "application/pdf",
        "encodedSize": 45000,
        "filename": "report.pdf",
        "embedded": false
      }
    ]
  }
}
```

**Use Cases:**
- Trigger support ticket creation
- Process incoming orders
- Filter and classify emails
- Feed emails to AI analysis

#### messageDeleted

Triggered when a message is removed from a folder.

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageDeleted",
  "data": {
    "id": "AAAAAQAAAeE",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "1743d29c-b67d-4747-9016-b8850a5a39bd"
  }
}
```

**Use Cases:**
- Sync deletions to external systems
- Update indexes and databases
- Track user behavior

#### messageUpdated

Triggered when message flags or labels change.

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageUpdated",
  "data": {
    "id": "AAAAAQAAAeE",
    "uid": 12345,
    "path": "INBOX",
    "flags": {
      "add": ["\\Seen"],
      "delete": []
    },
    "labels": {
      "add": ["Important"],
      "delete": []
    }
  }
}
```

**Use Cases:**
- Track read status
- Sync flags to external systems
- Monitor user actions

### Delivery Events

#### messageSent

Triggered when a queued message is successfully accepted by the SMTP server.

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageSent",
  "data": {
    "queueId": "abc123def456",
    "messageId": "<sent-message@example.com>",
    "response": "250 2.0.0 OK: queued as 1234ABCD"
  }
}
```

#### messageDeliveryError

Triggered when delivery to the SMTP server fails temporarily (will retry).

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "abc123def456",
    "error": "Connection timeout",
    "response": "421 4.4.2 Connection timeout"
  }
}
```

#### messageFailed

Triggered when delivery permanently fails (no more retries).

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageFailed",
  "data": {
    "queueId": "abc123def456",
    "error": "Recipient rejected",
    "response": "550 5.1.1 User unknown"
  }
}
```

#### messageBounce

Triggered when a bounce message is received.

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageBounce",
  "data": {
    "id": "AAAAAQAAAeE",
    "bounceMessage": "Mailbox full",
    "recipient": "user@example.com",
    "action": "failed",
    "status": "5.2.2"
  }
}
```

#### messageComplaint

Triggered when a feedback loop complaint is detected.

**Payload Example:**

```json
{
  "account": "example",
  "event": "messageComplaint",
  "data": {
    "id": "AAAAAQAAAeE",
    "recipient": "user@example.com",
    "complaintType": "abuse"
  }
}
```

### Mailbox Events

#### mailboxNew

Triggered when a new folder is created.

#### mailboxDeleted

Triggered when a folder is deleted.

#### mailboxReset

Triggered when a folder's UIDVALIDITY changes (rare event).

### Account Events

#### accountAdded

Triggered when a new account is registered.

#### accountInitialized

Triggered when initial sync completes for an account.

#### accountDeleted

Triggered when an account is removed.

#### authenticationSuccess

Triggered when account successfully authenticates.

#### authenticationError

Triggered when authentication fails.

#### connectError

Triggered when connection to email server fails.

### Tracking Events

#### trackOpen

Triggered when a recipient opens an email (requires open tracking enabled).

**Payload Example:**

```json
{
  "account": "example",
  "event": "trackOpen",
  "data": {
    "messageId": "<sent-message@example.com>",
    "recipient": "user@example.com",
    "timestamp": "2025-10-13T10:30:00.000Z",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  }
}
```

#### trackClick

Triggered when a recipient clicks a tracked link.

**Payload Example:**

```json
{
  "account": "example",
  "event": "trackClick",
  "data": {
    "messageId": "<sent-message@example.com>",
    "recipient": "user@example.com",
    "url": "https://example.com/product",
    "timestamp": "2025-10-13T10:31:00.000Z",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  }
}
```

#### listUnsubscribe

Triggered when a recipient unsubscribes.

#### listSubscribe

Triggered when a recipient resubscribes.

## Testing Webhooks

### Using webhook.site

The easiest way to test webhooks is using a temporary webhook inspector:

1. Visit [https://webhook.site/](https://webhook.site/)
2. Copy your unique webhook URL
3. Set it as the webhook URL in EmailEngine
4. Trigger an event (send a test email, add an account, etc.)
5. View the webhook payload in real-time

### Tailing Webhooks to a Log File

For ongoing webhook monitoring, you can log all webhooks to a file and tail them:

**Step 1: Create log file**

```bash
sudo touch /var/log/emailengine-webhooks.log
sudo chown www-data /var/log/emailengine-webhooks.log  # Adjust user as needed
```

**Step 2: Create PHP webhook logger**

```php
<?php
// webhook-logger.php

$logFile = '/var/log/emailengine-webhooks.log';

// Read webhook payload
$payload = file_get_contents('php://input');
$headers = getallheaders();

// Create log entry
$logEntry = [
    'timestamp' => date('c'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'headers' => $headers,
    'request' => json_decode($payload, true)
];

// Append to log file
file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND);

// Respond
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>
```

**Step 3: Tail the log with jq**

```bash
# Install jq if needed
sudo apt update && sudo apt install -y jq

# Tail and pretty-print webhooks
tail -f /var/log/emailengine-webhooks.log | jq
```

This gives you a real-time, pretty-printed view of all incoming webhooks.

### Send Test Webhook

EmailEngine allows you to send a test webhook from the UI:

1. Go to **Configuration → Webhooks**
2. Click **Send Test Payload**
3. Check your webhook endpoint receives the test

## Debugging Webhooks

If webhooks aren't working as expected, follow this diagnostic process:

### 1. Verify External Connectivity

**Test with webhook.site:**
1. Set webhook URL to https://webhook.site/your-unique-id
2. Trigger an event in EmailEngine
3. Check if webhook.site receives the request

If no request appears:
- Check firewall rules
- Verify DNS resolution
- Ensure EmailEngine can make outbound HTTPS requests
- Check for typos in webhook URL

### 2. Monitor Webhook Queue

EmailEngine uses BullMQ to manage webhook delivery. To inspect webhook jobs:

1. Go to **Tools → Bull Board**
2. Select **Webhooks** queue
3. Check these tabs:
   - **Active**: Currently processing
   - **Delayed**: Failed but will retry
   - **Failed**: Exceeded retry limit
   - **Completed**: Successfully delivered (if retention enabled)

**Enable Job Retention:**

To keep failed jobs for inspection:

1. Go to **Configuration → Service**
2. Set **Completed/failed queue entries to keep** to **100**
3. Save changes

Now failed webhooks remain visible in Bull Board with full error details.

### 3. Inspect Failed Jobs

Click on a failed job in Bull Board to see:
- Complete error stack trace
- Request headers sent
- Payload data
- Response from your server
- Retry attempts

Common errors:
- **Connection timeout**: Your server is unreachable
- **SSL/TLS error**: Certificate issues
- **4xx status**: Your server rejected the webhook
- **5xx status**: Your server had an internal error
- **JSON parse error**: Your server returned invalid JSON

### 4. Verify Event Generation

Test if events are being generated at all:

**Add a new account:**
- Should trigger `accountAdded` and `accountInitialized` events

**Send test email to an account:**
- Should trigger `messageNew` within 10-60 seconds
- If not, verify message arrived (check via webmail)
- Check message is visible via API:

```bash
curl "https://your-emailengine.com/v1/account/ACCOUNT_ID/messages?path=INBOX" \
  -H "Authorization: Bearer TOKEN"
```

[List messages API →](/docs/api/get-v-1-account-account-messages)

If message is missing:
- Wrong account credentials
- OAuth token lacks required scopes
- Message filtered to different folder

### 5. Special Requirements for API Backends

#### Gmail API + Cloud Pub/Sub

If using Gmail API (not IMAP):

1. Go to **Configuration → OAuth2**
2. Select your Gmail OAuth app
3. Scroll to **Cloud Pub/Sub configuration**
4. Verify all show **Created** (in green):
   - Topic
   - Subscription
   - Gmail bindings

If not created:
- Google Cloud service account missing IAM roles
- Pub/Sub API not enabled
- Invalid credentials

#### Microsoft Graph API

If using MS Graph (not IMAP):

1. Go to **Email Accounts**
2. Select the account
3. Scroll to **Change subscription**
4. Verify status is **Created** and expiration is in future

If not created:
- EmailEngine not reachable from Microsoft servers
- TLS certificate invalid
- Service URL not configured correctly
- OAuth app missing required scopes

Microsoft Graph requires these endpoints to be publicly accessible:
```
https://YOUR-EMAILENGINE-HOST/oauth/msg/lifecycle
https://YOUR-EMAILENGINE-HOST/oauth/msg/notification
```

## Webhook Security

### Verify Webhook Authenticity

EmailEngine can sign webhooks using HMAC:

**1. Set a webhook secret using the [settings API](/docs/api/post-v-1-settings):**

```bash
curl -X PUT "https://your-emailengine.com/admin/config" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"webhookSecret": "your-secret-key-here"}'
```

**2. Verify signature in your handler:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

app.post('/webhooks/emailengine', (req, res) => {
  const signature = req.headers['x-ee-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook...
  res.json({ success: true });
});
```

### Use HTTPS

Always use HTTPS for webhook URLs to prevent:
- Man-in-the-middle attacks
- Credential exposure
- Data tampering

### Implement Rate Limiting

Protect your webhook endpoint:

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute
  message: 'Too many webhook requests'
});

app.post('/webhooks/emailengine', webhookLimiter, handleWebhook);
```

## Best Practices

### 1. Respond Quickly

Always return a 2xx status within 5 seconds:

```javascript
app.post('/webhooks/emailengine', async (req, res) => {
  // Acknowledge immediately
  res.status(200).json({ success: true });

  // Process asynchronously
  setImmediate(async () => {
    try {
      await processWebhook(req.body);
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  });
});
```

### 2. Handle Idempotency

Webhooks may be delivered more than once. Use message IDs for deduplication:

```javascript
const processedEvents = new Set();

async function processWebhook(event) {
  const eventId = event.data?.id || event.data?.queueId;

  if (!eventId) {
    console.warn('Event without ID');
    return;
  }

  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return;
  }

  processedEvents.add(eventId);

  // Process event...

  // Clean up old IDs periodically
  if (processedEvents.size > 10000) {
    const oldIds = Array.from(processedEvents).slice(0, 5000);
    oldIds.forEach(id => processedEvents.delete(id));
  }
}
```

### 3. Use Message Queues

For high-volume scenarios, queue webhooks for processing:

```javascript
const Bull = require('bull');
const webhookQueue = new Bull('webhooks', {
  redis: { host: 'localhost', port: 6379 }
});

app.post('/webhooks/emailengine', async (req, res) => {
  // Add to queue
  await webhookQueue.add(req.body);

  // Acknowledge
  res.json({ success: true });
});

// Process jobs
webhookQueue.process(async (job) => {
  await processWebhook(job.data);
});
```

### 4. Monitor Webhook Health

Track webhook delivery and processing:

```javascript
const metrics = {
  received: 0,
  processed: 0,
  failed: 0
};

app.post('/webhooks/emailengine', async (req, res) => {
  metrics.received++;

  res.json({ success: true });

  try {
    await processWebhook(req.body);
    metrics.processed++;
  } catch (err) {
    metrics.failed++;
    console.error('Processing error:', err);
  }
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics);
});
```

### 5. Log Errors Appropriately

Log sufficient detail for debugging without exposing sensitive data:

```javascript
async function processWebhook(event) {
  try {
    // Process event...
  } catch (err) {
    console.error('Webhook processing failed:', {
      event: event.event,
      account: event.account,
      messageId: event.data?.id,
      error: err.message,
      stack: err.stack
    });

    // Don't log full message content or credentials
  }
}
```

## Troubleshooting

### Problem: Webhooks Not Received

**Solutions:**
1. Verify webhooks are enabled in Configuration → Webhooks
2. Check webhook URL is correct and accessible
3. Test with webhook.site first
4. Review firewall and proxy settings
5. Check EmailEngine logs for errors

### Problem: Webhooks Delayed

**Solutions:**
1. Check your server response time (should be < 1 second)
2. Review Bull Board for queue backlog
3. Monitor Redis performance
4. Consider scaling your webhook processing

### Problem: Duplicate Webhooks

**Solutions:**
1. Implement idempotency checking (use message IDs)
2. Ensure your handler returns 200 quickly
3. Don't throw errors that cause retries
4. Check for multiple EmailEngine instances with same config

### Problem: Missing Event Types

**Solutions:**
1. Verify event type is enabled in Configuration → Webhooks
2. Check "All events" is selected or specific events are enabled
3. Confirm account type supports the event (e.g., IDLE for IMAP)
4. Review account sync settings
