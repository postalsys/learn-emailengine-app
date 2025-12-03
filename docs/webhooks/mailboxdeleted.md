---
title: "mailboxDeleted"
sidebar_position: 13
description: "Webhook event triggered when a previously tracked folder is no longer found on the mail server"
---

# mailboxDeleted

The `mailboxDeleted` webhook event is triggered when EmailEngine detects that a mailbox folder that was previously being tracked is no longer present on the mail server. This event helps applications stay synchronized when users or administrators delete folders.

## When This Event is Triggered

The `mailboxDeleted` event fires when:

- A user deletes a folder through their email client or webmail
- An administrator removes a folder via server management tools
- A folder is renamed (which may appear as delete + create)
- A folder is purged due to quota or retention policies
- The IMAP connection loses access to a previously visible folder (permission changes)

The event is only triggered for folders that EmailEngine was previously aware of. Folders that were never synced will not generate this event when deleted.

## Common Use Cases

- **Database cleanup** - Remove cached messages and folder metadata for the deleted folder
- **Search index updates** - Delete indexed documents associated with the folder
- **UI synchronization** - Update folder trees and navigation menus in your application
- **Audit logging** - Track folder deletions for compliance or security monitoring
- **Sync state cleanup** - Clear sync markers and state data tied to the deleted folder
- **Resource cleanup** - Release any resources (subscriptions, watches) associated with the folder

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID where the folder was deleted |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Mailbox folder path that was deleted (e.g., "Archive/2023") |
| `specialUse` | string | No | Special use flag of the folder if applicable (e.g., "\Trash", "\Drafts") |
| `event` | string | Yes | Event type, always "mailboxDeleted" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Folder details at the time of deletion |

### Folder Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Mailbox folder path (duplicated from top level for convenience) |
| `name` | string | Yes | Display name of the folder (last segment of the path) |
| `specialUse` | string/boolean | No | Special use attribute (e.g., "\Sent", "\Trash") or `false` if none |

## Example Payload

### Standard Folder Deletion

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:22:33.456Z",
  "path": "Projects/Completed",
  "event": "mailboxDeleted",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": {
    "path": "Projects/Completed",
    "name": "Completed",
    "specialUse": false
  }
}
```

### Special Use Folder Deletion

When a special use folder is deleted (note: deleting Trash or other special folders is typically not recommended):

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "support-inbox",
  "date": "2025-10-17T15:45:12.789Z",
  "path": "Drafts",
  "specialUse": "\\Drafts",
  "event": "mailboxDeleted",
  "eventId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
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
  "eventId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": {
    "path": "Archive/2024/Q1/January",
    "name": "January",
    "specialUse": false
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, data } = event;

  console.log(`Folder deleted for ${account}:`);
  console.log(`  Path: ${path}`);
  console.log(`  Name: ${data.name}`);
  console.log(`  Special Use: ${data.specialUse || 'none'}`);

  // Clean up any resources associated with this folder
  await cleanupFolder(account, path);
}
```

### Database Cleanup

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, date, eventId } = event;

  try {
    // Delete all cached messages for this folder
    const deletedMessages = await db.messages.deleteMany({
      where: {
        accountId: account,
        folder: path
      }
    });

    // Delete the folder record
    await db.folders.delete({
      where: {
        accountId_path: { accountId: account, path }
      }
    });

    console.log(`Cleaned up folder ${path}: ${deletedMessages.count} messages removed`);

    // Log the deletion
    await auditLog.create({
      eventId,
      timestamp: new Date(date),
      account,
      action: 'folder_deleted',
      folder: path,
      deletedMessageCount: deletedMessages.count
    });

  } catch (err) {
    console.error('Failed to cleanup deleted folder:', err);
    throw err; // Retry the webhook
  }
}
```

### UI Synchronization

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, data } = event;

  // Broadcast to connected clients
  await websocketServer.broadcast({
    type: 'folder:deleted',
    account,
    folder: {
      path,
      name: data.name,
      specialUse: data.specialUse
    }
  });

  // Remove from folder cache
  await folderCache.delete(`${account}:${path}`);

  // If any users have this folder selected, redirect them
  const affectedSessions = await sessionStore.findByActiveFolder(account, path);
  for (const session of affectedSessions) {
    await websocketServer.sendToSession(session.id, {
      type: 'folder:redirect',
      message: 'The folder you were viewing has been deleted',
      redirectTo: 'INBOX'
    });
  }
}
```

