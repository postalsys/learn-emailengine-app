---
title: Outlook Application Access (Client Credentials)
sidebar_position: 9
description: Setting up Microsoft 365 application-level access using client credentials for EmailEngine
---

# Outlook Application Access (Client Credentials)

This guide shows you how to set up application-level access to Microsoft 365 mailboxes using the OAuth2 client credentials flow. This allows EmailEngine to access any mailbox in your organization without interactive user logins.

## Overview

### What is Application Access?

Application access uses the OAuth2 **client credentials** grant to authenticate as the application itself, rather than on behalf of a signed-in user. The application receives its own identity and permissions, and can access any mailbox that the admin has authorized.

### Application Access vs Delegated Access

EmailEngine supports two types of Outlook OAuth2 integrations:

| Feature | Application Access | Delegated Access |
|---|---|---|
| **Authentication** | App authenticates as itself (client credentials) | User signs in interactively |
| **User Interaction** | None required | Each user must complete OAuth2 login |
| **Permissions** | Application permissions with admin consent | Delegated permissions with user consent |
| **Mailbox Access** | Any mailbox in the organization | Only the signed-in user's mailbox |
| **Email Backend** | MS Graph API only | IMAP/SMTP or MS Graph API |
| **Account Setup** | REST API only | Hosted auth form or REST API |
| **Tenant Requirement** | Specific tenant ID required | Can use "common", "organizations", or tenant ID |
| **Best For** | Automated systems, shared mailboxes, compliance | User-facing apps, individual accounts |

For delegated access setup, see [Setting Up Outlook and Microsoft 365](./outlook-365).

### When to Use Application Access

**Best For:**

- Enterprise Microsoft 365 deployments with centralized management
- Accessing shared mailboxes or multiple user mailboxes
- Automated workflows without user interaction (helpdesk, compliance, archiving)
- Service integrations where interactive login is not possible
- Systems that need to monitor or process email across an organization

**Not Suitable For:**

- Personal Microsoft accounts (@hotmail.com, @outlook.com, @live.com)
- Applications where users should individually control access
- Scenarios requiring IMAP/SMTP protocols (application access uses MS Graph API only)

## Benefits and Limitations

### Benefits

**No User Consent Required:**

- Access granted by admin once for the entire organization
- No OAuth2 login flow for each user
- Seamless automated access to any mailbox

**Centralized Management:**

- Admin controls all access from Azure portal
- Easy to revoke for the entire organization
- Audit trail via Azure AD sign-in logs

**Scalability:**

- Add new mailboxes without re-authentication
- Access any user's mailbox with the same app credentials
- Ideal for enterprise deployments

### Limitations

**Microsoft 365 Only:**

- Does not work with personal Microsoft accounts
- Requires a paid Microsoft 365 subscription

**Requires Admin Consent:**

- Must have Azure AD admin privileges
- Cannot be delegated to non-admin users

**MS Graph API Only:**

- Application access uses the MS Graph API backend exclusively
- IMAP/SMTP protocols are not available with client credentials

**Organization-Scoped:**

- Only works for mailboxes in your Microsoft 365 organization
- Cannot access external accounts

**Client Secret Expiration:**

- Client secrets have a maximum lifetime of 2 years
- Must be rotated before expiration to avoid service disruption

## Step 1: Create Azure AD Application

