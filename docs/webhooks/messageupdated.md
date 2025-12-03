---
title: "messageUpdated"
sidebar_position: 5
description: "Webhook event triggered when email flags or labels change on a message"
---

# messageUpdated

The `messageUpdated` webhook event is triggered when EmailEngine detects that the flags or labels on a message have changed. This event enables real-time synchronization of message state changes with external systems.

## When This Event is Triggered

The `messageUpdated` event fires when:

- A message is marked as read (\Seen flag added)
- A message is marked as unread (\Seen flag removed)
- A message is flagged/starred (\Flagged flag added)
- A message is unflagged (\Flagged flag removed)
- A message is replied to (\Answered flag added)
- A draft flag is changed (\Draft flag added/removed)
- Custom IMAP flags are added or removed
- Gmail labels are added or removed (Gmail API accounts only)

The event is triggered after EmailEngine confirms the flag/label change on the mail server.

## Common Use Cases

- **Read status synchronization** - Track when users read emails across devices
- **Priority tracking** - Monitor flagged/starred message changes
- **CRM integration** - Update ticket status when emails are marked as handled
- **Analytics** - Track user engagement patterns and response times
- **Label-based workflow** - Trigger actions based on Gmail label changes
- **Archival systems** - Update message metadata when flags change
- **Notification systems** - Alert when important messages are flagged

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID where the message was updated |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Mailbox folder path (e.g., "INBOX", "Sent Mail") |
| `specialUse` | string | No | Special use flag of the folder (e.g., "\Inbox", "\Sent") |
| `event` | string | Yes | Event type, always "messageUpdated" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Message update data (see below) |

### Message Data Fields (`data` object)

#### All Account Types

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EmailEngine's unique message ID (base64url encoded for IMAP, Gmail ID for Gmail API) |
| `uid` | number | IMAP only | IMAP UID of the message within the folder |
| `threadId` | string | Gmail only | Gmail thread ID the message belongs to |
| `changes` | object | Yes | Object describing what changed (see below) |

### Changes Object Structure

The `changes` object contains flag and/or label changes:

#### Flag Changes (`changes.flags`)

| Field | Type | Description |
|-------|------|-------------|
| `added` | array | Array of flags that were added (e.g., `["\Seen"]`) |
| `deleted` | array | Array of flags that were removed (e.g., `["\Flagged"]`) |
| `value` | array | Complete current flag list after the change |

#### Label Changes (`changes.labels`) - Gmail Only

| Field | Type | Description |
|-------|------|-------------|
| `added` | array | Array of labels that were added (e.g., `["IMPORTANT"]`) |
| `deleted` | array | Array of labels that were removed (e.g., `["INBOX"]`) |
| `value` | array | Complete current label list after the change |

### Common IMAP Flags

| Flag | Description |
|------|-------------|
| `\Seen` | Message has been read |
| `\Answered` | Message has been replied to |
| `\Flagged` | Message is flagged/starred |
| `\Deleted` | Message is marked for deletion |
| `\Draft` | Message is a draft |

### Common Gmail Labels

| Label | Description |
|-------|-------------|
| `INBOX` | Message is in inbox |
| `SENT` | Message is in sent folder |
| `DRAFT` | Message is a draft |
| `TRASH` | Message is in trash |
| `SPAM` | Message is marked as spam |
| `STARRED` | Message is starred |
| `IMPORTANT` | Message is marked important |
| `UNREAD` | Message is unread |

## Example Payloads

