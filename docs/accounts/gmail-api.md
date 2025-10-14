---
title: Setting Up Gmail API
sidebar_position: 3
description: Configure EmailEngine to use Gmail REST API as the email backend with Cloud Pub/Sub webhooks
---

<!--
Sources merged:
- blog/2025-09-08-setting-up-gmail-api-access.md (primary - detailed step-by-step)
- blog/2024-07-08-gmail-api-support-in-emailengine.md (Gmail API benefits and considerations)
-->

# Setting Up Gmail API

This guide shows you how to configure EmailEngine to use Gmail REST API as the email backend instead of IMAP/SMTP. With this setup, EmailEngine uses direct Gmail API calls for all operations and receives change notifications via Google Cloud Pub/Sub.

:::info IMAP vs Gmail API
In a [previous guide](./gmail-imap), we showed how to configure EmailEngine to access Gmail over OAuth2 using IMAP and SMTP. That setup uses Gmail OAuth2 **only for generating access tokens** to authenticate IMAP/SMTP sessions.

This guide covers using **Gmail REST API directly** as the email backend. EmailEngine does not open IMAP or SMTP sessions and instead performs all operations via Gmail REST API calls.
:::

## Why Use Gmail API Instead of IMAP?

Starting with v2.43.0, EmailEngine can operate Gmail mailboxes through the Gmail API, offering several advantages over IMAP/SMTP:

### Benefits of Gmail API

**Faster Performance:**
- Batch requests fetch entire messages in single API calls
- No sequential IMAP FETCH commands needed
- Reduced latency for high-volume operations

**Better Label Handling:**
- Gmail's native label system works naturally
- No folder/label translation layer needed
- Multiple labels per message handled correctly

**Reliable Push Notifications:**
- Cloud Pub/Sub provides true push webhooks
- No IMAP IDLE reconnections every few minutes
- Lower CPU usage and connection overhead

**Gmail-Specific Features:**
- Access to Gmail drafts API
- Better threading support
- Native Gmail search capabilities

**No Connection Limits:**
- IMAP limits ~15 concurrent connections
- Gmail API uses RESTful requests
- Better scalability for high-volume accounts

### When to Stick with IMAP

IMAP/SMTP remains the better choice if:

- Your organization restricts Cloud Pub/Sub permissions
- You need raw SMTP features (e.g., custom envelope-from)
- You want to avoid additional GCP setup complexity
- You're migrating existing IMAP-based integrations

The IMAP backend continues to receive full support and performance improvements.

## Prerequisites

- A Google account with access to Google Cloud Console
- Access to create and configure Google Cloud projects
- EmailEngine v2.43.0 or newer
- EmailEngine instance running and accessible

## Overview of Setup Steps

Setting up Gmail API requires more steps than IMAP because you need:

1. A regular OAuth2 app for user authentication
2. A service account for managing Cloud Pub/Sub
3. Cloud Pub/Sub API enabled for webhook notifications

Don't worry—this guide walks through everything step by step.

## Step 1: Create a Google Cloud Project

