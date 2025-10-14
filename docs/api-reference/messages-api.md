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
| `path` | string | Mailbox path (default: INBOX) |
| `page` | number | Page number (0-indexed) |
| `limit` | number | Messages per page (default 20, max 250) |
| `unseen` | boolean | Filter by unseen status |
| `flagged` | boolean | Filter by flagged status |

**Examples:**

**Node.js:**
```javascript
const account = 'user@example.com';
const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/messages?path=INBOX&limit=50&unseen=true`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const data = await response.json();
console.log(`Total messages: ${data.total}`);
data.messages.forEach(msg => {
  console.log(`${msg.from.address}: ${msg.subject}`);
});
```

**Python:**
```python
from urllib.parse import quote

account = 'user@example.com'
response = requests.get(
    f'http://localhost:3000/v1/account/{quote(account)}/messages',
    params={'path': 'INBOX', 'limit': 50, 'unseen': True},
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)

data = response.json()
print(f"Total messages: {data['total']}")
for msg in data['messages']:
    print(f"{msg['from']['address']}: {msg['subject']}")
```

**PHP:**
```php
<?php
$account = urlencode('user@example.com');
$url = "http://localhost:3000/v1/account/$account/messages?path=INBOX&limit=50";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_ACCESS_TOKEN'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response, true);

echo "Total messages: " . $data['total'] . "\n";
foreach ($data['messages'] as $msg) {
    echo $msg['from']['address'] . ": " . $msg['subject'] . "\n";
}
```

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com/messages?path=INBOX&limit=50&unseen=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

**Node.js:**
```javascript
const account = 'user@example.com';
const messageId = 'AAAABAABNc';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${messageId}`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const message = await response.json();
console.log('Subject:', message.subject);
console.log('From:', message.from.address);
console.log('Text:', message.text.plain);
console.log('Attachments:', message.attachments.length);
```

**Python:**
```python
from urllib.parse import quote

account = 'user@example.com'
message_id = 'AAAABAABNc'

response = requests.get(
    f'http://localhost:3000/v1/account/{quote(account)}/message/{message_id}',
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)

message = response.json()
print(f"Subject: {message['subject']}")
print(f"From: {message['from']['address']}")
print(f"Text: {message['text']['plain']}")
```

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

**Node.js:**
```javascript
const account = 'user@example.com';
const messageId = 'AAAABAABNc';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${messageId}/source`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const source = await response.text();
console.log('Raw message source:', source);
// Save to file, parse with email library, etc.
```

**cURL:**
```bash
curl "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc/source" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o message.eml
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

**Node.js:**
```javascript
// Mark message as read and flagged
const account = 'user@example.com';
const messageId = 'AAAABAABNc';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${messageId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      flags: {
        add: ['\\Seen', '\\Flagged']
      }
    })
  }
);

const result = await response.json();
console.log('Flags updated:', result.success);
```

**Python:**
```python
# Mark message as unread
response = requests.put(
    f'http://localhost:3000/v1/account/{quote(account)}/message/{message_id}',
    headers={
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'flags': {
            'delete': ['\\Seen']
        }
    }
)
```

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

**Node.js:**
```javascript
// Move message to Archive folder
const account = 'user@example.com';
const messageId = 'AAAABAABNc';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${messageId}/move`,
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: 'Archive'
    })
  }
);

const result = await response.json();
console.log('Message moved:', result.success);
console.log('New message ID:', result.id);
```

**Python:**
```python
# Move to Spam folder
response = requests.put(
    f'http://localhost:3000/v1/account/{quote(account)}/message/{message_id}/move',
    headers={
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    json={'path': 'Spam'}
)
```

**cURL:**
```bash
curl -X PUT "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc/move" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path": "Archive"}'
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

**Node.js:**
```javascript
// Move to Trash (soft delete)
const account = 'user@example.com';
const messageId = 'AAAABAABNc';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${messageId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  }
);

const result = await response.json();
console.log('Message deleted:', result.success);
```

**Python:**
```python
# Permanently delete (force)
response = requests.delete(
    f'http://localhost:3000/v1/account/{quote(account)}/message/{message_id}',
    params={'force': True},
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)
```

**cURL:**
```bash
# Soft delete (move to Trash)
curl -X DELETE "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Hard delete (permanent)
curl -X DELETE "http://localhost:3000/v1/account/user@example.com/message/AAAABAABNc?force=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

**Request Body:**
```json
{
  "path": "INBOX",
  "search": {
    "from": "sender@example.com",
    "subject": "invoice",
    "since": "2025-01-01T00:00:00.000Z"
  },
  "page": 0,
  "limit": 50
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

**Node.js:**
```javascript
const account = 'user@example.com';

const response = await fetch(
  `http://localhost:3000/v1/account/${encodeURIComponent(account)}/search`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      search: {
        from: 'boss@example.com',
        subject: 'urgent',
        unseen: true
      },
      limit: 20
    })
  }
);

