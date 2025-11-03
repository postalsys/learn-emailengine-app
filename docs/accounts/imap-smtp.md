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

**Outlook.com / Hotmail.com:**
- May require app-specific password
- See [Outlook guide](./outlook-365) for OAuth2 alternative

**Yahoo Mail:**
- Requires app-specific password
- Generate at [Yahoo Account Security](https://login.yahoo.com/account/security)

**iCloud Mail:**
- Requires app-specific password
- Generate at [Apple ID Account](https://appleid.apple.com/)

**AOL Mail:**
- Requires app-specific password
- Generate at AOL Account Security settings

### Providers with Standard Authentication

These typically work with regular passwords:

- **Fastmail**
- **ProtonMail Bridge** (requires local bridge software)
- **Zoho Mail**
- **Mail.ru**
- **Yandex Mail**
- **GMX Mail**
- **Mail.com**
- Self-hosted mail servers (Postfix, Dovecot, Exchange, etc.)

### Self-Hosted Servers

IMAP/SMTP works with any standard-compliant mail server:
- **Postfix + Dovecot**
- **Microsoft Exchange**
- **Zimbra**
- **MDaemon**
- **MailEnable**
- **hMailServer**

## Common IMAP/SMTP Settings

### Gmail

```
IMAP:
  Host: imap.gmail.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp.gmail.com
  Port: 587
  Secure: false (STARTTLS)

Authentication: App password required if 2FA enabled
```

### Outlook.com / Hotmail.com / Live.com

```
IMAP:
  Host: outlook.office365.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp-mail.outlook.com
  Port: 587
  Secure: false (STARTTLS)
```

### Yahoo Mail

```
IMAP:
  Host: imap.mail.yahoo.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp.mail.yahoo.com
  Port: 587
  Secure: false (STARTTLS)

Authentication: App password required
```

### iCloud Mail

```
IMAP:
  Host: imap.mail.me.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp.mail.me.com
  Port: 587
  Secure: false (STARTTLS)

Authentication: App-specific password required
```

### AOL Mail

```
IMAP:
  Host: imap.aol.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp.aol.com
  Port: 587
  Secure: false (STARTTLS)

Authentication: App password required
```

### Fastmail

```
IMAP:
  Host: imap.fastmail.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp.fastmail.com
  Port: 587
  Secure: false (STARTTLS)
```

### Zoho Mail

```
IMAP:
  Host: imap.zoho.com
  Port: 993
  Secure: true (SSL/TLS)

SMTP:
  Host: smtp.zoho.com
  Port: 587
  Secure: false (STARTTLS)
```

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
      "pass": "abcd efgh ijkl mnop"  // App password
    }
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "john@gmail.com",
      "pass": "abcd efgh ijkl mnop"  // Same app password
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
    "secure": false  // STARTTLS will be used
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
    "secure": false  // STARTTLS will be used
  }
}
```

**Port 25 (SMTP, usually for server-to-server):**
```json
{
  "smtp": {
    "port": 25,
    "secure": false
  }
}
```

### Self-Signed Certificates

For development or self-hosted servers with self-signed certificates:

```json
{
  "imap": {
    "host": "mail.example.com",
    "port": 993,
    "secure": true,
    "tls": {
      "rejectUnauthorized": false  // Accept self-signed certificates
    }
  }
}
```

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
curl -X POST https://your-ee.com/v1/verifyaccount \
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

## Troubleshooting

### Authentication Failures

**"Invalid credentials" or "Authentication failed":**
- Verify username and password are correct
- Check if provider requires app-specific password
- Ensure 2FA is configured correctly
- Try unlocking account (some providers like Gmail may block "suspicious" activity)

**Gmail-specific unlock:** Visit [https://accounts.google.com/b/0/displayunlockcaptcha](https://accounts.google.com/b/0/displayunlockcaptcha)

### Connection Failures

**"Connection timeout" or "ECONNREFUSED":**
- Verify host and port are correct
- Check firewall rules allow outbound connections
- Verify server is online and accessible
- Try alternative ports (993/143 for IMAP, 465/587/25 for SMTP)

**"Certificate verification failed":**
- Server may use self-signed certificate
- Set `tls.rejectUnauthorized: false` for testing (not recommended for production)
- Install proper SSL certificate on server

### Protocol-Specific Issues

**IMAP IDLE not working:**
- Some providers don't support IDLE
- EmailEngine will fall back to polling
- Check provider documentation

**SMTP "Relay access denied":**
- Verify SMTP authentication is enabled
- Check if account has send permissions
- Some servers require authentication before sending

**Port 25 blocked:**
- Many ISPs and cloud providers block port 25
- Use port 587 with STARTTLS instead
- Or port 465 with SSL/TLS

### Provider-Specific Issues

**Gmail:**
- Enable "Less secure app access" (deprecated, use OAuth2 or app passwords)
- Generate app-specific password if 2FA enabled
- May need to unlock account after first connection attempt

**Yahoo/AOL:**
- App passwords are required
- Regular password will not work

**iCloud:**
- App-specific password required
- Generate at appleid.apple.com

**Microsoft 365:**
- IMAP/SMTP may be disabled by admin
- Check admin center settings
- Consider using OAuth2 or MS Graph API

## Advanced Configuration

### Custom Sent Mail Path

Some providers use non-standard names for the Sent folder:

```json
{
  "imap": {
    "sentMailPath": "Sent Items"  // Microsoft Exchange
  }
}
```

Common variations:
- `Sent` (most providers)
- `Sent Messages` (some providers)
- `Sent Items` (Microsoft Exchange)
- `[Gmail]/Sent Mail` (Gmail)

### Path Filtering

Sync only specific folders:

```json
{
  "path": [
    "INBOX",
    "\\Sent",
    "\\Drafts",
    "Important"
  ]
}
```

[Learn more about path filtering →](/docs/advanced/performance-tuning#path-filtering)

### Sub-Connections

Monitor additional folders in real-time:

```json
{
  "subconnections": [
    "\\Sent",
    "Important"
  ]
}
```

[Learn more about sub-connections →](/docs/advanced/performance-tuning#sub-connections)

### Proxy Configuration

Route connections through a proxy:

```json
{
  "imap": {
    "proxy": "socks://proxy.example.com:1080"
  },
  "smtp": {
    "proxy": "socks://proxy.example.com:1080"
  }
}
```

[Learn more about proxying connections →](./proxying-connections)

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
