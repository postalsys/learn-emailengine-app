---
title: Exporting Messages
sidebar_position: 10
description: "Bulk export email messages with configurable concurrency for efficient archival and analysis"
keywords:
  - export emails
  - bulk export
  - message archival
  - NDJSON export
  - email backup
---

# Exporting Messages

EmailEngine provides a bulk message export feature that allows you to export large volumes of email messages from any account. Exports are processed asynchronously and output to compressed NDJSON files for efficient storage and downstream processing.

## Overview

The export feature:

- Creates gzip-compressed NDJSON files containing message data
- Processes exports asynchronously via a job queue
- Supports date range filtering and folder selection
- Optionally includes message text content and attachments
- Automatically encrypts export files when `EENGINE_SECRET` is configured
- Provides progress tracking and status monitoring

**Common use cases:**
- Email backup and archival
- Migration to other systems
- Compliance and legal discovery
- Data analysis and machine learning training
- Bulk message processing pipelines

## Creating an Export

Create a new export job using the [Create Export API endpoint](/docs/api/post-v-1-account-account-export):

```bash
curl -X POST "https://your-emailengine.com/v1/account/{account}/export" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "folders": ["INBOX", "\\Sent"],
    "textType": "*",
    "maxBytes": 5242880,
    "includeAttachments": false
  }'
```

### Request Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | ISO 8601 | Required | Export messages from this date |
| `endDate` | ISO 8601 | Required | Export messages until this date |
| `folders` | array | All (except Junk/Trash) | Folder paths or special-use flags to export |
| `textType` | string | `*` | Text content: `plain`, `html`, `*` (both) |
| `maxBytes` | number | 5242880 | Maximum bytes for text content (0 = unlimited) |
| `includeAttachments` | boolean | false | Include attachment content as base64 |

### Response

```json
{
  "exportId": "exp_abc123def456abc123def456",
  "status": "queued",
  "created": "2024-01-15T10:30:00.000Z"
}
```

## Monitoring Export Progress

Check export status using the [Get Export Status API endpoint](/docs/api/get-v-1-account-account-export-exportid):

