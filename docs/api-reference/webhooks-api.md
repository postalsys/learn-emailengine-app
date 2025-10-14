---
title: Webhooks API
description: API endpoints for managing webhooks and receiving real-time email notifications
sidebar_position: 5
---

# Webhooks API

The Webhooks API allows you to configure real-time event notifications from EmailEngine to your application. Instead of polling for changes, webhooks push notifications to your endpoint when events occur.

## Overview

### Webhook System Architecture

EmailEngine's webhook system provides:

- **Real-time notifications**: Instant event delivery
- **Event filtering**: Subscribe to specific event types
- **Automatic retries**: Failed deliveries are retried with exponential backoff
- **Signature verification**: Secure webhook payload authentication
- **Multiple routes**: Configure different endpoints for different accounts

### Event-Driven Integration

Webhooks enable event-driven architecture:

```
EmailEngine → Event occurs → HTTP POST → Your Application
```

Benefits:
- No polling overhead
- Instant notification
- Scalable to high-volume accounts
- Reduced API calls

### Webhooks vs Polling

| Aspect | Webhooks | Polling |
|--------|----------|---------|
| Latency | Instant | Depends on interval |
| Efficiency | High (push) | Low (pull) |
| Server Load | Low | High |
| Complexity | Medium | Low |
| Reliability | Auto-retry | Manual |

## Webhook Management

### 1. Register Webhook

Configure a webhook endpoint to receive events.

**Endpoint:** `POST /v1/settings`

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `webhooks` | string | Yes | Webhook endpoint URL |
| `webhookEvents` | array | No | Event types to receive (default: all) |

**Example:**

**Node.js:**
```javascript
const response = await fetch('http://localhost:3000/v1/settings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    webhooks: 'https://your-app.com/webhook',
    webhookEvents: ['messageNew', 'messageSent', 'messageDeliveryError']
  })
});

const result = await response.json();
console.log('Webhook configured:', result.success);
```

**Python:**
```python
response = requests.post(
    'http://localhost:3000/v1/settings',
    headers={
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'webhooks': 'https://your-app.com/webhook',
        'webhookEvents': ['messageNew', 'messageSent']
    }
)

result = response.json()
print(f"Webhook configured: {result['success']}")
```

**cURL:**
```bash
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhook",
    "webhookEvents": ["messageNew", "messageSent"]
  }'
```

**Response:**
```json
{
  "success": true
}
```

### 2. List Webhook Routes

Retrieve all configured webhook routes.

**Endpoint:** `GET /v1/webhookroutes`

**Example:**

```javascript
const response = await fetch('http://localhost:3000/v1/webhookroutes', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
});

const routes = await response.json();
routes.routes.forEach(route => {
  console.log(`${route.id}: ${route.targetUrl}`);
});
```

**Response:**
```json
{
  "routes": [
    {
      "id": "route_123abc",
      "targetUrl": "https://your-app.com/webhook",
      "events": ["messageNew", "messageSent"],
      "enabled": true
    }
  ]
}
```

### 3. Get Webhook Route

Retrieve details of a specific webhook route.

**Endpoint:** `GET /v1/webhookroutes/webhookroute/:webhookroute`

**Example:**

```javascript
const routeId = 'route_123abc';

const response = await fetch(
  `http://localhost:3000/v1/webhookroutes/webhookroute/${routeId}`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const route = await response.json();
console.log('Webhook URL:', route.targetUrl);
console.log('Events:', route.events);
```

**Response:**
```json
{
  "id": "route_123abc",
  "targetUrl": "https://your-app.com/webhook",
  "events": ["messageNew"],
  "customHeaders": {
    "X-Custom-Header": "value"
  },
  "enabled": true
}
```

### 4. Update Webhook Route

Update an existing webhook route configuration.

**Endpoint:** `PUT /v1/webhookroutes/webhookroute/:webhookroute`

**Example:**

```javascript
const routeId = 'route_123abc';

