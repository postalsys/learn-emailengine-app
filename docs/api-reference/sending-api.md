---
title: Sending API
sidebar_position: 4
---

# Sending API

The Sending API provides two methods for sending emails through EmailEngine: the Submit API for immediate delivery and the Outbox API for queued delivery with automatic retry logic.

## Overview

EmailEngine offers two approaches to sending emails:

1. **Submit API** - Send immediately with real-time webhooks
2. **Outbox API** - Queue for delivery with automatic retries

### When to Use Each Method

| Use Case | Recommended Method |
|----------|-------------------|
| Interactive email (user clicking "send") | Submit API |
| Bulk email campaigns | Outbox API |
| Transactional emails (receipts, confirmations) | Submit API |
| Scheduled sends | Outbox API |
| High-volume sending | Outbox API |
| Real-time delivery status needed | Submit API |
| Retry logic required | Outbox API |

## Submit API (Immediate Send)

The Submit API sends emails immediately and provides real-time delivery status via webhooks.

### Endpoint

`POST /v1/account/:account/submit`

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | array | Yes | Recipient addresses |
| `subject` | string | No | Email subject |
| `text` | string | No* | Plain text content |
| `html` | string | No* | HTML content |
| `from` | object | No | Custom from address |
| `cc` | array | No | CC recipients |
| `bcc` | array | No | BCC recipients |
| `replyTo` | object | No | Reply-To address |
| `attachments` | array | No | File attachments |
| `headers` | object | No | Custom headers |
| `reference` | object | No | For replies/forwards |

*Either `text` or `html` is required.

### Address Format

```json
{
  "name": "John Doe",
  "address": "john@example.com"
}
```

Or simplified:
```json
{ "address": "john@example.com" }
```

### Examples

**Simple Email:**

**Node.js:**
```javascript
const account = 'user@example.com';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/submit`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [
        {
          name: 'Jane Smith',
          address: 'jane@example.com'
        }
      ],
      subject: 'Hello from EmailEngine',
      text: 'This is a test email sent via the API.',
      html: '<p>This is a test email sent via the API.</p>'
    })
  }
);

const result = await response.json();
console.log('Message sent:', result.messageId);
console.log('Queue ID:', result.queueId);
```

**Python:**
```python
from urllib.parse import quote

account = 'user@example.com'

response = requests.post(
    f'http://localhost:3000/v1/account/{quote(account)}/submit',
    headers={
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'to': [{'address': 'jane@example.com', 'name': 'Jane Smith'}],
        'subject': 'Hello from EmailEngine',
        'text': 'This is a test email sent via the API.'
    }
)

result = response.json()
print(f"Message sent: {result['messageId']}")
```

**PHP:**
```php
<?php
$account = urlencode('user@example.com');
$ch = curl_init("http://localhost:3000/v1/account/$account/submit");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_ACCESS_TOKEN',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'to' => [['address' => 'jane@example.com']],
    'subject' => 'Hello from EmailEngine',
    'text' => 'This is a test email sent via the API.'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
echo "Message sent: " . $result['messageId'];
```

**cURL:**
```bash
curl -X POST "http://localhost:3000/v1/account/user@example.com/submit" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {
        "address": "jane@example.com",
        "name": "Jane Smith"
      }
    ],
    "subject": "Hello from EmailEngine",
    "text": "This is a test email sent via the API."
  }'
```

**Response:**
```json
{
  "success": true,
  "messageId": "<abc123@example.com>",
  "queueId": "queue_456def"
}
```

**HTML Email with Attachments:**

```javascript
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/submit`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ address: 'client@example.com' }],
      subject: 'Invoice #12345',
      html: '<h1>Invoice</h1><p>Please find your invoice attached.</p>',
      attachments: [
        {
          filename: 'invoice.pdf',
          content: 'base64_encoded_content_here',
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    })
  }
);
```

**Reply to Email:**

```javascript
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/submit`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ address: 'original-sender@example.com' }],
      subject: 'Re: Original Subject',
      text: 'This is my reply.',
      reference: {
        message: 'AAAABAABNc',  // ID of message being replied to
        action: 'reply'
      }
    })
  }
);
```

**Forward Email:**

```javascript
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/submit`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ address: 'colleague@example.com' }],
      subject: 'Fwd: Original Subject',
      text: 'See forwarded message below.',
      reference: {
        message: 'AAAABAABNc',
        action: 'forward',
        attachments: true  // Include original attachments
      }
    })
  }
);
```

### Webhooks

The Submit API triggers these webhook events:

**messageSent** - Message successfully sent
```json
{
  "event": "messageSent",
  "account": "user@example.com",
  "data": {
    "queueId": "queue_456def",
    "messageId": "<abc123@example.com>",
    "response": "250 2.0.0 OK"
  }
}
```

**messageDeliveryError** - Sending failed
```json
{
  "event": "messageDeliveryError",
  "account": "user@example.com",
  "data": {
    "queueId": "queue_456def",
    "error": "Mailbox not found",
    "response": "550 5.1.1 User unknown"
  }
}
```

