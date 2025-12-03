---
title: "messageMissing"
sidebar_position: 6
description: "Webhook event triggered when a message that should exist is not found, indicating a synchronization error"
---

# messageMissing

The `messageMissing` webhook event is triggered when EmailEngine detects that a message it expected to find on the mail server is not available. This event indicates a potential synchronization issue and helps you handle edge cases in message processing.

## When This Event is Triggered

The `messageMissing` event fires when:

- EmailEngine receives a notification about a new message but cannot retrieve it from the server
- A message was deleted between the time EmailEngine was notified and when it attempted to fetch the full content
- IMAP replication lag causes a message to be temporarily unavailable (after multiple retry attempts)
- The mail server reports a message exists but returns an error when EmailEngine tries to download it
- Network issues or server timeouts prevent message retrieval after exhausting retry attempts

For IMAP accounts, EmailEngine implements exponential backoff retry logic before triggering this event. The system attempts to fetch the message multiple times with increasing delays (using a 1.7^n second formula) before giving up and sending the `messageMissing` notification.

## Common Use Cases

- **Sync error monitoring** - Track and alert on message retrieval failures
- **Debugging mail server issues** - Identify replication lag or server problems
- **Retry scheduling** - Implement custom retry logic for critical accounts
- **Analytics** - Monitor synchronization health across accounts
- **Audit logging** - Track cases where expected messages could not be retrieved
- **Alert systems** - Notify administrators of persistent sync issues

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID where the missing message was detected |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `path` | string | No | Mailbox folder path where the message should have been found (IMAP only) |
| `specialUse` | string | No | Special use flag of the folder (e.g., "\Inbox", "\Sent") |
| `event` | string | Yes | Event type, always "messageMissing" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Message identification and retry data (see below) |

### Message Data Fields (`data` object)

The `messageMissing` event includes identification data and retry statistics:

#### IMAP Accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | EmailEngine's unique message ID (base64url encoded packed UID) |
| `uid` | number | Yes | IMAP UID of the missing message within the folder |
| `missingRetries` | number | No | Number of retry attempts made before giving up |
| `missingDelay` | number | No | Total delay in milliseconds spent on retry attempts |

#### Gmail API Accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Gmail message ID that could not be retrieved |

#### Microsoft Graph (Outlook) Accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Outlook message ID that could not be retrieved |

## Example Payloads

### IMAP Account (with retry statistics)

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:44:14.660Z",
  "path": "INBOX",
  "specialUse": "\Inbox",
  "event": "messageMissing",
  "eventId": "a83cd01e-45ab-4921-b456-7e89f0123456",
  "data": {
    "id": "AAAADAAABy4",
    "uid": 1838,
    "missingRetries": 5,
    "missingDelay": 12450
  }
}
```

### Gmail API Account

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "gmail-user",
  "date": "2025-10-17T08:15:22.123Z",
  "path": "[Gmail]/All Mail",
  "event": "messageMissing",
  "eventId": "b94de12f-56bc-5032-c567-8f90g1234567",
  "data": {
    "id": "18b5c7d8e9f01234"
  }
}
```

