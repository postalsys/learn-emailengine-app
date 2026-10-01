---
title: "authenticationSuccess"
sidebar_position: 18
description: "Webhook event triggered when an email account successfully authenticates with EmailEngine"
---

# authenticationSuccess

The `authenticationSuccess` webhook event is triggered when an email account authenticates with the mail server or the provider API after either never having done so or having had its credentials refused. It confirms a new account works and tells you when an account that was failing authentication has recovered.

## When This Event is Triggered

The `authenticationSuccess` event fires when an account logs in successfully and one of these is true:

1. The account has never reached the `connected` state before (initial connection, or the first connection after a [flush](/docs/api/put-v-1-account-account-flush))
2. The account carries a stored error from a previous [`authenticationError`](/docs/webhooks/authenticationerror), and has now recovered

It is **not** sent on every successful login. A routine reconnection after a dropped connection, a restart or a token renewal on an account that was not in an error state produces no webhook. The stored error is cleared once the account is connected again, so the next failure and recovery are reported as a fresh pair.

Recovery from a [`connectError`](/docs/webhooks/connecterror) does not send it either. Since EmailEngine 2.80.0 a login that follows a connection failure clears the stored error silently, because a server that was briefly unreachable says nothing about the credentials; before 2.80.0 it was reported as `authenticationSuccess`. Watch the account `state` through [Get Account](/docs/api/get-v-1-account-account) or the [`/v1/changes`](/docs/api/get-v-1-changes) stream to see a connection failure end.

For an IMAP account the event is sent as soon as the IMAP login succeeds, before folders are synced. For a Gmail API or Microsoft Graph account it is sent once the provider accepted the access token and returned the account profile, or, for an account in the `authenticationError` state, as soon as a token refresh succeeds.

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | Account ID that authenticated |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Always `authenticationSuccess` |
| `data` | object | Yes | Authentication details (see below) |

### Authentication Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | string | Yes | The username the login used. For an IMAP account this is `imap.auth.user`; for an OAuth2 account it is `oauth2.auth.user`, the email address of the authorized mailbox |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

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

For accounts using the Gmail API:

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

For accounts using the Microsoft Graph API or Outlook IMAP with OAuth2:

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

The event arrives both for a first login and for a recovery, and the payload does not say which. Your own record of the account tells them apart:

```javascript
async function handleAuthenticationSuccess(event) {
  const { account, data, date } = event;

  const accountRecord = await db.accounts.findUnique({
    where: { emailEngineId: account }
  });

  if (accountRecord?.status === 'authentication_error') {
    await sendNotification({
      type: 'account_recovered',
      account,
      message: `Email account ${data.user} is connected again`
    });
  }

  await db.accounts.update({
    where: { emailEngineId: account },
    data: {
      status: 'connected',
      lastConnectedAt: new Date(date),
      lastError: null,
      lastErrorCode: null
    }
  });
}
```

## Event Sequence

When a new account is added, you receive webhooks in this order:

1. `accountAdded` - Account is registered with EmailEngine
2. `authenticationSuccess` - The mail server or provider accepted the credentials
3. `accountInitialized` - The account reached `connected`

For an IMAP account the first pass over the folders separates the last two. For a Gmail API or Microsoft Graph account both are sent during initialization, in the same order. Before EmailEngine 2.80.0 the API-based accounts sent `accountInitialized` first; do not depend on the order between the two if you support older releases.

When an account recovers from an authentication error:

1. (Earlier) `authenticationError` - The credential was refused
2. (Later) `authenticationSuccess` - The login succeeded after the cause was fixed

An account that was [switched off after repeated authentication failures](/docs/webhooks/authenticationerror#parked-after-repeated-failures) sends this event once it has been re-authorized or resumed and logs in again.

## Related Events

- [authenticationError](/docs/webhooks/authenticationerror) - Triggered when authentication fails
- [connectError](/docs/webhooks/connecterror) - Triggered when the connection fails, which this event does not report recovery from
- [accountAdded](/docs/webhooks/accountadded) - Triggered when a new account is registered
- [accountInitialized](/docs/webhooks/accountinitialized) - Triggered when the first sync completes

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Account Management](/docs/accounts/managing-accounts) - Account states, reconnecting and re-enabling accounts
- [Gmail OAuth2 Setup](/docs/accounts/gmail/gmail-imap) - Setting up Gmail with OAuth2
- [Outlook OAuth2 Setup](/docs/accounts/microsoft-365/outlook-365) - Setting up Outlook with OAuth2
- [Troubleshooting](/docs/troubleshooting) - Diagnosing an account that never sends this event
