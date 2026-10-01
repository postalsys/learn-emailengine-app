---
title: "mailboxDeleted"
sidebar_position: 13
description: "Webhook event triggered when a previously tracked folder is no longer found on the mail server"
---

# mailboxDeleted

The `mailboxDeleted` webhook event is triggered when a folder that EmailEngine was tracking for an IMAP account is no longer on the mail server, or has been deleted through the API. It tells your application to drop whatever it holds for that folder.

## When This Event is Triggered

The `mailboxDeleted` event fires when:

- A folder that was in the account's stored folder listing is missing from the listing the server returns on the next sync. EmailEngine does not learn why: the user deleted it in a mail client, an administrator removed it, a retention policy purged it, or the account lost access to it
- A folder is deleted through the [Delete Mailbox API](/docs/api/delete-v-1-account-account-mailbox)

A rename is a deletion followed by a creation as far as the folder listing is concerned, so it produces `mailboxDeleted` for the old path and [`mailboxNew`](/docs/webhooks/mailboxnew) for the new one.

The event covers only folders EmailEngine knew about. A folder created and deleted between two listings is never seen. Nothing is sent when an account is deleted or flushed, even though EmailEngine drops its folder state then.

Exactly one event is sent per disappearance. Before EmailEngine 2.80.0 a folder deleted through the API could be announced twice, once by the deletion and again by the next listing pass, and a folder EmailEngine tracked without a stored listing entry was torn down with no event at all.

:::note IMAP accounts only
Folder events are produced by the IMAP client. Gmail API and Microsoft Graph accounts do not send `mailboxNew`, `mailboxDeleted` or `mailboxReset`.
:::

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | Account ID the folder belonged to |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Full path of the deleted folder, for example `Archive/2023` |
| `specialUse` | string | No | Special-use flag of the folder, for example `\Trash`. Present only when the folder had one |
| `event` | string | Yes | Always `mailboxDeleted` |
| `data` | object | Yes | Folder details as last stored |

### Folder Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Full folder path, the same value as the top-level `path` |
| `name` | string | Yes | Display name of the folder, the last segment of the path |
| `specialUse` | string or boolean | Yes | Special-use flag such as `\Sent`, or `false` when the folder had none |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

## Example Payload

### Standard Folder Deletion

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:22:33.456Z",
  "path": "Projects/Completed",
  "event": "mailboxDeleted",
  "data": {
    "path": "Projects/Completed",
    "name": "Completed",
    "specialUse": false
  }
}
```

### Special Use Folder Deletion

A folder with a special-use flag carries it at both levels:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "support-inbox",
  "date": "2025-10-17T15:45:12.789Z",
  "path": "Drafts",
  "specialUse": "\\Drafts",
  "event": "mailboxDeleted",
  "data": {
    "path": "Drafts",
    "name": "Drafts",
    "specialUse": "\\Drafts"
  }
}
```

### Nested Folder Deletion

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "admin",
  "date": "2025-10-17T16:30:00.000Z",
  "path": "Archive/2024/Q1/January",
  "event": "mailboxDeleted",
  "data": {
    "path": "Archive/2024/Q1/January",
    "name": "January",
    "specialUse": false
  }
}
```

## Handling the Event

Drop the folder and everything cached under it. Each subfolder that disappears gets an event of its own, so cleaning up by exact path is enough; cleaning up by prefix as well only guards against a child event that is delayed:

```javascript
async function handleMailboxDeleted(event) {
  const { account, path } = event;

  await db.messages.deleteMany({
    where: { accountId: account, folder: path }
  });

  await db.folders.delete({
    where: { accountId_path: { accountId: account, path } }
  });
}
```

## Important Considerations

### Folder vs Message Deletion

The `mailboxDeleted` event means the folder itself is gone. This is different from messages being deleted within a folder:

- **mailboxDeleted** - The entire folder no longer exists
- **messageDeleted** - Individual messages removed from a folder that still exists

When a folder is deleted, EmailEngine discards its message index without sending `messageDeleted` for the messages it contained. Treat `mailboxDeleted` as covering all of them.

### Rename Operations

EmailEngine matches folders by path and does not detect renames. Renaming a folder produces:

1. `mailboxDeleted` for the old path
2. `mailboxNew` for the new path, after its first sync

If you need to follow renames, match on folder contents rather than assuming path continuity. The messages of the renamed folder are indexed afresh under the new path, and [`messageNew`](/docs/webhooks/messagenew) is not sent for them.

### Timing and Ordering

The event is sent when EmailEngine notices the folder is missing, which is on the next folder listing after the deletion, not at the moment of deletion:

- The `date` field is when the webhook was generated, not when the folder was deleted
- When a folder with subfolders is deleted, each subfolder that disappears from the listing gets its own event
- Events for several folders are queued together and can be delivered in any order

## Related Events

- [mailboxNew](/docs/webhooks/mailboxnew) - Triggered when a new folder is found
- [mailboxReset](/docs/webhooks/mailboxreset) - Triggered when a folder's index is rebuilt
- [messageDeleted](/docs/webhooks/messagedeleted) - Triggered when individual messages are deleted
- [accountDeleted](/docs/webhooks/accountdeleted) - Triggered when an entire account is removed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Mailbox Operations](/docs/receiving/mailbox-operations) - Listing, creating, renaming and deleting folders
- [List Mailboxes API](/docs/api/get-v-1-account-account-mailboxes) - Reading the current folder listing
- [Delete Mailbox API](/docs/api/delete-v-1-account-account-mailbox) - Deleting a folder, which also triggers this event
