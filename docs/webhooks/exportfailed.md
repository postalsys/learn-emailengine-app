---
title: "exportFailed"
sidebar_position: 26
description: "Webhook event triggered when a bulk email export job fails"
---

# exportFailed

The `exportFailed` webhook event is triggered when a bulk message export stops on an error. It carries the error, the phase the job reached, and how far it had got before it stopped.

## When This Event is Triggered

The `exportFailed` event fires when the export worker gives up on a job:

- Listing a folder or fetching a message failed with an error that is neither skippable nor transient
- A transient error (a dropped connection, a timeout, a provider 5xx) kept recurring until the batch retries ran out
- The account was not connected when the export started, so messages could not be listed
- A command to the account's worker timed out

Three endings do **not** send it:

- An export cancelled through the [Delete Export API](/docs/api/delete-v-1-account-account-export-exportid) while it was running, and an export whose account was deleted while it ran. Both are stops the caller already knows about, and a deleted account has nothing left to deliver a webhook for
- An export interrupted by an EmailEngine restart. The next startup marks every export that was still running as `failed` with the error `Export interrupted by application restart` and deletes its file, without a webhook. Poll the [export status](/docs/receiving/exporting#progress-fields) if an `exportCompleted` you were waiting for never arrives

This event is terminal. The export has stopped, will not retry on its own, and cannot be continued from where it failed.

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | Account ID the export belongs to |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Always `exportFailed` |
| `data` | object | Yes | Failure details (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exportId` | string | Yes | Identifier of the export job |
| `error` | string | Yes | Human-readable error message |
| `errorCode` | string | No | Machine-readable error code, when the failure carried one |
| `phase` | string | Yes | Phase the export was in when it failed: `pending`, `indexing` or `exporting`. `unknown` if the export record could not be read |
| `messagesExported` | number | Yes | Messages written before the failure |
| `messagesQueued` | number | Yes | Messages that indexing had queued for export |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

:::warning A failed export cannot be resumed
EmailEngine has no checkpoint or resume mechanism for exports. `messagesExported` and `messagesQueued` describe how far the job got, but the partial file is deleted and the job cannot continue from where it stopped. Recovering means starting a new export.

Narrow the folder list or the date range before retrying a large export that keeps failing, so each run has less to lose.
:::

## Example Payload

### Network error while exporting

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-01-15T14:30:00.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_abc123def456abc123def456",
    "error": "Connection reset by peer",
    "errorCode": "ECONNRESET",
    "phase": "exporting",
    "messagesExported": 842,
    "messagesQueued": 1500
  }
}
```

### Account not authenticated during indexing

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-01-15T09:12:44.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_def789abc012def789abc012",
    "error": "Requested account can not be authenticated",
    "errorCode": "AuthenticationFails",
    "phase": "indexing",
    "messagesExported": 0,
    "messagesQueued": 0
  }
}
```

`errorCode` is only present when the underlying failure carried a machine-readable code, so treat it as optional and fall back to `error`.

## Field Details

### phase

Where the job was when it failed, which tells you what to fix:

| Phase | Meaning | Usual cause |
|-------|---------|-------------|
| `pending` | Queued, not yet started | The worker failed before indexing began, for example Redis was unavailable when it picked the job up |
| `indexing` | Listing folders and queuing messages | The account was not connected, or the listing failed |
| `exporting` | Fetching messages and writing the file | The connection dropped, the provider rate-limited or timed out, or retries ran out |
| `unknown` | The export record could not be read | The record had expired or been deleted by the time the worker reported the failure |

A failure during `indexing` leaves nothing written at all. A failure during `exporting` means a partial file existed, but it is deleted rather than kept.

### Common Error Codes

Decide from `errorCode`, not from `error`: the message is human-facing text that can change between releases, while the codes are stable. The account-state codes below are the ones EmailEngine raises when it cannot list messages for an account that is not connected; they are the same codes the [Error Codes](/docs/api-reference/error-codes) reference lists for API requests against such an account.

| Code | Meaning | Worth starting a new export? |
|------|---------|------------------------------|
| `ECONNRESET` | The connection to the mail server dropped | Yes |
| `ETIMEDOUT` | The mail server stopped responding | Yes |
| `Timeout` | A command to the account's worker timed out | Yes |
| `AuthenticationFails` | The account is in the `authenticationError` state | Only after re-authorizing the account |
| `ConnectionError` | The account is in the `connectError` state | Once it reconnects |
| `NotSyncing` | Syncing is switched off for the account (state `unset`) | Once syncing is enabled again |
| `NotYetConnected` | The account has not connected since it was added | Once it reaches `connected` |

## Handling the Event

```javascript
async function handleExportFailed(event) {
  const { exportId, error, errorCode, phase, messagesExported } = event.data;

  await db.exports.update(
    { exportId },
    { status: 'failed', error, errorCode, phase, messagesExported }
  );

  // Credentials keep failing until someone re-authorizes, so do not loop on this
  if (errorCode === 'AuthenticationFails') {
    return notifyUserToReauthorize(event.account);
  }

  // Transient transport failures are worth another attempt, from scratch
  if (['ECONNRESET', 'ETIMEDOUT', 'Timeout'].includes(errorCode)) {
    const attempts = await db.exports.countAttempts(event.account);
    if (attempts < 3) {
      return startExport(event.account);
    }
  }

  await alertOperator(event.account, exportId, error);
}
```

Track the attempt count yourself. EmailEngine does not carry one between exports, because each retry is a new job with a new `exportId`.

## Relationship to Other Events

The `exportFailed` event is part of the export lifecycle:

1. **Create Export API call** - Export job is created and queued
2. **Export processing** - Worker indexes folders and exports messages
3. **exportCompleted** - Export finished successfully (alternative outcome)
4. **exportFailed** - Export encountered a fatal error (this event)

After receiving `exportFailed`:

- Read `phase` and `errorCode` to decide whether a new export can succeed
- Fix the underlying cause, then create a new export. There is nothing to resume, and each new export is a new job with a new `exportId`, so EmailEngine keeps no count of attempts; cap your own retries and wait between them, so a persistent failure does not become a loop
- Delete the failed export record so it does not linger in listings

## Related Events

- [exportCompleted](/docs/webhooks/exportcompleted) - The export finished

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Exporting Messages](/docs/receiving/exporting) - Creating exports, status fields, limits and retention
- [Create Export API](/docs/api/post-v-1-account-account-export) - Starting the replacement export
- [Error Codes](/docs/api-reference/error-codes) - The account-state codes that `errorCode` can carry
