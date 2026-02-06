---
title: "exportFailed"
sidebar_position: 26
description: "Webhook event triggered when a bulk email export job fails"
---

# exportFailed

The `exportFailed` webhook event is triggered when EmailEngine encounters a fatal error while processing a bulk email export job. This event provides error details and indicates whether the export can be resumed.

## When This Event is Triggered

The `exportFailed` event fires when:

- A fatal error occurs during folder indexing or message export
- The associated email account is deleted during export
- The export job exceeds the configured timeout
- Unrecoverable errors exhaust all retry attempts

This event indicates the export has stopped and will not automatically retry. Check the `resumable` field to determine if the export can be manually resumed.

## Common Use Cases

- **Error alerting** - Notify administrators of failed exports
- **Retry automation** - Automatically resume resumable exports
- **User notification** - Inform users their export failed
- **Audit logging** - Track export failures for troubleshooting
- **Cleanup** - Delete failed exports that cannot be resumed

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
| `code` | string | No | Error code for programmatic handling |
| `phase` | string | Yes | Export phase when failure occurred (`indexing` or `exporting`) |
| `resumable` | boolean | Yes | Whether the export can be resumed from checkpoint |
| `progress` | object | No | Progress at time of failure (if any) |

### Progress Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `foldersScanned` | number | Folders indexed before failure |
| `foldersTotal` | number | Total folders to index |
| `messagesQueued` | number | Messages queued for export |
| `messagesExported` | number | Messages successfully exported |
| `messagesSkipped` | number | Messages skipped |
| `bytesWritten` | number | Bytes written to export file |

## Example Payload

### Network Error During Export (Resumable)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-01-15T14:30:00.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_abc123def456abc123def456",
    "error": "Network timeout while fetching message batch",
    "code": "ETIMEDOUT",
    "phase": "exporting",
    "resumable": true,
    "progress": {
      "foldersScanned": 3,
      "foldersTotal": 3,
      "messagesQueued": 1500,
      "messagesExported": 750,
      "messagesSkipped": 5,
      "bytesWritten": 52428800
    }
  }
}
```

### Account Deleted During Export (Not Resumable)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "deleted-user",
  "date": "2025-01-15T15:45:00.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_xyz789ghi012xyz789ghi012",
    "error": "Account was deleted during export",
    "code": "ACCOUNT_DELETED",
    "phase": "exporting",
    "resumable": false,
    "progress": {
      "foldersScanned": 2,
      "foldersTotal": 5,
      "messagesQueued": 500,
      "messagesExported": 200,
      "messagesSkipped": 0,
      "bytesWritten": 10485760
    }
  }
}
```

### Authentication Error During Indexing (Not Resumable)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "oauth-user",
  "date": "2025-01-15T16:00:00.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_def456ghi789def456ghi789",
    "error": "OAuth token expired and could not be refreshed",
    "code": "AUTH_ERROR",
    "phase": "indexing",
    "resumable": false
  }
}
```

### Rate Limited (Resumable)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "heavy-user",
  "date": "2025-01-15T17:30:00.000Z",
  "event": "exportFailed",
  "data": {
    "exportId": "exp_ghi012jkl345ghi012jkl345",
    "error": "Rate limit exceeded after maximum retries",
    "code": "RATE_LIMITED",
    "phase": "exporting",
    "resumable": true,
    "progress": {
      "foldersScanned": 1,
      "foldersTotal": 1,
      "messagesQueued": 10000,
      "messagesExported": 3500,
      "messagesSkipped": 12,
      "bytesWritten": 524288000
    }
  }
}
```

## Field Details

### phase

Indicates where in the export process the failure occurred:

- **`indexing`**: Failure during folder scanning and message queuing
- **`exporting`**: Failure during message fetching and file writing

Failures during `indexing` typically cannot be resumed because the message list is incomplete.

### resumable

Determines whether the export can be continued using the [Create Export API](/docs/api/post-v-1-account-account-export):

**Resumable (`true`) when:**
- Export made progress (`messagesExported > 0`)
- Messages remain to process
- Account still exists
- Error is transient (network, rate limits)

**Not resumable (`false`) when:**
- No progress was made
- Account was deleted
- Authentication permanently failed
- Export file is corrupted

