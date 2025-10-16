---
title: Webhook Events Reference
description: Complete reference of all webhook events, payload schemas, and field specifications
sidebar_position: 1
---

# Webhook Events Reference

Complete reference for all webhook event types in EmailEngine. Each event includes detailed payload structure, field types, conditional fields, and provider-specific features.

<!-- Sources: sources/website-md/webhooks.md, docs/reference/webhook-events.md -->

## Event Structure

All webhook events follow this common structure:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "eventName",
  "account": "account-id",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    /* event-specific payload */
  }
}
```

**Note:** The `eventId` is **NOT** included in the JSON payload. It's sent as the HTTP header `X-EE-Wh-Event-Id`.

### Universal Fields

These fields appear in every webhook event JSON payload:

| Field | Type | Description |
|-------|------|-------------|
| `serviceUrl` | string | Base URL of the EmailEngine instance that generated the event |
| `event` | string | Event type identifier (e.g., "messageNew", "messageSent") |
| `account` | string | Account identifier that triggered the event |
| `date` | string | ISO 8601 timestamp when event occurred |
| `data` | object | Event-specific payload data |

### Optional Universal Fields

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Mailbox path where the event occurred (message and mailbox events) |
| `specialUse` | string | Special-use flag of the folder (e.g., "\All", "\Inbox", "\Sent") |
| `_route` | object | Present when event is delivered through a Webhook Router, contains `_route.id` |

## Webhook Headers

EmailEngine includes diagnostic headers in every webhook HTTP request:

| Header | Type | Example | Description |
|--------|------|---------|-------------|
| `X-EE-Wh-Event-Id` | string | `af8435d9-ceee-4715-be71-08ac9d2dc04a` | **Unique event identifier (UUID).** Use for idempotency - all retries share the same ID. **This is the ONLY place eventId is available** - it's NOT in the JSON payload. |
| `X-EE-Wh-Id` | string | `907889` | Internal BullMQ job ID of the queued webhook entry |
| `X-EE-Wh-Attempts-Made` | string | `1` | Delivery attempt counter (starts at 1, increases with retries) |
| `X-EE-Wh-Queued-Time` | string | `5s` | Time the event spent in queue before delivery |
| `X-EE-Wh-Custom-Route` | string | `AAABiL8tBKsAAAAG` | Identifier of the custom webhook route (only present for webhook routes) |
| `X-EE-Wh-Signature` | string | `dGhpcyBpcyBh...` | HMAC-SHA256 signature (base64url) of the JSON body using EENGINE_SECRET |
| `Content-Type` | string | `application/json` | Always `application/json` |
| `User-Agent` | string | `emailengine/2.x.x (+https://emailengine.app)` | EmailEngine version and homepage |

### Webhook Signature Verification

The `X-EE-Wh-Signature` header contains an HMAC-SHA256 signature of the request body:

```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-ee-wh-signature'];
  const body = JSON.stringify(req.body);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expected = hmac.digest('base64url');

  return signature === expected;
}

// Usage
if (!verifyWebhook(req, process.env.EENGINE_SECRET)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

You can also configure custom headers via `webhooksCustomHeaders` in Settings or **Configuration → Webhooks**.

## Account Events

Events related to account connection and status changes.

### accountAdded

Triggered when a new account is registered in EmailEngine.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "accountAdded",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

**Fields:**
- `data.account` (string) - Account identifier
- `data.name` (string) - Display name for the account
- `data.email` (string) - Primary email address

**Use Cases:**
- Send welcome notification
- Initialize account-specific resources
- Log account creation
- Start onboarding flow

---

### accountDeleted

Triggered when an account is removed from EmailEngine.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "accountDeleted",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com"
  }
}
```

**Fields:**
- `data.account` (string) - Deleted account identifier

**Use Cases:**
- Clean up account-related resources
- Remove from billing system
- Archive account data
- Send farewell notification

---

### accountInitialized

Triggered when an account successfully connects for the first time and completes initial mailbox synchronization.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "accountInitialized",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com",
    "state": "connected",
    "syncTime": 1640995200000
  }
}
```

**Fields:**
- `data.account` (string) - Account identifier
- `data.state` (string) - Connection state (usually "connected")
- `data.syncTime` (number) - Unix timestamp (milliseconds) of first successful sync

**Use Cases:**
- Notify user that account is ready
- Start background processing
- Enable account features
- Trigger initial data import

---

### accountError

Triggered when an account encounters an error (authentication failure, connection issues, etc.).

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "accountError",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com",
    "error": {
      "message": "Authentication failed",
      "code": "EAUTH",
      "serverResponseCode": "NO"
    },
    "lastError": {
      "response": "Invalid credentials",
      "serverResponseCode": "NO"
    }
  }
}
```

**Fields:**
- `data.account` (string) - Account identifier
- `data.error` (object) - Error object with details
  - `data.error.message` (string) - Human-readable error description
  - `data.error.code` (string) - Error code (e.g., "EAUTH", "ECONNECTION")
  - `data.error.serverResponseCode` (string, optional) - Server response code
- `data.lastError` (object, optional) - Additional error context
  - `data.lastError.response` (string) - Raw server response
  - `data.lastError.serverResponseCode` (string) - Server response code

**Use Cases:**
- Alert user to fix credentials
- Pause account operations
- Log errors for debugging
- Trigger credential refresh flow

---

### authenticationError

