---
title: Bounce Detection and Handling
sidebar_position: 1
description: Automatically detect and track email bounces with EmailEngine's bounce detection system
keywords:
  - bounces
  - bounce detection
  - bounce email
  - delivery status
  - hard bounce
  - soft bounce
  - email delivery
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bounce Detection and Handling

EmailEngine recognizes the bounce messages that arrive in a monitored mailbox, ties each one to the message that bounced, and reports it through the `messageBounce` webhook. This page describes which messages are checked, what the webhook carries, how a bounce is marked in the message API, and how to act on the classification EmailEngine adds.

## Overview

Email bounces occur when a sent message cannot be delivered to the recipient. EmailEngine monitors incoming emails for bounce responses and extracts detailed bounce information, including:

- **Recipient address** that bounced
- **Bounce type** (hard bounce, soft bounce)
- **Error message** from the receiving server
- **Original message** headers and content
- **SMTP status codes** and diagnostic information

Note: EmailEngine does not use [VERP addresses](https://en.wikipedia.org/wiki/Variable_envelope_return_path). It detects bounces by parsing standard bounce message formats sent by mail servers.

## How Bounce Detection Works

When you send an email through EmailEngine:

1. **Email Sent** - EmailEngine submits the email to the account's email server (Gmail, Outlook, etc.)
2. **messageSent Event** - The account's server accepts the email and EmailEngine triggers `messageSent`
3. **MTA Delivery Attempt** - The account's Mail Transfer Agent (MTA) attempts to deliver to the recipient's mail server (MX)
4. **Recipient MX Rejects** - If the recipient server rejects the email (user unknown, mailbox full, etc.)
5. **Bounce Email Generated** - The sender's MTA generates a bounce response email (a human-readable informational message explaining the delivery failure) and sends it to the sender's inbox
6. **EmailEngine Detects Bounce** - EmailEngine monitors the inbox and detects the bounce email by recognizing common bounce message patterns
7. **Bounce Parsed** - EmailEngine parses the bounce email to extract the bounced recipient address, error message, and original message details
8. **messageBounce Event** - If EmailEngine can identify which original message bounced (via Message-ID or other headers), it triggers the `messageBounce` webhook

When a bounce is detected, EmailEngine:

1. **Parse Bounce Email** - Extract bounce information from the human-readable bounce message
2. **Match Original Message** - Link bounce to sent message via Message-ID (when available)
3. **Send Webhook** - Deliver `messageBounce` webhook to your application
4. **Mark the Bounce Message** - The `messageNew` event for the bounce message, and its message details, carry `isBounce: true` and the `relatedMessageId` of the message that bounced

### Bounce Detection Flow

```mermaid
flowchart TD
    A[Send Email via EmailEngine] --> B[Account's email server accepts email]
    B --> C[messageSent webhook triggered]
    C --> D[Account's MTA delivers to recipient MX]
    D --> E{Recipient MX accepts?}
    E -->|Yes| F[Email delivered successfully]
    E -->|No| G[Recipient MX rejects email]
    G --> H[Sender's MTA generates bounce email]
    H --> I[Bounce email arrives in sender's inbox]
    I --> J[EmailEngine detects bounce message]
    J --> K[Parse bounce to extract recipient and error]
    K --> L{Can identify original message?}
    L -->|Yes| M[messageBounce webhook triggered]
    L -->|No| N[Bounce detected but not linked]
    M --> O[Bounce message carries isBounce and relatedMessageId]
```

## Bounce Types

### Hard Bounces

Permanent delivery failures that will not succeed on retry:

- **User unknown** - Email address doesn't exist
- **Domain not found** - Domain doesn't exist or has no MX records
- **Account disabled** - Recipient account has been closed

**Example error messages:**
```
550 No such user here
550 5.1.1 User unknown
550 Requested action not taken: mailbox unavailable
```

### Soft Bounces

Temporary delivery failures that might succeed on retry:

- **Mailbox temporarily unavailable** - Server issues
- **Mailbox full** - Recipient's mailbox is over quota; the classifier below files this under `retry`
- **Message too large** - Exceeds recipient's size limit
- **Spam filter rejection** - Message blocked by content filter
- **Rate limiting** - Too many messages sent too quickly

**Example error messages:**
```
450 4.2.1 The user you are trying to contact is receiving mail too quickly
452 4.2.2 The email account that you tried to reach is over quota
```

### Bounce Action Codes

The `action` value comes from the `Action:` field of an RFC 3464 delivery status report, or is set to `failed` when a bounce is recognized from the message text alone:

- `failed` - Permanent failure (hard bounce). The only action that produces a `messageBounce` webhook
- `delayed` - Temporary failure (soft bounce)
- `delivered`, `relayed`, `expanded` - reports that are not failures

A `multipart/report; report-type=delivery-status` message that arrives in the inbox and reports `delivered` or `delayed` is attached to the `messageNew` event of the report as a `deliveryReport` instead of being processed as a bounce, so no `messageBounce` webhook is sent for it. A report with any action other than `failed` that reaches the bounce parser by another route is logged and dropped: since EmailEngine v2.82.0 the webhook requires `action` to be `failed`, where earlier releases accepted any action value as long as a recipient and a Message-ID were found.

### Which Messages Are Checked

EmailEngine does not download every new message to look for a bounce. A message is parsed only when it arrives in the Inbox, or in the Junk folder, and has the shape of a bounce: a sender named like a mail delivery system (`Mail Delivery System`, `Mailer-Daemon`, `postmaster@` and similar), an Exchange `Undeliverable:` subject with an `Auto-Submitted` header, a `message/delivery-status` part, a `message/rfc822` part next to a failure subject, or one of the common notification subjects such as `Mail delivery failed` or `Delivery Status Notification`. The same checks run for IMAP, Gmail API and MS Graph accounts; before v2.81.2 the IMAP client kept its own copy of them, which lacked the Exchange rule.

## Sending Email and Tracking Bounces

### Send an Email

Send an email and capture the Message-ID:

```bash
curl -XPOST "https://emailengine.example.com/v1/account/john@example.com/submit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": {
      "address": "unknown@ethereal.email"
    },
    "subject": "Test message",
    "text": "This email should bounce!"
  }'
```

Response includes the Message-ID needed to track bounces:

```json
{
  "response": "Queued for delivery",
  "messageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>",
  "sendAt": "2024-10-13T12:10:34.845Z",
  "queueId": "183cc1a89ddfe365bbb"
}
```

**Save this `messageId` value** - you'll need it to correlate bounce notifications.

### Receive Bounce Webhook

When the email bounces, EmailEngine sends a `messageBounce` webhook:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "john@example.com",
  "date": "2024-10-13T12:10:40.980Z",
  "event": "messageBounce",
  "data": {
    "bounceMessage": "AAAADAAAByc",
    "recipient": "unknown@ethereal.email",
    "action": "failed",
    "response": {
      "source": "smtp",
      "message": "550 No such user here",
      "status": "5.0.0"
    },
    "mta": "mx.ethereal.email",
    "queueId": "B7D3F8220C",
    "messageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>",
    "messageHeaders": {
      "return-path": ["<john@example.com>"],
      "content-type": ["text/plain; charset=utf-8"],
      "from": ["John Doe <john@example.com>"],
      "to": ["unknown@ethereal.email"],
      "subject": ["Test message"],
      "message-id": ["<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>"],
      "date": ["Wed, 12 Oct 2022 12:10:34 +0000"]
    }
  }
}
```

### Webhook Payload Fields

| Field | Description |
|-------|-------------|
| `bounceMessage` | EmailEngine ID of the bounce notification message |
| `recipient` | Email address that bounced |
| `action` | Always `failed`. A report with another action does not produce this webhook |
| `response.message` | Error message from receiving server |
| `response.status` | Enhanced status code (e.g., `5.1.1`) |
| `response.source` | The diagnostic type from the report's `Diagnostic-Code:` field, usually `smtp`. Absent when the bounce was parsed from message text |
| `response.category` | ML-classified bounce category (see below) |
| `response.recommendedAction` | Suggested action to take |
| `response.blocklist` | Blocklist details if applicable |
| `response.retryAfter` | Suggested retry delay in seconds |
| `mta` | Hostname of the server that reported the failure, lowercased: `Remote-MTA`, or `Reporting-MTA` when the report carries no remote one |
| `queueId` | Queue ID from the sending MTA (`X-Postfix-Queue-Id`) |
| `messageId` | Message-ID of the original sent email |
| `messageHeaders` | Headers of the original message when the report quoted them back, otherwise `null` |

The webhook is sent only when the report yields a `failed` action together with both `recipient` and `messageId`; a bounce EmailEngine cannot tie to a sent message is logged but not reported. The `category`, `recommendedAction`, `blocklist` and `retryAfter` fields are added by the classifier described below and are absent when classification fails. The [messageBounce webhook reference](/docs/webhooks/messagebounce) is the complete field list.

## Recognizing a Bounce Message in the API

The bounce itself is an ordinary message in the mailbox. When EmailEngine processes it, the `messageNew` event for it carries `isBounce: true` and `relatedMessageId`, the Message-ID of the message that bounced. Since EmailEngine v2.81.2 the message details endpoint reports the same two fields:

```bash
curl "https://emailengine.example.com/v1/account/john@example.com/message/AAAADAAAByc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```json
{
  "id": "AAAADAAAByc",
  "uid": 1831,
  "date": "2024-10-13T12:10:40.000Z",
  "subject": "Undelivered Mail Returned to Sender",
  "from": {
    "name": "Mail Delivery System",
    "address": "MAILER-DAEMON@mx.example.com"
  },
  "to": [
    {
      "address": "john@example.com"
    }
  ],
  "messageId": "<20241013121040.B7D3F8220C@mx.example.com>",
  "isBounce": true,
  "relatedMessageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@example.com>"
}
```

The fields are decided when the message is fetched, from its content, with the same parser the webhook uses. Nothing is stored for them, so they apply to any bounce in the mailbox, including ones that arrived before the account was added. They are set only for a message in the Inbox that has the shape of a bounce and whose report says the delivery failed; a delivery or delay report is not a bounce. Message listings do not carry them, and the classifier fields are only in the webhook.

:::note The `bounces` array was removed in v2.81.2
Up to EmailEngine v2.81.1, a sent message on an IMAP account carried a `bounces` array in listings, in message details and in its `messageNew` payload, listing the bounces recorded against its Message-ID. The store behind it was never trimmed, so v2.81.2 removed the field and sweeps the stored records on first start. The `messageBounce` webhook is the record of a bounce; keep it in your own storage keyed by `messageId`.
:::

## Handling Bounces in Your Application

Bounce handling comes down to correlating two events that can arrive minutes or hours apart:

1. **When you send**, store the `messageId` returned by the submit endpoint against whatever your application calls a recipient - a contact row, a campaign entry, a support ticket.
2. **When a `messageBounce` webhook arrives**, look up that same value in `data.messageId` and act on the record you find.

EmailEngine does not use [VERP](https://en.wikipedia.org/wiki/Variable_envelope_return_path) return paths, so the Message-ID is the join key. It survives the round trip because the bouncing MTA quotes the original headers back, and EmailEngine reads them out of the bounce report.

```javascript
// 1. On send: remember which recipient this Message-ID belongs to
const res = await fetch(`${EE_URL}/v1/account/${account}/submit`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: { address: recipient }, subject, text })
});
const { messageId } = await res.json();
await db.sentMessages.insert({ messageId, recipient });