### IMAP Account - Message Marked as Read

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:43:46.195Z",
  "path": "INBOX",
  "specialUse": "\Inbox",
  "event": "messageUpdated",
  "eventId": "c36ab19a-58cc-4372-a567-0e02b2c3d479",
  "data": {
    "id": "AAAADAAABy4",
    "uid": 1838,
    "changes": {
      "flags": {
        "added": ["\Seen"],
        "value": ["\Seen"]
      }
    }
  }
}
```

### IMAP Account - Message Flagged and Read

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T07:15:22.456Z",
  "path": "INBOX",
  "specialUse": "\Inbox",
  "event": "messageUpdated",
  "eventId": "d47bc20a-69dd-4483-b678-1f13c3d4e590",
  "data": {
    "id": "AAAADAAABy8",
    "uid": 1845,
    "changes": {
      "flags": {
        "added": ["\Seen", "\Flagged"],
        "value": ["\Seen", "\Flagged"]
      }
    }
  }
}
```

### IMAP Account - Message Unflagged

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T08:30:15.789Z",
  "path": "INBOX",
  "specialUse": "\Inbox",
  "event": "messageUpdated",
  "eventId": "e58cd31b-7aee-5594-c789-2g24d4e5f6a1",
  "data": {
    "id": "AAAADAAABy8",
    "uid": 1845,
    "changes": {
      "flags": {
        "deleted": ["\Flagged"],
        "value": ["\Seen"]
      }
    }
  }
}
```

### Gmail API Account - Label Added

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T09:45:30.123Z",
  "path": "[Gmail]/All Mail",
  "event": "messageUpdated",
  "eventId": "f69de42c-8bff-6605-d890-3h35e5f6g7b2",
  "data": {
    "id": "18b5c7d8e9f01234",
    "threadId": "18b5c7d8e9f01234",
    "changes": {
      "labels": {
        "added": ["IMPORTANT"],
        "value": ["INBOX", "IMPORTANT", "UNREAD"]
      }
    }
  }
}
```

### Gmail API Account - Multiple Changes

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T10:00:00.000Z",
  "path": "[Gmail]/All Mail",
  "event": "messageUpdated",
  "eventId": "a70ef53d-9c00-7716-e9a1-4i46f6g7h8c3",
  "data": {
    "id": "18b5c7d8e9f01234",
    "threadId": "18b5c7d8e9f01234",
    "changes": {
      "flags": {
        "added": ["\Seen"],
        "value": ["\Seen", "\Flagged"]
      },
      "labels": {
        "added": ["STARRED"],
        "deleted": ["UNREAD"],
        "value": ["INBOX", "IMPORTANT", "STARRED"]
      }
    }
  }
}
```

### Microsoft Outlook Account - Message Read

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user",
  "date": "2025-10-17T11:20:45.678Z",
  "path": "Inbox",
  "event": "messageUpdated",
  "eventId": "b81fg64e-ad11-8827-fa2b-5j57g7h8i9d4",
  "data": {
    "id": "AAMkADI2NGVhZTVlLTI1OGItNDUwZS05ZDVkLWQzN2E2MDUyYzc3YQBGAAAAAAI",
    "changes": {
      "flags": {
        "added": ["\Seen"],
        "value": ["\Seen"]
      }
    }
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleMessageUpdated(event) {
  const { account, path, data } = event;
  const { changes } = data;

  console.log(`Message ${data.id} updated in ${account}:`);

  if (changes.flags) {
    if (changes.flags.added?.length) {
      console.log(`  Flags added: ${changes.flags.added.join(', ')}`);
    }
    if (changes.flags.deleted?.length) {
      console.log(`  Flags removed: ${changes.flags.deleted.join(', ')}`);
    }
    console.log(`  Current flags: ${changes.flags.value.join(', ')}`);
  }

  if (changes.labels) {
    if (changes.labels.added?.length) {
      console.log(`  Labels added: ${changes.labels.added.join(', ')}`);
    }
    if (changes.labels.deleted?.length) {
      console.log(`  Labels removed: ${changes.labels.deleted.join(', ')}`);
    }
    console.log(`  Current labels: ${changes.labels.value.join(', ')}`);
  }
}
```

### Track Read Status

