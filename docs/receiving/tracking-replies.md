---
title: Tracking Email Replies
sidebar_position: 7
description: "Detect and track email replies using Message-ID and In-Reply-To headers with EmailEngine"
keywords:
  - email replies
  - tracking replies
  - message threading
  - in-reply-to
  - email tracking
---

# Tracking Email Replies

<!--
Source attribution:
- PRIMARY: blog/2025-04-01-tracking-email-replies-with-imap-api.md
- Enhanced with complete implementation patterns
-->

Reply tracking is essential when building email integrations that need to know when recipients respond to your messages. This guide shows you how to send trackable emails and reliably detect replies using EmailEngine.

## Why Track Replies?

**Lead Management**
- Identify hot leads who respond quickly
- Track engagement with sales emails
- Automate follow-ups based on responses

**Customer Support**
- Route replies to correct ticket
- Track response times
- Close tickets automatically

**Email Campaigns**
- Measure actual engagement (not just opens)
- Identify interested prospects
- Segment by response behavior

**Workflow Automation**
- Trigger actions when replies arrive
- Update CRM records
- Send notifications to team

## How Reply Tracking Works

Email threading uses standard headers:

**Message-ID** - Unique identifier you assign when sending
```
Message-ID: <1697123456-account@yourdomain.com>
```

**In-Reply-To** - References the Message-ID being replied to
```
In-Reply-To: <1697123456-account@yourdomain.com>
```

**References** - Complete thread history
```
References: <original@domain.com> <1697123456-account@yourdomain.com>
```

When someone replies, their email client automatically sets `In-Reply-To` to your `Message-ID`. EmailEngine captures this in webhooks, allowing you to match replies to original messages.

## Sending Trackable Messages

### Step 1: Generate Unique Message-ID

Create a unique Message-ID when sending:

```javascript
function generateMessageId(accountId, customData = {}) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  // Include any data you want to track
  const data = Buffer.from(JSON.stringify(customData)).toString('base64url');

  return `<${timestamp}-${accountId}-${random}-${data}@yourdomain.com>`;
}

// Generate Message-ID for a sales email
const messageId = generateMessageId('account123', {
  campaignId: 'sales-2025-q4',
  leadId: 'lead-456',
  userId: 'user-789'
});

console.log(messageId);
// <1697123456-account123-x3k2p-eyJjYW1wYWlnbklkIjoic2FsZXMtMjAyNS1xNCJ9@yourdomain.com>
```

### Step 2: Send with Message-ID

Send the email with your generated Message-ID:

```javascript
async function sendTrackedEmail(accountId, recipient, subject, content) {
  // Generate unique Message-ID
  const messageId = generateMessageId(accountId, {
    recipient: recipient,
    sentAt: new Date().toISOString()
  });

  // Send email
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/submit`, // See: /docs/api/post-v-1-account-account-submit
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: {
          name: 'Sales Team',
          address: 'sales@yourcompany.com'
        },
        to: [{
          address: recipient
        }],
        subject: subject,
        html: content,
        messageId: messageId,
        headers: {
          // Suppress out-of-office auto-replies
          'X-Auto-Response-Suppress': 'OOF, AutoReply'
        }
      })
    }
  );

  const result = await response.json();

  // Store Message-ID in your database
  await storeTrackedEmail({
    messageId: messageId,
    accountId: accountId,
    recipient: recipient,
    subject: subject,
    sentAt: new Date()
  });

  return {
    messageId,
    queueId: result.queueId
  };
}

// Send tracked email
const result = await sendTrackedEmail(
  'account123',
  'customer@example.com',
  'Special Offer for You',
  '<p>Hi, we have a special offer...</p>'
);

console.log(`Sent with Message-ID: ${result.messageId}`);
```

### Step 3: Store Message-IDs

Store Message-IDs in your database for matching:

```javascript
// Database schema (example)
const trackedEmails = new Map();

async function storeTrackedEmail(data) {
  trackedEmails.set(data.messageId, {
    ...data,
    replied: false,
    replyReceivedAt: null
  });

  // In production, save to database:
  // await db.trackedEmails.insert(data);
}

async function getTrackedEmail(messageId) {
  return trackedEmails.get(messageId);

  // In production:
  // return await db.trackedEmails.findOne({ messageId });
}
```

## Detecting Replies

### Step 1: Configure Webhooks

Enable webhooks for new message events:

```bash
curl -X PUT "https://your-emailengine.com/admin/config" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhooks/emailengine",
    "webhooksEnabled": true,
    "notifyHeaders": true
  }'
