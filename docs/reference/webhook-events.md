---
title: Webhook Events Reference
description: Complete reference of all webhook events and payload schemas
sidebar_position: 1
---

# Webhook Events Reference

Complete reference for all webhook event types in EmailEngine. Each event includes a payload structure, example, trigger conditions, and common use cases.

## Event Structure

All webhook events follow this common structure:

```json
{
  "event": "eventName",
  "account": "account-id",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    /* event-specific payload */
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type identifier |
| `account` | string | Account identifier that triggered the event |
| `date` | string | ISO 8601 timestamp when event occurred |
| `data` | object | Event-specific payload data |

## Account Events

Events related to account connection and status changes.

### accountAdded

Triggered when a new account is registered in EmailEngine.

**Payload:**
```json
{
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
- `account` - Account identifier
- `name` - Display name
- `email` - Email address

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
  "event": "accountDeleted",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "account": "user@example.com"
  }
}
```

**Fields:**
- `account` - Deleted account identifier

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
- `account` - Account identifier
- `state` - Connection state (usually "connected")
- `syncTime` - Timestamp of first successful sync

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
- `account` - Account identifier
- `error` - Error object with details
- `error.message` - Human-readable error description
- `error.code` - Error code
- `lastError` - Additional error context

**Use Cases:**
- Alert user to fix credentials
- Pause account operations
- Log errors for debugging
- Trigger credential refresh flow

---

## Message Events

Events related to message operations and changes.

### messageNew

Triggered when a new message arrives in any mailbox.

**Payload:**
```json
{
  "event": "messageNew",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "abc123",
    "threadId": "thread_xyz",
    "date": "2025-01-15T10:25:00.000Z",
    "flags": [],
    "unseen": true,
    "flagged": false,
    "subject": "Important Message",
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
    "text": {
      "id": "text_123",
      "encodedSize": 1234,
      "plain": "Message content preview...",
      "html": "<p>Message content preview...</p>"
    },
    "attachments": [
      {
        "id": "att_456",
        "contentType": "application/pdf",
        "filename": "document.pdf",
        "size": 52341
      }
    ]
  }
}
```

**Fields:**
- `id` - EmailEngine message ID
- `uid` - IMAP UID
- `path` - Mailbox path
- `subject` - Email subject
- `from` - Sender information
- `to` - Recipients list
- `text` - Message content preview
- `attachments` - Attachment metadata
- Plus all standard message fields

**Use Cases:**
- Real-time email notifications
- Auto-reply systems
- Email-to-ticket conversion
- Message classification
- Attachment processing
- Email analytics

**Example Integration:**
```javascript
if (event.event === 'messageNew') {
  const { data } = event;

  // Notify user
  await sendPushNotification({
    title: `New email from ${data.from.address}`,
    body: data.subject
  });

  // Process attachments
  if (data.attachments.length > 0) {
    await processAttachments(data.id, data.attachments);
  }

  // Auto-classify
  if (data.subject.includes('invoice')) {
    await moveToFolder(data.id, 'Invoices');
  }
}
```

---

### messageDeleted

Triggered when a message is deleted from a mailbox.

**Payload:**
```json
{
  "event": "messageDeleted",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "emailId": "abc123"
  }
}
```

**Fields:**
- `id` - EmailEngine message ID
- `uid` - IMAP UID
- `path` - Mailbox path where deleted from
- `emailId` - RFC 8474 Email ID

**Use Cases:**
- Sync deletions to local database
- Track deleted messages
- Compliance logging
- Undo deletion feature
- Analytics (deletion patterns)

---

### messageUpdated

Triggered when message flags change (read/unread, flagged, etc.).

**Payload:**
```json
{
  "event": "messageUpdated",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX",
    "flags": ["\\Seen", "\\Flagged"],
    "unseen": false,
    "flagged": true
  }
}
```

**Fields:**
- `id` - EmailEngine message ID
- `uid` - IMAP UID
- `path` - Mailbox path
- `flags` - Current IMAP flags
- `unseen` - Unread status
- `flagged` - Flagged status

**Use Cases:**
- Sync read status across devices
- Track flag changes
- Update UI in real-time
- Analytics (read rates)

---

### messageMissing

Triggered when a previously seen message is no longer found in the mailbox (may indicate external deletion or mailbox corruption).

**Payload:**
```json
{
  "event": "messageMissing",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "id": "AAAABAABNc",
    "uid": 12345,
    "path": "INBOX"
  }
}
```

**Fields:**
- `id` - EmailEngine message ID
- `uid` - IMAP UID (no longer valid)
- `path` - Mailbox path

**Use Cases:**
- Detect sync issues
- Alert on potential data loss
- Trigger resynchronization
- Debugging

---

## Mailbox Events

Events related to mailbox (folder) operations.

### mailboxNew

Triggered when a new mailbox (folder) is created.

**Payload:**
```json
{
  "event": "mailboxNew",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "path": "Projects/2025",
    "delimiter": "/",
    "parent": "Projects"
  }
}
```

**Fields:**
- `path` - Full mailbox path
- `delimiter` - Path delimiter character
- `parent` - Parent mailbox path

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
  "event": "mailboxDeleted",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "path": "Old/Archive"
  }
}
```