```javascript
async function handleMessageUpdated(event) {
  const { account, data } = event;
  const { changes } = data;

  // Check if message was marked as read
  if (changes.flags?.added?.includes('\Seen')) {
    await db.messages.update({
      where: {
        accountId: account,
        messageId: data.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
    console.log(`Message ${data.id} marked as read`);
  }

  // Check if message was marked as unread
  if (changes.flags?.deleted?.includes('\Seen')) {
    await db.messages.update({
      where: {
        accountId: account,
        messageId: data.id
      },
      data: {
        isRead: false,
        readAt: null
      }
    });
    console.log(`Message ${data.id} marked as unread`);
  }
}
```

### Track Flagged Messages

```javascript
async function handleMessageUpdated(event) {
  const { account, data } = event;
  const { changes } = data;

  const isFlagged = changes.flags?.value?.includes('\Flagged');

  if (changes.flags?.added?.includes('\Flagged')) {
    // Message was flagged
    await notifyPriorityMessage(account, data.id);
    await db.messages.update({
      where: { accountId: account, messageId: data.id },
      data: { isFlagged: true, flaggedAt: new Date() }
    });
  }

  if (changes.flags?.deleted?.includes('\Flagged')) {
    // Message was unflagged
    await db.messages.update({
      where: { accountId: account, messageId: data.id },
      data: { isFlagged: false, flaggedAt: null }
    });
  }
}
```

### Gmail Label-Based Workflow

```javascript
async function handleMessageUpdated(event) {
  const { account, data } = event;
  const { changes } = data;

  if (!changes.labels) return;

  // Trigger workflow when message is labeled "Work/Urgent"
  if (changes.labels.added?.includes('Work/Urgent')) {
    await triggerUrgentWorkflow(account, data.id);
  }

  // Archive action when removed from INBOX
  if (changes.labels.deleted?.includes('INBOX')) {
    await markAsArchived(account, data.id);
  }

  // Move to CRM when "Customer" label is added
  if (changes.labels.added?.includes('Customer')) {
    await syncToCRM(account, data.id);
  }
}
```

## Important Considerations

### Changes Object Structure

The `changes` object only includes the fields that actually changed:

- If only flags changed, `changes.labels` will be absent
- If only labels changed, `changes.flags` will be absent
- Within each change type, `added` and `deleted` arrays are only present if there are items in them

Always check for the existence of these fields before accessing them:

```javascript
// Safe access pattern
const flagsAdded = data.changes.flags?.added || [];
const flagsDeleted = data.changes.flags?.deleted || [];
const currentFlags = data.changes.flags?.value || [];
```

### IMAP Indexer Mode

For standard IMAP accounts, the `messageUpdated` event is only triggered when using the "full" IMAP indexer mode (default). In "fast" indexer mode, flag changes are not tracked because the full message list is not maintained.

### Recent Flag

The `\Recent` flag is a session-specific IMAP flag and is not tracked by EmailEngine. Changes to this flag will not trigger `messageUpdated` events.

### Event Deduplication

EmailEngine implements rolling bucket locks to prevent duplicate `messageUpdated` events for the same message within a short time window. If the same flag change is detected multiple times rapidly, only the first event is sent.

### Gmail Labels vs IMAP Flags

For Gmail API accounts, both `flags` and `labels` may be present in the same event:

- **Flags** represent standard email states (\Seen, \Flagged, \Answered, \Draft)
- **Labels** represent Gmail-specific categorization

Some Gmail labels map to IMAP flags:
- `STARRED` maps to `\Flagged`
- `UNREAD` absence maps to `\Seen`

## Related Events

- [messageNew](/docs/webhooks/messagenew) - Triggered when a new message arrives
- [messageDeleted](/docs/webhooks/messagedeleted) - Triggered when a message is removed
- [mailboxNew](/docs/webhooks/mailboxnew) - Triggered when a new folder is created

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Message Operations](/docs/receiving/message-operations) - Working with messages via API
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