### Use Cases

- **Interactive email**: User clicks "send" button
- **Real-time notifications**: Password resets, confirmations
- **Transactional emails**: Order receipts, shipping notifications
- **One-off messages**: Personal emails, manual sends

[Detailed API reference →](/docs/api/post-v-1-account-account-submit)

---

## Outbox API (Queued Send)

The Outbox API queues emails for delivery with automatic retry logic and rate limiting.

### Add to Outbox

**Endpoint:** `POST /v1/account/:account/outbox`

**Request Parameters:**
Same as Submit API, plus:

| Field | Type | Description |
|-------|------|-------------|
| `sendAt` | string | ISO date to send at (schedule) |
| `deliveryAttempts` | number | Max delivery attempts (default 3) |

**Examples:**

**Queue Immediate Send:**

```javascript
const account = 'user@example.com';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/outbox`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ address: 'subscriber@example.com' }],
      subject: 'Newsletter January 2025',
      html: '<h1>This month in news...</h1>'
    })
  }
);

const result = await response.json();
console.log('Queued:', result.queueId);
```

**Schedule Email:**

```javascript
const sendAt = new Date('2025-01-20T09:00:00Z').toISOString();

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/outbox`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ address: 'client@example.com' }],
      subject: 'Meeting Reminder',
      text: 'Reminder: Meeting tomorrow at 10 AM.',
      sendAt: sendAt
    })
  }
);
```

**Response:**
```json
{
  "success": true,
  "queueId": "outbox_789ghi"
}
```

### List Outbox

**Endpoint:** `GET /v1/account/:account/outbox`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |

**Example:**

