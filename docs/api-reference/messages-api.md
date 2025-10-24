---
title: Messages API
description: API endpoints for message operations - list, search, read, update, and delete emails
sidebar_position: 3
---

# Messages API

The Messages API provides comprehensive access to email messages across all connected accounts. You can list, read, search, update, move, and delete messages programmatically.

## Overview

The Messages API allows you to:

- **List messages** from any mailbox with filtering and pagination
- **Read message** content, headers, and metadata
- **Search messages** using advanced query syntax
- **Update message flags** (read/unread, flagged, etc.)
- **Move messages** between mailboxes
- **Delete messages** permanently or move to trash
- **Download attachments** and message source

### Message Object Structure

```json
{
  "id": "AAAABAABNc",
  "uid": 12345,
  "path": "INBOX",
  "emailId": "1234567890abcdef",
  "threadId": "thread_abc123",
  "date": "2025-01-15T10:30:00.000Z",
  "flags": ["\\Seen"],
  "unseen": false,
  "flagged": false,
  "draft": false,
  "size": 15234,
  "subject": "Meeting Tomorrow",
  "from": {
    "name": "John Doe",
    "address": "john@example.com"
  },
  "to": [
    {
      "name": "Jane Smith",
      "address": "jane@example.com"
    }
  ],
  "messageId": "<abc123@example.com>",
  "inReplyTo": "<xyz789@example.com>",
  "text": {
    "id": "text_id_123",
    "encodedSize": 1234
  },
  "html": ["html_id_456"],
  "attachments": [
    {
      "id": "attachment_789",
      "contentType": "application/pdf",
      "encodedSize": 52341,
      "filename": "document.pdf"
    }
  ]
}
```

### Message IDs Explained

EmailEngine uses several types of IDs:

- **`id`**: EmailEngine's internal message ID (used in API calls)
- **`uid`**: IMAP UID (server-specific, unique within mailbox)
- **`emailId`**: RFC 8474 Email ID (unique across mailboxes)
- **`threadId`**: RFC 8474 Thread ID (groups related messages)
- **`messageId`**: RFC 5322 Message-ID header

[Learn more about IDs →](/docs/advanced/ids-explained)

## Common Operations

### 1. List Messages

Retrieve messages from a mailbox with filtering and pagination.

**Endpoint:** `GET /v1/account/:account/messages`

**Path Parameters:**

| Parameter | Description |
|-----------|-------------|
| `account` | Account identifier |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Mailbox path (required) |
| `page` | number | Page number (0-indexed, default 0) |
| `pageSize` | number | Messages per page (default 20, max 1000) |
| `cursor` | string | Paging cursor from nextPageCursor or prevPageCursor |
| `unseen` | boolean | Filter by unseen status |
| `flagged` | boolean | Filter by flagged status |

**Examples:**

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com/messages?path=INBOX&pageSize=50&unseen=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Python:**
```python
from urllib.parse import quote

account = 'user@example.com'
response = requests.get(
    f'http://localhost:3000/v1/account/{quote(account)}/messages',
    params={'path': 'INBOX', 'pageSize': 50, 'unseen': True},
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)

data = response.json()
print(f"Total messages: {data['total']}")
for msg in data['messages']:
    print(f"{msg['from']['address']}: {msg['subject']}")
```

**Pseudo code:**
```
// List messages from a mailbox with filtering
account = "user@example.com"
url = "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/messages?path=INBOX&pageSize=50&unseen=true"

response = HTTP_GET(url, {
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
  }
})

data = PARSE_JSON(response.body)
PRINT("Total messages: " + data.total)

for each msg in data.messages {
  PRINT(msg.from.address + ": " + msg.subject)
}
```

**Response:**
```json
{
  "total": 128,
  "page": 0,
  "pages": 3,
  "messages": [
    {
      "id": "AAAABAABNc",
      "uid": 12345,
      "path": "INBOX",
      "subject": "Meeting Tomorrow",
      "from": {
        "name": "John Doe",
        "address": "john@example.com"
      },
      "date": "2025-01-15T10:30:00.000Z",
      "unseen": true,
      "size": 15234
    }
  ]
}
```

**Use Cases:**
- Display inbox messages in application UI
- Process unread messages for automation
- Export messages for archival

[Detailed API reference →](/docs/api/get-v-1-account-account-messages)

---

### 2. Get Message Details

Retrieve complete message information including body and attachments.

**Endpoint:** `GET /v1/account/:account/message/:message`

**Path Parameters:**

