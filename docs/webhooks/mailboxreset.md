---
title: "mailboxReset"
sidebar_position: 14
description: "Webhook event triggered when EmailEngine rebuilds a folder's index, invalidating previously tracked message UIDs"
---

# mailboxReset

The `mailboxReset` webhook event is triggered when EmailEngine has to rebuild its index for a folder from scratch. It is rare but significant: every message UID EmailEngine previously tracked for that folder is no longer meaningful.

## When This Event is Triggered

The `mailboxReset` event fires when:

- The IMAP server reports a different UIDVALIDITY value than what was previously stored (`reason: "uidValidityChange"`), which happens when a folder is recreated, repaired, migrated, or restored from backup
- EmailEngine's own stored index for the folder is missing or unusable and has to be rebuilt from the server (`reason: "syncStateLost"`)

UIDVALIDITY is the IMAP mechanism that tells a client whether previously assigned UIDs are still valid. When it changes, they are not, and the folder must be fully resynchronized. A lost local index has the same practical consequence.

:::note No message events are replayed
Rebuilding the baseline deliberately does not emit `messageNew` for the messages it re-indexes. Without that suppression, a reset on a large folder would replay the entire mailbox to your webhook endpoint. Treat `mailboxReset` itself as the signal to reconcile.
:::

## Common Use Cases

- **Full resync trigger** - Initiate a complete resynchronization of your local message cache
- **Database cleanup** - Clear cached message data for the affected folder since UIDs are invalid
- **Search index rebuild** - Mark the folder's search index for rebuild
- **Audit logging** - Track mailbox reset events for operational monitoring
- **Alert systems** - Notify administrators about unusual mailbox resets that may indicate server issues
- **Sync state reset** - Clear any sync state markers tied to old UIDs

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID where the mailbox reset occurred |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Mailbox folder path that was reset (e.g., "INBOX") |
| `specialUse` | string | No | Special use flag of the folder (e.g., "\Inbox", "\Sent", "\Trash") |
| `event` | string | Yes | Event type, always "mailboxReset" for this event |
| `data` | object | Yes | Reset details including UIDVALIDITY information |

### Reset Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Mailbox folder path (duplicated from top level) |
| `name` | string | Yes | Display name of the folder |
| `specialUse` | string/boolean | No | Special use attribute (e.g., "\Inbox", "\Sent") or `false` if none |
| `uidValidity` | string/boolean | Yes | New UIDVALIDITY value as a string, or `false` if the server did not report a usable one |
| `prevUidValidity` | string/boolean | No | Previous UIDVALIDITY value as a string, or `false` if not available. Omitted entirely when there was no previous value |
| `reason` | string | Yes | Why the folder was reset, see below |

### Reset Reasons

| Reason | Meaning |
|--------|---------|
| `uidValidityChange` | The server issued a new UIDVALIDITY for the folder, which invalidates every UID EmailEngine had stored |
| `syncStateLost` | EmailEngine's own index for the folder was missing or unusable and had to be rebuilt from the server |

Both mean the same thing for your application: the message IDs you previously stored for this folder no longer refer to those messages. Branch on `reason` only if you want to distinguish a server-side renumbering from a local index rebuild.

## Example Payload

### IMAP Account - Inbox Reset

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:22:33.456Z",
  "path": "INBOX",
  "specialUse": "\\Inbox",
  "event": "mailboxReset",
  "data": {
    "path": "INBOX",
    "name": "INBOX",
    "specialUse": "\\Inbox",
    "uidValidity": "1697556153",
    "prevUidValidity": "1695234567",
    "reason": "uidValidityChange"
  }
}
```

### Custom Folder Reset

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "support-inbox",
  "date": "2025-10-17T15:45:12.789Z",
  "path": "Support/Tickets",
  "event": "mailboxReset",
  "data": {
    "path": "Support/Tickets",
    "name": "Tickets",
    "specialUse": false,
    "uidValidity": "1697560312",
    "prevUidValidity": "1690234567",
    "reason": "uidValidityChange"
  }
}
```

### Mailbox Without Previous UIDVALIDITY

