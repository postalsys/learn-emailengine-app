---
title: Error Codes Reference
description: Complete reference of API error codes and troubleshooting guidance
sidebar_position: 8
---

# Error Codes Reference

Every HTTP status the EmailEngine API answers with, every `code` string an API error body can carry, and the provider, SMTP and OAuth2 errors that reach you through webhooks and the account's `lastError`.

## Error Response Format

Every API error is a JSON body in this shape:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Requested message was not found",
  "code": "MessageNotFound"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | number | HTTP status code, repeated in the body |
| `error` | string | HTTP status phrase, such as `Not Found` |
| `message` | string | Human-readable reason for the failure |
| `code` | string | Machine-readable error code. Present only for the failures listed under [EmailEngine Error Codes](#emailengine-error-codes) and [Provider-Mapped Codes](#provider-mapped-codes) |
| `fields` | array | Validation failures only: one `{message, key, path}` entry per rejected input. `path` is the dotted path of a nested field, such as `to.0.address`, and the same as `key` for a top-level one (since v2.79.8) |
| `state` | string | Account-state failures (`503`) only: the account's current state |
| `ttl` | number | Rate limit responses (`429`) only: seconds until the window resets |
| `requestedScope` | string | Scope refusals (`403`) only: the scope the route required |
| `info` | object | Extra context a few failures attach, most often `info.response` with the mail server's own answer when it refused a mailbox operation |
| `details` | object or array | Extra context a few routes attach, such as delivery test results |
| `existingAccount` | string | `AccountAlreadyExists` only: the account the OAuth2 user is already bound to |

:::warning `error` is the status text, not the reason
Show and log `message`. The `error` field only repeats the HTTP status phrase, so a handler that reports `error` tells the operator "Bad Request" instead of what was actually wrong.
:::

## HTTP Status Codes

### 2xx Success

| Code | Name | Meaning |
|------|------|---------|
| 200 | OK | Request succeeded |

200 is the only success code the API returns. A creation reports what it created in the body of a 200 rather than answering 201, and no endpoint answers 204.

---

### 4xx Client Errors

#### 400 Bad Request

The request itself is wrong: a missing or malformed field, invalid JSON, or an operation that contradicts stored data.

**Validation failure:**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid input",
  "fields": [
    { "message": "\"account\" is required", "key": "account", "path": "account" }
  ]
}
```

Input validation failures carry a `fields` array naming each rejected input, and no `code`. Read `fields` to report the specific problem back to the caller. An invalid recipient list or a submit call with no recipients is rejected this way, not with a dedicated code.

**Mail server refused the operation:**

When an IMAP server answers `NO` to a mailbox operation (creating, renaming or deleting a folder, reading the quota), the request was well formed and the server refused it, and the answer is a `400` with no `fields`. `code` is the IMAP response code the server sent, such as `ALREADYEXISTS`, `NONEXISTENT`, `CANNOT` or `LIMIT`, or `DeleteFailed` / `RenameFailed` when the server sent none, and `info.response` carries the server's text:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Delete failed",
  "code": "CANNOT",
  "info": {
    "response": "Mailbox has inferior hierarchical names"
  }
}
```

**Other 400 codes:**

| Code | When |
|------|------|
| `InvalidId` | A message, attachment or text identifier that cannot be decoded. Since v2.79.8; before that such an identifier answered `500` |
| `InvalidCursorType`, `InvalidCursorValue` | A paging cursor issued for a different account type, or one that cannot be parsed |
| `UnsupportedSearchTerm` | Gmail API and MS Graph accounts: a search field the provider cannot filter on |
| `UnsupportedOperation` | An operation this account type has no equivalent for, such as replacing the whole label set on a Gmail API account, or submitting a stored draft on an account type that cannot |
| `MessageNotDraft` | `POST /v1/account/{account}/message/{message}/submit` on a message that is not a draft |
| `ReferenceNotSupported` | A reply or forward `reference` on a send-only account |
| `InvalidInput` | Gmail API accounts: a `page` number instead of a cursor |
| `ForceRequired` | `DELETE /v1/templates/account/{account}` without `force=true` |

**OAuth2 user already bound:**

Registering or updating an OAuth2 account for a user who is already bound to another account under the same OAuth2 application answers `400` with the code `AccountAlreadyExists` and names the other account. EmailEngine does not use `409 Conflict`. Re-registering an existing account ID is not an error: `POST /v1/account` updates the account in place.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Another account for the same OAuth2 user already exists",
  "code": "AccountAlreadyExists",
  "existingAccount": "user-a"
}
```

---

#### 401 Unauthorized

No usable access token was presented. Neither variant carries a `code`; the reason a token was refused (unknown, expired, malformed) is written to the log, not returned to the caller.

**No credential:**

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized"
}
```