| Parameter | Description |
|-----------|-------------|
| `account` | Account identifier |
| `message` | Message ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `maxBytes` | number | Maximum bytes to retrieve for text/html |
| `textType` | string | Preferred text format ('html' or 'plain') |

**Examples:**

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Pseudo code:**
```
// Get complete message details
account = "user@example.com"
messageId = "AAAABAABNc"

response = HTTP_GET(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

message = PARSE_JSON(response.body)
PRINT("Subject: " + message.subject)
PRINT("From: " + message.from.address)
PRINT("Text: " + message.text.plain)
PRINT("Attachments: " + LENGTH(message.attachments))
```

**Response:**
```json
{
  "id": "AAAABAABNc",
  "uid": 12345,
  "path": "INBOX",
  "subject": "Meeting Tomorrow",
  "from": {
    "name": "John Doe",
    "address": "john@example.com"
  },
  "to": [
    {
      "name": "Jane Smith",
      "address": "jane@example.com"
    }
  ],
  "date": "2025-01-15T10:30:00.000Z",
  "text": {
    "plain": "Let's meet tomorrow at 10 AM.",
    "html": "<p>Let's meet tomorrow at 10 AM.</p>"
  },
  "headers": {
    "content-type": ["text/plain; charset=utf-8"],
    "date": ["Wed, 15 Jan 2025 10:30:00 +0000"]
  },
  "attachments": []
}
```

**Use Cases:**
- Display full message in email client
- Extract message content for processing
- Download attachments

[Detailed API reference →](/docs/api/get-v-1-account-account-message-message)

---

### 3. Get Message Source

Retrieve raw RFC822 message source.

**Endpoint:** `GET /v1/account/:account/message/:message/source`

**Examples:**

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc/source" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o message.eml
```

**Pseudo code:**
```
// Get raw RFC822 message source
account = "user@example.com"
messageId = "AAAABAABNc"

response = HTTP_GET(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId + "/source",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

source = response.body  // Raw text content
PRINT("Raw message source:")
PRINT(source)

// Can save to file or parse with email library
SAVE_TO_FILE("message.eml", source)
```

**Use Cases:**
- Export messages in EML format
- Parse with custom email parser
- Forensic analysis
- Message backup

[Detailed API reference →](/docs/api/get-v-1-account-account-message-message-source)

---

### 4. Update Message Flags

Change message flags like read/unread, flagged, etc.

**Endpoint:** `PUT /v1/account/:account/message/:message`

**Request Body:**
```json
{
  "flags": {
    "add": ["\\Seen", "\\Flagged"],
    "delete": ["\\Draft"]
  }
}
```

**Standard IMAP Flags:**

| Flag | Description |
|------|-------------|
| `\\Seen` | Message has been read |
| `\\Answered` | Message has been replied to |
| `\\Flagged` | Message is flagged/starred |
| `\\Deleted` | Message is marked for deletion |
| `\\Draft` | Message is a draft |

**Examples:**

**cURL:**
```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flags": {
      "add": ["\\Seen"]
    }
  }'
```

**Pseudo code:**
```
// Example 1: Mark message as read and flagged
account = "user@example.com"
messageId = "AAAABAABNc"

response = HTTP_PUT(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      flags: {
        add: ["\\Seen", "\\Flagged"]
      }
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Flags updated: " + result.success)

// Example 2: Mark message as unread (remove Seen flag)
response = HTTP_PUT(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      flags: {
        delete: ["\\Seen"]
      }
    }
  }
)
```

**Use Cases:**
- Mark messages as read/unread
- Star/flag important messages
- Track replied messages
- Implement custom workflow flags

[Detailed API reference →](/docs/api/put-v-1-account-account-message-message)

---

### 5. Move Message

Move a message to a different mailbox.

**Endpoint:** `PUT /v1/account/:account/message/:message/move`

**Request Body:**
```json
{
  "path": "Archive"
}
```

**Examples:**

**cURL:**
```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc/move" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path": "Archive"}'
```

**Pseudo code:**
```
// Move message to a different mailbox
account = "user@example.com"
messageId = "AAAABAABNc"