### Search Index Cleanup

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, date } = event;

  // Delete all indexed documents for this folder
  const result = await searchIndex.deleteByQuery({
    query: {
      bool: {
        must: [
          { term: { accountId: account } },
          { term: { folder: path } }
        ]
      }
    }
  });

  console.log(`Removed ${result.deleted} documents from search index for ${account}/${path}`);

  // Also delete the folder metadata document
  await searchIndex.delete({
    id: `folder:${account}:${path}`,
    ignore: [404] // Don't error if not found
  });
}
```

### Alert on Critical Folder Deletion

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, date, data, eventId } = event;

  // Alert if a critical folder was deleted
  const criticalPatterns = [
    /^inbox$/i,
    /^sent$/i,
    /^archive$/i,
    /\\Inbox/,
    /\\Sent/,
    /\\Archive/
  ];

  const isCritical = criticalPatterns.some(pattern =>
    pattern.test(path) || pattern.test(data.specialUse || '')
  );

  if (isCritical) {
    await alertService.send({
      severity: 'warning',
      title: 'Critical Folder Deleted',
      message: `A critical folder "${path}" was deleted on account ${account}`,
      details: {
        account,
        folder: path,
        folderName: data.name,
        specialUse: data.specialUse,
        timestamp: date,
        eventId
      }
    });
  }

  // Proceed with normal cleanup
  await cleanupFolder(account, path);
}
```

### Cleanup with Child Folder Handling

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, date } = event;

  // Delete this folder and any child folders that might also be affected
  // (The IMAP server may send separate events for children, but this ensures cleanup)
  const deletedFolders = await db.folders.deleteMany({
    where: {
      accountId: account,
      OR: [
        { path: path },
        { path: { startsWith: `${path}/` } } // Child folders
      ]
    }
  });

  // Delete messages in this folder and child folders
  const deletedMessages = await db.messages.deleteMany({
    where: {
      accountId: account,
      OR: [
        { folder: path },
        { folder: { startsWith: `${path}/` } }
      ]
    }
  });

  console.log(`Deleted ${deletedFolders.count} folders and ${deletedMessages.count} messages`);
}
```

## Important Considerations

### Folder vs Message Deletion

The `mailboxDeleted` event indicates the folder itself is gone. This is different from messages being deleted within a folder:

- **mailboxDeleted** - The entire folder no longer exists
- **messageDeleted** - Individual messages removed from a folder that still exists

When a folder is deleted, you will receive `mailboxDeleted` but typically not individual `messageDeleted` events for the messages it contained.

### Rename Operations

Some email clients and servers handle folder renames as a delete followed by a create. In this case, you may receive:

1. `mailboxDeleted` for the old folder path
2. `mailboxNew` for the new folder path

If you need to track renames, consider matching by folder contents or timestamps rather than assuming path continuity.

### Special Use Folders

Deleting special use folders (Inbox, Sent, Trash, Drafts) is usually not possible or not recommended. However, some servers allow it. Your application should handle these cases gracefully:

```javascript
if (data.specialUse) {
  // Log a warning - special folders shouldn't normally be deleted
  logger.warn('Special use folder deleted', {
    account,
    path,
    specialUse: data.specialUse
  });
}
```

### Timing and Ordering

The `mailboxDeleted` event is triggered when EmailEngine detects the folder is missing during synchronization. The actual deletion may have occurred earlier. Consider:

- The `date` field is when the webhook was generated, not when the folder was deleted
- Events for multiple folder operations may arrive out of order
- If a parent folder is deleted, you may receive events for child folders as well

### Data Retention

Before deleting cached data, consider whether you need to retain any information for:

- Audit compliance
- Recovery purposes
- Analytics and reporting
- Legal holds

```javascript
async function handleMailboxDeleted(event) {
  const { account, path, date } = event;

  // Archive before deleting
  const messages = await db.messages.findMany({
    where: { accountId: account, folder: path }
  });

  if (messages.length > 0) {
    await archiveService.archiveFolderContents({
      account,
      folder: path,
      messages,
      deletedAt: date,
      reason: 'folder_deleted'
    });
  }

  // Then proceed with cleanup
  await db.messages.deleteMany({
    where: { accountId: account, folder: path }
  });
}
```

## Related Events

- [mailboxNew](/docs/webhooks/mailboxnew) - Triggered when a new folder is created
- [mailboxReset](/docs/webhooks/mailboxreset) - Triggered when a folder's UIDVALIDITY changes
- [messageDeleted](/docs/webhooks/messagedeleted) - Triggered when individual messages are deleted
- [accountDeleted](/docs/webhooks/overview) - Triggered when an entire account is removed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Mailbox Operations](/docs/api/get-v-1-account-account-mailboxes) - List mailboxes via API
- [Delete Mailbox API](/docs/api/delete-v-1-account-account-mailbox) - Delete a mailbox programmatically
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
