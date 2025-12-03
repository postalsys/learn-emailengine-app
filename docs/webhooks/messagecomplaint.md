---
title: "messageComplaint"
sidebar_position: 11
description: "Webhook event triggered when an FBL (Feedback Loop) complaint is detected"
---

# messageComplaint

The `messageComplaint` webhook event is triggered when EmailEngine detects a feedback loop (FBL) complaint in a monitored mailbox. This event helps you identify when recipients have marked your emails as spam or unwanted, allowing you to maintain sender reputation and comply with email best practices.

## When This Event is Triggered

The `messageComplaint` event fires when:

- An ARF (Abuse Reporting Format) complaint message is received in a monitored mailbox
- EmailEngine successfully parses the complaint and extracts recipient information
- The complaint contains identifiable information about the original message

EmailEngine analyzes incoming messages for FBL complaint patterns including:

- Standard ARF (RFC 5965) abuse reports with `message/feedback-report` content type
- Hotmail/Outlook.com complaint notifications from `staff@hotmail.com`
- Microsoft FBL reports via the JMRP (Junk Mail Reporting Program)
- ISP feedback loop messages containing embedded original headers

## Common Use Cases

- **List hygiene** - Automatically unsubscribe users who report spam
- **Reputation management** - Track complaint rates to maintain good sender reputation
- **Deliverability monitoring** - Identify content or sending patterns causing complaints
- **Compliance** - Fulfill legal requirements to honor unsubscribe requests
- **Analytics** - Build dashboards showing complaint trends by campaign or domain
- **Blocklist prevention** - Address issues before reaching ISP complaint thresholds

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that received the complaint message |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Event type, always "messageComplaint" for this event |
| `eventId` | string | Yes | Unique identifier for this webhook delivery |
| `data` | object | Yes | Complaint data object (see below) |

### Complaint Data Fields (`data` object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `complaintMessage` | string | Yes | EmailEngine message ID of the complaint notification email itself |
| `arf` | object | Yes | ARF (Abuse Reporting Format) data extracted from the complaint |
| `headers` | object | No | Headers from the original complained-about message |

### ARF Object Structure

The `arf` object contains complaint metadata extracted from the ARF report:

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Source of the complaint (e.g., "Hotmail", ISP name) |
| `feedbackType` | string | Type of feedback report (typically "abuse") |
| `abuseType` | string | Specific type of abuse reported (typically "complaint") |
| `originalMailFrom` | string | Return-Path/envelope sender of the original message |
| `originalRcptTo` | array | Email addresses of recipients who complained |
| `sourceIp` | string | IP address of the sending server for the original message |
| `arrivalDate` | string | ISO 8601 timestamp when the original message arrived |
| `userAgent` | string | User agent/software that generated the report |
| `version` | string | ARF format version |
| `reportingMta` | string | MTA that generated the complaint report |

### Headers Object Structure

The `headers` object contains headers from the original complained-about message (when available):