### Microsoft Outlook Account

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "outlook-user",
  "date": "2025-10-17T09:30:45.789Z",
  "path": "Inbox",
  "event": "messageMissing",
  "eventId": "c05ef23g-67cd-6143-d678-9g01h2345678",
  "data": {
    "id": "AAMkADI2NGVhZTVlLTI1OGItNDUwZS05ZDVkLWQzN2E2MDUyYzc3YQBGAAAAAAI"
  }
}
```

## Handling the Event

### Basic Handler

```javascript
async function handleMessageMissing(event) {
  const { account, path, data } = event;

  console.log(`Missing message detected for ${account}:`);
  console.log(`  Message ID: ${data.id}`);
  if (path) {
    console.log(`  Folder: ${path}`);
  }
  if (data.uid) {
    console.log(`  UID: ${data.uid}`);
  }
  if (data.missingRetries) {
    console.log(`  Retry attempts: ${data.missingRetries}`);
    console.log(`  Total delay: ${data.missingDelay}ms`);
  }

  // Log for monitoring
  await logSyncIssue(account, data.id, 'message_missing');
}
```

### Monitoring and Alerting

```javascript
async function handleMessageMissing(event) {
  const { account, path, date, data, eventId } = event;

  // Record the sync issue
  await db.syncIssues.create({
    data: {
      eventId,
      timestamp: new Date(date),
      account,
      folder: path || null,
      issueType: 'message_missing',
      messageId: data.id,
      uid: data.uid || null,
      retryAttempts: data.missingRetries || 0,
      totalDelay: data.missingDelay || 0
    }
  });

  // Check for repeated issues with this account
  const recentIssues = await db.syncIssues.count({
    where: {
      account,
      issueType: 'message_missing',
      timestamp: {
        gte: new Date(Date.now() - 3600000) // Last hour
      }
    }
  });

  // Alert if too many missing messages
  if (recentIssues >= 5) {
    await alerting.send({
      level: 'warning',
      title: 'Multiple missing messages detected',
      message: `Account ${account} has ${recentIssues} missing messages in the last hour`,
      metadata: { account, recentIssues }
    });
  }
}
```

### Retry Statistics Analysis

```javascript
async function handleMessageMissing(event) {
  const { account, data } = event;

  // For IMAP accounts, analyze retry behavior
  if (data.missingRetries && data.missingDelay) {
    const avgDelayPerRetry = data.missingDelay / data.missingRetries;

    // Log metrics for analysis
    await metrics.record({
      name: 'message_missing_retries',
      value: data.missingRetries,
      tags: { account }
    });

    await metrics.record({
      name: 'message_missing_total_delay_ms',
      value: data.missingDelay,
      tags: { account }
    });

    console.log(`Message ${data.id} missing after ${data.missingRetries} retries`);
    console.log(`Average delay per retry: ${avgDelayPerRetry.toFixed(0)}ms`);
  }
}
```

### Custom Retry Logic

```javascript
async function handleMessageMissing(event) {
  const { account, data } = event;

  // For critical accounts, schedule a manual re-sync attempt
  const criticalAccounts = ['ceo@company.com', 'support@company.com'];

  if (criticalAccounts.includes(account)) {
    // Schedule a delayed re-fetch attempt
    await jobQueue.add(
      'retry-fetch-message',
      {
        account,
        messageId: data.id,
        uid: data.uid,
        attempt: 1
      },
      {
        delay: 300000 // Wait 5 minutes before retrying
      }
    );

    console.log(`Scheduled retry for critical account ${account}, message ${data.id}`);
  }
}
```

## Important Considerations

### Why Messages Go Missing

There are several reasons a message might be missing:

1. **Race conditions** - The message was deleted between notification and fetch
2. **Replication lag** - Multi-server IMAP environments may have sync delays
3. **Server issues** - Temporary server errors or maintenance
4. **Network problems** - Timeouts or connection drops during retrieval
5. **Quota issues** - Server rejecting requests due to rate limiting

### Retry Behavior

For IMAP accounts, EmailEngine automatically retries message fetching with exponential backoff:

- Delay formula: `1.7^n` seconds (where n is the retry attempt number)
- Maximum retries: Configurable, typically 5 attempts
- Total delay: Reported in `missingDelay` field (in milliseconds)

Gmail API and Microsoft Graph accounts do not include retry statistics as they use different notification mechanisms.

### This Event is Not Always an Error

A `messageMissing` event doesn't necessarily indicate a problem. It may occur when:

- A user quickly deletes a message after it arrives
- Spam filters move or delete messages before EmailEngine can fetch them
- Server-side rules process messages rapidly

Consider the frequency of these events when deciding how to handle them.

### Correlation with Other Events

You may receive both `messageMissing` and `messageDeleted` events for the same message if:

1. EmailEngine tried to fetch a new message (message notified but not yet synced)
2. The user deleted it before EmailEngine could retrieve it
3. EmailEngine logs `messageMissing` (couldn't fetch the content)
4. Later, EmailEngine detects the deletion and sends `messageDeleted`

Track message IDs to correlate these events in your logging.

## Comparing to messageDeleted

| Aspect | messageMissing | messageDeleted |
|--------|----------------|----------------|
| **Trigger** | Message cannot be retrieved from server | Message was successfully tracked then removed |
| **Content accessed** | Never successfully fetched | Was fetched at least once |
| **Common cause** | Sync timing issues, server problems | User action, filter rules, API deletion |
| **Includes retry stats** | Yes (IMAP only) | No |
| **Indicates error** | Potentially | No |

## Related Events

- [messageNew](/docs/webhooks/messagenew) - Triggered when a new message arrives successfully
- [messageDeleted](/docs/webhooks/messagedeleted) - Triggered when a tracked message is removed
- [connectError](/docs/webhooks/connecterror) - Triggered when connection to email server fails
- [authenticationError](/docs/webhooks/authenticationerror) - Triggered when authentication fails

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Troubleshooting](/docs/support/troubleshooting) - Diagnosing sync issues
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
