---
title: Email API - REST API for Email Integration
description: Add email functionality to your app with EmailEngine's REST API. Send emails, receive webhooks, manage mailboxes. Self-hosted with flat pricing.
sidebar_position: 1
slug: /email-api
keywords:
  - email API
  - REST API for email
  - email integration API
  - send email API
  - receive email API
  - email webhook API
  - email API for developers
---

# Email API for Application Integration

EmailEngine provides a comprehensive **REST API for email integration**. Add email sending, receiving, and management to any application without dealing with IMAP/SMTP protocol complexity.

## Email API Features

### Send Emails via API

Send emails through any provider with a single REST endpoint. EmailEngine handles SMTP connections, OAuth2 authentication, retries, and delivery tracking automatically.

```javascript
// Send an email with one API call
POST /v1/account/{account}/submit
{
  "to": [{"address": "user@example.com", "name": "John Doe"}],
  "subject": "Hello from EmailEngine",
  "html": "<p>Your message content</p>",
  "attachments": [
    {
      "filename": "report.pdf",
      "content": "base64-encoded-content"
    }
  ]
}
```

### Receive Emails in Real-Time

Get instant webhook notifications when emails arrive. No polling required - EmailEngine maintains persistent connections to mailboxes and pushes events to your application.

```javascript
// Webhook payload for new email
{
  "event": "messageNew",
  "data": {
    "id": "AAAAAQAACnA",
    "subject": "Re: Your inquiry",
    "from": {"address": "client@example.com", "name": "Jane Smith"},
    "to": [{"address": "support@yourapp.com"}],
    "text": {"plain": "Thanks for your quick response..."}
  }
}
```

### Manage Email Accounts

Register and manage multiple email accounts through the API. Support for Gmail, Microsoft 365, and any IMAP/SMTP provider with automatic reconnection and error recovery.

```javascript
// Register an email account
POST /v1/account
{
  "account": "support-inbox",
  "email": "support@yourcompany.com",
  "imap": {
    "host": "imap.yourprovider.com",
    "port": 993,
    "auth": {
      "user": "support@yourcompany.com",
      "pass": "app-password"
    }
  },
  "smtp": {
    "host": "smtp.yourprovider.com",
    "port": 465,
    "auth": {
      "user": "support@yourcompany.com",
      "pass": "app-password"
    }
  }
}
```

### Search and Organize

Search messages, manage folders, update flags, and download attachments - all through simple REST API calls.

```javascript
// Search for emails
GET /v1/account/{account}/search?search[subject]=invoice&search[from]=billing@

// List messages in a folder
GET /v1/account/{account}/messages?path=INBOX&page=0&pageSize=20

// Download attachment
GET /v1/account/{account}/attachment/{attachment}
```

## Why Choose EmailEngine's Email API?

| Feature | EmailEngine | Per-Mailbox APIs (Nylas, etc.) |
|---------|-------------|-------------------------------|
| **Pricing** | Flat annual | Per mailbox/month |
| **Data Location** | Your servers | Third-party cloud |
| **Webhooks** | Real-time | Real-time |
| **Account Limits** | Unlimited | Based on plan |
| **Setup** | Self-hosted | Managed service |

### Cost Comparison

With per-mailbox pricing (like Nylas at $1.50/mailbox/month):
- 100 mailboxes = $150/month = $1,800/year
- 500 mailboxes = $750/month = $9,000/year
- 1000 mailboxes = $1,500/month = $18,000/year

With EmailEngine's flat pricing, you pay one annual fee regardless of mailbox count.

[Compare EmailEngine vs Nylas →](/docs/comparison/emailengine-vs-nylas)

## Supported Email Providers

EmailEngine works with any email service:

- **Gmail & Google Workspace** - OAuth2 or Gmail API
- **Microsoft 365 & Outlook.com** - OAuth2 or Microsoft Graph API
- **Yahoo Mail** - IMAP/SMTP with OAuth2
- **FastMail** - IMAP/SMTP
- **ProtonMail** - Via ProtonMail Bridge
- **Any IMAP/SMTP server** - Standard protocol support

## API Capabilities

### Core Operations
- **Send emails** - Single emails, bulk sending, mail merge
- **Receive emails** - Real-time webhooks, message listing
- **Search** - Full-text and header-based search
- **Attachments** - Upload, download, inline images
- **Threading** - Conversation tracking (Gmail, Microsoft 365, Yahoo)

### Account Management
- **OAuth2 flows** - Built-in authorization for Gmail and Microsoft
- **Connection handling** - Automatic reconnection and error recovery
- **Multi-account** - Manage thousands of accounts per instance

### Advanced Features
- **Bounce detection** - Automatic bounce and complaint handling
- **Delivery tracking** - Open and click tracking
- **Templates** - Mail merge with variable substitution
- **Scheduling** - Delayed sending

## Get Started

### 1. Install EmailEngine

```bash
# Docker (quickest)
docker run -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379/8" \
  postalsys/emailengine:v2

# Or download binary
wget https://go.emailengine.app/emailengine.tar.gz
tar xzf emailengine.tar.gz
./emailengine
```

[Full installation guide →](/docs/installation)

### 2. Register an Email Account

```bash
curl -X POST http://localhost:3000/v1/account \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-account",
    "email": "user@gmail.com",
    "oauth2": {
      "provider": "gmail",
      "auth": {"user": "user@gmail.com"}
    }
  }'
```

[Account setup guide →](/docs/accounts/managing-accounts)

### 3. Send Your First Email

```bash
curl -X POST http://localhost:3000/v1/account/my-account/submit \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"address": "recipient@example.com"}],
    "subject": "Hello from EmailEngine",
    "text": "This is my first email via the API!"
  }'
```

[Sending guide →](/docs/sending/transactional-service)

### 4. Set Up Webhooks

Configure webhooks to receive real-time notifications:

```bash
curl -X POST http://localhost:3000/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/email",
    "events": ["messageNew", "messageSent", "messageDeliveryError"]
  }'
```

[Webhooks guide →](/docs/webhooks/overview)

## Email API Documentation

- [API Reference](/docs/api-reference) - Complete endpoint documentation
- [Sending API](/docs/api-reference/sending-api) - Email submission endpoints
- [Messages API](/docs/api-reference/messages-api) - Read and manage emails
- [Accounts API](/docs/api-reference/accounts-api) - Account management
- [Webhooks Reference](/docs/api-reference/webhooks-api) - Event notifications

## Use Cases

### CRM Email Integration
Integrate customer email communications directly into your CRM. Track conversations, send follow-ups, and manage relationships.
[CRM integration guide →](/docs/integrations/crm)

### Transactional Email
Send receipts, notifications, and automated emails from user accounts rather than a shared sending domain.
[Transactional email guide →](/docs/sending/transactional-service)

### Customer Support
Build email into your help desk. Manage support inboxes, track threads, and send templated responses.
[Support integration examples →](/docs/integrations/crm)

### AI Email Processing
Connect email to AI systems for summarization, classification, and automated responses.
[AI integration guide →](/docs/integrations/ai-chatgpt)

## Try EmailEngine Free

Start with a 14-day free trial - full functionality, no credit card required.

[Start Free Trial](https://postalsys.com/plans) | [View Pricing](https://postalsys.com/plans) | [GitHub](https://github.com/postalsys/emailengine)
