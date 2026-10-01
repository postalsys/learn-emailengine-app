---
title: Basic Email Sending
sidebar_position: 2
description: Learn how to send emails using EmailEngine's submit API with HTML, attachments, and custom headers
---

# Basic Email Sending

EmailEngine sends email through a registered account's own SMTP server, or through the Gmail and MS Graph APIs for accounts registered that way. This guide covers the fundamentals of sending with the [submit API](/docs/api/post-v-1-account-account-submit).

## Why It Matters

When your application sends on behalf of a customer, talking SMTP directly means handling each provider's authentication, rate limits, retry rules, and error codes. EmailEngine puts one REST endpoint in front of the customer's mailbox instead, with the same JSON response shape whichever provider is behind it, and a queue that retries failed submissions.

## Step-by-Step Guide

### 1. Register the Account

Before sending, register an email account in EmailEngine using the [account registration API](/docs/api/post-v-1-account).

**Endpoint:** `POST /v1/account`

```bash
curl -XPOST "https://emailengine.example.com/v1/account" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "example",
    "name": "Andris Reinman",
    "email": "andris@example.com",
    "imap": {
      "auth": { "user": "andris", "pass": "secretpass" },
      "host": "mail.example.com",
      "port": 993,
      "secure": true
    },
    "smtp": {
      "auth": { "user": "andris", "pass": "secretpass" },
      "host": "mail.example.com",
      "port": 465,
      "secure": true
    }
  }'
```

**Expected response:**

```json
{
  "account": "example",
  "state": "new"
}
```

**Important**: If you use an SMTP port other than 465, set `"secure": false`.

### 2. Wait for Connection

Before sending, ensure the account is connected. Poll the account status:

```bash
curl "https://emailengine.example.com/v1/account/example" \
  -H "Authorization: Bearer <your-token>"
```

Wait until `state` becomes `"connected"`. A submission is handled by the worker that holds the account, and an account is assigned to a worker shortly after registration; until then the API answers `503` with `No active handler for requested account. Try again later.` Replies and forwards also need the mailbox to be reachable, because the referenced message is read from it.

### 3. Submit a Simple Email

**Endpoint:** `POST /v1/account/:id/submit`

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {
        "name": "Recipient Name",
        "address": "recipient@example.com"
      }
    ],
    "subject": "Test message",
    "text": "Hello from myself!",
    "html": "<p>Hello from myself!</p>"
  }'
```

**Expected response (queued, not yet delivered):**

```json
{
  "response": "Queued for delivery",
  "messageId": "<99f7f0ec-90a1-caaf-698b-18e096c7679e@example.com>",
  "sendAt": "2025-05-14T10:22:31.312Z",
  "queueId": "4646ac53857fd2b2"
}
```

The message is now queued for delivery. EmailEngine will handle the actual SMTP transmission.

## Message Components

### Recipients

You can specify multiple recipients in `to`, `cc`, and `bcc` fields:

```json
{
  "to": [
    { "name": "Alice", "address": "alice@example.com" },
    { "name": "Bob", "address": "bob@example.com" }
  ],
  "cc": [{ "address": "manager@example.com" }],
  "bcc": [{ "address": "archive@example.com" }]
}
```

The `name` field is optional but recommended for a better recipient experience.

### Content

#### Plain Text and HTML

A message can carry both a plain-text and an HTML body:

```json
{
  "subject": "Welcome to our service",
  "text": "Welcome! Visit https://example.com to get started.",
  "html": "<p>Welcome!</p><p>Visit <a href='https://example.com'>our site</a> to get started.</p>"
}
```

#### HTML Only

An `html` body with no `text` still goes out as a `multipart/alternative` message: EmailEngine generates the plain-text part from the HTML, rendering each link as its text followed by the URL in square brackets. Supply `text` yourself when the generated wording is not what text-only clients should see:

```json
{
  "subject": "HTML Newsletter",
  "html": "<h1>Hello!</h1><p>This is an HTML email.</p>"
}
```

A [raw message](#raw-messages) is sent as given, with no generated part.

#### Preview Text

`previewText` is the short line mail clients show after the subject in the inbox list. EmailEngine inserts it into the HTML body as a hidden block, so it has an effect only when the message has `html`:

```json
{
  "subject": "Your order has shipped",
  "html": "<p>Order 4815 is on its way.</p>",
  "previewText": "Arriving Thursday"
}
```

### Attachments

Add attachments using the `attachments` array:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Document attached",
  "text": "Please find the document attached.",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "JVBERi0xLjQKJSBtaW5pbWFsIGV4YW1wbGUK",
      "contentType": "application/pdf"
    }
  ]
}
```

