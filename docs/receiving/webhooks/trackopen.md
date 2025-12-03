---
title: "trackOpen"
sidebar_position: 20
description: "Webhook event triggered when a recipient opens an email with open tracking enabled"
---

# trackOpen

The `trackOpen` webhook event is triggered when a recipient opens an email that has open tracking enabled. This enables you to monitor email engagement and track when your messages are viewed.

## When This Event is Triggered

The `trackOpen` event fires when:

- A recipient's email client loads the tracking pixel embedded in the email
- The recipient views the email in a client that automatically loads images
- The recipient manually loads images in the email

The tracking works by embedding a 1x1 pixel transparent GIF image in the email's HTML body. When the email is opened and the image is loaded, EmailEngine records the open event and triggers this webhook.

**Important:** Open tracking only works when:
1. The email was sent with HTML content (plain text emails cannot be tracked)
2. Open tracking was enabled when sending the email (via `trackOpens: true` or global tracking settings)
3. The recipient's email client loads remote images

## Limitations

Open tracking has inherent limitations due to how email clients work:

- **Image blocking** - Many email clients block images by default, preventing open tracking
- **Privacy features** - Apple Mail Privacy Protection and similar features can hide actual opens or trigger false positives
- **Text-only viewing** - Recipients viewing emails in plain text mode won't trigger opens
- **Caching** - Email clients may cache the tracking pixel, causing only the first open to be tracked
- **Prefetching** - Some security scanners and email clients prefetch images, potentially triggering false opens

EmailEngine attempts to filter out automated requests from known security scanners (such as Google's security scanners) to reduce false positives.

## Common Use Cases

- **Email engagement analytics** - Track open rates for marketing campaigns
- **Sales follow-up** - Know when a prospect has viewed your email
- **Support ticket monitoring** - Confirm when customers have seen your response
- **Delivery confirmation** - Verify that important messages were viewed
- **A/B testing** - Compare open rates across different subject lines or send times

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that sent the tracked message |
| `date` | string | Yes | ISO 8601 timestamp when the open was detected |
| `event` | string | Yes | Event type, always "trackOpen" for this event |
| `data` | object | Yes | Open tracking data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | string | Yes | Message-ID header of the tracked email |
| `remoteAddress` | string | Yes | IP address of the client that loaded the tracking pixel |
| `userAgent` | string | No | User-Agent header from the request that loaded the tracking pixel |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "user123",
  "date": "2025-10-17T06:56:01.430Z",
  "event": "trackOpen",
  "data": {
    "messageId": "<0ee381d9-581a-2a57-6038-15e64c76f108@example.com>",
    "remoteAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
  }
}
```

## Example with Minimal Data

When the email client doesn't send a User-Agent header:

```json
{
  "account": "marketing",
  "date": "2025-10-17T14:30:00.000Z",
  "event": "trackOpen",
  "data": {
    "messageId": "<campaign-2025-q4-001@marketing.example.com>",
    "remoteAddress": "10.0.0.50"
  }
}
```

## Enabling Open Tracking

### Per-Message Tracking

Enable open tracking when sending an email via the submit API:

```bash
curl -X POST "https://emailengine.example.com/v1/account/user123/submit" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "name": "Sales Team",
      "address": "sales@example.com"
    },
    "to": [
      {
        "address": "prospect@company.com"
      }
    ],
    "subject": "Your requested information",
    "html": "<p>Hello,</p><p>Here is the information you requested...</p>",
    "trackOpens": true
  }'
```

### Global Tracking Settings

Enable open tracking for all outgoing emails via the Settings API:

```bash
curl -X POST "https://emailengine.example.com/v1/settings" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingEnabled": true
  }'
```

Or enable only open tracking (not click tracking):

```bash
curl -X POST "https://emailengine.example.com/v1/settings" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackOpens": true,
    "trackClicks": false
  }'
```

## Handling the Event

### Basic Handler

```javascript
async function handleTrackOpen(event) {
  const { account, date, data } = event;

  console.log(`Email opened for account ${account}`);
  console.log(`  Message-ID: ${data.messageId}`);
  console.log(`  Opened at: ${date}`);
  console.log(`  From IP: ${data.remoteAddress}`);

  // Update your database or analytics system
  await recordEmailOpen({
    messageId: data.messageId,
    openedAt: new Date(date),
    ipAddress: data.remoteAddress,
    userAgent: data.userAgent
  });
}
```

### Tracking Multiple Opens

Since the same email may be opened multiple times by the same recipient (or the tracking pixel may be cached), consider deduplication:

```javascript
const recentOpens = new Map();

async function handleTrackOpen(event) {
  const { data, date } = event;
  const cacheKey = `${data.messageId}:${data.remoteAddress}`;

  // Check if we've seen this open recently (within 1 hour)
  const lastOpen = recentOpens.get(cacheKey);
  if (lastOpen && (Date.now() - lastOpen) < 3600000) {
    console.log('Duplicate open detected, skipping');
    return;
  }

  recentOpens.set(cacheKey, Date.now());

  // Process the open event
  await recordEmailOpen(event);
}
```

### Correlating Opens with Sent Messages

Use the `messageId` to link opens back to your original sent messages:

```javascript
async function handleTrackOpen(event) {
  const { data } = event;

  // Find the original message in your database
  const sentMessage = await db.sentMessages.findOne({
    messageId: data.messageId
  });

  if (sentMessage) {
    // Update open status
    await db.sentMessages.updateOne(
      { messageId: data.messageId },
      {
        $set: {
          opened: true,
          openedAt: new Date(event.date)
        },
        $inc: { openCount: 1 }
      }
    );

    // Notify sales team if this is a prospect email
    if (sentMessage.type === 'prospect') {
      await notifySalesTeam(sentMessage, event);
    }
  }
}
```

## Technical Details

### How the Tracking Pixel Works

When open tracking is enabled, EmailEngine:

1. Generates a unique tracking URL containing encoded data (account ID, Message-ID)
2. Signs the tracking data with a service secret (if configured) for security
3. Embeds a 1x1 pixel GIF image tag just before the closing `</body>` tag in the HTML

The embedded tracking pixel looks like:

```html
<img src="https://emailengine.example.com/open.gif?data=...&sig=..."
     style="border: 0px; width:1px; height: 1px;"
     tabindex="-1" width="1" height="1" alt="">
```

### Automated Request Filtering

EmailEngine attempts to filter out opens from automated security scanners to provide more accurate tracking data. Known scanner IP ranges (such as Google's security crawlers) are detected and excluded from triggering webhook events.

When an automated request is detected, the event is logged but no webhook is sent.

## Best Practices

1. **Don't rely solely on opens** - Open tracking is not 100% accurate due to image blocking and privacy features
2. **Combine with click tracking** - Use both open and click tracking for better engagement insights
3. **Handle duplicates** - The same email may trigger multiple open events
4. **Respect privacy** - Be transparent with recipients about tracking and comply with privacy regulations
5. **Use for trends, not absolutes** - Open rates are best used for comparing relative performance, not absolute engagement
6. **Consider time zones** - Analyze open times to optimize send times for your audience

## Related Events

- [trackClick](/docs/receiving/webhooks/trackclick) - Triggered when a tracked link is clicked
- [messageSent](/docs/receiving/webhooks/messagesent) - Triggered when the tracked email was sent

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Sending Emails](/docs/sending/basic-sending) - How to send emails with tracking enabled
- [Settings API](/docs/api/post-v-1-settings) - Configure global tracking settings
