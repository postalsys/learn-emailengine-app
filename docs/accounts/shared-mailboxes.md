---
title: Shared Mailboxes (Microsoft 365)
sidebar_position: 6
description: Configure and manage Microsoft 365 shared mailboxes with EmailEngine using direct or delegated access
keywords:
  - Microsoft 365
  - shared mailboxes
  - Office 365
  - delegated access
  - OAuth2
---

# Shared Mailboxes (Microsoft 365)

Microsoft 365 shared mailboxes are mailboxes not bound to a specific user. Multiple users can access them using their own credentials. EmailEngine supports two approaches for accessing shared mailboxes.

## Two Approaches to Shared Mailboxes

### Option 1: Direct Access (Simpler)

Add the shared mailbox directly with its own OAuth2 credentials and mark it as shared.

**Best for:**
- Single shared mailbox setups
- Testing and evaluation
- Simple use cases

**How it works:**
1. User authenticates with the shared mailbox through OAuth2
2. EmailEngine marks the account as shared
3. Account appears as a regular account in EmailEngine

### Option 2: Delegated Access (Recommended)

Add a main account normally, then add shared mailboxes that reference the main account's credentials.

**Best for:**
- Multiple shared mailboxes accessed by the same user
- Production environments
- Better credential management

**How it works:**
1. Add the main user account with OAuth2
2. Add shared mailbox accounts that reference the main account
3. EmailEngine uses the main account's credentials to access shared mailboxes

:::tip Recommendation
Use **delegated access** for production. It's more flexible and allows one user to access multiple shared mailboxes without re-authenticating.
:::

## Prerequisites

Before setting up shared mailboxes in EmailEngine:

1. **Azure AD OAuth2 Application** configured for Microsoft 365
   - See the [Outlook OAuth2 Setup Guide](/docs/accounts/outlook-365) for detailed instructions
2. **Shared Mailbox Permissions** - User must have access to the shared mailbox in Microsoft 365
3. **EmailEngine OAuth2 Configuration** - Your Outlook OAuth2 app must be configured in EmailEngine

:::info Backend Support
Both IMAP/SMTP and Microsoft Graph API backends support shared mailboxes, but Graph API provides better native support.
:::

## Option 1: Direct Access Setup

### Via Hosted Authentication Form

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

- `account`: Account ID you want to use in EmailEngine
- `name`: Display name for the shared mailbox
- `email`: Email address of the shared mailbox (e.g., `support@company.com`)
- `delegated`: Must be `true` - indicates the authenticating user is not the mailbox owner
- `redirectUrl`: Where to redirect after authentication
- `type`: OAuth2 application ID from EmailEngine

**Authentication Flow:**

1. User visits the generated authentication URL
2. User signs in with their **own Microsoft 365 account** (not the shared mailbox)
3. This account must have access to the shared mailbox in Microsoft 365
4. EmailEngine stores the credentials associated with the shared mailbox email
5. The shared mailbox appears in EmailEngine with the shared mailbox address

:::important User Must Have Access
The authenticating user must already have permissions to access the shared mailbox in Microsoft 365. Otherwise, authentication will succeed but EmailEngine won't be able to access the mailbox.
:::

### Via Direct API

If you're managing OAuth2 tokens externally:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-support",
    "name": "Support Mailbox",
    "email": "support@company.com",
    "oauth2": {
      "provider": "AAABlf_0iLgAAAAQ",
      "auth": {
        "user": "admin@company.com"
      },
      "accessToken": "EwBIA8l6...",
      "refreshToken": "M.R3_BAY..."
    }
  }'
```

**Key field:**
- `oauth2.auth.user`: Email address of the user whose credentials are being used to access the shared mailbox

:::warning One Account Per OAuth2 User
With direct access, if you authenticate `shared@company.com` using `user@company.com`, then you cannot use `user@company.com` to authenticate any other accounts, including their own primary account. This is a known limitation.

Use **delegated access** to work around this limitation.
:::

## Option 2: Delegated Access Setup (Recommended)

Delegated access allows you to add a main account once, then reference it when adding shared mailboxes.

### Step 1: Add the Main User Account

First, add the main user account normally:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-account",
    "name": "John Doe",
    "email": "john@company.com",
    "redirectUrl": "https://myapp.com/settings",
    "type": "AAABiCtT7XUAAAAF"
  }'
```

The user completes OAuth2 authentication, and the account is added to EmailEngine.

### Step 2: Add Shared Mailboxes Using Delegation

Now add shared mailboxes that reference the main account:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-support",
    "name": "Support Mailbox",
    "email": "support@company.com",
    "oauth2": {
      "auth": {
        "delegatedUser": "support@company.com",
        "delegatedAccount": "my-account"
      }
    }
  }'