```javascript
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/outbox?limit=50`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const data = await response.json();
console.log(`Queued messages: ${data.total}`);
data.messages.forEach(msg => {
  console.log(`${msg.queueId}: ${msg.subject} - ${msg.status}`);
});
```

**Response:**
```json
{
  "total": 5,
  "page": 0,
  "pages": 1,
  "messages": [
    {
      "queueId": "outbox_789ghi",
      "account": "user@example.com",
      "subject": "Newsletter January 2025",
      "status": "queued",
      "created": "2025-01-15T10:00:00.000Z",
      "sendAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Outbox Message

**Endpoint:** `GET /v1/outbox/:queueId`

**Example:**

```javascript
const queueId = 'outbox_789ghi';

const response = await fetch(
  `http://localhost:3000/v1/outbox/${queueId}`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const message = await response.json();
console.log('Status:', message.status);
console.log('Attempts:', message.attempts);
```

**Response:**
```json
{
  "queueId": "outbox_789ghi",
  "account": "user@example.com",
  "to": [{ "address": "subscriber@example.com" }],
  "subject": "Newsletter January 2025",
  "status": "sending",
  "attempts": 1,
  "lastError": null,
  "created": "2025-01-15T10:00:00.000Z"
}
```

### Cancel Outbox Message

**Endpoint:** `DELETE /v1/outbox/:queueId`

**Example:**

```javascript
const queueId = 'outbox_789ghi';

const response = await fetch(
  `http://localhost:3000/v1/outbox/${queueId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const result = await response.json();
console.log('Message cancelled:', result.success);
```

**Note:** Can only cancel messages with status `queued`. Messages already `sending` or `sent` cannot be cancelled.

### Outbox Message States

| Status | Description |
|--------|-------------|
| `queued` | Waiting to be sent |
| `sending` | Currently being delivered |
| `sent` | Successfully sent |
| `failed` | Failed after max attempts |

### Use Cases

- **Bulk campaigns**: Newsletter sends
- **Scheduled emails**: Reminders, follow-ups
- **Rate-limited sending**: Avoid provider limits
- **Reliable delivery**: Automatic retry on failure
- **Background processing**: Queue and forget

[Detailed API reference →](/docs/api/get-v-1-outbox)

---

## Comparison Table

| Feature | Submit API | Outbox API |
|---------|-----------|------------|
| **Delivery** | Immediate | Queued |
| **Webhooks** | Real-time | On completion |
| **Retries** | Manual | Automatic (up to 3x) |
| **Scheduling** | No | Yes (`sendAt`) |
| **Rate Limiting** | None | Built-in |
| **Cancellation** | No | Yes (before sending) |
| **Best For** | Interactive sends | Bulk sends |
| **Latency** | Low (~seconds) | Variable (queue dependent) |
| **Reliability** | Depends on network | High (retry logic) |

## Message Format

### Recipients

**To, CC, BCC:**
```json
{
  "to": [
    { "name": "John Doe", "address": "john@example.com" },
    { "address": "jane@example.com" }
  ],
  "cc": [
    { "address": "manager@example.com" }
  ],
  "bcc": [
    { "address": "archive@example.com" }
  ]
}
```

### Custom Headers

```json
{
  "headers": {
    "X-Campaign-ID": "newsletter-2025-01",
    "X-Priority": "1"
  }
}
```

### Content (Text & HTML)

```json
{
  "subject": "Welcome!",
  "text": "Plain text version",
  "html": "<h1>HTML version</h1><p>With formatting</p>"
}
```

Best practice: Always provide both `text` and `html` for maximum compatibility.

### Attachments

**Base64 Encoded:**
```json
{
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "JVBERi0xLjQKJeLjz9MKMy...",
      "encoding": "base64",
      "contentType": "application/pdf"
    }
  ]
}
```

**URL Reference:**
```json
{
  "attachments": [
    {
      "filename": "image.jpg",
      "href": "https://example.com/images/photo.jpg",
      "contentType": "image/jpeg"
    }
  ]
}
```

**Inline Images:**
```json
{
  "html": "<img src=\"cid:logo\">",
  "attachments": [
    {
      "filename": "logo.png",
      "content": "iVBORw0KGgoAAAANSU...",
      "encoding": "base64",
      "contentType": "image/png",
      "cid": "logo"
    }
  ]
}
```

### References (Replies & Forwards)

**Reply to Message:**
```json
{
  "reference": {
    "message": "AAAABAABNc",
    "action": "reply"
  }
}
```

**Reply All:**
```json
{
  "reference": {
    "message": "AAAABAABNc",
    "action": "reply",
    "replyAll": true
  }
}
```

**Forward with Attachments:**
```json
{
  "reference": {
    "message": "AAAABAABNc",
    "action": "forward",
    "attachments": true
  }
}
```

## Common Patterns

### Simple Email

```javascript
await fetch(`http://localhost:3000/v1/account/${account}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: [{ address: 'user@example.com' }],
    subject: 'Hello',
    text: 'Hello, World!'
  })
});
```

### HTML Email with Attachments

```javascript
await fetch(`http://localhost:3000/v1/account/${account}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: [{ address: 'client@example.com', name: 'John Doe' }],
    subject: 'Your Invoice',
    html: '<h1>Invoice</h1><p>Attached is your invoice.</p>',
    text: 'Invoice\n\nAttached is your invoice.',
    attachments: [
      {
        filename: 'invoice.pdf',
        content: fs.readFileSync('invoice.pdf').toString('base64'),
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ]
  })
});
```

### Reply to Email

```javascript
// 1. Get original message to reply to
const originalMsg = await fetch(
  `http://localhost:3000/v1/account/${account}/message/${messageId}`,
  { headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' } }
).then(r => r.json());

// 2. Send reply
await fetch(`http://localhost:3000/v1/account/${account}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: [originalMsg.from],
    subject: `Re: ${originalMsg.subject}`,
    text: 'This is my reply.',
    reference: {
      message: messageId,
      action: 'reply'
    }
  })
});
```

### Forward Email

```javascript
await fetch(`http://localhost:3000/v1/account/${account}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: [{ address: 'colleague@example.com' }],
    subject: `Fwd: ${originalMsg.subject}`,
    text: '---------- Forwarded message ---------\n\n' + originalMsg.text.plain,
    reference: {
      message: messageId,
      action: 'forward',
      attachments: true
    }
  })
});
```

### Templated Emails

```javascript
function generateEmail(template, data) {
  return {
    to: [{ address: data.email, name: data.name }],
    subject: template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key]),
    html: template.html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key]),
    text: template.text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key])
  };
}

const template = {
  subject: 'Welcome, {{name}}!',
  html: '<h1>Welcome {{name}}</h1><p>Your account is ready.</p>',
  text: 'Welcome {{name}}!\n\nYour account is ready.'
};

const email = generateEmail(template, {
  name: 'John',
  email: 'john@example.com'
});

await fetch(`http://localhost:3000/v1/account/${account}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(email)
});
```

### Bulk Sending with Outbox

```javascript
async function sendBulkCampaign(account, recipients, content) {
  const queued = await Promise.all(
    recipients.map(recipient =>
      fetch(
        `http://localhost:3000/v1/account/${encodeURIComponent(account)}/outbox`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: [{ address: recipient.email, name: recipient.name }],
            subject: content.subject,
            html: content.html.replace('{{name}}', recipient.name)
          })
        }
      ).then(r => r.json())
    )
  );

  console.log(`Queued ${queued.length} emails`);
  return queued.map(q => q.queueId);
}

const recipients = [
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' }
  // ... thousands more
];

const queueIds = await sendBulkCampaign(account, recipients, {
  subject: 'Newsletter',
  html: '<h1>Hi {{name}}</h1>'
});
```

## See Also

- [Basic Sending](/docs/sending/basic-sending)
- [Outbox Queue](/docs/sending/outbox-queue)
- [Replies & Forwards](/docs/sending/replies-forwards)
- [Email Templates](/docs/sending/templates)
- [Threading](/docs/sending/threading)
- [Webhooks](/docs/receiving/webhooks)
