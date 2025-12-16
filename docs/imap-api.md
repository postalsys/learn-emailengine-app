---
title: IMAP API - REST API Wrapper for IMAP Protocol
description: Access any IMAP mailbox through a simple REST API. EmailEngine converts complex IMAP protocol operations into easy HTTP requests with real-time webhooks.
sidebar_position: 2
slug: /imap-api
keywords:
  - IMAP API
  - IMAP REST API
  - IMAP wrapper
  - IMAP to REST
  - IMAP HTTP API
  - IMAP integration
---

# IMAP API - REST Interface for IMAP Mailboxes

EmailEngine provides a **REST API for IMAP mailboxes**, eliminating the need to implement complex IMAP protocol handling in your application.

## Why Use an IMAP API?

Working with IMAP directly requires:

- **Persistent TCP connections** - Managing long-lived socket connections
- **Protocol state machines** - Handling IMAP command sequences and states
- **IDLE implementation** - Maintaining connections for real-time updates
- **Provider quirks** - Dealing with non-standard implementations
- **Connection pooling** - Efficiently managing multiple mailbox connections
- **Error recovery** - Handling disconnections and reconnections

EmailEngine handles all of this complexity, exposing IMAP functionality through simple REST endpoints with real-time webhook notifications.

## IMAP API Operations

### List Mailboxes

Get all folders/mailboxes in an account:

```http
GET /v1/account/{account}/mailboxes
```

Response:
```json
{
  "mailboxes": [
    {"path": "INBOX", "messages": 1523, "unseen": 12},
    {"path": "Sent", "messages": 892, "unseen": 0},
    {"path": "Drafts", "messages": 3, "unseen": 0}
  ]
}
```

### List Messages

Retrieve messages from a mailbox:

```http
GET /v1/account/{account}/messages?path=INBOX&page=0&pageSize=20
```

Response:
```json
{
  "messages": [
    {
      "id": "AAAAAQAACnA",
      "uid": 1234,
      "date": "2025-01-15T10:30:00Z",
      "subject": "Meeting tomorrow",
      "from": {"address": "sender@example.com", "name": "John Doe"},
      "flags": ["\\Seen"]
    }
  ],
  "total": 1523,
  "page": 0,
  "pages": 77
}
```

### Get Message Content

Fetch full message with body and attachments:

```http
GET /v1/account/{account}/message/{messageId}
```

Response:
```json
{
  "id": "AAAAAQAACnA",
  "subject": "Meeting tomorrow",
  "from": {"address": "sender@example.com", "name": "John Doe"},
  "to": [{"address": "you@example.com"}],
  "date": "2025-01-15T10:30:00Z",
  "text": {
    "plain": "Hi, let's meet tomorrow at 2pm...",
    "html": "<p>Hi, let's meet tomorrow at 2pm...</p>"
  },
  "attachments": [
    {
      "id": "ATT001",
      "filename": "agenda.pdf",
      "contentType": "application/pdf",
      "size": 45231
    }
  ]
}
```

### Search Messages

Search using IMAP search criteria:

```http
GET /v1/account/{account}/search?search[from]=john@example.com&search[subject]=invoice
```

Or with full-text search:

```http
GET /v1/account/{account}/search?search[body]=quarterly%20report
```

### Move/Copy Messages

Move a message to another folder:

```http
PUT /v1/account/{account}/message/{messageId}/move
Content-Type: application/json

{
  "path": "Archive"
}
```

### Update Flags

Mark messages as read, flagged, etc:

```http
PUT /v1/account/{account}/message/{messageId}
Content-Type: application/json

{
  "flags": {
    "add": ["\\Seen"],
    "delete": ["\\Flagged"]
  }
}
```

### Delete Messages

Move to trash or permanently delete:

```http
DELETE /v1/account/{account}/message/{messageId}
```

### Download Attachments

```http
GET /v1/account/{account}/attachment/{attachmentId}
```

## Real-Time Updates via Webhooks

EmailEngine maintains IMAP IDLE connections and sends webhooks when changes occur - no polling needed.

### New Message Webhook

```json
{
  "event": "messageNew",
  "account": "my-account",
  "data": {
    "id": "AAAAAQAACnB",
    "uid": 1235,
    "path": "INBOX",
    "subject": "New inquiry",
    "from": {"address": "prospect@example.com"}
  }
}
```

