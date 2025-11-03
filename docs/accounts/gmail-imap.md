---
title: Setting Up Gmail with OAuth2 (IMAP/SMTP)
sidebar_position: 2
description: Complete guide to setting up Gmail accounts with OAuth2 authentication for IMAP and SMTP access
---

<!--
Sources merged:
- blog/2024-05-09-setting-up-gmail-oauth2-for-imap-api.md (primary - detailed step-by-step)
- docs/integrations/gmail-over-imap.md (secondary - structured steps)
- blog/2024-07-01-emailengine-and-gmail.md (Gmail-specific notes and considerations)
-->

# Setting Up Gmail with OAuth2 (IMAP/SMTP)

This guide shows you how to set up a Gmail OAuth2 application for IMAP and SMTP access with EmailEngine. EmailEngine will use these credentials to access Gmail accounts and allow REST queries against these accounts.

:::tip
This post covers setting up Gmail OAuth2 for IMAP and SMTP. If you would like to use Gmail API instead, see the [Gmail API setup guide](./gmail-api).
:::

:::caution Screenshots may be outdated
There are many screenshots in this guide. While the general process has remained stable for years, Google may update their interface, so some screenshots might not exactly match what you see.
:::

## Overview

When you enable OAuth2 for Gmail with IMAP/SMTP:

- EmailEngine uses **IMAP** for reading emails and **SMTP** for sending
- Gmail API is enabled but **only used to generate OAuth2 access tokens** for IMAP/SMTP authentication
- Users authenticate once via OAuth2, and EmailEngine automatically refreshes tokens
- No passwords are stored, and 2FA accounts work seamlessly

## Authentication Options for Gmail

Before we dive into OAuth2 setup, it's worth understanding all Gmail authentication options:

### Account Password

:::warning Deprecated for personal Gmail
Google has disabled password authentication for regular Gmail accounts. It's still available for Google Workspace accounts without 2FA (until September 30, 2024), but OAuth2 is the recommended approach.
:::

Account passwords are the main password for your Google account. To use them:

1. Navigate to [Google account management](https://myaccount.google.com/lesssecureapps)
2. Enable "Less secure app access"
3. You may need to [unlock your account](https://accounts.google.com/b/0/displayunlockcaptcha) if authentication fails

**Not recommended** - Use OAuth2 or app passwords instead.

### App Passwords

If you have 2FA enabled and just need quick access for testing:

1. App passwords are only available with 2FA enabled
2. Generate an [application-specific password](https://support.google.com/accounts/answer/185833)
3. Use this password instead of your main password

**Downsides:**
- If main password changes, all app passwords are invalidated
- Users must manually generate and provide passwords
- Not ideal for SaaS applications

### OAuth2 (This Guide)

OAuth2 provides the best experience for production applications:

**Benefits:**
- No password storage
- Works with 2FA accounts
- Automatic token refresh
- Better security
- Seamless user experience

**Types of OAuth2 Apps:**

1. **Internal Apps** - For Google Workspace organizations only
   - No security audit required
   - Only works for accounts in your organization
   - Best for enterprise deployments

2. **Public Development Apps**
   - Up to 100 manually whitelisted accounts
   - OAuth2 grants expire after 7 days
   - Not suitable for production

3. **Public Production Apps**
   - Works with any Gmail account
   - Requires thorough security audit (expensive and time-consuming)
   - Strict scope requirements
   - Google may reject email-access use cases

**Recommendation:** Use Internal apps for organizations, app passwords for testing, and OAuth2 for production if you can pass Google's audit.

## Step 1: Create a Google Cloud Project

Go to [Google Cloud Console](https://console.cloud.google.com/) and open the project menu in the top navbar.

![Creating a new Google Cloud project](/img/external/6V0B1AgnvU.gif)
<!-- Shows: Clicking "New project" button from project selector -->

Click the "New project" button to start.

![Naming your project](/img/external/owSQLNV1_5.gif)
<!-- Shows: Project creation form with name field -->

On the project settings screen, name your project (e.g., "EmailEngine"). All other fields are pre-filled and cannot be changed.

![Waiting for project creation](/img/external/0B4b3JeP3t.gif)
<!-- Shows: Project creation progress and selection -->

Wait for the project to be created, then select it from the project menu.

## Step 2: Enable Required APIs

Your new project is empty and needs API access configured.

Click the hamburger menu (top-left) → **APIs & Services** → **Enabled APIs & Services**.

![Navigating to APIs & Services](/img/external/v3Flo-WBVG.gif)
<!-- Shows: Navigation to API configuration -->

Find and enable **Gmail API** for your project.

![Enabling Gmail API](/img/external/vz7Is1SAWe.gif)
<!-- Shows: Searching for and enabling Gmail API -->

:::info Why Enable Gmail API for IMAP?
Enabling Gmail API means your project can access Gmail email accounts regardless of protocol. EmailEngine uses IMAP and SMTP for actual email operations, and Gmail API is **only used to generate OAuth2 access tokens** for authenticating those IMAP/SMTP sessions.

If you want to use Gmail REST API instead of IMAP/SMTP, see the [Gmail API setup guide](./gmail-api).
:::

:::tip IMAP vs Gmail API
- **IMAP/SMTP** (this guide): Standard email protocols, easier setup, works like any other email account
- **Gmail API** (alternate): Faster, Gmail-specific features (labels, drafts), requires Cloud Pub/Sub setup

For most use cases, IMAP/SMTP with OAuth2 is sufficient. Use Gmail API only if you need maximum performance or Gmail-specific features.
:::

## Step 3: Configure OAuth Consent Screen

The consent screen is shown to users when they authorize EmailEngine to access their Gmail account.

Click hamburger menu → **APIs & Services** → **OAuth consent screen**.

![Navigating to consent screen](/img/external/0h3kuzzsCN.gif)
<!-- Shows: Navigation to OAuth consent screen -->

### Choose User Type

![Selecting user type](/img/external/mT6n2spEgt.gif)
<!-- Shows: Internal vs External selection -->

**Internal:**
- Only accounts from your Google Workspace organization
- No verification process required
- Cannot add @gmail.com accounts or other organizations
- Best for testing and enterprise apps

**External:**
- Any Gmail user can authenticate
- Requires verification for production
- Best for public applications
- More complex approval process

For this tutorial, we'll use **Internal**. For production public apps, select **External** and follow Google's verification process.

### Fill in App Information

![Configuring consent screen details](/img/external/FIRIMzunwz.gif)
<!-- Shows: Filling app name, support email, etc. -->

Provide:
- **App name**: "EmailEngine" (or your application name)
- **User support email**: Your email address
- **Developer contact information**: Your email address
- **Application home page**: Your EmailEngine instance URL (e.g., `http://127.0.0.1:3000`)

Click **Save and continue**.

### Configure Scopes

Click **Add or remove scopes** and find `https://mail.google.com/` from the list.

![Adding required scope](/img/external/BONjtoR9p6.gif)
<!-- Shows: Adding https://mail.google.com/ scope -->

:::important Required Scope for IMAP/SMTP
The `https://mail.google.com/` scope is **required for IMAP and SMTP access**.

If you were using Gmail REST API instead (covered in a different guide), the scope would be `gmail.modify`.
:::

Check the scope and click **Update** to apply changes.

Scroll down and click **Save and continue** to finish consent screen setup.

## Step 4: Create OAuth Credentials

Navigate to **APIs & Services** → **Credentials**, then click **Create Credentials** → **OAuth client ID**.

![Creating OAuth credentials](/img/external/dd27iNGkH0.gif)
<!-- Shows: Creating OAuth client ID -->

### Configure OAuth Client

![Configuring OAuth client details](/img/external/5gMPcI0kJe.gif)
<!-- Shows: Setting application type and URIs -->

**Application type:** Web application

**Authorized JavaScript origins:**
Add your EmailEngine URL without any path:
- `http://127.0.0.1:3000` (for local testing)
- `https://your-emailengine-domain.com` (for production)

**Authorized redirect URIs:**
Add your EmailEngine URL with the `/oauth` path:
- `http://127.0.0.1:3000/oauth` (for local testing)
- `https://your-emailengine-domain.com/oauth` (for production)

:::warning Redirect URL Must Match Exactly
The redirect URL you enter here must **exactly match** the URL you'll configure in EmailEngine later. Mismatches will cause OAuth flow failures.
:::

Click **Create**.

### Download Credentials

![Downloading OAuth credentials](/img/external/4UhRTwH9yL.gif)
<!-- Shows: Downloading credentials JSON file -->

Click the **Download** button to save the credentials JSON file. You'll need this file to configure EmailEngine.

## Step 5: Configure EmailEngine

Now that you have your Google Cloud project configured, let's set up EmailEngine to use these credentials.

### Add OAuth2 Application in EmailEngine

1. Open your EmailEngine dashboard
2. Navigate to **Configuration** → **OAuth2**
3. Click **Add application** and select **Gmail**

![Creating Gmail OAuth2 app in EmailEngine](/img/external/tg5rojB4ov.gif)
<!-- Shows: Navigating to OAuth2 configuration in EmailEngine -->

### Configure OAuth2 Settings

![Configuring OAuth2 application](/img/external/aMN66YONKa.gif)
<!-- Shows: Uploading credentials file and configuring settings -->

**Application name:** Give it a descriptive name (e.g., "Gmail OAuth2")

**Enable this app:** Check this box (otherwise it won't appear in authentication forms)

**Credentials file:** Select the JSON file you downloaded from Google Cloud Console. This will auto-fill:
- Client ID
- Client Secret
- Other OAuth2 parameters

**Redirect URL:** Verify this matches exactly what you entered in Google Cloud Console
- Example: `http://127.0.0.1:3000/oauth`

**Base scope:** Select **IMAP and SMTP**

Click **Register app** to save.

:::tip Base Scope Selection
- **IMAP and SMTP**: EmailEngine uses IMAP for reading and SMTP for sending (this guide)
- **Gmail API**: EmailEngine uses Gmail REST API for all operations (requires Cloud Pub/Sub)

Choose IMAP and SMTP unless you specifically need Gmail API features.
:::

## Step 6: Test the Setup

Now you can add a Gmail account to test the OAuth2 flow.

### Option 1: Via Hosted Authentication Form

![Testing with hosted authentication](/img/external/EhohdYsEDc.gif)
<!-- Shows: Using hosted authentication form to add account -->

1. In EmailEngine, click **Add account**
2. Click **Sign in with Google**
3. Complete the OAuth2 consent flow
4. You'll be redirected back to EmailEngine

### Option 2: Via API

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

Response:
```json
{
  "url": "https://your-ee.com/accounts/new?data=eyJhY2NvdW50..."
}
```

Direct the user to this URL to complete authentication.

[Learn more about hosted authentication →](/docs/accounts/hosted-authentication)

### Option 3: Direct API Account Registration

If you already have OAuth2 tokens from elsewhere:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "user@gmail.com",
    "oauth2": {
      "provider": "gmail",
      "accessToken": "ya29.a0AWY7Ckl...",
      "refreshToken": "1//0gDj5..."
    }
  }'
```

[See full API documentation →](/docs/api/post-v-1-account)

## Troubleshooting

### OAuth2 Application Settings Page Shows Errors

If you see error messages on the OAuth2 application settings page in EmailEngine:
- **Invalid client secret**: Re-download credentials from Google Cloud Console
- **Mismatched redirect URL**: Ensure URLs match exactly between Google Cloud Console and EmailEngine
- **Scope errors**: Verify `https://mail.google.com/` is added to your consent screen

### Authentication Fails with "Access Denied"

Common causes:
- User account is not in your organization (for Internal apps)
- Required scopes not configured
- App is not enabled in EmailEngine settings

### Account Shows "authenticationError" State

Possible issues:
- OAuth2 tokens expired and refresh failed
- User revoked access
- App credentials were rotated in Google Cloud Console

**Solution:** Have the user re-authenticate via the hosted authentication form.

### "Less Secure App Access" Not Available

Google has disabled this for personal Gmail accounts. Options:
- Use OAuth2 (this guide)
- Generate an app password (requires 2FA)
- Use Google Workspace with password auth still enabled

### Rate Limits and Quotas

Gmail enforces various limits:

**IMAP Limits:**
- 15 concurrent connections per account
- Download limit: 2500 MB/day
- Upload limit: 500 MB/day

**API Quotas (if using Gmail API):**
- 1 billion quota units per day (default)
- 250 quota units per user per second

**Solutions:**
- Use path filtering to sync only needed folders
- Implement exponential backoff on rate limit errors
- Request quota increases from Google Cloud Console

[Learn more about performance tuning →](/docs/advanced/performance-tuning)

## Gmail-Specific Considerations

### Label vs Folder Mapping

Gmail uses labels, but IMAP presents them as folders:
- Multiple labels = message appears in multiple folders
- Moving messages between folders in IMAP = changing labels in Gmail
- Some Gmail labels map to special IMAP folders (e.g., `[Gmail]/All Mail`)

### All Mail Folder

The `[Gmail]/All Mail` folder contains all messages regardless of labels. Consider:
- Syncing All Mail can be resource-intensive
- Use path filtering to exclude it if not needed
- Message operations work the same on labeled folders

### Gmail Throttling

Gmail may throttle accounts with unusual activity:
- Sudden large volume of operations
- Many failed authentication attempts
- Rapid folder syncing

**Prevention:**
- Implement gradual rollout for new accounts
- Use exponential backoff on errors
- Monitor account states for throttling indicators

## Production Considerations

### Security Audit for Public Apps

If you need a public OAuth2 app accessible to any Gmail user:

**Requirements:**
1. **Security audit**: OWASP compliance, penetration testing
2. **Use case validation**: Not all app types qualify (e.g., email exporters may be blocked)
3. **Minimum permission set**: Google may reject `https://mail.google.com/` as too broad

**Process:**
- Audit costs significant money and time
- Must demonstrate why IMAP access is necessary
- Google may require you to use narrower scopes (which may not work with EmailEngine)

**Alternatives if audit is not feasible:**
- Use Internal apps (Google Workspace only)
- Use app passwords
- Consider if your use case can work with narrower scopes

### Managing Multiple OAuth2 Apps

You can configure multiple Gmail OAuth2 applications in EmailEngine:
- Different apps for different user segments
- Separate testing and production apps
- Organization-specific apps

Each app gets its own settings and can use different scopes or configurations.

### Token Management

EmailEngine automatically:
- Refreshes access tokens before expiration
- Stores refresh tokens securely in Redis
- Re-authenticates on token refresh failures

You can:
- Retrieve current access tokens via API for use with other Google APIs
- Revoke access by deleting the account
- Monitor token status via account state

[Learn more about OAuth2 token management →](./oauth2-token-management)
