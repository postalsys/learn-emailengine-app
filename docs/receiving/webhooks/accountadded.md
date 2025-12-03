---
title: "accountAdded"
sidebar_position: 6
description: "Webhook event triggered when a new email account is registered with EmailEngine"
---

# accountAdded

The `accountAdded` webhook event is triggered when a new email account is registered with EmailEngine. This is the first webhook event in the account lifecycle and signals that the account configuration has been accepted and stored.

## When This Event is Triggered

The `accountAdded` event fires immediately after:

- A new account is created via the [Create Account API](/docs/api/post-v-1-account)
- A user completes the [hosted authentication form](/docs/accounts/hosted-authentication)
- An account is registered through any other account creation method

This event fires **before** EmailEngine attempts to connect to the mail server. The account has been registered, but authentication has not yet been verified.

## Common Use Cases

- **Account registration tracking** - Log when new accounts are added to your system
- **Welcome workflows** - Trigger onboarding processes for new email connections
- **Billing integration** - Start billing cycles when accounts are registered
- **User notifications** - Inform users their account is being set up
- **Audit logging** - Track all account additions for compliance purposes
- **Dashboard updates** - Show newly added accounts in pending/connecting state

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL, if set |
| `account` | string | Yes | The unique account ID for the newly registered account |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always `accountAdded` for this event |
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
  "date": "2025-10-17T06:49:22.157Z",
  "event": "accountAdded",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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
  "date": "2025-10-17T08:15:30.000Z",
  "event": "accountAdded",
  "eventId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "data": {
    "account": "gmail-user456"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleAccountAdded(event) {
  const { account, date, eventId } = event;

  console.log(`New account registered: ${account}`);
  console.log(`  Time: ${date}`);
  console.log(`  Event ID: ${eventId}`);

  // Record the new account in your system
  await createAccountRecord(account);
}
```

### Creating Account Records in Database

```javascript
async function handleAccountAdded(event) {
  const { account, date, eventId } = event;

  // Create initial account record
  await db.accounts.create({
    data: {
      emailEngineId: account,
      status: 'connecting',
      createdAt: new Date(date),
      lastEventId: eventId
    }
  });

  // Log the account addition
  await auditLog.create({
    event: 'account_added',
    account,
    timestamp: date,
    eventId
  });
}
```

### Triggering Onboarding Workflows

```javascript
async function handleAccountAdded(event) {
  const { account, date } = event;

  // Create account record with pending status
  await db.accounts.create({
    data: {
      emailEngineId: account,
      status: 'pending_authentication',
      createdAt: new Date(date)
    }
  });

  // Send welcome notification to user
  const user = await getUserByAccount(account);
  if (user) {
    await sendNotification({
      userId: user.id,
      type: 'account_connecting',
      message: 'Your email account is being connected...'
    });
  }

  // Set up a timeout to check if authentication succeeds
  await scheduleJob('check_account_connection', {
    account,
    checkAfterMinutes: 5
  });
}
```

### Billing Integration

```javascript
async function handleAccountAdded(event) {
  const { account, date } = event;

  // Get user associated with this account
  const user = await getUserByAccount(account);

  if (user) {
    // Update billing records
    await billing.addAccount({
      userId: user.id,
      accountId: account,
      startDate: new Date(date)
    });

    // Check account limits
    const accountCount = await getAccountCount(user.id);
    const plan = await getUserPlan(user.id);

    if (accountCount > plan.maxAccounts) {
      await billing.upgradeRequired(user.id, 'account_limit_exceeded');
    }
  }
}
```

## Event Sequence

When a new account is added, you will receive webhooks in this order:

1. **`accountAdded`** - Account is registered (this event)
2. **`authenticationSuccess`** - Account successfully authenticates with mail server
3. **`accountInitialized`** - Initial mailbox sync is complete

If authentication fails:

1. **`accountAdded`** - Account is registered (this event)
2. **`authenticationError`** or **`connectError`** - Connection or authentication fails

## Differences from Other Account Events

| Event | When Triggered | What It Means |
|-------|----------------|---------------|
| `accountAdded` | Immediately after account creation | Account config is stored, connection not yet attempted |
| `authenticationSuccess` | After successful authentication | Account can connect to mail server |
| `accountInitialized` | After first successful sync | Mailboxes and messages are available |
| `accountDeleted` | When account is removed | Account has been deleted from EmailEngine |

## Related Events

- [authenticationSuccess](/docs/receiving/webhooks/authenticationsuccess) - Triggered when authentication succeeds
- [authenticationError](/docs/receiving/webhooks/authenticationerror) - Triggered when authentication fails
- [connectError](/docs/receiving/webhooks/connecterror) - Triggered when connection fails (network-level)
- accountInitialized - Triggered when initial sync completes
- accountDeleted - Triggered when an account is removed

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Account Management](/docs/accounts) - Managing email accounts
- [Create Account API](/docs/api/post-v-1-account) - API endpoint for creating accounts
- [Hosted Authentication](/docs/accounts/hosted-authentication) - Using the hosted authentication form
