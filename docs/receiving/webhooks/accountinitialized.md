---
title: "accountInitialized"
sidebar_position: 7
description: "Webhook event triggered when an email account completes its initial mailbox synchronization"
---

# accountInitialized

The `accountInitialized` webhook event is triggered when an email account has successfully connected and completed its initial mailbox synchronization. This marks the point at which the account is fully operational and ready for use.

## When This Event is Triggered

The `accountInitialized` event fires when:

- An account establishes its **first successful connection** after being added or after a flush/reset
- The initial mailbox synchronization has completed
- The account transitions from "connecting" to "connected" state for the first time

This event is triggered only once per account initialization cycle. It will not fire on subsequent reconnections unless the account is flushed or reset.

### Technical Details

EmailEngine tracks the connection count for each account. When the account:
1. Transitions to the "connected" state
2. And the previous connection count was "0" (indicating first connection)
3. Then the `accountInitialized` event is fired

This ensures the event fires only on the first successful connection, not on routine reconnections.

## Common Use Cases

- **Account activation confirmation** - Know when accounts are fully ready to use
- **Onboarding completion** - Mark user onboarding as complete when their email is connected
- **Initial data sync** - Trigger processes that need mailbox data to be available
- **User notifications** - Inform users their email account is now active
- **Dashboard updates** - Update account status to "active" or "ready"
- **Start message processing** - Begin automated email processing workflows

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL, if set. `null` if not configured. |
| `account` | string | Yes | The unique account ID for the initialized account |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always `accountInitialized` for this event |
| `eventId` | string | Yes | Unique identifier for this webhook event (UUID format) |
| `data` | object | Yes | Event data object containing initialization details |

### Event Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `initialized` | boolean | Yes | Always `true`, indicating the account has been initialized |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:50:45.321Z",
  "event": "accountInitialized",
  "eventId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": {
    "initialized": true
  }
}
```

## Example Payload (Without Service URL)

When no service URL is configured:

```json
{
  "serviceUrl": null,
  "account": "gmail-user456",
  "date": "2025-10-17T08:16:15.000Z",
  "event": "accountInitialized",
  "eventId": "d4e5f6a7-b8c9-0123-def4-567890123456",
  "data": {
    "initialized": true
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleAccountInitialized(event) {
  const { account, date, eventId } = event;

  console.log(`Account initialized: ${account}`);
  console.log(`  Time: ${date}`);
  console.log(`  Event ID: ${eventId}`);

  // Mark account as ready in your system
  await markAccountReady(account);
}
```

### Updating Account Status

```javascript
async function handleAccountInitialized(event) {
  const { account, date, eventId } = event;

  // Update account status to active
  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'active',
      initializedAt: new Date(date),
      lastEventId: eventId
    }
  });

  // Log the initialization
  await auditLog.create({
    event: 'account_initialized',
    account,
    timestamp: date,
    eventId
  });
}
```

### Completing User Onboarding

```javascript
async function handleAccountInitialized(event) {
  const { account, date } = event;

  // Update account status
  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'active',
      initializedAt: new Date(date)
    }
  });

  // Notify user that setup is complete
  const user = await getUserByAccount(account);
  if (user) {
    await sendNotification({
      userId: user.id,
      type: 'account_ready',
      message: 'Your email account is now connected and ready to use!'
    });

    // Complete onboarding if this was their first account
    if (!user.onboardingComplete) {
      await completeOnboarding(user.id);
    }
  }
}
```

### Starting Automated Processing

```javascript
async function handleAccountInitialized(event) {
  const { account, date } = event;

  // Mark account as ready
  await db.accounts.update({
    where: { emailEngineId: account },
    data: { status: 'active' }
  });

  // Start any automated email processing for this account
  await startEmailProcessor(account);

  // Fetch initial mailbox statistics
  const mailboxes = await emailEngine.getMailboxes(account);
  await cacheMailboxStats(account, mailboxes);
}
```

## Event Sequence

When a new account is added, webhooks are typically received in this order:

1. **`accountAdded`** - Account configuration is stored
2. **`authenticationSuccess`** - Account authenticates with mail server
3. **`accountInitialized`** - Initial sync is complete (this event)

After this sequence, the account is fully operational.

### Re-initialization After Flush

When an account is flushed (via the [Flush Account API](/docs/api/post-v-1-account-account-flush)), the connection count is reset to 0. This means:

1. The account will disconnect and re-sync
2. A new `accountInitialized` event will fire after re-synchronization completes

This behavior is useful for:
- Resetting account state after configuration changes
- Recovering from synchronization issues
- Re-indexing mailbox contents

## Differences from Other Account Events

| Event | When Triggered | What It Means |
|-------|----------------|---------------|
| `accountAdded` | After account creation | Account config is stored, connection not yet attempted |
| `authenticationSuccess` | After successful authentication | Account can connect to mail server |
| `accountInitialized` | After first successful sync | Mailboxes synced, account fully operational (this event) |
| `accountDeleted` | When account is removed | Account has been deleted from EmailEngine |

## Related Events

- [accountAdded](/docs/receiving/webhooks/accountadded) - Triggered when account is first registered
- [authenticationSuccess](/docs/receiving/webhooks/authenticationsuccess) - Triggered when authentication succeeds
- [authenticationError](/docs/receiving/webhooks/authenticationerror) - Triggered when authentication fails
- [connectError](/docs/receiving/webhooks/connecterror) - Triggered when connection fails (network-level)
- accountDeleted - Triggered when an account is removed

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Account Management](/docs/accounts) - Managing email accounts
- [Create Account API](/docs/api/post-v-1-account) - API endpoint for creating accounts
- [Flush Account API](/docs/api/post-v-1-account-account-flush) - API endpoint for resetting account state
