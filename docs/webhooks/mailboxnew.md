---
title: "mailboxNew"
sidebar_position: 11
description: "Webhook event triggered when a new folder is discovered on the mail server"
---

# mailboxNew

The `mailboxNew` webhook event is triggered when EmailEngine discovers a new mailbox folder on the mail server that was not previously tracked. This event helps applications stay synchronized when users or administrators create new folders.

## When This Event is Triggered

The `mailboxNew` event fires when:

- A user creates a new folder through their email client or webmail
- An administrator creates a folder via server management tools
- A folder is renamed (which may appear as delete + create)
- EmailEngine discovers a folder during initial account synchronization
- A previously inaccessible folder becomes visible (permission changes)

The event is triggered after EmailEngine has completed the initial sync of the new folder, ensuring the folder is ready for use.

## Common Use Cases

- **Folder tree synchronization** - Update folder lists and navigation menus in your application
- **Database initialization** - Create folder metadata records for the new folder
- **Search index setup** - Initialize search index structures for the new folder
- **Subscription management** - Automatically subscribe to new folders matching certain patterns
- **Audit logging** - Track folder creation for compliance or security monitoring
- **User notifications** - Alert users when new folders appear in their accounts

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID where the folder was created |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | Yes | Mailbox folder path that was created (e.g., "Projects/Active") |
| `specialUse` | string | No | Special use flag of the folder if applicable (e.g., "\Archive", "\Junk") |
| `event` | string | Yes | Event type, always "mailboxNew" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Folder details |

### Folder Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Mailbox folder path (duplicated from top level for convenience) |
| `name` | string | Yes | Display name of the folder (last segment of the path) |
| `specialUse` | string/boolean | No | Special use attribute (e.g., "\Sent", "\Archive") or `false` if none |
| `uidValidity` | string | Yes | IMAP UIDVALIDITY value for the folder (as string) |

## Example Payload

### Standard Folder Creation

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:22:33.456Z",
  "path": "Projects/Active",
  "event": "mailboxNew",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": {
    "path": "Projects/Active",
    "name": "Active",
    "specialUse": false,
    "uidValidity": "1697551353"
  }
}
```

### Special Use Folder Creation

When a special use folder is created or discovered:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "support-inbox",
  "date": "2025-10-17T15:45:12.789Z",
  "path": "Archive",
  "specialUse": "\\Archive",
  "event": "mailboxNew",
  "eventId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
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
  "eventId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": {
    "path": "Archive/2024/Q4/December",
    "name": "December",
    "specialUse": false,
    "uidValidity": "1697558200"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  console.log(`New folder created for ${account}:`);
  console.log(`  Path: ${path}`);
  console.log(`  Name: ${data.name}`);
  console.log(`  Special Use: ${data.specialUse || 'none'}`);
  console.log(`  UIDVALIDITY: ${data.uidValidity}`);

  // Initialize resources for this folder
  await initializeFolder(account, path, data);
}
```

### Database Initialization

```javascript
async function handleMailboxNew(event) {
  const { account, path, date, data, eventId } = event;

  try {
    // Create folder record
    await db.folders.create({
      data: {
        accountId: account,
        path: path,
        name: data.name,
        specialUse: data.specialUse || null,
        uidValidity: data.uidValidity,
        createdAt: new Date(date),
        eventId: eventId
      }
    });

    console.log(`Initialized folder ${path} for account ${account}`);

    // Log the creation
    await auditLog.create({
      eventId,
      timestamp: new Date(date),
      account,
      action: 'folder_created',
      folder: path,
      folderName: data.name,
      specialUse: data.specialUse
    });

  } catch (err) {
    if (err.code === 'P2002') {
      // Folder already exists - this can happen with duplicate webhooks
      console.log(`Folder ${path} already exists, skipping`);
      return;
    }
    console.error('Failed to initialize folder:', err);
    throw err; // Retry the webhook
  }
}
```

