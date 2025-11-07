---
title: Quick Start Guide
sidebar_position: 1
description: Get your first email working with EmailEngine in 10 minutes - from installation to sending and receiving
---

# Quick Start Guide

Get EmailEngine up and running in 10 minutes. This guide walks you through installing EmailEngine, adding your first email account, sending an email, and receiving webhook notifications.

## Step 1: Install EmailEngine

### Option A: Download Binary (Quickest)

```bash
# Download latest release
$ wget https://go.emailengine.app/emailengine.tar.gz
$ tar xzf emailengine.tar.gz
$ chmod +x emailengine

# Start EmailEngine
$ ./emailengine --dbs.redis="redis://127.0.0.1:6379"
```

### Option B: Using Docker

```bash
# Pull the latest version
$ docker pull postalsys/emailengine:v2

# Run EmailEngine
$ docker run -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379" \
  postalsys/emailengine:v2
```

EmailEngine will start on **http://localhost:3000**

## Step 2: Access the Web Interface

1. Open your browser and navigate to **http://localhost:3000**
2. On first startup, you'll be prompted to create an admin account
3. Set a secure password for the web admin UI

![EmailEngine Main Dashboard](/img/screenshots/01-dashboard-main.png)
*EmailEngine main dashboard after successful login*

## Step 3: Generate an API Access Token

You need an access token to authenticate API requests.

### Via Web Interface:
1. Navigate to **Access Tokens** in the sidebar menu
2. Click **Create new**
3. Provide a name (e.g., "Development")
4. Select scopes (use `*` for full access)
5. Click **Generate a token**
6. Copy the token immediately - it's shown only once and keep it secure

### Via API:

:::warning Limited Token Scope
Tokens generated via API are limited and always bound to a specific email account. For example, you can generate a token to list emails for a specific account, but cannot generate a token to access system-wide endpoints like Prometheus `/metrics`. For full access tokens, use the web interface.
:::

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/token" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-account",
    "description": "Development token",
    "scopes": ["*"]
  }' \
  -u "admin:your-password"
```

See the [Create Access Token API](/docs/api/post-v-1-token) for more details.

Save your token as an environment variable:
```bash
$ export EMAILENGINE_TOKEN="your-token-here"
```

## Step 4: Add Your First Email Account

EmailEngine supports multiple account types. Choose the method that fits your needs:

### Option A: Hosted Authentication Form (Recommended)

The easiest way to add accounts is using EmailEngine's built-in hosted authentication form. EmailEngine handles the entire OAuth2 flow for you.

**Benefits:**
- No need to obtain OAuth2 tokens manually
- EmailEngine manages token refresh automatically
- Works with Gmail, Outlook, and other OAuth2 providers
- User-friendly authentication experience

**How to use:**

1. Navigate to the EmailEngine web interface at **http://localhost:3000**
2. Go to **Accounts** in the sidebar
3. Click **Add new account**
4. Enter the email address
5. Click **Authenticate** and follow the provider's OAuth2 flow
6. EmailEngine will handle the rest automatically

![Accounts List](/img/screenshots/02-accounts-list.png)
*Accounts list page - add your first email account*

![Add Account Form](/img/screenshots/03-account-add-form.png)
*Add new account form with IMAP/SMTP configuration*

**When to use the hosted form:**
- Quick account setup during development
- End-user account authentication in your application
- When you don't need programmatic control over OAuth2 tokens

:::tip Using in Your Application
You can redirect users to the hosted authentication form from your application. The form will redirect users to the OAuth2 provider's permission page (which must open in a main window, not an iframe due to security restrictions). After authentication, users are redirected back to your application. See the [Authentication Form API](/docs/api/get-v-1-authentication-form) for details.
:::

### Option B: API with OAuth2 Tokens (Advanced)

For programmatic control or special requirements, register accounts directly via API with OAuth2 tokens you've obtained.

**When to use direct API:**
- Automated account provisioning
- Service account authentication
- Custom OAuth2 flows
- When you need to manage tokens yourself

**Gmail Example:**

**Prerequisites:** You need to set up OAuth2 credentials in Google Cloud Console. [See detailed guide →](/docs/accounts/gmail-imap)

![Create Account API Request](/img/examples/api-create-account-request.png)
*Example API request to create a new account*

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/account" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-gmail",
    "name": "Your Name",
    "email": "you@gmail.com",
    "oauth2": {
      "provider": "gmail",
      "accessToken": "ya29.a0...",
      "refreshToken": "1//0..."
    }
  }'
```

**Outlook Example:**

**Prerequisites:** You need to register an app in Azure AD. [See detailed guide →](/docs/accounts/outlook-365)

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/account" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-outlook",
    "name": "Your Name",
    "email": "you@outlook.com",
    "oauth2": {
      "provider": "outlook",
      "accessToken": "EwB4A8l6...",
      "refreshToken": "M.C546_..."
    }
  }'
