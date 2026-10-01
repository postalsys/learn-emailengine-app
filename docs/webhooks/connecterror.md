---
title: "connectError"
sidebar_position: 20
description: "Webhook event triggered when EmailEngine cannot establish a connection to an email server or keep an account's change feed alive"
---

# connectError

The `connectError` webhook event is triggered when EmailEngine cannot reach an account's mail server, or can reach it but the server cannot serve the account right now. It covers network-level and server-level failures, as distinct from a credential the server refused, which is [`authenticationError`](/docs/webhooks/authenticationerror).

## When This Event is Triggered

For an IMAP account, the `connectError` event fires when a connection attempt fails for a reason other than refused credentials:

- The server is unreachable (network timeout, DNS failure)
- The server refuses the connection (port closed, firewall blocking)
- The TLS handshake fails
- The server returns an error before authentication, or drops the connection during it
- The server answers the login with a `NO` that is its own problem rather than the credential's: one carrying the RFC 5530 code `UNAVAILABLE`, `SERVERBUG`, `INUSE` or `LIMIT`, or Exchange Online's `User is authenticated but not connected.`, which its front end sends when the mailbox's backend cannot be reached and also, permanently, when IMAP is disabled for the mailbox. Before EmailEngine 2.80.1 these were reported as `authenticationError`
- The credential service the account depends on could not be reached, or answered 408, 429 or a 5xx status: the OAuth2 token endpoint for an account that authenticates with OAuth2, or the [external authentication server](/docs/accounts/authentication-server). Before 2.80.0 these were reported as `authenticationError`

For a Microsoft Graph account, since 2.80.0, it fires when the account's change subscription cannot be created or renewed after the retries are spent, with `serverResponseCode: "SubscriptionSetupError"`. A Graph account has no polling fallback, so without a subscription it sees no new mail at all; a tenant that disables the Exchange Online service principal hits this while every token refresh keeps succeeding. The account stays in the `connectError` state, and its own API operations answer 503, until a subscription can be established again; EmailEngine keeps trying once an hour.

Gmail API accounts do not send `connectError`. A transport failure against the Gmail API is retried, and a rejected token is [`authenticationError`](/docs/webhooks/authenticationerror).

EmailEngine reports the **first occurrence** of a failure and suppresses repeats until the error changes or the account connects. See [Webhook Deduplication](#webhook-deduplication).

A connection attempt that EmailEngine itself interrupted, because the account was paused, deleted or reconfigured while it was connecting, does not fire the event.

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | Account ID that experienced the connection failure |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Always `connectError` |
| `data` | object | Yes | Error details (see below) |

### Error Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `response` | string | Yes | The server's response text if it sent one, otherwise the error message from the connection attempt |
| `serverResponseCode` | string | No | The server's response code if it sent one, otherwise the error code from the connection attempt, such as Node.js's `ECONNREFUSED`, or one of EmailEngine's own codes below. Missing when the failure carried neither |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

## Server Response Codes

Most connection failures carry a Node.js system error code as `serverResponseCode`:

| Code | Description |
|------|-------------|
| `ECONNREFUSED` | Connection refused: nothing is accepting connections on the host and port |
| `ECONNRESET` | Connection reset: the server closed the connection unexpectedly |
| `ETIMEDOUT` | Connection timed out: no response from the server |
| `ENOTFOUND` | DNS lookup failed: the hostname could not be resolved |
| `EHOSTUNREACH` | Host unreachable: no route to the server |
| `ECONNABORTED` | Connection aborted |
| `CERT_HAS_EXPIRED` | The server's TLS certificate has expired |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | The server's TLS certificate could not be verified |
| `SELF_SIGNED_CERT_IN_CHAIN` | A self-signed certificate is in the chain |
| `DEPTH_ZERO_SELF_SIGNED_CERT` | The server presented a self-signed certificate |

When the server answered but could not serve the account, the code is the IMAP response code from that answer:

| Code | Description |
|------|-------------|
| `UNAVAILABLE` | A subsystem the login depends on is down |
| `SERVERBUG` | The server reported an internal error |
| `INUSE` | The mailbox is in use by another session, on a server that allows only one |
| `LIMIT` | A server limit was hit |

Exchange Online's `User is authenticated but not connected.` carries no response code, so that payload has `response` and no `serverResponseCode`.

Codes EmailEngine sets itself:

| Code | Account type | Description |
|------|--------------|-------------|
| `ETokenRefresh` | IMAP with OAuth2 | The OAuth2 token endpoint answered 408, 429 or a 5xx status, so the access token could not be renewed. A refusal is `authenticationError` instead. A token endpoint that could not be reached at all reports the transport error, such as `fetch failed`, with no code |
| `HTTPRequestError` | IMAP, with an authentication server | The [authentication server](/docs/accounts/authentication-server) answered 408, 429 or a 5xx status. A refusal is `authenticationError` instead. A server that could not be reached at all reports the transport error, with no code |
| `SubscriptionSetupError` | Microsoft Graph | The change subscription could not be created or renewed. `response` carries the last error Microsoft Graph returned, or `MS Graph subscription creation failed` / `MS Graph subscription renewal failed` when none was recorded |

## Example Payload (Connection Refused)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T14:30:00.000Z",
  "event": "connectError",
  "data": {
    "response": "connect ECONNREFUSED 192.168.1.100:993",
    "serverResponseCode": "ECONNREFUSED"
  }
}
```

## Example Payload (DNS Failure)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "remote-user",
  "date": "2025-10-17T16:20:00.000Z",
  "event": "connectError",
  "data": {
    "response": "getaddrinfo ENOTFOUND mail.invalid-domain.example",
    "serverResponseCode": "ENOTFOUND"
  }
}
```