**Credential refused:**

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Bad token",
  "attributes": {
    "error": "Bad token"
  }
}
```

**Solutions:**
- Send the token as `Authorization: Bearer TOKEN` (or the `access_token` query parameter)
- Check that the token has not been deleted or expired; issue a new one if needed

When `EENGINE_REQUIRE_API_AUTH=false`, a request with no token is accepted instead of answering 401.

---

#### 403 Forbidden

The token is valid but is not allowed to do this. A 403 carries a descriptive `message` and no `code`:

| Message | Cause |
|---------|-------|
| `Unauthorized scope` | The token lacks the scope the route requires. The body also carries `requestedScope` |
| `Unauthorized permission` | The token's `permissions` record does not admit this action or group |
| `Unauthorized account` | The token is bound to a different account |
| `Unauthorized address` | The caller's IP is not in the token's address restrictions |
| `Unauthorized referrer` | The `Referer` header is not in the token's referrer restrictions |
| `A token with restricted permissions can not change ...` (or `read ...`) | `GET` or `POST /v1/settings` named a [privileged setting](/docs/configuration/settings#settings-a-narrowed-token-cannot-touch) with a token that has a `permissions` record. The message lists the keys. Since v2.80.1 |
| `The new token would be less restricted than the token creating it: ...` | `POST /v1/tokens` asked for an address or referrer allowlist, a rate limit or an expiry wider than the calling token's own. Carries the code `MintWidensRestrictions`. Since v2.82.0 |
| `OAuth2 request failed` | Gmail API and MS Graph accounts: the provider answered `401` to a request made with a freshly renewed access token. Carries the code `OAuthTokenRejected` |

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Unauthorized scope",
  "requestedScope": "api"
}
```

The license endpoints also answer 403 when the operation fails: `GET /v1/license` when license information cannot be loaded, `POST /v1/license` when the key is invalid or expired, and `DELETE /v1/license` when the key cannot be removed. The exact message of a 403 is the only thing to match on apart from the two codes above; the table shows the messages as the source produces them.

---

#### 404 Not Found

The addressed entity does not exist. A missing account is a plain 404 with no `code`:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Account record was not found for requested ID"
}
```

So is a missing SMTP gateway (`Gateway "x" was not found`). A missing message, folder, template, webhook route or OAuth2 application carries a `code`:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Requested message was not found",
  "code": "MessageNotFound"
}
```

Two more 404 codes come from a submission rather than from the path: `ReferenceNotFound` when the message a reply or forward refers to no longer exists, and `TemplateNotFound` when `template` names a template that does not exist or belongs to another account. `SMTPUnavailable` is also a 404: the account has no SMTP or OAuth2 configuration to send with. On MS Graph accounts, a delete that cannot find the Deleted Items folder answers `TrashNotFound`.

---

#### 413 Payload Too Large

Two sources. A request body over the route's limit is refused by the HTTP server before the handler runs; message upload routes accept up to `EENGINE_MAX_BODY_SIZE` (50 MB by default), other routes 1 MB. A Microsoft Graph account whose provider rejects an outgoing message for size answers with the mapped code `MessageTooLarge`.

---

#### 422 Unprocessable Entity

The request is well formed, but the account's backend cannot carry it out. The only code is `MissingServerExtension`: the IMAP server lacks an extension the operation needs, for example a label filter on a mailbox that is not Gmail.

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Server does not support X-GM-EXT-1 extension required for label search",
  "code": "MissingServerExtension"
}
```

Do not retry: the answer will not change until the account or the server does.

---

#### 429 Too Many Requests

The token's rate limit is exhausted.

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "ttl": 60
}
```

**Response headers:**

```text
X-RateLimit-Limit: 1000
X-RateLimit-Reset: 60
```

`X-RateLimit-Reset` and `ttl` both carry the seconds until the window resets, not a Unix timestamp. `X-RateLimit-Remaining` is only sent on requests that were allowed.

**Retry logic:**

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

#### 500 Internal Server Error

