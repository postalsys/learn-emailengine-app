---
title: Quick Reference
sidebar_position: 11
description: Quick reference cards for EmailEngine API endpoints, webhook events, environment variables, and error codes
---

# Quick Reference

Quick lookup tables for common EmailEngine configuration and API usage.

## Webhook Events Summary

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `messageNew` | New email received | Email arrives in any folder |
| `messageDeleted` | Email deleted | Email moved to trash or permanently deleted |
| `messageUpdated` | Email flags changed | Read/unread, flagged, labels modified |
| `messageSent` | Email sent successfully | Outgoing email delivered to server |
| `messageFailed` | Email send failed | Delivery error after retries |
| `messageBounce` | Bounce notification | Bounce report received |
| `messageDeliveryError` | Delivery issue | SMTP error during send |
| `messageComplaint` | Spam complaint | Abuse report (ARF) received |
| `messageMissing` | Message not found | Message disappeared from server |
| `accountAdded` | Account registered | New account created via API |
| `accountDeleted` | Account removed | Account deleted from EmailEngine |
| `accountInitialized` | Account ready | Account fully initialized and synced |
| `authenticationError` | Auth failed | Invalid credentials or expired token |
| `authenticationSuccess` | Auth succeeded | Successfully authenticated |
| `connectError` | Connection error | Network or protocol error |
| `mailboxNew` | Mailbox created | New folder detected |
| `mailboxDeleted` | Mailbox removed | Folder deleted |
| `mailboxReset` | Mailbox reset | Folder contents changed significantly |
| `trackOpen` | Email opened | Tracking pixel loaded |
| `trackClick` | Link clicked | Tracked link accessed |
| `listUnsubscribe` | Unsubscribe request | User unsubscribed via List-Unsubscribe |
| `listSubscribe` | Subscribe request | User re-subscribed to a list |

See [Webhook Events Reference](/docs/reference/webhook-events) for complete payload documentation.

## API Endpoints Summary

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/account` | Register new account |
| `GET` | `/v1/account/{account}` | Get account details |
| `PUT` | `/v1/account/{account}` | Update account |
| `DELETE` | `/v1/account/{account}` | Delete account |
| `GET` | `/v1/accounts` | List all accounts |
| `PUT` | `/v1/account/{account}/reconnect` | Force reconnect |

### Message Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/account/{account}/messages` | List messages |
| `GET` | `/v1/account/{account}/message/{message}` | Get message details |
| `GET` | `/v1/account/{account}/message/{message}/source` | Get raw email |
| `DELETE` | `/v1/account/{account}/message/{message}` | Delete message |
| `PUT` | `/v1/account/{account}/message/{message}` | Update flags/move |
| `GET` | `/v1/account/{account}/search` | Search messages |

### Sending Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/account/{account}/submit` | Send email |
| `GET` | `/v1/outbox` | List queued emails |
| `GET` | `/v1/outbox/{queueId}` | Get queued email |
| `DELETE` | `/v1/outbox/{queueId}` | Cancel queued email |

### Mailbox Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/account/{account}/mailboxes` | List mailboxes |
| `POST` | `/v1/account/{account}/mailbox` | Create mailbox |
| `DELETE` | `/v1/account/{account}/mailbox` | Delete mailbox |

### Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/account/{account}/attachment/{attachment}` | Download attachment |

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `EENGINE_REDIS` | Redis connection URL | `redis://localhost:6379/8` |
| `EENGINE_SECRET` | Encryption secret (32+ chars) | `openssl rand -hex 32` |

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `EENGINE_PORT` | `3000` | HTTP API port |
| `EENGINE_HOST` | `127.0.0.1` | Bind address |
| `EENGINE_WORKERS` | `4` | IMAP worker threads |
| `EENGINE_LOG_LEVEL` | `trace` | Log level (trace/debug/info/warn/error) |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `EENGINE_DISABLE_SETUP_WARNINGS` | `false` | Disable admin password warnings |
| `EENGINE_REQUIRE_API_AUTH` | `true` | Require API authentication |
| `EENGINE_LOG_RAW` | `false` | Log raw IMAP/SMTP traffic (includes unmasked credentials - debug only) |

### Pre-configured Settings

| Variable | Description |
|----------|-------------|
| `EENGINE_SETTINGS` | JSON string of runtime settings (webhooks, serviceUrl, etc.) |
| `EENGINE_PREPARED_LICENSE` | License key |
| `EENGINE_PREPARED_TOKEN` | Pre-configured API token (exported hash) |
| `EENGINE_PREPARED_PASSWORD` | Pre-configured admin password (hash) |

:::info OAuth2 and Webhooks
OAuth2 applications and webhooks are configured via the [Settings API](/docs/api/post-v-1-settings) or web interface, not environment variables. Use `EENGINE_SETTINGS` to pre-configure them at startup.
:::