Triggered when account authentication fails.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "authenticationError",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com",
    "error": {
      "message": "Invalid credentials",
      "code": "EAUTH",
      "serverResponseCode": "NO"
    }
  }
}
```

**Fields:**
- `data.account` (string) - Account identifier
- `data.error` (object) - Authentication error details
  - `data.error.message` (string) - Error description
  - `data.error.code` (string) - Error code
  - `data.error.serverResponseCode` (string, optional) - Server response

**Use Cases:**
- Prompt user to re-authenticate
- Revoke access tokens
- Send security alerts
- Log authentication failures

---

### authenticationSuccess

Triggered when account authenticates successfully.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "authenticationSuccess",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com"
  }
}
```

**Fields:**
- `data.account` (string) - Account identifier

**Use Cases:**
- Clear authentication error flags
- Resume account operations
- Log successful authentications
- Update account status

---

### connectError

Triggered when connection to the email server fails.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "connectError",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com",
    "error": {
      "message": "Connection timeout",
      "code": "ECONNECTION"
    }
  }
}
```

**Fields:**
- `data.account` (string) - Account identifier
- `data.error` (object) - Connection error details
  - `data.error.message` (string) - Error description
  - `data.error.code` (string) - Error code

**Use Cases:**
- Monitor server availability
- Trigger network diagnostics
- Alert administrators
- Log connectivity issues

---

## Message Events

Events related to message operations and changes.

### messageNew

Triggered when a new message arrives in any mailbox. Also triggered when messages are moved, copied, or uploaded to folders.

**Note:** IMAP does not distinguish between incoming messages and messages inserted by other means.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageNew",
  "account": "user@example.com",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "abc123",
    "threadId": "thread_xyz",
    "date": "2025-01-15T10:25:00.000Z",
    "flags": ["\\Seen"],
    "labels": ["\\Important", "\\Inbox"],
    "category": "primary",
    "unseen": false,
    "flagged": false,
    "answered": false,
    "draft": false,
    "size": 8271,
    "subject": "Important Message",
    "from": {
      "name": "John Doe",
      "address": "john@example.com"
    },
    "sender": {
      "name": "John Doe",
      "address": "john@example.com"
    },
    "replyTo": [
      {
        "name": "John Doe",
        "address": "john@example.com"
      }
    ],
    "to": [
      {
        "name": "Jane Smith",
        "address": "jane@example.com"
      }
    ],
    "cc": [
      {
        "name": "Bob Johnson",
        "address": "bob@example.com"
      }
    ],
    "bcc": [
      {
        "name": "Alice Williams",
        "address": "alice@example.com"
      }
    ],
    "messageId": "<abc123@example.com>",
    "inReplyTo": "<previous@example.com>",
    "headers": {
      "list-id": "<mailinglist.example.com>",
      "x-custom-header": ["value1", "value2"]
    },
    "text": {
      "id": "text_123",
      "encodedSize": {
        "plain": 1535,
        "html": 1630
      },
      "plain": "Message content...",
      "html": "<p>Message content...</p>",
      "webSafe": "<p>Sanitized HTML...</p>",
      "hasMore": false
    },
    "attachments": [
      {
        "id": "att_456",
        "contentType": "application/pdf",
        "disposition": "attachment",
        "filename": "document.pdf",
        "size": 52341,
        "embedded": false,
        "inline": false,
        "contentId": "<part1.abc@example.com>"
      }
    ],
    "messageSpecialUse": "\\Inbox",
    "seemsLikeNew": true,
    "isAutoReply": false,
    "isBounce": false,
    "isComplaint": false
  }
}
```

**Core Fields:**
- `data.id` (string) - EmailEngine message ID (use for API operations)
- `data.uid` (number) - IMAP UID
- `data.path` (string) - Mailbox path
- `data.emailId` (string, optional) - RFC 8474 Email ID (Gmail, modern IMAP servers)
- `data.threadId` (string, optional) - Thread/conversation ID (Gmail, modern IMAP servers)
- `data.date` (string) - Message Date header (ISO 8601)
- `data.flags` (array of strings) - IMAP flags (e.g., "\Seen", "\Flagged", "\Answered", "\Draft")
- `data.unseen` (boolean) - Message is unread (no \Seen flag)
- `data.flagged` (boolean) - Message is flagged
- `data.answered` (boolean) - Message has been replied to
- `data.draft` (boolean) - Message is a draft
- `data.size` (number) - Full RFC 822 message size in bytes
- `data.subject` (string) - Email subject line
- `data.messageId` (string) - RFC 5322 Message-ID header
- `data.inReplyTo` (string, optional) - Message-ID of the message being replied to

**Address Fields:**

Each address object contains:
- `name` (string) - Display name
- `address` (string) - Email address

Fields:
- `data.from` (object) - Sender address
- `data.sender` (object, optional) - Actual sender (when different from From)
- `data.replyTo` (array of objects, optional) - Reply-To addresses
- `data.to` (array of objects) - Recipients
- `data.cc` (array of objects, optional) - CC recipients
- `data.bcc` (array of objects, optional) - BCC recipients

**Content Fields (Conditional):**

Included when **Configuration → Webhooks → Text content** is enabled (`notifyText: true`):

- `data.text` (object, optional) - Message text content
  - `data.text.id` (string) - Text content identifier
  - `data.text.encodedSize` (object) - Size information
    - `data.text.encodedSize.plain` (number) - Plain text size in bytes
    - `data.text.encodedSize.html` (number) - HTML size in bytes
  - `data.text.plain` (string) - Plain text content (up to `notifyTextSize` limit)
  - `data.text.html` (string) - HTML content (up to `notifyTextSize` limit)
  - `data.text.webSafe` (string, optional) - Sanitized HTML (when `notifyWebSafeHtml: true`)
  - `data.text.hasMore` (boolean) - Content was truncated

**Attachment Fields (Conditional):**

Included when **Configuration → Webhooks → Attachments** is enabled (`notifyAttachments: true`):

