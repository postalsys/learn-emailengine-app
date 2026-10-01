---
title: "messageDeleted"
sidebar_position: 4
description: "Webhook event triggered when a previously present email is no longer found in a folder"
---

# messageDeleted

The `messageDeleted` webhook event is triggered when EmailEngine detects that a previously tracked email has been removed from a mailbox folder. This event helps you keep external systems synchronized with mailbox state changes.

## When This Event is Triggered

How a deletion is detected depends on the account type:

- **IMAP**: the server reports an expunge for a message EmailEngine has indexed (an untagged `EXPUNGE` or, with QRESYNC, `VANISHED`), or a resync finds an indexed UID gone. Moving a message to another folder removes it from the source folder, so a move produces `messageDeleted` for the source folder and [`messageNew`](/docs/webhooks/messagenew) for the destination
- **Gmail API**: the Gmail history reports the message as deleted, which happens when it is permanently deleted. Moving a message to Trash or removing a label is a label change, reported as [`messageUpdated`](/docs/webhooks/messageupdated)
- **MS Graph**: a change notification reports the message as deleted and EmailEngine confirms that it no longer exists. A message that still exists was moved, and no event is sent, because Graph does not report which folder it left

:::note Requires the full indexer
On IMAP accounts, deletions are detected only under the full [indexer](/docs/accounts/imap-indexers), which is the default. The fast indexer tracks the highest UID it has seen and nothing else, so it never notices a message going away.
:::

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL, `null` if not set |
| `account` | string | Yes | Account ID where the message was deleted |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Folder the message was removed from. IMAP accounts report the folder path (for example `INBOX`). Gmail API and MS Graph accounts report `\All`, because their change feeds are not folder-specific |
| `specialUse` | string | No | Special use flag of the folder, for example `\Inbox` or `\Trash`. Gmail API and MS Graph accounts report `\All` |
| `event` | string | Yes | Always `messageDeleted` |
| `data` | object | Yes | Message identification data (see below) |

The unique event identifier is sent as the HTTP header `X-EE-Wh-Event-Id`, not in the JSON payload.

### Message Data Fields (`data` object)

The `messageDeleted` event includes minimal data since the message content is no longer available:

#### IMAP Accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EmailEngine message ID (base64url-packed folder and UID) |
| `uid` | number | Yes | IMAP UID of the deleted message within the folder |

#### Gmail API Accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Gmail message ID |
| `threadId` | string | No | Gmail thread ID the message belonged to |
| `flags` | array | Yes | Last known flags, derived from the labels: `\Seen` unless `UNREAD`, `\Flagged` for `STARRED`, `\Draft` for `DRAFT` |
| `labels` | array | Yes | Last known labels. System labels use their IMAP special-use names (`\Inbox`, `\Sent`, `\Trash`, `\Drafts`, `\Junk`), other labels are Gmail label IDs |
| `category` | string | No | Last known inbox tab (`primary`, `social`, `promotions`, `updates`, `forums`), set for messages that were in the Inbox |

#### Microsoft Graph (Outlook) Accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Graph message ID |

## Example Payloads

### IMAP Account

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:44:14.660Z",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "event": "messageDeleted",
  "data": {
    "id": "AAAADAAABy4",
    "uid": 1838
  }
}
```

### Gmail API Account

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T08:15:22.123Z",
  "path": "\\All",
  "specialUse": "\\All",
  "event": "messageDeleted",
  "data": {
    "id": "18b5c7d8e9f01234",
    "threadId": "18b5c7d8e9f01234",
    "flags": ["\\Seen"],
    "labels": ["\\Inbox", "Label_42"],
    "category": "primary"
  }
}
```

### Microsoft Outlook Account

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user",
  "date": "2025-10-17T09:30:45.789Z",
  "path": "\\All",
  "specialUse": "\\All",
  "event": "messageDeleted",
  "data": {
    "id": "AAMkADI2NGVhZTVlLTI1OGItNDUwZS05ZDVkLWQzN2E2MDUyYzc3YQBGAAAAAAI"
  }
}
```

## Handling the Event

The message content is gone by the time the event arrives, so the handler works on the identifiers alone. The event identifier is in the `X-EE-Wh-Event-Id` request header, not the body, and a retried delivery carries the same one, so make the removal tolerate a record that is already gone:

```javascript
async function handleMessageDeleted(event, headers) {
  const { account, path, date, data } = event;
  const eventId = headers['x-ee-wh-event-id'];

  const stored = await db.messages.findUnique({
    where: { accountId: account, messageId: data.id }
  });

  if (!stored) {
    // Never recorded, or already removed by an earlier delivery of this event
    return;
  }

  await db.messages.delete({
    where: { accountId: account, messageId: data.id }
  });

  await auditLog.create({
    eventId,
    timestamp: new Date(date),
    account,
    action: 'message_deleted',
    folder: path,
    messageId: data.id,
    uid: data.uid || null
  });
}
```

## Important Considerations

### Message Content is Unavailable

When a `messageDeleted` event is received, the message content is no longer available on the server. The webhook only provides identification data (`id`, `uid`, `threadId`) to help you locate and remove records in your external systems.

If you need message content for deletion processing (e.g., archiving before deletion), you should:
1. Store message metadata when handling `messageNew` events
2. Reference that stored data when processing deletions

### Deletion vs. Move

On IMAP accounts a message moved between folders produces:
1. A `messageDeleted` event for the source folder
2. A `messageNew` event for the destination folder

The two events carry different `id` values, because the ID encodes the folder. To tell a move from a deletion, match the `messageId` (the Message-ID header) of a `messageNew` event that arrives shortly after against the message you recorded under the deleted `id`. The `seemsLikeNew` field of `messageNew` is `false` for a message EmailEngine has seen before on the account.

### Idempotency

A delivery that failed or timed out is retried with the same `X-EE-Wh-Event-Id`, so the same deletion can arrive more than once. The handler above returns early when the record is already gone.

## Related Events

- [messageNew](/docs/webhooks/messagenew) - Triggered when a new message arrives
- [messageUpdated](/docs/webhooks/messageupdated) - Triggered when flags/labels change
- [mailboxDeleted](/docs/webhooks/mailboxdeleted) - Triggered when an entire folder is deleted

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Delivery, retries, headers and signing
- [Tracking deleted messages](/docs/receiving/tracking-deleted) - Keeping an external copy in step with the mailbox
- [IMAP indexers](/docs/accounts/imap-indexers) - Why the fast indexer never reports deletions
- [Message Operations](/docs/receiving/message-operations) - Working with messages via API
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