### Common Error Codes

| Code | Description | Resumable |
|------|-------------|-----------|
| `ETIMEDOUT` | Network timeout | Usually yes |
| `ECONNRESET` | Connection reset | Usually yes |
| `RATE_LIMITED` | Provider rate limit exceeded | Yes |
| `AUTH_ERROR` | Authentication failed | No |
| `ACCOUNT_DELETED` | Account no longer exists | No |
| `QUOTA_EXCEEDED` | Disk space exhausted | No |
| `TIMEOUT` | Export job timeout | Usually yes |

## Handling the Event

### Basic Handler

```javascript
async function handleExportFailed(event) {
  const { account, data } = event;

  console.error(`Export failed for account ${account}`);
  console.error(`  Export ID: ${data.exportId}`);
  console.error(`  Error: ${data.error}`);
  console.error(`  Phase: ${data.phase}`);
  console.error(`  Resumable: ${data.resumable}`);

  if (data.progress) {
    console.error(`  Progress: ${data.progress.messagesExported}/${data.progress.messagesQueued} messages`);
  }

  // Update your database
  await db.exports.update({
    exportId: data.exportId,
    status: 'failed',
    error: data.error,
    resumable: data.resumable,
    failedAt: event.date
  });
}
```

### Automatic Resume

```javascript
async function handleExportFailed(event) {
  const { account, data } = event;

  if (data.resumable) {
    console.log(`Attempting to resume export ${data.exportId}`);

    // Wait before retrying (backoff)
    await sleep(30000);

    try {
      const response = await fetch(
        `${EMAILENGINE_URL}/v1/account/${account}/export/${data.exportId}/resume`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }
      );

      if (response.ok) {
        console.log(`Export ${data.exportId} resumed successfully`);
      } else {
        console.error(`Failed to resume export: ${response.status}`);
      }
    } catch (error) {
      console.error('Resume request failed:', error);
    }
  } else {
    console.log(`Export ${data.exportId} is not resumable, notifying user`);
    await notifyUser(account, {
      type: 'export_failed',
      exportId: data.exportId,
      error: data.error
    });
  }
}
```

### With Alert and Cleanup

```javascript
async function handleExportFailed(event) {
  try {
    const { account, data, date } = event;

    // Log the failure
    await auditLog.create({
      type: 'export_failed',
      account,
      exportId: data.exportId,
      error: data.error,
      code: data.code,
      phase: data.phase,
      resumable: data.resumable,
      progress: data.progress,
      timestamp: new Date(date)
    });

    // Alert if critical
    if (!data.resumable || data.code === 'AUTH_ERROR') {
      await alerting.send({
        severity: 'high',
        message: `Export failed for account ${account}: ${data.error}`,
        exportId: data.exportId
      });
    }

    // Clean up non-resumable exports
    if (!data.resumable) {
      await fetch(
        `${EMAILENGINE_URL}/v1/account/${account}/export/${data.exportId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }
      );
    }

  } catch (error) {
    console.error('Failed to process exportFailed webhook:', error);
    throw error;
  }
}
```

## Relationship to Other Events

The `exportFailed` event is part of the export lifecycle:

1. **Create Export API call** - Export job is created and queued
2. **Export processing** - Worker indexes folders and exports messages
3. **exportCompleted** - Export finished successfully (alternative outcome)
4. **exportFailed** - Export encountered a fatal error (this event)

After receiving `exportFailed`:
- Check `resumable` to determine next steps
- Resume if possible, or delete and recreate the export
- Investigate the `error` and `code` for root cause

## Best Practices

1. **Check resumability first** - Always check `resumable` before deciding on action
2. **Implement backoff** - Wait before resuming to avoid rapid retry loops
3. **Monitor error patterns** - Track `code` values to identify systemic issues
4. **Alert on auth errors** - Authentication failures need user intervention
5. **Clean up promptly** - Delete non-resumable exports to free resources
6. **Log progress data** - The `progress` object helps diagnose where failures occur

## Related Events

- [exportCompleted](/docs/webhooks/exportcompleted) - Export job succeeded

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Exporting Messages](/docs/receiving/exporting) - Export feature documentation
- [Create Export API](/docs/api/post-v-1-account-account-export) - Create or resume exports
