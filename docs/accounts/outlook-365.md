---
title: Setting Up Outlook and Microsoft 365
sidebar_position: 4
description: Complete guide to setting up Outlook.com and Microsoft 365 accounts with OAuth2 authentication
---

<!--
Sources merged:
- blog/2025-09-07-setting-up-oauth2-with-outlook.md (primary - detailed step-by-step)
- docs/integrations/outlook-and-ms-365.md (secondary - structured steps)
- blog/2023-05-19-shared-ms365-mailboxes-with-emailengine.md (shared mailboxes)
- docs/integrations/shared-mailboxes-in-ms-365.md (shared mailboxes details)
-->

# Setting Up Outlook and Microsoft 365

This guide shows you how to set up Outlook OAuth2 authentication with EmailEngine for Outlook.com, Hotmail.com, and Microsoft 365 accounts. You can use either IMAP/SMTP or Microsoft Graph API as the email backend.

## Overview

EmailEngine has native support for Outlook and Microsoft 365 accounts with two backend options:

**IMAP/SMTP Backend:**

- Standard email protocols
- Works like any other email account
- Simpler setup
- Compatible with EmailEngine v2.0+

**Microsoft Graph API Backend:**

- Native Microsoft 365 integration
- Better performance for high-volume accounts
- Access to Microsoft-specific features
- Supports shared mailboxes natively
- Requires EmailEngine v2.44+

This guide covers both options.

## Choosing IMAP/SMTP vs MS Graph API

| Feature                         | IMAP/SMTP       | MS Graph API   |
| ------------------------------- | --------------- | -------------- |
| **Setup Complexity**            | Simple          | Moderate       |
| **Performance**                 | Good            | Excellent      |
| **Shared Mailboxes**            | Limited support | Native support |
| **EmailEngine Version**         | v2.0+           | v2.44+         |
| **Connection Protocol**         | IMAP/SMTP       | REST API       |
| **Microsoft-Specific Features** | Limited         | Full access    |
| **Works with other providers**  | Yes             | No             |

**Recommendation:**

- Use **IMAP/SMTP** for simple setups and compatibility
- Use **MS Graph API** for shared mailboxes and Microsoft 365 enterprise features

## Step 1: Create Azure AD Application

