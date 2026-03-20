---
title: Google Service Accounts
sidebar_label: Service Accounts
sidebar_position: 5
description: Setting up Google Service Accounts with domain-wide delegation for Gmail access
---

<!--
Sources merged:
- blog/2022-01-16-gmail-oauth-service-accounts.md (primary - detailed step-by-step)
- docs/integrations/google-service-accounts.md (secondary - structured steps)
-->

# Google Service Accounts

Service accounts provide a powerful way for Google Workspace admins to grant EmailEngine access to any email account in the organization without requiring individual user consent. This guide shows you how to set up service accounts with domain-wide delegation.

## Overview

### What are Service Accounts?

Service accounts are a special type of Google account intended for applications rather than users. With domain-wide delegation, a service account can act on behalf of any user in your Google Workspace organization.

### How EmailEngine Uses Service Accounts

EmailEngine supports service accounts for two distinct purposes, selected via the **Base scopes** option when configuring the service account:

**1. Direct Email Access (IMAP and SMTP)**

Service accounts with domain-wide delegation can access any mailbox in your Google Workspace organization via IMAP and SMTP protocols. This is the primary use case covered in this guide.

- Select **IMAP and SMTP** as the base scope
- Requires `https://mail.google.com/` scope in domain-wide delegation
- Service account impersonates users to access their mailboxes

:::info IMAP/SMTP Only
When using service accounts for email access, EmailEngine connects via IMAP and SMTP protocols. The Gmail API cannot be used as a backend for service account-based email access in EmailEngine.
:::

**2. Push Notifications for Standard Gmail Accounts (Cloud Pub/Sub)**

Service accounts can also be used to manage Gmail Push Notification subscriptions (Pub/Sub) for regular Gmail OAuth2 accounts. In this scenario:

- Select **Cloud Pub/Sub** as the base scope
- Requires `Pub/Sub Admin` role in Google Cloud (not domain-wide delegation)
- Individual users authenticate with standard OAuth2 (not service accounts)
- A single service account manages Pub/Sub topic subscriptions for all accounts
- Email updates are delivered via push notifications instead of polling
- The service account only handles the notification infrastructure, not email access

For push notification setup, see [Setting Up Gmail API](/docs/accounts/gmail/gmail-api).

### Key Concepts

**Two-Legged OAuth2:**

- No user interaction required
- No consent screens
- Admin grants access once for entire domain
- EmailEngine can access any user's mailbox

**Domain-Wide Delegation:**

- Requires Google Workspace (not free Gmail)
- Requires super admin privileges
- Admin authorizes specific scopes for the service account
- Service account can impersonate any user in the domain

### When to Use Service Accounts

**Best For:**

- Enterprise Google Workspace deployments
- Centralized email management
- Accessing multiple user mailboxes from one application
- Automated workflows without user interaction
- Systems integration and monitoring

**Not Suitable For:**

- Free Gmail accounts (Google Workspace only)
- Public-facing applications (users outside your organization)
- Applications where users should control access

## Benefits and Limitations

### Benefits

**No User Consent Required:**

- Access granted by admin once
- No OAuth2 flow for each user
- Seamless automated access

**Centralized Management:**

- Admin controls all access
- Easy to revoke for entire organization
- Audit trail of service account usage

**Scalability:**

- Add new users without re-authentication
- Access any user's mailbox with same credentials
- Ideal for enterprise deployments

### Limitations

**Google Workspace Only:**

- Does not work with free @gmail.com accounts
- Requires paid Google Workspace subscription

**Requires Admin Access:**

- Must be Google Workspace super admin
- Cannot be delegated to non-admin users

**Organization-Scoped:**

- Only works for users in your organization
- Cannot access external Gmail accounts

**Credential Security:**

- Service account credentials provide access to all users
- Must be stored very securely
- Compromised credentials = access to entire organization's email

## Step 1: Create a Google Cloud Project

Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project.

<!-- Shows: Project selector in Google Cloud Console -->

Click the project selector and then **New Project**.

<!-- Shows: New project button -->

<!-- Shows: Project creation form -->

Fill in the project name (e.g., "EmailEngine Service Account").

<!-- Shows: Project being created, then "Select project" button -->

Wait for the project to be created, then click **Select project** to switch to it.

## Step 2: Configure OAuth Consent Screen

Even though service accounts don't show consent screens to users, the form allows us to configure required project details.

:::info Consent Screen vs Domain-Wide Delegation
The OAuth consent screen and domain-wide delegation are **separate configurations**:

- **OAuth consent screen** (this step): Configures project metadata and documents which scopes your project uses. Required to complete project setup, but service accounts bypass this screen during authentication.
- **Domain-wide delegation** (Step 4): The actual authorization that grants your service account permission to access user mailboxes. This is configured in the Google Admin Console.

Service accounts authenticate using JWT tokens, not the OAuth consent flow, so users never see the consent screen.
:::

Navigate to **APIs & Services** → **OAuth consent screen**.

<!-- Shows: Navigation to OAuth consent screen -->

### Select User Type

<!-- Shows: Internal vs External selection -->

Select **Internal** and click **Create**.

:::note User Type Selection
The "Internal" vs "External" choice primarily affects standard OAuth2 flows where users see consent screens. Since service accounts authenticate using JWT tokens and bypass the consent screen entirely, this setting has no direct impact on service account functionality. Select **Internal** for simplicity since service accounts are designed for organization-internal use.
:::

### Fill in App Information

<!-- Shows: OAuth consent form fields -->

Fill in the required fields:

- **App name**: "EmailEngine Service Account" (or your app name)
- **User support email**: Your email address
- **Developer contact information**: Your email address

These fields are required but won't be shown to users since service accounts don't use consent screens.

Click **Save and continue**.

### Configure Scopes (Optional)

<!-- Shows: Scopes configuration page -->

Click **Add or remove scopes**.

For service accounts, the actual scope authorization happens in the Google Admin Console's domain-wide delegation settings (Step 4), not here. However, adding scopes here documents what your project uses and is required if you later add standard OAuth2 clients.

<!-- Shows: Manually adding scope -->

If desired, scroll to the end of the scopes list and manually add:

```
https://mail.google.com/
```

Click **Add to table** then **Update**.

<!-- Shows: Scope listed in restricted scopes -->

The scope should now appear in the "Restricted scopes" section.

:::info
This step configures project-level scope documentation. The actual permissions for your service account are granted separately through domain-wide delegation in the Admin Console (Step 4). You can skip adding scopes here and proceed directly.
:::

Click **Save and continue** to finish consent screen setup.

## Step 3: Create Service Account

Navigate to **APIs & Services** → **Credentials** and click the **Manage service accounts** link (bottom right corner).

<!-- Shows: Credentials page with "Manage service accounts" link -->

Click **Create service account**.

<!-- Shows: Service accounts page with create button -->

### Configure Service Account

<!-- Shows: Service account creation form -->

**Service account name**: Choose a descriptive name (e.g., "emailengine-service")

**Service account ID**: Auto-generated, but you can customize

**Description**: Optional description

Click **Create and continue**.

### Grant Role

<!-- Shows: Role selection with "Owner" highlighted -->

**Role**: Select **Owner**

:::info Role Selection
The "Owner" role is used here for simplicity. For production, you may want to use a more restrictive role, but "Owner" has been tested and confirmed working.
:::

Click **Continue**.

### Complete Setup

<!-- Shows: Final step, grant users access (can be left empty) -->

Leave the optional fields empty and click **Done**.

## Step 4: Enable Domain-Wide Delegation

Now we need to authorize the service account to access user mailboxes.

### Get Client ID

From the service accounts list, copy the **OAuth2 Client ID** for your service account.

<!-- Shows: Service account list with Client ID column -->

:::tip Finding Client ID
The Client ID is a long numeric string in the service account listing. You'll need this for domain-wide delegation setup.
:::

### Open Google Admin Console