const results = await response.json();
console.log(`Found ${results.total} messages`);
```

**Python:**
```python
# Search for large attachments from specific sender
response = requests.post(
    f'http://localhost:3000/v1/account/{quote(account)}/search',
    headers={
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'search': {
            'from': 'client@example.com',
            'size': {'min': 1000000}  # > 1 MB
        }
    }
)

results = response.json()
for msg in results['messages']:
    print(f"{msg['subject']} - {msg['size']} bytes")
```

**cURL:**
```bash
curl -X POST "http://localhost:3000/v1/account/user@example.com/search" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "subject": "invoice",
      "since": "2025-01-01T00:00:00.000Z"
    }
  }'
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

```javascript
// Unread messages in INBOX
const url = `/v1/account/${account}/messages?path=INBOX&unseen=true`;

// Flagged messages
const url = `/v1/account/${account}/messages?flagged=true`;

// Specific mailbox
const url = `/v1/account/${account}/messages?path=Archive`;

// Pagination
const url = `/v1/account/${account}/messages?page=2&limit=100`;
```

### Search Syntax

**Advanced Search Examples:**

```javascript
// Messages from domain
{
  search: {
    from: '@example.com'
  }
}

// Date range
{
  search: {
    since: '2025-01-01T00:00:00.000Z',
    before: '2025-02-01T00:00:00.000Z'
  }
}

// Multiple criteria
{
  search: {
    from: 'client@example.com',
    subject: 'invoice',
    unseen: true,
    size: { min: 100000 }
  }
}

// Body text search
{
  search: {
    body: 'urgent payment'
  }
}
```

## Common Patterns

### Pagination

Fetch all messages across pages:

```javascript
async function fetchAllMessages(account, path = 'INBOX') {
  let page = 0;
  let allMessages = [];
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `http://localhost:3000/v1/account/${encodeURIComponent(account)}/messages?path=${path}&page=${page}&limit=100`,
      {
        headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
      }
    );

    const data = await response.json();
    allMessages.push(...data.messages);

    hasMore = page < data.pages - 1;
    page++;
  }

  return allMessages;
}
```

### Real-time Sync with Webhooks

Instead of polling, use webhooks:

```javascript
// Setup webhook for new messages
await fetch('http://localhost:3000/v1/settings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    webhooks: 'https://your-app.com/webhook',
    webhookEvents: ['messageNew', 'messageDeleted']
  })
});

// Handle webhook (Express.js example)
app.post('/webhook', express.json(), (req, res) => {
  const event = req.body;

  if (event.event === 'messageNew') {
    console.log('New message:', event.data.subject);
    // Process new message
  }

  res.json({ success: true });
});
```

### Bulk Operations

Update multiple messages:

```javascript
async function markAllAsRead(account, path = 'INBOX') {
  const response = await fetch(
    `http://localhost:3000/v1/account/${encodeURIComponent(account)}/messages?path=${path}&unseen=true`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const { messages } = await response.json();

  await Promise.all(
    messages.map(msg =>
      fetch(
        `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${msg.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            flags: { add: ['\\Seen'] }
          })
        }
      )
    )
  );

  console.log(`Marked ${messages.length} messages as read`);
}
```

### Attachment Handling

Download all attachments from a message:

```javascript
async function downloadAttachments(account, messageId) {
  // Get message details
  const msgResponse = await fetch(
    `http://localhost:3000/v1/account/${encodeURIComponent(account)}/message/${messageId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const message = await msgResponse.json();

  // Download each attachment
  for (const attachment of message.attachments) {
    const attResponse = await fetch(
      `http://localhost:3000/v1/account/${encodeURIComponent(account)}/attachment/${attachment.id}`,
      {
        headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
      }
    );

    const blob = await attResponse.blob();
    // Save blob to file, upload to S3, etc.
    console.log(`Downloaded ${attachment.filename}`);
  }
}
```

## See Also

- [Receiving Messages](/docs/receiving)
- [Webhooks](/docs/receiving/webhooks)
- [Attachments](/docs/receiving/attachments)
- [Searching Messages](/docs/receiving/searching)
- [Message Operations](/docs/receiving/message-operations)
- [IDs Explained](/docs/advanced/ids-explained)
