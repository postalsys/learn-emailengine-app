---
title: Error Codes Reference
description: Complete reference of API error codes and troubleshooting guidance
sidebar_position: 2
---

# Error Codes Reference

Complete reference for HTTP status codes, EmailEngine error codes, and provider-specific errors.

## Error Response Format

All EmailEngine API errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    /* optional additional context */
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Human-readable error description |
| `code` | string | Machine-readable error code |
| `statusCode` | number | HTTP status code |
| `details` | object | Optional additional error context |

## HTTP Status Codes

Standard HTTP status codes used by EmailEngine API.

### 2xx Success

| Code | Name | Meaning |
|------|------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded with no response body |

---

### 4xx Client Errors

Client-side errors that require action from the caller.

#### 400 Bad Request

Request validation failed due to invalid parameters or malformed request.

**Example:**
```json
{
  "error": "Missing required field: account",
  "code": "InvalidRequest",
  "statusCode": 400
}
```

**Common Causes:**
- Missing required fields
- Invalid field format
- Invalid JSON syntax
- Parameter type mismatch

**Solutions:**
- Check required fields
- Validate parameter types
- Verify JSON syntax
- Review API documentation

---

#### 401 Unauthorized

Missing or invalid authentication credentials.

**Example:**
```json
{
  "error": "Missing or invalid API key",
  "statusCode": 401
}
```

A `code` field is included only when EmailEngine recognizes a specific token problem (for example `InvalidToken`). A plain missing-credentials response returns the standard 401 without a custom `code`.

**Common Causes:**
- Missing Authorization header
- Invalid or expired access token
- Token revoked

**Solutions:**
- Include Authorization header: `Bearer YOUR_TOKEN`
- Generate new access token
- Verify token is still valid

---

#### 403 Forbidden

Valid authentication but insufficient permissions.

**Example:**
```json
{
  "error": "Unauthorized scope",
  "statusCode": 403
}
```

A 403 response carries a descriptive message such as `Unauthorized scope`, `Unauthorized account`, `Unauthorized address`, or `Unauthorized referrer`, but no custom `code` field.

**Common Causes:**
- Token has restricted scope
- Account-specific token used for a different account
- Request origin not in the allowed referrer/address list

**Solutions:**
- Use a token with the appropriate scope
- Verify the token is bound to the correct account
- Check the allowed referrers/addresses configuration

---

#### 404 Not Found

Requested resource does not exist.

**Example:**
```json
{
  "error": "Account not found",
  "code": "AccountNotFound",
  "statusCode": 404
}
```

**Common Causes:**
- Invalid resource ID
- Resource deleted
- Typo in endpoint URL

**Solutions:**
- Verify resource ID
- Check resource still exists
- Verify correct endpoint

---

#### 400 - Duplicate resource

EmailEngine reports a duplicate account as a `400 Bad Request` with the code `AccountAlreadyExists` (it does not use `409 Conflict`).

**Example:**
```json
{
  "error": "This account already exists",
  "code": "AccountAlreadyExists",
  "statusCode": 400
}
```

**Common Causes:**
- Registering an account ID that already exists
- Registering an OAuth2 account whose user already belongs to another account

**Solutions:**
- Use a different account ID
- Update the existing account instead (the create endpoint also updates an existing account)

---

#### 429 Too Many Requests

Rate limit exceeded.

**Example:**
```json
{
  "error": "Rate limit exceeded",
  "statusCode": 429,
  "ttl": 60
}
```

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Reset: 60
```

Note: `X-RateLimit-Reset` contains the TTL (time-to-live) in seconds until the rate limit window resets, not a Unix timestamp. The `X-RateLimit-Remaining` header is only included in successful (non-rate-limited) responses.

**Solutions:**
- Implement exponential backoff
- Wait for `ttl` seconds before retrying
- Reduce request frequency
- Implement request queuing

**Example Retry Logic:**
```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const data = await response.json();
      const waitTime = data.ttl || Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

---

### 5xx Server Errors

Server-side errors that may be transient.

#### 500 Internal Server Error

Unexpected server error occurred.