## Example Payload (TLS Certificate Error)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "secure-account",
  "date": "2025-10-17T17:00:00.000Z",
  "event": "connectError",
  "data": {
    "response": "certificate has expired",
    "serverResponseCode": "CERT_HAS_EXPIRED"
  }
}
```

## Example Payload (Server Could Not Serve the Login)

An Exchange Online mailbox whose backend was unreachable at login:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "office-account",
  "date": "2025-10-17T15:45:00.000Z",
  "event": "connectError",
  "data": {
    "response": "User is authenticated but not connected."
  }
}
```

## Example Payload (Microsoft Graph Subscription)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user789",
  "date": "2025-10-17T18:10:00.000Z",
  "event": "connectError",
  "data": {
    "response": "MS Graph subscription creation failed",
    "serverResponseCode": "SubscriptionSetupError"
  }
}
```

## Handling the Event

Most codes describe the network between EmailEngine and the mail server, which EmailEngine keeps retrying on its own. `SubscriptionSetupError` is the one that needs a tenant administrator rather than time:

```javascript
async function handleConnectError(event) {
  const { account, data } = event;

  switch (data.serverResponseCode) {
    case 'SubscriptionSetupError':
      // A Microsoft 365 tenant problem. Re-authorizing the account does not help
      await notifyAdmin(account, {
        message: 'Microsoft Graph change subscription failed, check the tenant',
        error: data.response
      });
      break;
    case 'ENOTFOUND':
      await notifyAdmin(account, {
        message: 'DNS lookup failed, verify the mail server hostname',
        error: data.response
      });
      break;
    case 'CERT_HAS_EXPIRED':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'SELF_SIGNED_CERT_IN_CHAIN':
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
      await notifyAdmin(account, {
        message: 'TLS certificate error on the mail server',
        error: data.response
      });
      break;
    default:
      // Unreachable or overloaded. EmailEngine retries; record it and watch for recovery
      await db.accounts.update({
        where: { emailEngineId: account },
        data: { status: 'connection_error', lastError: data.response }
      });
  }
}
```

## Distinguishing connectError from authenticationError

| Aspect | connectError | authenticationError |
|--------|--------------|---------------------|
| **When triggered** | The connection cannot be established, or the server or credential service cannot serve the account right now | The server, provider or authentication server refused the credential |
| **Typical causes** | Network issues, server down, firewall, TLS problems, a throttled token endpoint, a lost Graph subscription | Invalid credentials, expired or revoked OAuth2 grants |
| **Account state** | `connectError` | `authenticationError`, then `unset` once the account is switched off |
| **User action** | Usually none, wait for the server to recover. A tenant administrator for `SubscriptionSetupError` | Update credentials or re-authorize |
| **Resolution** | Automatic once the server is reachable | Requires new credentials |
| **Recovery webhook** | None, the account state returns to `connected` | `authenticationSuccess` |

## Webhook Deduplication

EmailEngine stores the last error for each account and compares each new failure against it:

1. **First occurrence** - Reported at once, and the stored error is set
2. **Same code** - A failure with the same `serverResponseCode` as the stored error is treated as a repeat and not reported, even if `response` differs
3. **Different code** - A different `serverResponseCode` is a new failure and is reported. A server that goes from `ETIMEDOUT` to `ECONNREFUSED` while it is being restarted therefore produces two webhooks
4. **No code** - When neither error carries a code, the whole `data` object is compared, and any difference is reported
5. **Recovery** - A successful login clears the stored error, so the next failure is a first occurrence again. No webhook is sent for it: since EmailEngine 2.80.0 [`authenticationSuccess`](/docs/webhooks/authenticationsuccess) reports recovery from an `authenticationError` only. A `SubscriptionSetupError` is not cleared by a login at all, only by a subscription that works again, because a Graph account can log in perfectly while it is unable to subscribe

The stored error is shared between `connectError` and `authenticationError`, so a connection failure that follows an unresolved authentication failure is reported as a change, and the reverse likewise.

## Automatic Retry Behavior

After a connection failure an IMAP account stays in the `connectError` state and EmailEngine keeps retrying on its own, with exponential backoff that starts at 2 seconds and is capped at 10 minutes between attempts. The retries continue until:

- The connection succeeds
- The account is deleted, paused, or disabled
- The account configuration is updated, which starts a fresh connection

A Microsoft Graph account whose subscription failed is retried by the hourly subscription pass.

You do not need to request a [reconnect](/docs/accounts/managing-accounts#reconnecting-accounts) from your webhook handler; one only shortens the wait until the next attempt.

## Related Events

- [authenticationError](/docs/webhooks/authenticationerror) - Triggered when the credential is refused
- [authenticationSuccess](/docs/webhooks/authenticationsuccess) - Triggered when an account recovers from an authentication error
- [accountAdded](/docs/webhooks/accountadded) - Triggered when a new account is registered
- [accountDeleted](/docs/webhooks/accountdeleted) - Triggered when an account is removed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Account Management](/docs/accounts/managing-accounts) - Account states and reconnecting accounts
- [IMAP Configuration](/docs/accounts/imap-smtp) - Host, port and TLS settings that a connection failure points at
- [Outlook and Microsoft 365](/docs/accounts/microsoft-365/outlook-365) - The Graph subscription a `SubscriptionSetupError` refers to
- [Troubleshooting](/docs/troubleshooting) - Diagnosing connectivity between EmailEngine and a mail server
