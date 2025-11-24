---
title: Gmail API Integration
description: Integrate EmailEngine with Gmail API for native Gmail features and Cloud Pub/Sub
sidebar_position: 2
---

# Gmail API Integration

:::tip Full Guide Available
For complete Gmail API setup instructions, see the [Gmail API Setup Guide](/docs/accounts/gmail-api) in the Accounts section.
:::

## Overview

EmailEngine can use Gmail REST API directly instead of IMAP/SMTP. This provides:

- **Native Gmail features** - Labels, categories, search
- **Cloud Pub/Sub webhooks** - Real-time notifications via Google infrastructure
- **Granular OAuth2 scopes** - Use limited scopes for Google verification

## Quick Links

- **[Complete Setup Guide](/docs/accounts/gmail-api)** - Step-by-step Gmail API configuration
- **[Gmail over IMAP](/docs/accounts/gmail-imap)** - Alternative: Use Gmail with IMAP/SMTP
- **[Service Accounts](/docs/accounts/google-service-accounts)** - Access multiple accounts without user consent

## When to Use Gmail API

**Use Gmail API when:**
- You want native Gmail label and category support
- Google's verification requires limited OAuth2 scopes
- You need Cloud Pub/Sub for real-time notifications

**Use IMAP/SMTP when:**
- You need the full `https://mail.google.com/` scope
- Your organization restricts Cloud Pub/Sub
- You're migrating existing IMAP integrations

## See Also

- [Gmail API Setup](/docs/accounts/gmail-api) - Complete configuration guide
- [Gmail over IMAP](/docs/accounts/gmail-imap) - OAuth2 with IMAP/SMTP
- [Google Service Accounts](/docs/accounts/google-service-accounts) - Domain-wide delegation