An error the handler did not classify. The body is the generic Boom message; a `code` is present when the underlying error carried one.

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An internal server error occurred"
}
```

Retry after a delay, then check the EmailEngine log for the request. Three configuration faults surface this way with a `code` and no better status: `AppNotFound` (the OAuth2 application the account references was deleted or disabled), `InvalidBaseScopes` (that application is registered for the API rather than for IMAP) and `MissingServiceURLSetup` (`POST /v1/authentication/form` while `serviceUrl` is unset).

---

#### 502 Bad Gateway

The IMAP server rejected an `APPEND` while `POST /v1/account/{account}/message` was uploading a message, after the target folder was confirmed to exist. The body carries the code `UploadFail` and the IMAP client's message for the failed command. A folder that does not exist is a `404` instead.

---

#### 503 Service Unavailable

The account is not in a state that can serve the request. The body carries the account's `state` alongside the `code`:

```json
{
  "statusCode": 503,
  "error": "Service Unavailable",
  "message": "Requested account can not be authenticated",
  "code": "AuthenticationFails",
  "state": "authenticationError"
}
```

| Code | State | Meaning |
|------|-------|---------|
| `NotYetConnected` | `init` | The account has not connected yet. Wait |
| `AuthenticationFails` | `authenticationError` | The credentials are rejected. Update them or re-authorize |
| `ConnectionError` | `connectError` | The mail server cannot be reached. Check the host, port and network |
| `NotSyncing` | `unset` | Syncing is switched off, by the operator or by the [authentication-failure safety net](/docs/configuration/environment-variables#max-imap-auth-failure-time). Check `authFailureDisabledAt` on the account |
| `NoAvailable` | other | The account is disconnected or paused |
| `IMAPUnavailable` | any | The account's IMAP connection is not up right now. Retry shortly |
| `WorkerNotAvailable` | any | No worker thread holds the account (`No active handler for requested account`), or the one that did terminated mid-request. No `state` field. Retry |

---

#### 504 Gateway Timeout

The API worker asked an account worker to do something and got no answer within `EENGINE_TIMEOUT` (10 seconds by default; a request can raise it with the `X-EE-Timeout` header, in milliseconds).

```json
{
  "statusCode": 504,
  "error": "Gateway Timeout",
  "message": "Timeout waiting for command response [T2]",
  "code": "Timeout"
}
```

A slow IMAP server on a large mailbox is the usual cause. Raise `EENGINE_TIMEOUT` or send `X-EE-Timeout` for the operations that need it.

---

## EmailEngine Error Codes

Every `code` the API itself puts in an error body, by status:

| Code | Status | When |
|------|--------|------|
| `AccountAlreadyExists` | 400 | The OAuth2 user is already bound to another account under the same OAuth2 application; the body names it in `existingAccount` |
| `InvalidId` | 400 | A message, attachment or text identifier that cannot be decoded (since v2.79.8) |
| `InvalidCursorType`, `InvalidCursorValue` | 400 | A paging cursor from another account type, or one that cannot be parsed |
| `UnsupportedSearchTerm` | 400 | Gmail API or MS Graph cannot filter on a field the search named |
| `UnsupportedOperation` | 400 | The account type has no such operation |
| `MessageNotDraft` | 400 | The message submitted from the mailbox is not a draft |
| `ReferenceNotSupported` | 400 | A reply or forward reference on a send-only account |
| `InvalidInput` | 400 | Gmail API accounts: a `page` number instead of a cursor |
| `ForceRequired` | 400 | Flushing an account's templates without `force=true` |
| `ALREADYEXISTS`, `NONEXISTENT`, `CANNOT`, `LIMIT` and other IMAP response codes, `DeleteFailed`, `RenameFailed` | 400 | The IMAP server refused a mailbox operation; `info.response` carries its text |
| `MintWidensRestrictions` | 403 | `POST /v1/tokens` asked for restrictions wider than the calling token's (since v2.82.0) |
| `OAuthTokenRejected` | 403 | The provider rejected a freshly renewed access token |
| `AccountNotFound` | 404 | Export endpoints only: the account does not exist |
| `MessageNotFound` | 404 | The message ID does not exist in the mailbox |
| `FolderNotFound` | 404 | The mailbox path does not exist |
| `ReferenceNotFound` | 404 | The message a reply or forward refers to does not exist |
| `TemplateNotFound` | 404 | A submission names a template that does not exist or belongs to another account |
| `TrashNotFound` | 404 | MS Graph accounts: the Deleted Items folder cannot be resolved |
| `NotFound` | 404 | The template, webhook route or OAuth2 application does not exist |
| `SMTPUnavailable` | 404 | The account has no SMTP or OAuth2 configuration to send with |
| `MissingServerExtension` | 422 | The IMAP server lacks an extension the operation needs |
| `AppNotFound`, `InvalidBaseScopes`, `MissingServiceURLSetup` | 500 | A configuration fault: a missing or disabled OAuth2 application, one registered for the wrong connection type, or no `serviceUrl` for a hosted form |
| `UploadFail` | 502 | The IMAP server rejected the `APPEND` of an uploaded message |
| `NotYetConnected` | 503 | The account has not connected yet |
| `AuthenticationFails` | 503 | The account's credentials are rejected |
| `ConnectionError` | 503 | The mail server cannot be reached |
| `NotSyncing` | 503 | Syncing is switched off for the account |
| `NoAvailable` | 503 | The account is disconnected or paused |
| `IMAPUnavailable` | 503 | The IMAP connection is not available at the moment |
| `WorkerNotAvailable` | 503 | No worker thread holds the account, or it terminated mid-request |
| `Timeout` | 504 | A worker thread did not answer within `EENGINE_TIMEOUT` |

A missing account or SMTP gateway is a plain 404 without a code, and a 401 never carries one.

## Provider-Mapped Codes

For Microsoft Graph accounts, a provider error that the operation cannot recover from is translated to an EmailEngine code and status and returned from the API call that triggered it. Gmail API errors pass through with their own status.

**Gmail API:**

Gmail API errors are not translated to EmailEngine codes. The HTTP status Google answered with becomes the API status, and the body carries EmailEngine's `OAuth2 request failed` message and, unless the failure matched a known OAuth2 condition, no `code`: a `400` for a request Gmail rejected, a `403` for a scope or policy refusal, a `500` or `503` from Google's side. Two cases are recognized: a `404` from Gmail answers `MessageNotFound`, and a `401` that survives a token renewal answers `403` with the code `OAuthTokenRejected`. Rate limits (`429`, or a `403` carrying the `rateLimitExceeded` or `userRateLimitExceeded` reason) are retried first, honoring `Retry-After`, so a `429` from the API means the retries were exhausted.

**Microsoft Graph:**

| Graph error code | Code | HTTP status |
|------------------|------|-------------|
| `ErrorItemNotFound` | `MessageNotFound` | 404 |
| `ErrorInvalidIdMalformed` | `InvalidMessageId` | 400 |
| `ErrorAccessDenied` | `AccessDenied` | 403 |
| `ErrorQuotaExceeded` | `QuotaExceeded` | 429 |
| `ErrorExecuteSearchStaleData` | `SearchCursorExpired` | 400 |
| `ErrorMailboxNotEnabledForRESTAPI` | `MailboxNotEnabled` | 403 |
| `ErrorInvalidRecipients` | `InvalidRecipients` | 400 |
| `ErrorMessageSizeExceeded` | `MessageTooLarge` | 413 |
| `ErrorSendAsDenied` | `SendAsDenied` | 403 |

Rate-limited Graph requests are retried by EmailEngine before the error is reported, like the Gmail ones, so a `429` from either provider means the retries were exhausted.

## Provider-Specific Errors

Errors from mail servers and OAuth2 providers. These do not come back from API calls; they arrive through webhooks and the account's `lastError`.

### IMAP Errors

Common IMAP server responses:

| Response | Meaning | Solution |
|----------|---------|----------|
| `NO` | Command failed | Check credentials, permissions |
| `BAD` | Invalid command | Report to support (possible bug) |
| `BYE` | Server closing connection | Reconnect, check server status |
| `NO [AUTHENTICATIONFAILED]` | Invalid credentials | Update password |
| `NO [LIMIT]` | Rate limit exceeded | Wait and retry |
| `NO [OVERQUOTA]` | Mailbox quota exceeded | Free up space |

The IMAP server's own response is recorded as the account's `lastError`, sent in the [`authenticationError`](/docs/webhooks/authenticationerror) and [`connectError`](/docs/webhooks/connecterror) webhooks as `data.response` and `data.serverResponseCode`, and written to the [per-account log](/docs/advanced/logging#per-account-logs). An API call made while the account is in that state answers `503` with `AuthenticationFails` or `ConnectionError`.

---

### SMTP Errors

An SMTP rejection is not returned from the submit call, because submission is queued: the call answers 200 with a `queueId` and the rejection arrives later as a [`messageDeliveryError`](/docs/webhooks/messagedeliveryerror) webhook (one per failed attempt) or a [`messageFailed`](/docs/webhooks/messagefailed) webhook (when the attempts are exhausted), carrying `smtpResponse` and `smtpResponseCode`.

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

**Common SMTP responses:**

```text
550 5.1.1 <user@example.com>: Recipient address rejected: User unknown
```
Verify the address exists.

```text
550 5.7.1 Relaying denied
```
Check SMTP authentication and the account's sending permissions.

```text
552 5.2.2 Mailbox full
```
The recipient needs to free up space; retry later.

```text
554 5.7.1 Message rejected as spam
```
Review the message content and the sender's reputation.

---

### OAuth2 Errors

Errors from Google and Microsoft token endpoints. They are reported in the [`authenticationError`](/docs/webhooks/authenticationerror) webhook (`data.tokenRequest` carries the request details) and in the account's `lastError`.

| Error | Meaning | Solution |
|-------|---------|----------|
| `invalid_grant` | The refresh token is expired or revoked | Re-authorize the account |
| `invalid_client` | The OAuth2 client ID or secret is wrong | Fix the credentials in the OAuth2 application |
| `redirect_uri_mismatch` | The redirect URI registered with the provider does not match EmailEngine's | Register `serviceUrl` + `/oauth` with the provider, with the same protocol and host |
| `insufficient_scope` | The grant lacks a scope the operation needs | Re-authorize with the required scopes |

```json
{
  "error": "invalid_grant",
  "error_description": "Token has been expired or revoked"
}
```

A refresh token that keeps failing for longer than `EENGINE_MAX_IMAP_AUTH_FAILURE_TIME` switches syncing off for the account; see [Max IMAP auth failure time](/docs/configuration/environment-variables#max-imap-auth-failure-time).

---

## Error Handling Best Practices

### Retry Logic

Retry transient failures with exponential backoff:

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  const retriableStatusCodes = [429, 500, 503, 504];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      const data = await response.json();

      // Do not retry client errors, except the rate limit
      if (response.status >= 400 && response.status < 500 &&
          response.status !== 429) {
        throw new Error(data.message);
      }

      if (retriableStatusCodes.includes(response.status)) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(data.message);

    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
}
```