- `data.attachments` (array of objects, optional) - Attachment metadata
  - `id` (string) - Attachment identifier
  - `contentType` (string) - MIME type
  - `disposition` (string) - Content disposition ("attachment" or "inline")
  - `filename` (string) - Filename
  - `size` (number) - Size in bytes
  - `embedded` (boolean, optional) - Is embedded image
  - `inline` (boolean, optional) - Is inline attachment
  - `contentId` (string, optional) - Content-ID header value

**Gmail-Specific Fields:**

- `data.labels` (array of strings, optional) - Gmail labels (e.g., "\Important", "\Inbox", "\Starred")
- `data.category` (string, optional) - Gmail category tab ("primary", "social", "promotions", "updates", "forums")
  - Requires **Configuration → Service → Labs → Resolve Gmail categories** enabled
- `data.messageSpecialUse` (string, optional) - Special-use flag that best classifies the message (prefer over top-level `specialUse`)

**Header Fields (Conditional):**

Included when headers are specified in `notifyHeaders` setting:

- `data.headers` (object, optional) - Requested email headers
  - Keys are lowercase header names
  - Values are strings or arrays for multi-value headers

**Metadata Fields:**

- `data.seemsLikeNew` (boolean, optional) - EmailEngine has no prior record of this message (~99% accuracy)
- `data.isAutoReply` (boolean, optional) - Message appears to be an auto-reply
- `data.isBounce` (boolean, optional) - Message appears to be a bounce
- `data.isComplaint` (boolean, optional) - Message appears to be an abuse complaint

**AI Feature Fields (Conditional):**

Included when AI features are enabled:

- `data.summary` (string, optional) - AI-generated summary (when `generateEmailSummary: true`)
- `data.embeddings` (array of numbers, optional) - Vector embeddings (when `openAiGenerateEmbeddings: true`)
- `data.riskAssessment` (object, optional) - AI risk analysis
  - `data.riskAssessment.score` (number) - Risk score (0-1)
  - `data.riskAssessment.reasons` (array of strings) - Risk factors

**Use Cases:**
- Real-time email notifications
- Auto-reply systems
- Email-to-ticket conversion
- Message classification
- Attachment processing
- Email analytics
- Spam filtering
- Thread management

**Example Integration:**
```javascript
app.post('/webhook', async (req, res) => {
  const event = req.body;
  const eventId = req.headers['x-ee-wh-event-id'];

  if (event.event === 'messageNew') {
    const { data } = event;

    // Check idempotency using header
    if (await isProcessed(eventId)) {
      return res.json({ success: true }); // Already handled
    }

    // Notify user
    await sendPushNotification({
      title: `New email from ${data.from.address}`,
      body: data.subject
    });

    // Process attachments
    if (data.attachments?.length > 0) {
      await processAttachments(data.id, data.attachments);
    }

    // Auto-classify
    if (data.subject?.includes('invoice')) {
      await moveToFolder(data.id, 'Invoices');
    }

    // Mark as processed
    await markProcessed(eventId);
    res.json({ success: true });
  }
});
```

---

### messageDeleted

Triggered when a message is deleted from a mailbox or moved to another folder.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageDeleted",
  "account": "user@example.com",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "abc123",
    "threadId": "thread_xyz"
  }
}
```

**Fields:**
- `data.id` (string) - EmailEngine message ID
- `data.uid` (number) - IMAP UID (no longer valid)
- `data.path` (string) - Mailbox path where deleted from
- `data.emailId` (string, optional) - RFC 8474 Email ID
- `data.threadId` (string, optional) - Thread ID (Gmail)

**Use Cases:**
- Sync deletions to local database
- Track deleted messages
- Compliance logging
- Undo deletion feature
- Analytics (deletion patterns)

---

### messageUpdated

Triggered when message flags or labels change (read/unread, flagged, etc.).

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageUpdated",
  "account": "user@example.com",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "abc123",
    "threadId": "thread_xyz",
    "flags": ["\\Seen", "\\Flagged"],
    "unseen": false,
    "flagged": true,
    "changes": {
      "flags": {
        "added": ["\\Seen"],
        "removed": [],
        "value": ["\\Seen", "\\Flagged"]
      },
      "labels": {
        "added": ["\\Important"],
        "removed": ["\\Inbox"],
        "value": ["\\Important", "\\Starred"]
      }
    }
  }
}
```

**Fields:**
- `data.id` (string) - EmailEngine message ID
- `data.uid` (number) - IMAP UID
- `data.path` (string) - Mailbox path
- `data.emailId` (string, optional) - RFC 8474 Email ID
- `data.threadId` (string, optional) - Thread ID (Gmail)
- `data.flags` (array of strings) - Current IMAP flags
- `data.unseen` (boolean) - Current unread status
- `data.flagged` (boolean) - Current flagged status
- `data.changes` (object) - Change details
  - `data.changes.flags` (object) - Flag changes
    - `data.changes.flags.added` (array of strings) - Newly added flags
    - `data.changes.flags.removed` (array of strings) - Removed flags
    - `data.changes.flags.value` (array of strings) - Current complete flag list
  - `data.changes.labels` (object, optional) - Label changes (Gmail)
    - `data.changes.labels.added` (array of strings) - Newly added labels
    - `data.changes.labels.removed` (array of strings) - Removed labels
    - `data.changes.labels.value` (array of strings) - Current complete label list

**Use Cases:**
- Sync read status across devices
- Track flag changes
- Update UI in real-time
- Analytics (read rates)
- Trigger workflows on status changes

---

### messageMissing

