---
title: "listUnsubscribe"
sidebar_position: 23
description: "Webhook event triggered when a recipient unsubscribes from a mailing list via one-click unsubscribe"
---

# listUnsubscribe

The `listUnsubscribe` webhook event is triggered when a recipient uses the one-click unsubscribe mechanism to remove themselves from a mailing list. This event enables you to keep your mailing lists synchronized and honor unsubscribe requests promptly.

## When This Event is Triggered

The `listUnsubscribe` event fires when:

- A recipient clicks the unsubscribe link in an email that includes List-Unsubscribe headers
- The recipient confirms unsubscription via the one-click unsubscribe flow (RFC 8058)
- EmailEngine successfully validates the unsubscribe request signature (if service secret is configured)
- This is the first time the recipient has unsubscribed from this specific list (duplicate requests are ignored)

The one-click unsubscribe mechanism is implemented according to RFC 8058, which allows email clients (like Gmail, Outlook, Yahoo) to display a prominent "Unsubscribe" button that users can click to remove themselves from mailing lists.

**Important:** This event is only triggered when:
1. The email was sent with List-Unsubscribe headers configured
2. The `listId` was specified when sending the email
3. The recipient uses the one-click unsubscribe endpoint

## Common Use Cases

- **Mailing list management** - Automatically remove recipients from your mailing lists
- **Subscription database updates** - Keep your subscriber database synchronized with unsubscribe requests
- **Compliance tracking** - Maintain records of unsubscribe requests for regulatory compliance (CAN-SPAM, GDPR)
- **Preference center updates** - Update user preferences in your application
- **Email deliverability** - Honor unsubscribe requests to maintain sender reputation
- **Analytics** - Track unsubscribe rates across different campaigns or list segments

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that sent the original message |
| `date` | string | Yes | ISO 8601 timestamp when the unsubscribe request was processed |
| `event` | string | Yes | Event type, always "listUnsubscribe" for this event |
| `data` | object | Yes | Unsubscribe data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string | Yes | Email address of the recipient who unsubscribed |
| `messageId` | string | Yes | Message-ID header of the email from which they unsubscribed |
| `listId` | string | Yes | The mailing list identifier from which the recipient unsubscribed |
| `remoteAddress` | string | Yes | IP address of the client that initiated the unsubscribe request |
| `userAgent` | string | No | User-Agent header from the unsubscribe request |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "marketing",
  "date": "2025-10-17T14:32:15.882Z",
  "event": "listUnsubscribe",
  "data": {
    "recipient": "customer@company.com",
    "messageId": "<newsletter-2025-10-001@marketing.example.com>",
    "listId": "weekly-newsletter",
    "remoteAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
  }
}
```

## Example with Minimal Data

When the email client submits the one-click unsubscribe request without a User-Agent header:

```json
{
  "account": "notifications",
  "date": "2025-10-17T09:15:22.000Z",
  "event": "listUnsubscribe",
  "data": {
    "recipient": "user@example.org",
    "messageId": "<alert-12345@notifications.example.com>",
    "listId": "product-alerts",
    "remoteAddress": "10.0.0.50"
  }
}
```

## Enabling List-Unsubscribe Headers

To enable one-click unsubscribe functionality, include List-Unsubscribe headers when sending emails:

### Per-Message Configuration

Include the `listId` and enable List-Unsubscribe headers when sending:

```bash
curl -X POST "https://emailengine.example.com/v1/account/marketing/submit" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "name": "Newsletter Team",
      "address": "newsletter@example.com"
    },
    "to": [
      {
        "address": "subscriber@company.com"
      }
    ],
    "subject": "Weekly Newsletter - October Edition",
    "html": "<p>Hello!</p><p>Here is your weekly newsletter...</p>",
    "listHeaders": {
      "id": "weekly-newsletter",
      "unsubscribe": true
    }
  }'
```

The `listHeaders` object supports the following options:

- `id` (required for unsubscribe): Unique identifier for the mailing list
- `unsubscribe`: Set to `true` to add List-Unsubscribe header with one-click URL

### How List-Unsubscribe Works

When you send an email with List-Unsubscribe enabled, EmailEngine:

1. Generates a signed one-click unsubscribe URL
2. Adds `List-Unsubscribe` and `List-Unsubscribe-Post` headers to the email
3. Email clients that support RFC 8058 display an unsubscribe button

Example headers added to the email:

```
List-Unsubscribe: <https://emailengine.example.com/unsubscribe?data=...&sig=...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

When a recipient clicks the unsubscribe button:

1. The email client sends a POST request to the unsubscribe URL
2. EmailEngine validates the signature
3. The recipient is added to the suppression list for that list ID
4. This webhook is triggered (only for the first unsubscribe)
5. Future emails to this recipient with the same list ID will be suppressed

## Handling the Event

### Basic Handler

```javascript
async function handleListUnsubscribe(event) {
  const { account, date, data } = event;

  console.log(`Unsubscribe request for account ${account}`);
  console.log(`  Recipient: ${data.recipient}`);
  console.log(`  List ID: ${data.listId}`);
  console.log(`  Message-ID: ${data.messageId}`);
  console.log(`  Unsubscribed at: ${date}`);

  // Update your mailing list database
  await removeFromMailingList({
    email: data.recipient,
    listId: data.listId,
    unsubscribedAt: new Date(date),
    source: 'one-click'
  });
}
```