**Example:**
```json
{
  "error": "Internal server error",
  "statusCode": 500
}
```

**Common Causes:**
- Unexpected exception
- Database error
- Configuration issue

**Solutions:**
- Retry request after delay
- Check server logs
- Report to support if persists

---

#### 502 Bad Gateway

EmailEngine could not complete an operation because the upstream mail server (IMAP/SMTP) was unavailable. The response carries the underlying code (for example `IMAPUnavailable`), not a generic "BadGateway" code.

**Example:**
```json
{
  "error": "Server unavailable",
  "code": "IMAPUnavailable",
  "statusCode": 502
}
```

**Common Causes:**
- Mail server unavailable
- Mail server timeout
- Network connectivity issue

**Solutions:**
- Retry after delay
- Check mail server status
- Verify network connectivity

---

#### 503 Service Unavailable

EmailEngine is temporarily unavailable (startup, shutdown, maintenance).

**Example:**
```json
{
  "error": "Service unavailable",
  "code": "ServiceUnavailable",
  "statusCode": 503,
  "details": {
    "retryAfter": 30
  }
}
```

**Common Causes:**
- EmailEngine restarting
- Redis connection lost
- Maintenance mode

**Solutions:**
- Wait and retry after delay
- Check EmailEngine status
- Verify Redis connectivity

---

## EmailEngine Error Codes

Application-specific error codes.

### Account Errors

#### AccountNotFound

Specified account does not exist.

**HTTP Status:** 404

**Example:**
```json
{
  "error": "Account not found",
  "code": "AccountNotFound",
  "statusCode": 404,
  "details": {
    "account": "nonexistent@example.com"
  }
}
```

**Solutions:**
- Verify account ID
- Check account was registered
- List accounts to verify

---

#### AccountAlreadyExists

An account with this ID (or, for OAuth2 accounts, the same upstream user) already exists.

**HTTP Status:** 400

**Example:**
```json
{
  "error": "This account already exists",
  "code": "AccountAlreadyExists",
  "statusCode": 400
}
```

**Solutions:**
- Use a different account ID
- Update the existing account instead (the create endpoint also updates an existing account)

---

### Message Errors

#### MessageNotFound

Specified message does not exist.

**HTTP Status:** 404

**Example:**
```json
{
  "error": "Message not found",
  "code": "MessageNotFound",
  "statusCode": 404,
  "details": {
    "message": "AAAABAABNc"
  }
}
```

**Solutions:**
- Verify message ID
- Check message wasn't deleted
- Resync mailbox

---

#### MessageTooLarge

Message exceeds size limits.

**HTTP Status:** 413

**Example:**
```json
{
  "error": "Message size exceeds limit",
  "code": "MessageTooLarge",
  "statusCode": 413,
  "details": {
    "size": 26214400,
    "limit": 20971520
  }
}
```

**Solutions:**
- Reduce message size
- Compress attachments
- Increase `EENGINE_MAX_BODY_SIZE`

Note: invalid request payloads (such as a submit call with no recipients or a malformed address) are rejected as a generic `400 Bad Request` validation error, not a dedicated message-format code.

---

### Authentication Errors

#### InvalidToken

Access token is invalid or expired.

**HTTP Status:** 401

**Example:**
```json
{
  "error": "Invalid access token",
  "code": "InvalidToken",
  "statusCode": 401
}
```

**Solutions:**
- Generate new token
- Verify token format
- Check token not revoked

Note: a request with a restricted-scope or wrong-account token is rejected as a `403 Forbidden` with a descriptive message (such as `Unauthorized scope`), without a dedicated permissions code.

---

### Connection Errors

#### ConnectionError

Failed to connect to the mail server.

**HTTP Status:** 503

**Example:**
```json
{
  "error": "Failed to connect to IMAP server",
  "code": "ConnectionError",
  "statusCode": 503,
  "details": {
    "host": "imap.example.com",
    "reason": "ECONNREFUSED"
  }
}
```

**Common Causes:**
- Mail server down
- Firewall blocking connection
- Incorrect host/port
- Network issue

**Solutions:**
- Verify mail server is accessible
- Check firewall rules
- Verify host and port
- Test connection manually