// 2. On webhook: resolve it back
app.post('/webhooks', async (req, res) => {
  res.sendStatus(200); // acknowledge first, process afterwards

  if (req.body.event !== 'messageBounce') return;

  const { messageId, recipient, response } = req.body.data;
  const sent = await db.sentMessages.findOne({ messageId });

  await recordBounce(sent?.recipient || recipient, response);
});
```

Acknowledge the webhook before doing the work. A delivery that fails or exceeds the per-attempt timeout is retried up to 10 times with exponential backoff, so a slow handler turns one bounce into several deliveries of the same event. Make `recordBounce()` idempotent.

What `recordBounce()` should do depends on *why* the message bounced, which is what the classification below tells you.

## SMTP Status Codes

Understanding SMTP status codes helps interpret bounces:

### 5.x.x - Permanent Failures (Hard Bounces)

| Code | Description |
|------|-------------|
| 5.1.1 | Bad destination mailbox address (user unknown) |
| 5.1.2 | Bad destination system address (domain not found) |
| 5.2.1 | Mailbox disabled, not accepting messages |
| 5.2.2 | Mailbox full |
| 5.4.4 | Unable to route (no DNS records) |
| 5.7.1 | Delivery not authorized, message refused |

### 4.x.x - Temporary Failures (Soft Bounces)

| Code | Description |
|------|-------------|
| 4.2.1 | Mailbox temporarily unavailable |
| 4.2.2 | Mailbox full (temporary - might clear space) |
| 4.4.1 | Connection timed out |
| 4.7.1 | Delivery temporarily suspended (greylisting) |

### Common Bounce Messages

```
# Hard bounces
550 5.1.1 User unknown
550 5.1.2 Host or domain name not found
550 5.2.1 Mailbox disabled
550 5.2.2 Mailbox full
550 5.7.1 Message rejected due to content

