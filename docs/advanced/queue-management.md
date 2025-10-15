---
title: Queue Management
sidebar_position: 11
description: Understanding EmailEngine's BullMQ queues, job types, lifecycle, and monitoring with Bull Board
keywords:
  - queue management
  - BullMQ
  - job lifecycle
  - queue monitoring
  - Bull Board
  - Arena
  - job types
---

<!--
SOURCE: sources/blog/2022-09-11-interpreting-queue-types.md
Migrated to documentation format with technical guidance on queue internals.
-->

# Queue Management

EmailEngine uses [BullMQ](https://docs.bullmq.io/) for background task processing. Understanding how queues work helps you monitor performance, troubleshoot issues, and optimize your EmailEngine deployment.

## Overview

EmailEngine manages three primary queues for different operations:

- **Submit Queue**: Email sending jobs
- **Notify Queue**: Webhook delivery jobs
- **Documents Queue**: ElasticSearch indexing jobs

All queues are backed by Redis and monitored through Bull Board (previously Arena), accessible via **Tools → Bull Board** in the EmailEngine interface.

## Accessing Bull Board

**Navigation**: Tools → Bull Board

Bull Board provides a web interface for:
- Viewing queue statistics
- Inspecting job details
- Managing jobs (retry, delete)
- Monitoring queue health
- Debugging failures

## Queue Types

### 1. Submit Queue

**Purpose**: Handles all outbound email sending operations.

**Job Creation**: Created when:
- API `/submit` endpoint called
- SMTP message received
- Scheduled email reaches send time

**Job Data**:
```json
{
  "account": "example",
  "messageId": "<uuid@example.com>",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "subject": "Email subject",
  "content": "...",
  "sendAt": "2025-10-18T08:00:00.000Z",
  "attachments": []
}
```

**Success Outcome**: `messageSent` webhook emitted, job moves to Completed

**Failure Outcome**: Job retries (moves to Delayed) or fails permanently (moves to Failed)

### 2. Notify Queue

**Purpose**: Handles webhook delivery to your application.

**Job Creation**: Created when:
- New email arrives (`messageNew`)
- Message sent/failed (`messageSent`, `messageFailed`)
- Account events (`accountAdded`, `authenticationError`)
- Any webhook-enabled event occurs

**Job Data**:
```json
{
  "url": "https://your-app.com/webhooks",
  "account": "example",
  "event": "messageNew",
  "payload": {
    "account": "example",
    "event": "messageNew",
    "data": { ... }
  }
}
```

**Success Outcome**: Your endpoint returns 2xx status, job moves to Completed

**Failure Outcome**: Job retries or fails, webhook not delivered

### 3. Documents Queue

**Purpose**: Indexes emails in ElasticSearch for search and Document Store features.

**Job Creation**: Created when:
- New email arrives (if Document Store enabled)
- Email updated (flags/labels changed)
- Account flushed and re-indexed

**Job Data**:
```json
{
  "account": "example",
  "messageId": "AAAAGQAACeE",
  "operation": "index",
  "document": { ... }
}
```

**Success Outcome**: Email indexed in ElasticSearch, available for search

**Failure Outcome**: Job retries or fails, email not searchable

## Job Lifecycle

Every job moves through different states during its lifecycle.

### Job States

#### 1. Waiting

**Description**: Jobs ready to be processed immediately.

**How Jobs Enter**:
- Newly created without `sendAt` date
- Moved from Delayed when scheduled time reached
- Moved from Paused when queue resumed

**What Happens**: Workers pick jobs from here one by one and move them to Active.

**Example**: Email submitted via API for immediate delivery.

#### 2. Active

**Description**: Jobs currently being processed by a worker.

**How Jobs Enter**: Picked from Waiting queue by available worker.

**What Happens**:
- Email sending: SMTP connection established, message transmitted
- Webhook delivery: HTTP POST request sent to your endpoint
- Document indexing: Data sent to ElasticSearch

**Exit Paths**:
- **Success**: Move to Completed
- **Retriable Failure**: Move to Delayed (will retry)
- **Permanent Failure**: Move to Failed (no more retries)

**Example**: EmailEngine currently sending email to SMTP server.

#### 3. Delayed

**Description**: Jobs scheduled for future processing.

**How Jobs Enter**:
- Created with `sendAt` in future
- Failed in Active but within retry limit
- Manually delayed via API

**What Happens**: Jobs wait until delay time expires, then move to Waiting.

**Delay Reasons**:
- **Scheduled Send**: User specified `sendAt` timestamp
- **Retry After Failure**: Failed delivery, scheduled for retry
  - Retry 1: 30 seconds
  - Retry 2: 5 minutes
  - Retry 3: 30 minutes
  - Retry 4: 2 hours

**Example**: Email scheduled for tomorrow 9am or failed email waiting 30 seconds before retry.

#### 4. Completed

**Description**: Successfully processed jobs.

**How Jobs Enter**: Job completed successfully in Active state.

**What Happens**: Job stored for reference (if retention enabled), otherwise discarded.

**Retention**: By default, Completed jobs are immediately removed. Enable retention in **Configuration → Service → Completed/failed queue entries to keep**.

**Example**: Email successfully delivered to SMTP server.

#### 5. Failed

**Description**: Jobs that permanently failed after exhausting all retries.

**How Jobs Enter**: Job failed in Active state and retry limit reached.

**What Happens**: Job stored for debugging (if retention enabled). No further processing.

**Common Failures**:
- SMTP authentication failed
- Recipient address invalid
- Webhook endpoint unreachable
- ElasticSearch connection failed

**Example**: Email rejected by SMTP server with "User unknown" error after all retries.

#### 6. Paused

**Description**: Jobs held in queue while queue is paused.

**How Jobs Enter**: Jobs that would go to Waiting while queue paused.

**What Happens**: Jobs wait until queue resumed, then move to Waiting.

**Use Case**: Temporarily stop processing for maintenance or debugging.

**Example**: Queue paused via Bull Board, new emails accumulate here.

#### 7. Waiting-Children

**Description**: Jobs waiting for child jobs to complete (used for ElasticSearch indexing).

**How Jobs Enter**: Parent job creates child jobs and waits for completion.

**What Happens**: Once all children complete, parent job continues processing.

**Usage**: Not used for Submit or Notify queues, only for Documents queue with complex indexing operations.

## Job Lifecycle Diagram

```
┌─────────────┐
│   Created   │
└──────┬──────┘
       │
       ├─── sendAt in future ─────> DELAYED
       │                                │
       └─── sendAt now/past ─────> WAITING
                                        │
                                        v
                                    ACTIVE
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    v                   v                   v
               SUCCESS            RETRY FAILURE      PERMANENT FAILURE
                    │                   │                   │
                    v                   v                   v
              COMPLETED             DELAYED               FAILED
                    │                   │
                    │                   │
                    v                   v
              (Removed)            WAITING ──> ACTIVE (retry)
```

## Monitoring Queue Health

### Queue Metrics

**Key Metrics to Monitor**:

1. **Waiting Count**: Jobs pending processing
   - High count: Workers overloaded or slow
   - Normal: 0-10 for low traffic, higher for busy systems

2. **Active Count**: Jobs currently processing
   - Should match worker concurrency
   - Higher than expected: Workers stuck

3. **Delayed Count**: Scheduled or retrying jobs
   - Normal for scheduled emails
   - High count: Many failures and retries

4. **Failed Count**: Permanently failed jobs
   - Should be low (< 1% of completed)
   - High count: Systemic issue (authentication, configuration)

5. **Completed Count**: Successfully processed jobs
   - Indicates throughput
   - Only visible if retention enabled

### Health Indicators

**Healthy Queue**:
```
Waiting:   5
Active:    2
Delayed:   10 (scheduled)
Failed:    0
Completed: 1000
```

**Problematic Queue**:
```
Waiting:   500  ← Backlog building
Active:    10   ← Workers maxed out
Delayed:   200  ← Many retries
Failed:    50   ← High failure rate
```

### Bull Board Monitoring

**Dashboard View**:
1. Navigate to **Tools → Bull Board**
2. View all queues at a glance
3. Check counts for each state
4. Identify queues with issues

**Per-Queue View**:
1. Click on queue name (e.g., "Submit")
2. View detailed statistics
3. Browse jobs by state
4. Inspect individual jobs

## Job Inspection

### Viewing Job Details

**Steps**:
1. Go to **Tools → Bull Board**
2. Select queue (Submit, Notify, Documents)
3. Select job state tab (Waiting, Active, Failed, etc.)
4. Click on a job to view details

**Job Information**:
- Job ID
- Creation timestamp
- Processing attempts
- Data payload
- Error messages (if failed)
- Processing duration
- Next retry time (if delayed)

### Failed Job Analysis

**Example Failed Submit Job**:

```json
{
  "id": "12345",
  "name": "send-email",
  "data": {
    "account": "example",
    "from": "sender@example.com",
    "to": ["invalid@nonexistent.com"],
    "subject": "Test"
  },
  "failedReason": "535 5.7.8 Authentication failed",
  "attemptsMade": 5,
  "stacktrace": [
    "Error: 535 5.7.8 Authentication failed",
    "at SMTPConnection._actionAUTHComplete",
    "..."
  ]
}
```

**Diagnosis**: SMTP authentication failing, check account credentials.

### Common Failure Patterns

#### Submit Queue

**Authentication Failures**:
```
Error: 535 5.7.8 Authentication failed
```
**Solution**: Check account password or OAuth token

**Network Errors**:
```
Error: ETIMEDOUT Connection timeout
```
**Solution**: Check SMTP server reachable, firewall rules

**Recipient Rejected**:
```
Error: 550 5.1.1 User unknown
```
**Solution**: Verify recipient address, no retry needed

#### Notify Queue

**Connection Refused**:
```
Error: ECONNREFUSED connect ECONNREFUSED 192.168.1.100:443
```
**Solution**: Check webhook URL, server running

**Timeout**:
```
Error: Timeout: webhook endpoint did not respond within 5000ms
```
**Solution**: Optimize webhook handler, respond faster

**Invalid Response**:
```
Error: Unexpected status code: 500
```
**Solution**: Check webhook handler logs for errors

#### Documents Queue

**ElasticSearch Unavailable**:
```
Error: ECONNREFUSED connect to elasticsearch:9200
```
**Solution**: Check ElasticSearch running, connection settings

**Indexing Failure**:
```
Error: mapper_parsing_exception: failed to parse field
```
**Solution**: Check document structure, ElasticSearch mapping

## Queue Management Operations

### Enable Job Retention

By default, Completed and Failed jobs are immediately removed. To keep them for debugging:

**Steps**:
1. Navigate to **Configuration → Service**
2. Find **Completed/failed queue entries to keep**
3. Set to desired number (e.g., 100)
4. Click **Save**

**Recommendation**: Keep 50-100 jobs for debugging without excessive memory use.

### Retry Failed Job

**Steps**:
1. Go to **Tools → Bull Board**
2. Select queue
3. Go to **Failed** tab
4. Find job to retry
5. Click **Retry** button

**Use Case**: Retry after fixing underlying issue (e.g., corrected credentials, restored service).

### Delete Job

**Steps**:
1. Go to **Tools → Bull Board**
2. Select queue and job state
3. Find job
4. Click **Delete** button

**Use Case**: Remove stuck jobs, clear old scheduled emails, clean up queue.

### Pause Queue

**Steps**:
1. Go to **Tools → Bull Board**
2. Select queue
3. Click **Pause** button

**Effect**:
- Workers stop processing jobs
- Active jobs complete
- New jobs go to Paused state
- Existing Waiting jobs move to Paused

**Use Case**: Maintenance, debugging, testing.

### Resume Queue

**Steps**:
1. Go to **Tools → Bull Board**
2. Select paused queue
3. Click **Resume** button

**Effect**:
- Jobs move from Paused to Waiting
- Workers start processing again

### Empty Queue

**Steps**:
1. Go to **Tools → Bull Board**
2. Select queue
3. Select job state (e.g., Failed, Completed)
4. Click **Empty** button

**Effect**: Removes all jobs in that state.

**Use Case**: Clear old completed/failed jobs, reset queue.

**Warning**: Cannot be undone!

## Webhooks and Queue Interactions

### Webhook Emission

Webhooks are emitted at specific queue state transitions:

**Submit Queue**:
- **Completed**: `messageSent` webhook
- **Failed**: `messageFailed` webhook
- **Delayed** (from Active): `messageDeliveryError` webhook

**Notify Queue**:
- No webhooks (webhooks don't trigger webhooks)

**Documents Queue**:
- No webhooks (internal indexing)

### Webhook Delivery Flow

1. Event occurs (email sent)
2. Job added to Notify queue (Waiting)
3. Worker picks job (Active)
4. HTTP POST sent to webhook URL
5. If 2xx response: job moves to Completed
6. If error: job moves to Delayed or Failed

### Webhook Retry Strategy

**Retry Attempts**: 5 (configurable)

**Retry Delays**:
- Attempt 1: Immediate
- Attempt 2: 30 seconds
- Attempt 3: 5 minutes
- Attempt 4: 30 minutes
- Attempt 5: 2 hours

**After 5 Failures**: Job moves to Failed, webhook never delivered.

## Performance Tuning

### Worker Concurrency

Control how many jobs process simultaneously:

**Configuration**: `EENGINE_WORKERS` environment variable

```bash
# Default: 4 workers
EENGINE_WORKERS=4

# High volume: Increase workers
EENGINE_WORKERS=10

# Low resources: Decrease workers
EENGINE_WORKERS=2
```

**Trade-offs**:
- More workers: Higher throughput, more resource usage
- Fewer workers: Lower throughput, lower resource usage

### Redis Performance

BullMQ depends on Redis performance:

**Optimize Redis**:
- Use Redis 6+ for better performance
- Enable persistence (AOF or RDB)
- Monitor memory usage
- Use dedicated Redis instance for production

**Redis Connection**:
```bash
# Use connection pooling
REDIS_URL=redis://localhost:6379

# Increase connection pool size
REDIS_MAX_POOL=20
```

### Queue Priority

Submit queue supports job priorities (coming soon in future versions):

```javascript
// High priority (sent first)
await submitEmail({
  priority: 1,
  from: 'urgent@example.com',
  to: 'vip@example.com',
  subject: 'Urgent'
});

// Normal priority
await submitEmail({
  priority: 5,
  from: 'sender@example.com',
  to: 'user@example.com',
  subject: 'Newsletter'
});
```

## Troubleshooting

### Problem: Jobs Stuck in Waiting

**Symptoms**: Jobs accumulate in Waiting, never move to Active

**Causes**:
- Workers not running
- Redis connection lost
- EmailEngine process crashed

**Solutions**:
1. Check EmailEngine is running
2. Verify Redis connection
3. Review EmailEngine logs
4. Restart EmailEngine
5. Check worker concurrency settings

### Problem: High Failure Rate

**Symptoms**: Many jobs in Failed state

**Causes**:
- Invalid credentials
- SMTP server issues
- Network problems
- Webhook endpoint down

**Solutions**:
1. Inspect failed job details
2. Check error messages
3. Fix underlying issue (credentials, connectivity)
4. Retry failed jobs after fix

### Problem: Jobs Stuck in Active

**Symptoms**: Active count stays high, jobs don't complete

**Causes**:
- Workers hung
- External service not responding
- Resource exhaustion

**Solutions**:
1. Review EmailEngine logs for errors
2. Check external dependencies (SMTP server, webhook endpoints)
3. Restart EmailEngine workers
4. Increase timeouts if needed
5. Check system resources (CPU, memory, network)

### Problem: Delayed Queue Growing

**Symptoms**: Delayed count increasing over time

**Causes**:
- Many delivery failures with retries
- Large number of scheduled emails
- Clock skew on server

**Solutions**:
1. Check failed job errors (authentication, network)
2. Verify scheduled send times are correct
3. Check system clock accuracy
4. Review retry strategy (may need adjustment)

### Problem: Completed Jobs Not Visible

**Symptoms**: Can't see completed jobs in Bull Board

**Cause**: Job retention not enabled (default behavior)

**Solution**: Enable retention:
1. Go to **Configuration → Service**
2. Set **Completed/failed queue entries to keep** to 100
3. New completed jobs will be visible

**Note**: Only affects new jobs, doesn't restore old ones.

## Best Practices

### 1. Enable Job Retention

Keep failed jobs for debugging:

```
Completed/failed queue entries to keep: 100
```

### 2. Monitor Queue Health

Set up alerts for:
- Waiting count > threshold
- Failed count > threshold
- Active jobs stuck > timeout

### 3. Regular Maintenance

Schedule periodic cleanup:
- Remove old completed jobs (weekly)
- Review failed jobs (daily)
- Check queue statistics (daily)

### 4. Optimize Retry Strategy

Adjust retry attempts based on your needs:

```bash
# Default: 5 attempts
EENGINE_MAX_DELIVERY_ATTEMPTS=5

# More aggressive: 10 attempts
EENGINE_MAX_DELIVERY_ATTEMPTS=10

# Fast fail: 2 attempts
EENGINE_MAX_DELIVERY_ATTEMPTS=2
```

### 5. Use Appropriate Worker Count

Match workers to your workload:

```bash
# Low volume: 2-4 workers
EENGINE_WORKERS=4

# Medium volume: 8-12 workers
EENGINE_WORKERS=10

# High volume: 16+ workers
EENGINE_WORKERS=20
```

### 6. Implement Queue Monitoring

Track metrics programmatically:

```javascript
// Example monitoring
const Bull = require('bull');
const submitQueue = new Bull('submit', 'redis://localhost:6379');

async function getQueueMetrics() {
  const waiting = await submitQueue.getWaitingCount();
  const active = await submitQueue.getActiveCount();
  const delayed = await submitQueue.getDelayedCount();
  const failed = await submitQueue.getFailedCount();

  return { waiting, active, delayed, failed };
}

// Alert if waiting queue too large
const metrics = await getQueueMetrics();
if (metrics.waiting > 100) {
  alertAdmin('Submit queue backlog detected');
}
```

## Advanced Topics

### Job Events

BullMQ emits events for job lifecycle:

```javascript
const submitQueue = new Bull('submit', 'redis://localhost:6379');

// Job completed
submitQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

// Job failed
submitQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed:`, err);
});

// Job delayed (retry)
submitQueue.on('delayed', (job, delay) => {
  console.log(`Job ${job.id} delayed by ${delay}ms`);
});
```

### Custom Job Processing

For advanced use cases, process jobs programmatically:

```javascript
const Bull = require('bull');
const queue = new Bull('custom-queue', 'redis://localhost:6379');

// Add custom job
await queue.add('my-task', {
  data: 'custom data'
}, {
  delay: 5000, // 5 second delay
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

// Process custom job
queue.process('my-task', async (job) => {
  console.log('Processing:', job.data);
  // Your processing logic
  return { success: true };
});
```

## See Also

- [Transactional Email Service](/docs/sending/transactional-service) - Email submission and delivery
- [Outbox Queue](/docs/sending/outbox-queue) - Outbound message queue details
- [Webhooks](/docs/receiving/webhooks) - Webhook delivery and debugging
- [Monitoring](/docs/advanced/monitoring) - System monitoring and alerts
- [Performance Tuning](/docs/advanced/performance-tuning) - Optimization strategies
- [BullMQ Documentation](https://docs.bullmq.io/) - Official BullMQ docs