```

### Option C: Generic IMAP/SMTP (Any provider)

This works with any email provider that supports IMAP and SMTP:

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/account" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-account",
    "name": "Your Name",
    "email": "you@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "you@example.com",
        "pass": "your-password"
      }
    },
    "smtp": {
      "host": "smtp.example.com",
      "port": 465,
      "secure": true,
      "auth": {
        "user": "you@example.com",
        "pass": "your-password"
      }
    }
  }'
```

### Common Provider Settings

| Provider | IMAP Host | IMAP Port | SMTP Host | SMTP Port |
|----------|-----------|-----------|-----------|-----------|
| Gmail | imap.gmail.com | 993 | smtp.gmail.com | 465 |
| Outlook.com | outlook.office365.com | 993 | smtp.office365.com | 587 |
| Yahoo | imap.mail.yahoo.com | 993 | smtp.mail.yahoo.com | 465 |
| ProtonMail Bridge | 127.0.0.1 | 1143 | 127.0.0.1 | 1025 |
| Fastmail | imap.fastmail.com | 993 | smtp.fastmail.com | 465 |

**Response:**
```json
{
  "account": "my-account",
  "state": "new"
}
```

## Step 5: Wait for Initial Sync

EmailEngine performs an initial sync of your mailbox before it's ready to use.

### Option A: Using Webhooks (Recommended)

Once the account completes its initial sync, EmailEngine automatically sends an `accountInitialized` webhook event:

```json
{
  "serviceUrl": "https://emailengine.example.com",
  "event": "accountInitialized",
  "account": "my-account",
  "date": "2025-01-15T10:23:45.678Z",
  "data": {
    "account": "my-account",
    "state": "connected",
    "syncTime": 2341
  }
}
```

**Benefits:**
- No polling required
- Instant notification when account is ready
- Efficient for production applications

### Option B: Polling Account Status

Alternatively, poll the [get account API](/docs/api/get-v-1-account-account) until `state` shows `"connected"`:

```bash
# Check account status
$ curl "http://127.0.0.1:3000/v1/account/my-account" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}"
```

**Response when ready:**
```json
{
  "account": "my-account",
  "name": "Your Name",
  "email": "you@example.com",
  "state": "connected",
  "syncTime": 2341,
  "lastSync": "2025-01-15T10:23:45.678Z"
}
```

### Initial Sync Duration

Sync time depends on:
- **Number of mailbox folders** - More folders take longer to scan
- **Number of messages** - Each message needs to be indexed
- **Indexer type** - Fast indexer (basic metadata) or Full indexer (complete indexing, default)

## Step 6: Send Your First Email

Once the account is connected, send a test email using the [submit API](/docs/api/post-v-1-account-account-submit):

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/account/my-account/submit" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{
      "name": "Test Recipient",
      "address": "recipient@example.com"
    }],
    "subject": "Test email from EmailEngine",
    "text": "Hello! This is my first email sent through EmailEngine.",
    "html": "<p>Hello! This is my first email sent through <strong>EmailEngine</strong>.</p>"
  }'
```

**Response:**

![Send Email Response](/img/examples/api-send-email-response.png)
*Example API response after sending an email*

```json
{
  "response": "Queued for delivery",
  "messageId": "<unique-id@example.com>",
  "sendAt": "2025-01-15T10:25:30.123Z",
  "queueId": "abc123def456"
}
```

The email is now queued for delivery. EmailEngine will:
1. Submit it to the SMTP server
2. Retry automatically if delivery fails
3. Send webhooks for delivery status

## Step 7: Set Up Webhooks

Webhooks notify your application about email events in real-time.

### Configure Webhook URL

#### Via Web Interface:
1. Go to **Settings → Webhooks**
2. Enter your webhook URL (e.g., `https://your-app.com/webhooks`)
3. Select events you want to receive
4. Save settings

![Webhooks Configuration](/img/screenshots/05-webhooks-config.png)
*Webhooks configuration page in EmailEngine settings*

#### Via API:

Use the [update settings API](/docs/api/post-v-1-settings):

```bash
$ curl -XPUT "http://127.0.0.1:3000/v1/settings" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhooks"
  }'
```

### Test Webhooks with Webhook.site