**Attachment options:**

- `filename` - Attachment filename (optional, recommended)
- `content` - Base64 encoded content (required, unless `reference` is set, in which case it must be left out)
- `contentType` - MIME type (optional, derived from `filename` when omitted)
- `contentDisposition` - `attachment` (the default) or `inline`
- `cid` - Content ID for inline images (optional)
- `encoding` - Encoding of `content`. Only `base64` is accepted, and it is the default
- `reference` - The ID of an attachment on a stored message, taken from that message's attachment list, to attach it without downloading and re-uploading it (optional)

A message can carry up to 500 attachments. Each `content` value, like `text`, `html`, and `raw`, is limited to `EENGINE_MAX_SIZE` (5 MB by default), and the whole request body to `EENGINE_MAX_BODY_SIZE` (50 MB by default); both are described under [environment variables](/docs/configuration/environment-variables#email-protocol-settings).

#### Inline Images

Reference inline images in HTML using Content ID:

```json
{
  "html": "<p>Logo: <img src='cid:logo' /></p>",
  "attachments": [
    {
      "filename": "logo.gif",
      "content": "R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=",
      "contentType": "image/gif",
      "cid": "logo"
    }
  ]
}
```

An `<img>` in `html` whose `src` is a `data:` URI is converted the same way: the image becomes an attachment named `image-1.png` (numbered, with the extension derived from the MIME type) with a generated Content-ID, and the `src` is rewritten to reference it. This applies to the `html` of the call, not to the HTML of a stored template.

### Custom Headers

Add custom email headers:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Test",
  "text": "Test message",
  "headers": {
    "X-Custom-Header": "value",
    "X-Campaign-ID": "campaign-123",
    "List-Unsubscribe": "<mailto:unsubscribe@example.com>"
  }
}
```

Common custom headers:

- `X-Custom-*` - Your custom headers
- `List-Unsubscribe` - Unsubscribe link for bulk email
- `X-Priority` - Set message priority (1-5)

Reply-To has a field of its own, `replyTo`, described below. Use that rather than a header.

### Sender Information

Override default sender information:

```json
{
  "from": {
    "name": "Support Team",
    "address": "support@example.com"
  },
  "replyTo": {
    "name": "No Reply",
    "address": "noreply@example.com"
  },
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Support Ticket Response",
  "text": "Your ticket has been updated."
}
```

If `from` is omitted, EmailEngine uses the account's configured email and name. `replyTo` accepts a single address object or a list of them.

### Raw Messages

`raw` carries a complete RFC 822 message, base64-encoded, for a message built elsewhere that has to go out as it is. It cannot be combined with `text`, `html`, or `attachments`:

```json
{
  "raw": "TUlNRS1WZXJzaW9uOiAxLjANClN1YmplY3Q6IGhlbGxvIHdvcmxkDQoNCkhlbGxvIQ0K"
}
```

Fields sent alongside it are applied to the headers inside the message: `subject`, `from`, `to`, `cc`, `bcc`, and `messageId` replace the matching header, and `headers` adds to them. `envelope` sets the SMTP envelope; without it the envelope is derived from the `From`, `To`, `Cc`, and `Bcc` headers. `Message-ID`, `Date`, and `MIME-Version` are added when missing, and a `Bcc` header is removed before delivery. The `X-EE-*` control headers that the [SMTP server](./smtp-interface.md#emailengine-options-as-headers) reads are read from a raw message too, and removed from it.

## Advanced Options

### Scheduled Sending

Schedule an email for future delivery:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Scheduled message",
  "text": "This will be sent at the specified time",
  "sendAt": "2025-12-25T09:00:00.000Z"
}
```