---

#### AuthenticationFails

Authentication to mail server failed.

**HTTP Status:** 503

**Example:**
```json
{
  "error": "Requested account can not be authenticated",
  "code": "AuthenticationFails",
  "statusCode": 503,
  "state": "authenticationError"
}
```

**Common Causes:**
- Incorrect password
- Password changed
- 2FA/App password required
- OAuth2 token expired

**Solutions:**
- Verify credentials
- Update password
- Use app-specific password
- Refresh OAuth2 token

---

### License Errors

#### ELicenseExpired

License has expired.

**HTTP Status:** 403

**Example:**
```json
{
  "error": "License has expired",
  "code": "ELicenseExpired",
  "statusCode": 403
}
```

**Solutions:**
- Renew license
- Contact support
- Update license key

---

## Provider-Specific Errors

Errors from mail servers (IMAP/SMTP) and OAuth2 providers.

### IMAP Errors

Common IMAP server response codes:

| Response | Meaning | Solution |
|----------|---------|----------|
| `NO` | Command failed | Check credentials, permissions |
| `BAD` | Invalid command | Report to support (possible bug) |
| `BYE` | Server closing connection | Reconnect, check server status |
| `NO [AUTHENTICATIONFAILED]` | Invalid credentials | Update password |
| `NO [LIMIT]` | Rate limit exceeded | Wait and retry |
| `NO [OVERQUOTA]` | Mailbox quota exceeded | Free up space |

**Example Error:**
```json
{
  "error": "IMAP server is currently unavailable",
  "code": "IMAPUnavailable",
  "statusCode": 502,
  "details": {
    "command": "LOGIN",
    "response": "NO [AUTHENTICATIONFAILED] Invalid credentials"
  }
}
```

---

### SMTP Errors

Common SMTP error codes:

#### 4xx Temporary Errors

| Code | Meaning | Action |
|------|---------|--------|
| 421 | Service not available | Retry later |
| 450 | Mailbox busy | Retry later |
| 451 | Server error | Retry later |
| 452 | Insufficient storage | Retry later or reduce size |

#### 5xx Permanent Errors

| Code | Meaning | Action |
|------|---------|--------|
| 550 | Mailbox not found | Verify recipient address |
| 551 | User not local | Check recipient domain |
| 552 | Storage exceeded | Reduce message size |
| 553 | Mailbox name invalid | Fix recipient address |
| 554 | Transaction failed | Check message content/format |

**Example Error:**
```json
{
  "error": "SMTP server is currently unavailable",
  "code": "SMTPUnavailable",
  "statusCode": 502,
  "details": {
    "smtpResponse": "550 5.1.1 <user@example.com>: Recipient address rejected: User unknown",
    "recipient": "user@example.com"
  }
}
```

**Common SMTP Errors:**

**550 5.1.1 - User Unknown:**
```
550 5.1.1 <user@example.com>: Recipient address rejected: User unknown
```
**Solution:** Verify email address is correct and exists.

**550 5.7.1 - Relay Denied:**
```
550 5.7.1 Relaying denied
```
**Solution:** Check SMTP authentication and permissions.

**552 5.2.2 - Mailbox Full:**
```
552 5.2.2 Mailbox full
```
**Solution:** Recipient needs to free up space, retry later.

**554 5.7.1 - Spam Rejected:**
```
554 5.7.1 Message rejected as spam
```
**Solution:** Review message content, check sender reputation.

---

### OAuth2 Errors

Common OAuth2 provider errors:

#### invalid_grant

OAuth2 token is invalid or expired.

**Example:**
```json
{
  "error": "invalid_grant",
  "error_description": "Token has been expired or revoked"
}
```

**Solutions:**
- Refresh OAuth2 token
- Re-authenticate user
- Check token expiration

---

#### invalid_client

OAuth2 client credentials are invalid.

**Example:**
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

**Solutions:**
- Verify OAuth2 client ID and secret
- Check credentials in configuration
- Regenerate client credentials

---

#### redirect_uri_mismatch

OAuth2 redirect URI doesn't match configured value.

