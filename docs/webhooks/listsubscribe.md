---
title: "listSubscribe"
sidebar_position: 24
description: "Webhook event triggered when a recipient re-subscribes to a mailing list"
---

# listSubscribe

The `listSubscribe` webhook event is triggered when a recipient re-subscribes to a mailing list after unsubscribing from it. It is the counterpart of [`listUnsubscribe`](/docs/webhooks/listunsubscribe): the address has been removed from EmailEngine's suppression list for that `listId`, and your own subscriber records should follow.

## When This Event is Triggered

The `listSubscribe` event fires when:

1. A recipient is on the suppression list for a `listId`
2. They open the unsubscribe page for that list and confirm the re-subscribe action
3. EmailEngine removes them from the suppression list

The re-subscribe action exists only on the unsubscribe page EmailEngine renders. There is no API or one-click equivalent, and removing an address through the [Blocklists API](/docs/api/delete-v-1-blocklist-listid) or the admin interface does not fire the event.

It fires only when an entry was actually removed. If the address was not on the list, because it had never unsubscribed or had already re-subscribed, the page confirms the re-subscription but no webhook is sent.

## Payload Schema

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceUrl` | string or null | Yes | The configured EmailEngine service URL. `null` when the `serviceUrl` setting is empty |
| `account` | string | Yes | Account ID that sent the original message |
| `date` | string | Yes | ISO 8601 timestamp when the webhook was generated |
| `event` | string | Yes | Always `listSubscribe` |
| `data` | object | Yes | Re-subscribe details (see below) |

### Data Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string | Yes | Email address that re-subscribed |
| `messageId` | string | No | Message-ID of the message whose unsubscribe link led to the page. Absent when the link was generated from the admin interface rather than embedded in a message |
| `listId` | string | Yes | The list the recipient was restored to |
| `remoteAddress` | string | Yes | IP address the browser request came from, resolved as described under [`trackOpen`](/docs/webhooks/trackopen#client-address) |
| `userAgent` | string | No | `User-Agent` header of the browser request, when one was sent |

There is no event ID in the body. EmailEngine sends it in the `X-EE-Wh-Event-Id` request header. See [Delivery and Retries](/docs/webhooks/overview#delivery-and-retries).

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
    "remoteAddress": "203.0.113.42",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
  }
}
```

## Example with Minimal Data

A re-subscription through a link generated in the admin interface, so there is no originating message, from a client that sent no `User-Agent`:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "notifications",
  "date": "2025-10-18T11:20:05.000Z",
  "event": "listSubscribe",
  "data": {
    "recipient": "user@example.org",
    "listId": "product-alerts",
    "remoteAddress": "198.51.100.7"
  }
}
```

## How Re-subscription Works

The unsubscribe page is the same signed URL that the message's `List-Unsubscribe` header points at, opened in a browser:

1. **Unsubscribe**: the recipient confirms the unsubscribe on the page, or their mail client has already done it one-click. EmailEngine adds them to the suppression list and sends [`listUnsubscribe`](/docs/webhooks/listunsubscribe)
2. **Confirmation**: the page now shows that the address is unsubscribed, with a "Was this a mistake? Click here to re-subscribe." link
3. **Re-subscribe**: the link opens a confirmation dialog showing the address. Confirming submits the form back to EmailEngine with the signed blob, so the account, list and recipient come from the signature, never from the browser
4. **Removal**: EmailEngine removes the address from the suppression list for that `listId`
5. **Webhook**: this event is sent if an entry was removed

The re-subscription affects that `listId` only. The recipient stays unsubscribed from any other list they left.

## Handling the Event

EmailEngine will send to the address again from this point, so restore it in your own records and in any external list service:

```javascript
async function handleListSubscribe(event) {
  const { data, date } = event;

  await db.subscribers.updateOne(
    { email: data.recipient.toLowerCase() },
    {
      $set: {
        [`lists.${data.listId}.subscribed`]: true,
        [`lists.${data.listId}.resubscribedAt`]: new Date(date)
      }
    }
  );

  await db.subscriptionLogs.insertOne({
    email: data.recipient,
    listId: data.listId,
    action: 'resubscribe',
    messageId: data.messageId,
    timestamp: new Date(date),
    ipAddress: data.remoteAddress
  });
}
```

## Suppression List Management

The entry is removed before the event is sent, so a handler that fails does not keep the address suppressed. Once the address is off the suppression list, future submissions with the same `listId` to that recipient are sent again. The list itself can be read and edited through the API:

- [Get blocklist entries](/docs/api/get-v-1-blocklist-listid) - View the addresses currently suppressed for a list
- [Add to blocklist](/docs/api/post-v-1-blocklist-listid) - Suppress an address without a recipient action
- [Remove from blocklist](/docs/api/delete-v-1-blocklist-listid) - Restore an address without a recipient action

Neither API call fires a webhook. See [Suppression Lists](/docs/sending/deliverability/suppression-lists) for the full picture.

## Related Events

- [listUnsubscribe](/docs/webhooks/listunsubscribe) - Triggered when a recipient unsubscribes from a mailing list
- [messageSent](/docs/webhooks/messagesent) - Triggered when a message is accepted for delivery

## See Also

- [Webhooks Overview](/docs/webhooks/overview) - Configuring the webhook URL and the `webhookEvents` allowlist
- [Virtual Lists](/docs/sending/deliverability/suppression-lists) - Sending list mail with `listId`, and what the recipient sees on the unsubscribe page
- [Suppression Lists](/docs/sending/deliverability/suppression-lists) - Reading and editing the suppression lists this event updates
- [Blocklists API](/docs/api/get-v-1-blocklists) - Listing every suppression list on the instance
