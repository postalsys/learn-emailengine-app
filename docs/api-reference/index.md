---
title: API Reference Overview
description: Complete API reference for EmailEngine with authentication, conventions, and error handling
sidebar_position: 1
---

# EmailEngine API Reference

The EmailEngine API provides a comprehensive RESTful interface for managing email accounts, sending and receiving messages, and configuring webhooks. This API allows you to integrate email functionality into your applications without dealing with IMAP/SMTP protocols directly.

## Overview

### What is the EmailEngine API

The EmailEngine API is a RESTful HTTP API that:

- Manages email accounts across multiple providers (Gmail, Outlook, IMAP/SMTP)
- Sends and receives emails programmatically
- Provides real-time notifications via webhooks
- Handles OAuth2 authentication automatically
- Maintains mailbox synchronization in the background

### Architecture

- **RESTful design**: Uses standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON format**: All requests and responses use JSON
- **Stateless**: Each request contains all necessary authentication
- **Event-driven**: Webhooks notify your application of changes in real-time

## Base URL

The default base URL for all API endpoints is:

```
http://localhost:3000/v1
```

For production deployments, replace with your EmailEngine instance URL:

```
https://emailengine.yourdomain.com/v1
```

:::tip IPv6 Note
If you encounter connection issues with `localhost`, try using `127.0.0.1` instead. On some systems, `localhost` resolves to IPv6 (`::1`) which may cause connection failures if EmailEngine is only listening on IPv4.

```bash
# Use 127.0.0.1 instead of localhost
curl http://127.0.0.1:3000/v1/accounts
```
:::

### Versioning

The API version is included in the URL path (`/v1`). This ensures backward compatibility when new versions are released.

## Authentication

All API requests require authentication using Bearer tokens.

### API Token Authentication

Include your access token in the `Authorization` header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Creating Access Tokens

**Via Settings Page:**
1. Log in to the EmailEngine web interface
2. Navigate to Settings > Access Tokens
3. Click "Generate new token"
4. Assign a description and optional scope
5. Copy the generated token

**Via API:**
```bash
curl -X POST http://localhost:3000/v1/token \
  -H "Authorization: Bearer EXISTING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "My API Token",
    "scopes": ["api"]
  }'
```

**Via CLI:**
```bash
emailengine tokens issue -d "My token" -s "*"
```

### Token Types

- **Full access** (`"*"`): Unrestricted API access
- **API only** (`"api"`): API calls only (no metrics)
- **Metrics only** (`"metrics"`): Prometheus metrics endpoint only
- **Account-specific**: Restricted to operations on a single account

### Security Best Practices

- Never expose tokens in client-side code
- Use environment variables for token storage
- Rotate tokens periodically
- Use account-specific tokens when possible
- Revoke unused tokens immediately

## Making Requests

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve resources | Get account details |
| POST | Create resources | Register new account |
| PUT | Update resources | Update message flags |
| DELETE | Remove resources | Delete account |

### Request Headers

Required headers for most requests:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Request Body Format

Use JSON for request bodies:

```json
{
  "account": "user@example.com",
  "name": "John Doe",
  "imap": {
    "host": "imap.example.com",
    "port": 993,
    "secure": true,
    "auth": {
      "user": "user@example.com",
      "pass": "password"
    }
  }
}
```

### Example Requests

**cURL:**
```bash
curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Pseudo code:**
```
// Make HTTP GET request to the accounts endpoint
response = HTTP_GET("http://localhost:3000/v1/accounts", {
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
  }
})

// Parse JSON response
accounts = PARSE_JSON(response.body)