**Fields:**
- `path` - Deleted mailbox path

**Use Cases:**
- Remove folder from UI
- Archive folder contents
- Cleanup folder-based rules

---

### mailboxRenamed

Triggered when a mailbox (folder) is renamed.

**Payload:**
```json
{
  "event": "mailboxRenamed",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "path": "Archive/2025",
    "previousPath": "Archive/Current"
  }
}
```

**Fields:**
- `path` - New mailbox path
- `previousPath` - Old mailbox path

**Use Cases:**
- Update folder references
- Update folder-based rules
- Sync folder changes

---

## Sending Events

Events related to sending emails.

### messageSent

Triggered when a message is successfully sent.

**Payload:**
```json
{
  "event": "messageSent",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "messageId": "<abc123@example.com>",
    "queueId": "queue_456",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "response": "250 2.0.0 OK",
    "smtpResponse": "250 2.0.0 OK: queued as ABC123"
  }
}
```

**Fields:**
- `messageId` - RFC 5322 Message-ID
- `queueId` - Internal queue ID
- `to` - Recipients list
- `subject` - Email subject
- `response` - SMTP response code
- `smtpResponse` - Full SMTP response

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
    recipients: data.to.length
  });
}
```

---

### messageDeliveryError

Triggered when email sending fails.

**Payload:**
```json
{
  "event": "messageDeliveryError",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "queueId": "queue_456",
    "to": ["invalid@example.com"],
    "subject": "Test Email",
    "error": "Recipient address rejected",
    "response": "550 5.1.1 User unknown",
    "smtpResponse": "550 5.1.1 <invalid@example.com>: Recipient address rejected: User unknown"
  }
}
```

**Fields:**
- `queueId` - Internal queue ID
- `to` - Recipients list
- `subject` - Email subject
- `error` - Error message
- `response` - SMTP error code
- `smtpResponse` - Full SMTP error response

**Use Cases:**
- Alert user to sending failure
- Update failed status
- Retry logic
- Bounce handling
- Email validation

**Common Error Codes:**
- `550 5.1.1` - User unknown / mailbox not found
- `550 5.7.1` - Relay denied / not authorized
- `552 5.2.2` - Mailbox full
- `554 5.7.1` - Message rejected (spam)

---

### messageBounce

Triggered when a bounce notification is received for a sent message.

**Payload:**
```json
{
  "event": "messageBounce",
  "account": "user@example.com",
  "date": "2025-01-15T10:30:00.000Z",
  "data": {
    "messageId": "<abc123@example.com>",
    "bounceType": "hard",
    "recipient": "bounced@example.com",
    "diagnosticCode": "550 5.1.1 User unknown",
    "status": "5.1.1",
    "action": "failed"
  }
}
```

**Fields:**
- `messageId` - Original Message-ID
- `bounceType` - "hard" or "soft"
- `recipient` - Bounced recipient address
- `diagnosticCode` - Bounce reason
- `status` - DSN status code
- `action` - DSN action (failed, delayed, etc.)

**Bounce Types:**
- **Hard bounce**: Permanent failure (invalid email, domain not found)
- **Soft bounce**: Temporary failure (mailbox full, server down)

**Use Cases:**
- Remove hard bounces from mailing lists
- Retry soft bounces
- Email validation
- Delivery reporting
- Maintain sender reputation

---

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
["messageSent", "messageDeliveryError", "messageBounce"]
```

