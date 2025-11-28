---
title: Generic IMAP/SMTP Accounts
sidebar_position: 5
description: Setting up email accounts using standard IMAP and SMTP protocols
---

<!--
Sources merged:
- docs/getting-started/supported-account-types.md (basic information)
- General IMAP/SMTP knowledge
-->

# Generic IMAP/SMTP Accounts

This guide covers setting up email accounts using standard IMAP and SMTP protocols. This method works with virtually any email provider that supports these protocols, including self-hosted mail servers, regional providers, and services not covered by specific OAuth2 integrations.

## Overview

IMAP (Internet Message Access Protocol) and SMTP (Simple Mail Transfer Protocol) are the standard protocols for email:

- **IMAP**: Used for reading and managing emails
- **SMTP**: Used for sending emails

Unlike OAuth2-based setups, IMAP/SMTP accounts require direct credentials (username and password or app-specific passwords).

## When to Use IMAP/SMTP

**Best for:**

- Email providers without OAuth2 support
- Self-hosted mail servers
- Regional email providers
- Quick testing and development
- Legacy systems

**Advantages:**

- Universal compatibility
- Immediate setup (no OAuth2 app configuration)
- Works with virtually any provider
- Simple authentication

**Disadvantages:**

- Requires storing passwords
- May not work with accounts that have 2FA without app passwords
- Some providers (Gmail, Outlook) may block standard authentication

## Supported Providers

EmailEngine's IMAP/SMTP support works with hundreds of providers. Here are common examples:

### Major Providers with App Passwords

**Gmail:**

- Requires app-specific password if 2FA is enabled
- See [Gmail IMAP guide](./gmail-imap) for OAuth2 alternative

**Outlook.com / Hotmail.com / Live.com:**

- **OAuth2 required** - Microsoft has disabled regular password authentication
- Use [Outlook OAuth2 guide](./outlook-365) to set up OAuth2 for IMAP/SMTP

**Yahoo Mail:**