Triggered when a previously seen message is no longer found in the mailbox (may indicate external deletion or mailbox corruption).

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageMissing",
  "account": "user@example.com",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX"
  }
}
```

**Fields:**
- `data.id` (string) - EmailEngine message ID
- `data.uid` (number) - IMAP UID (no longer valid)
- `data.path` (string) - Mailbox path

**Use Cases:**
- Detect sync issues
- Alert on potential data loss
- Trigger resynchronization
- Debugging mailbox problems

---

## Mailbox Events

Events related to mailbox (folder) operations.

### mailboxNew

Triggered when a new mailbox (folder) is created.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "mailboxNew",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "path": "Projects/2025",
    "name": "2025",
    "delimiter": "/",
    "parent": "Projects",
    "specialUse": null
  }
}
```

**Fields:**
- `data.path` (string) - Full mailbox path
- `data.name` (string) - Mailbox name (last component of path)
- `data.delimiter` (string) - Path delimiter character (usually "/" or ".")
- `data.parent` (string, optional) - Parent mailbox path
- `data.specialUse` (string, optional) - Special-use flag (e.g., "\Sent", "\Drafts", "\Trash")

**Use Cases:**
- Sync folder structure
- Update folder lists
- Track folder organization
- Folder-based automation rules

---

### mailboxDeleted

Triggered when a mailbox (folder) is deleted.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "mailboxDeleted",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "path": "Old/Archive",
    "name": "Archive",
    "specialUse": null
  }
}
```

**Fields:**
- `data.path` (string) - Deleted mailbox path
- `data.name` (string) - Mailbox name
- `data.specialUse` (string, optional) - Special-use flag

**Use Cases:**
- Remove folder from UI
- Archive folder contents
- Cleanup folder-based rules

---

### mailboxReset

Triggered when the UIDVALIDITY of a folder changes. This indicates the folder was deleted and recreated, or the server reset its UID namespace.

**Important:** All previous UIDs for this folder are now invalid. You should refetch all messages.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "mailboxReset",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "path": "INBOX",
    "oldUidValidity": "1234567890",
    "newUidValidity": "1234567899"
  }
}
```

**Fields:**
- `data.path` (string) - Mailbox path that was reset
- `data.oldUidValidity` (string) - Previous UIDVALIDITY value
- `data.newUidValidity` (string) - New UIDVALIDITY value

**Use Cases:**
- Invalidate cached message UIDs
- Trigger full mailbox resynchronization
- Update local database
- Clear message references

---

## Sending Events

Events related to sending emails.

### messageSent

Triggered when a message is successfully accepted by the mail server (MTA).

**Note:** This indicates the server accepted the message, not that it was delivered to recipients. See `messageBounce` for delivery failures.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageSent",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "messageId": "<abc123@example.com>",
    "originalMessageId": "<original123@example.com>",
    "queueId": "queue_456",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "response": "250 2.0.0 OK",
    "smtpResponse": "250 2.0.0 OK: queued as ABC123",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@example.com"]
    },
    "gateway": "custom-gateway-id"
  }
}
```

**Fields:**
- `data.messageId` (string) - Final Message-ID (may be rewritten by server)
- `data.originalMessageId` (string, optional) - Original Message-ID when server rewrites it (Amazon SES, AWS WorkMail, Microsoft Graph)
- `data.queueId` (string) - Internal queue identifier
- `data.to` (array of strings) - Recipients list
- `data.subject` (string) - Email subject
- `data.response` (string) - SMTP response code
- `data.smtpResponse` (string) - Full SMTP response from server
- `data.envelope` (object) - SMTP envelope
  - `data.envelope.from` (string) - Envelope sender (MAIL FROM)
  - `data.envelope.to` (array of strings) - Envelope recipients (RCPT TO)
- `data.gateway` (string, optional) - Gateway identifier if sent through custom SMTP gateway

**Message-ID Rewriting:**

Some mail servers (Amazon SES, AWS WorkMail, Microsoft Graph) replace the Message-ID header. When this happens:
- `messageId` contains the final server-assigned ID
- `originalMessageId` contains your original ID

Always use `messageId` for tracking - it's the ID stored on the server.

**Use Cases:**
- Confirm delivery to user
- Update sent status in database
- Track email campaigns
- Delivery analytics
- Trigger follow-up actions

**Example Integration:**
```javascript
if (event.event === 'messageSent') {
  const { data } = event;

  // Update database
  await db.emails.updateOne(
    { queueId: data.queueId },
    { $set: { status: 'sent', messageId: data.messageId } }
  );

  // Notify user
  await notifyUser({
    message: `Email "${data.subject}" sent successfully`
  });

  // Analytics
  await trackEvent('email_sent', {
    account: event.account,
    recipients: data.to.length,
    gateway: data.gateway
  });
}
```

---

### messageDeliveryError

Triggered when email sending fails. EmailEngine retries automatically. You receive one webhook per failed attempt.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageDeliveryError",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "queueId": "queue_456",
    "to": ["invalid@example.com"],
    "subject": "Test Email",
    "error": "Recipient address rejected",
    "errorCode": "EPROTOCOL",
    "response": "550 5.1.1 User unknown",
    "smtpResponse": "550 5.1.1 <invalid@example.com>: Recipient address rejected: User unknown",
    "smtpResponseCode": 550,
    "envelope": {
      "from": "sender@example.com",
      "to": ["invalid@example.com"]
    },
    "messageId": "<abc123@example.com>",
    "job": {
      "attemptsMade": 1,
      "attempts": 10,
      "nextAttempt": "2025-01-15T10:07:45.465Z"
    }
  }
}
```

