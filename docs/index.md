---
title: EmailEngine Documentation
sidebar_position: 0
description: Self-hosted email gateway with a unified REST API for IMAP, SMTP, Gmail API, and Microsoft Graph API
slug: /
---

# Welcome to EmailEngine

**EmailEngine** is a self-hosted email gateway that provides a unified REST API for accessing email accounts through IMAP, SMTP, Gmail API, and Microsoft Graph API. Build email functionality into your application without dealing with the complexity of different email protocols and providers.

## What Can You Do With EmailEngine?

### Send Emails

Send emails through any email provider with a single API endpoint. EmailEngine handles SMTP connections, OAuth2 authentication, retries, and delivery tracking.

```javascript
// Send an email with one API call
POST /v1/account/{account}/submit
{
  "to": [{"address": "user@example.com"}],
  "subject": "Hello from EmailEngine",
  "html": "<p>Your message here</p>"
}
```

### Receive Emails in Real-Time

Get instant webhook notifications when new emails arrive, no polling required.

```javascript
// Webhook payload for new email
{
  "event": "messageNew",
  "data": {
    "id": "AAAAAQAACnA",
    "subject": "Re: Meeting tomorrow",
    "from": {"address": "client@example.com"},
    "text": "Thanks for scheduling..."
  }
}
```

### Manage Email Accounts

Register and manage multiple email accounts with automatic connection handling.

```javascript
// Register an email account
POST /v1/account
{
  "account": "user123",
  "email": "user@gmail.com",
  "oauth2": {
    "provider": "gmailOauth",  // Your OAuth2 app ID from EmailEngine
    "accessToken": "ya29.a0..."
  }
}
```

### Search and Organize

Search messages, organize mailboxes, manage flags, and download attachments.

## Why EmailEngine?

### One API for All Providers

- **IMAP/SMTP** - Works with any email provider
- **Gmail API** - Native Gmail integration with Cloud Pub/Sub
- **Microsoft Graph API** - Native Microsoft 365 and Outlook integration
- **Consistent interface** across all provider types

### Built for SaaS Applications

- **Multi-account** - Manage thousands of email accounts
- **OAuth2 support** - Built-in OAuth2 for Gmail, Google Workspace, Microsoft 365
- **Webhooks** - Real-time notifications for all email events
- **Queue management** - Automatic retries and delivery tracking

### Production-Ready

- **Self-hosted** - Full control over your data and privacy
- **Scalable** - Vertical scaling with performance tuning
- **Reliable** - Automatic reconnection and error recovery
- **Performant** - Efficient connection pooling and caching

## Quick Start

Get your first email working in 10 minutes:

1. **[Install EmailEngine](/docs/installation)** - Set up with Docker, npm, or on platforms like Render.com
2. **[Add Your First Account](/docs/getting-started/quick-start)** - Register an email account via API
3. **[Send an Email](/docs/sending/basic-sending)** - Submit your first message
4. **[Receive Webhooks](/docs/receiving/webhooks)** - Get notified of new emails

## Common Use Cases

### Email-Integrated SaaS

Build email functionality into your SaaS application:

- Send transactional emails from user accounts
- Receive and process incoming emails
- Integrate customer email into your CRM
- [Read the CRM integration guide →](/docs/integrations/crm)

### Email Automation

Automate email workflows:

- Auto-respond to incoming emails
- Forward emails based on rules
- Track email threads and replies
- [Learn about email threading →](/docs/sending/threading)

### Customer Support

Integrate email into your support system:

- Manage multiple support email accounts
- Track email conversations
- Send templated responses
- [Explore mail merge →](/docs/sending/mail-merge)

### Email Analytics

Analyze email communications:

- Track email delivery and opens
- Generate AI-powered email summaries
- Monitor email activity across accounts
- [See AI integration →](/docs/integrations/ai-chatgpt)

## Architecture Overview

EmailEngine works as a middleware between your application and email providers:

![EmailEngine Architecture](/img/diagrams/architecture.svg)

**How it works:**

1. **Your Application** - Makes REST API calls to EmailEngine and receives webhook notifications
2. **EmailEngine** - Maintains persistent connections to email providers and manages data synchronization
3. **Redis** - Stores email metadata, message queues, and account data for fast access
4. **Email Providers** - Gmail, Outlook, Microsoft 365, and any IMAP/SMTP server

**Data flows:**

- **API requests**: Your app calls EmailEngine REST API → EmailEngine connects to email providers or retrieves from Redis
- **Webhooks**: Email providers send updates → EmailEngine processes → Your app receives webhook notifications
- **Data storage**: EmailEngine stores metadata and queues in Redis (email content is not stored, only fetched on demand)

**Key features:**

- **Unified API** for all email providers (IMAP, SMTP, Gmail API, Microsoft Graph API)
- **OAuth2 authentication** support for Gmail, Google Workspace, and Microsoft 365
- **Real-time webhooks** for instant email notifications
- **Automatic reconnection** and error recovery
- **Queue management** with automatic retries

## API Reference

EmailEngine provides a comprehensive REST API:

- **[API Overview](/docs/api-reference)** - Authentication, conventions, error handling
- **[Account Management](/docs/api-reference/accounts-api)** - Register and manage accounts
- **[Sending Emails](/docs/api-reference/sending-api)** - Submit endpoint and options
- **[Message Operations](/docs/api-reference/messages-api)** - List, search, and manage emails
- **[Complete API Docs](/docs/api-reference)** - All 73 endpoints with schemas

## Get Help

- **[Troubleshooting Guide](/docs/troubleshooting)** - Common issues and solutions
- **[GitHub Issues](https://github.com/postalsys/emailengine/issues)** - Report bugs and request features
- **[Support](/docs/support/license)** - Get professional support
- **[Blog](/blog)** - Tutorials, guides, and use case examples

## System Requirements

- **Node.js** 20.x or higher
- **Redis** 6.x or higher (or Redis-compatible service like Upstash)
- **Memory** Minimum 2GB RAM (4GB+ recommended for production)
- **OS** Linux, macOS, or Windows

## License

EmailEngine requires a license key for production use. Get a license:

- **[Free Development License](https://postalsys.com/plans)** - For testing and development
- **[Production License](https://postalsys.com/plans)** - For commercial use

---

## Next Steps

**New to EmailEngine?**

1. [Read the introduction](/docs/getting-started/introduction) to understand what EmailEngine can do
2. [Follow the quick start guide](/docs/getting-started/quick-start) to get your first email working
3. [Set up OAuth2 for Gmail](/docs/accounts/gmail-imap) or [Outlook](/docs/accounts/outlook-365)

**Ready to build?**

- [Explore the API reference](/docs/api-reference) to see all available endpoints
- [Check out integration examples](/docs/integrations) for PHP, CRM, AI, and more
- [Read about performance tuning](/docs/advanced/performance-tuning) for production deployments

**Need inspiration?**

- [Browse the blog](/blog) for tutorials and real-world use cases
- [See the CRM integration guide](/docs/integrations/crm) for a complete architecture example
- [Compare EmailEngine vs Nylas](/docs/comparison/emailengine-vs-nylas) to understand the differences
