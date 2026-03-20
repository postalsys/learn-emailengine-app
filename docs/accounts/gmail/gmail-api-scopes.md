---
title: Gmail API Scopes Reference
sidebar_label: API Scopes Reference
sidebar_position: 3
description: Complete reference for Gmail OAuth2 scope configurations in EmailEngine
---

# Gmail API Scopes Reference

When using EmailEngine with Gmail, you must choose which OAuth2 scopes to request. Google requires applications to follow the [principle of least privilege](https://developers.google.com/identity/protocols/oauth2/scopes) - request only the scopes your application actually needs. The scope selection also determines what [Google verification process](https://support.google.com/cloud/answer/13463073) your application must pass.

This page covers all Gmail scope configurations supported by EmailEngine, what each enables, and how to set them up.

:::info Prerequisites
This page assumes you have already created a Google Cloud project and OAuth2 credentials. If not, see [Setting Up Gmail API](/docs/accounts/gmail/gmail-api) or [Setting Up Gmail with OAuth2 (IMAP/SMTP)](/docs/accounts/gmail/gmail-imap) first.
:::

## Quick Reference

| Configuration | Scopes | Read | Send | Modify/Move/Trash | Manage Labels | Pub/Sub Webhooks | Google Classification |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| [Full Access](#full-access) | `https://mail.google.com/` | Yes | Yes | Yes (+ permanent delete) | Yes | IMAP only | Restricted |
| [Gmail API Full Access](#gmail-api-full-access) | `gmail.modify` | Yes | Yes | Yes | Yes | Yes | Restricted |
| [Read + Send](#read--send) | `gmail.readonly` + `gmail.send` + `gmail.labels` | Yes | Yes | No | Yes | Yes | Restricted |
| [Read-Only](#read-only) | `gmail.readonly` + `gmail.labels` | Yes | No | No | Yes | Yes | Restricted |
| [Send-Only](#send-only) | `gmail.send` | No | Yes | No | No | No | Sensitive |

**Manage Labels** refers to creating, renaming, and deleting labels (folders). The `gmail.labels` scope is also required for EmailEngine to list labels properly.

## Google's Scope Classifications

Google classifies OAuth2 scopes into three tiers. The classification determines what verification your application needs before it can be published:

| Classification | Verification Required | Gmail Scopes in This Tier |
|---|---|---|
| **Restricted** | Security audit (CASA assessment) | `https://mail.google.com/`, `gmail.modify`, `gmail.readonly`, `gmail.compose`, `gmail.metadata` |
| **Sensitive** | Brand verification only | `gmail.send` |
| **Non-sensitive** | No verification | `gmail.labels` |

The overall classification of your application is determined by its most restrictive scope. For example, if you request both `gmail.send` (Sensitive) and `gmail.readonly` (Restricted), your application is classified as Restricted.

:::tip Send-Only is the easiest to verify
The **Send-Only** configuration using `gmail.send` is the only Gmail scope combination that avoids the Restricted tier. It requires only brand verification (Sensitive), which is significantly faster and cheaper than a full security audit.
:::

## How Scope Configuration Works in EmailEngine

EmailEngine uses three fields to determine which scopes are requested during OAuth2 authentication:

| Field | Purpose | API Parameter | Web UI Field |
|---|---|---|---|
| **Base Scopes** | Selects the default scope set | `baseScopes` | "Base scopes" radio buttons |
| **Additional Scopes** | Adds scopes on top of the defaults | `extraScopes` | "Additional scopes" textarea |
| **Disabled Scopes** | Removes scopes from the defaults | `skipScopes` | "Disabled scopes" textarea |

**How they combine:**

1. Start with the default scope for the selected base (`"imap"` = `https://mail.google.com/`, `"api"` = `gmail.modify`)
2. Add any scopes from Additional Scopes that are not already included
3. Remove any scopes that match Disabled Scopes

EmailEngine also automatically adds the OpenID Connect scopes `openid`, `email`, and `profile` to all user-facing OAuth2 flows. These provide basic user identity information and do not need to be configured manually.

### Web UI Preset Buttons

When the base scope is set to **Gmail API**, the OAuth2 application configuration page shows four preset buttons that auto-populate the Additional and Disabled scopes fields:

- **Normal (Full Access)** - uses `gmail.modify` as-is
- **Read-Only** - adds `gmail.readonly` + `gmail.labels`, disables `gmail.modify`
- **Read-Only + Send** - adds `gmail.readonly` + `gmail.send` + `gmail.labels`, disables `gmail.modify`
- **Send-Only** - adds `gmail.send`, disables `gmail.modify`

These presets preserve any third-party scopes you may have added manually (such as Google Calendar or Drive scopes).

---

## Full Access

**Scope:** `https://mail.google.com/`

This is the broadest Gmail scope. It grants full access to all Gmail operations, including permanent message deletion, which no other scope allows. This scope is accepted by every Gmail API endpoint and also enables IMAP and SMTP protocol access.

In EmailEngine, this scope is used with the IMAP/SMTP backend (`baseScopes: "imap"`). EmailEngine connects via IMAP for reading and SMTP for sending, providing raw protocol-level access.

### What this enables

| Operation | Supported |
|---|:---:|
| List and read messages | Yes |
| Send messages (with full SMTP envelope control) | Yes |
| Modify message labels/flags | Yes |
| Move messages between labels | Yes |
| Trash messages | Yes |
| Permanently delete messages | Yes |
| List, create, rename, delete labels | Yes |
| Raw SMTP features (custom envelope-from, etc.) | Yes |

### What this does not enable

- Cloud Pub/Sub push notifications (EmailEngine uses IMAP IDLE for real-time updates instead)

### When to use

- You need permanent message deletion (not just trash)
- You need raw SMTP features (custom envelope-from, direct SMTP control)
- You want to use EmailEngine's [IMAP/SMTP proxy](/docs/accounts/proxying-connections), which lets legacy clients and scripts connect with password authentication while EmailEngine handles OAuth2 behind the scenes
- You are migrating from an existing IMAP-based integration
- Your organization restricts Cloud Pub/Sub permissions
- You can justify the full scope to Google during verification

### Google classification

**Restricted** - requires a security audit (CASA assessment) for public applications.

### Setup via Web UI

1. Go to **Configuration** > **OAuth2** > **Add new OAuth2 app**
2. Select **Gmail** as the provider
3. Upload your Google credentials JSON file or enter Client ID and Client Secret manually
4. For **Base scope**, select **IMAP and SMTP**
5. No additional or disabled scopes needed
6. Click **Register app**

### Setup via API

```bash
curl -X POST "https://emailengine.example.com/v1/oauth2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail IMAP/SMTP",
    "baseScopes": "imap",
    "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUrl": "https://emailengine.example.com/oauth"
  }'
```

### See also

[Setting Up Gmail with OAuth2 (IMAP/SMTP)](/docs/accounts/gmail/gmail-imap) - complete step-by-step setup guide.

---

## Gmail API Full Access

**Scope:** `https://www.googleapis.com/auth/gmail.modify`

This is the default scope when using the Gmail API backend. It provides full read, send, and modify access through Google's REST API, with Cloud Pub/Sub for real-time push notifications.

### What this enables

| Operation | Gmail API Endpoint | Supported |
|---|---|:---:|
| List and read messages | `messages.list`, `messages.get` | Yes |
| Send messages | `messages.send` | Yes |
| Modify message labels/flags | `messages.modify` | Yes |
| Move messages between labels | `messages.modify` | Yes |
| Trash messages | `messages.trash` | Yes |
| List labels | `labels.list` | Yes |
| Create, rename, delete labels | `labels.create`, `labels.patch`, `labels.delete` | Yes |
| Cloud Pub/Sub push notifications | `users.watch` | Yes |
| Reply and forward (with reference) | via `messages.send` + `messages.get` | Yes |

### What this does not enable

- Permanent message deletion (only trash). Requires `https://mail.google.com/` scope.
- Raw SMTP features (custom envelope-from). Requires IMAP/SMTP mode.

### EmailEngine behavior

- Full Pub/Sub watch for real-time webhook notifications
- History tracking for incremental sync
- Fallback polling in case Pub/Sub notifications are missed
- Locale detection for the account
- After sending, fetches back the actual Message-ID from Gmail

### When to use

- Default choice for Gmail API integration
- You need full email operations (read, send, modify, move, trash)
- You want Cloud Pub/Sub push notifications for real-time updates

### Google classification

**Restricted** - requires a security audit (CASA assessment) for public applications.

### Setup via Web UI

1. Go to **Configuration** > **OAuth2** > **Add new OAuth2 app**
2. Select **Gmail** as the provider
3. Upload your Google credentials JSON file or enter Client ID and Client Secret manually
4. For **Base scope**, select **Gmail API**
5. Click the **Normal (Full Access)** preset button (or leave Additional and Disabled scopes empty)
6. Click **Register app**

### Setup via API

```bash
curl -X POST "https://emailengine.example.com/v1/oauth2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail API - Full Access",
    "baseScopes": "api",
    "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUrl": "https://emailengine.example.com/oauth"
  }'
```

No `extraScopes` or `skipScopes` needed - `gmail.modify` is the default for the `"api"` base scope.

### See also

[Setting Up Gmail API](/docs/accounts/gmail/gmail-api) - complete step-by-step setup guide including Cloud Pub/Sub configuration.

---

## Read + Send

**Scopes:**

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.labels`

Uses three separate scopes instead of the broader `gmail.modify`. This provides read and send access but cannot modify existing messages (flags, labels, moves, or trash).

### What this enables

| Operation | Gmail API Endpoint | Supported |
|---|---|:---:|
| List and read messages | `messages.list`, `messages.get` | Yes |
| Send messages | `messages.send` | Yes |
| Modify message labels/flags | `messages.modify` | No |
| Move messages between labels | `messages.modify` | No |
| Trash messages | `messages.trash` | No |
| List labels | `labels.list` | Yes |
| Create, rename, delete labels | `labels.create`, `labels.patch`, `labels.delete` | Yes |
| Cloud Pub/Sub push notifications | `users.watch` | Yes |
| Reply and forward (with reference) | via `messages.send` + `messages.get` | Yes |

### What this does not enable

- Modifying labels on existing messages (marking as read/unread, starring, categorizing)
- Moving messages between folders/labels
- Trashing or deleting messages
- These operations require `gmail.modify` and will return a scope error from Google's API

### EmailEngine behavior

- Full Pub/Sub watch for real-time webhook notifications
- History tracking for incremental sync
- Fallback polling for missed notifications
- Locale detection
- After sending, fetches back the actual Message-ID from Gmail
- Webhook notifications for incoming messages work normally

:::warning Operations that will fail
With this scope combination, EmailEngine API calls that attempt to modify, move, or trash messages will fail with a `403 Insufficient Permission` error from Google. This includes:
- `PUT /v1/account/{account}/message/{message}` (updating flags)
- `PUT /v1/account/{account}/message/{message}/move` (moving messages)
- `DELETE /v1/account/{account}/message/{message}` (trashing messages)
:::

### When to use

- Google's verification process requires you to justify each scope separately
- Your application reads emails and sends responses but does not need to modify or organize them
- You want the narrowest scopes that still allow both reading and sending

### Google classification

**Restricted** - the `gmail.readonly` scope is Restricted, which sets the overall classification. The `gmail.send` scope alone is Sensitive and `gmail.labels` is Non-sensitive, but the combination is Restricted.

### Setup via Web UI

1. Go to **Configuration** > **OAuth2** > **Add new OAuth2 app** (or edit an existing one)
2. Select **Gmail** as the provider
3. For **Base scope**, select **Gmail API**
4. Click the **Read-Only + Send** preset button

   This automatically sets:
   - **Additional scopes:**
     ```
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.labels
     ```
   - **Disabled scopes:**
     ```
     https://www.googleapis.com/auth/gmail.modify
     ```
5. Click **Register app**

### Setup via API

```bash
curl -X POST "https://emailengine.example.com/v1/oauth2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail API - Read + Send",
    "baseScopes": "api",
    "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUrl": "https://emailengine.example.com/oauth",
    "extraScopes": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.labels"
    ],
    "skipScopes": [
      "https://www.googleapis.com/auth/gmail.modify"
    ]
  }'
```

---

## Read-Only

**Scopes:**

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.labels`

Provides read access to messages and labels. Cannot send, modify, or delete messages.

### What this enables

| Operation | Gmail API Endpoint | Supported |
|---|---|:---:|
| List and read messages | `messages.list`, `messages.get` | Yes |
| Send messages | `messages.send` | No |
| Modify message labels/flags | `messages.modify` | No |
| Move messages between labels | `messages.modify` | No |
| Trash messages | `messages.trash` | No |
| List labels | `labels.list` | Yes |
| Create, rename, delete labels | `labels.create`, `labels.patch`, `labels.delete` | Yes |
| Cloud Pub/Sub push notifications | `users.watch` | Yes |
| Reply and forward (with reference) | - | No |

### What this does not enable

- Sending emails (the submit API endpoint will fail)
- Modifying labels on existing messages
- Moving or trashing messages

### EmailEngine behavior

- Full Pub/Sub watch for real-time webhook notifications
- History tracking for incremental sync
- Fallback polling for missed notifications
- Webhook notifications for incoming messages (e.g., `messageNew`) work normally
- Locale detection

:::warning gmail.labels is required
The `gmail.labels` scope is required for EmailEngine to list labels (mailboxes) properly. Always include it alongside `gmail.readonly`. Without it, EmailEngine cannot function correctly even for read-only use cases.
:::

### When to use

- Email monitoring or archival applications
- Helpdesk systems that only need to read incoming emails
- Analytics that process email content without modifying it
- You do not need to send, modify, or organize emails through EmailEngine

### Google classification

**Restricted** - the `gmail.readonly` scope is Restricted. The `gmail.labels` scope is Non-sensitive, but the combination is Restricted.

### Setup via Web UI

1. Go to **Configuration** > **OAuth2** > **Add new OAuth2 app** (or edit an existing one)
2. Select **Gmail** as the provider
3. For **Base scope**, select **Gmail API**
4. Click the **Read-Only** preset button

   This automatically sets:
   - **Additional scopes:**
     ```
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/gmail.labels
     ```
   - **Disabled scopes:**
     ```
     https://www.googleapis.com/auth/gmail.modify
     ```
5. Click **Register app**

### Setup via API

```bash
curl -X POST "https://emailengine.example.com/v1/oauth2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail API - Read Only",
    "baseScopes": "api",
    "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUrl": "https://emailengine.example.com/oauth",
    "extraScopes": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.labels"
    ],
    "skipScopes": [
      "https://www.googleapis.com/auth/gmail.modify"
    ]
  }'
```

---

## Send-Only

**Scope:** `https://www.googleapis.com/auth/gmail.send`

The most restrictive configuration. Can only send emails - no access to read messages, list labels, or modify anything.

### What this enables

| Operation | Gmail API Endpoint | Supported |
|---|---|:---:|
| List and read messages | `messages.list`, `messages.get` | No |
| Send messages | `messages.send` | Yes |
| Modify message labels/flags | `messages.modify` | No |
| Move messages between labels | `messages.modify` | No |
| Trash messages | `messages.trash` | No |
| List labels | `labels.list` | No |
| Create, rename, delete labels | `labels.create`, `labels.patch`, `labels.delete` | No |
| Cloud Pub/Sub push notifications | `users.watch` | No |
| Reply and forward (with reference) | - | No |

### What this does not enable

- Reading any email content
- Listing mailboxes or labels
- Any modification or deletion of messages
- Receiving webhook notifications for incoming emails
- Reply/forward with `reference.action` (returns `ReferenceNotSupported` error because EmailEngine cannot read the original message)

### EmailEngine behavior

EmailEngine activates a special **send-only mode** for accounts with only the `gmail.send` scope:

- **No Pub/Sub watch** - push notifications are not set up since there is nothing to monitor
- **No history tracking** - incremental sync is disabled
- **No fallback polling** - no periodic checks for new messages
- **No locale detection** - user locale is not resolved
- **No incoming email webhooks** - `messageNew`, `messageUpdated`, and similar webhook events are not fired
- **Email detection** - uses the Google UserInfo endpoint (`/oauth2/v2/userinfo`) instead of the Gmail profile endpoint to determine the user's email address
- **After sending** - cannot fetch back the Gmail-assigned Message-ID because that requires read access. Uses the original Message-ID from the email headers instead
- **Reply/forward** - attempting to use `reference.action` in the submit API throws a `400 ReferenceNotSupported` error, since EmailEngine cannot read the referenced message to build the reply chain

### When to use

- Transactional email (order confirmations, password resets, notifications)
- Applications that only need to send emails and have no need to read or manage the user's mailbox
- You want the easiest Google verification path (Sensitive instead of Restricted)

### Google classification

**Sensitive** - this is the only Gmail scope configuration that avoids the Restricted tier. Sensitive scopes require brand verification but not a full security audit (CASA assessment). This makes the verification process significantly faster and less expensive.

### Setup via Web UI

1. Go to **Configuration** > **OAuth2** > **Add new OAuth2 app** (or edit an existing one)
2. Select **Gmail** as the provider
3. For **Base scope**, select **Gmail API**
4. Click the **Send-Only** preset button

   This automatically sets:
   - **Additional scopes:**
     ```
     https://www.googleapis.com/auth/gmail.send
     ```
   - **Disabled scopes:**
     ```
     https://www.googleapis.com/auth/gmail.modify
     ```
5. Click **Register app**

### Setup via API

```bash
curl -X POST "https://emailengine.example.com/v1/oauth2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail API - Send Only",
    "baseScopes": "api",
    "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUrl": "https://emailengine.example.com/oauth",
    "extraScopes": [
      "https://www.googleapis.com/auth/gmail.send"
    ],
    "skipScopes": [
      "https://www.googleapis.com/auth/gmail.modify"
    ]
  }'
```

---

## Updating an Existing OAuth2 Application

To change scopes on an existing OAuth2 application, use the `PUT /v1/oauth2/{app}` endpoint:

```bash
curl -X PUT "https://emailengine.example.com/v1/oauth2/YOUR_APP_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "extraScopes": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.labels"
    ],
    "skipScopes": [
      "https://www.googleapis.com/auth/gmail.modify"
    ]
  }'
```

:::warning Scope changes require re-authentication
Changing scopes on the OAuth2 application only affects new account authentications. Existing accounts keep their original scopes until the user re-authenticates. To apply new scopes to existing accounts, generate a new authentication link and have users complete the OAuth2 flow again.
:::

## Gmail API Endpoint Scope Requirements

For reference, here is which scopes are accepted by the Gmail API endpoints that EmailEngine uses:

| Gmail API Endpoint | `mail.google.com` | `gmail.modify` | `gmail.readonly` | `gmail.send` | `gmail.labels` |
|---|:---:|:---:|:---:|:---:|:---:|
| `messages.list` | Yes | Yes | Yes | - | - |
| `messages.get` | Yes | Yes | Yes | - | - |
| `messages.send` | Yes | Yes | - | Yes | - |
| `messages.modify` | Yes | Yes | - | - | - |
| `messages.trash` | Yes | Yes | - | - | - |
| `messages.delete` (permanent) | Yes | - | - | - | - |
| `messages.batchModify` | Yes | Yes | - | - | - |
| `labels.list` | Yes | Yes | Yes | - | Yes |
| `labels.get` | Yes | Yes | Yes | - | Yes |
| `labels.create` | Yes | Yes | - | - | Yes |
| `labels.patch` | Yes | Yes | - | - | Yes |
| `labels.delete` | Yes | Yes | - | - | Yes |
| `users.watch` (Pub/Sub) | Yes | Yes | Yes | - | - |

Source: [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)

## See Also

- [Setting Up Gmail API](/docs/accounts/gmail/gmail-api) - complete Gmail API setup guide with Cloud Pub/Sub
- [Setting Up Gmail with OAuth2 (IMAP/SMTP)](/docs/accounts/gmail/gmail-imap) - IMAP/SMTP setup guide
- [Gmail Pub/Sub Integration](/docs/accounts/gmail/gmail-pubsub) - Cloud Pub/Sub configuration for real-time notifications
- [Google Service Accounts](/docs/accounts/gmail/google-service-accounts) - service accounts use `baseScopes: "pubsub"` or `"imap"`
- [OAuth2 Setup Guide](/docs/accounts/oauth2-setup) - general OAuth2 concepts and configuration
- [OAuth2 Token Management](/docs/accounts/oauth2-token-management) - managing and using OAuth2 tokens for additional APIs