**Fields:**
- `data.queueId` (string) - Internal queue ID
- `data.to` (array of strings) - Recipients list
- `data.subject` (string) - Email subject
- `data.error` (string) - Error message
- `data.errorCode` (string) - Error code (e.g., "EPROTOCOL", "ECONNECTION", "EAUTH")
- `data.response` (string) - SMTP error code
- `data.smtpResponse` (string) - Full SMTP error response
- `data.smtpResponseCode` (number, optional) - Numeric SMTP response code
- `data.envelope` (object) - SMTP envelope
  - `data.envelope.from` (string) - Envelope sender
  - `data.envelope.to` (array of strings) - Envelope recipients
- `data.messageId` (string) - Message-ID header
- `data.job` (object) - Queue job status
  - `data.job.attemptsMade` (number) - Current attempt number
  - `data.job.attempts` (number) - Maximum attempts (default 10)
  - `data.job.nextAttempt` (string) - ISO 8601 timestamp of next retry

**Common SMTP Error Codes:**
- `550 5.1.1` - User unknown / mailbox not found
- `550 5.7.1` - Relay denied / not authorized
- `552 5.2.2` - Mailbox full
- `554 5.7.1` - Message rejected (spam)

**Use Cases:**
- Alert user to sending failure
- Update failed status
- Custom retry logic
- Bounce handling
- Email validation

---

### messageFailed

Triggered when EmailEngine abandons delivery after all retry attempts fail. This is a permanent failure.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageFailed",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "messageId": "<abc123@example.com>",
    "queueId": "queue_456",
    "error": "Error: Invalid login: 535 5.7.8 Error: authentication failed",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@example.com"]
    },
    "subject": "Test Email",
    "networkRouting": {
      "localAddress": "192.168.1.100",
      "localPort": 54321
    }
  }
}
```

**Fields:**
- `data.messageId` (string) - Message-ID header
- `data.queueId` (string) - Internal queue ID
- `data.error` (string) - Final error message
- `data.envelope` (object) - SMTP envelope
  - `data.envelope.from` (string) - Envelope sender
  - `data.envelope.to` (array of strings) - Envelope recipients
- `data.subject` (string, optional) - Email subject
- `data.networkRouting` (object, optional) - Network information
  - `data.networkRouting.localAddress` (string) - Local IP address used
  - `data.networkRouting.localPort` (number) - Local port used

**Use Cases:**
- Notify sender of permanent failure
- Remove from send queue
- Log failed deliveries
- Update campaign statistics
- Trigger alternative delivery methods

---

### messageBounce

Triggered when a bounce (DSN - Delivery Status Notification) message is received for a sent email.

**Note:** Field coverage depends on the bounce format and what EmailEngine can parse. Different mail servers provide different levels of detail.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageBounce",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "bounceMessage": "AAAAAQAABWw",
    "messageId": "<abc123@example.com>",
    "recipient": "bounced@example.com",
    "bounceType": "hard",
    "action": "failed",
    "diagnosticCode": "550 5.1.1 User unknown",
    "status": "5.1.1",
    "response": {
      "source": "smtp",
      "message": "550 5.1.1 <bounced@example.com>: Recipient address rejected: User unknown in relay recipient table",
      "status": "5.1.1"
    },
    "mta": "mx.example.com",
    "originalRecipient": "original@example.com",
    "queueId": "BFC608226A"
  }
}
```

**Fields:**
- `data.bounceMessage` (string) - EmailEngine ID of the bounce message itself
- `data.messageId` (string) - Original Message-ID that bounced
- `data.recipient` (string) - Bounced recipient address
- `data.bounceType` (string, optional) - "hard" (permanent) or "soft" (temporary)
- `data.action` (string) - DSN action ("failed", "delayed", "delivered", "relayed", "expanded")
- `data.diagnosticCode` (string, optional) - Diagnostic reason for bounce
- `data.status` (string, optional) - DSN status code (e.g., "5.1.1")
- `data.response` (object, optional) - Parsed bounce response
  - `data.response.source` (string) - Source of bounce ("smtp", "dns", etc.)
  - `data.response.message` (string) - Bounce message
  - `data.response.status` (string) - Status code
- `data.mta` (string, optional) - Mail Transfer Agent that generated the bounce
- `data.originalRecipient` (string, optional) - Original recipient (before forwarding)
- `data.queueId` (string, optional) - MTA queue identifier

**Bounce Types:**
- **Hard bounce**: Permanent failure (invalid email, domain not found, user unknown)
- **Soft bounce**: Temporary failure (mailbox full, server down, greylisting)

**Use Cases:**
- Remove hard bounces from mailing lists
- Retry soft bounces
- Email validation
- Delivery reporting
- Maintain sender reputation
- Compliance with anti-spam regulations

**Handling Multiple Recipients:**

If a message sent to multiple recipients bounces for several addresses, EmailEngine emits a separate `messageBounce` event for each recipient.

---

### messageComplaint

Triggered when an ARF (Abuse Reporting Format) feedback loop complaint is received. This indicates a recipient marked your email as spam.