Go to [Azure Portal](https://portal.azure.com/) and navigate to **Microsoft Entra ID** → **App Registrations**.


<!-- Shows: Navigation to Azure AD App Registrations -->

Click **New registration**.


<!-- Shows: Clicking "New registration" button -->

## Step 2: Configure Application Registration


<!-- Shows: Application registration form -->

### Application Name

Choose a name that users will see in the authorization form. Make it clear and recognizable (e.g., "EmailEngine" or "YourApp Email Integration").

### Supported Account Types

Choose who can use this application:

**Personal Microsoft accounts only:**

- Only free @hotmail.com, @outlook.com, @live.com accounts
- Select: "Accounts in any organizational directory and personal Microsoft accounts"

**Single tenant (organization only):**

- Only accounts from your Microsoft 365 organization
- Select: "Accounts in this organizational directory only"

**Multi-tenant (any organization):**

- Any Microsoft 365 organization account
- Does NOT include personal Microsoft accounts
- Select: "Accounts in any organizational directory"

**Multi-tenant + personal accounts:**

- Both Microsoft 365 and personal accounts
- Most flexible option
- Select: "Accounts in any organizational directory and personal Microsoft accounts"

:::tip Recommended Setting
For maximum compatibility, select **"Accounts in any organizational directory and personal Microsoft accounts"** unless you have specific requirements.
:::

### Redirect URI

**Platform:** Select **Web**

**URI:** Your EmailEngine URL with `/oauth` path:

- `http://localhost:3000/oauth` (for local testing)
- `https://your-emailengine-domain.com/oauth` (for production)

:::warning Redirect URL Must Match Exactly
The redirect URL must match exactly what you'll configure in EmailEngine later. Mismatches will cause OAuth failures.
:::

Click **Register** to create the application.

## Step 3: Copy Application (Client) ID


<!-- Shows: Application overview page with client ID -->

On the application overview page, find and copy the **Application (client) ID**. You'll need this for EmailEngine configuration.

Keep this page open - you'll come back to it.

## Step 4: Configure API Permissions

Click **API permissions** in the left menu.


<!-- Shows: API permissions page -->

By default, only `User.Read` permission exists. Click **Add a permission**.


<!-- Shows: Adding permission button -->

Select **Microsoft Graph** and then **Delegated permissions**.

### For IMAP/SMTP Backend

Add these permissions:


<!-- Shows: Searching for and selecting IMAP permissions -->

- `IMAP.AccessAsUser.All` - For IMAP access
- `SMTP.Send` - For sending emails via SMTP
- `offline_access` - For token refresh

:::important offline_access Required
The `offline_access` scope is required in both cases. It allows EmailEngine to renew access tokens in the background without user interaction.
:::

### For MS Graph API Backend

Add these permissions instead:

- `Mail.ReadWrite` - For reading and managing emails
- `Mail.Send` - For sending emails
- `offline_access` - For token refresh

:::warning Don't Mix Scopes
You cannot use both IMAP/SMTP and Mail.\* scopes together. Choose one backend:

- **IMAP/SMTP scopes**: From Outlook API
- **Mail.\* scopes**: From MS Graph API

Pick one approach and stick with it.
:::


<!-- Shows: All required permissions listed -->

Verify all required permissions are listed, then continue to the next step.

## Step 5: Create Client Secret

Click **Certificates & secrets** in the left menu.


<!-- Shows: Certificates & secrets page -->

Click **New client secret**.

### Configure Secret

**Description:** Give it a meaningful name (e.g., "EmailEngine Secret")

**Expires:** Choose an expiration period you're comfortable with

- 6 months (default)
- 12 months
- 24 months
- Custom

:::tip Secret Expiration
When the secret expires, your application will stop working until you generate a new secret and update EmailEngine. Choose a longer expiration for production, but set a reminder to rotate it before expiry.
:::

Click **Add**.

### Copy Secret Value

:::danger Copy Secret Now
The secret value is only shown once. Copy it immediately - you cannot retrieve it later. If you lose it, you'll need to generate a new secret.
:::

Copy the value from the **Value** column (NOT the "Secret ID").

## Step 6: Enable IMAP/SMTP (If Using IMAP Backend)

:::info Only for IMAP/SMTP Backend
Skip this step if you're using MS Graph API as your backend.
:::

If you're managing a Microsoft 365 organization and EmailEngine cannot connect via IMAP/SMTP, you may need to enable these protocols manually.


<!-- Shows: Enabling IMAP and SMTP in Microsoft 365 admin center -->

1. Navigate to [https://admin.microsoft.com/](https://admin.microsoft.com/)
2. Go to **Users** → **Active users**
3. Select a user
4. Navigate to **Mail** settings
5. Enable **IMAP** and **SMTP AUTH**

You may need to do this for each user or configure organization-wide settings.

## Step 7: Configure EmailEngine

Now configure EmailEngine with your Azure application credentials.

### Add Outlook OAuth2 Application


<!-- Shows: Creating Outlook OAuth2 application in EmailEngine -->

1. Open EmailEngine dashboard
2. Navigate to **Configuration** → **OAuth2**
3. Click **Add application**
4. Select **Outlook**

### Configure OAuth2 Settings


<!-- Shows: Outlook OAuth2 configuration form -->

**Application name:** Give it a descriptive name (e.g., "Outlook OAuth2")

**Enable this app:** Check this box (otherwise it won't appear in authentication forms)

**Azure Application Id:** Paste the Application (client) ID from Azure

**Client Secret:** Paste the secret value you copied earlier

**Redirect URL:** Must match exactly what you entered in Azure:

- Example: `http://localhost:3000/oauth`

**Supported account types:** Choose based on your Azure configuration:

- `common` - Organizations and personal accounts (most flexible)
- `consumers` - Personal Microsoft accounts only (@hotmail.com, @outlook.com, @live.com)
- `organizations` - Microsoft 365 organizations only
- `<directory-id>` - Specific organization only (use Directory/Tenant ID like `f8cdef31-a31e-4b4a-93e4-5f571e91255a`)

:::tip Account Type Mapping
| Azure Setting | EmailEngine Value |
|---------------|-------------------|
| Any org + personal | `common` |
| Personal accounts only | `consumers` |
| Any organization | `organizations` |
| Single organization | Use Directory ID |
:::

**Base scope:** Select based on your Azure permissions:

- **IMAP and SMTP** - If you added `IMAP.AccessAsUser.All` and `SMTP.Send`
- **MS Graph API** - If you added `Mail.ReadWrite` and `Mail.Send`

:::important Base Scope Must Match Azure Permissions
The base scope you select here must match the permissions you configured in Azure. Mismatches will cause authentication failures.
:::

Click **Register app** to save.

## Step 8: Test the Setup

Add an Outlook account to test the OAuth2 flow.

### Via Hosted Authentication Form


<!-- Shows: Using hosted authentication form -->

1. In EmailEngine, click **Add account**
2. Click **Sign in with Microsoft**
3. Complete the OAuth2 consent flow
4. EmailEngine will store the credentials and connect

The account should enter "connected" state within moments.

### Via API

Generate an authentication form URL:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "user@outlook.com",
    "redirectUrl": "https://myapp.com/settings"
  }'
```

Direct the user to the returned URL.

[Learn more about hosted authentication →](/docs/accounts/hosted-authentication)

### Direct API Account Registration

If you already have OAuth2 tokens:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "user@outlook.com",
    "oauth2": {
      "provider": "outlook",
      "accessToken": "EwBIA8l6...",
      "refreshToken": "M.R3_BAY..."
    }
  }'
```

[See full API documentation →](/docs/api/post-v-1-account)

## Shared Mailboxes (Microsoft 365)

Microsoft 365 shared mailboxes are mailboxes not bound to a specific user. Multiple users can access them using their own credentials.

### How Shared Mailboxes Work with EmailEngine

EmailEngine accesses shared mailboxes through OAuth2 authentication where:

- The **shared mailbox** is the account being managed
- A **user with access** provides the OAuth2 authentication

### Important Limitation

:::warning One Account Per OAuth2 User
Currently, EmailEngine does not support credential re-use. If you authenticate `shared@host` using `user@host`, then you cannot use `user@host` to authenticate any other accounts, including their own primary account.

This is a known limitation being considered for future updates.
:::

### Setting Up a Shared Mailbox

Use the hosted authentication form with the `delegated` flag:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-support",
    "name": "Support Mailbox",
    "email": "support@company.com",
    "delegated": true,
    "redirectUrl": "https://myapp.com/settings",
    "type": "AAABiCtT7XUAAAAF"
  }'
```

**Fields:**

- `account`: The account ID you want to use
- `name`: Display name of the shared mailbox
- `email`: Email address of the shared mailbox (e.g., `info@company.com`, `sales@company.com`)
- `delegated`: Must be `true` - indicates the authenticating user is not the mailbox owner
- `redirectUrl`: Where to redirect after authentication
- `type`: The ID of your OAuth2 application in EmailEngine

![Finding OAuth2 app ID](/img/external/IVrLyCqaBc.png)

<!-- Shows: OAuth2 app ID in EmailEngine configuration -->

The "type" field value is the ID shown in the OAuth2 applications list in EmailEngine.

### Authentication Flow for Shared Mailboxes

1. User visits the generated authentication URL
2. User signs in with their **own Microsoft 365 account** (not the shared mailbox)
3. This account must have access to the shared mailbox
4. EmailEngine stores the credentials associated with the shared mailbox email
5. The shared mailbox appears in EmailEngine with the shared mailbox address

:::important User Must Have Access
The authenticating user must already have permissions to access the shared mailbox in Microsoft 365. Otherwise, authentication will succeed but EmailEngine won't be able to access the mailbox.
:::

### Via Direct API (Advanced)

If managing OAuth2 tokens externally:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-support",
    "name": "Support Mailbox",
    "email": "support@company.com",
    "oauth2": {
      "provider": "outlook",
      "auth": {
        "user": "admin@company.com"
      },
      "accessToken": "...",
      "refreshToken": "..."
    }
  }'
```

The `auth.user` field indicates which user's credentials are being used to access the shared mailbox.

### Verifying Shared Mailbox Access

After adding a shared mailbox:

1. Check account state in EmailEngine - should be "connected"
2. Verify folders are loading
3. Test sending an email from the shared mailbox
4. Check webhooks are firing for new messages

## Troubleshooting

### OAuth2 Application Settings Show Errors

Check for:

- **Invalid client secret**: Verify you copied the value correctly from Azure
- **Mismatched redirect URL**: Must match exactly between Azure and EmailEngine
- **Expired client secret**: Generate a new secret in Azure and update EmailEngine

### Authentication Fails with "AADSTS" Error

Common Azure AD errors:

**AADSTS50011: The redirect URI specified does not match**

- Redirect URL mismatch between Azure and EmailEngine
- Check for trailing slashes, http vs https

**AADSTS65001: The user or administrator has not consented**

- Required permissions not configured
- User needs to accept permissions

**AADSTS7000218: The request body must contain the 'client_assertion' parameter**

- Using wrong account type setting
- Check if account type matches Azure configuration

### Account Shows "authenticationError" State

Possible issues:

- **IMAP/SMTP not enabled**: Enable in Microsoft 365 admin center
- **Wrong base scope**: Must match Azure permissions (IMAP vs Graph API)
- **Insufficient permissions**: User doesn't have mailbox access
- **Expired tokens**: EmailEngine should auto-refresh, but may fail if refresh token is invalid

**Solution:** Have the user re-authenticate via hosted authentication form.

### Shared Mailbox Not Accessible

Check:

- **User has permissions**: Verify in Microsoft 365 admin center
- **Correct email address**: Must use shared mailbox address, not user's address
- **Delegated flag set**: Must be `true` when creating authentication form
- **MS Graph API works better**: Consider switching from IMAP to MS Graph for shared mailboxes

### IMAP/SMTP Connection Fails

For Microsoft 365 accounts:

1. Verify IMAP/SMTP is enabled in admin center
2. Check firewall/network connectivity
3. Verify correct base scope selected (IMAP and SMTP)
4. Try MS Graph API instead

### Token Refresh Failures

If tokens fail to refresh:

- **Client secret expired**: Generate new secret in Azure
- **App permissions changed**: User may need to re-authenticate
- **Refresh token invalid**: User needs to re-authenticate

## Performance Considerations

### IMAP/SMTP Limits

Microsoft enforces connection and rate limits:

**Connection Limits:**

- 15 concurrent IMAP connections per account
- 30 SMTP connections per minute

**Rate Limits:**

- Throttling on excessive operations
- May temporarily block account

**Best Practices:**

- Use sub-connections sparingly
- Implement path filtering
- Monitor account states for throttling

### MS Graph API Limits

Microsoft Graph has separate quotas:

**Throttling Limits:**

- Varies by license type and tenant
- Typically higher than IMAP limits

**Best Practices:**

- Implement exponential backoff
- Use batch requests where possible
- Monitor for throttling responses

[Learn more about performance tuning →](/docs/advanced/performance-tuning)

## Production Considerations

### Admin Consent for Organization Apps

For single-tenant or organization apps, an admin can grant consent for all users:

1. In Azure AD, go to your app registration
2. Click **API permissions**
3. Click **Grant admin consent for [Organization]**

This pre-approves the app for all users in the organization.

### Multi-Tenant Apps

If your app supports multiple organizations:

- Each organization's admin must grant consent
- Or users can self-consent (if allowed by admin)
- Consider different consent experiences per tenant

### Client Secret Rotation

Client secrets expire. Plan for rotation:

1. Generate a new secret in Azure before the old one expires
2. Update EmailEngine configuration with new secret
3. Test that new secret works
4. Remove old secret after transition period

Set calendar reminders well before expiration.

### Monitoring

Monitor these metrics:

- Account connection states
- Authentication error rates
- Token refresh success rates
- API rate limit warnings

Set up alerts for:

- Accounts entering error states
- Token refresh failures
- Client secret expiration approaching