response = HTTP_PUT(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId + "/move",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      path: "Archive"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Message moved: " + result.success)
PRINT("New message ID: " + result.id)
```

**Response:**
```json
{
  "success": true,
  "id": "AAAABQABNd",
  "path": "Archive"
}
```

**Note:** Moving a message changes its ID since it's technically a new message in the destination mailbox.

**Use Cases:**
- Archive processed messages
- Move spam to Spam folder
- Organize messages into folders
- Implement auto-filing rules

[Detailed API reference →](/docs/api/put-v-1-account-account-message-message-move)

---

### 6. Delete Message

Delete a message permanently or move to trash.

**Endpoint:** `DELETE /v1/account/:account/message/:message`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `force` | boolean | If true, permanently delete; otherwise move to Trash |

**Examples:**

**cURL:**
```bash
# Soft delete (move to Trash)
curl -X DELETE "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Hard delete (permanent)
curl -X DELETE "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc?force=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Pseudo code:**
```
// Example 1: Soft delete (move to Trash)
account = "user@example.com"
messageId = "AAAABAABNc"

response = HTTP_DELETE(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId,
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)

result = PARSE_JSON(response.body)
PRINT("Message deleted: " + result.success)

// Example 2: Permanently delete (force)
response = HTTP_DELETE(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + messageId + "?force=true",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN"
    }
  }
)
```

**Use Cases:**
- Delete spam messages
- Clean up after processing
- User-initiated deletion

[Detailed API reference →](/docs/api/delete-v-1-account-account-message-message)

---

### 7. Search Messages

Search messages using advanced query syntax.

**Endpoint:** `POST /v1/account/:account/search`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Mailbox path (default: INBOX) |
| `page` | number | Page number (0-indexed, default 0) |
| `pageSize` | number | Messages per page (default 20, max 1000) |
| `cursor` | string | Paging cursor from nextPageCursor or prevPageCursor |

**Request Body:**
```json
{
  "search": {
    "from": "sender@example.com",
    "subject": "invoice",
    "since": "2025-01-01T00:00:00.000Z"
  }
}
```

**Search Criteria:**

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | From address contains |
| `to` | string | To address contains |
| `subject` | string | Subject contains |
| `body` | string | Body text contains |
| `since` | date | Messages after date |
| `before` | date | Messages before date |
| `unseen` | boolean | Unread messages only |
| `flagged` | boolean | Flagged messages only |
| `size` | object | Size range (`{min: 1000, max: 5000}`) |

**Examples:**

**cURL:**
```bash
curl -X POST "http://localhost:3000/v1/account/user@example.com/search?path=INBOX" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "subject": "invoice",
      "since": "2025-01-01T00:00:00.000Z"
    }
  }'
```

**Pseudo code:**
```
// Example 1: Search for urgent unread messages from boss
account = "user@example.com"

response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/search?path=INBOX&pageSize=20",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      search: {
        from: "boss@example.com",
        subject: "urgent",
        unseen: true
      }
    }
  }
)

results = PARSE_JSON(response.body)
PRINT("Found " + results.total + " messages")

// Example 2: Search for large attachments from specific sender
response = HTTP_POST(
  "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/search?path=INBOX",
  {
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json"
    },
    body: {
      search: {
        from: "client@example.com",
        size: { min: 1000000 }  // > 1 MB
      }
    }
  }
)

results = PARSE_JSON(response.body)
for each msg in results.messages {
  PRINT(msg.subject + " - " + msg.size + " bytes")
}
```

**Use Cases:**
- Find messages from specific sender
- Search for messages with attachments
- Filter by date range
- Full-text search across messages

[Detailed API reference →](/docs/api/post-v-1-account-account-search)

---

## Message Object Reference

### Complete Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | EmailEngine message ID |
| `uid` | number | IMAP UID |
| `path` | string | Mailbox path |
| `emailId` | string | RFC 8474 Email ID |
| `threadId` | string | RFC 8474 Thread ID |
| `date` | string | ISO date string |
| `flags` | array | IMAP flags |
| `unseen` | boolean | True if unread |
| `flagged` | boolean | True if flagged |
| `answered` | boolean | True if replied |
| `draft` | boolean | True if draft |
| `size` | number | Message size in bytes |
| `subject` | string | Subject line |
| `from` | object | Sender address |
| `to` | array | Recipient addresses |
| `cc` | array | CC addresses |
| `bcc` | array | BCC addresses |
| `replyTo` | array | Reply-To addresses |
| `messageId` | string | RFC 5322 Message-ID |
| `inReplyTo` | string | Message-ID being replied to |
| `references` | array | Thread reference IDs |
| `text` | object | Plain text content |
| `html` | array | HTML content parts |
| `attachments` | array | Attachment metadata |

### Nested Structures

**Address Object:**
```json
{
  "name": "John Doe",
  "address": "john@example.com"
}
```

**Text Object:**
```json
{
  "id": "text_id_123",
  "encodedSize": 1234,
  "plain": "Message text content",
  "html": "<p>Message HTML content</p>"
}
```

**Attachment Object:**
```json
{
  "id": "attachment_789",
  "contentType": "application/pdf",
  "disposition": "attachment",
  "filename": "document.pdf",
  "encodedSize": 52341,
  "embedded": false,
  "inline": false
}
```

## Filtering & Search

### Query Parameters

**List Messages Filters:**

```
// Unread messages in INBOX
url = "/v1/account/" + account + "/messages?path=INBOX&unseen=true"

// Flagged messages
url = "/v1/account/" + account + "/messages?flagged=true"

// Specific mailbox
url = "/v1/account/" + account + "/messages?path=Archive"

// Pagination
url = "/v1/account/" + account + "/messages?path=INBOX&page=2&pageSize=100"
```

### Search Syntax

**Advanced Search Examples:**

```
// Messages from domain
searchCriteria = {
  search: {
    from: "@example.com"
  }
}

// Date range
searchCriteria = {
  search: {
    since: "2025-01-01T00:00:00.000Z",
    before: "2025-02-01T00:00:00.000Z"
  }
}

// Multiple criteria
searchCriteria = {
  search: {
    from: "client@example.com",
    subject: "invoice",
    unseen: true,
    size: { min: 100000 }
  }
}

// Body text search
searchCriteria = {
  search: {
    body: "urgent payment"
  }
}
```

## Common Patterns

### Pagination

Fetch all messages across pages:

```
// Pseudo code: Fetch all messages with pagination
function fetchAllMessages(account, path = "INBOX") {
  page = 0
  allMessages = []
  hasMore = true

  while (hasMore) {
    // Build URL with pagination
    url = "http://localhost:3000/v1/account/" + URL_ENCODE(account) +
          "/messages?path=" + path + "&page=" + page + "&pageSize=100"

    // Make request
    response = HTTP_GET(url, {
      headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
    })

    // Parse response
    data = PARSE_JSON(response.body)
    allMessages = allMessages + data.messages

    // Check if more pages exist
    hasMore = (page < data.pages - 1)
    page = page + 1
  }

  return allMessages
}
```

### Real-time Sync with Webhooks

Instead of polling, use webhooks:

```
// Step 1: Setup webhook for new messages
HTTP_POST("http://localhost:3000/v1/settings", {
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
  },
  body: {
    webhooks: "https://your-app.com/webhook",
    webhookEvents: ["messageNew", "messageDeleted"]
  }
})

// Step 2: Handle webhook in your application
// This is a webhook endpoint handler (pseudo code for web server)
function handleWebhook(request, response) {
  event = PARSE_JSON(request.body)

  if (event.event == "messageNew") {
    PRINT("New message: " + event.data.subject)
    // Process new message
    processNewMessage(event.data)
  }

  if (event.event == "messageDeleted") {
    PRINT("Message deleted: " + event.data.id)
    // Handle deletion
  }

  // Respond with success
  response.send({ success: true })
}
```

### Bulk Operations

Update multiple messages:

```
// Pseudo code: Mark all unread messages as read
function markAllAsRead(account, path = "INBOX") {
  // Step 1: Get all unread messages
  url = "http://localhost:3000/v1/account/" + URL_ENCODE(account) +
        "/messages?path=" + path + "&unseen=true"

  response = HTTP_GET(url, {
    headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
  })

  messages = PARSE_JSON(response.body).messages

  // Step 2: Update each message
  for each msg in messages {
    HTTP_PUT(
      "http://localhost:3000/v1/account/" + URL_ENCODE(account) + "/message/" + msg.id,
      {
        headers: {
          "Authorization": "Bearer YOUR_ACCESS_TOKEN",
          "Content-Type": "application/json"
        },
        body: {
          flags: { add: ["\\Seen"] }
        }
      }
    )
  }

  PRINT("Marked " + LENGTH(messages) + " messages as read")
}
```

### Attachment Handling

Download all attachments from a message:

```
// Pseudo code: Download all attachments from a message
function downloadAttachments(account, messageId) {
  // Step 1: Get message details
  msgUrl = "http://localhost:3000/v1/account/" + URL_ENCODE(account) +
           "/message/" + messageId

  msgResponse = HTTP_GET(msgUrl, {
    headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
  })

  message = PARSE_JSON(msgResponse.body)

  // Step 2: Download each attachment
  for each attachment in message.attachments {
    attUrl = "http://localhost:3000/v1/account/" + URL_ENCODE(account) +
             "/attachment/" + attachment.id

    attResponse = HTTP_GET(attUrl, {
      headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
    })

    // Save to file or process
    fileData = attResponse.body
    SAVE_TO_FILE(attachment.filename, fileData)

    PRINT("Downloaded: " + attachment.filename)
  }
}
```
