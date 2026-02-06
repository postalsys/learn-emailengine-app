---
title: Blocklist Management
sidebar_position: 8
description: Manage email blocklists for suppression lists, bounce handling, and one-click unsubscribe compliance
keywords:
  - blocklist
  - suppression list
  - unsubscribe
  - email list hygiene
  - bounce management
  - mail merge
---

# Blocklist Management

EmailEngine provides blocklist functionality for managing email suppression lists. Blocklists prevent emails from being sent to addresses that have unsubscribed, bounced, or been manually blocked. They integrate with mail merge, one-click unsubscribe (RFC 8058), and bounce detection.

## Overview

Blocklists are collections of email addresses associated with a named list. When sending mail merge campaigns with a `listId`, EmailEngine automatically checks each recipient against the corresponding blocklist and skips blocked addresses.

**Key features:**

- Ad-hoc list creation (lists are created automatically when the first entry is added)
- RFC 8058 one-click unsubscribe support with `List-Unsubscribe` headers
- Per-recipient tracking with source, reason, and timestamp metadata
- Integration with mail merge for automatic recipient filtering
- Webhook notifications for subscribe/unsubscribe events

## How Blocklists Work

### Mail Merge Integration

When you send a mail merge with a `listId`, EmailEngine:

1. Checks each recipient against the specified blocklist
2. Skips blocked recipients (returns them with a `skipped` field in the response)
3. Adds `List-Unsubscribe` and `List-Unsubscribe-Post` headers to outgoing emails
4. Makes `{{rcpt.unsubscribeUrl}}` available in templates

### One-Click Unsubscribe Flow

1. EmailEngine adds RFC 8058 compliant headers to mail merge emails
2. When a recipient clicks unsubscribe in their email client, a POST request is sent to EmailEngine's `/unsubscribe` endpoint
3. EmailEngine verifies the signed request, adds the recipient to the blocklist, and triggers a `listUnsubscribe` webhook
4. Future mail merges to the same list automatically skip the unsubscribed address

:::info serviceUrl Required
For unsubscribe URLs to work, the `serviceUrl` setting must be configured with your EmailEngine instance's public URL. Without it, the unsubscribe links will be invalid.

```bash
curl -X POST "https://your-ee.com/v1/settings" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceUrl": "https://your-ee.com"}'
```
:::

## Sending Mail Merge with Blocklist

Include a `listId` when sending mail merge to enable blocklist checking and unsubscribe headers:

```bash
curl -X POST "https://your-ee.com/v1/account/user123/submit" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listId": "weekly-newsletter",
    "subject": "Weekly Newsletter - {{week}}",
    "html": "<h1>Hello {{name}}</h1><p>Newsletter content...</p><p><a href=\"{{rcpt.unsubscribeUrl}}\">Unsubscribe</a></p>",
    "mailMerge": [
      {
        "to": {"address": "alice@example.com", "name": "Alice"},
        "params": {"name": "Alice", "week": "Jan 15"}
      },
      {
        "to": {"address": "bob@example.com", "name": "Bob"},
        "params": {"name": "Bob", "week": "Jan 15"}
      }
    ]
  }'
```

Response includes skipped recipients:

```json
{
  "mailMerge": [
    {
      "success": true,
      "to": {"address": "alice@example.com"},
      "messageId": "<abc@example.com>",
      "queueId": "d41f0423195f271f"
    },
    {
      "success": true,
      "skipped": {
        "reason": "unsubscribe",
        "listId": "weekly-newsletter"
      },
      "to": {"address": "bob@example.com"}
    }
  ]
}
```

### List ID Format

List IDs must use a subdomain/hostname format:

- **Valid:** `newsletter`, `weekly-updates`, `campaign-2024`, `promo-emails`
- **Invalid:** `my_list` (underscores), `My List` (spaces), `list@domain` (@ symbol)

Lists are created automatically when the first entry is added -- no pre-registration needed.

## API Operations

### List All Blocklists

```bash
curl "https://your-ee.com/v1/blocklists" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:

```json
{
  "total": 3,
  "page": 0,
  "pages": 1,
  "blocklists": [
    {"listId": "weekly-newsletter", "count": 42},
    {"listId": "product-updates", "count": 15},
    {"listId": "bounce-hard", "count": 8}
  ]
}
```

[API reference -->](/docs/api/get-v-1-blocklists)

### List Entries in a Blocklist

```bash
curl "https://your-ee.com/v1/blocklist/weekly-newsletter?pageSize=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:

```json
{
  "listId": "weekly-newsletter",
  "total": 42,
  "page": 0,
  "pages": 1,
  "addresses": [
    {
      "recipient": "bob@example.com",
      "account": "user123",
      "source": "one-click",
      "reason": "unsubscribe",
      "messageId": "<abc@example.com>",
      "created": "2024-10-13T12:10:40.980Z"
    }
  ]
}
```

Each entry includes:

| Field | Description |
|-------|-------------|
| `recipient` | Blocked email address (stored lowercase) |
| `account` | Account that triggered the block |
| `source` | How the entry was added: `api` or `one-click` |
| `reason` | Why the address was blocked: `unsubscribe`, `block`, or custom |
| `messageId` | Original message ID (for unsubscribe entries) |
| `created` | Timestamp when the entry was added |

[API reference -->](/docs/api/get-v-1-blocklist-listid)

### Add an Address to a Blocklist

```bash
curl -X POST "https://your-ee.com/v1/blocklist/weekly-newsletter" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "recipient": "spam-reporter@example.com",
    "reason": "complained"
  }'
```

Response:

```json
{
  "success": true,
  "added": true
}
```

The `added` field is `false` if the address was already in the blocklist.

[API reference -->](/docs/api/post-v-1-blocklist-listid)

### Remove an Address from a Blocklist

```bash
curl -X DELETE "https://your-ee.com/v1/blocklist/weekly-newsletter?recipient=bob@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:

```json
{
  "deleted": true
}
```

Removing an address triggers a `listSubscribe` webhook.

[API reference -->](/docs/api/delete-v-1-blocklist-listid)

## Bounce-Based Blocking

You can integrate blocklists with bounce detection to automatically suppress addresses that hard bounce. When a `messageBounce` webhook indicates a permanent failure, add the recipient to a blocklist:

```javascript
app.post('/webhooks/emailengine', (req, res) => {
  const event = req.body;
  res.json({ success: true });

  if (event.event === 'messageBounce') {
    const { recipient, action, response } = event.data;
    const recommendedAction = response?.recommendedAction;

    // Add hard bounces to blocklist
    if (action === 'failed' || recommendedAction === 'remove') {
      fetch('https://your-ee.com/v1/blocklist/bounce-hard', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: event.account,
          recipient: recipient,
          reason: 'hard-bounce'
        })
      });
    }
  }
});
```

Then reference the `bounce-hard` list in your mail merge campaigns to automatically skip addresses that have bounced:

```json
{
  "listId": "bounce-hard",
  "mailMerge": [...]
}
```

:::tip Multiple Blocklists
Each mail merge can only reference one `listId`. If you need to check against multiple suppression lists (e.g., both unsubscribes and hard bounces), consolidate them into a single list, or implement pre-send checking in your application by querying each blocklist via the API.
:::

## Webhook Events

Blocklist changes trigger two webhook events:

### listUnsubscribe

Triggered when an address is added to a blocklist via the one-click unsubscribe mechanism.

```json
{
  "event": "listUnsubscribe",
  "account": "user123",
  "data": {
    "recipient": "bob@example.com",
    "messageId": "<abc@example.com>",
    "listId": "weekly-newsletter",
    "remoteAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

[See listUnsubscribe reference -->](/docs/webhooks/listunsubscribe)

### listSubscribe

Triggered when an address is removed from a blocklist (re-subscribed).

[See listSubscribe reference -->](/docs/webhooks/listsubscribe)

## Best Practices

1. **Use descriptive list IDs** -- Name lists after their purpose: `weekly-newsletter`, `product-announcements`, `transactional-bounces`

2. **Always include unsubscribe links** -- Use `{{rcpt.unsubscribeUrl}}` in mail merge templates to provide RFC 8058 compliant unsubscribe links

3. **Handle bounce webhooks** -- Automatically add hard-bounced addresses to a blocklist to maintain list hygiene

4. **Monitor blocklist growth** -- Regularly review blocklist sizes via the API to track unsubscribe rates

5. **Configure serviceUrl** -- Ensure the `serviceUrl` setting is configured so unsubscribe links work correctly

## See Also

- [Mail Merge](/docs/sending/mail-merge) -- Sending personalized bulk emails
- [Bounce Detection](/docs/advanced/bounces) -- Automatic bounce handling
- [Webhook Events Reference](/docs/reference/webhook-events) -- All webhook event types
- [listUnsubscribe Webhook](/docs/webhooks/listunsubscribe) -- Unsubscribe event details