### Message Updated Webhook

```json
{
  "event": "messageUpdated",
  "account": "my-account",
  "data": {
    "id": "AAAAAQAACnA",
    "changes": {
      "flags": {
        "added": ["\\Seen"],
        "deleted": []
      }
    }
  }
}
```

### Message Deleted Webhook

```json
{
  "event": "messageDeleted",
  "account": "my-account",
  "data": {
    "id": "AAAAAQAACnA",
    "path": "INBOX"
  }
}
```

[Full webhooks documentation →](/docs/webhooks/overview)

## Supported IMAP Providers

EmailEngine works with any IMAP server:

| Provider | Authentication | Notes |
|----------|---------------|-------|
| **Gmail** | OAuth2 or App Password | Full support including labels |
| **Google Workspace** | OAuth2 | Domain-wide delegation available |
| **Microsoft 365** | OAuth2 | Or use Microsoft Graph API |
| **Outlook.com** | OAuth2 | Consumer accounts |
| **Yahoo Mail** | OAuth2 | Including AOL, Verizon |
| **FastMail** | App Password | Full IMAP support |
| **ProtonMail** | Via Bridge | Requires ProtonMail Bridge |
| **Zoho Mail** | App Password | IMAP enabled accounts |
| **Custom IMAP** | User/Password or OAuth2 | Any standard IMAP server |

## IMAP API vs Direct IMAP

| Aspect | Direct IMAP | EmailEngine IMAP API |
|--------|-------------|---------------------|
| **Connection Management** | You handle | Automatic |
| **Real-time Updates** | Implement IDLE | Webhooks |
| **Authentication** | Handle OAuth2 flows | Built-in |
| **Error Recovery** | Build yourself | Automatic reconnection |
| **Protocol Complexity** | Full IMAP knowledge | Simple REST calls |
| **Scaling** | Connection pooling | Managed per-account |

## Performance Considerations

### Data Fetching

EmailEngine fetches message content on-demand from the IMAP server:

- **Metadata** (subject, from, date, flags) - Cached in Redis
- **Body content** - Fetched from IMAP when requested
- **Attachments** - Streamed from IMAP server

This means:
- First fetch may be slower than cached solutions
- No email content stored on your servers
- Always up-to-date with mailbox state

### Connection Handling

- One IMAP connection per registered account
- Automatic IDLE for real-time updates
- Reconnection on network issues
- Connection pooling for SMTP

## Get Started with IMAP API

### 1. Install EmailEngine

```bash
# Using Docker
docker run -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379/8" \
  postalsys/emailengine:v2
```

[Full installation guide →](/docs/installation)

### 2. Register an IMAP Account

```bash
curl -X POST http://localhost:3000/v1/account \
  -H "Content-Type: application/json" \
  -d '{
    "account": "my-mailbox",
    "email": "user@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "user@example.com",
        "pass": "your-password"
      }
    }
  }'
```

### 3. List Messages

```bash
curl http://localhost:3000/v1/account/my-mailbox/messages?path=INBOX
```

### 4. Configure Webhooks

```bash
curl -X POST http://localhost:3000/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks",
    "events": ["messageNew", "messageUpdated", "messageDeleted"]
  }'
```

## IMAP API Documentation

- [Account Management](/docs/accounts/managing-accounts) - Register and configure IMAP accounts
- [Messages API](/docs/api-reference/messages-api) - List, read, search, and manage messages
- [Webhooks](/docs/webhooks/overview) - Real-time event notifications
- [Gmail Setup](/docs/accounts/gmail-imap) - Configure Gmail IMAP access
- [Performance Tuning](/docs/advanced/performance-tuning) - Optimize for high volume

## Alternative: Native Provider APIs

For Gmail and Microsoft 365, EmailEngine also supports native APIs:

- **Gmail API** - Direct Google API integration with Pub/Sub
- **Microsoft Graph API** - Native Microsoft 365 integration

These provide additional features like native threading and can be faster for some operations.

[Gmail API setup →](/docs/accounts/gmail-api) | [Microsoft Graph setup →](/docs/accounts/outlook-365)

## Try EmailEngine Free

Start with a 14-day free trial - access any IMAP mailbox via REST API.

[Start Free Trial](https://postalsys.com/plans) | [View Documentation](/docs/api-reference) | [GitHub](https://github.com/postalsys/emailengine)
