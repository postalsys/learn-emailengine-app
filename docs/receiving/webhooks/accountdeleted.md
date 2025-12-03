---
title: "accountDeleted"
sidebar_position: 8
description: "Webhook event triggered when an email account is removed from EmailEngine"
---

# accountDeleted

The `accountDeleted` webhook event is triggered when an email account is removed from EmailEngine. This is the final webhook event in the account lifecycle and signals that the account configuration has been permanently deleted.

## When This Event is Triggered

The `accountDeleted` event fires when:

- An account is deleted via the [Delete Account API](/docs/api/delete-v-1-account-account)
- An account is removed through the EmailEngine web interface
- An account is programmatically removed through any other deletion method

This event fires **after** the account has been removed from EmailEngine's configuration. At this point, all account data, including stored messages, mailbox information, and credentials, has been deleted.

## Common Use Cases

- **Account cleanup** - Remove associated data from your application database
- **Billing integration** - Stop billing cycles when accounts are removed
- **User notifications** - Inform users their email connection has been removed
- **Audit logging** - Track all account deletions for compliance purposes
- **Dashboard updates** - Remove deleted accounts from your UI
- **Resource cleanup** - Release any resources allocated for the account
- **Analytics tracking** - Monitor account churn and retention metrics

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL, if set |
| `account` | string | Yes | The unique account ID of the deleted account |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always `accountDeleted` for this event |
| `eventId` | string | Yes | Unique identifier for this webhook event (UUID format) |
| `data` | object | Yes | Event data object containing account information |

### Event Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `account` | string | Yes | The account ID (same as top-level `account` field) |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:32:45.892Z",
  "event": "accountDeleted",
  "eventId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": {
    "account": "user123"
  }
}
```

## Example Payload (Without Service URL)

When no service URL is configured:

```json
{
  "serviceUrl": null,
  "account": "gmail-user456",
  "date": "2025-10-17T16:45:00.000Z",
  "event": "accountDeleted",
  "eventId": "d4e5f6a7-b8c9-0123-def0-456789012345",
  "data": {
    "account": "gmail-user456"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleAccountDeleted(event) {
  const { account, date, eventId } = event;

  console.log(`Account deleted: ${account}`);
  console.log(`  Time: ${date}`);
  console.log(`  Event ID: ${eventId}`);

  // Remove account from your system
  await deleteAccountRecord(account);
}
```

### Cleaning Up Account Data

```javascript
async function handleAccountDeleted(event) {
  const { account, date, eventId } = event;

  // Delete account record from database
  await db.accounts.delete({
    where: { emailEngineId: account }
  });

  // Clean up related data
  await db.messages.deleteMany({
    where: { accountId: account }
  });

  await db.contacts.deleteMany({
    where: { accountId: account }
  });

  // Log the account deletion
  await auditLog.create({
    event: 'account_deleted',
    account,
    timestamp: date,
    eventId
  });
}
```

### Billing Integration

```javascript
async function handleAccountDeleted(event) {
  const { account, date } = event;

  // Get user associated with this account
  const accountRecord = await db.accounts.findUnique({
    where: { emailEngineId: account },
    include: { user: true }
  });

  if (accountRecord && accountRecord.user) {
    // Update billing records
    await billing.removeAccount({
      userId: accountRecord.user.id,
      accountId: account,
      endDate: new Date(date)
    });

    // Recalculate subscription if needed
    const remainingAccounts = await getAccountCount(accountRecord.user.id);
    if (remainingAccounts === 0) {
      await billing.pauseSubscription(accountRecord.user.id);
    }
  }

  // Now safe to delete the account record
  await db.accounts.delete({
    where: { emailEngineId: account }
  });
}
```

### User Notifications

```javascript
async function handleAccountDeleted(event) {
  const { account, date } = event;

  // Look up user before deleting account record
  const accountRecord = await db.accounts.findUnique({
    where: { emailEngineId: account },
    include: { user: true }
  });

  if (accountRecord && accountRecord.user) {
    // Notify user about account removal
    await sendNotification({
      userId: accountRecord.user.id,
      type: 'account_removed',
      message: `Your email account has been disconnected.`,
      metadata: {
        accountId: account,
        removedAt: date
      }
    });
  }

  // Clean up account data
  await db.accounts.delete({
    where: { emailEngineId: account }
  });
}
```

### Idempotent Handler

Since webhooks may be delivered multiple times, ensure your handler is idempotent:

```javascript
async function handleAccountDeleted(event) {
  const { account, eventId, date } = event;

  // Check if we've already processed this event
  const existingEvent = await db.processedEvents.findUnique({
    where: { eventId }
  });

  if (existingEvent) {
    console.log(`Event ${eventId} already processed, skipping`);
    return;
  }

  // Record that we're processing this event
  await db.processedEvents.create({
    data: {
      eventId,
      eventType: 'accountDeleted',
      processedAt: new Date()
    }
  });

  // Check if account still exists in our system
  const accountRecord = await db.accounts.findUnique({
    where: { emailEngineId: account }
  });

  if (!accountRecord) {
    console.log(`Account ${account} already deleted, skipping`);
    return;
  }

  // Proceed with deletion
  await db.accounts.delete({
    where: { emailEngineId: account }
  });

  await auditLog.create({
    event: 'account_deleted',
    account,
    timestamp: date,
    eventId
  });
}
```

## Event Sequence

When an account is deleted, you will typically only receive:

1. **`accountDeleted`** - Account is removed (this event)

No other events are triggered after deletion since the account no longer exists.

### Complete Account Lifecycle

A typical complete account lifecycle includes:

1. **`accountAdded`** - Account is registered
2. **`authenticationSuccess`** - Account successfully authenticates
3. **`accountInitialized`** - Initial mailbox sync is complete
4. *(Account is active, various message/mailbox events may occur)*
5. **`accountDeleted`** - Account is removed (final event)

## Important Considerations

### Data Already Deleted

When you receive the `accountDeleted` webhook, the account data has already been removed from EmailEngine. You cannot query EmailEngine for additional account information at this point. If you need account metadata for cleanup purposes, ensure you store relevant information in your own database when accounts are created.

### Webhook Reliability

If your webhook endpoint is unavailable when the deletion occurs, EmailEngine will retry delivery with exponential backoff. Ensure your handler is idempotent to handle potential duplicate deliveries.

### Timing

The webhook is sent immediately after the account is deleted. There is no delay between the deletion and the webhook notification.

## Related Events

- [accountAdded](/docs/receiving/webhooks/accountadded) - Triggered when a new account is registered
- [accountInitialized](/docs/receiving/webhooks/accountinitialized) - Triggered when initial sync completes
- [authenticationSuccess](/docs/receiving/webhooks/authenticationsuccess) - Triggered when authentication succeeds
- [authenticationError](/docs/receiving/webhooks/authenticationerror) - Triggered when authentication fails
- [connectError](/docs/receiving/webhooks/connecterror) - Triggered when connection fails

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Account Management](/docs/accounts) - Managing email accounts
- [Delete Account API](/docs/api/delete-v-1-account-account) - API endpoint for deleting accounts