Go to [Azure Portal](https://portal.azure.com/) and navigate to **Microsoft Entra ID** > **App Registrations**.

Click **New registration**.

### Application Name

Choose a descriptive name (e.g., "EmailEngine Application Access").

### Supported Account Types

Select **"Accounts in this organizational directory only"** (single tenant). Application access requires a specific tenant, so multi-tenant configurations are not applicable.

### Redirect URI

Leave the redirect URI **empty**. The client credentials flow does not use redirects.

Click **Register** to create the application.

### Copy Application (Client) ID

On the application overview page, copy the **Application (client) ID**. You will need this when configuring EmailEngine.

### Copy Directory (Tenant) ID

Also copy the **Directory (tenant) ID** from the overview page. Unlike delegated access which can use "common" or "organizations", application access requires the specific tenant ID.

:::warning Tenant ID Required
Application access always requires a specific tenant ID. You cannot use "common", "organizations", or "consumers" as the authority value. The tenant ID is a UUID like `f8cdef31-a31e-4b4a-93e4-5f571e91255a`.
:::

## Step 2: Configure Application Permissions

Click **API permissions** in the left menu.

By default, only the `User.Read` delegated permission exists. Remove it and add application permissions instead.

Click **Add a permission** > **Microsoft Graph** > **Application permissions**.

Add the following permissions:

- `Mail.ReadWrite` -- Read and write mail in all mailboxes
- `Mail.Send` -- Send mail as any user
- `User.Read.All` -- Read all users' profiles (needed for mailbox resolution)

:::danger Application Permissions, Not Delegated
Make sure you select **Application permissions**, not **Delegated permissions**. These are in separate tabs when adding permissions. Application permissions apply to the app itself and require admin consent. Delegated permissions apply on behalf of a signed-in user and are used in the delegated access flow.
:::

## Step 3: Grant Admin Consent

After adding the permissions, click **Grant admin consent for [Your Organization]**.

This step is **mandatory** for application permissions. Unlike delegated permissions where users can consent individually, application permissions must be explicitly approved by an Azure AD administrator.

Verify that all three permissions show a green checkmark under the "Status" column, indicating admin consent has been granted.

## Step 4: Create Client Secret

Click **Certificates & secrets** in the left menu.

Click **New client secret**.

**Description:** Give it a meaningful name (e.g., "EmailEngine Secret")

**Expires:** Choose an expiration period:

- 6 months
- 12 months
- 24 months (maximum)

:::danger Copy Secret Immediately
The secret value is only shown once. Copy it immediately after creation -- you cannot retrieve it later. If you lose it, you must generate a new secret.
:::

Copy the value from the **Value** column (not the "Secret ID").

:::tip Secret Expiration Reminder
Set a calendar reminder to rotate the client secret before it expires. When the secret expires, **all accounts** using this OAuth2 application will fail to authenticate until a new secret is configured in EmailEngine.
:::

## Step 5: Configure EmailEngine

Now configure EmailEngine to use the Azure application for mailbox access.

### Add Outlook (application) OAuth2 Application

1. Open the EmailEngine dashboard
2. Navigate to **Configuration** > **OAuth2**
3. Click **Add application**
4. Select **Outlook (application)**

### Configure OAuth2 Settings

**Application name:** Give it a descriptive name (e.g., "Outlook Application Access")

**Azure Application Id:** Paste the Application (client) ID from Azure

**Client Secret:** Paste the secret value you copied earlier

**Cloud:** Select your Microsoft cloud environment (default: **Azure Global**)

**Directory (tenant) ID:** Paste the Directory (tenant) ID from Azure. This must be the specific tenant UUID.

:::info No Redirect URL
Unlike delegated access, application access does not require a redirect URL. The client credentials flow authenticates directly with Azure without browser redirects.
:::

Click **Register app** to save.

### Find Your App ID

After registering, note the **App ID** displayed in the OAuth2 application list. This is a base64url-encoded identifier (e.g., `AAABkTn2CRQAAAAB`) that you need when adding accounts via the API.

You can also find it via the API:

```bash
curl https://your-ee.com/v1/oauth2 \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN"
```

## Step 6: Add Email Accounts via API

With application access, accounts can **only be added via the REST API**. The hosted authentication form is not available because there is no interactive user login.

### Add Account

Add accounts using the [Register Account API endpoint](/docs/api/post-v-1-account):

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@contoso.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": {
        "user": "john@contoso.com"
      }
    }
  }'
```

Replace `AAABkTn2CRQAAAAB` with your actual App ID from EmailEngine.

**Key points:**

- No `accessToken` or `refreshToken` needed -- EmailEngine obtains tokens automatically via client credentials
- The `auth.user` field specifies which mailbox to access
- The `email` field should match the mailbox email address
- EmailEngine handles token acquisition and renewal automatically

**Response:**

```json
{
  "account": "user123",
  "state": "new"
}
```

The account should transition to the "connected" state within moments.

### Add Multiple Accounts

You can add any mailbox in your organization using the same App ID:

```bash
# Add multiple accounts (replace APP_ID with your actual App ID)
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "sales-1",
    "email": "alice@contoso.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": { "user": "alice@contoso.com" }
    }
  }'

curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "sales-2",
    "email": "bob@contoso.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": { "user": "bob@contoso.com" }
    }
  }'
```

### Verify Accounts

Check the account status:

```bash
curl https://your-ee.com/v1/account/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

The account should show `"state": "connected"` when successfully linked.

## Shared Mailboxes

Application access is particularly well-suited for shared mailboxes. Simply use the shared mailbox email address as the `auth.user` value:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "support-inbox",
    "email": "support@contoso.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": { "user": "support@contoso.com" }
    }
  }'
