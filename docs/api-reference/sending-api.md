---
title: Sending API
description: API endpoints for sending emails with attachments, templates, and delivery tracking
sidebar_position: 4
---

# Sending API

The Sending API provides endpoints for sending emails through EmailEngine with support for immediate and scheduled delivery, automatic retries, and queue management.

## Overview

EmailEngine sends emails through the **Submit API** endpoint, which handles both immediate and scheduled delivery with automatic retry logic.

### Key Features

| Feature | Description |
|---------|-------------|
| Immediate delivery | Emails sent right away |
| Scheduled sends | Use `sendAt` parameter for future delivery |
| Automatic retries | Built-in retry logic (configurable attempts) |
| Real-time webhooks | Delivery status notifications |
| Queue management | View, monitor, and cancel queued emails |

## Submit API

The Submit API sends emails and provides real-time delivery status via webhooks. Emails can be sent immediately or scheduled for later using the `sendAt` parameter.

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

**Pseudo code:**
```
// Send a simple email
account = "user@example.com"

response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [
        {
          name: "Jane Smith",
          address: "jane@example.com"
        }
      ],
      subject: "Hello from EmailEngine",
      text: "This is a test email sent via the API.",
      html: "<p>This is a test email sent via the API.</p>"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Message sent: " + result.messageId)
PRINT("Queue ID: " + result.queueId)
```

**Response:**
```json
{
  "response": "Queued for delivery",
  "messageId": "<abc123@example.com>",
  "sendAt": "2025-01-15T10:30:00.000Z",
  "queueId": "queue_456def"
}
```

**HTML Email with Attachments:**

**Pseudo code:**
```
// Send HTML email with PDF attachment
account = "user@example.com"

response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "client@example.com" }],
      subject: "Invoice #12345",
      html: "<h1>Invoice</h1><p>Please find your invoice attached.</p>",
      attachments: [
        {
          filename: "invoice.pdf",
          content: "base64_encoded_content_here",
          encoding: "base64",
          contentType: "application/pdf"
        }
      ]
    }
  }
)
```

**Reply to Email:**

**Pseudo code:**
```
// Reply to an existing message
account = "user@example.com"

response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "original-sender@example.com" }],
      subject: "Re: Original Subject",
      text: "This is my reply.",
      reference: {
        message: "AAAABAABNc",  // ID of message being replied to
        action: "reply"
      }
    }
  }
)
```

**Forward Email:**

**Pseudo code:**
```
// Forward an existing message
account = "user@example.com"

response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "colleague@example.com" }],
      subject: "Fwd: Original Subject",
      text: "See forwarded message below.",
      reference: {
        message: "AAAABAABNc",
        action: "forward",
        forwardAttachments: true  // Include original attachments
      }
    }
  }
)
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

## Scheduling Emails

To schedule emails for future delivery, use the Submit API with the `sendAt` parameter.

### Schedule Email Example

**Pseudo code:**
```
// Schedule email for future delivery using Submit API
account = "user@example.com"
sendAt = "2025-01-20T09:00:00Z"  // ISO 8601 timestamp