const response = await fetch(
  `http://localhost:3000/v1/webhookroutes/webhookroute/${routeId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      events: ['messageNew', 'messageDeleted', 'messageSent'],
      enabled: true
    })
  }
);

const result = await response.json();
console.log('Webhook updated:', result.success);
```

### 5. Delete Webhook Route

Remove a webhook route.

**Endpoint:** `DELETE /v1/webhookroutes/webhookroute/:webhookroute`

**Example:**

```javascript
const routeId = 'route_123abc';

const response = await fetch(
  `http://localhost:3000/v1/webhookroutes/webhookroute/${routeId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const result = await response.json();
console.log('Webhook deleted:', result.success);
```

## Webhook Configuration

### Target URL

The webhook endpoint must:
- Use HTTPS (HTTP only for development)
- Be publicly accessible
- Respond within 30 seconds
- Return 2xx status code for success

**Valid URLs:**
```
https://your-app.com/webhook
https://api.yourservice.com/emailengine/events
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### Event Filters

Subscribe to specific event types:

```javascript
{
  webhooks: 'https://your-app.com/webhook',
  webhookEvents: [
    'messageNew',        // New message received
    'messageDeleted',    // Message deleted
    'messageSent',       // Message sent successfully
    'messageDeliveryError' // Send failed
  ]
}
```

**Subscribe to all events:**
```javascript
{
  webhooks: 'https://your-app.com/webhook'
  // webhookEvents omitted = all events
}
```

### Custom Headers

Add custom headers to webhook requests:

```javascript
{
  webhooks: 'https://your-app.com/webhook',
  customHeaders: {
    'X-API-Key': 'your-secret-key',
    'X-Source': 'emailengine'
  }
}
```

### Authentication

**Bearer Token:**
```javascript
{
  webhooks: 'https://your-app.com/webhook',
  customHeaders: {
    'Authorization': 'Bearer YOUR_SECRET_TOKEN'
  }
}
```

**Basic Auth:**
Include credentials in URL (not recommended for production):
```javascript
{
  webhooks: 'https://user:password@your-app.com/webhook'
}
```

## Webhook Payload

### Common Payload Structure

All webhooks follow this structure:

```json
{
  "event": "messageNew",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    /* event-specific data */
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type (e.g., "messageNew") |
| `account` | string | Account identifier |
| `date` | string | ISO timestamp of event |
| `data` | object | Event-specific payload |

### Event-Specific Fields

Each event type includes specific data in the `data` field. See [Webhook Events Reference](/docs/reference/webhook-events) for complete details.

**Example - messageNew:**
```json
{
  "event": "messageNew",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "subject": "New Email",
    "from": {
      "name": "John Doe",
      "address": "john@example.com"
    },
    "date": "2025-01-15T10:30:00.000Z",
    "unseen": true
  }
}
```

### Retry Metadata

Failed webhooks include retry information:

```json
{
  "event": "messageNew",
  "account": "user@example.com",
  "data": { /* ... */ },
  "retryCount": 2,
  "maxRetries": 3
}
```

## Event Types Overview

Complete list of webhook events (see [Webhook Events Reference](/docs/reference/webhook-events) for detailed payloads):

### Account Events

| Event | Trigger |
|-------|---------|
| `accountAdded` | Account registered |
| `accountDeleted` | Account deleted |
| `accountError` | Account error occurred |
| `accountInitialized` | Account first connected |

### Message Events

| Event | Trigger |
|-------|---------|
| `messageNew` | New message received |
| `messageDeleted` | Message deleted from mailbox |
| `messageUpdated` | Message flags changed |
| `messageMissing` | Message disappeared from mailbox |

### Mailbox Events

| Event | Trigger |
|-------|---------|
| `mailboxNew` | New folder created |
| `mailboxDeleted` | Folder deleted |
| `mailboxRenamed` | Folder renamed |

### Sending Events

| Event | Trigger |
|-------|---------|
| `messageSent` | Message sent successfully |
| `messageDeliveryError` | Sending failed |
| `messageBounce` | Bounce notification received |

## Security

### Webhook Signatures

EmailEngine signs webhook payloads for verification.

**Signature Header:**
```
X-EE-Signature: sha256=abc123def456...
```

**Verify Signature (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = 'sha256=' + hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js middleware
app.post('/webhook', express.json(), (req, res) => {
  const signature = req.headers['x-ee-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhook(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  console.log('Event:', req.body.event);
  res.json({ success: true });
});
```

**Verify Signature (Python):**
```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)

# Flask example
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-EE-Signature')
    payload = request.get_data(as_text=True)
    secret = os.environ['WEBHOOK_SECRET']

    if not verify_webhook(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401

    event = request.json
    print(f"Event: {event['event']}")
    return jsonify({'success': True})
```

### IP Whitelisting

Restrict webhook access to EmailEngine's IP:

**Nginx:**
```nginx
location /webhook {
    allow 1.2.3.4;  # EmailEngine IP
    deny all;
    proxy_pass http://localhost:3000;
}
```

**Express.js:**
```javascript
function ipWhitelist(allowedIPs) {
  return (req, res, next) => {
    const clientIP = req.ip;
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.post('/webhook',
  ipWhitelist(['1.2.3.4']),
  handleWebhook
);
```

### HTTPS Requirement

Production webhooks should use HTTPS:

- Prevents man-in-the-middle attacks
- Encrypts sensitive payload data
- Required for PCI compliance

**Development exception:**
HTTP allowed for localhost testing only.

## Testing Webhooks

### Webhook Tailing Feature

Monitor webhooks in real-time via EmailEngine UI:

1. Navigate to Settings > Webhooks
2. Click "Tail Webhooks"
3. See live webhook deliveries

### Testing Tools

**RequestBin:**
Create temporary webhook endpoint:
```
https://requestbin.com/
```

**Webhook.site:**
Instant webhook URL for testing:
```
https://webhook.site/
```

**ngrok:**
Expose local server to internet:
```bash
ngrok http 3000
# Use generated URL: https://abc123.ngrok.io/webhook
```

### Local Testing