For testing, use [webhook.site](https://webhook.site) to see webhook payloads:

1. Go to https://webhook.site - you'll get a unique URL
2. Copy the URL (e.g., `https://webhook.site/abc-123-def`)
3. Set it as your webhook URL in EmailEngine
4. Send a test email (Step 6)
5. Check webhook.site to see the delivery notifications

### Example Webhook Events

**New Email Received:**

![Webhook: messageNew Event](/img/examples/webhook-message-new.png)
*Example webhook payload when a new email is received*

```json
{
  "account": "my-account",
  "event": "messageNew",
  "data": {
    "id": "AAAAAQAACnA",
    "uid": 1234,
    "subject": "Meeting tomorrow",
    "from": {
      "name": "John Doe",
      "address": "john@example.com"
    },
    "date": "2025-01-15T10:30:00.000Z",
    "intro": "Thanks for scheduling the meeting..."
  }
}
```

**Email Sent Successfully:**

![Webhook: messageSent Event](/img/examples/webhook-message-sent.png)
*Example webhook payload when an email is successfully sent*

```json
{
  "account": "my-account",
  "event": "messageSent",
  "data": {
    "messageId": "<unique-id@example.com>",
    "queueId": "abc123def456",
    "response": "250 2.0.0 OK: queued as A1B2C3"
  }
}
```

**Email Delivery Failed:**
```json
{
  "account": "my-account",
  "event": "messageDeliveryError",
  "data": {
    "queueId": "abc123def456",
    "messageId": "<unique-id@example.com>",
    "error": "Connection timeout",
    "job": {
      "attemptsMade": 1,
      "attempts": 10,
      "nextAttempt": "2025-01-15T10:35:00.000Z"
    }
  }
}
```

## Step 8: List Incoming Messages

Retrieve messages from the mailbox using the [list messages API](/docs/api/get-v-1-account-account-messages):

```bash
$ curl "http://127.0.0.1:3000/v1/account/my-account/messages?path=INBOX&pageSize=10" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}"
```

**Response:**

![List Messages API Response](/img/examples/api-list-messages.png)
*Example API response showing list of messages*

```json
{
  "total": 1234,
  "page": 0,
  "pages": 124,
  "messages": [
    {
      "id": "AAAAAQAACnA",
      "uid": 1234,
      "subject": "Meeting tomorrow",
      "from": {
        "name": "John Doe",
        "address": "john@example.com"
      },
      "date": "2025-01-15T10:30:00.000Z",
      "intro": "Thanks for scheduling...",
      "flags": ["\\Seen"],
      "labels": []
    }
  ]
}
```

![Messages List UI](/img/screenshots/13-messages-list.png)
*Messages list view in the EmailEngine web interface*

## Step 9: Read a Specific Message

Get full message content including body and attachments using the [get message API](/docs/api/get-v-1-account-account-message-message):

```bash
$ curl "http://127.0.0.1:3000/v1/account/my-account/message/AAAAAQAACnA" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}"
```

## Step 10: Search Messages

Search for messages matching specific criteria using the [search messages API](/docs/api/post-v-1-account-account-search):

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/account/my-account/search" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "from": "john@example.com",
      "subject": "meeting"
    }
  }'
```

## Congratulations!

You've successfully:
- [YES] Installed and started EmailEngine
- [YES] Added your first email account
- [YES] Sent an email via API
- [YES] Configured webhooks
- [YES] Retrieved and searched messages

### Set Up OAuth2
- **[Gmail OAuth2 Setup](/docs/accounts/gmail-imap)** - Complete guide with screenshots
- **[Outlook OAuth2 Setup](/docs/accounts/outlook-365)** - Azure AD configuration
- **[OAuth2 Token Management](/docs/accounts/oauth2-token-management)** - Use tokens for other APIs

### Production Deployment
- **[Docker Deployment](/docs/deployment/docker)** - Production Docker setup
- **[Environment Variables](/docs/configuration/environment-variables)** - Complete configuration reference
- **[Performance Tuning](/docs/advanced/performance-tuning)** - Optimize for high volume
- **[Security Best Practices](/docs/deployment/security)** - Secure your deployment

### Integration Examples
- **[CRM Integration](/docs/integrations/crm)** - Complete architecture guide
- **[AI/ChatGPT Integration](/docs/integrations/ai-chatgpt)** - Email summaries and analysis
- **[PHP Integration](/docs/integrations/php)** - Using the PHP library

## Get Help

- **[Documentation](/docs)** - Complete guides and API reference
- **[Troubleshooting Guide](/docs/troubleshooting)** - Common issues and solutions
- **[GitHub Issues](https://github.com/postalsys/emailengine/issues)** - Report bugs
- **[Support](/docs/support/license)** - Get professional help

## Common Provider-Specific Notes

### Gmail
- **OAuth2 recommended:** Use OAuth2 instead of username/password
- **App passwords:** If using password auth, generate an app-specific password
- **Less secure apps:** OAuth2 apps require verification if sending to many users
- [Complete Gmail setup →](/docs/accounts/gmail-imap)

### Outlook/Microsoft 365
- **OAuth2 required:** Password authentication is deprecated for personal accounts
- **Azure AD setup:** Requires app registration in Azure portal
- **Permissions:** Need both IMAP and SMTP permissions or use Graph API
- [Complete Outlook setup →](/docs/accounts/outlook-365)

### Yahoo Mail
- **App password required:** Generate at account.yahoo.com
- **IMAP/SMTP settings:** Same as table above
- **Rate limits:** Yahoo has aggressive rate limiting

### ProtonMail
- **Bridge required:** ProtonMail requires the ProtonMail Bridge app
- **Local server:** Bridge runs on localhost with custom ports
- **Security:** Bridge handles encryption/decryption
