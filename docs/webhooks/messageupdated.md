---
title: "messageUpdated"
sidebar_position: 5
description: "Webhook event triggered when email flags or labels change on a message"
---

# messageUpdated

The `messageUpdated` webhook event is triggered when EmailEngine detects that the flags or labels on a message have changed. This event enables real-time synchronization of message state changes with external systems.

## When This Event is Triggered

The `messageUpdated` event fires when:

- A message is marked as read (`\Seen` flag added) or unread (`\Seen` flag removed)
- A message is flagged or starred (`\Flagged` flag added) or unflagged
- A message is replied to (`\Answered` flag added) or forwarded (`$Forwarded` keyword added)
- A draft flag is changed (`\Draft` flag added or removed)
- Any other IMAP flag or keyword is added or removed
- Gmail labels are added or removed, on Gmail API accounts and on Gmail over IMAP

How the change is detected depends on the account type:

- **IMAP**: an untagged `FETCH` response reports new flags, or a resync compares the stored flags with the server's. Requires the full [indexer](/docs/accounts/imap-indexers), which is the default; the fast indexer keeps no flag state and never sends this event. The session-specific `\Recent` flag is ignored
- **Gmail API**: the Gmail history reports labels added to or removed from a message. `UNREAD`, `STARRED` and `DRAFT` are reported as flag changes, the other labels as label changes
- **MS Graph**: a change notification reports the message as updated. Graph does not say what changed, so EmailEngine fetches the current state and reports only the full flag list. Repeated notifications with the same flags within a short window are reported once

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL, `null` if not set |
| `account` | string | Yes | Account ID where the message was updated |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Folder of the message. IMAP and MS Graph accounts report the folder path (for example `INBOX`). Gmail API accounts report `\All` |
| `specialUse` | string | No | Special use flag of the folder, for example `\Inbox` or `\Sent`. Gmail API accounts report `\All` |
| `event` | string | Yes | Always `messageUpdated` |
| `data` | object | Yes | Message update data (see below) |

The unique event identifier is sent as the HTTP header `X-EE-Wh-Event-Id`, not in the JSON payload.

### Message Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EmailEngine message ID. Base64url-packed folder and UID for IMAP, the provider's message ID for Gmail API and MS Graph |
| `uid` | number | IMAP only | IMAP UID of the message within the folder |
| `threadId` | string | Gmail API and MS Graph only | Gmail thread ID or Graph conversation ID |
| `changes` | object | Yes | What changed (see below) |

### Changes Object Structure

The `changes` object has a `flags` member, a `labels` member, or both, and only for the kind of value that changed.

#### Flag Changes (`changes.flags`)

| Field | Type | Description |
|-------|------|-------------|
| `added` | array | Flags that were added. Present only when something was added. Never sent for MS Graph accounts |
| `deleted` | array | Flags that were removed. Present only when something was removed. Never sent for MS Graph accounts |
| `value` | array | Complete flag list after the change |

#### Label Changes (`changes.labels`)

Sent for Gmail API accounts and for Gmail accounts connected over IMAP.

| Field | Type | Description |
|-------|------|-------------|
| `added` | array | Labels that were added. Present only when something was added |
| `deleted` | array | Labels that were removed. Present only when something was removed |
| `value` | array | Complete label list after the change |

### How Gmail Labels are Represented

Gmail system labels are reported by their IMAP special-use name: `\Inbox`, `\Sent`, `\Trash`, `\Drafts` and `\Junk`. `UNREAD`, `STARRED` and `DRAFT` never appear as labels; they are reported as the `\Seen` (absent), `\Flagged` and `\Draft` flags instead. `IMPORTANT` and the `CATEGORY_*` tab labels are not reported at all.

User-defined labels are reported by name in `added` and `deleted`, and by Gmail label ID (for example `Label_42`) in `value`, on Gmail API accounts. Over IMAP, Gmail reports user labels by name everywhere.

### Common IMAP Flags

| Flag | Description |
|------|-------------|
| `\Seen` | Message has been read |
| `\Answered` | Message has been replied to |
| `\Flagged` | Message is flagged/starred |
| `\Deleted` | Message is marked for deletion |
| `\Draft` | Message is a draft |
| `$Forwarded` | Message has been forwarded |

## Example Payloads