The message stays in the queue until the specified time, and the response's `sendAt` echoes it. The `Date` header of the message is set to that time as well. A `sendAt` in the past sends immediately.

### Skip Sent Folder

Prevent saving a copy to the Sent Mail folder:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "No copy saved",
  "text": "This won't appear in Sent Mail",
  "copy": false
}
```

Leave `copy` unset to follow the account's default, which is to upload a copy after an SMTP delivery, except on Gmail and Microsoft accounts, whose servers file SMTP-sent mail into Sent Mail themselves. A delegated Microsoft 365 account is an exception to the exception: its mail is sent through the owning account, so a copy is uploaded for it. `copy: true` forces the upload even on a Gmail or Microsoft account, and `copy: false` suppresses it. A delivery through a [gateway](#smtp-gateway) is uploaded by default whatever the account type, because the provider never sees it. Deliveries through the Gmail API or MS Graph never upload, as the provider files the message, and `copy` is ignored there. No copy is stored for an account whose IMAP connection is disabled or that has neither an IMAP nor an OAuth2 configuration, nor when the account has no folder flagged `\Sent`; since v2.81.2 that last case is reported with a warning in the log. `sentMailPath` names a different folder for the copy.

### Custom Message ID

Specify your own Message-ID for threading:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Custom ID",
  "text": "Message with custom ID",
  "messageId": "<custom-id-12345@example.com>"
}
```

Important for maintaining email threads (see [Threading](/docs/sending/threading)).

### Delivery Status Notifications

Request delivery status notifications (DSN):

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "With DSN",
  "text": "Request delivery notification",
  "dsn": {
    "return": "headers",
    "notify": ["success", "failure", "delay"]
  }
}
```

`return` is required and is either `headers` or `full`; `notify` takes any of `never`, `success`, `failure`, and `delay`; `id` sets the envelope identifier (ENVID) and `recipient` the address the notification goes to (ORCPT). DSN support varies by email provider.

### Email Tracking

Enable open and click tracking for your emails:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Tracked Email",
  "html": "<p>Check out <a href='https://example.com'>our website</a>!</p>",
  "trackOpens": true,
  "trackClicks": true
}
```

When enabled, EmailEngine will:

- Insert a tracking pixel to detect email opens (`trackOpens`)
- Rewrite links to track clicks (`trackClicks`)
- Send `trackOpen` and `trackClick` webhook events when detected

When a message leaves both fields out, the instance settings apply (`trackOpens` and `trackClicks`, falling back to `trackSentMessages`). The pixel and the rewritten links point at the instance's `serviceUrl`, so tracking is only added when that setting, or `baseUrl` below, is set. Separate `trackOpens` and `trackClicks` fields were added in v2.46.1.

**Optional:** Override the base URL for tracking links:

```json
{
  "trackOpens": true,
  "trackClicks": true,
  "baseUrl": "https://yourdomain.com"
}
```

The [trackOpen](/docs/webhooks/trackopen) and [trackClick](/docs/webhooks/trackclick) pages describe the events and their payloads.

### Preview Mode (Dry Run)