response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "client@example.com" }],
      subject: "Meeting Reminder",
      text: "Reminder: Meeting tomorrow at 10 AM.",
      sendAt: sendAt
    }
  }
)
```

**Response:**
```json
{
  "response": "Queued for delivery",
  "messageId": "<abc123@example.com>",
  "sendAt": "2025-01-20T09:00:00.000Z",
  "queueId": "queue_789ghi"
}
```

---

## Outbox Management

The outbox contains queued messages waiting to be sent. Use these endpoints to view and manage queued messages.

### List Outbox

**Endpoint:** `GET /v1/outbox`

[Detailed API reference →](/docs/api/get-v-1-outbox)

Lists all queued messages across all accounts.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (0-indexed) |
| `pageSize` | number | Items per page (default 20) |

**Example:**

**Pseudo code:**
```
// List all queued messages
response = HTTP_GET(
  "http://localhost:3000/v1/outbox?pageSize=50",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

data = PARSE_JSON(response.body)
PRINT("Queued messages: " + data.total)

for each msg in data.messages {
  PRINT(msg.queueId + ": " + msg.subject + " - " + msg.scheduled)
}
```

### Get Outbox Message

**Endpoint:** `GET /v1/outbox/:queueId`

[Detailed API reference →](/docs/api/get-v-1-outbox-queueid)

**Example:**

**Pseudo code:**
```
// Get details of specific outbox message
queueId = "outbox_789ghi"

response = HTTP_GET(
  "http://localhost:3000/v1/outbox/" + queueId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

message = PARSE_JSON(response.body)
PRINT("Status: " + message.progress.status)
PRINT("Attempts made: " + message.attemptsMade)
```

**Response:**
```json
{
  "queueId": "outbox_789ghi",
  "account": "user@example.com",
  "subject": "Newsletter January 2025",
  "created": "2025-01-15T10:00:00.000Z",
  "scheduled": "2025-01-15T10:00:00.000Z",
  "attemptsMade": 0,
  "attempts": 10,
  "progress": {
    "status": "queued"
  }
}
```

### Cancel Outbox Message

**Endpoint:** `DELETE /v1/outbox/:queueId`

[Detailed API reference →](/docs/api/delete-v-1-outbox-queueid)

**Example:**

**Pseudo code:**
```
// Cancel queued outbox message
queueId = "outbox_789ghi"

response = HTTP_DELETE(
  "http://localhost:3000/v1/outbox/" + queueId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Message cancelled: " + result.deleted)
```

**Note:** Can only cancel messages with status `queued`. Messages already `processing` or `submitted` cannot be cancelled.

### Outbox Message States

| Status | Description |
|--------|-------------|
| `queued` | Waiting to be sent |
| `processing` | Currently being delivered |
| `submitted` | Successfully sent |
| `error` | Failed after max attempts |

[Detailed API reference →](/docs/api/get-v-1-outbox)

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
    "action": "reply-all"
  }
}
```

**Forward with Attachments:**
```json
{
  "reference": {
    "message": "AAAABAABNc",
    "action": "forward",
    "forwardAttachments": true
  }
}
```

## Common Patterns

### Simple Email

**Pseudo code:**
```
// Send simple text email
account = "user@example.com"

HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "user@example.com" }],
      subject: "Hello",
      text: "Hello, World!"
    }
  }
)
```

### HTML Email with Attachments

**Pseudo code:**
```
// Send HTML email with PDF attachment
account = "user@example.com"

// Read file and encode as base64
pdfContent = READ_FILE_AS_BASE64("invoice.pdf")

HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "client@example.com", name: "John Doe" }],
      subject: "Your Invoice",
      html: "<h1>Invoice</h1><p>Attached is your invoice.</p>",
      text: "Invoice\n\nAttached is your invoice.",
      attachments: [
        {
          filename: "invoice.pdf",
          content: pdfContent,
          encoding: "base64",
          contentType: "application/pdf"
        }
      ]
    }
  }
)
```

### Reply to Email

**Pseudo code:**
```
// 1. Get original message to reply to
account = "user@example.com"
messageId = "AAAABAABNc"

response = HTTP_GET(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId,
  {
    headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
  }
)

originalMsg = PARSE_JSON(response.body)

// 2. Send reply
HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [originalMsg.from],
      subject: "Re: " + originalMsg.subject,
      text: "This is my reply.",
      reference: {
        message: messageId,
        action: "reply"
      }
    }
  }
)
```

### Forward Email

**Pseudo code:**
```
// Forward email with attachments
account = "user@example.com"
messageId = "AAAABAABNc"
originalMsg = /* retrieved earlier */

HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      to: [{ address: "colleague@example.com" }],
      subject: "Fwd: " + originalMsg.subject,
      text: "---------- Forwarded message ---------\n\n" + originalMsg.text.plain,
      reference: {
        message: messageId,
        action: "forward",
        forwardAttachments: true
      }
    }
  }
)
```

### Templated Emails

**Pseudo code:**
```
// Simple template replacement function
function generateEmail(template, data) {
  return {
    to: [{ address: data.email, name: data.name }],
    subject: REPLACE_TEMPLATE_VARS(template.subject, data),
    html: REPLACE_TEMPLATE_VARS(template.html, data),
    text: REPLACE_TEMPLATE_VARS(template.text, data)
  }
}

// Define template with {{variable}} placeholders
template = {
  subject: "Welcome, {{name}}!",
  html: "<h1>Welcome {{name}}</h1><p>Your account is ready.</p>",
  text: "Welcome {{name}}!\n\nYour account is ready."
}

// Generate email from template
email = generateEmail(template, {
  name: "John",
  email: "john@example.com"
})

// Send templated email
account = "user@example.com"

HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: email
  }
)
```

### Bulk Sending

**Pseudo code:**
```
// Send bulk campaign by submitting individual emails
function sendBulkCampaign(account, recipients, content) {
  queued = []

  // Submit email for each recipient
  for each recipient in recipients {
    response = HTTP_POST(
      "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/submit",
      {
        headers: {
          "Authorization": "Bearer YOUR_ACCESS_TOKEN",
          "Content-Type": "application/json"
        },
        body: {
          to: [{ address: recipient.email, name: recipient.name }],
          subject: content.subject,
          html: REPLACE(content.html, "{{name}}", recipient.name)
        }
      }
    )

    result = PARSE_JSON(response.body)
    queued.append(result.queueId)
  }

  PRINT("Sent/queued " + LENGTH(queued) + " emails")
  return queued
}

// Example usage
account = "user@example.com"

recipients = [
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" }
  // ... more recipients
]

queueIds = sendBulkCampaign(account, recipients, {
  subject: "Newsletter",
  html: "<h1>Hi {{name}}</h1>"
})
```

:::tip Mail Merge
For true bulk sending with personalization, consider using [Mail Merge](/docs/sending/mail-merge) which sends to multiple recipients in a single API call.
:::