Go to [Google Cloud Console](https://console.cloud.google.com/) and open the project menu in the top navbar.

![Creating a new Google Cloud project](https://cldup.com/6V0B1AgnvU.gif)
<!-- Shows: Clicking "New project" button from project selector -->

Click the "New project" button to start.

![Naming your project](https://cldup.com/owSQLNV1_5.gif)
<!-- Shows: Project creation form with name field -->

Name your project (e.g., "EmailEngine Gmail API").

![Waiting for project creation](https://cldup.com/0B4b3JeP3t.gif)
<!-- Shows: Project creation progress and selection -->

Wait for the project to be created, then select it from the project menu.

## Step 2: Enable Required APIs

Click the hamburger menu (top-left) → **APIs & Services** → **Enabled APIs & Services**.

![Navigating to APIs & Services](https://cldup.com/v3Flo-WBVG.gif)
<!-- Shows: Navigation to API configuration -->

### Enable Gmail API

Find and enable **Gmail API** for your project.

![Enabling Gmail API](https://cldup.com/vz7Is1SAWe.gif)
<!-- Shows: Searching for and enabling Gmail API -->

This allows EmailEngine to perform Gmail REST API requests.

### Enable Cloud Pub/Sub API

Also find and enable **Cloud Pub/Sub API**.

![Enabling Cloud Pub/Sub API](https://cldup.com/KwfF06xSzN.gif)
<!-- Shows: Searching for and enabling Cloud Pub/Sub API -->

:::info Why Cloud Pub/Sub?
Gmail pushes change notifications (new messages, flag changes, etc.) to Google's Pub/Sub system, not directly to EmailEngine. EmailEngine sets up a Pub/Sub topic and subscription to receive these notifications and convert them into webhooks for your application.

Without Pub/Sub, EmailEngine would not know when changes occur on the email account and couldn't send real-time webhook notifications.
:::

## Step 3: Configure OAuth Consent Screen

The consent screen is shown to users when they authorize EmailEngine.

Click hamburger menu → **APIs & Services** → **OAuth consent screen**.

![Navigating to consent screen](https://cldup.com/0h3kuzzsCN.gif)
<!-- Shows: Navigation to OAuth consent screen -->

### Choose User Type

![Selecting user type](https://cldup.com/mT6n2spEgt.gif)
<!-- Shows: Internal vs External selection -->

**Internal:**
- Only accounts from your Google Workspace organization
- No verification process required
- Best for testing and enterprise apps

**External:**
- Any Gmail user can authenticate
- Requires verification for production
- Best for public applications

For this tutorial, we'll use **Internal**. For production, select **External** and complete Google's verification process.

### Fill in App Information

![Configuring consent screen details](https://cldup.com/FIRIMzunwz.gif)
<!-- Shows: Filling app name, support email, etc. -->

Provide:
- **App name**: "EmailEngine" (or your application name)
- **User support email**: Your email address
- **Developer contact information**: Your email address
- **Application home page**: Your EmailEngine instance URL

Click **Save and continue**.

### Configure Scopes

Click **Add or remove scopes** and find `gmail.modify` from the list.

![Adding required scope](https://cldup.com/BONjtoR9p6.gif)
<!-- Shows: Adding gmail.modify scope -->

Check `gmail.modify` and click **Update**.

:::important Required Scope
The `gmail.modify` scope is required for Gmail API access. This is different from the `https://mail.google.com/` scope used for IMAP/SMTP.

If Google's verification process determines you need different scopes (e.g., `gmail.readonly`, `gmail.send`, `gmail.labels`), see the [Custom Scopes section](#using-custom-scopes) below.
:::

![Saving consent screen configuration](https://cldup.com/THYy7q5W6Z.gif)
<!-- Shows: Saving and continuing -->

Scroll down and click **Save and continue** to finish consent screen setup.

## Step 4: Create OAuth Credentials for User Authentication

Navigate to **APIs & Services** → **Credentials**.

![Navigating to credentials page](https://cldup.com/7bDFveWih1.gif)
<!-- Shows: Navigation to credentials -->

Click **Create credentials** → **OAuth client ID**.

![Creating OAuth client ID](https://cldup.com/dd27iNGkH0.gif)
<!-- Shows: Creating OAuth client ID -->

### Configure OAuth Client

![Configuring OAuth client details](https://cldup.com/5gMPcI0kJe.gif)
<!-- Shows: Setting application type and URIs -->

**Application type:** Web application

**Authorized JavaScript origins:**
Add your EmailEngine URL:
- `http://127.0.0.1:3000` (for local testing)
- `https://your-emailengine-domain.com` (for production)

**Authorized redirect URIs:**
Add your EmailEngine URL with `/oauth`:
- `http://127.0.0.1:3000/oauth`
- `https://your-emailengine-domain.com/oauth`

Click **Create**.

### Download User Credentials

![Downloading OAuth credentials](https://cldup.com/4UhRTwH9yL.gif)
<!-- Shows: Downloading credentials JSON file -->

Click the **Download** button. Save this file—you'll need it to configure EmailEngine.

:::tip Credential File Names
- **User OAuth credentials**: Filename starts with `client_secret_`
- **Service account credentials**: Uses service account name prefix

Keep these separate—you'll need both!
:::

## Step 5: Create Service Account for Pub/Sub Management

EmailEngine needs a service account with permissions to manage Pub/Sub topics and subscriptions.

On the **Credentials** page, navigate to the **Service Account management** page.

![Navigating to service accounts](https://cldup.com/FztCvZP6it.gif)
<!-- Shows: Clicking "Manage service accounts" -->

Click **Create Service Account**.

### Configure Service Account

![Creating service account](https://cldup.com/M5HVdcmnY8.gif)
<!-- Shows: Service account creation form -->

**Service account name:** Choose any name (e.g., "EmailEngine Pub/Sub Manager")

**Role:** Select **Pub/Sub Admin** (or a compatible role that allows managing Pub/Sub queues, topics, and IAM policies)

:::important Required Permissions
The service account must have permissions to:
- Create and delete Pub/Sub topics
- Create and delete Pub/Sub subscriptions
- Manage IAM policies for Pub/Sub resources

The "Pub/Sub Admin" role provides all necessary permissions.
:::

Click **Create** to finish.

### Generate Service Account Keys

Once created, select the service account and navigate to **Manage Keys**.

![Generating service account keys](https://cldup.com/VtJcozUfxY.gif)
<!-- Shows: Adding a new JSON key -->

Click **Add key** → **Create new key** → **JSON format**.

The key file will automatically download. Store it securely—you cannot download it again.

## Step 6: Configure EmailEngine - Service Account

Now configure EmailEngine to use the service account for managing webhooks.

### Add Gmail Service Account Application

![Creating service account app in EmailEngine](https://cldup.com/YvOpC3QjWZ.gif)
<!-- Shows: Creating Gmail Service Account in EmailEngine -->

1. Open EmailEngine dashboard
2. Navigate to **Configuration** → **OAuth2**
3. Click **Add application**
4. Select **Gmail Service Accounts**

### Configure Service Account Settings

![Configuring service account](https://cldup.com/OfoPs4TldB.gif)
<!-- Shows: Uploading service account credentials -->

**Application name:** Give it a descriptive name (e.g., "Gmail Pub/Sub Manager")

**Credentials file:** Select the **service account** JSON file (not the user OAuth credentials!)

**Base scope:** Select **Cloud Pub/Sub**

:::warning Use Correct Credentials File
Make sure you're uploading the **service account** credentials file, not the user OAuth credentials file. You can tell them apart:
- **Service account**: Filename uses service account name prefix
- **User OAuth**: Filename starts with `client_secret_`
:::

Click **Register app** to save.

## Step 7: Configure EmailEngine - User OAuth

Now configure the user OAuth application that will authenticate Gmail accounts.

### Add Gmail OAuth2 Application

![Creating Gmail OAuth2 app](https://cldup.com/cJspELPMDV.gif)
<!-- Shows: Creating Gmail OAuth2 application in EmailEngine -->

1. Navigate to **Configuration** → **OAuth2**
2. Click **Add application**
3. Select **Gmail**

### Configure OAuth2 Settings

![Configuring Gmail OAuth2 settings](https://cldup.com/vj8qeSQt6D.gif)
<!-- Shows: Uploading user credentials and selecting service account -->

**Application name:** Give it a descriptive name (e.g., "Gmail API OAuth2")

**Enable this app:** Check this box

**Credentials file:** Select the **user OAuth credentials** file (`client_secret_...json`)

**Redirect URL:** Verify this matches exactly what you entered in Google Cloud Console

**Base scope:** Select **Gmail API**

**Service Account for managing webhook Pub/Sub:** Select the service account app you created earlier

:::important Link Service Account
You must select the service account application you created in Step 6. This tells EmailEngine which credentials to use for managing Pub/Sub resources.
:::

Click **Register app** to save.

## Step 8: Test the Setup

Add a Gmail account to test the complete flow.

### Via Hosted Authentication Form

![Testing with hosted authentication](https://cldup.com/5OA36VmtxU.gif)
<!-- Shows: Using hosted authentication form -->

1. In EmailEngine, click **Add account**
2. Click **Sign in with Google**
3. Complete the OAuth2 consent flow
4. EmailEngine will:
   - Store OAuth2 tokens
   - Create a Pub/Sub topic and subscription
   - Start receiving webhook notifications

### Via API

Generate an authentication form URL:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "user@gmail.com",
    "redirectUrl": "https://myapp.com/settings"
  }'
```

Direct the user to the returned URL.

### Verify Setup

Check the account status in EmailEngine:
- Account should enter "connected" state
- In Google Cloud Console → Pub/Sub, you should see:
  - A new topic (created by EmailEngine)
  - A new subscription (created by EmailEngine)

## Using Custom Scopes

If you have a public OAuth2 application and Google requires narrower scopes than `gmail.modify`, you can configure custom scopes.

For example, if Google requires:
- `gmail.readonly`
- `gmail.send`
- `gmail.labels`

### Configure Custom Scopes in EmailEngine

In the Gmail OAuth2 application form in EmailEngine, scroll to the bottom to find:

**Additional scopes:** Add your preferred scopes:
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.labels
```

**Disabled scopes:** Add `gmail.modify` to disable it:
```
https://www.googleapis.com/auth/gmail.modify
```

![Custom scopes configuration](https://cldup.com/content/images/2025/02/Screenshot-2025-02-25-at-10.12.54.png)
<!-- Shows: OAuth permission screen with custom scopes -->

When users authenticate, the permissions screen will only request the selected scopes.

## Troubleshooting

### OAuth2 Application Settings Show Errors

Check for:
- **Invalid credentials**: Re-download credentials from Google Cloud Console
- **Mismatched redirect URL**: Must match exactly between Google and EmailEngine
- **Wrong credentials file**: Ensure you're using the correct file (user vs service account)

### Account Fails to Connect

Common issues:
- **Pub/Sub API not enabled**: Verify Cloud Pub/Sub API is enabled in Google Cloud Console
- **Service account permissions**: Ensure service account has Pub/Sub Admin role
- **Wrong base scope**: Must select "Gmail API" not "IMAP and SMTP"

### Webhooks Not Firing

Check:
- **Pub/Sub subscription exists**: Look in Google Cloud Console → Pub/Sub
- **Subscription is active**: EmailEngine should show connection status
- **Webhook URL reachable**: Verify your webhook endpoint is accessible
- **Check webhook queue**: Use EmailEngine's Bull Board to inspect webhook jobs

### "Invalid Grant" Errors

This usually means:
- OAuth2 tokens are invalid or expired
- User revoked access
- OAuth app credentials changed

**Solution:** Have the user re-authenticate.

## Performance Considerations

### Gmail API Rate Limits

Gmail API has generous quotas but they exist:

**Default Quotas:**
- 1 billion quota units per day
- 250 quota units per user per second

**Typical Operations:**
- List messages: 5 units
- Get message: 5 units
- Send message: 100 units
- Modify message: 5 units

**Best Practices:**
- Use batch requests where possible
- Implement exponential backoff on rate limit errors
- Monitor quota usage in Google Cloud Console

### Pub/Sub Costs

Google Cloud Pub/Sub is not free:

**Pricing (approximate):**
- First 10 GB/month: Free
- Additional data: $40/TB
- Message storage: $0.27/GB/month

**For typical EmailEngine usage:**
- Costs are minimal for most deployments
- High-volume accounts may incur charges
- Monitor usage in Google Cloud Console billing

### Scaling Considerations

Gmail API scales better than IMAP for high-volume accounts:
- No connection limit (IMAP limited to ~15 connections)
- Batch operations reduce API calls
- True push notifications (no polling)

## IMAP vs Gmail API Feature Comparison

| Feature | IMAP/SMTP | Gmail API |
|---------|-----------|-----------|
| **Setup Complexity** | Simple | Moderate (needs Pub/Sub) |
| **Performance** | Good | Excellent |
| **Label Support** | Mapped to folders | Native |
| **Push Notifications** | IDLE (reconnects often) | Cloud Pub/Sub (true push) |
| **Connection Limits** | ~15 per account | None (REST API) |
| **Gmail-Specific Features** | Limited | Full access |
| **Works with other providers** | Yes | No (Gmail only) |
| **Cost** | Free | Pub/Sub costs |

## Production Considerations

### Security Audit for Public Apps

If you need a public app for any Gmail user:

**Requirements:**
1. **Security audit**: OWASP compliance, penetration testing
2. **Use case validation**: Google may reject certain use cases
3. **Minimum scopes**: Google may require narrower scopes

**Process:**
- Expensive and time-consuming
- May require custom scope configuration
- Not all email use cases will be approved

**Alternatives:**
- Use Internal apps (Google Workspace only)
- Use IMAP/SMTP with app passwords
- Consider if narrower scopes work for your use case

### Managing Pub/Sub Resources

EmailEngine automatically:
- Creates Pub/Sub topics for each account
- Creates subscriptions to receive notifications
- Cleans up resources when accounts are deleted
- Renews subscriptions before expiration (7 days)

You can:
- Monitor Pub/Sub usage in Google Cloud Console
- Set up billing alerts for Pub/Sub costs
- View subscription status in EmailEngine

### Token Management

EmailEngine automatically:
- Refreshes access tokens before expiration
- Stores refresh tokens securely
- Re-authenticates on token failures

You can:
- Retrieve current access tokens for other Google API calls
- Monitor token status via account state
- Revoke access by deleting the account

[Learn more about OAuth2 token management →](./oauth2-token-management)

## Next Steps

- [Set up Gmail IMAP for simpler configuration](./gmail-imap)
- [Configure Google Service Accounts for Google Workspace](./google-service-accounts)
- [Learn about OAuth2 token management](./oauth2-token-management)
- [Explore performance tuning options](/docs/advanced/performance-tuning)
- [Troubleshoot account issues](./troubleshooting)

## See Also

- [OAuth2 Configuration Documentation](/docs/configuration/oauth2-configuration)
- [Setting Up Outlook OAuth2](./outlook-365)
- [Gmail IMAP Setup](./gmail-imap)
- [Hosted Authentication Guide](/docs/usage/hosted-authentication)
- [API Reference: Add Account](/docs/api/post-v-1-account)