```bash
curl "https://your-emailengine.com/v1/account/{account}/export/{exportId}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Export States

Exports progress through these states:

| Status | Phase | Description |
|--------|-------|-------------|
| `queued` | `pending` | Export is waiting in the queue |
| `processing` | `indexing` | Scanning folders and queuing messages |
| `processing` | `exporting` | Fetching and writing messages to file |
| `completed` | `complete` | Export finished successfully |
| `failed` | - | Export encountered an error |

### Progress Fields

The response includes detailed progress information:

```json
{
  "exportId": "exp_abc123def456abc123def456",
  "status": "processing",
  "phase": "exporting",
  "progress": {
    "foldersScanned": 2,
    "foldersTotal": 3,
    "messagesQueued": 1500,
    "messagesExported": 750,
    "messagesSkipped": 5,
    "bytesWritten": 52428800
  },
  "created": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-16T10:30:00.000Z"
}
```

| Field | Description |
|-------|-------------|
| `foldersScanned` | Number of folders indexed so far |
| `foldersTotal` | Total folders to index |
| `messagesQueued` | Messages found and queued for export |
| `messagesExported` | Messages successfully written to file |
| `messagesSkipped` | Messages skipped (deleted or inaccessible) |
| `bytesWritten` | Total bytes written to export file |

## Downloading Export Files

Download a completed export using the [Download Export API endpoint](/docs/api/get-v-1-account-account-export-exportid-download):

```bash
curl "https://your-emailengine.com/v1/account/{account}/export/{exportId}/download" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o export.ndjson.gz
```

The response is a gzip-compressed NDJSON file. Each line contains one message as a JSON object:

```json
{"id":"AAAAAQAACnA","uid":12345,"folder":"INBOX","subject":"Hello","from":{"name":"Sender","address":"sender@example.com"},"date":"2024-01-15T10:30:00.000Z","text":{"plain":"Message content..."},"attachments":[]}
{"id":"AAAAAQAACnB","uid":12346,"folder":"INBOX","subject":"Re: Hello","from":{"name":"Reply","address":"reply@example.com"},"date":"2024-01-15T11:00:00.000Z","text":{"plain":"Reply content..."},"attachments":[]}
```

If the export was encrypted (when `EENGINE_SECRET` is set), decryption happens automatically during download.

## Concurrency Tuning

Export jobs are processed by dedicated worker threads. You can tune concurrency based on your system resources.

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `EENGINE_WORKERS_EXPORT` | env | 1 | Export worker threads |
| `EENGINE_EXPORT_QC` | env | 1 | Concurrent jobs per worker |
| `exportMaxConcurrent` | setting | 2 | Max concurrent exports per account |
| `exportMaxGlobalConcurrent` | setting | 8 | Max concurrent exports system-wide |

### Calculating Total Concurrency

The maximum number of exports that can run simultaneously is:

```
MAX_CONCURRENT = EENGINE_WORKERS_EXPORT x EENGINE_EXPORT_QC
```

This is further capped by `exportMaxGlobalConcurrent` to prevent system overload.

**Example**: With `EENGINE_WORKERS_EXPORT=2` and `EENGINE_EXPORT_QC=2`, you can have up to 4 concurrent exports. If `exportMaxGlobalConcurrent=8`, the global limit won't be a factor. But if you set `exportMaxGlobalConcurrent=3`, only 3 exports will run concurrently even though the worker configuration allows 4.

### Resource Requirements

Each export job consumes memory and disk I/O. Use the table below to estimate resource needs:

| Concurrent Exports | Memory (Est.) | Disk I/O | Redis Load |
|-------------------|---------------|----------|------------|
| 1 (default) | ~150 MB | Low | Low |
| 4 (2x2) | ~400 MB | Medium | Medium |
| 8 (4x2 or 2x4) | ~800 MB | High | High |
| 16 (4x4) | ~1.5 GB | Very High | Very High |

### Recommended Configurations

**Small deployment (2-4GB RAM)**

```bash
EENGINE_WORKERS_EXPORT=1
EENGINE_EXPORT_QC=1
# exportMaxGlobalConcurrent=2
```

Conservative settings for resource-constrained environments. One export at a time.

**Medium deployment (8GB RAM)**

```bash
EENGINE_WORKERS_EXPORT=2
EENGINE_EXPORT_QC=2
# exportMaxGlobalConcurrent=8
```

Balanced settings for typical production servers. Up to 4 concurrent exports.

**Large deployment (16GB+ RAM)**

```bash
EENGINE_WORKERS_EXPORT=4
EENGINE_EXPORT_QC=2
# exportMaxGlobalConcurrent=16
```

Higher throughput for large-scale operations. Up to 8 concurrent exports.

### Tuning Considerations

1. **Memory**: Each export batch loads message data into memory. Monitor memory usage and reduce concurrency if you see memory pressure.

2. **Disk I/O**: Multiple concurrent gzip streams can saturate disk bandwidth. Use SSDs for best performance.

3. **Email Provider Limits**: High concurrency may trigger rate limits from email providers. Watch for 429 errors in logs.

4. **Redis**: Message queues consume approximately 100 bytes per message. Large exports with many messages increase Redis memory usage.

**Tuning tips:**
- Start with conservative settings and increase gradually
- Monitor memory usage with `docker stats` or `top`
- Check logs for rate limiting errors from email providers
- Use `exportMaxGlobalConcurrent` to cap total system load regardless of worker configuration

## File Storage

### Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `exportPath` | setting | OS temp dir | Directory for export files |
| `exportMaxAge` | setting | 24 hours | File retention time |
| `EENGINE_EXPORT_PATH` | env | - | Override export directory |
| `EENGINE_EXPORT_MAX_AGE` | env | - | Override retention (ms) |

### Encryption

When `EENGINE_SECRET` is configured, export files are automatically encrypted using AES-256-GCM:

- Encrypted files have `.ndjson.gz.enc` extension
- Unencrypted files have `.ndjson.gz` extension
- Downloads are automatically decrypted by EmailEngine

This ensures exported data is protected at rest without requiring separate encryption handling.

## Webhooks

Export completion triggers webhook notifications:

| Event | Description |
|-------|-------------|
| `exportCompleted` | Export finished successfully |
| `exportFailed` | Export encountered an error |

Example webhook payload for `exportCompleted`:

```json
{
  "event": "exportCompleted",
  "account": "user123",
  "data": {
    "exportId": "exp_abc123def456abc123def456",
    "messagesExported": 1495,
    "messagesSkipped": 5,
    "bytesWritten": 104857600
  }
}
```

## Managing Exports

### List Exports

Get all exports for an account using the [List Exports API endpoint](/docs/api/get-v-1-account-account-exports):

```bash
curl "https://your-emailengine.com/v1/account/{account}/exports" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:

```json
{
  "total": 3,
  "page": 0,
  "pages": 1,
  "exports": [
    {
      "exportId": "exp_abc123def456abc123def456",
      "status": "completed",
      "created": "2024-01-15T10:30:00.000Z",
      "expiresAt": "2024-01-16T10:30:00.000Z"
    }
  ]
}
```

### Delete Export

Cancel a pending export or delete a completed export file using the [Delete Export API endpoint](/docs/api/delete-v-1-account-account-export-exportid):

```bash
curl -X DELETE "https://your-emailengine.com/v1/account/{account}/export/{exportId}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

This will:
- Cancel the export if it's still queued or processing
- Delete the export file from disk
- Remove the export record from the system

### Resume Failed Export

If an export fails but made progress, you can resume it from the last checkpoint instead of starting over. Check the `resumable` field in the export status response:

```bash
curl -X POST "https://your-emailengine.com/v1/account/{account}/export/{exportId}/resume" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**When is an export resumable?**

An export is marked as `resumable: true` when:
- The export made progress (processed at least one message)
- Messages remain to be processed
- The account was not deleted during the export

**Response:**

```json
{
  "exportId": "exp_abc123def456abc123def456",
  "status": "queued",
  "resumed": true,
  "previousProgress": {
    "messagesExported": 750,
    "messagesSkipped": 5
  }
}
```

The resumed export continues from where it left off, preserving already-exported messages in the output file.

**Error handling:**

If the export is not resumable, the API returns an error:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Export is not resumable"
}
```

In this case, delete the failed export and create a new one.

## Best Practices

### Large Exports

For very large exports (millions of messages):

1. **Use date range filtering** - Split large exports into smaller date ranges
2. **Monitor progress** - Poll the status endpoint to track completion
3. **Handle failures gracefully** - Check the `error` field if status is `failed`
4. **Download promptly** - Files expire after `exportMaxAge` (default 24 hours)

### Production Usage

1. **Configure storage path** - Set `exportPath` or `EENGINE_EXPORT_PATH` to a dedicated volume with sufficient space
2. **Set appropriate retention** - Adjust `exportMaxAge` based on your download SLA
3. **Monitor disk space** - Large exports can consume significant disk space
4. **Use webhooks** - Set up webhook handlers for `exportCompleted` and `exportFailed` events instead of polling

### Processing Export Files

NDJSON format allows streaming processing without loading the entire file into memory:

```javascript
const readline = require('readline');
const zlib = require('zlib');
const fs = require('fs');

const gunzip = zlib.createGunzip();
const input = fs.createReadStream('export.ndjson.gz').pipe(gunzip);

const rl = readline.createInterface({ input });

rl.on('line', (line) => {
  const message = JSON.parse(line);
  // Process each message
  console.log(`Processing: ${message.subject}`);
});
```
