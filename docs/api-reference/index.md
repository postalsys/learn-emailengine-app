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

**Node.js:**
```javascript
const fetch = require('node-fetch');

const response = await fetch('http://localhost:3000/v1/accounts', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
});

const accounts = await response.json();
console.log(accounts);
```

**Python:**
```python
import requests

response = requests.get(
    'http://localhost:3000/v1/accounts',
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
)

accounts = response.json()
print(accounts)
```

**PHP:**
```php
<?php
$ch = curl_init('http://localhost:3000/v1/accounts');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_ACCESS_TOKEN'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$accounts = json_decode($response, true);
print_r($accounts);
```

**cURL:**
```bash
curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

```javascript
async function retryRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if (response.status === 429 || response.status >= 500) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
      continue;
    }

    throw new Error(`Request failed: ${response.status}`);
  }

  throw new Error('Max retries exceeded');
}
```

## Pagination

For endpoints that return lists (accounts, messages, etc.), use pagination parameters:

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 0 | Page number (0-indexed) |
| `limit` | number | 20 | Items per page (max 250) |

### Example Request

```bash
curl "http://localhost:3000/v1/account/user@example.com/messages?page=0&limit=50" \
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

```javascript
// Fetch all pages
async function fetchAllMessages(account) {
  let page = 0;
  let allMessages = [];
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `http://localhost:3000/v1/account/${account}/messages?page=${page}&limit=100`,
      { headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' } }
    );

    const data = await response.json();
    allMessages.push(...data.messages);

    hasMore = page < data.pages - 1;
    page++;
  }

  return allMessages;
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

```javascript
async function makeRequestWithBackoff(url, options) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 60;
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeRequestWithBackoff(url, options);
  }

  return response;
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

```javascript
const BASE_URL = 'http://localhost:3000/v1';
const TOKEN = 'YOUR_ACCESS_TOKEN';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

// 1. Register an email account
const registerResponse = await fetch(`${BASE_URL}/account`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    account: 'user@example.com',
    name: 'John Doe',
    imap: {
      host: 'imap.example.com',
      port: 993,
      secure: true,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    },
    smtp: {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    }
  })
});

const { account } = await registerResponse.json();
console.log('Account registered:', account);

// 2. Wait for account to connect (or use webhook)
await new Promise(resolve => setTimeout(resolve, 5000));

// 3. Send an email
const sendResponse = await fetch(`${BASE_URL}/account/${account}/submit`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    to: [{ address: 'recipient@example.com' }],
    subject: 'Hello from EmailEngine',
    text: 'This is a test email sent via the API'
  })
});

const { messageId } = await sendResponse.json();
console.log('Email sent:', messageId);

// 4. List recent messages
const messagesResponse = await fetch(
  `${BASE_URL}/account/${account}/messages?limit=10`,
  { headers }
);

const { messages } = await messagesResponse.json();
console.log('Recent messages:', messages.length);

// 5. Setup webhook for new messages
await fetch(`${BASE_URL}/settings`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    webhooks: 'https://your-app.com/webhook',
    webhookEvents: ['messageNew']
  })
});

console.log('Webhook configured');
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

## Next Steps

- **Getting Started**: Read the [Quick Start Guide](/docs/getting-started/quick-start)
- **Authentication**: Learn about [OAuth2 Setup](/docs/accounts/oauth2-setup)
- **Webhooks**: Configure [Real-time Events](/docs/receiving/webhooks)
- **Examples**: Explore [Integration Examples](/docs/integrations)

## Support

- **Documentation**: Browse the complete [documentation](/docs)
- **GitHub Issues**: Report bugs or request features
- **Community**: Join discussions on GitHub
- **Professional Support**: Contact for enterprise support options