### Updating Subscription Database

```javascript
async function handleListUnsubscribe(event) {
  const { data, date } = event;

  // Update the subscriber's status in your database
  await db.subscribers.updateOne(
    { email: data.recipient.toLowerCase() },
    {
      $set: {
        [`lists.${data.listId}.subscribed`]: false,
        [`lists.${data.listId}.unsubscribedAt`]: new Date(date)
      },
      $push: {
        unsubscribeHistory: {
          listId: data.listId,
          messageId: data.messageId,
          timestamp: new Date(date),
          ipAddress: data.remoteAddress
        }
      }
    }
  );

  // Log for compliance purposes
  await db.unsubscribeLogs.insertOne({
    email: data.recipient,
    listId: data.listId,
    messageId: data.messageId,
    timestamp: new Date(date),
    ipAddress: data.remoteAddress,
    userAgent: data.userAgent
  });
}
```

### Syncing with External Mailing List Services

```javascript
async function handleListUnsubscribe(event) {
  const { data } = event;

  // Update your CRM or mailing list service
  switch (data.listId) {
    case 'weekly-newsletter':
      await mailchimpClient.updateMember(data.recipient, {
        status: 'unsubscribed'
      });
      break;

    case 'product-updates':
      await sendgridClient.removeFromList(
        'product-updates-list-id',
        data.recipient
      );
      break;

    default:
      // Generic unsubscribe handling
      await internalMailingService.unsubscribe(
        data.recipient,
        data.listId
      );
  }
}
```

### Tracking Unsubscribe Analytics

```javascript
async function handleListUnsubscribe(event) {
  const { data, date, account } = event;

  // Track unsubscribe metrics
  await analytics.track('email_unsubscribe', {
    account,
    listId: data.listId,
    email: data.recipient,
    messageId: data.messageId,
    timestamp: date
  });

  // Find which campaign triggered the unsubscribe
  const originalMessage = await db.sentMessages.findOne({
    messageId: data.messageId
  });

  if (originalMessage) {
    // Increment unsubscribe count for the campaign
    await db.campaigns.updateOne(
      { _id: originalMessage.campaignId },
      { $inc: { unsubscribeCount: 1 } }
    );
  }
}
```

## Technical Details

### One-Click Unsubscribe Flow

The one-click unsubscribe mechanism follows RFC 8058:

1. **Email Sending**: When an email is sent with `listHeaders.unsubscribe: true`, EmailEngine adds:
   - `List-Unsubscribe` header with a POST URL
   - `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header

2. **User Action**: The recipient's email client displays an unsubscribe button. When clicked, the client sends an HTTP POST request to EmailEngine's `/unsubscribe` endpoint.

3. **Validation**: EmailEngine verifies:
   - The request signature (if service secret is configured)
   - The data integrity
   - The account exists

4. **Suppression**: The recipient is added to the suppression list for the specific list ID.

5. **Webhook**: The `listUnsubscribe` event is triggered (only for new unsubscribes).

### Suppression Lists

EmailEngine maintains per-list suppression lists. When a recipient unsubscribes:

- They are added to the suppression list for that specific `listId`
- Future emails sent with the same `listId` to that recipient are automatically suppressed
- The suppression only applies to that specific list, not all emails

You can manage suppression lists via the API:

- [Get suppression list entries](/docs/api/get-v-1-lists-type-list-entries) - View unsubscribed emails
- [Add to suppression list](/docs/api/post-v-1-lists-type-list-entries) - Manually add entries
- [Remove from suppression list](/docs/api/delete-v-1-lists-type-list-entry) - Re-enable sending

### Duplicate Detection

EmailEngine only triggers the `listUnsubscribe` webhook for the first unsubscribe request. If a recipient clicks unsubscribe multiple times (or if multiple email clients trigger the request), subsequent requests are acknowledged but do not trigger additional webhooks.

## Best Practices

1. **Act on every unsubscribe** - Always honor unsubscribe requests immediately to maintain compliance and sender reputation
2. **Update all systems** - Sync unsubscribe status across your CRM, mailing list service, and internal databases
3. **Log for compliance** - Maintain records of unsubscribe requests with timestamps and source information for regulatory compliance
4. **Use unique list IDs** - Create distinct list IDs for different mailing lists to allow granular unsubscribe management
5. **Monitor unsubscribe rates** - Track unsubscribe rates per campaign to identify content or frequency issues
6. **Provide alternatives** - Consider offering preference options instead of complete unsubscribe where appropriate
7. **Handle gracefully** - Even if your webhook processing fails, EmailEngine maintains the suppression list independently

## Related Events

- [messageSent](/docs/webhooks/messagesent) - Triggered when the original email was sent
- [trackClick](/docs/webhooks/trackclick) - Triggered when links in emails are clicked

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Complete webhook setup guide
- [Sending Emails](/docs/sending/basic-sending) - How to send emails with List-Unsubscribe headers
- [Suppression Lists API](/docs/api/get-v-1-lists-type-list-entries) - Manage unsubscribe lists programmatically