// Display results
PRINT(accounts)
```

## Response Format

### Success Responses

Successful requests return HTTP status codes in the 2xx range:

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **204 No Content**: Request succeeded with no response body

Example success response:

```json
{
  "success": true,
  "account": "user@example.com",
  "state": "connected"
}
```

### Error Responses

Error requests return HTTP status codes in the 4xx or 5xx range:

- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

Example error response:

```json
{
  "error": "Account not found",
  "code": "AccountNotFound",
  "statusCode": 404
}
```

### Response Structure

Most successful responses follow this structure:

```json
{
  "success": true,
  "data": { /* resource data */ },
  "metadata": { /* pagination, timing, etc */ }
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Verify authentication token |
| 403 | Forbidden | Check token permissions |
| 404 | Not Found | Verify resource exists |
| 429 | Too Many Requests | Implement retry with backoff |
| 500 | Server Error | Retry after delay |
| 503 | Service Unavailable | Service restarting, retry |

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": { /* optional additional context */ }
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `InvalidRequest` | Request validation failed | Check required fields |
| `AuthenticationRequired` | Missing authentication | Provide valid token |
| `AccountNotFound` | Account doesn't exist | Verify account ID |
| `MessageNotFound` | Message doesn't exist | Check message ID |
| `RateLimitExceeded` | Too many requests | Implement backoff |
| `ConnectionError` | Can't connect to mail server | Check credentials |

### Retry Strategies

For transient errors (429, 500, 503):

```
// Pseudo code for retry logic with exponential backoff
function retryRequest(url, options, maxRetries = 3) {
  for (i = 0; i < maxRetries; i++) {
    response = HTTP_REQUEST(url, options)

    if (response.status >= 200 AND response.status < 300) {
      return response
    }

    if (response.status == 429 OR response.status >= 500) {
      // Exponential backoff: 1s, 2s, 4s
      delay = POWER(2, i) * 1000  // milliseconds
      SLEEP(delay)
      continue
    }

    THROW_ERROR("Request failed with status: " + response.status)
  }

  THROW_ERROR("Max retries exceeded")
}
```

## Pagination

For endpoints that return lists (accounts, messages, etc.), use pagination parameters:

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 0 | Page number (0-indexed) |
| `pageSize` | number | 20 | Items per page |
| `cursor` | string | - | Paging cursor from nextPageCursor or prevPageCursor |

### Example Request

```bash
curl "http://localhost:3000/v1/account/user@example.com/messages?path=INBOX&page=0&pageSize=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response Metadata

Paginated responses include navigation metadata:

```json
{
  "total": 523,
  "page": 0,
  "pages": 11,
  "messages": [ /* message objects */ ]
}
```

### Navigation Example

```
// Pseudo code: Fetch all pages of messages
function fetchAllMessages(account) {
  page = 0
  allMessages = []
  hasMore = true

  while (hasMore) {
    // Build URL with pagination parameters
    url = "http://localhost:3000/v1/account/" + account + "/messages?path=INBOX&page=" + page + "&pageSize=100"

    // Make HTTP GET request
    response = HTTP_GET(url, {
      headers: { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
    })

    // Parse response
    data = PARSE_JSON(response.body)

    // Add messages to collection
    allMessages = allMessages + data.messages

    // Check if more pages exist
    hasMore = (page < data.pages - 1)
    page = page + 1
  }

  return allMessages
}
```

## Filtering & Search

### Query Parameters

Many list endpoints support filtering:

```bash
# Filter by mailbox path
curl "http://localhost:3000/v1/account/user@example.com/messages?path=INBOX"

# Filter by flags
curl "http://localhost:3000/v1/account/user@example.com/messages?unseen=true"
```

### Search Syntax

Use the search endpoint for advanced queries:

```bash
curl -X POST http://localhost:3000/v1/account/user@example.com/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "from": "sender@example.com",
      "subject": "Important"
    }
  }'
```

### Sorting Results

Some endpoints support sorting:

```bash
# Sort messages by date descending (newest first)
curl "http://localhost:3000/v1/account/user@example.com/messages?sort=date:desc"
```

## Rate Limiting

EmailEngine implements rate limiting to ensure fair usage and system stability.

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1640995200
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining in window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

### Handling 429 Too Many Requests

When rate limited, you'll receive:

```json
{
  "error": "Rate limit exceeded",
  "code": "RateLimitExceeded",
  "statusCode": 429,
  "retryAfter": 60
}
```

Implement exponential backoff:

```
// Pseudo code: Handle rate limiting with backoff
function makeRequestWithBackoff(url, options) {
  response = HTTP_REQUEST(url, options)

  if (response.status == 429) {
    // Get retry delay from header or use default
    retryAfter = response.headers['Retry-After'] OR 60

    // Wait before retrying
    SLEEP(retryAfter * 1000)  // Convert to milliseconds

    // Recursive retry
    return makeRequestWithBackoff(url, options)
  }

  return response
}
```

## Webhooks

Instead of polling the API, use webhooks to receive real-time notifications.

### Event-Driven Architecture

Webhooks provide instant notifications when:
- New messages arrive
- Messages are deleted or updated
- Accounts connect or disconnect
- Messages are sent or fail

### Benefits

- **Real-time**: Immediate notification of events
- **Efficient**: No polling overhead
- **Scalable**: Handles high-volume accounts
- **Reliable**: Automatic retry logic

### Setup

Register a webhook endpoint:

```bash
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://your-app.com/webhook",
    "webhookEvents": ["messageNew", "messageSent"]
  }'