```

### Step 2: Handle Webhook Events

Process incoming `messageNew` webhooks:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhooks/emailengine', async (req, res) => {
  const event = req.body;

  // Acknowledge immediately
  res.status(200).json({ success: true });

  // Process asynchronously
  if (event.event === 'messageNew') {
    await handleNewMessage(event);
  }
});

async function handleNewMessage(event) {
  const { account, data } = event;

  // Check if this is a reply
  if (data.inReplyTo) {
    await handlePotentialReply(account, data);
  }
}

app.listen(3000);
```

### Step 3: Match Replies

Match the `In-Reply-To` header to your stored Message-IDs:

```javascript
async function handlePotentialReply(accountId, message) {
  const inReplyTo = message.inReplyTo;

  // Check if replying to one of our tracked messages
  const original = await getTrackedEmail(inReplyTo);

  if (!original) {
    // Not replying to a tracked message
    return;
  }

  // Verify it's in inbox (not spam/trash)
  const isInInbox = (
    message.path === 'INBOX' ||
    (message.labels && message.labels.includes('\\Inbox'))
  );

  if (!isInInbox) {
    console.log('Reply not in inbox, ignoring');
    return;
  }

  // Fetch full message details
  const fullMessage = await getMessage(accountId, message.id);

  // Filter out auto-responses
  if (await isAutoResponse(fullMessage)) {
    console.log('Auto-response detected, ignoring');
    return;
  }

  // This is a genuine reply!
  await handleReply(original, fullMessage);
}
```

## Filtering Auto-Responses

### Check Auto-Response Headers

Filter out automated messages:

```javascript
async function isAutoResponse(message) {
  const headers = message.headers || {};

  // Check Return-Path for bounces
  if (headers['return-path']?.[0] === '<>') {
    return true; // Bounce message
  }

  // Check Auto-Submitted header
  const autoSubmitted = headers['auto-submitted']?.[0];
  if (autoSubmitted && autoSubmitted.toLowerCase() !== 'no') {
    return true; // Auto-generated
  }

  // Check for out-of-office in subject
  const subject = (message.subject || '').toLowerCase();
  if (
    subject.includes('out of office') ||
    subject.includes('automatic reply') ||
    subject.includes('auto:') ||
    subject.includes('away:')
  ) {
    return true;
  }

  // Check for mailing list headers
  if (headers['list-id'] || headers['list-unsubscribe']) {
    return true; // Mailing list
  }

  // Check precedence header
  const precedence = headers['precedence']?.[0];
  if (precedence && ['bulk', 'junk', 'list'].includes(precedence.toLowerCase())) {
    return true;
  }

  return false; // Appears to be genuine reply
}
```

### Check Sender

Verify the reply is from the expected recipient:

```javascript
function isValidReplySender(original, reply) {
  const originalRecipient = original.recipient.toLowerCase();
  const replyFrom = reply.from.address.toLowerCase();

  // Check if reply is from original recipient
  return replyFrom === originalRecipient;
}
```

## Processing Replies

### Update Database

Mark message as replied:

```javascript
async function handleReply(original, reply) {
  // Update database
  await updateTrackedEmail(original.messageId, {
    replied: true,
    replyReceivedAt: new Date(),
    replyFrom: reply.from.address,
    replySubject: reply.subject,
    replyId: reply.id
  });

  console.log(`Reply received for ${original.messageId}`);
  console.log(`Original: ${original.subject}`);
  console.log(`Reply: ${reply.subject}`);

  // Trigger additional actions
  await onReplyReceived(original, reply);
}

async function updateTrackedEmail(messageId, updates) {
  const existing = trackedEmails.get(messageId);
  if (existing) {
    trackedEmails.set(messageId, { ...existing, ...updates });
  }

  // In production:
  // await db.trackedEmails.update({ messageId }, { $set: updates });
}
```

### Trigger Actions

Perform actions when replies are received:

```javascript
async function onReplyReceived(original, reply) {
  // Extract metadata from Message-ID
  const metadata = extractMetadata(original.messageId);

  if (metadata.campaignId === 'sales-2025-q4') {
    // Update CRM: Mark lead as engaged
    await updateCRM(metadata.leadId, {
      status: 'hot',
      lastEngagement: new Date(),
      responseTime: Date.now() - original.sentAt.getTime()
    });

    // Notify sales team
    await sendNotification({
      type: 'lead-replied',
      lead: metadata.leadId,
      from: reply.from.address,
      subject: reply.subject
    });
  }

  // Store reply content for analysis
  await storeReplyContent({
    originalId: original.messageId,
    replyId: reply.id,
    content: reply.text,
    html: reply.html,
    sentiment: await analyzeSentiment(reply.text)
  });
}

function extractMetadata(messageId) {
  // Extract data from Message-ID
  const match = messageId.match(/<[\d-]+-([\w-]+)-([^@]+)@/);
  if (match && match[2]) {
    const data = Buffer.from(match[2], 'base64url').toString();
    return JSON.parse(data);
  }
  return {};
}
```