### UI Synchronization

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  // Broadcast to connected clients
  await websocketServer.broadcast({
    type: 'folder:created',
    account,
    folder: {
      path,
      name: data.name,
      specialUse: data.specialUse,
      uidValidity: data.uidValidity
    }
  });

  // Add to folder cache
  await folderCache.set(`${account}:${path}`, {
    path,
    name: data.name,
    specialUse: data.specialUse,
    uidValidity: data.uidValidity,
    messageCount: 0 // New folder starts empty
  });

  // Invalidate folder list cache
  await folderCache.delete(`${account}:folder-list`);
}
```

### Auto-Subscribe to Matching Folders

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  // Define patterns for auto-subscription
  const autoSubscribePatterns = [
    /^Projects\//,
    /^Clients\//,
    /^Archive\/\d{4}/
  ];

  const shouldSubscribe = autoSubscribePatterns.some(pattern =>
    pattern.test(path)
  );

  if (shouldSubscribe) {
    // Subscribe to notifications for this folder
    await subscriptionManager.add({
      account,
      folder: path,
      events: ['messageNew', 'messageDeleted', 'messageUpdated']
    });

    console.log(`Auto-subscribed to folder ${path} for account ${account}`);
  }

  // Always track the folder
  await folderStore.add(account, {
    path,
    name: data.name,
    specialUse: data.specialUse,
    subscribed: shouldSubscribe
  });
}
```

### Search Index Initialization

```javascript
async function handleMailboxNew(event) {
  const { account, path, date, data } = event;

  // Create folder metadata document in search index
  await searchIndex.create({
    id: `folder:${account}:${path}`,
    body: {
      type: 'folder',
      accountId: account,
      path: path,
      name: data.name,
      specialUse: data.specialUse || null,
      uidValidity: data.uidValidity,
      createdAt: date
    }
  });

  console.log(`Search index initialized for folder ${account}/${path}`);
}
```

### Alert on New Shared or Special Folders

```javascript
async function handleMailboxNew(event) {
  const { account, path, date, data, eventId } = event;

  // Alert if a new special use folder appears (unusual after initial setup)
  if (data.specialUse) {
    const accountAge = await getAccountAge(account);
    const isNewAccount = accountAge < 5 * 60 * 1000; // Less than 5 minutes old

    if (!isNewAccount) {
      await alertService.send({
        severity: 'info',
        title: 'New Special Use Folder',
        message: `A new special use folder "${path}" appeared on account ${account}`,
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
  }

  // Track shared folders (common in Exchange/Office 365)
  if (path.startsWith('Shared/') || path.includes('/Public Folders/')) {
    await sharedFolderTracker.register({
      account,
      path,
      name: data.name,
      discoveredAt: date
    });
  }

  // Proceed with normal initialization
  await initializeFolder(account, path, data);
}
```