- Requires app-specific password
- Generate at [Yahoo Account Security](https://login.yahoo.com/account/security)

**iCloud Mail:**

- Requires app-specific password
- Generate at [Apple ID Account](https://appleid.apple.com/)

### Self-Hosted Servers

IMAP/SMTP works with any standard-compliant mail server:

- **Postfix + Dovecot**
- **Microsoft Exchange**
- **Zimbra**
- **MDaemon**
- **MailEnable**
- **hMailServer**
- _etc._

## Server Settings Auto-Detection

EmailEngine can **automatically detect IMAP/SMTP server settings** for most email providers.

### Via Hosted Authentication Form

When users add accounts through the [hosted authentication form](/docs/accounts/hosted-authentication), EmailEngine attempts to automatically detect the correct server settings based on the email address. In most cases, users only need to enter their email and password. For self-hosted servers or less common providers where auto-detection fails, manual server configuration is required.

### Via API

Use the [autoconfig endpoint](/docs/api/get-v-1-autoconfig) to detect server settings programmatically:

```bash
curl "https://your-ee.com/v1/autoconfig?email=user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response includes detected IMAP and SMTP settings:

```json
{
  "imap": {
    "host": "imap.example.com",
    "port": 993,
    "secure": true
  },
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false
  }
}
```

You can then use these settings when [registering an account](/docs/api/post-v-1-account).

:::warning Outlook.com / Hotmail.com / Live.com
Microsoft has **disabled regular password authentication** for consumer accounts. You must use OAuth2 authentication. See the [Outlook OAuth2 guide](./outlook-365) for setup instructions.
:::

:::info Understanding the "secure" Setting
The `secure` setting controls how TLS is established:

- **`secure: true`** (ports 993/465) - TLS is used from the start of the connection (implicit TLS)
- **`secure: false`** (ports 143/587) - Connection starts unencrypted, then EmailEngine automatically upgrades to TLS using STARTTLS if the server supports it

Setting `secure: false` does **not** mean the connection is unencrypted. EmailEngine will use TLS in both cases - the difference is only in how TLS is negotiated.
:::

## Authentication Methods

### Standard Password

For providers that allow it, use your regular account password.

```json
{
  "account": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "imap": {
    "host": "imap.example.com",
    "port": 993,
    "secure": true,
    "auth": {
      "user": "john@example.com",
      "pass": "your-password"
    }
  },
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "john@example.com",
      "pass": "your-password"
    }
  }
}
```

### App-Specific Passwords

For providers requiring app passwords (Gmail, Yahoo, iCloud, AOL):

1. Enable 2FA on your account if not already enabled
2. Generate an app-specific password from your account settings
3. Use this app password instead of your main password

```json
{
  "account": "user123",
  "name": "John Doe",
  "email": "john@gmail.com",
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "auth": {
      "user": "john@gmail.com",
      "pass": "abcd efgh ijkl mnop" // App password
    }
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "john@gmail.com",
      "pass": "abcd efgh ijkl mnop" // Same app password
    }
  }
}
```

### Different IMAP and SMTP Credentials

Some providers use different credentials for IMAP and SMTP:

```json
{
  "account": "user123",
  "imap": {
    "auth": {
      "user": "john@example.com",
      "pass": "imap-password"
    }
  },
  "smtp": {
    "auth": {
      "user": "john@example.com",
      "pass": "smtp-password"
    }
  }
}
```

## SSL/TLS Configuration

### Port and Security Options

**Port 993 with SSL/TLS (IMAP):**

```json
{
  "imap": {
    "port": 993,
    "secure": true
  }
}
```

**Port 143 with STARTTLS (IMAP):**

```json
{
  "imap": {
    "port": 143,
    "secure": false // STARTTLS will be used
  }
}
```

**Port 465 with SSL/TLS (SMTP):**

```json
{
  "smtp": {
    "port": 465,
    "secure": true
  }
}
```

**Port 587 with STARTTLS (SMTP):**

```json
{
  "smtp": {
    "port": 587,
    "secure": false // STARTTLS will be used
  }
}
```

### Self-Signed Certificates

For development or self-hosted servers with self-signed certificates, you can disable certificate verification.

**Per-account setting:**

Set `tls.rejectUnauthorized: false` when registering the account:

```json
{
  "imap": {
    "host": "mail.example.com",
    "port": 993,
    "secure": true,
    "tls": {
      "rejectUnauthorized": false
    }
  },
  "smtp": {
    "host": "mail.example.com",
    "port": 587,
    "secure": false,
    "tls": {
      "rejectUnauthorized": false
    }
  }
}
```

**Global setting for all accounts:**

To disable certificate verification for all IMAP/SMTP connections, set the `ignoreMailCertErrors` setting:

```bash
curl -X POST https://your-ee.com/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ignoreMailCertErrors": true
  }'
```

Or via environment variable: `EENGINE_SETTINGS='{"ignoreMailCertErrors": true}'`

:::warning Security Warning
Only disable certificate verification for development/testing. In production, use proper SSL/TLS certificates (e.g., from Let's Encrypt).
:::

## Adding Accounts via API

### Basic IMAP/SMTP Account

Add accounts using the [Register Account API endpoint](/docs/api/post-v-1-account):

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "john@example.com",
        "pass": "password"
      }
    },
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "john@example.com",
        "pass": "password"
      }
    }
  }'
```

### IMAP-Only Account

For read-only access without sending capability:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "john@example.com",
        "pass": "password"
      }
    }
  }'
```

### SMTP-Only Account

For send-only access:

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "john@example.com",
        "pass": "password"
      }
    }
  }'
```

## Adding Accounts via Hosted Authentication Form

Users can add their own accounts through EmailEngine's web interface:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "john@example.com",
    "redirectUrl": "https://myapp.com/settings"
  }'
```

EmailEngine will generate a form URL where users can:

1. Enter their IMAP/SMTP settings
2. Test the connection
3. Complete setup

EmailEngine can auto-detect settings for many common providers.

[Learn more about hosted authentication →](/docs/accounts/hosted-authentication)

## Testing Connection

Before adding an account, verify credentials work:

```bash
curl -X POST https://your-ee.com/v1/verifyAccount \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "john@example.com",
        "pass": "password"
      }
    },
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "john@example.com",
        "pass": "password"
      }
    }
  }'