See [Environment Variables](/docs/configuration/environment-variables) for complete list.

## Common Error Codes

### HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| `200` | Success | Request completed |
| `400` | Bad Request | Invalid parameters |
| `401` | Unauthorized | Missing/invalid token |
| `403` | Forbidden | Insufficient scope |
| `404` | Not Found | Account/message doesn't exist |
| `409` | Conflict | Duplicate account ID |
| `429` | Too Many Requests | Rate limited |
| `500` | Server Error | Internal error |
| `502` | Bad Gateway | Upstream provider error |

### Account Connection States

| State | Description | Action |
|-------|-------------|--------|
| `connected` | Active connection | Normal operation |
| `connecting` | Establishing connection | Wait for completion |
| `syncing` | Initial sync in progress | Wait for completion |
| `disconnected` | Connection lost | Will auto-reconnect |
| `authenticationError` | Credentials invalid | Update credentials or re-authenticate |
| `connectError` | Network/server error | Check server availability |

### Webhook Delivery Status

| Status | Description |
|--------|-------------|
| `queued` | Waiting to send |
| `active` | Currently sending |
| `completed` | Successfully delivered |
| `failed` | Delivery failed (will retry) |

## IMAP/SMTP Server Settings

### Gmail

| Setting | Value |
|---------|-------|
| IMAP Server | `imap.gmail.com` |
| IMAP Port | `993` (SSL) |
| SMTP Server | `smtp.gmail.com` |
| SMTP Port | `587` (STARTTLS) or `465` (SSL) |

### Outlook / Microsoft 365

| Setting | Value |
|---------|-------|
| IMAP Server | `outlook.office365.com` |
| IMAP Port | `993` (SSL) |
| SMTP Server | `smtp.office365.com` |
| SMTP Port | `587` (STARTTLS) |

### Yahoo Mail

| Setting | Value |
|---------|-------|
| IMAP Server | `imap.mail.yahoo.com` |
| IMAP Port | `993` (SSL) |
| SMTP Server | `smtp.mail.yahoo.com` |
| SMTP Port | `587` (STARTTLS) |

## OAuth2 Scopes

### Gmail

| Scope | Access Level |
|-------|--------------|
| `https://mail.google.com/` | Full access (IMAP/SMTP) |
| `https://www.googleapis.com/auth/gmail.readonly` | Read-only (API only) |
| `https://www.googleapis.com/auth/gmail.modify` | Read/write (API only) |
| `https://www.googleapis.com/auth/gmail.send` | Send only (API only) |

### Microsoft / Outlook

| Scope | Access Level |
|-------|--------------|
| `https://outlook.office.com/IMAP.AccessAsUser.All` | Full IMAP access |
| `https://outlook.office.com/SMTP.Send` | SMTP send access |
| `offline_access` | Refresh token support |

## Special Folder Paths

| Logical Path | Gmail | Outlook | Standard IMAP |
|--------------|-------|---------|---------------|
| `\Inbox` | `INBOX` | `Inbox` | `INBOX` |
| `\Sent` | `[Gmail]/Sent Mail` | `Sent Items` | `Sent` |
| `\Drafts` | `[Gmail]/Drafts` | `Drafts` | `Drafts` |
| `\Trash` | `[Gmail]/Trash` | `Deleted Items` | `Trash` |
| `\Junk` | `[Gmail]/Spam` | `Junk Email` | `Junk` |
| `\Archive` | `[Gmail]/All Mail` | `Archive` | `Archive` |

## Docker Quick Commands

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f emailengine

# Stop services
docker-compose down

# Update to latest
docker-compose pull && docker-compose up -d

# Check health
curl http://localhost:3000/health
```

## API Authentication

```bash
# Using Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/accounts

# Using query parameter
curl "http://localhost:3000/v1/accounts?access_token=YOUR_TOKEN"
```

## Common API Examples

### Register Account (OAuth2)

```bash
curl -X POST http://localhost:3000/v1/account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "user@gmail.com",
    "oauth2": {
      "provider": "OAUTH_APP_ID",
      "refreshToken": "REFRESH_TOKEN",
      "auth": {"user": "user@gmail.com"}
    }
  }'
```

### Send Email

```bash
curl -X POST http://localhost:3000/v1/account/user123/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"address": "recipient@example.com"}],
    "subject": "Hello",
    "text": "Hello World"
  }'
```

### Search Messages

```bash
curl "http://localhost:3000/v1/account/user123/search?search[subject]=invoice" \
  -H "Authorization: Bearer $TOKEN"
```

### Configure Webhooks

```bash
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhooks",
    "webhookEvents": ["messageNew", "messageSent"]
  }'
```
