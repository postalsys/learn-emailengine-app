---
title: Outbox Queue
sidebar_position: 7
description: Understanding EmailEngine's message queue system for reliable email delivery
---

<!--
SOURCE ATTRIBUTION:
- Primary: blog/2022-09-11-interpreting-queue-types.md
-->

# Outbox Queue

EmailEngine uses queues to process background tasks including email sending. Understanding the queue system helps you monitor delivery, troubleshoot issues, and optimize performance.

## Why Queues Matter

When you submit an email, EmailEngine doesn't send it immediately. Instead, it:

1. Validates your request
2. Adds the message to a queue
3. Returns immediately with a queue ID
4. Processes the queue asynchronously
5. Handles retries automatically
6. Notifies you via webhooks

This approach provides:
- **Reliability**: Automatic retries on failures
- **Scalability**: Handle high-volume sending
- **Monitoring**: Track delivery status
- **Resilience**: Survive crashes and restarts

## Queue Technology

EmailEngine uses [BullMQ](https://docs.bullmq.io/) for queue management, backed by Redis. BullMQ provides:

- Persistent job storage
- Automatic retry logic
- Priority queues
- Delayed jobs (scheduled sending)
- Job progress tracking

## Queue Types

EmailEngine maintains three queue types:

### 1. Submit Queue

Handles all email sending jobs.

- **Purpose**: Process outbound email
- **Jobs**: Individual send requests
- **Lifecycle**: Waiting → Active → Completed/Failed/Delayed

### 2. Notify Queue

Handles all webhook delivery jobs.

- **Purpose**: Send webhook notifications
- **Jobs**: Webhook HTTP requests
- **Retries**: Automatic retry on webhook failures

### 3. Documents Queue

Handles ElasticSearch indexing (if document store enabled).

- **Purpose**: Index messages for search
- **Jobs**: Document indexing operations
- **Dependencies**: Requires ElasticSearch

## Job Lifecycle

Jobs in the submit queue move through different states:

### 1. Waiting

**Description**: Jobs ready to be processed immediately.

**How jobs get here**:
- New submissions without `sendAt` property
- Delayed jobs whose `sendAt` time has been reached
- Jobs moved from *Paused* when queue is unpaused

**What happens**: Jobs are picked up one by one and moved to *Active*.

```bash
# View waiting jobs
curl "https://ee.example.com/v1/account/example/outbox?state=waiting" \
  -H "Authorization: Bearer <token>"
```

### 2. Active

**Description**: Jobs currently being processed.

**What happens**:
- EmailEngine connects to SMTP server
- Transmits the message
- Waits for SMTP response

**Outcomes**:
- **Success** → Moved to *Completed*
- **Temporary failure** → Moved to *Delayed* (will retry)
- **Permanent failure** (retries exhausted) → Moved to *Failed*

```bash
# View active jobs
curl "https://ee.example.com/v1/account/example/outbox?state=active" \
  -H "Authorization: Bearer <token>"
```

### 3. Completed

**Description**: Successfully delivered jobs.

**What happens**:
- SMTP server accepted the message (250 OK)
- `messageSent` webhook is emitted
- Job stored for informational purposes

**Note**: By default, completed jobs are not stored. To enable storage, configure "How many completed/failed queue entries to keep" in **Configuration → Service**.

```bash
# View completed jobs (if enabled)
curl "https://ee.example.com/v1/account/example/outbox?state=completed" \
  -H "Authorization: Bearer <token>"
```

### 4. Failed

**Description**: Jobs that failed too many times and won't be retried.

**How jobs get here**:
- Retried `deliveryAttempts` times (default: 10)
- All attempts failed

**What happens**:
- `messageFailed` webhook is emitted
- Job stored for debugging

**Common failure reasons**:
- Invalid credentials
- Network errors (persistent)
- Recipient address rejected
- Message rejected by spam filter

```bash
# View failed jobs
curl "https://ee.example.com/v1/account/example/outbox?state=failed" \
  -H "Authorization: Bearer <token>"
```

### 5. Delayed

**Description**: Jobs waiting for future processing.

**How jobs get here**:
- New submissions with `sendAt` property (scheduled sending)
- Failed jobs that will be retried (retry delay calculated)

**What happens**:
- Job waits until the delay time
- Then moved to *Waiting*
- If failure: `messageDeliveryError` webhook is emitted

**Retry schedule** (exponential backoff):
- Attempt 1: Immediate
- Attempt 2: +30 seconds
- Attempt 3: +1 minute
- Attempt 4: +5 minutes
- Attempt 5: +15 minutes
- Subsequent: +30 minutes

```bash
# View delayed jobs
curl "https://ee.example.com/v1/account/example/outbox?state=delayed" \
  -H "Authorization: Bearer <token>"
```

### 6. Paused

**Description**: Jobs held when queue is paused.

**How to pause**: Use the Arena UI or API to pause the queue.

**What happens**:
- New jobs go to *Paused* instead of *Waiting*
- Active jobs finish processing
- When unpaused, jobs move to *Waiting*

**Use cases**:
- Maintenance windows
- Debugging issues
- Rate limit management

```bash
# Pause queue
curl -XPOST "https://ee.example.com/v1/admin/queue/submit/pause" \
  -H "Authorization: Bearer <token>"

# Unpause queue
curl -XPOST "https://ee.example.com/v1/admin/queue/submit/resume" \
  -H "Authorization: Bearer <token>"
```

### 7. Waiting-Children

**Description**: Special state for ElasticSearch indexing jobs with dependencies.

**Relevance**: Only applies to the Documents queue, not Submit queue.

## Monitoring the Queue

### Arena UI

EmailEngine includes [Arena](https://github.com/bee-queue/arena), a web UI for BullMQ queues.

**Access**: Navigate to **Tools → Arena** in EmailEngine UI.

**Features**:
- View job counts by state
- Inspect individual jobs
- Retry failed jobs
- Delete jobs
- Pause/resume queues
- View job logs

![Arena Interface](/img/external/dTxpPiMO3S.png)

### API Access

Query queue status via the [outbox API](/docs/api/get-v-1-outbox):

```bash
# Get queue summary
curl "https://ee.example.com/v1/account/example/outbox" \
  -H "Authorization: Bearer <token>"
```

**Response**:

```json
{
  "account": "example",
  "queued": 5,
  "states": {
    "waiting": 3,
    "active": 1,
    "delayed": 1,
    "completed": 0,
    "failed": 0
  }
}
```

### List Jobs by State

```bash
# List waiting jobs
curl "https://ee.example.com/v1/account/example/outbox?state=waiting&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

**Response**:

```json
{
  "jobs": [
    {
      "id": "abc123",
      "queueId": "4646ac53857fd2b2",
      "messageId": "<message-id@example.com>",
      "state": "waiting",
      "to": ["recipient@example.com"],
      "subject": "Test message",
      "created": "2025-05-14T10:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 0,
  "pages": 1
}
```

### Get Job Details

```bash
# Get specific job
curl "https://ee.example.com/v1/account/example/outbox/abc123" \
  -H "Authorization: Bearer <token>"
```

**Response**:

```json
{
  "id": "abc123",
  "queueId": "4646ac53857fd2b2",
  "messageId": "<message-id@example.com>",
  "state": "delayed",
  "attemptsMade": 2,
  "attempts": 10,
  "nextAttempt": "2025-05-14T10:15:00.000Z",
  "lastError": "Connection timeout",
  "envelope": {
    "from": "sender@example.com",
    "to": ["recipient@example.com"]
  },
  "created": "2025-05-14T10:00:00.000Z",
  "updated": "2025-05-14T10:05:00.000Z"
}
```

## Managing Queue Jobs

### Retry a Failed Job

```bash
# Retry specific job
curl -XPOST "https://ee.example.com/v1/account/example/outbox/abc123/retry" \
  -H "Authorization: Bearer <token>"
```

The job moves back to *Waiting* and will be processed again.

### Delete a Job

```bash
# Delete job from queue
curl -XDELETE "https://ee.example.com/v1/account/example/outbox/abc123" \
  -H "Authorization: Bearer <token>"
```

Useful for:
- Removing stuck jobs
- Canceling scheduled sends
- Clearing failed jobs

### Clear Jobs by State

```bash
# Clear all failed jobs
curl -XDELETE "https://ee.example.com/v1/account/example/outbox?state=failed" \
  -H "Authorization: Bearer <token>"
```

**Warning**: This permanently deletes jobs. Use with caution.

## Configuration

### Delivery Attempts

Configure maximum retry attempts:

```bash
# Environment variable
EENGINE_DELIVERY_ATTEMPTS=10

# Or via API when registering account
{
  "account": "example",
  "deliveryAttempts": 10,
  ...
}
```

Default: 10 attempts

### Keep Completed/Failed Jobs

By default, completed and failed jobs are not stored to save Redis memory.

**Enable storage**:

1. Navigate to **Configuration → Service**
2. Set "How many completed/failed queue entries to keep"
3. Example: Set to 100 to keep last 100 completed and 100 failed

**Note**: This only applies to new jobs, not existing ones.

### Queue Timeouts

Configure job processing timeout:

```bash
# Environment variable
EENGINE_QUEUE_TIMEOUT=300000  # 5 minutes in milliseconds
```

Jobs taking longer than this are considered failed.

### SMTP Timeout

Configure SMTP connection timeout:

```bash
# Environment variable
EENGINE_SMTP_TIMEOUT=60000  # 1 minute

# Or per-account
{
  "account": "example",
  "smtp": {
    "timeout": 60000
  }
}
```

## Webhook Events

The queue system triggers webhooks at key points:

### messageSent

Emitted when job moves to *Completed*:

```json
{
  "event": "messageSent",
  "account": "example",
  "date": "2025-05-14T10:32:39.499Z",
  "data": {
    "messageId": "<message-id@example.com>",
    "queueId": "4646ac53857fd2b2",
    "response": "250 2.0.0 Ok: queued as 5755482356",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@example.com"]
    }
  }
}
```

### messageDeliveryError

Emitted when job moves to *Delayed* after failure:

```json
{
  "event": "messageDeliveryError",
  "account": "example",
  "date": "2025-05-14T10:05:35.832Z",
  "data": {
    "queueId": "4646ac53857fd2b2",
    "messageId": "<message-id@example.com>",
    "error": "Connection timeout",
    "errorCode": "ETIMEDOUT",
    "smtpResponseCode": null,
    "job": {
      "attemptsMade": 2,
      "attempts": 10,
      "nextAttempt": "2025-05-14T10:10:35.465Z"
    },
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@example.com"]
    }
  }
}
```

### messageFailed

Emitted when job moves to *Failed*:

```json
{
  "event": "messageFailed",
  "account": "example",
  "date": "2025-05-14T11:58:50.181Z",
  "data": {
    "messageId": "<message-id@example.com>",
    "queueId": "4646ac53857fd2b2",
    "error": "Error: Invalid login: 535 5.7.8 Error: authentication failed",
    "envelope": {
      "from": "sender@example.com",
      "to": ["recipient@example.com"]
    }
  }
}
```

## Troubleshooting

### High Queue Depth

**Issue**: Waiting queue has hundreds/thousands of jobs.

**Causes**:
- SMTP server is slow
- Rate limiting
- Network issues
- EmailEngine is overloaded

**Solutions**:
- Scale EmailEngine vertically (increase CPU/RAM)
- Increase worker count (`EENGINE_WORKERS_SUBMIT`)
- Check SMTP server performance
- Monitor active job processing time

### Jobs Stuck in Active

**Issue**: Jobs remain in *Active* state for long time.

**Causes**:
- SMTP timeout too high
- Network issues
- SMTP server not responding

**Solutions**:
- Reduce SMTP timeout
- Check network connectivity
- Restart EmailEngine (jobs will retry)
- Check SMTP server logs

### Too Many Failed Jobs

**Issue**: Many jobs ending up in *Failed* state.

**Causes**:
- Invalid SMTP credentials
- Recipient addresses rejected
- Network issues (persistent)
- SMTP server issues

**Solutions**:
- Check account credentials
- Verify recipient addresses
- Review error messages in failed jobs
- Check SMTP server status
- Fix underlying issues, then retry failed jobs

### Delayed Jobs Not Processing

**Issue**: Jobs stuck in *Delayed* state past their scheduled time.

**Causes**:
- Queue is paused
- Redis issues
- EmailEngine crashed
- System time incorrect

**Solutions**:
- Check queue status (paused?)
- Verify Redis connectivity
- Restart EmailEngine
- Check system time synchronization

### Memory Issues

**Issue**: Redis running out of memory.

**Causes**:
- Too many completed/failed jobs stored
- Very large job payloads
- High queue depth

**Solutions**:
- Reduce completed/failed job retention
- Clear old completed/failed jobs
- Increase Redis memory
- Optimize message payloads (use templates)

### Use Scheduled Sending Wisely

For large batch sends, spread them over time:

```javascript
const messages = [...];  // Large array
const batchSize = 100;
const delayBetweenBatches = 3600;  // 1 hour

for (let i = 0; i < messages.length; i += batchSize) {
  const batch = messages.slice(i, i + batchSize);
  const sendAt = new Date(Date.now() + (i / batchSize) * delayBetweenBatches * 1000);

  await fetch('/v1/account/example/submit', {
    method: 'POST',
    body: JSON.stringify({
      subject: 'Bulk message',
      html: '<p>Content</p>',
      sendAt: sendAt.toISOString(),
      mailMerge: batch
    })
  });
}
```
