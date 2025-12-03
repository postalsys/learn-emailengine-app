---
title: "authenticationSuccess"
sidebar_position: 18
description: "Webhook event triggered when an email account successfully authenticates with EmailEngine"
---

# authenticationSuccess

The `authenticationSuccess` webhook event is triggered when an email account successfully authenticates with the mail server or email API. This event helps you monitor account health and confirm that previously problematic accounts have recovered.

## When This Event is Triggered

The `authenticationSuccess` event fires when:

- An account successfully establishes an IMAP session for the **first time** after being added
- An account recovers from a previous authentication error state
- An account reconnects after being in a disconnected or errored state

This event is **not** sent on every successful connection. EmailEngine tracks connection history and only sends this webhook when:

1. The account has never successfully connected before (initial connection)
2. The account was previously in an error state (`authenticationError` or `connectError`) and has now recovered

This intelligent filtering prevents webhook spam during normal reconnection cycles.

## Common Use Cases

- **Account activation tracking** - Confirm that newly added accounts are working
- **Error recovery monitoring** - Know when previously failing accounts recover
- **Dashboard updates** - Update account status from "error" to "connected" in your UI
- **Workflow triggers** - Start processing emails only after successful authentication
- **Compliance logging** - Track account connectivity history for auditing
- **User notifications** - Inform users that their email connection has been restored

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that successfully authenticated |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "authenticationSuccess" for this event |
| `data` | object | Yes | Authentication details object (see below) |

### Authentication Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | string | Yes | The email address or username used for authentication |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:49:22.157Z",
  "event": "authenticationSuccess",
  "data": {
    "user": "user@example.com"
  }
}
```

## Example Payload (Gmail API Account)

For accounts using Gmail API with OAuth2:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user456",
  "date": "2025-10-17T08:15:30.000Z",
  "event": "authenticationSuccess",
  "data": {
    "user": "user@gmail.com"
  }
}
```

## Example Payload (Outlook Account)

For accounts using Microsoft Graph API or Outlook IMAP with OAuth2:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user789",
  "date": "2025-10-17T09:30:45.000Z",
  "event": "authenticationSuccess",
  "data": {
    "user": "user@outlook.com"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleAuthenticationSuccess(event) {
  const { account, data, date } = event;

  console.log(`Account ${account} authenticated successfully`);
  console.log(`  User: ${data.user}`);
  console.log(`  Time: ${date}`);

  // Update account status in your system
  await updateAccountStatus(account, 'connected');
}
```

### Updating Account Status in Database

```javascript
async function handleAuthenticationSuccess(event) {
  const { account, data, date } = event;

  // Update account status in your database
  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'connected',
      lastConnectedAt: new Date(date),
      lastError: null,
      lastErrorCode: null,
      lastErrorAt: null
    }
  });

  // Clear any pending error notifications
  await clearAccountAlerts(account);
}
```

### Handling Recovery from Errors

```javascript
async function handleAuthenticationSuccess(event) {
  const { account, data, date } = event;

  // Check if this account was previously in error state
  const accountRecord = await db.accounts.findUnique({
    where: { emailEngineId: account }
  });

  if (accountRecord?.status === 'authentication_error') {
    // Account has recovered - notify relevant parties
    console.log(`Account ${account} recovered from authentication error`);

    await sendNotification({
      type: 'account_recovered',
      account,
      message: `Email account ${data.user} is now connected`,
      previousStatus: accountRecord.status,
      recoveredAt: date
    });
  }

  // Update status regardless
  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'connected',
      lastConnectedAt: new Date(date)
    }
  });
}
```

### Triggering Post-Authentication Workflows

```javascript
async function handleAuthenticationSuccess(event) {
  const { account, data, date } = event;

  // Check if this is the initial connection
  const isNewAccount = await checkIfNewAccount(account);

  if (isNewAccount) {
    // Trigger initial setup workflows
    await startInitialSync(account);
    await setupAccountFilters(account);
    await notifyUser(account, 'Your email account is now connected');
  }

  // Log successful authentication
  await auditLog.create({
    event: 'authentication_success',
    account,
    user: data.user,
    timestamp: date
  });
}
```

## Event Sequence

When a new account is added, you will typically receive webhooks in this order:

1. `accountAdded` - Account is registered with EmailEngine
2. `authenticationSuccess` - Account successfully authenticates
3. `accountInitialized` - Initial mailbox sync is complete

When an account recovers from an error:

1. (Previous) `authenticationError` - Authentication failed
2. (Later) `authenticationSuccess` - Authentication succeeded after recovery

## Related Events

- [authenticationError](/docs/webhooks/authenticationerror) - Triggered when authentication fails
- [connectError](/docs/webhooks/connecterror) - Triggered when connection fails (network-level, not authentication)
- [accountAdded](/docs/webhooks/accountadded) - Triggered when a new account is registered
- [accountInitialized](/docs/webhooks/accountinitialized) - Triggered when initial sync completes

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Account Management](/docs/accounts) - Managing email accounts
- [Gmail OAuth2 Setup](/docs/accounts/gmail-imap) - Setting up Gmail with OAuth2
- [Outlook OAuth2 Setup](/docs/accounts/outlook-imap) - Setting up Outlook with OAuth2
- [Troubleshooting](/docs/support/troubleshooting) - Common issues and solutions
