---
title: Accounts API
description: Reference for the account object, account states, the account endpoints and the account state stream
sidebar_position: 3
---

# Accounts API

This page is the reference for the account resource: the fields an account carries, the states it moves through, what each account endpoint answers, and the Server-Sent Events stream that reports state changes. The step-by-step guide to registering, updating and recovering accounts is [Managing Accounts](/docs/accounts/managing-accounts); each endpoint's full request and response schema is on its generated page, linked from the table below.

## Endpoints

| Operation | Endpoint | Permission |
| --- | --- | --- |
| [Register account](/docs/api/post-v-1-account) | `POST /v1/account` | `write` / `provisioning` |
| [List accounts](/docs/api/get-v-1-accounts) | `GET /v1/accounts` | `read` / `account` |
| [Get account](/docs/api/get-v-1-account-account) | `GET /v1/account/{account}` | `read` / `account` |
| [Update account](/docs/api/put-v-1-account-account) | `PUT /v1/account/{account}` | `write` / `provisioning` |
| [Delete account](/docs/api/delete-v-1-account-account) | `DELETE /v1/account/{account}` | `destructive` / `account` |
| [Request reconnect](/docs/api/put-v-1-account-account-reconnect) | `PUT /v1/account/{account}/reconnect` | `write` / `account` |
| [Request sync](/docs/api/put-v-1-account-account-sync) | `PUT /v1/account/{account}/sync` | `write` / `account` |
| [Request flush](/docs/api/put-v-1-account-account-flush) | `PUT /v1/account/{account}/flush` | `destructive` / `account` |
| [Verify IMAP and SMTP settings](/docs/api/post-v-1-verifyaccount) | `POST /v1/verifyAccount` | `read` / `provisioning` |
| [Discover email settings](/docs/api/get-v-1-autoconfig) | `GET /v1/autoconfig` | `read` / `diagnostics` |
| [Discover email settings with credentials](/docs/api/post-v-1-autoconfig) | `POST /v1/autoconfig` | `read` / `provisioning` |
| [Generate authentication link](/docs/api/post-v-1-authentication-form) | `POST /v1/authentication/form` | `write` / `provisioning` |
| [Get OAuth2 access token](/docs/api/get-v-1-account-account-oauthtoken) | `GET /v1/account/{account}/oauth-token` | `read` / `admin` |
| [List account signatures](/docs/api/get-v-1-account-account-serversignatures) | `GET /v1/account/{account}/server-signatures` | `read` / `account` |
| [Return stored logs](/docs/api/get-v-1-logs-account) | `GET /v1/logs/{account}` | `read` / `logs` |
| [Stream state changes](/docs/api/get-v-1-changes) | `GET /v1/changes` | `read` / `events` |

