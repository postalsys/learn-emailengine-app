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

## Architecture

EmailEngine is a self-hosted application that:

1. Maintains persistent connections to email accounts
2. Syncs email data to Redis for fast access
3. Exposes a REST API for your application
4. Sends webhooks for real-time updates
5. Handles authentication, retries, and error recovery

## Quick Start

Get started with EmailEngine in just a few steps:

1. **[Install EmailEngine](/docs/installation)** - Download and set up EmailEngine on your server
2. **[Configure Redis](/docs/configuration/redis)** - Set up Redis for data storage
3. **[Register an Account](/docs/api/post-v-1-account)** - Add your first email account via API
4. **[Set up Webhooks](/docs/receiving/webhooks)** - Configure webhooks to receive notifications
5. **[Start Building](/docs/api-reference)** - Explore the API reference and build your integration

## System Requirements

- **Redis** 6.x or higher
- **Memory** Minimum 2GB RAM recommended
- **OS** Linux, macOS, or Windows

## License

EmailEngine includes a **14-day free trial** with full functionality and no limitations. No credit card required - just click "Activate Trial" in the dashboard to begin.

For production use, [get a license key](https://postalsys.com/plans) from postalsys.com.