Generate email preview without actually sending:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Test Email",
  "html": "<p>Preview this email</p>",
  "dryRun": true
}
```

**Response:**

```json
{
  "response": "Dry run",
  "messageId": "<generated-message-id@example.com>",
  "preview": "TUlNRS1WZXJzaW9uOiAxLjANClN1YmplY3Q6IGhlbGxvIHdvcmxkDQoNCkhlbGxvIQ0K"
}
```

The `preview` field contains the complete RFC822 formatted email (base64 encoded). Decode it to see what would be sent, minus the tracking pixel and rewritten links, which are not added on a dry run. Nothing is queued. A dry run of a mail merge returns no preview.

### Network Configuration

#### Proxy Routing

Route SMTP connection through a proxy server:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Via Proxy",
  "text": "Sent through proxy",
  "proxy": "http://proxy.company.com:8080"
}
```

Accepted URL schemes are `http`, `https`, `socks`, `socks4`, `socks4a`, and `socks5`. Without it, the instance-wide proxy setting applies, if one is configured.

#### Local Address Binding

Bind to a specific local IP address:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "From Specific IP",
  "text": "Sent from specific interface",
  "localAddress": "192.168.1.100"
}
```

Useful for multi-interface systems or IP-based routing.

`proxy` decides where a connection carrying the account's credentials goes, so a token with a restricted permission set cannot set it; the request is refused with 403.

### Delivery Control

#### Custom Retry Attempts

Override the default retry count for this message:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "High Priority",
  "text": "Will retry up to 15 times",
  "deliveryAttempts": 15
}
```

The value can be 0 to 100; 0 and 1 both mean a single attempt. The default is 10, set instance-wide as **Delivery attempts** under **Configuration** > **Email Processing** (the `deliveryAttempts` key in the [Settings API](/docs/api/post-v-1-settings)). A higher value keeps a message retrying for longer rather than making it more likely to arrive, so raise it only where a late delivery still has value.

#### SMTP Gateway

Route through a specific SMTP gateway:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "subject": "Via Gateway",
  "text": "Sent through custom gateway",
  "gateway": "gateway-id-123"
}
```

A gateway is a named SMTP relay registered with EmailEngine, such as a transactional sending service. The message is delivered through the relay instead of the account's own SMTP server or provider API, and still belongs to the account. [SMTP Gateways](/docs/sending/smtp-gateways) covers the gateway record, the API that manages it, and what changes for a message routed through one.

#### SMTP Envelope

Specify SMTP envelope separately from message headers:

```json
{
  "to": [{ "address": "recipient@example.com" }],
  "from": { "address": "noreply@example.com" },
  "subject": "Envelope Example",
  "text": "Header From and SMTP MAIL FROM can differ",
  "envelope": {
    "from": "bounce@example.com",
    "to": ["actualrecipient@example.com"]
  }
}
```

Useful for bounce handling and advanced email routing.

### Idempotency

Prevent duplicate message submission with idempotency keys:

**Request:**

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-12345" \
  -d '{
    "to": [{ "address": "recipient@example.com" }],
    "subject": "Important",
    "text": "This will only send once even if request is retried"
  }'
```

If the same request is sent multiple times with the same `Idempotency-Key` header, EmailEngine will:

- Process it only once
- Return the same response for duplicate requests
- Prevent accidental double-sends

The response carries an `idempotency` object saying which happened: `{"key": "unique-key-12345", "status": "MISS"}` for the request that was processed, `"status": "HIT"` for a replay. The key is scoped to the account and can be any string of up to 1024 characters; use UUIDs or request-specific identifiers. Supported since v2.52.0.

## Sending Stored Drafts

Send a draft that already exists in the mailbox by referencing its message ID:

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/message/AAAAAQAACnA/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

The referenced message must be a draft: stored in the Drafts folder or flagged as `\Draft` for IMAP accounts, carrying the `DRAFT` label on Gmail, or a draft message on MS Graph. Drafts can come from the user's mail client, or be created through the [message upload API](/docs/api/post-v-1-account-account-message) by uploading to the Drafts folder with the `\Draft` flag.

The submission is queued like any other email, so scheduled sending, retry handling, gateways, idempotency keys, and the delivery webhooks described below all behave the same as with `/submit`. The response contains the familiar `queueId` and `messageId` values.