```

No additional delegation configuration is needed -- the application permissions grant direct access to all mailboxes.

## Cloud Environments

EmailEngine supports multiple Microsoft cloud environments. Select the appropriate cloud when creating the OAuth2 application to use the correct authentication and API endpoints.

| Cloud | Value | Use Case |
|---|---|---|
| **Azure Global** | `global` | Standard Microsoft 365 (default) |
| **GCC High** | `gcc-high` | US Government L4 |
| **DoD** | `dod` | US Department of Defense L5 |
| **Azure China** | `china` | China (operated by 21Vianet) |

### Cloud Environment Details

**Azure Global (default)**

- **Entra ID Endpoint**: `https://login.microsoftonline.com`
- **MS Graph API**: `https://graph.microsoft.com`
- **Azure Portal**: [portal.azure.com](https://portal.azure.com)

**GCC High (US Government L4)**

- **Entra ID Endpoint**: `https://login.microsoftonline.us`
- **MS Graph API**: `https://graph.microsoft.us`
- **Azure Portal**: [portal.azure.us](https://portal.azure.us)

**DoD (US Department of Defense L5)**

- **Entra ID Endpoint**: `https://login.microsoftonline.us`
- **MS Graph API**: `https://dod-graph.microsoft.us`
- **Azure Portal**: [portal.azure.us](https://portal.azure.us)

**Azure China (21Vianet)**

- **Entra ID Endpoint**: `https://login.chinacloudapi.cn`
- **MS Graph API**: `https://microsoftgraph.chinacloudapi.cn`
- **Azure Portal**: [portal.azure.cn](https://portal.azure.cn)

### Configuring Cloud Environment via API

When creating the OAuth2 application via the API, specify the `cloud` parameter:

```bash
curl -X POST "https://your-ee.com/v1/oauth2" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Outlook Application Access (GCC High)",
    "provider": "outlookService",
    "cloud": "gcc-high",
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "authority": "YOUR_TENANT_ID"
  }'
```

:::warning Government Cloud Registration
For government clouds (GCC High, DoD) and sovereign clouds (China), you must:

1. Register your Azure AD application in the corresponding Azure portal for that cloud environment
2. Your organization must have a subscription in that cloud environment
3. Use the correct Azure portal URL for app registration

You cannot use an app registered in the global Azure portal for government or China cloud environments.
:::

## Account Management

### Listing Accounts

Application access accounts appear like any other OAuth2 account:

```bash
curl https://your-ee.com/v1/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating Accounts

Update account settings using the [Update Account API endpoint](/docs/api/put-v-1-account-account):

```bash
curl -X PUT https://your-ee.com/v1/account/user123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe (Updated)"
  }'
```

### Deleting Accounts

Delete accounts using the [Delete Account API endpoint](/docs/api/delete-v-1-account-account):

```bash
curl -X DELETE https://your-ee.com/v1/account/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Best Practices

### Client Secret Management

**Do:**

- Store client secrets in secret management systems (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
- Set calendar reminders for secret rotation before expiration
- Use separate Azure AD applications for different environments (dev/staging/prod)
- Monitor Azure AD sign-in logs for unusual activity

**Don't:**

- Commit secrets to version control
- Share secrets via email or chat
- Use the same secret across multiple environments
- Ignore expiration warnings

### Permission Scope

**Principle of Least Privilege:**

- `Mail.ReadWrite`, `Mail.Send`, and `User.Read.All` are the minimum required permissions
- Review permissions periodically and remove any that are no longer needed
- Consider using separate applications for read-only and read-write access patterns
- Document why each permission is needed for compliance audits

### Monitoring

- Enable Azure AD audit logs for the application
- Monitor EmailEngine account states for authentication errors
- Set up alerts for client secret expiration (Azure AD notifies admins)
- Review the list of accessed mailboxes regularly

:::warning Enable Field Encryption
By default, EmailEngine stores credentials in cleartext in Redis. To protect sensitive data like client secrets, enable field encryption. See [Setting Up Encryption](/docs/advanced/encryption) for configuration instructions.
:::

## Webhooks for Real-Time Updates

Application access uses MS Graph webhook subscriptions for real-time email notifications. EmailEngine requires two publicly reachable HTTPS endpoints:

- `{serviceUrl}/oauth/msg/notification` -- Receives change notifications
- `{serviceUrl}/oauth/msg/lifecycle` -- Receives lifecycle events (subscription renewal, missed notifications)

EmailEngine automatically creates and renews these subscriptions. If the endpoints are not reachable from Microsoft's servers, EmailEngine falls back to periodic polling.

:::info Public HTTPS Required
MS Graph webhook subscriptions require publicly accessible HTTPS endpoints. If your EmailEngine instance is behind a firewall or on a private network, you will need to configure a reverse proxy or tunnel. Without reachable endpoints, EmailEngine will still work but will rely on polling for updates instead of real-time notifications.
:::

## Official Microsoft Documentation

For the most up-to-date information, refer to Microsoft's official documentation:

### Client Credentials Flow

- [Microsoft identity platform and the OAuth 2.0 client credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow) -- Technical reference for the client credentials grant
- [Get access without a user](https://learn.microsoft.com/en-us/graph/auth-v2-service) -- MS Graph guide for app-only access

### Application Permissions

- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference) -- Complete list of available permissions
- [Understanding application-only access](https://learn.microsoft.com/en-us/graph/auth/auth-concepts#application-permissions) -- Concepts guide for application vs delegated permissions

### Admin Consent

- [Grant tenant-wide admin consent](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent) -- How to grant and manage admin consent
- [Configure admin consent workflow](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow) -- Setting up approval workflows