## Complete Example

Here's a full implementation:

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// In-memory store (use database in production)
const trackedEmails = new Map();

// Generate unique Message-ID
function generateMessageId(accountId, metadata) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const data = Buffer.from(JSON.stringify(metadata)).toString('base64url');
  return `<${timestamp}-${accountId}-${random}-${data}@yourdomain.com>`;
}

// Send tracked email
async function sendTrackedEmail(accountId, to, subject, html, metadata = {}) {
  const messageId = generateMessageId(accountId, metadata);

  await fetch(`https://your-emailengine.com/v1/account/${accountId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: { address: 'noreply@yourcompany.com' },
      to: [{ address: to }],
      subject,
      html,
      messageId,
      headers: { 'X-Auto-Response-Suppress': 'OOF, AutoReply' }
    })
  });

  // Store for tracking
  trackedEmails.set(messageId, {
    messageId,
    accountId,
    to,
    subject,
    sentAt: new Date(),
    metadata,
    replied: false
  });

  return messageId;
}

// Check if message is auto-response
function isAutoResponse(message) {
  const headers = message.headers || {};

  if (headers['return-path']?.[0] === '<>') return true;

  const autoSubmitted = headers['auto-submitted']?.[0];
  if (autoSubmitted && autoSubmitted.toLowerCase() !== 'no') return true;

  const subject = (message.subject || '').toLowerCase();
  if (/out of office|automatic reply|auto:|away:/i.test(subject)) return true;

  if (headers['list-id'] || headers['list-unsubscribe']) return true;

  return false;
}

// Get message details
async function getMessage(accountId, messageId) {
  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}`, // See: /docs/api/get-v-1-account-account-message-message
    { headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' } }
  );
  return await response.json();
}

// Handle webhook
app.post('/webhooks/emailengine', async (req, res) => {
  const event = req.body;
  res.status(200).json({ success: true });

  if (event.event === 'messageNew' && event.data.inReplyTo) {
    const original = trackedEmails.get(event.data.inReplyTo);

    if (original) {
      // Check if in inbox
      const inInbox = (
        event.data.path === 'INBOX' ||
        (event.data.labels || []).includes('\\Inbox')
      );

      if (!inInbox) return;

      // Get full message
      const fullMessage = await getMessage(event.account, event.data.id);

      // Filter auto-responses
      if (isAutoResponse(fullMessage)) return;

      // Mark as replied
      original.replied = true;
      original.replyReceivedAt = new Date();
      original.replyFrom = fullMessage.from.address;

      console.log('REPLY RECEIVED!');
      console.log(`Original: ${original.subject}`);
      console.log(`From: ${fullMessage.from.address}`);
      console.log(`Reply: ${fullMessage.subject}`);

      // Trigger your business logic here
      // - Update CRM
      // - Send notifications
      // - Generate reports
    }
  }
});

// API endpoint to send tracked email
app.post('/api/send-tracked', async (req, res) => {
  const { accountId, to, subject, html, metadata } = req.body;

  const messageId = await sendTrackedEmail(accountId, to, subject, html, metadata);

  res.json({ success: true, messageId });
});

// API endpoint to check if email was replied
app.get('/api/check-reply/:messageId', (req, res) => {
  const tracked = trackedEmails.get(req.params.messageId);

  if (!tracked) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({
    messageId: tracked.messageId,
    to: tracked.to,
    subject: tracked.subject,
    sentAt: tracked.sentAt,
    replied: tracked.replied,
    replyReceivedAt: tracked.replyReceivedAt,
    replyFrom: tracked.replyFrom
  });
});

app.listen(3000, () => {
  console.log('Reply tracking server running on port 3000');
});
```

## Advanced Patterns

### Track Multiple Recipients

Handle emails sent to multiple recipients:

```javascript
async function sendTrackedToMultiple(accountId, recipients, subject, html) {
  const messageIds = [];

  for (const recipient of recipients) {
    const messageId = await sendTrackedEmail(
      accountId,
      recipient,
      subject,
      html,
      { recipient }
    );

    messageIds.push({ recipient, messageId });
  }

  return messageIds;
}

// Track who replied
const tracking = await sendTrackedToMultiple('account123', [
  'customer1@example.com',
  'customer2@example.com',
  'customer3@example.com'
], 'Product Update', '<p>New features...</p>');

// Later, check replies
for (const { recipient, messageId } of tracking) {
  const tracked = trackedEmails.get(messageId);
  console.log(`${recipient}: ${tracked.replied ? 'REPLIED' : 'No reply yet'}`);
}
```

### Calculate Response Time

Track how quickly recipients respond:

```javascript
function calculateResponseTime(original, reply) {
  const sentTime = new Date(original.sentAt).getTime();
  const replyTime = new Date(reply.date).getTime();
  const responseTimeMs = replyTime - sentTime;

  const hours = Math.floor(responseTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((responseTimeMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    milliseconds: responseTimeMs,
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`
  };
}

// When reply received
const responseTime = calculateResponseTime(original, reply);
console.log(`Response time: ${responseTime.formatted}`);

// Track average response times
await analytics.trackResponseTime({
  campaignId: original.metadata.campaignId,
  responseTime: responseTime.milliseconds
});
```

### Thread Multiple Replies

Track conversation threads:

```javascript
const threads = new Map();

async function handleReply(original, reply) {
  let thread = threads.get(original.messageId);

  if (!thread) {
    thread = {
      originalId: original.messageId,
      originalSubject: original.subject,
      messages: [
        { id: original.messageId, type: 'sent', date: original.sentAt }
      ]
    };
    threads.set(original.messageId, thread);
  }

  thread.messages.push({
    id: reply.id,
    type: 'reply',
    from: reply.from.address,
    date: reply.date,
    subject: reply.subject
  });

  console.log(`Thread has ${thread.messages.length} messages`);
}
```

## Troubleshooting

### Problem: Replies Not Detected

**Solutions:**
1. Verify Message-ID is properly formatted (must have angle brackets)
2. Check webhook is receiving `messageNew` events
3. Ensure `notifyHeaders` is enabled in config
4. Verify reply landed in INBOX (not spam)
5. Check database for stored Message-IDs

```javascript
// Debug: Log all incoming messages
app.post('/webhooks/emailengine', async (req, res) => {
  const event = req.body;
  res.json({ success: true });

  if (event.event === 'messageNew') {
    console.log('New message:', {
      from: event.data.from,
      subject: event.data.subject,
      inReplyTo: event.data.inReplyTo,
      path: event.data.path,
      labels: event.data.labels
    });
  }
});
```

### Problem: Auto-Responses Counted as Replies

**Solutions:**
1. Enhance auto-response detection
2. Check more headers
3. Analyze message content
4. Verify sender matches recipient

### Problem: Missing In-Reply-To Header

**Solutions:**
1. Some email clients don't set In-Reply-To properly
2. Use References header as fallback
3. Check threading by subject prefix (Re:)
4. Use conversation analysis

```javascript
function findReplyByReferences(message) {
  if (message.inReplyTo) {
    return message.inReplyTo;
  }

  // Check References header
  const references = message.references || [];
  for (const ref of references) {
    if (trackedEmails.has(ref)) {
      return ref;
    }
  }

  return null;
}
```

## Best Practices

### 1. Always Store Message-IDs Persistently

Use a proper database, not in-memory storage:

```javascript
// MongoDB example
await db.collection('tracked_emails').insertOne({
  messageId,
  accountId,
  recipient,
  subject,
  sentAt: new Date(),
  replied: false
});
```

### 2. Set Expiration on Tracking

Don't track emails forever:

```javascript
// Expire tracking after 30 days
const TRACKING_EXPIRY_DAYS = 30;

async function cleanupExpiredTracking() {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - TRACKING_EXPIRY_DAYS);

  await db.collection('tracked_emails').deleteMany({
    sentAt: { $lt: expiryDate },
    replied: false
  });
}

// Run daily
setInterval(cleanupExpiredTracking, 24 * 60 * 60 * 1000);
```

### 3. Handle Duplicate Webhooks

Webhooks may be delivered multiple times:

```javascript
const processedReplies = new Set();

async function handleReply(original, reply) {
  const replyKey = `${original.messageId}:${reply.id}`;

  if (processedReplies.has(replyKey)) {
    console.log('Already processed this reply');
    return;
  }

  processedReplies.add(replyKey);

  // Process reply...
}
```

### 4. Monitor Reply Rates

Track and alert on reply rates:

```javascript
async function calculateReplyRate(timeframe = 7) {
  const since = new Date();
  since.setDate(since.getDate() - timeframe);

  const sent = await db.collection('tracked_emails').countDocuments({
    sentAt: { $gte: since }
  });

  const replied = await db.collection('tracked_emails').countDocuments({
    sentAt: { $gte: since },
    replied: true
  });

  const rate = sent > 0 ? (replied / sent) * 100 : 0;

  return {
    sent,
    replied,
    rate: rate.toFixed(2) + '%',
    timeframe: `${timeframe} days`
  };
}

// Check weekly reply rate
const stats = await calculateReplyRate(7);
console.log(`Reply rate: ${stats.rate} (${stats.replied}/${stats.sent})`);
```