What happens to the draft after sending depends on the account type:

- **Gmail and MS Graph accounts** use the provider's native draft-send call. The provider files the message into the Sent Mail folder and removes the draft.
- **IMAP accounts** download the draft and deliver it over SMTP. A copy is stored in the Sent Mail folder (unless disabled with `copy: false` or the mail server stores sent messages itself, as Gmail and Outlook do for SMTP submissions), and the draft is then deleted. If no sent copy exists anywhere, the draft is moved to Trash instead so its content is not lost.

The request body is optional and accepts the delivery options described above - `envelope`, `copy`, `sentMailPath`, `sendAt`, `deliveryAttempts`, `gateway`, `dsn`, `proxy`, and `localAddress`. Content fields are not accepted; the draft is sent as stored, apart from the `X-EE-*` control headers of the [SMTP server](./smtp-interface.md#emailengine-options-as-headers), which are read from the draft and removed. A draft with no recipients is refused with 400 (`DraftHasNoRecipients`). See the [draft submission API reference](/docs/api/post-v-1-account-account-message-message-submit) for the full schema. Draft submission was added in v2.76.0.

## Webhook Notifications

EmailEngine sends webhook notifications for delivery status updates. Configure the webhook URL under **Configuration > Webhooks** and include the events below in the enabled event list (see the [webhooks overview](/docs/webhooks/overview)).

### messageSent

Delivered to the outbound MTA (SMTP server accepted the message):

```json
{
  "account": "example",
  "date": "2025-05-14T10:32:39.499Z",
  "event": "messageSent",
  "data": {
    "messageId": "<a00576bd-f757-10c7-26b8-885d7bbd9e83@example.com>",
    "response": "250 2.0.0 Ok: queued as 5755482356",
    "envelope": {
      "from": "andris@example.com",
      "to": ["recipient@example.com"]
    }
  }
}
```

### messageDeliveryError

Emitted **after every failed delivery attempt**. EmailEngine retries automatically until delivery succeeds or the maximum number of attempts is reached:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "account": "example",
  "date": "2025-05-14T15:07:35.832Z",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "1833c8a88a86109a1bf",
    "envelope": {
      "from": "andris@example.com",
      "to": ["recipient@example.com"]
    },
    "messageId": "<29e26263-7125-ff56-4f80-83a5cf737d5e@example.com>",
    "error": "400 Message Not Accepted",
    "errorCode": "EPROTOCOL",
    "smtpResponseCode": 400,
    "job": {
      "attemptsMade": 1,
      "attempts": 10,
      "nextAttempt": "2025-05-14T15:07:45.465Z"
    }
  }
}
```

### messageFailed

Raised once EmailEngine gives up retrying (max attempts reached):

```json
{
  "account": "example",
  "date": "2025-05-14T11:58:50.181Z",
  "event": "messageFailed",
  "data": {
    "messageId": "<97ac5d9a-93c7-104b-8d26-6b25f8d644ec@example.com>",
    "queueId": "610c2c93e608bd37",
    "error": "Error: Invalid login: 535 5.7.8 Error: authentication failed: "
  }
}
```

### Bounce Handling

A `messageSent` event means the account's email server (e.g., Gmail, Outlook) accepted the email for delivery. However, when that server's MTA attempts to deliver the email to the recipient's mail server (MX), the recipient MX may reject it (e.g., mailbox full, user doesn't exist, domain not found).

When this happens, the sender's MTA generates a bounce response email and sends it back to the sender's inbox. This is an informational email that explains why delivery failed. EmailEngine monitors the inbox, detects these bounce emails, parses them to extract the bounced recipient and error details, and triggers a `messageBounce` webhook event if it can identify which original message bounced.

See:

- [Bounce Detection](/docs/sending/deliverability/bounces) - How EmailEngine detects and processes bounces
- [messageBounce Webhook](/docs/webhooks/messagebounce) - Webhook payload and handling

## Testing Sent Emails

### Using Ethereal Email

For testing, use [Ethereal Email](https://ethereal.email/) to create temporary test accounts:

```bash
# Send to your Ethereal test address
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{ "address": "test@ethereal.email" }],
    "subject": "Test Email",
    "text": "Testing EmailEngine sending"
  }'