```

**Key fields:**

- `oauth2.auth.delegatedUser`: Email address or Microsoft 365 user ID of the shared mailbox
- `oauth2.auth.delegatedAccount`: EmailEngine account ID of the main user (from Step 1)

**What happens:**

1. EmailEngine connects to Microsoft 365 as `support@company.com`
2. Uses OAuth2 tokens from the main account `my-account`
3. No additional authentication required
4. Can add multiple shared mailboxes using the same main account

### Adding Multiple Shared Mailboxes

With delegated access, you can easily add multiple shared mailboxes:

```bash
# Add support mailbox
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-support",
    "name": "Support",
    "email": "support@company.com",
    "oauth2": {
      "auth": {
        "delegatedUser": "support@company.com",
        "delegatedAccount": "my-account"
      }
    }
  }'

# Add sales mailbox
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-sales",
    "name": "Sales",
    "email": "sales@company.com",
    "oauth2": {
      "auth": {
        "delegatedUser": "sales@company.com",
        "delegatedAccount": "my-account"
      }
    }
  }'

# Add info mailbox
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-info",
    "name": "Info",
    "email": "info@company.com",
    "oauth2": {
      "auth": {
        "delegatedUser": "info@company.com",
        "delegatedAccount": "my-account"
      }
    }
  }'
```

All three shared mailboxes use the same main account credentials (`my-account`).

## Backend-Specific Considerations

### IMAP/SMTP Backend

**IMAP Access:**
- Works out of the box
- EmailEngine accesses shared mailbox emails via IMAP

**SMTP Limitations:**
- Shared mailboxes without a full Microsoft 365 subscription lack SMTP access
- EmailEngine uses main account's SMTP credentials
- Sets "From" address to the shared mailbox email
- Sent emails saved in both main account and shared mailbox "Sent Items"

### Microsoft Graph API Backend

**Better Native Support:**
- Shared mailboxes fully supported
- No SMTP limitations
- Cleaner sent email handling
- Better performance

**Recommendation:** Use Microsoft Graph API backend for shared mailboxes when possible.

## Verifying Shared Mailbox Access

After adding a shared mailbox, verify it's working correctly:

1. **Check account state** - Should be "connected" in EmailEngine
2. **Verify folders are loading** - Check mailbox list API
3. **Test sending an email** - Send a message from the shared mailbox
4. **Check webhooks** - Ensure new message webhooks fire correctly

### Check Account Status

```bash
curl https://your-ee.com/v1/account/shared-support \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected response:**

```json
{
  "account": "shared-support",
  "name": "Support Mailbox",
  "email": "support@company.com",
  "state": "connected",
  "oauth2": {
    "auth": {
      "delegatedAccount": "my-account"
    }
  }
}
```

### Test Sending Email

```bash
curl -X POST https://your-ee.com/v1/account/shared-support/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"address": "test@example.com"}],
    "subject": "Test from shared mailbox",
    "text": "This is a test email"
  }'
```

## Troubleshooting

### Account Shows "authenticationError"

**Cause:** Main account credentials expired or user doesn't have access to shared mailbox

**Solution:**
1. Verify main account is in "connected" state
2. Check user has permissions in Microsoft 365 admin center
3. Reconnect the main account if needed

### "Permission denied" errors

**Cause:** User doesn't have access to the shared mailbox in Microsoft 365

**Solution:**
1. Open Microsoft 365 admin center
2. Navigate to **Teams & groups** → **Shared mailboxes**
3. Select the shared mailbox
4. Add the user under **Members**
5. Wait a few minutes for permissions to propagate

### Sent emails not appearing in shared mailbox

**IMAP/SMTP Backend:**
- This is expected behavior
- Sent emails appear in both main account and shared mailbox "Sent Items"
- Microsoft 365 handles this duplication automatically

**MS Graph API Backend:**
- Sent emails should appear only in shared mailbox "Sent Items"
- If not, check application permissions in Azure AD

### Cannot add multiple shared mailboxes with direct access

**Cause:** One account per OAuth2 user limitation

**Solution:** Switch to delegated access approach (Option 2)

## Comparison: Direct vs Delegated Access

| Feature | Direct Access | Delegated Access |
|---------|--------------|------------------|
| **Setup Complexity** | Simpler | Slightly more complex |
| **Multiple Shared Mailboxes** | Requires re-auth for each | Reuses main account |
| **Credential Management** | Separate for each | Centralized |
| **Main Account Access** | Cannot be accessed | Fully accessible |
| **Best For** | Single mailbox, testing | Production, multiple mailboxes |

## See Also

- [Outlook OAuth2 Setup Guide](/docs/accounts/outlook-365) - Setting up Azure AD OAuth2
- [Account Management](/docs/accounts/managing-accounts) - Managing accounts in EmailEngine
- [Microsoft Graph API](/docs/accounts/outlook-365#ms-graph-api) - Using MS Graph backend
