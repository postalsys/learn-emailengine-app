---
title: Google Service Accounts Integration
description: Use Google Workspace service accounts with domain-wide delegation
sidebar_position: 6
---

# Google Service Accounts Integration

:::tip Full Guide Available
For complete service account setup instructions, see the [Google Service Accounts Guide](/docs/accounts/google-service-accounts) in the Accounts section.
:::

## Overview

Service accounts provide a powerful way for Google Workspace admins to grant EmailEngine access to any email account in the organization without requiring individual user consent.

## Key Features

- **No User Interaction** - Two-legged OAuth2 without consent screens
- **Domain-Wide Access** - Access any user's mailbox in your organization
- **Admin Control** - Single configuration for entire domain
- **Automated Workflows** - Perfect for background processing

## Quick Links

- **[Complete Setup Guide](/docs/accounts/google-service-accounts)** - Step-by-step configuration
- **[Gmail API Setup](/docs/accounts/gmail-api)** - Use Gmail API with service accounts
- **[Gmail over IMAP](/docs/accounts/gmail-imap)** - Alternative: OAuth2 with IMAP/SMTP

## When to Use Service Accounts

**Best For:**
- Enterprise Google Workspace deployments
- Centralized email management
- Accessing multiple user mailboxes
- Automated workflows without user interaction

**Not Suitable For:**
- Free Gmail accounts (Google Workspace only)
- Public-facing applications
- Applications where users should control access

## Requirements

- Google Workspace (not free Gmail)
- Super admin privileges
- Google Cloud project with Gmail API enabled

## See Also

- [Google Service Accounts](/docs/accounts/google-service-accounts) - Complete configuration guide
- [Gmail API Setup](/docs/accounts/gmail-api) - Use Gmail REST API
- [Gmail over IMAP](/docs/accounts/gmail-imap) - OAuth2 with IMAP/SMTP
