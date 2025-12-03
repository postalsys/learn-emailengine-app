---
title: "mailboxReset"
sidebar_position: 13
description: "Webhook event triggered when a folder's UIDVALIDITY changes, indicating a mailbox reset"
---

# mailboxReset

The `mailboxReset` webhook event is triggered when EmailEngine detects that the UIDVALIDITY value for a mailbox folder has changed. This is a relatively rare but significant event that indicates the folder has been reset or recreated, invalidating all previously tracked message UIDs.

## When This Event is Triggered

The `mailboxReset` event fires when:

- The IMAP server reports a different UIDVALIDITY value than what was previously stored
- The mailbox folder has been recreated on the server
- The mail server has performed a mailbox repair or reorganization
- Server migration or restore from backup results in changed UIDVALIDITY
- The mail server resets its UID counter for the folder

UIDVALIDITY is an IMAP mechanism that ensures message UIDs remain valid. When UIDVALIDITY changes, it means all previously assigned UIDs are no longer valid, and the folder must be fully resynchronized.

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
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Reset details including UIDVALIDITY information |

### Reset Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Mailbox folder path (duplicated from top level) |
| `name` | string | Yes | Display name of the folder |
| `specialUse` | string/boolean | No | Special use attribute (e.g., "\Inbox", "\Sent") or `false` if none |
| `uidValidity` | string | Yes | New UIDVALIDITY value (numeric value as string) |
| `prevUidValidity` | string/boolean | No | Previous UIDVALIDITY value (numeric value as string), or `false` if not available |

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
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": {
    "path": "INBOX",
    "name": "INBOX",
    "specialUse": "\\Inbox",
    "uidValidity": "1697556153",
    "prevUidValidity": "1695234567"
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
  "eventId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "data": {
    "path": "Support/Tickets",
    "name": "Tickets",
    "specialUse": false,
    "uidValidity": "1697560312",
    "prevUidValidity": "1690234567"
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
  "eventId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": {
    "path": "Archive/2024",
    "name": "2024",
    "specialUse": false,
    "uidValidity": "1697564200",
    "prevUidValidity": false
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
  const { account, path, date, data, eventId } = event;

  // Log the reset event
  await auditLog.create({
    eventId,
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