```

### Check Sent Folder

Verify the email was saved to the Sent folder:

```bash
curl "https://emailengine.example.com/v1/account/example/messages?path=Sent" \
  -H "Authorization: Bearer <token>"
```

### Monitor Queue

Check the outbox queue status. The outbox is a single global queue (it is not scoped per account):

```bash
curl "https://emailengine.example.com/v1/outbox" \
  -H "Authorization: Bearer <token>"
```

## Common Pitfalls

### Authentication Issues

**Problem**: Gmail, Outlook, and Yahoo may refuse SMTP logins that look like bots.

**Solution**:

- **Gmail**: Use OAuth2 or app-specific passwords (account passwords no longer work)
- **Outlook**: Use OAuth2 (password authentication completely disabled)
- **Yahoo**: Use OAuth2 or app-specific passwords

See [Gmail Setup](../accounts/gmail/gmail-imap.md) and [Outlook Setup](../accounts/microsoft-365/outlook-365.md).

### Timeout Errors

**Problem**: Heroku dynos cut idle sockets.

**Solution**:

- Move off Heroku or increase dyno size
- Use a different deployment platform

### Account Not Connected

**Problem**: Submission rejected with `503` and `No active handler for requested account. Try again later.`

**Solution**: The account has not been assigned to a worker yet, which happens shortly after registration and after a restart. Poll `/v1/account/:id` until `state` becomes `"connected"`, then retry.

### Rate Limiting

**Problem**: Too many emails sent too quickly.

**Solution**:

- Implement throttling in your application
- Use mail merge for bulk sending
- Spread sends over time
- Check provider rate limits

### Large Attachments

**Problem**: Email rejected due to size limits.

**Solution**:

- Reduce attachment size
- Use external file hosting with links
- Compress attachments
- Check provider size limits (typically 25-50MB)

### Spam Filters

**Problem**: Emails flagged as spam.

**Solution**:

- Check the generated plain-text part, or supply `text` yourself
- Avoid spam trigger words
- Include unsubscribe links for bulk email
- Authenticate domain with SPF/DKIM
- Warm up new accounts gradually

## Performance Considerations

### Optimize for Bulk Sending

For sending multiple emails:

- Use [Mail Merge](./mail-merge.md) instead of individual calls
- Enable `copy: false` to skip Sent folder storage
- Implement rate limiting
- Monitor the outbox queue

### Connection Pooling

EmailEngine keeps one pooled SMTP connection per distinct connection configuration (server, credentials, proxy, local address, and TLS options), sends up to 100 messages over it, and closes it after 10 minutes without a send. Messages for the same configuration go out one at a time over that connection, and each delivery attempt has a 2 minute socket timeout. Nothing needs configuring for this; the knobs for parallel delivery across accounts are the submit worker settings under [performance tuning](/docs/advanced/performance-tuning).

### Webhook Processing

Handle webhooks asynchronously:

- Return 200 OK quickly from webhook endpoint
- Process delivery status in background jobs
- Implement webhook retry logic

## See Also

- [Replies and forwards](/docs/sending/replies-forwards) - Answering a stored message rather than composing one
- [Templates](/docs/sending/templates) - Reusing a subject and body across sends
- [Outbox queue](/docs/sending/outbox-queue) - Watching, retrying, and cancelling a queued message
- [Sending API](/docs/api-reference/sending-api) - The endpoint reference for every field on this page
- [messageSent](/docs/webhooks/messagesent) - The event that confirms the handoff to the server