When EmailEngine has no record of a previous UIDVALIDITY (e.g., first detection after some data corruption):

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "recovered-account",
  "date": "2025-10-17T16:30:00.000Z",
  "path": "Archive/2024",
  "event": "mailboxReset",
  "data": {
    "path": "Archive/2024",
    "name": "2024",
    "specialUse": false,
    "uidValidity": "1697564200",
    "prevUidValidity": false,
    "reason": "uidValidityChange"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleMailboxReset(event) {
  const { account, path, data } = event;

  console.log(`Mailbox reset detected for ${account}:`);
  console.log(`  Folder: ${path}`);
  console.log(`  New UIDVALIDITY: ${data.uidValidity}`);
  console.log(`  Previous UIDVALIDITY: ${data.prevUidValidity || 'unknown'}`);

  // Trigger full resync for this folder
  await triggerFolderResync(account, path);
}
```

### Database Cleanup

```javascript
async function handleMailboxReset(event) {
  const { account, path, data } = event;

  try {
    // Clear all cached messages for this folder
    // UIDs are no longer valid after UIDVALIDITY change
    const deletedCount = await db.messages.deleteMany({
      where: {
        accountId: account,
        folder: path
      }
    });

    console.log(`Cleared ${deletedCount} cached messages for ${account}/${path}`);

    // Update folder metadata with new UIDVALIDITY
    await db.folders.upsert({
      where: {
        accountId_path: { accountId: account, path }
      },
      update: {
        uidValidity: data.uidValidity,
        lastReset: new Date(event.date),
        syncStatus: 'pending'
      },
      create: {
        accountId: account,
        path,
        name: data.name,
        uidValidity: data.uidValidity,
        syncStatus: 'pending'
      }
    });

    // Trigger resync
    await resyncQueue.add('folder-resync', {
      account,
      path,
      reason: 'uidvalidity_change'
    });

  } catch (err) {
    console.error('Failed to handle mailbox reset:', err);
    throw err; // Retry the webhook
  }
}
```

### Alert on Reset

```javascript
async function handleMailboxReset(event) {
  const { account, path, date, data } = event;

  // Log the reset event
  await auditLog.create({
    timestamp: new Date(date),
    account,
    action: 'mailbox_reset',
    folder: path,
    metadata: {
      newUidValidity: data.uidValidity,
      prevUidValidity: data.prevUidValidity,
      folderName: data.name,
      specialUse: data.specialUse
    }
  });

  // Alert if this is a critical folder
  const criticalFolders = ['INBOX', 'Sent', 'Drafts'];
  if (criticalFolders.some(f =>
    path.toUpperCase().includes(f.toUpperCase())
  )) {
    await alertService.send({
      severity: 'warning',
      title: 'Critical Mailbox Reset Detected',
      message: `UIDVALIDITY changed for ${path} on account ${account}`,
      details: {
        account,
        folder: path,
        previousUidValidity: data.prevUidValidity,
        newUidValidity: data.uidValidity,
        timestamp: date
      }
    });
  }
}
```

### Search Index Rebuild

```javascript
async function handleMailboxReset(event) {
  const { account, path, data } = event;

  // Delete all indexed documents for this folder
  await searchIndex.deleteByQuery({
    query: {
      bool: {
        must: [
          { term: { accountId: account } },
          { term: { folder: path } }
        ]
      }
    }
  });

  console.log(`Cleared search index for ${account}/${path}`);

  // Mark folder for reindexing
  await searchIndex.update({
    id: `folder:${account}:${path}`,
    doc: {
      uidValidity: data.uidValidity,
      needsReindex: true,
      resetAt: event.date
    },
    doc_as_upsert: true
  });
}
```

## Important Considerations

### What UIDVALIDITY Means

UIDVALIDITY is an IMAP concept that guarantees message UID uniqueness within a mailbox. When UIDVALIDITY changes:

- All previously assigned UIDs become invalid
- You cannot rely on old UID-to-message mappings
- A full folder resync is required to rebuild the message list
- Any cached message data keyed by UID should be discarded

### When EmailEngine Handles Reset

When EmailEngine detects a UIDVALIDITY change, it automatically:

1. Deletes all stored message metadata for the folder from Redis
2. Clears the mailbox state
3. Triggers a full resync of the folder
4. Sends this webhook notification

New `messageNew` webhooks will follow as messages are rediscovered during resync.

### Rare But Important

UIDVALIDITY changes are relatively rare in normal operation. Common causes include:

- Mail server migration
- Database repairs or corruption recovery
- Server software updates that reset counters
- Mailbox import/export operations
- Administrative maintenance

Frequent UIDVALIDITY changes may indicate server issues that should be investigated.

### Handling Message ID Continuity

While IMAP UIDs become invalid, EmailEngine's message IDs (the `id` field) may still provide continuity if the messages themselves haven't changed. Consider:

```javascript
async function handleMailboxReset(event) {
  const { account, path } = event;

  // Instead of deleting, mark records as needing revalidation
  await db.messages.updateMany({
    where: {
      accountId: account,
      folder: path
    },
    data: {
      uidValid: false,
      needsRevalidation: true
    }
  });

  // After resync, messageNew events will arrive
  // Match by Message-ID header if you need to preserve relationships
}
```

## Related Events

- [mailboxNew](/docs/webhooks/overview) - Triggered when a new folder is detected
- [mailboxDeleted](/docs/webhooks/overview) - Triggered when a folder is removed
- [messageNew](/docs/webhooks/messagenew) - Will fire for messages after resync
- [messageDeleted](/docs/webhooks/messagedeleted) - May fire during resync cleanup

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Mailbox Operations](/docs/api/get-v-1-account-account-mailboxes) - List mailboxes via API
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