**Note:** Field coverage depends on the reporting provider. Some providers omit headers like Message-ID.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "messageComplaint",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "complaintMessage": "AAAAAQAABvE",
    "arf": {
      "source": "Hotmail",
      "feedbackType": "abuse",
      "abuseType": "complaint",
      "originalRcptTo": ["recipient@hotmail.co.uk"],
      "arrivalDate": "2021-10-22T13:04:36.017Z",
      "sourceIp": "1.2.3.4",
      "userAgent": "Mozilla/5.0..."
    },
    "headers": {
      "messageId": "<abc123@example.com>",
      "from": "sender@example.com",
      "to": ["recipient@hotmail.co.uk"],
      "subject": "Newsletter",
      "date": "2021-10-22T16:04:33.000Z"
    }
  }
}
```

**Fields:**
- `data.complaintMessage` (string) - EmailEngine ID of the complaint message
- `data.arf` (object) - ARF feedback loop data
  - `data.arf.source` (string, optional) - Provider name (e.g., "Hotmail", "Yahoo")
  - `data.arf.feedbackType` (string) - Feedback type ("abuse", "fraud", "virus", "not-spam")
  - `data.arf.abuseType` (string, optional) - Specific abuse type
  - `data.arf.originalRcptTo` (array of strings, optional) - Original recipients
  - `data.arf.arrivalDate` (string, optional) - When complaint was generated (ISO 8601)
  - `data.arf.sourceIp` (string, optional) - IP address that sent the original email
  - `data.arf.userAgent` (string, optional) - User agent string
- `data.headers` (object, optional) - Original message headers (may be incomplete)
  - `data.headers.messageId` (string, optional) - Message-ID of complained message
  - `data.headers.from` (string, optional) - From address
  - `data.headers.to` (array of strings, optional) - Recipients
  - `data.headers.subject` (string, optional) - Subject line
  - `data.headers.date` (string, optional) - Date header

**Use Cases:**
- Remove complainers from mailing lists immediately
- Investigate spam complaints
- Improve email content
- Monitor sender reputation
- Compliance with anti-spam laws (CAN-SPAM, GDPR)
- Alert administrators

---

## Tracking Events

Events related to email tracking (opens and clicks).

**Note:** Tracking requires **Configuration → Service → Labs → Track opens and clicks** to be enabled.

### trackOpen

Triggered when a tracking pixel embedded in an email is requested, indicating the recipient opened the email.

**Warning:** False positives are possible when:
- Webmail clients cache linked images
- Email clients pre-fetch images
- Security software scans emails

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "trackOpen",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "messageId": "<abc123@example.com>",
    "remoteAddress": "203.0.113.45",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.83 Safari/537.36"
  }
}
```

**Fields:**
- `data.messageId` (string) - Message-ID of the opened email
- `data.remoteAddress` (string) - IP address that requested the tracking pixel
- `data.userAgent` (string) - User-Agent header from the request

**Use Cases:**
- Track email open rates
- Engagement analytics
- Campaign performance
- Follow-up timing
- A/B testing

---

### trackClick

Triggered when a tracked link in an email is clicked.

**Warning:** False positives may occur when:
- Security software pre-fetches URLs
- Link scanners check URLs for safety
- Email clients preview links

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "trackClick",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "messageId": "<abc123@example.com>",
    "url": "https://example.com/page",
    "remoteAddress": "203.0.113.45",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.83 Safari/537.36"
  }
}
```

**Fields:**
- `data.messageId` (string) - Message-ID of the email containing the link
- `data.url` (string) - Original URL that was clicked
- `data.remoteAddress` (string) - IP address of the clicker
- `data.userAgent` (string) - User-Agent header from the request

**Use Cases:**
- Track click-through rates
- Identify popular content
- Engagement metrics
- Conversion tracking
- Link performance analysis

---

## List Management Events

Events related to email list subscriptions and unsubscriptions.

### listUnsubscribe

Triggered when a recipient clicks the List-Unsubscribe link or when an email client issues a one-click unsubscribe request (RFC 8058).

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "listUnsubscribe",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "recipient": "recipient@example.com",
    "messageId": "<abc123@example.com>",
    "listId": "my-newsletter-list",
    "remoteAddress": "203.0.113.45",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Fields:**
- `data.recipient` (string) - Email address being unsubscribed
- `data.messageId` (string) - Message-ID of the email that contained the unsubscribe link
- `data.listId` (string, optional) - List identifier (from List-ID header)
- `data.remoteAddress` (string, optional) - IP address of the request
- `data.userAgent` (string, optional) - User-Agent header

**Use Cases:**
- Remove from mailing list immediately
- Send unsubscribe confirmation
- Update preference center
- Compliance (CAN-SPAM, GDPR)
- Analytics (unsubscribe rates)

---

### listSubscribe

Triggered when a recipient resubscribes to a list after previously unsubscribing.

**Payload:**
```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "listSubscribe",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "recipient": "recipient@example.com",
    "listId": "my-newsletter-list",
    "remoteAddress": "203.0.113.45",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Fields:**
- `data.recipient` (string) - Email address being resubscribed
- `data.listId` (string, optional) - List identifier
- `data.remoteAddress` (string, optional) - IP address of the request
- `data.userAgent` (string, optional) - User-Agent header

**Use Cases:**
- Add to mailing list
- Send welcome-back email
- Update preference center
- Analytics (resubscribe rates)

---

## Complete Event List

Quick reference table of all events:

| Event | Category | Trigger | Common Use |
|-------|----------|---------|------------|
| `accountAdded` | Account | Account registered | Onboarding |
| `accountDeleted` | Account | Account removed | Cleanup |
| `accountInitialized` | Account | First successful sync | Enable features |
| `accountError` | Account | Connection/auth error | Alert user |
| `authenticationError` | Account | Auth failed | Re-authenticate |
| `authenticationSuccess` | Account | Auth succeeded | Resume operations |
| `connectError` | Account | Connection failed | Monitor connectivity |
| `messageNew` | Message | New message received | Notifications |
| `messageDeleted` | Message | Message deleted | Sync deletions |
| `messageUpdated` | Message | Flags changed | Sync read status |
| `messageMissing` | Message | Message disappeared | Debugging |
| `messageSent` | Sending | Email accepted by MTA | Confirm delivery |
| `messageDeliveryError` | Sending | Send failed (retry) | Alert & retry |
| `messageFailed` | Sending | Send failed (permanent) | Log failure |
| `messageBounce` | Sending | Bounce received | List management |
| `messageComplaint` | Sending | FBL complaint | Remove from list |
| `trackOpen` | Tracking | Email opened | Analytics |
| `trackClick` | Tracking | Link clicked | Engagement |
| `listUnsubscribe` | List | Unsubscribed | Remove from list |
| `listSubscribe` | List | Resubscribed | Add to list |
| `mailboxNew` | Mailbox | Folder created | Sync folders |
| `mailboxDeleted` | Mailbox | Folder deleted | Update UI |
| `mailboxReset` | Mailbox | UIDVALIDITY changed | Resync folder |