| Field | Type | Description |
|-------|------|-------------|
| `messageId` | string | Message-ID header of the original message |
| `from` | string | From address of the original message |
| `to` | array | To addresses of the original message |
| `cc` | array | CC addresses of the original message |
| `subject` | string | Subject line of the original message |
| `date` | string | ISO 8601 timestamp from the original message Date header |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T07:06:11.697Z",
  "event": "messageComplaint",
  "eventId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "data": {
    "complaintMessage": "AAAAAQAABzE",
    "arf": {
      "source": "Hotmail",
      "feedbackType": "abuse",
      "abuseType": "complaint",
      "originalMailFrom": "sender@example.com",
      "originalRcptTo": ["recipient@hotmail.com"],
      "sourceIp": "203.0.113.42",
      "arrivalDate": "2025-10-17T07:06:35.021Z"
    },
    "headers": {
      "messageId": "<57f34982-43cc-6534-40f9-0f72f1c8a158@example.com>",
      "from": "sender@example.com",
      "to": ["recipient@hotmail.com"],
      "subject": "Your weekly newsletter",
      "date": "2025-10-17T07:06:34.000Z"
    }
  }
}
```

## Understanding FBL Complaints

### What Causes Complaints

Recipients mark emails as spam for various reasons:

- **Unwanted emails** - User no longer wants to receive messages
- **Forgotten subscription** - User doesn't remember signing up
- **Difficult unsubscribe** - Easier to click "spam" than find unsubscribe link
- **Misleading content** - Email doesn't match user expectations
- **Excessive frequency** - Too many emails sent too often

### Feedback Loop Sources

Major ISPs operate feedback loop programs:

| Provider | Program | Notes |
|----------|---------|-------|
| Microsoft (Outlook, Hotmail) | JMRP/SNDS | Reports from `staff@hotmail.com` |
| Yahoo | CFL | Complaint Feedback Loop |
| AOL | FBL | Feedback Loop program |
| Comcast | FBL | Requires registration |

### Complaint Rate Thresholds

ISPs monitor complaint rates and may block senders who exceed thresholds:

| Provider | Recommended Maximum | Risk Threshold |
|----------|---------------------|----------------|
| General guideline | < 0.1% | > 0.3% |
| Microsoft | < 0.1% | > 0.5% |
| Google | < 0.1% | > 0.3% |

## Handling the Event

### Basic Handler

```javascript
async function handleMessageComplaint(event) {
  const { account, data } = event;

  console.log(`Complaint detected for account ${account}:`);
  console.log(`  Complaint Message ID: ${data.complaintMessage}`);

  if (data.arf) {
    console.log(`  Source: ${data.arf.source}`);
    console.log(`  Feedback Type: ${data.arf.feedbackType}`);
    console.log(`  Complainants: ${data.arf.originalRcptTo?.join(', ')}`);
  }

  if (data.headers) {
    console.log(`  Original Message-ID: ${data.headers.messageId}`);
    console.log(`  Original Subject: ${data.headers.subject}`);
  }

  // Process the complaint
  await processComplaint(data);
}
```

### Automatic Unsubscribe

```javascript
async function processComplaint(complaintData) {
  const { arf, headers } = complaintData;

  // Get complainant email addresses
  const complainants = arf?.originalRcptTo || [];

  for (const email of complainants) {
    // Unsubscribe the user from all mailing lists
    await db.subscriptions.updateMany(
      { email: email.toLowerCase() },
      {
        $set: {
          subscribed: false,
          unsubscribeReason: 'spam_complaint',
          unsubscribedAt: new Date(),
          complaintSource: arf?.source
        }
      }
    );

    // Add to suppression list to prevent future sends
    await db.suppressionList.upsert({
      email: email.toLowerCase(),
      reason: 'complaint',
      source: arf?.source,
      originalMessageId: headers?.messageId,
      createdAt: new Date()
    });

    console.log(`Unsubscribed ${email} due to spam complaint`);
  }
}
```

### Tracking Complaint Metrics

```javascript
async function trackComplaintMetrics(event) {
  const { account, data } = event;

  // Extract campaign info from original message if available
  const campaignId = extractCampaignId(data.headers?.messageId);

  await metrics.increment('email.complaints', {
    account,
    source: data.arf?.source || 'unknown',
    feedbackType: data.arf?.feedbackType || 'unknown',
    campaign: campaignId
  });

  // Calculate and alert on complaint rate
  const stats = await getRecentStats(account);
  const complaintRate = stats.complaints / stats.totalSent;

  if (complaintRate > 0.001) { // 0.1%
    await sendAlert({
      type: 'high_complaint_rate',
      account,
      rate: complaintRate,
      threshold: 0.001
    });
  }
}

function extractCampaignId(messageId) {
  // Extract campaign ID from Message-ID if your system embeds it
  const match = messageId?.match(/campaign-([a-z0-9]+)/i);
  return match ? match[1] : null;
}
```

### Correlating with Original Message

```javascript
async function correlateComplaint(complaintData) {
  const { headers, arf } = complaintData;

  // Try to find the original sent message in your database
  let originalMessage = null;

  if (headers?.messageId) {
    originalMessage = await db.sentMessages.findOne({
      messageId: headers.messageId
    });
  }

  if (!originalMessage && arf?.originalMailFrom) {
    // Fallback: search by sender and approximate time
    originalMessage = await db.sentMessages.findOne({
      from: arf.originalMailFrom,
      sentAt: {
        $gte: new Date(Date.parse(arf.arrivalDate) - 86400000), // 1 day before
        $lte: new Date(arf.arrivalDate)
      }
    });
  }

  if (originalMessage) {
    // Link complaint to original message for analytics
    await db.sentMessages.updateOne(
      { _id: originalMessage._id },
      {
        $set: { complained: true },
        $push: {
          complaints: {
            date: new Date(),
            recipients: arf?.originalRcptTo,
            source: arf?.source
          }
        }
      }
    );
  }

  return originalMessage;
}
```

## Best Practices

1. **Immediately unsubscribe complainants** - Honor complaints instantly to maintain sender reputation
2. **Add to suppression list** - Prevent sending to complainants across all campaigns
3. **Monitor complaint rates** - Track rates per campaign and overall; investigate spikes
4. **Review complained content** - Analyze what content generates complaints
5. **Improve list acquisition** - Ensure clear opt-in and set expectations
6. **Make unsubscribe easy** - Prominent, one-click unsubscribe reduces complaints
7. **Respect frequency preferences** - Allow users to control email frequency
8. **Clean inactive subscribers** - Remove users who haven't engaged in 6+ months

## Related Events

- [messageBounce](/docs/webhooks/messagebounce) - Triggered when a bounce notification is received
- [messageFailed](/docs/webhooks/messagefailed) - Triggered when EmailEngine fails to deliver a queued email
- [messageSent](/docs/webhooks/messagesent) - Triggered when a message is successfully sent
- [messageNew](/docs/webhooks/messagenew) - The complaint notification also triggers this event

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Sending Emails](/docs/sending/basic-sending) - How to send emails through EmailEngine
- [Settings API](/docs/api/post-v-1-settings) - Configure webhook settings
