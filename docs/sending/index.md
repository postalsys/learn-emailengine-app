---
title: Sending Emails
sidebar_position: 1
description: Overview of EmailEngine's email sending capabilities including SMTP proxying, API submission, and mail merge
---

# Sending Emails

EmailEngine provides powerful email sending capabilities that shield you from the complexity of direct SMTP integration. Send emails through registered accounts' SMTP servers or external sending services with a unified REST API.

## Why Use EmailEngine for Sending

When your application needs to send email on behalf of users, direct SMTP integration is complex and brittle:

- **Provider diversity**: Every email provider has different authentication mechanisms, rate limits, and error codes
- **Credential management**: Securely handling user SMTP credentials is challenging
- **Retry logic**: Building robust retry mechanisms for transient failures
- **Queue management**: Handling message queues and delivery tracking
- **OAuth complexity**: Modern providers require OAuth2 authentication

EmailEngine abstracts all of this complexity behind a simple REST API.

## Key Capabilities

### Unified API
- Single REST endpoint (`/v1/account/:id/submit`) for all providers
- Consistent JSON request/response format
- Automatic credential management

### Reliable Delivery
- Built-in message queuing
- Automatic retry logic with exponential backoff
- Delivery status tracking via webhooks
- SMTP connection pooling

### Advanced Features
- Mail merge for bulk personalized emails
- Email templates with Handlebars
- Proper reply and forward threading
- Attachment handling
- Custom headers and MIME options

### Flexible Sending Methods

EmailEngine supports multiple sending approaches:

1. **Submit API** (Recommended)
   - POST to `/v1/account/:id/submit`
   - Queue-based with automatic retries
   - Webhook notifications for delivery status
   - Best for application integration

2. **SMTP Gateway**
   - Direct SMTP server provided by EmailEngine
   - Use standard SMTP clients/libraries
   - EmailEngine routes to the correct account
   - Best for legacy applications

## Sending vs API Comparison

| Feature | Submit API | SMTP Gateway |
|---------|-----------|--------------|
| Integration | REST API | SMTP protocol |
| Queuing | Automatic | Automatic |
| Webhooks | Yes | Yes |
| Retry logic | Configurable | Configurable |
| Best for | Modern apps | Legacy systems |
| Authentication | API token | Account credentials |

## Quick Examples

### Simple Email

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": {
      "name": "Recipient Name",
      "address": "recipient@example.com"
    },
    "subject": "Hello from EmailEngine",
    "text": "Plain text version",
    "html": "<p>HTML version</p>"
  }'
```

### Reply to Email

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": {
      "message": "AAAADQAABl0",
      "action": "reply"
    },
    "html": "<p>Your reply content</p>"
  }'
```

### Mail Merge

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Hello {{{params.name}}}",
    "html": "<p>Personal message for {{params.name}}</p>",
    "mailMerge": [
      {
        "to": {"address": "alice@example.com"},
        "params": {"name": "Alice"}
      },
      {
        "to": {"address": "bob@example.com"},
        "params": {"name": "Bob"}
      }
    ]
  }'
```

## Understanding the Send Process

When you submit an email through EmailEngine:

1. **Validation**: EmailEngine validates your request payload
2. **Queuing**: Message is added to the outbox queue with a unique queue ID
3. **Processing**: Message is picked up from the queue for delivery
4. **SMTP Transfer**: EmailEngine connects to the account's SMTP server
5. **Notification**: Webhooks notify you of delivery status
6. **Storage**: Copy saved to Sent Mail folder (optional)

## Delivery Status Tracking

EmailEngine sends webhook notifications for every stage:

- **Queued**: Message accepted and queued (`response` in submit API)
- **Sending**: Message being transmitted (no webhook)
- **Sent**: Delivered to SMTP server (`messageSent` webhook)
- **Retry**: Temporary failure, will retry (`messageDeliveryError` webhook)
- **Failed**: Permanent failure after retries (`messageFailed` webhook)

## Common Use Cases

### Transactional Emails
Send receipts, confirmations, and notifications from user mailboxes:
- Order confirmations
- Password reset emails
- Account notifications

### Support Communication
Handle customer support emails:
- Reply to support tickets
- Forward emails to team members
- Maintain conversation threads

### Marketing & Outreach
Personalized bulk sending:
- Mail merge campaigns
- Newsletter distribution
- Follow-up sequences

### Automated Workflows
Integrate email into your application logic:
- Trigger emails from events
- Send scheduled reminders
- Process email templates

## Getting Started

1. **[Basic Sending](./basic-sending.md)** - Learn the fundamentals of sending emails
2. **[Replies & Forwards](./replies-forwards.md)** - Properly reply to and forward emails
3. **[Mail Merge](./mail-merge.md)** - Send bulk personalized emails
4. **[Threading](./threading.md)** - Maintain conversation threads
5. **[Templates](./templates.md)** - Use email templates
6. **[Outbox Queue](./outbox-queue.md)** - Understanding the queue system
7. **[SMTP Gateway](./smtp-gateway.md)** - Alternative SMTP integration

## Best Practices

### Delivery Optimization
- Enable webhook notifications to track delivery
- Set appropriate retry limits
- Monitor the outbox queue
- Handle delivery errors gracefully

### Content Quality
- Always provide both HTML and plain text versions
- Test templates before bulk sending
- Validate recipient addresses
- Use proper subject lines

### Rate Limiting
- Respect provider rate limits
- Use mail merge for bulk sending
- Stagger large send jobs
- Monitor delivery errors

### Security
- Use API tokens, not account credentials
- Validate user permissions before sending
- Sanitize template variables
- Store sensitive data encrypted

## Troubleshooting

Common sending issues and solutions:

| Issue | Cause | Solution |
|-------|-------|----------|
| Account not connected | IMAP sync in progress | Wait for state to become "connected" |
| Authentication failed | Invalid SMTP credentials | Verify account credentials |
| Rate limit exceeded | Too many messages | Implement throttling |
| Message too large | Attachment size limit | Reduce attachment size |
| Spam rejection | Content flagged | Review message content |

For detailed troubleshooting, see [Accounts Troubleshooting](../accounts/troubleshooting.md).

## See Also

- [API Reference: Message Submission](https://api.emailengine.app/#operation/postV1AccountAccountSubmit)
- [Webhook Events](../reference/webhook-events.md)
- [Account Management](../accounts/managing-accounts.md)
- [Performance Tuning](../advanced/performance-tuning.md)
