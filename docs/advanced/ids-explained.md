---
title: Message IDs Explained
sidebar_position: 2
description: Understand the different types of message identifiers in EmailEngine and when to use each one
---

# Message IDs Explained

Learn about EmailEngine's various message identifiers—`id`, `uid`, `emailId`, `messageId`, and sequence numbers—and understand when and why to use each one.

**Source**: [IDs Explained](https://emailengine.app/blog/ids-explained) (July 2, 2024)

## Overview

If you've used EmailEngine for a while, you've probably noticed an abundance of different message identifiers: `id`, `emailId`, `uid`, `messageId`, and—under the hood—a sequence number.

**Why so many identifiers?**

The answer lies in 40 years of IMAP evolution and backward compatibility. Each identifier serves a distinct role for different use cases.

## Quick Reference

| Identifier | Stability | Scope | Use Case |
|------------|-----------|-------|----------|
| **id** | Within folder | EmailEngine API | Primary identifier for API requests |
| **uid** | Within folder | IMAP folder | Range searches, IMAP operations |
| **emailId** | Permanent | Email entity | Tracking across folders (Gmail/Yahoo only) |
| **messageId** | Permanent | Global | Integration with external systems |
| **Sequence** | Session only | IMAP internal | IMAP protocol (not exposed) |

## The `id` Property

### What It Is

The `id` is EmailEngine's primary identifier for API requests.

**Example**: `"AAAADAAAB40"`

### Characteristics

- **Stable within folder**: Never changes while message remains in the same folder
- **Changes on move**: Moving to another folder assigns a new `id`
- **Encoded identifier**: Internally encodes folder path, `UIDValidity`, and `uid`
- **API-friendly**: Short, URL-safe string

### When to Use

Use `id` for most EmailEngine API operations:

```bash
# Get message details
GET /v1/account/{account}/message/{id}

# Delete message
DELETE /v1/account/{account}/message/{id}

# Move message
PUT /v1/account/{account}/message/{id}/move
```

### How It Works

EmailEngine encodes three components into the `id`:

1. **Folder path**: Which folder contains the message
2. **UIDValidity**: IMAP folder version identifier
3. **uid**: IMAP unique identifier within folder

This encoding allows EmailEngine to locate the message on the IMAP server quickly.

### Important Limitations

**Old IDs become invalid after moves**:

```javascript
// Get message in INBOX
const message = await getMessage('account1', 'AAAADAAAB40');
// id: AAAADAAAB40, path: "INBOX"

// Move to Archive
await moveMessage('account1', 'AAAADAAAB40', 'Archive');

// Original ID is now invalid!
// GET /v1/account/account1/message/AAAADAAAB40
// Returns 404 - message not found

// Must use new ID from move response
const newId = moveResponse.id; // New ID in Archive folder
```

**Workaround**: Use `emailId` or `messageId` for cross-folder tracking.

## The `uid` Property

### What It Is

The IMAP **Unique Identifier** (UID) is an auto-incrementing integer within each folder.

**Example**: `2240`

### Characteristics

- **Folder-specific**: Each folder has its own UID sequence
- **Auto-incrementing**: New messages get higher UIDs than existing ones
- **Never reused**: Deleted UIDs cannot be reassigned within the same folder
- **Changes on move**: Moving to another folder assigns a new UID

### When to Use

Use `uid` for range-based operations:

```json
{
  "search": {
    "uid": "100:500"
  }
}
```

This searches all messages with UID values from 100 to 500.

### How It Works

Think of `uid` as a database table's auto-incrementing primary key:

```
Folder: INBOX (UIDValidity: 123456)
┌─────┬──────────┬─────────┐
│ UID │ Subject  │ From    │
├─────┼──────────┼─────────┤
│ 100 │ Hello    │ john@   │
│ 101 │ Welcome  │ jane@   │
│ 105 │ Update   │ bob@    │  ← UID 102-104 were deleted
│ 106 │ Reminder │ alice@  │
└─────┴──────────┴─────────┘
```

**Key point**: UIDs 102-104 were deleted and will never be reused in this folder.

### UID and Folder Moves

When you move a message:

1. Original UID is deleted (becomes invalid)
2. Message appears in destination folder with new UID
3. Both old and new UIDs are unique and never reused

```
Move message UID 105 from INBOX to Archive:

INBOX (before):          Archive (before):
UID 105 → deleted        UID 50
                         UID 51

INBOX (after):           Archive (after):
UID 106                  UID 50
UID 107                  UID 51
                         UID 52 ← same message, new UID
```

## The `emailId` Property

### What It Is

A **stable identifier for the email entity itself** that never changes, even when moved or copied.

**Example**: `"187a29df5a2"`

### Characteristics

- **Permanent**: Never changes throughout email's lifetime
- **Cross-folder**: Same ID for all copies of the message
- **Provider-specific**: Requires special IMAP extensions
- **Limited availability**: Gmail, Yahoo, Fastmail, some others

### When to Use

Use `emailId` when you need to track messages across folders:

```javascript
// Track message regardless of folder location
const message1 = await getMessage('account1', id1);
const message2 = await getMessage('account1', id2);

if (message1.emailId === message2.emailId) {
  console.log('Same email in different folders');
}
```

### Availability

**Supported providers**:
- Gmail (via X-GM-MSGID)
- Yahoo
- Fastmail
- iCloud (sometimes)
- Some modern IMAP servers

**Not supported**:
- Microsoft Exchange
- Most traditional IMAP servers
- Self-hosted email servers (unless using specific extensions)

**Checking availability**:

```javascript
if (message.emailId) {
  // Use emailId for tracking
} else {
  // Fall back to messageId
}
```

### Example: Cross-Folder Tracking

```javascript
// User moves email from INBOX to Archive
// Webhook 1: messageDeleted from INBOX
{
  "event": "messageDeleted",
  "path": "INBOX",
  "data": {
    "id": "AAAADAAAB40",
    "emailId": "187a29df5a2"
  }
}

// Webhook 2: messageNew in Archive
{
  "event": "messageNew",
  "path": "Archive",
  "data": {
    "id": "AAAAFAAAC12",  // Different id
    "emailId": "187a29df5a2"  // Same emailId!
  }
}

// Can detect this is a move, not delete+new
```

## The `messageId` Property

### What It Is

The value from the email's `Message-ID` header, intended to be globally unique.

**Example**: `"<01000187a29df5a2@example.com>"`

### Characteristics

- **From email header**: Standard RFC 5322 Message-ID header
- **Globally unique** (in theory): Intended to be unique across all emails
- **Permanent**: Never changes
- **Not enforced**: Senders can reuse IDs or omit them
- **Universally available**: Present in all standard emails

### When to Use

Use `messageId` for:

1. **Integration with external systems**: Many systems use Message-ID
2. **Deduplication**: Detect duplicate email processing
3. **Thread tracking**: Link to `inReplyTo` and `references` headers
4. **CRM integrations**: Track emails across multiple accounts

### Example: Deduplication

```javascript
const processedIds = new Set();

function processWebhook(webhook) {
  const messageId = webhook.data.messageId;

  // Skip if no messageId (spam indicator)
  if (!messageId) {
    return;
  }

  // Check if already processed
  if (processedIds.has(messageId)) {
    console.log('Duplicate - already processed');
    return;
  }

  // Process email
  processedIds.add(messageId);
  handleNewEmail(webhook.data);
}
```

### Reliability Considerations

**Good indicators**:
- Properly formatted: `<unique-id@domain.com>`
- Domain matches sender domain
- Unique across your system

**Spam indicators**:
- Missing Message-ID
- Duplicate Message-ID across different emails
- Malformed format
- Suspiciously generic IDs

```javascript
function isValidMessageId(messageId) {
  if (!messageId) {
    return false; // Missing
  }

  if (!messageId.match(/^<.+@.+>$/)) {
    return false; // Malformed
  }

  // Further validation...
  return true;
}
```

### Searching by Message-ID

Use header search to find emails by Message-ID:

```bash
POST /v1/account/{account}/search
Content-Type: application/json

{
  "search": {
    "header": {
      "Message-ID": "<123@abc.example.com>"
    }
  }
}
```

### Thread Tracking

The `messageId` property works with related headers:

```javascript
{
  "messageId": "<current-message@example.com>",
  "inReplyTo": "<parent-message@example.com>",
  "references": [
    "<original-message@example.com>",
    "<parent-message@example.com>"
  ]
}
```

**Building a thread**:
1. Start with `messageId` of first message
2. Find replies where `inReplyTo` matches
3. Follow `references` chain
4. Build complete conversation thread

## Sequence Numbers

### What They Are

IMAP sequence numbers represent a message's position within a folder (1, 2, 3, ...).

### Characteristics

- **Core to IMAP protocol**: Used internally by IMAP
- **Session-specific**: Can change between sessions
- **Position-based**: Message at position 1, 2, 3, etc.
- **Not stable**: Changes when messages are added/deleted
- **Not exposed**: EmailEngine doesn't expose them through public API

### Why EmailEngine Doesn't Use Them

Sequence numbers are unreliable for API use:

```
INBOX before:           INBOX after delete:
Seq 1: Message A        Seq 1: Message B  ← Was Seq 2!
Seq 2: Message B        Seq 2: Message C  ← Was Seq 3!
Seq 3: Message C        Seq 3: Message D  ← Was Seq 4!
Seq 4: Message D
```

**Problem**: Deleting Seq 1 changes all subsequent sequence numbers.

**Solution**: EmailEngine uses `uid` instead, which never changes.

## Choosing the Right Identifier

### Decision Tree

```
┌─────────────────────────────────┐
│ What's your use case?           │
└─────────────────────────────────┘
           │
           ├─→ EmailEngine API operations?
           │   → Use `id`
           │
           ├─→ Range-based searches?
           │   → Use `uid`
           │
           ├─→ Track across folder moves?
           │   ├─→ Gmail/Yahoo account?
           │   │   → Use `emailId`
           │   └─→ Other providers?
           │       → Use `messageId`
           │
           └─→ External system integration?
               → Use `messageId`
```

### Use Case Examples

**1. Display message in UI**

```javascript
// User clicks message in inbox
const messageId = 'AAAADAAAB40'; // From list API

// Fetch full details
const message = await fetch(
  `/v1/account/${account}/message/${messageId}`
);

// Display to user
showMessage(message);
```

**Use**: `id`

**2. Sync messages to database**

```javascript
// Initial sync
const messages = await listMessages(account, 'INBOX');

messages.forEach(msg => {
  db.upsert({
    account: account,
    messageId: msg.messageId,  // Primary key
    emailId: msg.emailId || null,
    subject: msg.subject,
    // ... other fields
  });
});
```

**Use**: `messageId` (primary), `emailId` (if available)

**3. Track email in CRM**

```javascript
// New email webhook
function handleWebhook(webhook) {
  const messageId = webhook.data.messageId;

  // Check if already in CRM
  const existing = crm.findEmail(messageId);

  if (existing) {
    // Update existing record
    crm.updateEmail(messageId, webhook.data);
  } else {
    // Create new record
    crm.createEmail(messageId, webhook.data);
  }
}
```

**Use**: `messageId`

**4. Detect folder moves**

```javascript
// Gmail/Yahoo account
function handleMessageDeleted(webhook) {
  const emailId = webhook.data.emailId;

  // Wait briefly for messageNew event
  setTimeout(() => {
    const newLocation = findByEmailId(emailId);

    if (newLocation) {
      console.log('Message moved to:', newLocation.path);
    } else {
      console.log('Message permanently deleted');
    }
  }, 1000);
}
```

**Use**: `emailId` (Gmail/Yahoo only)

**5. Bulk operations**

```bash
# Delete all messages with UID between 100 and 500
POST /v1/account/{account}/messages/delete

{
  "search": {
    "uid": "100:500"
  }
}
```

**Use**: `uid`

## Best Practices

### 1. Store Multiple Identifiers

When syncing to your database, store all available identifiers:

```sql
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255),
  ee_id VARCHAR(255),        -- EmailEngine id
  uid INTEGER,                -- IMAP UID
  email_id VARCHAR(255),      -- Gmail/Yahoo emailId
  message_id VARCHAR(255),    -- Message-ID header
  subject TEXT,
  -- ... other fields
  UNIQUE (account, message_id)
);
```

### 2. Handle Missing emailId Gracefully

```javascript
function trackEmail(message) {
  // Prefer emailId if available
  const primaryId = message.emailId || message.messageId;

  db.upsert({
    primaryId: primaryId,
    emailId: message.emailId,
    messageId: message.messageId,
    // ... other fields
  });
}
```

### 3. Validate messageId

```javascript
function isReliableMessageId(messageId) {
  if (!messageId) {
    return false;
  }

  // Check format
  if (!messageId.match(/^<[^>]+@[^>]+>$/)) {
    return false;
  }

  // Check for suspicious patterns
  if (messageId === '<>') {
    return false;
  }

  return true;
}
```

### 4. Use id for All API Calls

```javascript
// CORRECT
const message = await getByEmailId(emailId);
await deleteMessage(account, message.id);  // Use id from API response

// WRONG
await deleteMessage(account, emailId);  // emailId won't work
```

### 5. Handle Move Events

```javascript
function handleWebhooks(webhook) {
  if (webhook.event === 'messageDeleted') {
    // Don't immediately delete from database
    // Might be a move operation
    scheduleCleanup(webhook.data.messageId, delay='5s');
  }

  if (webhook.event === 'messageNew') {
    // Cancel scheduled cleanup if it's a move
    const messageId = webhook.data.messageId;
    cancelCleanup(messageId);

    // Update location
    updateEmailLocation(messageId, webhook.path);
  }
}
```

## Common Pitfalls

### 1. Reusing Old IDs After Moves

```javascript
// WRONG
const message = await getMessage(account, oldId);
await moveMessage(account, oldId, 'Archive');

// Try to update (will fail!)
await updateMessage(account, oldId, {seen: true});
// Error: Message not found

// CORRECT
const moveResponse = await moveMessage(account, oldId, 'Archive');
const newId = moveResponse.id;

await updateMessage(account, newId, {seen: true});
```

### 2. Assuming emailId is Always Available

```javascript
// WRONG
function trackMessage(message) {
  db.save({
    id: message.emailId,  // undefined for most providers!
    // ...
  });
}

// CORRECT
function trackMessage(message) {
  const trackingId = message.emailId || message.messageId || message.id;
  db.save({
    id: trackingId,
    // ...
  });
}
```

### 3. Not Validating messageId

```javascript
// WRONG - spam emails might have no messageId
processedIds.add(message.messageId);  // Adds 'undefined'!

// CORRECT
if (message.messageId) {
  processedIds.add(message.messageId);
} else {
  console.log('Skipping email with no Message-ID (likely spam)');
}
```

## Summary

| Identifier | When to Use | Stability | Availability |
|------------|-------------|-----------|--------------|
| **id** | EmailEngine API calls | Stable within folder | Always |
| **uid** | Range searches, IMAP ops | Stable within folder | Always |
| **emailId** | Cross-folder tracking | Permanent | Gmail/Yahoo/Fastmail |
| **messageId** | External integration, dedup | Permanent | Almost always |
| **Sequence** | Don't use | Session-only | Internal only |

**General guidance**:
- **Use `id`** for most EmailEngine API operations
- **Use `uid`** for range-based searches
- **Use `emailId`** for cross-folder tracking (if available)
- **Use `messageId`** for external integration and deduplication
- **Store all identifiers** in your database for maximum flexibility

## See Also

- [Receiving Emails](/docs/receiving/index.md)
- [Webhooks](/docs/usage/webhooks.md)
- [CRM Integration](/docs/integrations/crm.md)
- [API Reference](/docs/api-reference/index.md)

## Resources

- **RFC 3501 (IMAP)**: [IMAP UID definition](https://tools.ietf.org/html/rfc3501#section-2.3.1.1)
- **RFC 5322**: [Message-ID header specification](https://tools.ietf.org/html/rfc5322#section-3.6.4)
- **Gmail IMAP Extensions**: [X-GM-MSGID documentation](https://developers.google.com/gmail/imap/imap-extensions)