### Error Categorization

Check the `code` before the status range: an account that is failing authentication is a `503`, but retrying will not fix it, and only new credentials will.

```javascript
function categorizeError(statusCode, errorCode) {
  if (errorCode === 'AuthenticationFails' || errorCode === 'NotSyncing') {
    return 'AUTH_ERROR';
  }

  if (statusCode === 429) {
    return 'RATE_LIMIT';
  }

  if (statusCode === 503 || statusCode === 504) {
    return 'TEMPORARY';
  }

  if (statusCode >= 400 && statusCode < 500) {
    return 'CLIENT_ERROR';
  }

  if (statusCode >= 500) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN';
}

async function handleError(error, context) {
  const category = categorizeError(error.statusCode, error.code);

  switch (category) {
    case 'CLIENT_ERROR':
      // The request is wrong; retrying will not help
      console.error('Client error:', error);
      await alertDevelopers(error);
      break;

    case 'RATE_LIMIT':
      await sleep(error.ttl * 1000);
      return retryRequest(context);

    case 'TEMPORARY':
    case 'SERVER_ERROR':
      return retryWithBackoff(context);

    case 'AUTH_ERROR':
      // Ask the user for new credentials or a fresh OAuth2 grant
      await requestReauthorization(context.account);
      break;

    default:
      console.error('Unknown error:', error);
  }
}
```

