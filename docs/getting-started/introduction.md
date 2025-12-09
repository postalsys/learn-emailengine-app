---
title: Introduction to EmailEngine
description: Introduction to EmailEngine - unified REST API for email accounts and providers
sidebar_position: 0
---

# EmailEngine

**EmailEngine** is a self-hosted email gateway that allows you to access email accounts over REST API. It provides a unified interface to interact with IMAP and SMTP protocols, as well as native integrations with Gmail API and Microsoft Graph API.

## What is EmailEngine?

EmailEngine streamlines email integration for your app or service with a unified REST API that seamlessly connects with:

- **IMAP** - Standard email protocol
- **SMTP** - Standard email sending protocol
- **Gmail API** - Native Gmail integration
- **Microsoft Graph API** - Native Microsoft 365/Outlook integration

## What EmailEngine is NOT

Understanding what EmailEngine does not do is just as important as knowing what it does:

### Not a Mail Server

EmailEngine is **not a mail server** like Postfix, Sendmail, or Microsoft Exchange. You cannot create new email accounts with EmailEngine. It does not host mailboxes, manage email domains, or provide MX records for receiving mail directly.

Instead, EmailEngine connects to **existing email accounts** that you already have with providers like Gmail, Outlook, or any IMAP-compatible email service. Think of it as a bridge between your application and email providers, not as a replacement for those providers.

### Not a Managed Service

EmailEngine is **self-hosted software**, not a cloud service. There is no EmailEngine-hosted API endpoint you can call. You must deploy and run EmailEngine on your own infrastructure, whether that's:

- A cloud server (AWS, DigitalOcean, Render, etc.)
- An on-premise server
- A Docker container
- Your local development machine

This gives you complete control over your data and privacy, but also means you're responsible for hosting, maintenance, and scaling.

### Summary

| EmailEngine IS | EmailEngine is NOT |
|----------------|-------------------|
| An email API gateway | A mail server |
| A bridge to existing accounts | A service that creates email accounts |
| Self-hosted software | A managed cloud service |
| A unified REST API | A replacement for your email provider |

## Key Features

### Unified REST API

Access all email accounts through a single, consistent REST API regardless of the underlying protocol (IMAP, Gmail API, or Microsoft Graph).

### Real-time Webhooks

Receive instant notifications about new emails, email updates, and account changes through webhooks.

### OAuth2 Support

Built-in support for OAuth2 authentication for Gmail, Google Workspace, Microsoft 365, and Outlook.com accounts.

### Email Sending

Send emails through SMTP or native APIs with support for attachments, HTML content, and templates.

### Account Management

Register and manage multiple email accounts with automatic connection handling and reconnection.

### Message Management

- List, search, and filter messages
- Mark messages as read/unread
- Move messages between folders
- Delete messages
- Download attachments

### Self-hosted

Run EmailEngine on your own infrastructure for complete control over your email data and privacy.

## Use Cases

- **Email Integration** - Add email functionality to your SaaS application
- **Email Automation** - Automate email workflows and responses
- **Customer Support** - Integrate customer email communications into your CRM
- **Email Analytics** - Track and analyze email communications
- **Email Backup** - Create backups of email accounts

## Quick Start

Get started with EmailEngine in just a few steps:

1. **[Install EmailEngine](/docs/installation)** - Download and set up EmailEngine on your server
2. **[Configure Redis](/docs/configuration/redis)** - Set up Redis for data storage
3. **[Register an Account](/docs/api/post-v-1-account)** - Add your first email account via API
4. **[Set up Webhooks](/docs/webhooks/overview)** - Configure webhooks to receive notifications
5. **[Start Building](/docs/api-reference)** - Explore the API reference and build your integration

## System Requirements

- **Redis** Any version (or Redis-compatible service like Upstash)
- **Memory** Minimum 4GB RAM for development, 8GB+ for production (16GB+ recommended for larger deployments)
- **OS** Linux, macOS, or Windows

## License

EmailEngine includes a **14-day free trial** with full functionality and no limitations. No credit card required - just click "Activate Trial" in the dashboard to begin.

For production use, [get a license key](https://postalsys.com/plans) from postalsys.com.
