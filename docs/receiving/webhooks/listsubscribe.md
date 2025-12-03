---
title: "listSubscribe"
sidebar_position: 23
description: "Webhook event triggered when a recipient re-subscribes to a mailing list"
---

# listSubscribe

The `listSubscribe` webhook event is triggered when a recipient re-subscribes to a mailing list after previously unsubscribing. This event enables you to restore subscriptions and keep your mailing lists synchronized when users decide to receive emails again.

## When This Event is Triggered

The `listSubscribe` event fires when:

- A recipient was previously on the suppression list for a specific mailing list
- The recipient uses the re-subscribe functionality on the unsubscribe confirmation page
- The recipient confirms re-subscription through the modal dialog
- EmailEngine successfully removes the recipient from the suppression list

**Important:** This event is only triggered when:
1. The recipient was previously unsubscribed from the specific list
2. The re-subscribe action successfully removes them from the suppression list
3. This is a new re-subscription (the event is not triggered if the recipient is already subscribed)

## Common Use Cases

- **Mailing list management** - Automatically restore recipients to your mailing lists
- **Subscription database updates** - Keep your subscriber database synchronized with re-subscription requests
- **User preference tracking** - Track when users change their minds about unsubscribing
- **Analytics** - Monitor re-subscription rates to understand user engagement
- **CRM synchronization** - Update subscriber status in external mailing list services
- **Welcome back campaigns** - Trigger re-engagement emails when users re-subscribe

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string | No | The configured EmailEngine service URL |
| `account` | string | Yes | Account ID that sent the original message |
| `date` | string | Yes | ISO 8601 timestamp when the re-subscribe request was processed |
| `event` | string | Yes | Event type, always "listSubscribe" for this event |
| `data` | object | Yes | Re-subscribe data object (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string | Yes | Email address of the recipient who re-subscribed |
| `messageId` | string | No | Message-ID header of the email from which they originally unsubscribed |
| `listId` | string | Yes | The mailing list identifier to which the recipient re-subscribed |
| `remoteAddress` | string | Yes | IP address of the client that initiated the re-subscribe request |
| `userAgent` | string | No | User-Agent header from the re-subscribe request |

## Example Payload

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "marketing",
  "date": "2025-10-18T10:45:22.315Z",
  "event": "listSubscribe",
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

When the re-subscribe request is submitted without a User-Agent header or Message-ID:

```json
{
  "account": "notifications",
  "date": "2025-10-18T11:20:05.000Z",
  "event": "listSubscribe",
  "data": {
    "recipient": "user@example.org",
    "listId": "product-alerts",
    "remoteAddress": "10.0.0.50"
  }
}
```

## How Re-subscription Works

The re-subscription flow is triggered from the unsubscribe confirmation page:

1. **Initial Unsubscribe**: A recipient unsubscribes from a mailing list using the one-click unsubscribe mechanism
2. **Confirmation Page**: After unsubscribing, the recipient sees a confirmation page with a "Was this a mistake?" link
3. **Re-subscribe Modal**: Clicking the link opens a confirmation modal asking if they want to re-subscribe
4. **Confirmation**: The recipient confirms re-subscription by clicking the button in the modal
5. **Suppression List Update**: EmailEngine removes the recipient from the suppression list for that list ID
6. **Webhook Trigger**: The `listSubscribe` event is triggered (only for successful removals)

### Re-subscribe Confirmation Page

The unsubscribe confirmation page includes:

- Confirmation message that the email address was unsubscribed
- A link to re-subscribe ("Was this a mistake? Click here to re-subscribe")
- A modal dialog confirming the re-subscription action
- Display of the email address being re-subscribed

## Handling the Event

### Basic Handler

```javascript
async function handleListSubscribe(event) {
  const { account, date, data } = event;

  console.log(`Re-subscribe request for account ${account}`);
  console.log(`  Recipient: ${data.recipient}`);
  console.log(`  List ID: ${data.listId}`);
  console.log(`  Re-subscribed at: ${date}`);

  // Update your mailing list database
  await addToMailingList({
    email: data.recipient,
    listId: data.listId,
    subscribedAt: new Date(date),
    source: 're-subscribe'
  });
}
```

### Updating Subscription Database

```javascript
async function handleListSubscribe(event) {
  const { data, date } = event;

  // Update the subscriber's status in your database
  await db.subscribers.updateOne(
    { email: data.recipient.toLowerCase() },
    {
      $set: {
        [`lists.${data.listId}.subscribed`]: true,
        [`lists.${data.listId}.resubscribedAt`]: new Date(date)
      },
      $push: {
        subscriptionHistory: {
          listId: data.listId,
          action: 'resubscribe',
          timestamp: new Date(date),
          ipAddress: data.remoteAddress
        }
      }
    }
  );

  // Log for tracking purposes
  await db.subscriptionLogs.insertOne({
    email: data.recipient,
    listId: data.listId,
    action: 'resubscribe',
    messageId: data.messageId,
    timestamp: new Date(date),
    ipAddress: data.remoteAddress,
    userAgent: data.userAgent
  });
}
```

### Syncing with External Mailing List Services

```javascript
async function handleListSubscribe(event) {
  const { data } = event;

  // Update your CRM or mailing list service
  switch (data.listId) {
    case 'weekly-newsletter':
      await mailchimpClient.updateMember(data.recipient, {
        status: 'subscribed'
      });
      break;

    case 'product-updates':
      await sendgridClient.addToList(
        'product-updates-list-id',
        data.recipient
      );
      break;

    default:
      // Generic re-subscribe handling
      await internalMailingService.subscribe(
        data.recipient,
        data.listId
      );
  }
}
```

### Triggering Welcome Back Campaign

```javascript
async function handleListSubscribe(event) {
  const { data, date, account } = event;

  // Track re-subscription analytics
  await analytics.track('email_resubscribe', {
    account,
    listId: data.listId,
    email: data.recipient,
    timestamp: date
  });

  // Send a welcome back email
  await emailQueue.add('send-email', {
    to: data.recipient,
    template: 'welcome-back',
    data: {
      listId: data.listId,
      resubscribedAt: date
    }
  });
}
```

## Technical Details

### Re-subscription Flow

1. **User visits unsubscribe page**: After unsubscribing, the user sees the confirmation page
2. **Clicks re-subscribe link**: Opens a modal confirmation dialog
3. **Confirms action**: Submits a POST request to `/unsubscribe/address` with `action: 'subscribe'`
4. **Suppression list update**: EmailEngine removes the entry from the suppression list
5. **Webhook triggered**: Only if the removal was successful (recipient was actually on the list)

### Suppression List Management

When a recipient re-subscribes:

- They are removed from the suppression list for that specific `listId`
- Future emails sent with the same `listId` to that recipient will be delivered
- The re-subscription only affects the specific list, not all lists

You can manage suppression lists via the API:

- [Get suppression list entries](/docs/api/get-v-1-lists-type-list-entries) - View suppressed emails
- [Add to suppression list](/docs/api/post-v-1-lists-type-list-entries) - Manually add entries
- [Remove from suppression list](/docs/api/delete-v-1-lists-type-list-entry) - Remove entries programmatically

### Duplicate Detection

EmailEngine only triggers the `listSubscribe` webhook when a recipient is actually removed from the suppression list. If the recipient:

- Was not on the suppression list
- Has already re-subscribed
- Attempts to re-subscribe multiple times

No webhook will be triggered for duplicate or invalid requests.

## Best Practices

1. **Update all systems** - Sync re-subscription status across your CRM, mailing list service, and internal databases
2. **Log subscription changes** - Maintain audit trails of subscription and re-subscription events
3. **Consider welcome back emails** - Re-engaged subscribers may appreciate a welcome back message
4. **Monitor re-subscription rates** - Track how often users re-subscribe after unsubscribing
5. **Handle gracefully** - Even if your webhook processing fails, EmailEngine maintains the suppression list independently
6. **Respect user intent** - If a user repeatedly unsubscribes and re-subscribes, consider reaching out to understand their preferences

## Related Events

- [listUnsubscribe](/docs/receiving/webhooks/listunsubscribe) - Triggered when a recipient unsubscribes from a mailing list
- [messageSent](/docs/receiving/webhooks/messagesent) - Triggered when emails are sent

## See Also

- [Webhooks Overview](/docs/receiving/webhooks) - Complete webhook setup guide
- [Sending Emails](/docs/sending/basic-sending) - How to send emails with List-Unsubscribe headers
- [Suppression Lists API](/docs/api/get-v-1-lists-type-list-entries) - Manage subscription lists programmatically