The permission column is the `x-ee-action` and `x-ee-group` pair the operation publishes in the OpenAPI document. A token narrowed with a `permissions` record has to allow both; creating and reconfiguring accounts is in the `provisioning` group rather than `account`, because a change to nothing but `host` makes the next connection send the stored password to the new host. The `admin` group can never be granted. See [Access Tokens](/docs/api-reference/access-tokens#permissions).

## The Account Object

`GET /v1/account/{account}` returns the stored account with its credentials masked:

```json
{
  "account": "user@example.com",
  "name": "John Doe",
  "email": "user@example.com",
  "state": "connected",
  "syncTime": "2025-01-15T10:30:00.000Z",
  "notifyFrom": "2025-01-01T00:00:00.000Z",
  "lastError": null,
  "authFailureDisabledAt": null,
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "disabled": false
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "disabled": false
  },
  "type": "gmail",
  "oauth2": {
    "provider": "AAABhaBPHscAAAAH",
    "auth": {
      "user": "user@example.com"
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `account` | string | Unique account identifier |
| `name` | string | Display name |
| `email` | string | Email address |
| `type` | string | How the account connects: `imap`, `gmail`, `gmailService`, `outlook`, `outlookService` or `mailRu`. `oauth2` is an OAuth2 account whose application is no longer configured in EmailEngine, `delegated` a shared mailbox reached through another account's credentials, `sending` a send-only account with no IMAP access, and `invalid` a delegated account whose delegation could not be resolved |
| `app` | string | OAuth2 application ID, for OAuth2 accounts |
| `state` | string | Connection state, see [Account States](#account-states) |
| `syncTime` | string | ISO 8601 date-time of the last sync (IMAP accounts only) |
| `notifyFrom` | string | ISO date to send webhooks from |
| `lastError` | object | Last error details, or `null` |
| `authFailureDisabledAt` | string | When EmailEngine switched syncing off after repeated authentication failures, or `null`. Read-only |
| `syncError` | object | The last mailbox sync error (IMAP accounts only) |
| `smtpStatus` | object | The last SMTP connection attempt, or `null` if none was made |
| `connections` | number | Open IMAP connections for this account |
| `sendOnly` | boolean | `true` for an account that does not sync messages |
| `imap` | object | IMAP connection settings. `imap.disabled` is the operator's own switch for turning syncing off |
| `smtp` | object | SMTP connection settings |
| `oauth2` | object | OAuth2 configuration |
| `path` | array | Mailbox folders to monitor (IMAP only), `"*"` for all |
| `imapIndexer` | string | Per-account override of the IMAP indexing strategy, `full` or `fast`. Absent when the account follows the instance setting |
| `expectedEmail` | string | The address the account is pinned to. A hosted authentication form that completes as another identity is rejected |
| `copy` | boolean | Whether submitted messages are copied to the Sent folder |
| `logs` | boolean | Whether recent logs are stored for the account, readable with `GET /v1/logs/{account}` |
| `subconnections` | array | Folders monitored with a dedicated IMAP connection each |
| `webhooks` | string | Account-specific webhook URL |
| `webhooksCustomHeaders` | array | Extra headers sent with every webhook for this account |
| `proxy` | string | Proxy URL for this account's outbound connections, used instead of the instance-wide proxy: IMAP and SMTP sessions and, for an OAuth2 account, its token requests and Gmail API or Microsoft Graph requests. See [What the per-account proxy covers](/docs/accounts/imap-smtp#what-the-per-account-proxy-covers) |
| `smtpEhloName` | string | Hostname used in SMTP EHLO |
| `locale`, `tz` | string | Default locale and timezone for content rendered for this account |
| `counters` | object | Cumulative event counters (`counters.events`) for the account lifetime |
| `quota` | object or `false` | Mailbox quota, only with `?quota=true`. `false` when the server reports none, and for Gmail API and MS Graph accounts, which do not report one (since 2.79.6; earlier releases omitted the field for those) |
| `baseScopes` | string | What the OAuth2 grant was requested for: `imap`, `api` or `pubsub`. OAuth2 accounts only |
| `gmailWatch` | object | State of the Gmail Pub/Sub watch: `state`, `lastCheck` and timing. Gmail API accounts only. A watch that is not active delays new mail rather than losing it, since the client falls back to polling |
| `outlookSubscription` | object | Microsoft Graph change subscription details (Outlook accounts only) |

The [endpoint reference](/docs/api/get-v-1-account-account) documents every nested field. Stored passwords, the credentials in a proxy or webhook URL and the values of custom webhook headers read back as `******`; a masked value written back replaces the stored one, so leave the field out of an update instead.

Each entry of `GET /v1/accounts` carries a subset: `account`, `name`, `email`, `type`, `app`, `state`, `webhooks`, `proxy`, `smtpEhloName`, `counters`, `syncTime`, `authFailureDisabledAt`, `lastError` and, for delegated accounts, `delegationError`. The listing always carries `query` (the filter string, or `false`) and `state` (the filter, or `*`) next to `total`, `page`, `pages` and `accounts`.

### Account States

| State | Meaning |
|-------|---------|
| `init` | The account was just registered and has not connected yet |
| `unset` | The account is not syncing: either no IMAP or OAuth2 configuration is set, or syncing was switched off, by the operator or automatically after repeated authentication failures |
| `connecting` | Connecting to the mail server or authorizing with the provider |
| `syncing` | Connected and performing the initial or a periodic mailbox sync |
| `connected` | Connected and watching for changes. This is the healthy steady state |
| `disconnected` | The connection dropped and EmailEngine is retrying with backoff |
| `connectError` | The server could not be reached, the TLS handshake failed, or a login failed for a reason other than a refused credential. Retried with backoff |
| `authenticationError` | The credentials were rejected. Requires re-authentication before syncing resumes |
| `paused` | Syncing was paused through the API. No connection is maintained |

`connected` and `syncing` are both healthy. Treat `connecting`, `syncing`, and `disconnected` as transient and let EmailEngine recover on its own. Only `authenticationError` always needs a human or an OAuth2 re-authorization; a `connectError` that persists usually points at the network or the server rather than at the account. `authenticationError` is the state worth alerting on, together with `unset` while `authFailureDisabledAt` is set. `GET /v1/accounts?state=authenticationError` lists the accounts in one state, and the [state stream](#streaming-account-state-changes) reports transitions as they happen.

### Accounts switched off automatically

An account that keeps failing to authenticate for longer than `EENGINE_MAX_IMAP_AUTH_FAILURE_TIME` (3 days by default) is switched off: EmailEngine stops connecting, the account reports the `unset` state, and `authFailureDisabledAt` records when that happened. Since EmailEngine 2.79.3 this applies to OAuth2 accounts as well, so a revoked refresh token is no longer retried indefinitely.

The operator's own switch, `imap.disabled`, puts an account in the same `unset` state, so `authFailureDisabledAt` is what tells an automatic disable from a deliberate one: an account with `authFailureDisabledAt` set was parked by EmailEngine, one with `imap.disabled` and no timestamp was disabled on purpose.

Supplying working credentials lifts the switch and reconnects the account: `PUT /v1/account/{account}` with new `imap` settings, or a new OAuth2 authorization through the [hosted authentication form](/docs/accounts/hosted-authentication). In 2.79.4 a partial IMAP update that only changes the password keeps the flag unless it also sets `disabled` to `false`; 2.79.5 lifts it on the changed `imap.auth` alone. The admin account page shows the reason and the time, with a **Resume syncing** button. Calling reconnect on a parked account does nothing and answers `{"reconnect": false}`.

The field, both recovery paths and the reconnect response date from EmailEngine 2.79.4. 2.79.3 recorded the park only as `imap.disabled`, so re-authorizing an OAuth2 account it had parked reported success without lifting anything. 2.79.5 marks those OAuth2 accounts on its first start so that they become recoverable; their `authFailureDisabledAt` then holds the time of that start rather than the original park. 2.79.5 also stops parking delegated accounts, since the owner of the borrowed credential is what gets switched off, and stop reporting a switched-off account as send-only in the accounts listing and the admin interface, though this endpoint still answers `sending` with `sendOnly: true` for one.

See [Accounts switched off after authentication failures](/docs/accounts/managing-accounts#accounts-switched-off-after-authentication-failures) for the operator's view.

## Request and Response Conventions

### Registering and updating

`POST /v1/account` requires only `account` and `name`; the schema accepts an account with neither `imap` nor `oauth2`, which registers but never connects. The response is `{"account": "...", "state": "new"}`, or `"existing"` when an account with that ID was already stored and has been updated. Credentials are not checked while the request is handled: the account connects afterwards, and a bad password surfaces as the `authenticationError` state, not as an error here. `POST /v1/verifyAccount` tests IMAP and SMTP settings without storing anything and answers per protocol, `{"success": true}` or `{"success": false, "error": ..., "code": ..., "responseText": ...}` with the server's own reply.

With `oauth2.authorize: true` the registration answers `{"redirect": "<consent URL>"}` instead of an account; the account is created once the user completes the provider's consent page. See [OAuth2 without tokens](/docs/accounts/managing-accounts#oauth2-without-tokens-authorization-redirect).

A second account for the same OAuth2 user is refused with 400, code `AccountAlreadyExists` and `existingAccount` naming the first one.

`PUT /v1/account/{account}` replaces each of `imap`, `smtp` and `oauth2` as a whole unless the object carries `"partial": true`, in which case only the fields sent are changed and the stored credential is kept. `partial` is read on those three objects only, not on nested ones such as `imap.auth`. Updating credentials reconnects the account, so a separate reconnect request is not needed.

`DELETE /v1/account/{account}` answers `{"account": "...", "deleted": true}` and also removes the account's queued outbound messages and its access tokens. `?revoke=true` additionally asks the provider to revoke the OAuth2 grant; that is implemented for individual Gmail grants, is a no-op for service accounts, Outlook and password accounts, and a failed revocation is logged without blocking the deletion.

### Scheduling operations

Reconnect, sync and flush all return before the work runs. Watch the account state, the [`accountInitialized`](/docs/webhooks/accountinitialized) and [`authenticationError`](/docs/webhooks/authenticationerror) webhooks, or the [state stream](#streaming-account-state-changes) for the outcome.

| Operation | Body | Effect | Response |
|-----------|------|--------|----------|
| `PUT .../reconnect` | `{"reconnect": true}` | Closes the connection and opens a new one, keeping the cached index | `{"reconnect": true}`. `false` when the body did not ask for one, and for an account [switched off automatically](#accounts-switched-off-automatically), where nothing is scheduled because the same credentials would fail again (since 2.79.4; earlier releases answered `true` and did nothing) |
| `PUT .../sync` | `{"sync": true}` | Refreshes the folder list and syncs every monitored folder without disconnecting | `{"sync": true}` |
| `PUT .../flush` | `{"flush": true}`, optionally `notifyFrom` and `imapIndexer` | Deletes the account's cached index from Redis and re-syncs from scratch; `messageNew` is sent again for every message after `notifyFrom` | `{"flush": true}`. Only one flush runs at a time across the instance; a second request answers 429 with the code `LockFail` |

Try sync first when data looks stale, reconnect when the connection itself seems broken or credentials changed, and flush only when the cached index is wrong.

### Errors

An unknown account answers 404 with the message `Account record was not found for requested ID` and no `code`. Validation failures answer 400 with a `fields` list; a mail server that refused a request also answers 400, carrying the server's code and response instead. The full list is on [Error Codes](/docs/api-reference/error-codes).

## Streaming Account State Changes

`GET /v1/changes` is a [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) stream that pushes a message every time an account changes state. It is the same feed the admin dashboard uses to repaint its status badges, so a monitoring view can follow every account without polling `/v1/accounts` on a timer.

```javascript
const stream = new EventSource(
  'https://emailengine.example.com/v1/changes?access_token=YOUR_ACCESS_TOKEN'
);

stream.onmessage = event => {
  const { account, type, key, payload } = JSON.parse(event.data);
  if (type === 'state') {
    console.log(`${account} is now ${key}`);
  }
};
```

Each message carries:

| Field | Meaning |
|-------|---------|
| `account` | The account that changed, or `null` for instance-wide events |
| `type` | The kind of event, from the table below |
| `key` | The new value, so for `type: "state"` one of the account states above |
| `payload` | Extra context, such as `error` on a failure. `null` when there is none |
| `stateLabel` | A pre-rendered, translated badge label for `state`, `smtpServerState` and `imapProxyServerState` events, resolved server-side so the admin UI and any client agree. `null` for the other types |

### Event types

| `type` | `account` | `key` | `payload` |
|--------|-----------|-------|-----------|
| `state` | the account | The new [account state](#account-states) | `{"error": ...}` with the same object as `lastError` when the state is `authenticationError` or `connectError`, otherwise `null` |
| `syncWarning` | the account | `null` | `{"type": ..., "message": ...}`, see below |
| `smtpServerState` | `null` | `listening` or `failed` | `{"tls": ...}` for the certificate the [SMTP server](/docs/sending/smtp-interface) presents, or `{"error": {"message", "code"}}` |
| `imapProxyServerState` | `null` | `listening` or `failed` | The same shape, for the [IMAP proxy server](/docs/receiving/imap-proxy-server) |
| `tlsCertificateState` | `null` | `queued`, `ordering`, `valid`, `failed`, `renewalFailed` or `skipped` | The stored provisioning record for one hostname, see [TLS Certificates](/docs/deployment/tls-certificates). Since 2.80.0 |

A `syncWarning` is sent when the sync of an API account skipped something it will not retry, and it is the only record that those messages were never announced. `payload.type` names the case:

| `payload.type` | Account type | When |
|----------------|--------------|------|
| `historyIdExpired` | Gmail API | Gmail answered 404 for the stored history cursor, so changes made in the meantime were not seen. The cursor is reset to the current one. Since 2.61.2 |
| `historyEntrySkipped` | Gmail API | One history entry failed repeatedly, or crashed the sync worker, and was skipped; `historyId` and `messageIds` name what it covered. Since 2.79.2 |
| `changeSkipped` | Gmail API, MS Graph | New messages could not be fetched after the transient-error retries ran out, so no `messageNew` was sent for the ids in `messageIds`. Since 2.81.2 |
| `missedRecoveryFailed` | MS Graph | The recovery pass for missed change notifications gave up, so new messages may not have been announced. Since 2.81.2 |

The stream opens with the comment line `: EmailEngine v<version>` and writes a comment every 90 seconds while nothing happens, so intermediate proxies do not time it out. A client that stops reading is dropped once about 2 MB of unsent output has queued behind it (since 2.82.0); `EventSource` reconnects on its own, so treat a disconnect as normal.

:::note This stream is a signal, not a record
Events are only delivered to clients connected at the time. Nothing is buffered for a client that is not listening, so a state change during a reconnect is missed. Use it to drive a live view, and read `/v1/account/{account}` for the authoritative current state. For durable delivery, use [webhooks](/docs/webhooks/overview).
:::

Because `EventSource` cannot set request headers, this endpoint accepts the token as the `access_token` query parameter. Keep in mind that query strings are more likely to end up in proxy and server logs than an `Authorization` header.

### Polling instead

If neither the stream nor webhooks can reach your application, poll `GET /v1/account/{account}` for the state, and `GET /v1/account/{account}/messages?path=INBOX&pageSize=100` for mail: the listing is newest first, so a poller keeps the newest `uid` it has processed per folder and stops paging as soon as it reaches it. That covers new mail only, sees neither flag changes nor deletions, and costs more than webhooks on a busy account.

## See Also

- [Managing accounts](/docs/accounts/managing-accounts) - Registering, updating, pausing and recovering accounts step by step
- [Account types](/docs/accounts) - Choosing a backend before registering
- [Hosted authentication](/docs/accounts/hosted-authentication) - Letting the user supply the credentials
- [Account troubleshooting](/docs/accounts/troubleshooting) - When an account will not connect
- [Access Tokens](/docs/api-reference/access-tokens) - The permission groups the endpoint table refers to