Open [Google Admin Console](https://admin.google.com/) for your domain and search for "API Controls".

<!-- Shows: Google Admin search for "API Controls" -->

### Manage Domain-Wide Delegation

Scroll down to find the "Domain-wide delegation" section and click **Manage domain-wide delegation**.

<!-- Shows: Domain-wide delegation section in Security settings -->

Click **Add new**.

<!-- Shows: API clients list with "Add new" button -->

### Authorize API Client

<!-- Shows: API client authorization form -->

**Client ID**: Paste the Client ID you copied from the service account

**OAuth scopes**: Enter the required scope for IMAP and SMTP access:

```
https://mail.google.com/
```

Click **Authorize**.

:::important This is the Actual Authorization
This step in the Admin Console is where the service account actually receives permission to access user mailboxes. The scope entered here determines what the service account can do. The OAuth consent screen configuration (Step 2) is separate and primarily for project documentation.
:::

## Step 5: Generate Service Account Key

Return to the Google Cloud Console service accounts page.

Open the context menu for your service account (three dots) and click **Manage keys**.

<!-- Shows: Service account context menu with "Manage keys" option -->

Click **Add Key** → **Create new key**.

<!-- Shows: Add Key dropdown menu -->

Select **JSON** as the key type and click **Create**.

<!-- Shows: Key type selection dialog -->

The browser will automatically download the key file as a `.json` file.

:::danger Store Key Securely
This key file provides access to all email accounts in your organization. Store it very securely:

- Use secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit to version control
- Restrict file permissions
- Rotate keys periodically
  :::

### Key File Format

The downloaded JSON file contains:

```json
{
  "type": "service_account",
  "project_id": "service-test-338412",
  "private_key_id": "83fd56801b0e46d21ad88300b73d3727e6d46961",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w...\n",
  "client_email": "emailengine-2lo-test@service-....iam.gserviceaccount.com",
  "client_id": "103965568215821627203",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/.../x509/emaile..."
}
```

The important fields for EmailEngine are:

- `client_id`: Maps to "Service client" in EmailEngine
- `client_email`: Maps to "Service Client Email" in EmailEngine
- `private_key`: Maps to "Secret service key" in EmailEngine
- `project_id`: Maps to "Google Project ID" in EmailEngine (used for Gmail Push Notifications)

## Step 6: Enable Gmail API

Service accounts need Gmail API enabled to resolve account email addresses during setup.

Navigate to **APIs & Services** → **Dashboard** and click **Enable APIs and Services**.

<!-- Shows: Dashboard with "Enable APIs and Services" button -->

Search for "mail" to find Gmail API.

<!-- Shows: API Library search results -->

<!-- Shows: Gmail API details page -->

Click **Enable**.

<!-- Shows: Gmail API enabled confirmation -->

## Step 7: Configure EmailEngine

Now configure EmailEngine to use the service account.

### Add Gmail Service Account Application

<!-- Shows: EmailEngine OAuth2 configuration page -->

1. Open EmailEngine dashboard
2. Navigate to **Configuration** → **OAuth2**
3. Click **Add application**
4. Select **Gmail Service Accounts**

### Upload Credentials File

<!-- Shows: Service account configuration form in EmailEngine -->

**Credentials file**: Use the file input to select the service account key JSON file

EmailEngine will automatically extract and populate:

- Service client (from `client_id`)
- Service Client Email (from `client_email`)
- Secret service key (from `private_key`)
- Google Project ID (from `project_id`)

### Select Base Scopes

The **Base scopes** selection determines how EmailEngine uses this service account:

| Option | Purpose | Required Scope/Role |
|--------|---------|---------------------|
| **IMAP and SMTP** | Direct email access via IMAP/SMTP protocols | `https://mail.google.com/` (domain-wide delegation) |
| **Cloud Pub/Sub** (beta) | Webhook management for Gmail API accounts | `Pub/Sub Admin` role in Google Cloud |

**For direct email access** (the primary use case in this guide), select **IMAP and SMTP**. This allows the service account to access any mailbox in your Google Workspace organization via IMAP and SMTP protocols.

**For push notification management**, select **Cloud Pub/Sub**. This is used when you have regular Gmail OAuth2 accounts (where users authenticate individually) but want a single service account to manage Pub/Sub topic subscriptions for receiving email change notifications. See [Setting Up Gmail API](/docs/accounts/gmail/gmail-api) for this use case.

**Enable this app**: Check if you want it available immediately

Click **Register app** to save.

:::tip Automatic Field Population
When you upload the JSON key file, EmailEngine automatically fills in all required fields. You don't need to copy and paste individual values.
:::

:::info JSON Key File After Setup
Once EmailEngine has been configured with the service account credentials, the JSON key file is no longer needed. EmailEngine stores the credentials in its database. You can delete the JSON file from your local system to reduce security risk.

If you need to configure the same service account in another EmailEngine instance in the future, generate a fresh key from Google Cloud Console rather than reusing an old key file. This follows the security best practice of not storing or sharing key files.
:::

:::warning Enable Field Encryption
By default, EmailEngine stores credentials in cleartext in Redis. To protect sensitive data like service account private keys, you should enable field encryption. See [Setting Up Encryption](/docs/advanced/encryption) for configuration instructions.
:::

### Find Your App ID

After registering the app, note the **App ID** displayed in the OAuth2 application list. This is a base64url-encoded identifier (e.g., `AAABkTn2CRQAAAAB`) that you'll need when adding accounts via the API.

You can also find the App ID by calling the [List OAuth2 Apps API endpoint](/docs/api/get-v-1-oauth-2):

```bash
curl https://your-ee.com/v1/oauth2 \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN"
```

## Step 8: Add Email Accounts

With the service account configured, you can now add email accounts without any user interaction.

### Add Account via API

Add accounts using the [Register Account API endpoint](/docs/api/post-v-1-account):

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@company.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": {
        "user": "john@company.com"
      }
    }
  }'
