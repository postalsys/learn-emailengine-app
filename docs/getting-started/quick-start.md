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

# Start EmailEngine (default Redis database is 8)
$ ./emailengine --dbs.redis="redis://127.0.0.1:6379/8"
```

### Option B: Using Docker

```bash
# Pull the latest version
$ docker pull postalsys/emailengine:v2

# Run EmailEngine
$ docker run -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379/8" \
  postalsys/emailengine:v2
```

EmailEngine will start on **http://localhost:3000**

## Step 2: Access the Web Interface

1. Open your browser and navigate to **http://localhost:3000**
2. On first startup, you'll be prompted to create an admin account
3. Set a secure password for the web admin UI

![EmailEngine Web Interface](/img/screenshots/01-dashboard-main.png)
_EmailEngine dashboard showing system statistics and account overview_

## Step 3: Generate an API Access Token

You need an access token to authenticate API requests.

### Via CLI (Recommended):

Use the EmailEngine CLI to generate a full-access token:

```bash
$ emailengine tokens issue -d "Development" -s "*" --dbs.redis="redis://127.0.0.1:6379/8"
8bf639ec7c051c3963498c6757b6813bd331afeb677886d4473190fae66c9fab
```

Save your token as an environment variable:

```bash
$ export EMAILENGINE_TOKEN="8bf639ec7c051c3963498c6757b6813bd331afeb677886d4473190fae66c9fab"
```

**Benefits of CLI tokens:**

- Full system access (all scopes)
- Can access system-wide endpoints (settings, metrics, etc.)
- Not bound to specific email accounts
- Recommended for development and production API access

### Via Web Interface:

1. Navigate to **Access Tokens** in the sidebar menu
2. Click **Create new**
3. Provide a name (e.g., "Development")
4. Select scopes (use `*` for full access)
5. Click **Generate a token**
6. Copy the token immediately - it's shown only once

:::info Account-Scoped Tokens
The [Create Access Token API](/docs/api/post-v-1-token) generates account-scoped tokens that are limited to specific email accounts. For full system access, use the CLI or web interface.
:::

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

1. Your application generates an authentication form URL via the API:

   ```bash
   curl -XPOST "http://127.0.0.1:3000/v1/authentication/form" \
     -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "account": "user123",
       "redirectUrl": "https://your-app.com/callback"
     }'
   ```

2. Redirect the user's browser to the generated form URL

3. User chooses authentication method:

   ![Account type selection page with OAuth2 and IMAP options](/img/screenshots/03-account-type-selection.png)
   _Account type selection page showing OAuth2 provider buttons and standard IMAP option_

   - **OAuth2 Provider** (Gmail/Outlook): Clicks provider button, follows OAuth2 flow
   - **IMAP/SMTP**: Enters email/password, EmailEngine auto-detects server settings

4. After authentication, user is redirected back to your `redirectUrl`

5. EmailEngine handles token management and maintains the connection automatically

:::info OAuth2 Setup Required
OAuth2 provider buttons (Gmail, Outlook) only appear if OAuth2 apps are configured in EmailEngine. Set these up via **Configuration → OAuth2 Apps** in the web interface, or use the [OAuth2 Apps API](/docs/api/oauth2-applications). See [Gmail OAuth2 Setup](/docs/accounts/gmail-imap) and [Outlook OAuth2 Setup](/docs/accounts/outlook-365) for detailed configuration guides.
:::

:::tip Admin Testing
For testing during development, admins can use the web interface: navigate to **Email Accounts** → **Add an account**. This is a convenience wrapper for the same authentication form.
:::

![Accounts List](/img/screenshots/02-accounts-list.png)
_Email Accounts page showing empty account list with "Add an account" button_

![Add Account Form](/img/screenshots/04-account-add-form.png)
_Auto-detected IMAP/SMTP configuration showing server settings, ports, and TLS options_

**When to use the hosted form:**

- Quick account setup during development
- End-user account authentication in your application
- When you don't need programmatic control over OAuth2 tokens

:::tip Using in Your Application
You can redirect users to the hosted authentication form from your application. The form will redirect users to the OAuth2 provider's permission page (which must open in a main window, not an iframe due to security restrictions). After authentication, users are redirected back to your application. See the [Authentication Form API](/docs/api/post-v-1-authentication-form) for details.
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

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/account" \
  -H "Authorization: Bearer ${EMAILENGINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-gmail",
    "name": "Your Name",
    "email": "you@gmail.com",
    "oauth2": {
      "provider": "AAABlf_0iLgAAAAQ",
      "refreshToken": "1//0...",
      "auth": {
        "user": "you@gmail.com"
      }
    }
  }'
```

:::info Provider ID
The `provider` value should be your OAuth2 application ID from EmailEngine, which is a base64url encoded string like `AAABlf_0iLgAAAAQ`. Find this in **Configuration → OAuth2 Apps**.
:::

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
      "provider": "AAABlf_0iLgAAAAQ",
      "refreshToken": "M.C546_...",
      "auth": {
        "user": "you@outlook.com"
      }
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

| Provider    | IMAP Host             | IMAP Port | SMTP Host           | SMTP Port |
| ----------- | --------------------- | --------- | ------------------- | --------- |
| Gmail       | imap.gmail.com        | 993       | smtp.gmail.com      | 465       |
| Outlook.com | outlook.office365.com | 993       | smtp.office365.com  | 587       |
| Yahoo       | imap.mail.yahoo.com   | 993       | smtp.mail.yahoo.com | 465       |
| Fastmail    | imap.fastmail.com     | 993       | smtp.fastmail.com   | 465       |

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
    "initialized": true
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
  "connections": 4,
  "lastError": null
}
```

Key fields to check:

- `state`: Should be `"connected"` (other values: `"init"`, `"connecting"`, `"authenticationError"`, `"connectError"`)
- `connections`: Number of active IMAP connections (should be > 0 when connected)
- `lastError`: Should be `null` if no errors occurred

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
_Webhooks configuration page in EmailEngine settings_

#### Via API:

Use the [update settings API](/docs/api/post-v-1-settings):

```bash
$ curl -XPOST "http://127.0.0.1:3000/v1/settings" \
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

### Set Up OAuth2

- **[Gmail OAuth2 Setup](/docs/accounts/gmail-imap)** - Complete guide with screenshots
- **[Outlook OAuth2 Setup](/docs/accounts/outlook-365)** - Azure AD configuration
- **[OAuth2 Token Management](/docs/accounts/oauth2-token-management)** - Use tokens for other APIs

### Production Deployment

- **[Docker Deployment](/docs/deployment/docker)** - Production Docker setup
- **[Environment Variables](/docs/configuration/environment-variables)** - Configuration Reference
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

- **Account passwords disabled:** Gmail has completely disabled account password authentication
- **App passwords required:** Must enable 2FA and generate an app-specific password
- **OAuth2 recommended:** OAuth2 provides the best experience (automatic token refresh)
- **OAuth2 verification:** Public OAuth2 apps require verification if sending to many users
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
