---
title: "exportFailed"
sidebar_position: 26
description: "Webhook event triggered when a bulk email export job fails"
---

# exportFailed

The `exportFailed` webhook event is triggered when EmailEngine encounters a fatal error while processing a bulk email export job. It carries the error, the phase the job reached, and how much had been exported before it stopped.

## When This Event is Triggered

The `exportFailed` event fires when:

- A fatal error occurs during folder indexing or message export
- The associated email account is deleted during export
- The export job exceeds the configured timeout
- Unrecoverable errors exhaust all retry attempts

This event is terminal. The export has stopped, will not retry on its own, and cannot be continued from where it failed.

## Common Use Cases

- **Error alerting** - Notify administrators of failed exports
- **Retry automation** - Start a fresh export, optionally with a narrower scope
- **User notification** - Inform users their export failed
- **Audit logging** - Track export failures for troubleshooting
- **Cleanup** - Remove the failed export record once it has been reported

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that the export belongs to |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "exportFailed" for this event |
| `data` | object | Yes | Event data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exportId` | string | Yes | Unique identifier for the export job |
| `error` | string | Yes | Human-readable error message |
| `errorCode` | string | No | Machine-readable error code, when the failure carried one |
| `phase` | string | Yes | Phase the export was in when it failed: `pending`, `indexing`, or `exporting`. `unknown` if the phase was not recorded |
| `messagesExported` | number | Yes | Messages written before the failure |
| `messagesQueued` | number | Yes | Messages that had been queued for export |

:::warning A failed export cannot be resumed
EmailEngine has no checkpoint or resume mechanism for exports. `messagesExported` and `messagesQueued` describe how far the job got, but the partial output is not downloadable and the job cannot continue from where it stopped. Recovering means starting a new export.

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

### Authentication rejected during indexing

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-01-15T09:12:44.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_def789abc012def789abc012",
    "error": "Invalid credentials",
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
| `pending` | Queued, not yet started | The worker stopped before picking the job up |
| `indexing` | Enumerating folders and messages | Credentials rejected, or the account became unreachable |
| `exporting` | Writing messages to the export file | Connection dropped, provider rate limit, or a timeout |

A failure during `indexing` leaves nothing written at all. A failure during `exporting` means a partial file existed, but it is discarded rather than kept.

### Common Error Codes

| Code | Meaning | Worth starting a new export? |
|------|---------|------------------------------|
| `ECONNRESET` | The connection to the mail server dropped | Yes |
| `ETIMEDOUT` | The mail server stopped responding | Yes |
| `AuthenticationFails` | Credentials were rejected | Only after re-authorizing the account |
| `NotFound` | The account was deleted while the export ran | No |

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
  if (['ECONNRESET', 'ETIMEDOUT'].includes(errorCode)) {
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
- Fix the underlying cause, then create a new export. There is nothing to resume
- Delete the failed export record so it does not linger in listings

## Best Practices

1. **Decide from `errorCode`, not from the message** - `error` is human-facing text that can change between releases
2. **Implement backoff** - Wait before creating a replacement export, so a persistent failure does not become a retry loop
3. **Cap your own retries** - Each attempt is a new job with a new `exportId`, so EmailEngine cannot count them for you
4. **Alert on auth errors** - `AuthenticationFails` needs a person to re-authorize the account
5. **Narrow the scope on repeat failures** - A shorter date range or fewer folders makes a large export far more likely to finish

## Related Events

- [exportCompleted](/docs/webhooks/exportcompleted) - Export job succeeded

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Exporting Messages](/docs/receiving/exporting) - Export feature documentation
- [Create Export API](/docs/api/post-v-1-account-account-export) - Start a new export
