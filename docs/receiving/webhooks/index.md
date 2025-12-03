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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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
curl -X POST "https://your-emailengine.com/v1/settings" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhooks/emailengine",
    "webhooksEnabled": true,
    "notifyHeaders": ["List-ID", "X-Priority"],
    "notifyTextSize": 65536,
    "notifyWebSafeHtml": true,
    "notifyCalendarEvents": true
  }'
```

:::tip Advanced: Webhook Routes
For more advanced scenarios, you can configure multiple webhook routes to send different events to different endpoints based on account, event type, or custom filtering logic. Webhook routes also support pre-processing functions to filter or transform payloads before delivery.

See [Webhooks API](/docs/api-reference/webhooks-api) for route management and [Pre-Processing Functions](/docs/advanced/pre-processing) for custom filters.
:::

### 2. Create Webhook Handler

Your webhook endpoint must:
- Accept HTTP POST requests
- Return a 2xx status code quickly (within 5 seconds)
- Process events asynchronously

<Tabs>
<TabItem value="nodejs" label="Node.js" default>

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

</TabItem>
<TabItem value="python" label="Python">

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

</TabItem>
<TabItem value="php" label="PHP">

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

</TabItem>
</Tabs>

## Webhook Events

EmailEngine sends different types of events organized into categories:

### Message Events

#### messageNew

Triggered when a new message is detected in a mailbox folder. This is one of the most commonly used webhook events, enabling real-time processing of incoming emails.

[See full messageNew reference →](/docs/receiving/webhooks/messagenew)

#### messageDeleted

Triggered when a previously tracked email has been removed from a mailbox folder. Helps keep external systems synchronized with mailbox state changes.

[See full messageDeleted reference →](/docs/receiving/webhooks/messagedeleted)

#### messageUpdated

Triggered when EmailEngine detects that the flags or labels on a message have changed, enabling real-time synchronization of message state changes with external systems.

[See full messageUpdated reference →](/docs/receiving/webhooks/messageupdated)

#### messageMissing

Triggered when EmailEngine detects that a message it expected to find on the mail server is not available. This event indicates a potential synchronization issue and helps handle edge cases in message processing.

[See full messageMissing reference →](/docs/receiving/webhooks/messagemissing)

### Delivery Events

#### messageSent

Triggered when a queued message is successfully accepted by the SMTP server or email API (Gmail API, Microsoft Graph API). This event confirms that the message has been handed off to the mail transfer agent for delivery.

[See full messageSent reference →](/docs/receiving/webhooks/messagesent)

#### messageDeliveryError

Triggered when EmailEngine fails to deliver an email to the SMTP server. This event indicates a temporary failure that may be retried automatically based on the configured retry policy.

[See full messageDeliveryError reference](/docs/receiving/webhooks/messagedeliveryerror)

#### messageFailed

Triggered when EmailEngine permanently fails to deliver a queued email after all retry attempts have been exhausted. This is a terminal event indicating that the message will not be delivered.

[See full messageFailed reference](/docs/receiving/webhooks/messagefailed)

#### messageBounce

Triggered when a bounce notification (Delivery Status Notification) is received in a monitored mailbox. EmailEngine parses the bounce message to extract delivery failure information including the failed recipient, SMTP error codes, and details about the original message.

[See full messageBounce reference](/docs/receiving/webhooks/messagebounce)

#### messageComplaint

Triggered when a feedback loop (FBL) complaint is detected. EmailEngine parses ARF (Abuse Reporting Format) complaint messages to extract information about the complainant and the original message that was reported as spam.

[See full messageComplaint reference](/docs/receiving/webhooks/messagecomplaint)

### Mailbox Events

#### mailboxNew

Triggered when a new folder is discovered on the mail server during synchronization.

[See full mailboxNew reference](/docs/receiving/webhooks/mailboxnew)

#### mailboxDeleted

Triggered when a previously tracked folder is no longer found on the mail server.

[See full mailboxDeleted reference](/docs/receiving/webhooks/mailboxdeleted)

#### mailboxReset

Triggered when a folder's UIDVALIDITY changes, indicating a mailbox reset. This is a rare but significant event that invalidates all previously tracked message UIDs in the folder.

[See full mailboxReset reference](/docs/receiving/webhooks/mailboxreset)

### Account Events

#### accountAdded

Triggered when a new account is registered.

#### accountInitialized

Triggered when initial sync completes for an account.

#### accountDeleted

Triggered when an account is removed.

#### authenticationSuccess

Triggered when EmailEngine successfully authenticates an email account for the first time or after recovering from an error state.

[See full authenticationSuccess reference](/docs/receiving/webhooks/authenticationsuccess)

#### authenticationError

Triggered when EmailEngine fails to authenticate an email account due to invalid credentials, expired OAuth2 tokens, or API authentication errors.

[See full authenticationError reference](/docs/receiving/webhooks/authenticationerror)

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
  "date": "2025-10-13T10:30:00.000Z",
  "data": {
    "messageId": "<sent-message@example.com>",
    "remoteAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
  }
}
```

**Note:** The timestamp is in the parent-level `date` field, not in `data`.

#### trackClick

Triggered when a recipient clicks a tracked link.

**Payload Example:**

```json
{
  "account": "example",
  "event": "trackClick",
  "date": "2025-10-13T10:31:00.000Z",
  "data": {
    "messageId": "<sent-message@example.com>",
    "url": "https://example.com/product",
    "remoteAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
  }
}
```

**Note:** The timestamp is in the parent-level `date` field, not in `data`.

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

**1. Set a service secret using the [settings API](/docs/api/post-v-1-settings):**

```bash
curl -X POST "https://your-emailengine.com/v1/settings" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceSecret": "your-secret-key-here"}'
```

**2. Verify signature in your handler:**

The signature is computed on the raw request body using HMAC-SHA256 and encoded as base64url.

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(rawBody, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64url');

  return signature === expectedSignature;
}

// Important: Use raw body parser to get the exact bytes for signature verification
app.post('/webhooks/emailengine', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-ee-wh-signature'];
  const secret = process.env.SERVICE_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse body after verification
  const event = JSON.parse(req.body.toString());

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