## Event Filtering

Subscribe to specific events when configuring webhooks:

```json
{
  "webhooks": "https://your-app.com/webhook",
  "webhookEvents": [
    "messageNew",
    "messageSent",
    "messageDeliveryError"
  ]
}
```

**Common Combinations:**

**Basic email monitoring:**
```json
["messageNew", "messageDeleted"]
```

**Sending tracking:**
```json
["messageSent", "messageDeliveryError", "messageFailed", "messageBounce"]
```

**Full monitoring:**
```json
[
  "messageNew",
  "messageDeleted",
  "messageUpdated",
  "messageSent",
  "messageDeliveryError",
  "messageFailed",
  "messageBounce",
  "messageComplaint",
  "trackOpen",
  "trackClick",
  "listUnsubscribe",
  "accountError",
  "authenticationError"
]
```

**Subscribe to all events:**
Omit `webhookEvents` or use empty array `[]` to receive all events.

## Conditional Fields Reference

Many fields only appear under specific conditions:

### Configuration-Dependent Fields

**Text Content** (`notifyText: true`):
- `data.text.plain`
- `data.text.html`
- `data.text.webSafe` (also requires `notifyWebSafeHtml: true`)
- `data.text.hasMore`

**Attachments** (`notifyAttachments: true`):
- `data.attachments[]`

**Custom Headers** (`notifyHeaders: ["Header-Name"]`):
- `data.headers`

**AI Features**:
- `data.summary` (requires `generateEmailSummary: true`)
- `data.embeddings` (requires `openAiGenerateEmbeddings: true`)

### Provider-Specific Fields

**Gmail**:
- `data.labels` - Gmail labels
- `data.category` - Inbox category (requires "Resolve Gmail categories" enabled)
- `data.emailId` - Gmail Email ID
- `data.threadId` - Gmail Thread ID

**Outlook/Modern IMAP**:
- `data.emailId` - RFC 8474 Email ID
- `data.threadId` - Thread ID

### Message-Dependent Fields

**Optional Headers**:
- `data.cc` - Only when CC recipients exist
- `data.bcc` - Only when BCC recipients exist
- `data.replyTo` - Only when Reply-To differs from From
- `data.sender` - Only when Sender differs from From
- `data.inReplyTo` - Only for reply messages

**Metadata**:
- `data.seemsLikeNew` - Only for messageNew events
- `data.isAutoReply` - Only when detected
- `data.isBounce` - Only when detected
- `data.isComplaint` - Only when detected

## Gmail-Specific Features

### Labels vs Flags

Gmail uses labels instead of traditional IMAP flags. EmailEngine provides both:

- `data.flags` - IMAP flags (limited set)
- `data.labels` - Full Gmail label list (recommended)

Common Gmail labels:
- `\Inbox` - In inbox
- `\Important` - Marked important
- `\Starred` - Starred
- `\Sent` - Sent mail
- `\Drafts` - Draft messages
- `\Trash` - In trash
- `UNREAD` - Unread (alternative to lack of \Seen flag)

### Category Tabs

Enable **Configuration → Service → Labs → Resolve Gmail categories** to get:

- `data.category` - One of: "primary", "social", "promotions", "updates", "forums"

### Special Use Folders

For Gmail, prefer `data.messageSpecialUse` over top-level `specialUse`:
- `specialUse` is usually "\All" (all mail)
- `data.messageSpecialUse` indicates the logical folder (e.g., "\Inbox")

### Email ID and Thread ID

Gmail provides stable identifiers:
- `data.emailId` - Unique message identifier (survives moves)
- `data.threadId` - Conversation identifier (groups related messages)

## Outlook-Specific Features

### Folder Structure

Outlook uses "/" as delimiter. Common folders:
- `INBOX` - Inbox
- `Sent Items` - Sent mail
- `Drafts` - Drafts
- `Deleted Items` - Trash
- `Junk Email` - Spam

### Shared Mailboxes

Events from shared mailboxes include the same fields. Use `account` to identify which mailbox.

### Categories

Outlook categories appear in `data.flags` as custom flags when supported by the IMAP implementation.

## AI Features

When AI features are enabled (OpenAI integration):

### Email Summary

Enable: `generateEmailSummary: true`

Adds: `data.summary` (string) - AI-generated summary of email content

Example:
```json
{
  "data": {
    "subject": "Q4 Sales Report",
    "summary": "Sales increased 23% in Q4. Top performers: Product A (+45%), Product B (+12%). Request for Q1 strategy meeting."
  }
}
```

### Vector Embeddings

Enable: `openAiGenerateEmbeddings: true`

Adds: `data.embeddings` (array of numbers) - Vector representation for semantic search

Example use:
```javascript
// Find similar emails
const similar = await findSimilar(message.embeddings, threshold: 0.8);
```

### Risk Assessment

Adds: `data.riskAssessment` (object) - AI-powered risk analysis

```json
{
  "data": {
    "riskAssessment": {
      "score": 0.85,
      "reasons": [
        "Urgent payment request",
        "Suspicious sender domain",
        "Contains external link"
      ]
    }
  }
}
```