### Hierarchical Folder Setup

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  // Parse folder hierarchy
  const pathParts = path.split('/');
  const depth = pathParts.length;
  const parentPath = pathParts.slice(0, -1).join('/') || null;

  // Create folder record with hierarchy info
  await db.folders.create({
    data: {
      accountId: account,
      path: path,
      name: data.name,
      specialUse: data.specialUse || null,
      uidValidity: data.uidValidity,
      depth: depth,
      parentPath: parentPath
    }
  });

  // Update parent folder if exists
  if (parentPath) {
    await db.folders.updateMany({
      where: {
        accountId: account,
        path: parentPath
      },
      data: {
        hasChildren: true
      }
    });
  }

  console.log(`Folder ${path} added at depth ${depth}`);
}
```

## Important Considerations

### Initial Account Sync

During initial account synchronization, EmailEngine will trigger `mailboxNew` events for all existing folders. If your application is processing webhooks for a newly added account, expect a burst of `mailboxNew` events.

```javascript
async function handleMailboxNew(event) {
  const { account, path, date } = event;

  // Check if this is during initial sync
  const accountStatus = await getAccountStatus(account);

  if (accountStatus === 'syncing') {
    // Buffer events during initial sync
    await eventBuffer.add(account, event);
    return;
  }

  // Process normally
  await processNewFolder(account, path, event.data);
}
```

### Rename Operations

Some email clients and servers handle folder renames as a delete followed by a create. In this case, you may receive:

1. `mailboxDeleted` for the old folder path
2. `mailboxNew` for the new folder path

If you need to track renames and preserve folder associations:

```javascript
async function handleMailboxNew(event) {
  const { account, path, data, date } = event;

  // Check if this might be a rename (recent deletion with same UIDVALIDITY)
  const recentDeletion = await db.folderDeletions.findFirst({
    where: {
      accountId: account,
      uidValidity: data.uidValidity,
      deletedAt: {
        gte: new Date(Date.now() - 60000) // Within last minute
      }
    }
  });

  if (recentDeletion) {
    // This is likely a rename
    console.log(`Folder rename detected: ${recentDeletion.path} -> ${path}`);

    // Update existing folder record instead of creating new
    await db.folders.update({
      where: { id: recentDeletion.folderId },
      data: {
        path: path,
        name: data.name,
        deletedAt: null
      }
    });

    // Update message folder references
    await db.messages.updateMany({
      where: { folderId: recentDeletion.folderId },
      data: { folder: path }
    });

    return;
  }

  // Normal new folder creation
  await createNewFolder(account, path, data);
}
```

### UIDVALIDITY

The `uidValidity` field is an important IMAP concept that uniquely identifies the state of a mailbox. If the UIDVALIDITY of a folder changes, all previously cached UIDs become invalid. Store this value to detect mailbox resets:

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  // Store UIDVALIDITY for future comparison
  await folderState.set(account, path, {
    uidValidity: data.uidValidity,
    lastSync: new Date()
  });
}
```

### Special Use Folders

The `specialUse` field indicates IMAP special-use attributes defined in RFC 6154:

| Value | Description |
|-------|-------------|
| `\All` | All messages (virtual folder) |
| `\Archive` | Archive folder |
| `\Drafts` | Draft messages |
| `\Flagged` | Flagged/starred messages |
| `\Junk` | Spam/junk folder |
| `\Sent` | Sent messages |
| `\Trash` | Deleted messages |

Handle special use folders appropriately:

```javascript
async function handleMailboxNew(event) {
  const { account, path, data } = event;

  // Map special use folders for the application
  if (data.specialUse) {
    await accountSettings.update(account, {
      [`${data.specialUse.replace('\\', '').toLowerCase()}Folder`]: path
    });

    console.log(`Mapped ${data.specialUse} to ${path} for account ${account}`);
  }

  // Regular folder initialization
  await initializeFolder(account, path, data);
}
```

### Idempotency

Webhooks may be delivered multiple times. Ensure your handler is idempotent:

```javascript
async function handleMailboxNew(event) {
  const { account, path, eventId } = event;

  // Check if we've already processed this event
  const processed = await eventLog.exists(eventId);
  if (processed) {
    console.log(`Event ${eventId} already processed, skipping`);
    return;
  }

  // Process the event
  await processNewFolder(account, path, event.data);

  // Mark as processed
  await eventLog.create({
    eventId,
    processedAt: new Date()
  });
}
```

## Related Events

- [mailboxDeleted](/docs/webhooks/mailboxdeleted) - Triggered when a folder is removed
- [mailboxReset](/docs/webhooks/mailboxreset) - Triggered when a folder's UIDVALIDITY changes
- [messageNew](/docs/webhooks/messagenew) - Triggered when new messages arrive in a folder
- [accountInitialized](/docs/webhooks/overview) - Triggered when initial account sync completes

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Mailbox Operations](/docs/api/get-v-1-account-account-mailboxes) - List mailboxes via API
- [Create Mailbox API](/docs/api/post-v-1-account-account-mailbox) - Create a mailbox programmatically
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