### IMAP Account - Message Marked as Read

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:43:46.195Z",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "event": "messageUpdated",
  "data": {
    "id": "AAAADAAABy4",
    "uid": 1838,
    "changes": {
      "flags": {
        "added": ["\\Seen"],
        "value": ["\\Seen"]
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
  "specialUse": "\\Inbox",
  "event": "messageUpdated",
  "data": {
    "id": "AAAADAAABy8",
    "uid": 1845,
    "changes": {
      "flags": {
        "added": ["\\Seen", "\\Flagged"],
        "value": ["\\Seen", "\\Flagged"]
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
  "specialUse": "\\Inbox",
  "event": "messageUpdated",
  "data": {
    "id": "AAAADAAABy8",
    "uid": 1845,
    "changes": {
      "flags": {
        "deleted": ["\\Flagged"],
        "value": ["\\Seen"]
      }
    }
  }
}
```

### Gmail API Account - Label Added

A user label named `Customers` (label ID `Label_42`) added to a message in the Inbox:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T09:45:30.123Z",
  "path": "\\All",
  "specialUse": "\\All",
  "event": "messageUpdated",
  "data": {
    "id": "18b5c7d8e9f01234",
    "threadId": "18b5c7d8e9f01234",
    "changes": {
      "labels": {
        "added": ["Customers"],
        "value": ["\\Inbox", "Label_42"]
      }
    }
  }
}
```

### Gmail API Account - Archived and Read

Removing `INBOX` and `UNREAD` in one change:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T10:00:00.000Z",
  "path": "\\All",
  "specialUse": "\\All",
  "event": "messageUpdated",
  "data": {
    "id": "18b5c7d8e9f01234",
    "threadId": "18b5c7d8e9f01234",
    "changes": {
      "flags": {
        "added": ["\\Seen"],
        "value": ["\\Seen"]
      },
      "labels": {
        "deleted": ["\\Inbox"],
        "value": ["Label_42"]
      }
    }
  }
}
```

### Microsoft Outlook Account - Message Read

Only the full flag list is reported:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user",
  "date": "2025-10-17T11:20:45.678Z",
  "path": "Inbox",
  "specialUse": "\\Inbox",
  "event": "messageUpdated",
  "data": {
    "id": "AAMkADI2NGVhZTVlLTI1OGItNDUwZS05ZDVkLWQzN2E2MDUyYzc3YQBGAAAAAAI",
    "threadId": "AAQkADI2NGVhZTVlLTI1OGItNDUwZS05ZDVkLWQzN2E2MDUyYzc3YQAQAJ5X",
    "changes": {
      "flags": {
        "value": ["\\Seen"]
      }
    }
  }
}
```

## Handling the Event

The `changes` object carries only what changed, and MS Graph accounts send `value` without `added` or `deleted`, so derive state from `value` and treat the deltas as optional. In JavaScript source the backslash in a flag name has to be escaped:

```javascript
async function handleMessageUpdated(event) {
  const { account, data } = event;
  const { flags, labels } = data.changes;

  if (flags) {
    await db.messages.update({
      where: { accountId: account, messageId: data.id },
      data: {
        isRead: flags.value.includes('\\Seen'),
        isFlagged: flags.value.includes('\\Flagged')
      }
    });
  }

  if (labels) {
    // Gmail only. A removed \Inbox label means the message was archived
    if (labels.deleted?.includes('\\Inbox')) {
      await markAsArchived(account, data.id);
    }

    await db.messages.update({
      where: { accountId: account, messageId: data.id },
      data: { labels: labels.value }
    });
  }
}
```

## Important Considerations

### Changes Object Structure

The `changes` object only includes what changed:

- If only flags changed, `changes.labels` is absent
- If only labels changed, `changes.flags` is absent
- Within each, `added` and `deleted` are present only when they have entries, and MS Graph accounts never send them

Always check for the existence of these fields before accessing them:

```javascript
const flagsAdded = data.changes.flags?.added || [];
const flagsDeleted = data.changes.flags?.deleted || [];
const currentFlags = data.changes.flags?.value || [];
```

### Flags on API Accounts

Gmail API and MS Graph accounts have no IMAP flags. EmailEngine derives them: on Gmail from the `UNREAD`, `STARRED` and `DRAFT` labels, on Graph from the `isRead`, `isDraft` and `flag` properties. `\Answered` is not available on either.

## Related Events

- [messageNew](/docs/webhooks/messagenew) - Triggered when a new message arrives
- [messageDeleted](/docs/webhooks/messagedeleted) - Triggered when a message is removed
- [mailboxNew](/docs/webhooks/mailboxnew) - Triggered when a new folder is created

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Delivery, retries, headers and signing
- [Message Operations](/docs/receiving/message-operations) - Changing flags and labels through the API
- [IMAP indexers](/docs/accounts/imap-indexers) - Why the fast indexer never reports flag changes
- [Tracking replies](/docs/receiving/tracking-replies) - Using the `\Answered` flag
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