```

Learn more in the [Webhooks API documentation](./webhooks-api.md).

## Quick Start Example

Here's a complete workflow showing the most common operations:

```
// Pseudo code: Complete EmailEngine API workflow

BASE_URL = "http://localhost:3000/v1"
TOKEN = "YOUR_ACCESS_TOKEN"

// 1. Register an email account
registerResponse = HTTP_POST(BASE_URL + "/account", {
  headers: {
    "Authorization": "Bearer " + TOKEN,
    "Content-Type": "application/json"
  },
  body: {
    account: "user@example.com",
    name: "John Doe",
    imap: {
      host: "imap.example.com",
      port: 993,
      secure: true,
      auth: {
        user: "user@example.com",
        pass: "password"
      }
    },
    smtp: {
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "user@example.com",
        pass: "password"
      }
    }
  }
})

account = PARSE_JSON(registerResponse.body).account
PRINT("Account registered: " + account)

// 2. Wait for account to connect (or use webhook)
SLEEP(5000)  // Wait 5 seconds

// 3. Send an email
sendResponse = HTTP_POST(BASE_URL + "/account/" + account + "/submit", {
  headers: {
    "Authorization": "Bearer " + TOKEN,
    "Content-Type": "application/json"
  },
  body: {
    to: [{ address: "recipient@example.com" }],
    subject: "Hello from EmailEngine",
    text: "This is a test email sent via the API"
  }
})

messageId = PARSE_JSON(sendResponse.body).messageId
PRINT("Email sent: " + messageId)

// 4. List recent messages
messagesResponse = HTTP_GET(
  BASE_URL + "/account/" + account + "/messages?path=INBOX&pageSize=10",
  {
    headers: { "Authorization": "Bearer " + TOKEN }
  }
)

messages = PARSE_JSON(messagesResponse.body).messages
PRINT("Recent messages: " + LENGTH(messages))

// 5. Setup webhook for new messages
HTTP_POST(BASE_URL + "/settings", {
  headers: {
    "Authorization": "Bearer " + TOKEN,
    "Content-Type": "application/json"
  },
  body: {
    webhooks: "https://your-app.com/webhook",
    webhookEvents: ["messageNew"]
  }
})

PRINT("Webhook configured")
```

## API Categories

The EmailEngine API is organized into these main categories:

### Accounts API
Manage email accounts, credentials, and connections.

- Register and delete accounts
- Update account settings
- Monitor account status
- Handle OAuth2 authentication

[View Accounts API documentation](./accounts-api.md)

### Messages API
Read, search, and manage email messages.

- List and filter messages
- Get message details and source
- Update message flags
- Move and delete messages
- Search messages

[View Messages API documentation](./messages-api.md)

### Sending API
Send emails with attachments and templates.

- Send immediate emails (Submit API)
- Queue emails for later (Outbox API)
- Handle replies and forwards
- Track delivery status

[View Sending API documentation](./sending-api.md)

### Webhooks API
Configure webhooks and event notifications.

- Register webhook endpoints
- Filter events
- Secure webhooks
- Monitor webhook delivery

[View Webhooks API documentation](./webhooks-api.md)

### Full API Reference
Complete auto-generated API documentation with all endpoints, parameters, and examples.

[Browse full API reference](/docs/api-reference)

## Support

- **Documentation**: Browse the complete [documentation](/docs)
- **GitHub Issues**: Report bugs or request features
- **Community**: Join discussions on GitHub
- **Professional Support**: Contact for enterprise support options