```

Replace `AAABkTn2CRQAAAAB` with your actual App ID from EmailEngine.

**Key Points:**

- No `accessToken` or `refreshToken` needed
- No passwords required
- Just specify the user email address
- Service account handles authentication automatically

**Response:**

```json
{
  "account": "user123",
  "state": "new"
}
```

The account will be created and should transition to "connected" state within moments.

### Add Multiple Accounts

You can add any user in your organization using the same App ID:

```bash
# Add sales team accounts (replace APP_ID with your actual App ID)
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "sales-1",
    "email": "alice@company.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": { "user": "alice@company.com" }
    }
  }'

curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "sales-2",
    "email": "bob@company.com",
    "oauth2": {
      "provider": "AAABkTn2CRQAAAAB",
      "auth": { "user": "bob@company.com" }
    }
  }'
```

### Verify Accounts

Check the accounts list in EmailEngine:

<!-- Shows: Accounts list showing Gmail OAuth2 accounts -->

Service account-based accounts appear as "Gmail OAuth2" accounts in the list.

## Account Management

### Listing Service Account Accounts

Service account accounts appear like any other OAuth2 account:

```bash
curl https://your-ee.com/v1/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating Service Account Accounts

Update account settings using the [Update Account API endpoint](/docs/api/put-v-1-account-account):

```bash
curl -X PUT https://your-ee.com/v1/account/user123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe (Updated)",
    "subconnections": ["\\Sent"]
  }'
```

### Deleting Service Account Accounts

Delete accounts using the [Delete Account API endpoint](/docs/api/delete-v-1-account-account):

```bash
curl -X DELETE https://your-ee.com/v1/account/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Best Practices

### Key Storage

**Do:**

- Store keys in secret management systems (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Encrypt key files at rest
- Use environment variables for production
- Restrict file permissions (0600)

**Don't:**

- Commit keys to version control
- Store keys in plain text
- Share keys via email or chat
- Store keys in public locations

### Access Control

**Limit Access:**

- Only admins should access service account keys
- Use separate keys for different environments (dev/staging/prod)
- Audit key usage regularly
- Rotate keys periodically (e.g., every 90 days)

**Monitor Usage:**

- Enable Google Cloud audit logs
- Monitor EmailEngine access logs
- Alert on unusual account access patterns
- Review service account activity regularly

### Scope Limitation

**Principle of Least Privilege:**

- Only grant scopes actually needed
- For IMAP access, `https://mail.google.com/` is required
- Consider separate service accounts for different purposes
- Document why each scope is needed

## Use Cases

### Enterprise Email Management

Monitor and manage all employee email accounts:

- Compliance and archiving
- Security scanning
- Backup solutions
- E-discovery

### Help Desk Integration

Access user mailboxes for support:

- Troubleshoot email issues
- Recover deleted messages
- Investigate delivery problems
- Provide user assistance

### Automated Workflows

Build automated systems:

- Invoice processing from shared mailbox
- Customer support ticket creation
- Email-based data extraction
- Notification routing

### Migration and Sync

Synchronize email data:

- Migrate between systems
- Backup to external storage
- Mirror to CRM systems
- Sync with document management

## Official Google Documentation

For the most up-to-date information, refer to Google's official documentation:

### Domain-Wide Delegation

- [Control API access with domain-wide delegation](https://support.google.com/a/answer/162106) - Google Workspace Admin Help guide for setting up domain-wide delegation
- [Domain-wide delegation best practices](https://support.google.com/a/answer/14437356) - Security recommendations and guidelines

### Service Accounts

- [Service accounts overview](https://cloud.google.com/iam/docs/service-account-overview) - Google Cloud IAM documentation
- [Best practices for using service accounts](https://cloud.google.com/iam/docs/best-practices-service-accounts) - Security and management best practices

### Gmail IMAP/SMTP OAuth

- [OAuth 2.0 Mechanism](https://developers.google.com/workspace/gmail/imap/xoauth2-protocol) - SASL XOAUTH2 protocol for IMAP/SMTP
- [IMAP, POP, and SMTP](https://developers.google.com/workspace/gmail/imap/imap-smtp) - Gmail IMAP/SMTP access documentation
- [Choose Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) - Available OAuth scopes for Gmail