**Example:**
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "Redirect URI mismatch"
}
```

**Solutions:**
- Verify EmailEngine's `serviceUrl` setting is correct (set it in the dashboard or via `EENGINE_SETTINGS`); the OAuth2 redirect URI is derived from it
- Check that the redirect URI registered in the OAuth2 provider (Google/Microsoft) matches EmailEngine's `serviceUrl` + `/oauth`
- Ensure the protocol (http/https) matches

---

#### insufficient_scope

OAuth2 token lacks required permissions.

**Example:**
```json
{
  "error": "insufficient_scope",
  "error_description": "Insufficient permission to access this resource"
}
```

**Solutions:**
- Request additional OAuth2 scopes
- Re-authenticate with correct scopes
- Verify OAuth2 app permissions

---

## Error Handling Best Practices

### Retry Logic

Implement exponential backoff for transient errors:

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  const retriableStatusCodes = [408, 429, 500, 502, 503, 504];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      const data = await response.json();

      // Don't retry client errors (except rate limit)
      if (response.status >= 400 && response.status < 500 &&
          response.status !== 429) {
        throw new Error(data.error);
      }

      // Retry on specific status codes
      if (retriableStatusCodes.includes(response.status)) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(data.error);

    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
}
```

### Error Categorization

Categorize errors for appropriate handling:

```javascript
function categorizeError(statusCode, errorCode) {
  // Client errors - don't retry
  if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return 'CLIENT_ERROR';
  }

  // Rate limit - retry with backoff
  if (statusCode === 429) {
    return 'RATE_LIMIT';
  }

  // Server errors - retry
  if (statusCode >= 500) {
    return 'SERVER_ERROR';
  }

  // Authentication - refresh credentials
  if (errorCode === 'AuthenticationFails' || errorCode === 'InvalidToken') {
    return 'AUTH_ERROR';
  }

  return 'UNKNOWN';
}

async function handleError(error, context) {
  const category = categorizeError(error.statusCode, error.code);

  switch (category) {
    case 'CLIENT_ERROR':
      // Log and alert - requires code fix
      console.error('Client error:', error);
      await alertDevelopers(error);
      break;

    case 'RATE_LIMIT':
      // Wait and retry
      await sleep(error.ttl * 1000);
      return retryRequest(context);

    case 'SERVER_ERROR':
      // Retry with exponential backoff
      return retryWithBackoff(context);

    case 'AUTH_ERROR':
      // Refresh credentials
      await refreshCredentials(context.account);
      return retryRequest(context);

    default:
      // Log for investigation
      console.error('Unknown error:', error);
  }
}
```

### User-Friendly Messages

Convert error codes to user-friendly messages:

```javascript
const ERROR_MESSAGES = {
  'AccountNotFound': 'Email account not found. Please check the account ID.',
  'AuthenticationFails': 'Email login failed. Please check your password.',
  'MessageNotFound': 'Email message not found. It may have been deleted.',
  'ConnectionError': 'Unable to connect to email server. Please try again later.',
  'InvalidToken': 'Your session has expired. Please log in again.'
};

function getUserMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] ||
         'An unexpected error occurred. Please try again.';
}
```

## Debugging Errors

### Enable Debug Logging

```bash
EENGINE_LOG_LEVEL=trace
EENGINE_LOG_RAW=true
```

### Check Logs

**Docker:**
```bash
docker logs -f emailengine
```

**SystemD:**
```bash
journalctl -u emailengine -f
```

### Common Debug Steps

1. **Check error response:**
   ```bash
   curl -X GET http://localhost:3000/v1/account/test \
     -H "Authorization: Bearer TOKEN" \
     -v
   ```

2. **Verify credentials:**
   ```bash
   # Test IMAP connection
   openssl s_client -connect imap.example.com:993
   ```

3. **Check connectivity:**
   ```bash
   # Test Redis
   redis-cli ping

   # Test mail server
   telnet imap.example.com 993
   ```

4. **Review configuration:**
   ```bash
   curl http://localhost:3000/v1/settings \
     -H "Authorization: Bearer TOKEN"
   ```
