---
title: "accountInitialized"
sidebar_position: 16
description: "Webhook event triggered when an email account completes its initial mailbox synchronization"
---

# accountInitialized

The `accountInitialized` webhook event is triggered when an email account reaches the `connected` state for the first time. For an IMAP account that is after the first pass over its folders; for a Gmail API or Microsoft Graph account it is after the provider accepted the access token and returned the account profile. From this point the account is operational.

## When This Event is Triggered

The `accountInitialized` event fires when:

- An account reaches the `connected` state for the **first time** after being added
- An account reaches the `connected` state again after a [flush](/docs/api/put-v-1-account-account-flush)

It fires once per initialization cycle. Routine reconnections, restarts and recoveries from error states do not fire it again unless the account has been flushed in between.

### Technical Details

EmailEngine keeps a per-account counter of how many times the account has entered the `connected` state. The counter is created at `0` when the account is registered, and reset to `0` by a flush. When the state becomes `connected` and the counter moves from `0` to `1`, the event is sent.

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | The account ID that was initialized |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Always `accountInitialized` |
| `data` | object | Yes | Event data object |

### Event Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `initialized` | boolean | Yes | Always `true` |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header, which is what to deduplicate on. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:50:45.321Z",
  "event": "accountInitialized",
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
  "data": {
    "initialized": true
  }
}
```

## Handling the Event

This is the point at which the account's folders and messages can be listed through the API, so it is where work that needs mailbox data belongs:

```javascript
async function handleAccountInitialized(event) {
  const { account, date } = event;

  await db.accounts.update({
    where: { emailEngineId: account },
    data: { status: 'active', initializedAt: new Date(date) }
  });

  // The folder listing is available from here on
  const response = await fetch(
    `https://emailengine.example.com/v1/account/${account}/mailboxes`,
    { headers: { Authorization: `Bearer ${process.env.EE_TOKEN}` } }
  );
  const { mailboxes } = await response.json();
  await cacheFolders(account, mailboxes);
}
```

## Event Sequence

When a new account is added, webhooks arrive in this order:

1. **`accountAdded`** - Account configuration is stored
2. **`authenticationSuccess`** - The mail server or provider accepted the credentials
3. **`accountInitialized`** - The account reached `connected` (this event)

For an IMAP account the first pass over the folders separates the last two. For a Gmail API or Microsoft Graph account both are sent during initialization, in the same order. Before EmailEngine 2.80.0 the API-based accounts sent `accountInitialized` first; do not depend on the order between the two if you support older releases.

### Re-initialization After Flush

The [Flush Account API](/docs/api/put-v-1-account-account-flush) resets the connection counter to `0` and discards the account's mailbox listing and sync state, so:

1. The account disconnects and re-syncs from the current point in time
2. A new `accountInitialized` event fires when it reaches `connected` again

Flushing is the way to re-run the initial sync after a configuration change without deleting and re-adding the account.

## Differences from Other Account Events

| Event | When Triggered | What It Means |
|-------|----------------|---------------|
| `accountAdded` | After account creation | Account config is stored, connection not yet attempted |
| `authenticationSuccess` | After successful authentication | Account can connect to mail server |
| `accountInitialized` | On the first `connected` state | Account is operational (this event) |
| `accountDeleted` | When account is removed | Account has been deleted from EmailEngine |

## Related Events

- [accountAdded](/docs/webhooks/accountadded) - Triggered when account is first registered
- [authenticationSuccess](/docs/webhooks/authenticationsuccess) - Triggered when authentication succeeds
- [authenticationError](/docs/webhooks/authenticationerror) - Triggered when authentication fails
- [connectError](/docs/webhooks/connecterror) - Triggered when the connection fails before authentication
- [accountDeleted](/docs/webhooks/accountdeleted) - Triggered when an account is removed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Account Management](/docs/accounts/managing-accounts) - Account states and the lifecycle around them
- [Create Account API](/docs/api/post-v-1-account) - Registering the account this event follows
- [Flush Account API](/docs/api/put-v-1-account-account-flush) - Re-running the initial sync and this event