```

Response if successful:

```json
{
  "imap": {
    "success": true
  },
  "smtp": {
    "success": true
  }
}
```

## Advanced Configuration

### Custom Sent Mail Path

Override the Sent folder path when EmailEngine's auto-detection fails. This can happen when:

- The server doesn't support the SPECIAL-USE extension and uses a folder name that EmailEngine's heuristics don't recognize
- The server uses localized folder names (e.g., Microsoft 365 over IMAP without SPECIAL-USE support may use language-specific names)
- A mail client created a Sent folder at a different path than the server default, and you want sent emails stored there

```json
{
  "imap": {
    "sentMailPath": "Sent Items"
  }
}
```

Common folder name variations:

- `Sent` (most providers)
- `Sent Messages` (some providers)
- `Sent Items` (Microsoft Exchange)
- `[Gmail]/Sent Mail` (Gmail)

[Learn more about custom special folder paths →](/docs/accounts#custom-special-folder-paths)

### Path Filtering

Sync only specific folders:

```json
{
  "path": ["INBOX", "\\Sent", "\\Drafts", "Important"]
}
```

[Learn more about limiting indexed folders →](/docs/advanced/performance-tuning#limiting-indexed-folders)

### Sub-Connections

Monitor additional folders in real-time:

```json
{
  "subconnections": ["\\Sent", "Important"]
}
```

[Learn more about sub-connections →](/docs/advanced/performance-tuning#sub-connections-for-selected-folders)

### Proxy Configuration

Route EmailEngine's outbound IMAP/SMTP connections through a SOCKS or HTTP proxy server.

**Per-account proxy:**

Set the `proxy` field at the account level (not inside imap/smtp objects):

```json
{
  "account": "example",
  "proxy": "socks5://proxy.example.com:1080",
  "imap": {
    "host": "imap.example.com",
    "port": 993,
    "secure": true,
    "auth": {
      "user": "user@example.com",
      "pass": "password"
    }
  },
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "user@example.com",
      "pass": "password"
    }
  }
}
```

**Global proxy for all accounts:**

Configure a default proxy for all accounts via the settings API:

```bash
curl -X POST https://your-ee.com/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proxyEnabled": true,
    "proxyUrl": "socks5://proxy.example.com:1080"
  }'
```

**Supported proxy protocols:**

- `socks5://` - SOCKS5 proxy (recommended)
- `socks4://` - SOCKS4 proxy
- `http://` - HTTP proxy
- `https://` - HTTPS proxy

Per-account proxy settings override the global proxy setting.

## Security Best Practices

### Credential Storage

- EmailEngine stores credentials encrypted in Redis (if secret encryption is enabled)
- Use app-specific passwords when available
- Avoid using main account passwords
- Consider OAuth2 for Gmail and Outlook

[Learn about secret encryption →](/docs/configuration)

### Network Security

- Use SSL/TLS connections (port 993 for IMAP, 465 for SMTP)
- Or use STARTTLS (port 143 for IMAP, 587 for SMTP)
- Never use unencrypted connections (ports 143/25 without STARTTLS)
- Verify SSL certificates in production

### Access Control

- Limit EmailEngine API access with strong tokens
- Use IP restrictions where possible
- Monitor account access logs
- Rotate passwords regularly

## Performance Considerations

### Connection Pooling

EmailEngine maintains persistent connections to IMAP servers:

- Reduces connection overhead
- Enables real-time IMAP IDLE notifications
- Respects provider connection limits (typically 10-15 concurrent connections)

### Rate Limiting

Be aware of provider limits:

**Gmail:**

- 15 concurrent connections
- 2500 MB download/day
- 500 MB upload/day

**Outlook.com:**

- 15 concurrent connections
- Various rate limits on operations

**Self-hosted:**

- Limits depend on server configuration
- Monitor server resources

### Optimization Tips

- Use path filtering to reduce folder sync overhead
- Use sub-connections only for critical folders
- Monitor and respect provider rate limits
- Consider using native APIs (Gmail API, MS Graph) for high-volume accounts

[Learn more about performance tuning →](/docs/advanced/performance-tuning)

## Migration from Other Systems

### From Direct IMAP/SMTP Integration

If migrating from direct IMAP/SMTP usage in your app:

1. Set up EmailEngine with your existing credentials
2. Update your app to use EmailEngine's REST API instead of IMAP/SMTP
3. Benefit from EmailEngine's connection management, webhooks, and error handling

### From OAuth2-Based Systems

If migrating from OAuth2-based systems:

- Consider using EmailEngine's OAuth2 support instead of IMAP/SMTP
- See [Gmail OAuth2 guide](./gmail-imap) or [Outlook OAuth2 guide](./outlook-365)
- OAuth2 provides better security and user experience