**Express.js test endpoint:**
```javascript
const express = require('express');
const app = express();

app.post('/webhook', express.json(), (req, res) => {
  console.log('Webhook received:', req.body);
  console.log('Event:', req.body.event);
  console.log('Account:', req.body.account);

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Webhook receiver listening on port 3000');
});
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messageNew",
    "account": "test@example.com",
    "data": {
      "subject": "Test"
    }
  }'
```

### Debugging Tips

**Check webhook logs in EmailEngine:**
```bash
# View logs with webhook activity
docker logs emailengine | grep webhook
```

**Validate endpoint:**
```bash
# Test your endpoint is accessible
curl -X POST https://your-app.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Common issues:**
- Endpoint not accessible (firewall, DNS)
- HTTPS certificate invalid
- Timeout (response > 30s)
- Wrong status code (not 2xx)
- Signature verification failing

## Common Patterns

### Event Filtering

Process only specific events:

```javascript
app.post('/webhook', express.json(), (req, res) => {
  const { event, account, data } = req.body;

  switch (event) {
    case 'messageNew':
      handleNewMessage(account, data);
      break;

    case 'messageSent':
      handleMessageSent(account, data);
      break;

    case 'messageDeliveryError':
      handleSendError(account, data);
      break;

    default:
      console.log('Unhandled event:', event);
  }

  res.json({ success: true });
});
```

### Retry Handling

Implement idempotent webhook processing:

```javascript
const processedWebhooks = new Set();

app.post('/webhook', express.json(), async (req, res) => {
  const { event, account, data } = req.body;

  // Generate unique ID for this webhook
  const webhookId = `${event}-${account}-${data.id}`;

  // Check if already processed
  if (processedWebhooks.has(webhookId)) {
    console.log('Duplicate webhook, skipping');
    return res.json({ success: true });
  }

  try {
    await processWebhook(event, account, data);
    processedWebhooks.add(webhookId);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Idempotency

Use message IDs to prevent duplicate processing:

```javascript
async function handleNewMessage(account, message) {
  // Check if message already processed
  const exists = await db.messages.findOne({
    account: account,
    messageId: message.id
  });

  if (exists) {
    console.log('Message already processed');
    return;
  }

  // Process new message
  await processMessage(message);

  // Mark as processed
  await db.messages.insert({
    account: account,
    messageId: message.id,
    processedAt: new Date()
  });
}
```

### Queue for Processing

Handle webhooks asynchronously:

```javascript
const Bull = require('bull');
const queue = new Bull('webhooks');

// Webhook endpoint - quick response
app.post('/webhook', express.json(), async (req, res) => {
  // Add to queue
  await queue.add(req.body);

  // Respond immediately
  res.json({ success: true });
});

// Worker process
queue.process(async (job) => {
  const { event, account, data } = job.data;
  await processWebhook(event, account, data);
});
```

### Error Handling

Implement robust error handling:

```javascript
app.post('/webhook', express.json(), async (req, res) => {
  try {
    const { event, account, data } = req.body;

    // Validate payload
    if (!event || !account) {
      return res.status(400).json({
        error: 'Invalid webhook payload'
      });
    }

    // Process webhook
    await processWebhook(event, account, data);

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);

    // Return 500 to trigger EmailEngine retry
    res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
});
```

## Complete Example

Full webhook receiver with all best practices:

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Verify webhook signature
function verifySignature(req, res, next) {
  const signature = req.headers['x-ee-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(req.body));
  const expected = 'sha256=' + hmac.digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

// Track processed webhooks for idempotency
const processed = new Set();

// Webhook endpoint
app.post('/webhook',
  express.json(),
  verifySignature,
  async (req, res) => {
    const { event, account, data } = req.body;

    // Generate unique ID
    const webhookId = `${event}-${account}-${data.id || Date.now()}`;

    // Check if already processed
    if (processed.has(webhookId)) {
      return res.json({ success: true, duplicate: true });
    }

    try {
      // Process event
      switch (event) {
        case 'messageNew':
          await handleNewMessage(account, data);
          break;

        case 'messageSent':
          await handleMessageSent(account, data);
          break;

        case 'messageDeliveryError':
          await handleSendError(account, data);
          break;

        default:
          console.log('Unhandled event:', event);
      }

      // Mark as processed
      processed.add(webhookId);

      res.json({ success: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Event handlers
async function handleNewMessage(account, message) {
  console.log(`New message from ${message.from.address}`);
  console.log(`Subject: ${message.subject}`);
  // Process message...
}

async function handleMessageSent(account, data) {
  console.log(`Message sent: ${data.messageId}`);
  // Update database...
}

async function handleSendError(account, data) {
  console.error(`Send failed: ${data.error}`);
  // Alert admin...
}

app.listen(3000, () => {
  console.log('Webhook receiver running on port 3000');
});
```

## See Also

- [Webhook Events Reference](/docs/reference/webhook-events)
- [Receiving Messages](/docs/receiving)
- [Webhooks Guide](/docs/receiving/webhooks)
- [Continuous Processing](/docs/receiving/continuous-processing)
- [Error Codes](/docs/reference/error-codes)
