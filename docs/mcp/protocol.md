---
title: MCP Protocol Reference
sidebar_label: Protocol Reference
sidebar_position: 5
description: Transport, protocol revisions, JSON-RPC methods, error codes, subscriptions and the OAuth 2.1 endpoints of the EmailEngine MCP server
---

# MCP Protocol Reference

For client developers and anyone debugging a connection at the wire level. If you are configuring an off-the-shelf client, [Connecting Agents](/docs/mcp/connect-clients) is the page you want.

## Endpoint

| Property | Value |
|----------|-------|
| Address | `POST https://emailengine.example.com/mcp` |
| Transport | MCP Streamable HTTP |
| Payload | JSON-RPC 2.0, `Content-Type: application/json` |
| Authentication | `Authorization: Bearer <access token>` |
| Sessions | None. The server is stateless and never mints an `Mcp-Session-Id` |
| Batching | Not supported. A JSON array is refused with `-32600` |
| Other methods | `GET` and `DELETE` answer `405` with `Allow: POST` |

The endpoint also accepts a token as the `access_token` query parameter, like the rest of the API, but the published resource metadata advertises header-based bearer authentication only. Use the header: query strings end up in access logs.

`GET` returning `405` is not a failure. The modern protocol revision removed the standalone notification stream and sessions, and `405` is the prescribed answer that also tells a dual-era client this is not an old HTTP+SSE server.

## Protocol revisions

Two eras are served on the same endpoint:

| Revision | Era | How a client selects it |
|----------|-----|-------------------------|
| `2026-07-28` | Modern | Every request carries `params._meta["io.modelcontextprotocol/protocolVersion"]`, mirrored in the `MCP-Protocol-Version` header. No handshake |
| `2025-11-25` | Legacy | `initialize` handshake, then the negotiated version in the `MCP-Protocol-Version` header |
| `2025-06-18` | Legacy | Same as above |

`server/discover` reports the full list in `supportedVersions`.

### Modern requests

The modern revision mirrors routing information into headers so an intermediary can route without parsing the body, and the server refuses a request whose headers and body disagree:

```bash
curl -X POST "https://emailengine.example.com/mcp" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "Mcp-Method: tools/call" \
  -H "Mcp-Name: list_messages" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "list_messages",
      "arguments": { "account": "user123", "path": "INBOX", "pageSize": 5 },
      "_meta": { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
    }
  }'
```

Rules:

- `MCP-Protocol-Version` must equal the version in `_meta`, or the request fails with `-32020`.
- `Mcp-Method` is required on every request that carries an `id` and must equal `method`. Notifications carry no `id`, skip the routing headers and are answered `202`.
- `Mcp-Name` is required on `tools/call` (the tool name) and `resources/read` (the resource URI), and must match the body.
- Header values that are not plain ASCII use the `=?base64?...?=` encoding the transport defines.
- Results carry `resultType: "complete"` plus cache hints - see [Caching](#caching).

### Legacy requests

Legacy clients open with `initialize`. The server echoes a supported proposal, or counters with the newest legacy revision it speaks:

```bash
curl -X POST "https://emailengine.example.com/mcp" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "example-client", "version": "1.0.0" }
    }
  }'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": { "tools": {}, "resources": { "subscribe": false, "listChanged": false } },
    "serverInfo": { "name": "EmailEngine", "version": "x.y.z" },
    "instructions": "EmailEngine gives access to the email accounts registered on this instance. ..."
  }
}
```

No `Mcp-Session-Id` is returned, and none is expected on later requests. Notifications such as `notifications/initialized` are accepted and answered `202`.

The `instructions` string is orientation for the model: call `list_accounts` first, message ids come from listings, text is fetched separately, and `send_message` reaches real recipients. An account-bound credential gets an extra sentence naming its account.

## Methods

| Method | Era | Returns |
|--------|-----|---------|
| `initialize` | Legacy | Negotiated version, capabilities, server info, instructions |
| `server/discover` | Modern | Supported versions, capabilities, instructions, server info in `_meta` |
| `ping` | Both | `{}` |
| `tools/list` | Both | The tools this credential may call |
| `tools/call` | Both | A tool result: `content`, optional `structuredContent`, optional `isError` |
| `resources/list` | Both | Connected accounts as resources |
| `resources/read` | Both | One account resource, as JSON text |
| `resources/templates/list` | Both | An empty list. No resource templates exist |
| `subscriptions/listen` | Modern | An SSE stream of notifications |

Anything else is a method-not-found error: `-32601`, delivered as HTTP `404` in the modern era and as a plain JSON-RPC error in the legacy one. `prompts/*` and `completion/*` are not implemented.

Capabilities are `tools` and `resources`. Legacy responses spell out `subscribe: false` and `listChanged: false`, because the tool list is fixed for the life of the worker and legacy resource subscriptions are not served.

### Caching

Modern results carry freshness hints. They are hints, not contracts, and the scope is always `private` because nothing this endpoint serves is caller-neutral:

| Method | `ttlMs` | `cacheScope` |
|--------|---------|--------------|
| `server/discover` | 300000 | private |
| `tools/list` | 300000 | private |
| `resources/templates/list` | 300000 | private |
| `resources/list` | 60000 | private |
| `resources/read` | 30000 | private |
| `ping`, `tools/call` | not cacheable | - |

## Error codes

| Code | Meaning | Where it comes from |
|------|---------|---------------------|
| `-32700` | Parse error | Malformed JSON |
| `-32600` | Invalid request | Not JSON-RPC 2.0, or a batch |
| `-32601` | Method not found | Unknown method |
| `-32602` | Invalid params | Missing tool name or resource URI, or an unknown tool name |
| `-32603` | Internal error | Unexpected server failure |
| `-32002` | Resource not found | `resources/read` on an unknown account URI |
| `-32020` | Header mismatch | Mirrored headers disagree with the body, or a required one is missing |
| `-32022` | Unsupported protocol version | `data.supported` lists what this server speaks |

Failures inside a tool are **not** protocol errors. They come back as a normal result with `isError: true` carrying the API's error body, so the model can read and correct them. See [Results](/docs/mcp/tools#results).

HTTP status codes you may see: `200` for a JSON-RPC response (including one carrying an error object), `202` for an accepted notification, `400` for header and version failures, `401` when the credential is missing or invalid, `403` for a refused `Origin` or a token restriction, `404` when the endpoint is disabled or a modern method is unknown, `405` on `GET`/`DELETE`, `429` when a token rate limit is exhausted.

## Subscriptions

Modern clients can open a notification stream for account state changes. The request must accept `text/event-stream`:

```bash
curl -N -X POST "https://emailengine.example.com/mcp" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "Mcp-Method: subscriptions/listen" \
  -d '{
    "jsonrpc": "2.0",
    "id": "sub-1",
    "method": "subscriptions/listen",
    "params": {
      "notifications": { "resourceSubscriptions": ["emailengine://account/user123"] },
      "_meta": { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
    }
  }'
```

The stream opens with an acknowledgment naming the subset that survived authorization:

```
event: message
data:{"jsonrpc":"2.0","method":"notifications/subscriptions/acknowledged","params":{"_meta":{"io.modelcontextprotocol/subscriptionId":"sub-1"},"notifications":{"resourceSubscriptions":["emailengine://account/user123"]}}}
```

After that, each state change on a subscribed account arrives as:

```
event: message
data:{"jsonrpc":"2.0","method":"notifications/resources/updated","params":{"_meta":{"io.modelcontextprotocol/subscriptionId":"sub-1"},"uri":"emailengine://account/user123"}}
```

Details worth knowing:

- **Authorization is per URI.** Each subscribed account is checked with the caller's own credential, and one it cannot read is dropped from the acknowledged set rather than failing the request. Compare the acknowledgment with what you asked for.
- **Only `resourceSubscriptions` is honored.** Other filter fields are omitted from the acknowledgment, which per the specification means "not supported": the tool list is static, and prompts do not exist here.
- **Limits.** Only the first 20 URIs of a request are considered, and one credential may hold at most 4 open streams per API worker.
- **This is not a message-level feed.** A notification says an account's state changed; it does not carry mail. For "a message arrived" and everything like it, use [webhooks](/docs/webhooks/overview), which is the mature, filterable, retrying delivery path.

## Request headers

| Header | Purpose |
|--------|---------|
| `Authorization` | `Bearer <access token>`. Required unless API authentication is disabled instance-wide |
| `Content-Type` | Must be `application/json` |
| `MCP-Protocol-Version` | Protocol revision. Mirrors `_meta` in the modern era |
| `Mcp-Method`, `Mcp-Name` | Modern-era routing mirrors of `method` and the tool name or resource URI |
| `Accept` | Must admit `text/event-stream` for `subscriptions/listen`. `text/event-stream;q=0` is honored as a refusal |
| `Origin` | Checked for browser-based clients, see below |
| `Referer` | Evaluated against a token's referrer restrictions, if it has any |
| `X-EE-Timeout` | Request timeout in milliseconds, overriding `EENGINE_TIMEOUT` for this call. Forwarded to the operation the tool dispatches |

CORS preflight allows `X-EE-Timeout`, `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` and `Mcp-Session-Id`.

## Origin checks

Non-browser clients send no `Origin` and are unaffected. When an `Origin` is present, it is admitted only if it is a loopback address, the origin of the configured Service URL, or one of the `EENGINE_CORS_ORIGIN` entries. Anything else is refused:

```json
{ "jsonrpc": "2.0", "id": null, "error": { "code": -32600, "message": "Origin not allowed" } }
```

This is the DNS rebinding protection the Streamable HTTP transport asks for: without it, a page on any site could drive a local EmailEngine instance through the browser of whoever visited it.

## OAuth 2.1 authorization server

When `mcpOAuthEnabled` is on and a Service URL is set, EmailEngine also runs the minimal authorization server that MCP clients discover on their own. Every endpoint below answers `404` while the flow is unavailable, and all of them allow cross-origin requests, because browser-based clients call them directly.

What is implemented: dynamic client registration (RFC 7591, public clients only), authorization code with mandatory PKCE `S256`, single-use codes, exact-match redirect URIs, resource indicators (RFC 8707) and the `iss` authorization response parameter (RFC 9207). There are no client secrets and no refresh tokens.

### Discovery

An unauthenticated request to `/mcp` answers `401` with a pointer to the resource metadata:

```
WWW-Authenticate: Bearer resource_metadata="https://emailengine.example.com/.well-known/oauth-protected-resource/mcp"
```

```bash
curl "https://emailengine.example.com/.well-known/oauth-protected-resource/mcp"
```

```json
{
  "resource": "https://emailengine.example.com/mcp",
  "authorization_servers": ["https://emailengine.example.com"],
  "scopes_supported": ["mcp"],
  "bearer_methods_supported": ["header"],
  "resource_name": "EmailEngine MCP"
}
```

```bash
curl "https://emailengine.example.com/.well-known/oauth-authorization-server"
```

```json
{
  "issuer": "https://emailengine.example.com",
  "authorization_endpoint": "https://emailengine.example.com/admin/mcp/authorize",
  "token_endpoint": "https://emailengine.example.com/mcp/oauth/token",
  "registration_endpoint": "https://emailengine.example.com/mcp/oauth/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "scopes_supported": ["mcp"],
  "authorization_response_iss_parameter_supported": true
}
```

The resource metadata is served both at `/.well-known/oauth-protected-resource/mcp` and at `/.well-known/oauth-protected-resource`, for clients that treat the bare origin as the resource identifier.

### Dynamic client registration

```bash
curl -X POST "https://emailengine.example.com/mcp/oauth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "redirect_uris": ["https://client.example.com/oauth/callback"],
    "client_name": "Example Agent"
  }'
```

```json
{
  "client_id": "b0f3c2a1d4e5f6071829384756abcdef",
  "client_id_issued_at": 1770000000,
  "redirect_uris": ["https://client.example.com/oauth/callback"],
  "token_endpoint_auth_method": "none",
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "client_name": "Example Agent"
}
```

Rules:

- Registration is open and unauthenticated. It mints a client id and nothing else - only an admin's approval turns one into a credential.
- Redirect URIs must be `https`, `http` on a loopback address, or a private-use scheme such as `com.example.app:/callback`. `javascript:`, `data:`, `file:`, `blob:` and `vbscript:` are refused, as is any URI carrying a fragment.
- One to 10 URIs per registration. If any of them is unacceptable the whole registration fails, naming the offending value.
- Registrations expire after 30 days of disuse, refreshed whenever the client starts an authorization. Re-registering is one unauthenticated call.

### Authorization request

The client sends the browser to the authorization endpoint:

```
https://emailengine.example.com/admin/mcp/authorize
  ?client_id=b0f3c2a1d4e5f6071829384756abcdef
  &redirect_uri=https%3A%2F%2Fclient.example.com%2Foauth%2Fcallback
  &response_type=code
  &code_challenge=<base64url(sha256(verifier))>
  &code_challenge_method=S256
  &state=<opaque>
  &resource=https%3A%2F%2Femailengine.example.com%2Fmcp
```

`code_challenge` is required, `S256` is the only accepted method, and `redirect_uri` must be one the client registered. `resource` is optional; if present it has to name this instance.

The page is on the admin surface, and approving requires an authenticated admin session. The operator picks the access level and an optional account limit, then approves or denies.

**Nothing redirects off the origin before a human decides.** Because registration is open, a validated `redirect_uri` is not enough to make an automatic error redirect safe - anyone could register their own address and aim a link at it. So a malformed or unsupported authorization request renders an error page instead of bouncing back to the client. Only two outcomes redirect:

```
https://client.example.com/oauth/callback?code=<code>&state=<opaque>&iss=https%3A%2F%2Femailengine.example.com
https://client.example.com/oauth/callback?error=access_denied&state=<opaque>&iss=https%3A%2F%2Femailengine.example.com
```

Denying needs no admin session: refusing to hand out a credential does not require the authority to hand one out.

### Token request

```bash
curl -X POST "https://emailengine.example.com/mcp/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=<code>" \
  -d "client_id=b0f3c2a1d4e5f6071829384756abcdef" \
  -d "redirect_uri=https://client.example.com/oauth/callback" \
  -d "code_verifier=<verifier>" \
  -d "resource=https://emailengine.example.com/mcp"
```

```json
{
  "access_token": "8a2c...",
  "token_type": "Bearer",
  "scope": "mcp"
}
```

Codes are single-use and valid for 10 minutes. The endpoint accepts form encoding or JSON. Failures use the standard OAuth error shape:

```json
{ "error": "invalid_grant", "error_description": "PKCE verification failed" }
```

The issued credential is an ordinary EmailEngine access token with the `mcp` scope, carrying whatever access level and account binding was approved. It does not expire on its own and there is no refresh token: revoking it on the Access Tokens page is the whole lifecycle.

### Rate limits

The unauthenticated endpoints are budgeted per client IP address, over a rolling hour:

| Endpoint | Budget |
|----------|--------|
| `POST /mcp/oauth/register` | 20 per hour |
| `POST /mcp/oauth/token` | 60 per hour |

A refusal is `429` with `Retry-After` and a `ttl` field naming when to come back. A working client registers once and redeems one code, so these are not budgets a real flow approaches.

## Behind a reverse proxy

Two things matter for MCP traffic.

**Do not buffer the endpoint.** A `subscriptions/listen` response is an event stream, and a proxy that buffers it holds notifications until the connection closes. Give `/mcp` the same treatment as the [change stream](/docs/deployment/nginx-proxy):

```nginx
location = /mcp {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    gzip off;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1h;
    chunked_transfer_encoding off;
}
```

**Pass the client address through correctly.** Token IP restrictions and the OAuth per-IP budgets read the resolved client address. If EmailEngine is behind a proxy, set `EENGINE_API_PROXY_ADDRESSES` to the proxy addresses so `X-Forwarded-For` is honored from them and nowhere else.

## See Also

- [Connecting Agents](/docs/mcp/connect-clients) - the client-side configuration
- [Tools Reference](/docs/mcp/tools) - `tools/list` and `tools/call` payloads in detail
- [Access Control](/docs/mcp/access-control) - what the credential on these requests may do
- [Model Context Protocol specification](https://modelcontextprotocol.io/) - the protocol itself
