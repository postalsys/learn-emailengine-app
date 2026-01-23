---
title: "exportCompleted"
sidebar_position: 25
description: "Webhook event triggered when a bulk email export job finishes successfully"
---

# exportCompleted

The `exportCompleted` webhook event is triggered when EmailEngine successfully completes a bulk email export job. This event provides statistics about the export and indicates that the export file is ready for download.

## When This Event is Triggered

The `exportCompleted` event fires when:

- All messages in the export scope have been processed
- The export file has been written and closed successfully
- The export enters the `completed` status

This event confirms that the export file is available for download via the [Download Export API](/docs/api/get-v-1-account-account-export-exportid-download).

## Common Use Cases

- **Download automation** - Trigger automatic download of completed exports
- **Notification systems** - Alert users when their export is ready
- **Workflow triggers** - Initiate downstream processing pipelines
- **Audit logging** - Track export completion for compliance purposes
- **Cleanup scheduling** - Schedule export file deletion after processing

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that the export belongs to |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "exportCompleted" for this event |
| `data` | object | Yes | Event data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exportId` | string | Yes | Unique identifier for the export job |
| `messagesExported` | number | Yes | Total messages successfully written to the export file |
| `messagesSkipped` | number | Yes | Messages that were skipped (deleted or inaccessible) |
| `bytesWritten` | number | Yes | Total bytes written to the export file (compressed) |
| `duration` | number | No | Export duration in milliseconds |

## Example Payload

### Standard Export Completion

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-01-15T14:30:00.000Z",
  "event": "exportCompleted",
  "data": {
    "exportId": "exp_abc123def456abc123def456",
    "messagesExported": 1495,
    "messagesSkipped": 5,
    "bytesWritten": 104857600,
    "duration": 125000
  }
}
```

### Large Export with Many Skipped Messages

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "archive-user",
  "date": "2025-01-15T18:45:00.000Z",
  "event": "exportCompleted",
  "data": {
    "exportId": "exp_xyz789ghi012xyz789ghi012",
    "messagesExported": 45230,
    "messagesSkipped": 127,
    "bytesWritten": 2147483648,
    "duration": 3600000
  }
}
```

## Field Details

### messagesExported vs messagesSkipped

- **`messagesExported`**: Messages successfully fetched and written to the export file
- **`messagesSkipped`**: Messages that could not be exported, typically because:
  - The message was deleted between indexing and export
  - The message exceeded size limits
  - Transient errors exhausted retry attempts

A high `messagesSkipped` count may indicate:
- Active mailbox with frequent deletions
- Network instability during export
- Rate limiting from the email provider

### bytesWritten

The `bytesWritten` field represents the compressed file size (gzip). The actual uncompressed data size is typically 3-10x larger depending on message content.

### duration

Time in milliseconds from export job start to completion. Use this to:
- Estimate completion times for similar exports
- Identify performance issues
- Track export throughput trends

## Handling the Event

### Basic Handler

```javascript
async function handleExportCompleted(event) {
  const { account, data } = event;

  console.log(`Export completed for account ${account}`);
  console.log(`  Export ID: ${data.exportId}`);
  console.log(`  Messages: ${data.messagesExported} exported, ${data.messagesSkipped} skipped`);
  console.log(`  File size: ${(data.bytesWritten / 1024 / 1024).toFixed(2)} MB`);

  // Update your database
  await db.exports.update({
    exportId: data.exportId,
    status: 'completed',
    messagesExported: data.messagesExported,
    completedAt: event.date
  });

  // Notify the user
  await notifyUser(account, {
    type: 'export_ready',
    exportId: data.exportId,
    messageCount: data.messagesExported
  });
}
```

### Automatic Download

```javascript
async function handleExportCompleted(event) {
  const { account, data } = event;

  // Download the export file
  const response = await fetch(
    `${EMAILENGINE_URL}/v1/account/${account}/export/${data.exportId}/download`,
    {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    }
  );

  // Save to storage
  const exportPath = `/exports/${account}/${data.exportId}.ndjson.gz`;
  await saveToStorage(exportPath, response.body);

  // Clean up the export from EmailEngine
  await fetch(
    `${EMAILENGINE_URL}/v1/account/${account}/export/${data.exportId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    }
  );

  console.log(`Export ${data.exportId} downloaded and cleaned up`);
}
```

### With Error Handling

```javascript
async function handleExportCompleted(event) {
  try {
    const { account, data, date } = event;

    // Log the completion
    await auditLog.create({
      type: 'export_completed',
      account,
      exportId: data.exportId,
      messagesExported: data.messagesExported,
      messagesSkipped: data.messagesSkipped,
      bytesWritten: data.bytesWritten,
      timestamp: new Date(date)
    });

    // Check for high skip rate
    const skipRate = data.messagesSkipped / (data.messagesExported + data.messagesSkipped);
    if (skipRate > 0.1) {
      console.warn(`High skip rate (${(skipRate * 100).toFixed(1)}%) for export ${data.exportId}`);
    }

    // Trigger downstream processing
    await processExportFile(account, data.exportId);

  } catch (error) {
    console.error('Failed to process exportCompleted webhook:', error);
    throw error; // Re-throw to trigger webhook retry
  }
}
```

## Relationship to Other Events

The `exportCompleted` event is part of the export lifecycle:

1. **Create Export API call** - Export job is created and queued
2. **Export processing** - Worker indexes folders and exports messages
3. **exportCompleted** - Export finished successfully (this event)
4. **exportFailed** - Export encountered a fatal error (alternative outcome)

After receiving `exportCompleted`:
- The export file is available for download
- The file will be automatically deleted after `exportMaxAge` (default: 24 hours)
- Download promptly or the file will expire

## Best Practices

1. **Download promptly** - Export files expire based on `exportMaxAge` setting
2. **Verify message counts** - Compare `messagesExported` with expected count
3. **Monitor skip rates** - High skip rates may indicate issues
4. **Process asynchronously** - Don't block webhook response for downloads
5. **Clean up after download** - Delete exports to free disk space
6. **Use for automation** - Trigger downstream processing pipelines

## Related Events

- [exportFailed](/docs/webhooks/exportfailed) - Export job failed

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Exporting Messages](/docs/receiving/exporting) - Export feature documentation
- [Download Export API](/docs/api/get-v-1-account-account-export-exportid-download) - Download export files