**Full account monitoring:**
```json
[
  "messageNew",
  "messageDeleted",
  "messageUpdated",
  "messageSent",
  "messageDeliveryError",
  "accountError"
]
```

**Subscribe to all events:**
Omit `webhookEvents` or use empty array to receive all events.

## Event Handling Best Practices

### Idempotency

Always handle duplicate events gracefully:

```javascript
const processedEvents = new Set();

function handleWebhook(event) {
  const eventId = `${event.event}-${event.account}-${event.data.id}`;

  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return;
  }

  // Process event
  processEvent(event);

  // Mark as processed
  processedEvents.add(eventId);
}
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
    res.status(500).json({ error: error.message });
  }
});
```

### Async Processing

Queue webhooks for background processing:

```javascript
app.post('/webhook', async (req, res) => {
  // Queue immediately
  await queue.add('webhook', req.body);

  // Respond quickly
  res.json({ success: true });
});

// Process in background
queue.process('webhook', async (job) => {
  await processWebhook(job.data);
});
```

### Event-Specific Handling

Use switch statements for clarity:

```javascript
function processWebhook(event) {
  switch (event.event) {
    case 'messageNew':
      return handleNewMessage(event.account, event.data);

    case 'messageSent':
      return handleMessageSent(event.account, event.data);

    case 'messageDeliveryError':
      return handleSendError(event.account, event.data);

    case 'accountError':
      return handleAccountError(event.account, event.data);

    default:
      console.log('Unhandled event:', event.event);
  }
}
```

## Complete Event List

Quick reference table of all events:

| Event | Category | Trigger | Common Use |
|-------|----------|---------|------------|
| `accountAdded` | Account | Account registered | Onboarding |
| `accountDeleted` | Account | Account removed | Cleanup |
| `accountInitialized` | Account | First successful sync | Enable features |
| `accountError` | Account | Connection/auth error | Alert user |
| `messageNew` | Message | New message received | Notifications |
| `messageDeleted` | Message | Message deleted | Sync deletions |
| `messageUpdated` | Message | Flags changed | Sync read status |
| `messageMissing` | Message | Message disappeared | Debugging |
| `mailboxNew` | Mailbox | Folder created | Sync folders |
| `mailboxDeleted` | Mailbox | Folder deleted | Update UI |
| `mailboxRenamed` | Mailbox | Folder renamed | Update references |
| `messageSent` | Sending | Email sent | Confirm delivery |
| `messageDeliveryError` | Sending | Send failed | Alert & retry |
| `messageBounce` | Sending | Bounce received | List management |

## Testing Events

Use the webhook tailing feature to test events in real-time:

1. Navigate to EmailEngine web UI
2. Go to Settings > Webhooks
3. Click "Tail Webhooks"
4. Trigger events (send email, receive email, etc.)
5. See events in real-time

Or use a webhook testing service:
- [Webhook.site](https://webhook.site)
- [RequestBin](https://requestbin.com)
- [ngrok](https://ngrok.com) for local testing

## See Also

- [Webhooks API](../api-reference/webhooks-api.md) - Webhook management
- [Webhooks Guide](../receiving/webhooks.md) - Webhook setup
- [API Reference](../api-reference) - Complete API documentation
- [Error Codes Reference](./error-codes.md) - Error handling