### User-Friendly Messages

Map codes to messages for end users:

```javascript
const ERROR_MESSAGES = {
  'AuthenticationFails': 'Email login failed. Please check your password or sign in again.',
  'NotSyncing': 'Syncing is switched off for this mailbox. Sign in again to resume it.',
  'MessageNotFound': 'Email message not found. It may have been deleted.',
  'ConnectionError': 'Unable to connect to the email server. Please try again later.',
  'SMTPUnavailable': 'This mailbox is not set up for sending.'
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

`EENGINE_LOG_RAW` writes unmasked credentials to the log; use it only while debugging.

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

1. **Read the full error response:**
   ```bash
   curl -X GET https://emailengine.example.com/v1/account/test \
     -H "Authorization: Bearer TOKEN" \
     -v
   ```

2. **Check the account's state and last error:**
   ```bash
   curl https://emailengine.example.com/v1/account/test \
     -H "Authorization: Bearer TOKEN"
   ```
   `state`, `lastError` and `authFailureDisabledAt` say why an account answers `503`.

3. **Verify the mail server is reachable:**
   ```bash
   openssl s_client -connect imap.example.com:993
   ```

4. **Check Redis:**
   ```bash
   redis-cli ping
   ```

## See Also

- [API Reference](/docs/api-reference) - Response shapes and authentication
- [Quick reference](/docs/reference/quick-reference) - The same codes in one table
- [Troubleshooting](/docs/troubleshooting) - Diagnosing the conditions behind these codes
- [Account troubleshooting](/docs/accounts/troubleshooting) - Connection and authentication failures
- [Webhook events reference](/docs/reference/webhook-events) - The events that carry provider errors