## Event Handling Best Practices

### Idempotency

Always handle duplicate events using the `X-EE-Wh-Event-Id` header:

```javascript
const processedEvents = new Set();

app.post('/webhook', async (req, res) => {
  const event = req.body;
  const eventId = req.headers['x-ee-wh-event-id'];

  // Check idempotency
  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return res.json({ success: true });
  }

  // Or use database
  const exists = await db.events.findOne({ eventId });
  if (exists) {
    return res.json({ success: true }); // Already processed
  }

  // Process event
  await processEvent(event);

  // Mark as processed
  await db.events.insertOne({ eventId, processed: true });
  processedEvents.add(eventId);

  res.json({ success: true });
});
```

### Error Handling

Return 2xx status for successful processing, 5xx to trigger retry:

```javascript
app.post('/webhook', async (req, res) => {
  try {
    await processWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 5xx to trigger EmailEngine retry
    res.status(500).json({ error: error.message });
  }
});
```

### Async Processing

Queue webhooks for background processing to respond quickly:

```javascript
app.post('/webhook', async (req, res) => {
  // Queue immediately
  await queue.add('webhook', req.body);

  // Respond quickly (< 5 seconds recommended)
  res.json({ success: true });
});

// Process in background
queue.process('webhook', async (job) => {
  await processWebhook(job.data);
});
```

### Handling Conditional Fields

Check for field existence before accessing:

```javascript
function processMessageNew(event) {
  const { data } = event;

  // Safe text access
  if (data.text?.plain) {
    await indexText(data.text.plain);
  }

  // Safe attachment access
  if (data.attachments?.length > 0) {
    await processAttachments(data.attachments);
  }

  // Gmail-specific
  if (data.labels?.includes('\\Important')) {
    await flagAsImportant(data.id);
  }

  // AI features
  if (data.summary) {
    await storeSummary(data.id, data.summary);
  }
}
```

### Event-Specific Handling

Use switch statements for clarity:

```javascript
async function processWebhook(event) {
  switch (event.event) {
    case 'messageNew':
      return handleNewMessage(event.account, event.data);

    case 'messageSent':
      return handleMessageSent(event.account, event.data);

    case 'messageDeliveryError':
      return handleSendError(event.account, event.data);

    case 'messageBounce':
      return handleBounce(event.account, event.data);

    case 'messageComplaint':
      return handleComplaint(event.account, event.data);

    case 'trackOpen':
      return handleOpen(event.account, event.data);

    case 'trackClick':
      return handleClick(event.account, event.data);

    case 'listUnsubscribe':
      return handleUnsubscribe(event.account, event.data);

    case 'accountError':
      return handleAccountError(event.account, event.data);

    default:
      console.log('Unhandled event:', event.event);
  }
}
```

### Webhook Retry Handling

EmailEngine retries failed webhooks up to 10 times with exponential backoff:

```javascript
app.post('/webhook', async (req, res) => {
  const attemptNumber = parseInt(req.headers['x-ee-wh-attempts-made'] || '1');
  const eventId = req.headers['x-ee-wh-event-id'];

  if (attemptNumber > 1) {
    console.log(`Retry attempt ${attemptNumber} for event ${eventId}`);
  }

  // Process webhook...
  await processEvent(req.body);

  res.json({ success: true });
});
```

## Webhook Retry Mechanism

EmailEngine automatically retries failed webhook deliveries:

- **Maximum attempts**: 10
- **Backoff formula**: `delay = 5000ms × 2^(attempt - 1)`
- **Retry delays**:
  - Attempt 1: Immediate
  - Attempt 2: 5 seconds
  - Attempt 3: 10 seconds
  - Attempt 4: 20 seconds
  - Attempt 5: 40 seconds
  - Attempt 6: 80 seconds (1.3 minutes)
  - Attempt 7: 160 seconds (2.7 minutes)
  - Attempt 8: 320 seconds (5.3 minutes)
  - Attempt 9: 640 seconds (10.7 minutes)
  - Attempt 10: 1280 seconds (21.3 minutes)

After 10 failed attempts, the webhook is marked as undeliverable and moved to the Failed queue.

**Monitor webhooks**:
- Dashboard: **Tools → Bull Board → notify**
- Pending retries: **Delayed** section
- Undeliverable: **Failed** section

**Configure retention**:
- **Configuration → Service → Queue Settings**
- Set retention limits for completed/failed jobs

## Testing Events

### Using Webhook Tailing

Real-time webhook monitoring in the EmailEngine UI:

1. Navigate to **Configuration → Webhooks**
2. Click **Tail Webhooks**
3. Trigger events (send email, receive email, change flags)
4. See events in real-time with full payloads

### Using Webhook Testing Services

Test webhooks without implementing an endpoint:

- [Webhook.site](https://webhook.site) - Inspect payloads, headers, test responses
- [RequestBin](https://requestbin.com) - Create temporary endpoints
- [ngrok](https://ngrok.com) - Expose local server for testing

Example ngrok setup:
```bash
# Start local server
node server.js

# Expose via ngrok
ngrok http 3000

# Use ngrok URL in EmailEngine webhook settings
https://abc123.ngrok.io/webhook
```

### Testing Specific Events

**Test messageNew**: Send email to the account

**Test messageSent**: Use Send API

**Test messageDeliveryError**: Send to invalid address

**Test messageBounce**: Send to known bounce address

**Test trackOpen**: Enable tracking, send email, open it

**Test trackClick**: Enable tracking, send email with link, click it

**Test listUnsubscribe**: Add List-Unsubscribe header, click unsubscribe
