---
title: Webhooks API
description: API endpoints for managing webhooks and receiving real-time email notifications
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

```mermaid
graph LR
    EmailEngine[EmailEngine]
    Event[Event occurs]
    POST[HTTP POST]
    App[Your Application]

    EmailEngine --> Event
    Event --> POST
    POST --> App

    style EmailEngine fill:#e1f5ff
    style Event fill:#fff4e1
    style POST fill:#f3e5f5
    style App fill:#e8f5e9
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

**Pseudo code:**
```
// Register webhook endpoint
response = HTTP_POST(
  "http://localhost:3000/v1/settings",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      webhooks: "https://your-app.com/webhook",
      webhookEvents: ["messageNew", "messageSent", "messageDeliveryError"]
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Webhook configured: " + result.success)
```

<Tabs groupId="programming-language">
<TabItem value="python" label="Python">

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

</TabItem>
<TabItem value="curl" label="cURL">

```bash
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhook",
    "webhookEvents": ["messageNew", "messageSent"]
  }'
```

</TabItem>
</Tabs>

**Response:**
```json
{
  "success": true
}
```

### 2. List Webhook Routes

Retrieve all configured webhook routes.

**Endpoint:** `GET /v1/webhookRoutes`

**Example:**

**Pseudo code:**
```
// List all webhook routes
response = HTTP_GET(
  "http://localhost:3000/v1/webhookRoutes",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

data = PARSE_JSON(response.body)
for each webhook in data.webhooks {
  PRINT(webhook.id + ": " + webhook.targetUrl)
}
```

**Response:**
```json
{
  "webhooks": [
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

**Endpoint:** `GET /v1/webhookRoutes/webhookRoute/:webhookRoute`

**Example:**

**Pseudo code:**
```
// Get specific webhook route details
routeId = "route_123abc"

response = HTTP_GET(
  "http://localhost:3000/v1/webhookRoutes/webhookRoute/" + routeId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

route = PARSE_JSON(response.body)
PRINT("Webhook URL: " + route.targetUrl)
PRINT("Events: " + route.events)
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

**Endpoint:** `PUT /v1/webhookRoutes/webhookRoute/:webhookRoute`

**Example:**

**Pseudo code:**
```
// Update webhook route configuration
routeId = "route_123abc"

response = HTTP_PUT(
  "http://localhost:3000/v1/webhookRoutes/webhookRoute/" + routeId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      events: ["messageNew", "messageDeleted", "messageSent"],
      enabled: true
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Webhook updated: " + result.success)
```

### 5. Delete Webhook Route

Remove a webhook route.

**Endpoint:** `DELETE /v1/webhookRoutes/webhookRoute/:webhookRoute`

**Example:**

**Pseudo code:**
```
// Delete webhook route
routeId = "route_123abc"

response = HTTP_DELETE(
  "http://localhost:3000/v1/webhookRoutes/webhookRoute/" + routeId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Webhook deleted: " + result.success)
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

**Verify Signature:**

**Pseudo code:**
```
// Pseudo code - implement HMAC-SHA256 verification in your language
function verifyWebhook(payload, signature, secret) {
  // Create HMAC with SHA256
  hmac = CREATE_HMAC("sha256", secret)
  hmac.UPDATE(JSON_STRING IFY(payload))
  expectedSignature = "sha256=" + hmac.DIGEST_HEX()

  // Constant-time comparison to prevent timing attacks
  return CONSTANT_TIME_COMPARE(signature, expectedSignature)
}

// Example webhook handler
function handleWebhook(request, response) {
  signature = request.headers["x-ee-signature"]
  secret = ENV_VAR("WEBHOOK_SECRET")

  if NOT verifyWebhook(request.body, signature, secret) {
    return HTTP_RESPONSE(401, { error: "Invalid signature" })
  }

  // Process webhook
  PRINT("Event: " + request.body.event)
  return HTTP_RESPONSE(200, { success: true })
}
```

<Tabs groupId="programming-language">
<TabItem value="python" label="Python">

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

</TabItem>
</Tabs>

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

**Pseudo code:**
```
// IP whitelist middleware - implement in your language/framework
function ipWhitelist(allowedIPs) {
  return function middleware(request, response, next) {
    clientIP = request.ip
    if clientIP NOT IN allowedIPs {
      return HTTP_RESPONSE(403, { error: "Forbidden" })
    }
    next()
  }
}

// Apply to webhook endpoint
ROUTE("POST", "/webhook",
  ipWhitelist(["1.2.3.4"]),
  handleWebhook
)
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

**Simple test endpoint (pseudo code):**
```
// Create basic webhook receiver for testing
CREATE_HTTP_SERVER(port: 3000)

ROUTE("POST", "/webhook", function(request, response) {
  PRINT("Webhook received: " + request.body)
  PRINT("Event: " + request.body.event)
  PRINT("Account: " + request.body.account)

  return HTTP_RESPONSE(200, { success: true })
})

START_SERVER()
PRINT("Webhook receiver listening on port 3000")
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

**Pseudo code:**
```
// Webhook handler with event filtering
ROUTE("POST", "/webhook", function(request, response) {
  event = request.body.event
  account = request.body.account
  data = request.body.data

  switch event {
    case "messageNew":
      handleNewMessage(account, data)
      break

    case "messageSent":
      handleMessageSent(account, data)
      break

    case "messageDeliveryError":
      handleSendError(account, data)
      break

    default:
      PRINT("Unhandled event: " + event)
  }

  return HTTP_RESPONSE(200, { success: true })
})
```

### Retry Handling

Implement idempotent webhook processing:

**Pseudo code:**
```
// Track processed webhooks to prevent duplicates
processedWebhooks = SET()  // or database table

ROUTE("POST", "/webhook", function(request, response) {
  event = request.body.event
  account = request.body.account
  data = request.body.data

  // Generate unique ID for this webhook
  webhookId = event + "-" + account + "-" + data.id

  // Check if already processed
  if webhookId IN processedWebhooks {
    PRINT("Duplicate webhook, skipping")
    return HTTP_RESPONSE(200, { success: true })
  }

  try {
    processWebhook(event, account, data)
    processedWebhooks.ADD(webhookId)
    return HTTP_RESPONSE(200, { success: true })
  } catch error {
    PRINT_ERROR("Webhook processing error: " + error)
    return HTTP_RESPONSE(500, { error: error.message })
  }
})
```

### Idempotency

Use message IDs to prevent duplicate processing:

**Pseudo code:**
```
// Handle new message with idempotency check
function handleNewMessage(account, message) {
  // Check if message already processed
  exists = DATABASE.FIND_ONE({
    table: "messages",
    where: {
      account: account,
      messageId: message.id
    }
  })

  if exists {
    PRINT("Message already processed")
    return
  }

  // Process new message
  processMessage(message)

  // Mark as processed
  DATABASE.INSERT({
    table: "messages",
    data: {
      account: account,
      messageId: message.id,
      processedAt: CURRENT_TIMESTAMP()
    }
  })
}
```

### Queue for Processing

Handle webhooks asynchronously:

**Pseudo code:**
```
// Create job queue for webhook processing
queue = CREATE_JOB_QUEUE("webhooks")

// Webhook endpoint - quick response
ROUTE("POST", "/webhook", function(request, response) {
  // Add to queue
  queue.ADD_JOB(request.body)

  // Respond immediately (< 30 seconds)
  return HTTP_RESPONSE(200, { success: true })
})

// Worker process (runs separately)
queue.PROCESS(function(job) {
  event = job.data.event
  account = job.data.account
  data = job.data.data

  processWebhook(event, account, data)
})
```

### Error Handling

Implement robust error handling:

**Pseudo code:**
```
// Webhook handler with comprehensive error handling
ROUTE("POST", "/webhook", function(request, response) {
  try {
    event = request.body.event
    account = request.body.account
    data = request.body.data

    // Validate payload
    if NOT event OR NOT account {
      return HTTP_RESPONSE(400, {
        error: "Invalid webhook payload"
      })
    }

    // Process webhook
    processWebhook(event, account, data)

    return HTTP_RESPONSE(200, { success: true })

  } catch error {
    PRINT_ERROR("Webhook error: " + error)

    // Return 500 to trigger EmailEngine retry
    return HTTP_RESPONSE(500, {
      error: "Processing failed",
      message: error.message
    })
  }
})
```

## Complete Example

Full webhook receiver with all best practices:

**Pseudo code:**
```
// Complete webhook receiver implementation
// Webhook secret for signature verification
WEBHOOK_SECRET = ENV_VAR("WEBHOOK_SECRET")

// Verify webhook signature middleware
function verifySignature(request, response, next) {
  signature = request.headers["x-ee-signature"]
  if NOT signature {
    return HTTP_RESPONSE(401, { error: "Missing signature" })
  }

  hmac = CREATE_HMAC("sha256", WEBHOOK_SECRET)
  hmac.UPDATE(JSON_STRINGIFY(request.body))
  expected = "sha256=" + hmac.DIGEST_HEX()

  if NOT CONSTANT_TIME_COMPARE(signature, expected) {
    return HTTP_RESPONSE(401, { error: "Invalid signature" })
  }

  next()
}

// Track processed webhooks for idempotency
processed = SET()

// Webhook endpoint with middleware
ROUTE("POST", "/webhook",
  MIDDLEWARE: [JSON_PARSER, verifySignature],
  HANDLER: function(request, response) {
    event = request.body.event
    account = request.body.account
    data = request.body.data

    // Generate unique ID
    webhookId = event + "-" + account + "-" + (data.id OR CURRENT_TIMESTAMP())

    // Check if already processed
    if webhookId IN processed {
      return HTTP_RESPONSE(200, { success: true, duplicate: true })
    }

    try {
      // Process event
      switch event {
        case "messageNew":
          handleNewMessage(account, data)
          break

        case "messageSent":
          handleMessageSent(account, data)
          break

        case "messageDeliveryError":
          handleSendError(account, data)
          break

        default:
          PRINT("Unhandled event: " + event)
      }

      // Mark as processed
      processed.ADD(webhookId)

      return HTTP_RESPONSE(200, { success: true })

    } catch error {
      PRINT_ERROR("Webhook processing error: " + error)
      return HTTP_RESPONSE(500, { error: error.message })
    }
  }
)

// Event handler functions
function handleNewMessage(account, message) {
  PRINT("New message from " + message.from.address)
  PRINT("Subject: " + message.subject)
  // Process message...
}

function handleMessageSent(account, data) {
  PRINT("Message sent: " + data.messageId)
  // Update database...
}

function handleSendError(account, data) {
  PRINT_ERROR("Send failed: " + data.error)
  // Alert admin...
}

// Start server
START_SERVER(port: 3000)
PRINT("Webhook receiver running on port 3000")
```
