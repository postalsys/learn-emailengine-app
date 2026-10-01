---
title: "mailboxNew"
sidebar_position: 12
description: "Webhook event triggered when a new folder is discovered on the mail server"
---

# mailboxNew

The `mailboxNew` webhook event is triggered when EmailEngine finds a folder on an IMAP account's mail server that was not in its stored folder listing, and has finished the folder's first sync. It tells your application that a folder exists and that message events for it can follow.

## When This Event is Triggered

The `mailboxNew` event fires when a folder appears in the server's folder listing that EmailEngine had not stored before, and its first sync completes. That covers:

- A folder created in a mail client, in webmail, by an administrator, or through the [Create Mailbox API](/docs/api/post-v-1-account-account-mailbox)
- The new path of a renamed folder, which the listing shows as a deletion plus a creation
- A folder that became visible, for example after a permission change on a shared namespace
- Every folder of a newly added account, and every folder again after a [flush](/docs/api/put-v-1-account-account-flush), because the stored listing starts empty

The event is sent after the folder's first sync, so by the time it arrives the folder can be listed and its messages fetched. Messages that were already in the folder are indexed as the baseline and do not produce [`messageNew`](/docs/webhooks/messagenew).

Before EmailEngine 2.80.0 two cases lost the event: a folder that first appeared while the account's primary connection was down, and one found by a listing EmailEngine only read without registering it. Both were registered by a later pass with no `mailboxNew` sent. Since 2.80.0 the folder is announced once the primary connection is back.

:::note IMAP accounts only
Folder events are produced by the IMAP client. Gmail API and Microsoft Graph accounts do not send `mailboxNew`, `mailboxDeleted` or `mailboxReset`.
:::

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | Account ID the folder belongs to |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Full path of the new folder, for example `Projects/Active` |
| `specialUse` | string | No | Special-use flag of the folder, for example `\Archive`. Present only when the folder has one |
| `event` | string | Yes | Always `mailboxNew` |
| `data` | object | Yes | Folder details |

### Folder Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Full folder path, the same value as the top-level `path` |
| `name` | string | Yes | Display name of the folder, the last segment of the path |
| `specialUse` | string or boolean | Yes | Special-use flag such as `\Sent`, or `false` when the folder has none |
| `uidValidity` | string | Yes | The folder's IMAP UIDVALIDITY, as a string |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

## Example Payload

### Standard Folder Creation

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:22:33.456Z",
  "path": "Projects/Active",
  "event": "mailboxNew",
  "data": {
    "path": "Projects/Active",
    "name": "Active",
    "specialUse": false,
    "uidValidity": "1697551353"
  }
}
```

### Special Use Folder

A folder with a special-use flag carries it at both levels:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "support-inbox",
  "date": "2025-10-17T15:45:12.789Z",
  "path": "Archive",
  "specialUse": "\\Archive",
  "event": "mailboxNew",
  "data": {
    "path": "Archive",
    "name": "Archive",
    "specialUse": "\\Archive",
    "uidValidity": "1697555112"
  }
}
```

### Nested Folder Creation

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "admin",
  "date": "2025-10-17T16:30:00.000Z",
  "path": "Archive/2024/Q4/December",
  "event": "mailboxNew",
  "data": {
    "path": "Archive/2024/Q4/December",
    "name": "December",
    "specialUse": false,
    "uidValidity": "1697558200"
  }
}
```

## Handling the Event

The same folder can be announced more than once: a redelivery after a failed response, or a flush that re-announces every folder. Treat a known path as an update rather than an error:

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  const known = await db.folders.findFirst({
    where: { accountId: account, path }
  });

  if (known) {
    // Re-announced after a flush, or a redelivery. Refresh what can change
    await db.folders.update({
      where: { id: known.id },
      data: { uidValidity: data.uidValidity, specialUse: data.specialUse || null }
    });
    return;
  }

  await db.folders.create({
    data: {
      accountId: account,
      path,
      name: data.name,
      specialUse: data.specialUse || null,
      uidValidity: data.uidValidity
    }
  });
}
```

The path separator is whatever the server uses. `/` is common, but Microsoft Exchange and some other servers use `.` or `\`. The [List Mailboxes API](/docs/api/get-v-1-account-account-mailboxes) returns each folder's `delimiter`, so derive a parent path from that rather than from a fixed separator.

## Important Considerations

### Initial Account Sync

When an account is added, or after a flush, every folder is new to EmailEngine, so it sends one `mailboxNew` per folder as each finishes its first sync. Expect a burst for a newly added account.

### Rename Operations

EmailEngine matches folders by path and does not detect renames. Renaming a folder produces:

1. `mailboxDeleted` for the old path
2. `mailboxNew` for the new path, after its first sync

If you need to follow renames, match on folder contents rather than assuming path continuity. The messages of the renamed folder are indexed afresh under the new path, and `messageNew` is not sent for them.

### UIDVALIDITY

`uidValidity` identifies the folder's current numbering of messages. If the server assigns the folder a new UIDVALIDITY later, every UID EmailEngine stored for it becomes invalid; EmailEngine then rebuilds its index and sends [`mailboxReset`](/docs/webhooks/mailboxreset) with the old and new values. Store the value from this event if you want to compare.

### Special Use Folders

The `specialUse` field carries the IMAP special-use attribute defined in RFC 6154, when the server advertises one:

| Value | Description |
|-------|-------------|
| `\All` | All messages (virtual folder) |
| `\Archive` | Archive folder |
| `\Drafts` | Draft messages |
| `\Flagged` | Flagged or starred messages |
| `\Junk` | Spam or junk folder |
| `\Sent` | Sent messages |
| `\Trash` | Deleted messages |

`\Inbox` is used for the INBOX folder, which the server does not flag but which has a fixed role.

## Related Events

- [mailboxDeleted](/docs/webhooks/mailboxdeleted) - Triggered when a folder is removed
- [mailboxReset](/docs/webhooks/mailboxreset) - Triggered when a folder's index is rebuilt
- [messageNew](/docs/webhooks/messagenew) - Triggered when new messages arrive in a folder
- [accountInitialized](/docs/webhooks/accountinitialized) - Triggered when the initial account sync completes

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Mailbox Operations](/docs/receiving/mailbox-operations) - Listing, creating, renaming and deleting folders
- [List Mailboxes API](/docs/api/get-v-1-account-account-mailboxes) - Reading the current folder listing, with delimiters and special-use flags
- [Create Mailbox API](/docs/api/post-v-1-account-account-mailbox) - Creating a folder, which also triggers this event