# Soft bounces
450 4.2.1 Mailbox temporarily unavailable
452 4.2.2 Mailbox full
451 4.4.1 Connection timeout
450 4.7.1 Greylisting in effect
```

## ML-Powered Bounce Classification

Since v2.60.0, EmailEngine classifies the server's error text with a bundled machine learning model ([`@postalsys/bounce-classifier`](https://github.com/postalsys/bounce-classifier)), going beyond the hard/soft distinction. The classification runs in the main EmailEngine process, and the worker that found the bounce waits at most two minutes for it; if it fails or times out, the bounce is reported without the classifier fields.

### Classification Categories

The `response.category` field provides one of these classifications:

| Category | Description | Recommended Action |
|----------|-------------|-------------------|
| `user_unknown` | Recipient email address does not exist | Remove from mailing list |
| `invalid_address` | Bad email syntax or domain not found | Remove from mailing list |
| `mailbox_disabled` | Account suspended or disabled | Remove from mailing list |
| `mailbox_full` | Over quota, storage exceeded | Retry later |
| `greylisting` | Temporary rejection, retry later | Retry after delay |
| `rate_limited` | Too many connections or messages | Retry after delay |
| `server_error` | Timeout or connection failed | Retry later |
| `ip_blacklisted` | Sender IP on a blocklist (RBL) | Use different sending IP |
| `domain_blacklisted` | Sender domain on a blocklist | Fix DNS/authentication |
| `auth_failure` | DMARC, SPF, or DKIM failure | Fix email authentication |
| `relay_denied` | Relaying not permitted | Fix mail server config |
| `spam_blocked` | Message detected as spam | Review email content |
| `policy_blocked` | Local policy rejection | Review and contact admin |
| `virus_detected` | Infected content detected | Remove malicious content |
| `geo_blocked` | Geographic/country-based rejection | Use different sending IP |
| `unknown` | Unclassified bounce type | Review manually |

### Recommended Actions

The `response.recommendedAction` field tells you how to handle the bounce:

| Action | Description | When Used |
|--------|-------------|-----------|
| `remove` | Remove email from all mailing lists | Invalid addresses, disabled accounts |
| `retry` | Retry delivery after a delay | Temporary issues like greylisting, rate limits |
| `review` | Manual review required | Spam blocks, policy rejections |
| `fix_configuration` | Fix sender configuration | Authentication failures, relay issues |
| `retry_different_ip` | Retry from another IP address | IP blocklist issues |
| `remove_content` | Remove problematic content | Virus detection |

### Blocklist Detection

When a bounce indicates a blocklist issue, the `response.blocklist` object provides details:

```json
{
  "response": {
    "message": "550 Service unavailable; Client host [1.2.3.4] blocked using zen.spamhaus.org",
    "category": "ip_blacklisted",
    "recommendedAction": "retry_different_ip",
    "blocklist": {
      "name": "Spamhaus ZEN",
      "type": "ip"
    }
  }
}
```

The `blocklist.type` indicates whether the issue is with your IP address (`ip`), your domain (`domain`), or a URI mentioned in the message content (`uri`), and `blocklist.host` is `true` when the blocklist's own lookup hostname appeared in the error text rather than only its name. If the bounce message references multiple blocklists, the response contains a `lists` array instead, where each entry has `name` and `type` fields: `{"lists": [{"name": "...", "type": "..."}, ...], "host": true}`.

### Retry Timing

When bounce messages contain timing hints (e.g., "try again in 5 minutes"), the `response.retryAfter` field provides the suggested delay in seconds:

```json
{
  "response": {
    "message": "450 4.7.1 Greylisted, please try again in 300 seconds",
    "category": "greylisting",
    "recommendedAction": "retry",
    "retryAfter": 300
  }
}
```

### Acting on the Classification

Branch on `recommendedAction` rather than on `category`. The action set is small and stable, while categories are added as the classifier learns new bounce shapes, and an unrecognized category would otherwise fall through your logic silently.

<Tabs>
<TabItem value="nodejs" label="Node.js" default>

```javascript
async function recordBounce(recipient, response = {}) {
  const category = response.category || 'unknown';

  switch (response.recommendedAction || 'review') {
    case 'remove':
      // Permanent: the address will never accept mail
      await db.contacts.update({ email: recipient }, { status: 'bounced', category });
      break;

    case 'retry':
      // Temporary: greylisting, rate limits, a full mailbox
      await scheduleRetry(recipient, response.retryAfter || 3600);
      break;

    case 'retry_different_ip':
      // The sending IP is blocklisted, the address is fine
      await queueForAlternateIP(recipient, response.blocklist);
      break;

    case 'fix_configuration':
      // SPF/DKIM/DMARC or relay problem, no per-recipient action helps
      await alertAdmin(category, response.message);
      break;

    case 'remove_content':
      await quarantineCampaign(recipient, response.message);
      break;

    default:
      await flagForReview(recipient, category, response.message);
  }
}
```

</TabItem>
<TabItem value="python" label="Python">

```python
def record_bounce(recipient, response=None):
    response = response or {}
    category = response.get('category', 'unknown')
    action = response.get('recommendedAction', 'review')

    if action == 'remove':
        # Permanent: the address will never accept mail
        contacts.update(recipient, status='bounced', category=category)
    elif action == 'retry':
        # Temporary: greylisting, rate limits, a full mailbox
        schedule_retry(recipient, response.get('retryAfter', 3600))
    elif action == 'retry_different_ip':
        # The sending IP is blocklisted, the address is fine
        queue_for_alternate_ip(recipient, response.get('blocklist'))
    elif action == 'fix_configuration':
        # SPF/DKIM/DMARC or relay problem, no per-recipient action helps
        alert_admin(category, response.get('message'))
    elif action == 'remove_content':
        quarantine_campaign(recipient, response.get('message'))
    else:
        flag_for_review(recipient, category, response.get('message'))
```

</TabItem>
</Tabs>

:::caution Classification is advisory
`category` and `recommendedAction` come from a machine learning model reading the server's error text, and they are absent entirely if classification fails. Always default to a review path, and never delete a contact on a single `remove` without also checking `response.status` for a `5.x.x` code if the record matters.
:::

## See Also

- [messageBounce webhook](/docs/webhooks/messagebounce) - Full payload reference for the bounce event
- [messageDeliveryError](/docs/webhooks/messagedeliveryerror) and [messageFailed](/docs/webhooks/messagefailed) - Failures EmailEngine sees while submitting, before a message ever reaches the recipient's server
- [Suppression Lists](/docs/sending/deliverability/suppression-lists) - Stop sending to addresses that have already bounced
- [Email Authentication Testing](/docs/sending/deliverability/email-authentication-testing) - Diagnose the SPF, DKIM, and DMARC problems behind `fix_configuration` bounces
- [Webhook Overview](/docs/webhooks/overview) - Delivery, retries, and routing
