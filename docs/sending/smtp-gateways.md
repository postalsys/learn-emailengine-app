---
title: SMTP Gateways
sidebar_position: 10
description: Named SMTP relays that a submission can be delivered through instead of the account's own SMTP server or provider API, the gateway record and its API, and what changes for a message routed through one
---

# SMTP Gateways

An SMTP gateway is a named SMTP relay registered with EmailEngine. A submission that names a gateway is delivered through that relay instead of the account's own SMTP server or provider API. The message still belongs to the account: it waits in the account's outbox, its webhooks name the account, and a copy is uploaded to the account's Sent Mail folder.

Gateways exist for mail that should not go out through the mailbox's own server: bulk or transactional mail routed through a relay built for volume, so that it does not count against the mailbox's sending limits, and mail from an account that has no SMTP configuration of its own. An account with neither an SMTP nor an OAuth2 configuration can still send when the submission names a gateway.

## The Gateway Record

A gateway is identified by a `gateway` ID and holds one set of SMTP connection settings.

| Field | Type | Required on create | Description |
|-------|------|--------------------|-------------|
| `gateway` | string, up to 256 characters | Yes over the API | The ID the gateway is referred to by. The admin form can leave it empty, in which case EmailEngine generates a 16-character lowercase ID; the API refuses an empty value |
| `name` | string, up to 256 characters | Yes | Display name |
| `host` | hostname | Yes | SMTP server to connect to |
| `port` | integer, 1 to 65536 | Yes | SMTP port |
| `user` | string, up to 1024 characters | No | Login name. Leave unset or `null` for a relay that takes no authentication |
| `pass` | string, up to 1024 characters | No | Password. Encrypted at rest with the [secret](/docs/deployment/encryption) and never returned |
| `secure` | boolean, default `false` | No | `true` opens a TLS connection from the start, the usual choice for port 465. `false` opens a plaintext connection and upgrades it with STARTTLS when the server offers it, the usual choice for ports 587 and 25 |

Three read-only fields record how the gateway has been used:

| Field | Description |
|-------|-------------|
| `deliveries` | Number of messages the gateway has accepted |
| `lastUse` | Time of the last delivery attempt, successful or not |
| `lastError` | The last failed attempt, or `null` after a successful delivery. Carries `created`, `status` (`error`), `response` and `responseCode` from the server, the nodemailer `code` and `command`, a `description`, and the `networkRouting` (local address, proxy, EHLO name) of the attempt. Recorded for the failures EmailEngine can describe: connection, DNS, timeout, TLS, protocol, envelope, message and authentication errors |

## Managing Gateways over the API

| Operation | Permission | Description |
|-----------|------------|-------------|
| [`GET /v1/gateways`](/docs/api/get-v-1-gateways) | `read` on `gateway` | Lists gateways, paged with `page` (zero-based) and `pageSize` (default 20, maximum 1000). Each entry carries `gateway`, `name`, `deliveries`, `lastUse` and `lastError`; the connection settings are not listed |
| [`GET /v1/gateway/{gateway}`](/docs/api/get-v-1-gateway-gateway) | `read` on `gateway` | Returns the full record. `pass` reads back as `******` when a password is stored |
| [`POST /v1/gateway`](/docs/api/post-v-1-gateway) | `write` on `provisioning` | Registers a gateway. Send `gateway: null` to have a unique ID generated (since v2.82.1); the field cannot be left out. The response carries `gateway` and `state`: `new`, or `existing` when the ID was already registered, in which case the connection settings are overwritten and the usage fields kept |
| [`PUT /v1/gateway/edit/{gateway}`](/docs/api/put-v-1-gateway-edit-gateway) | `write` on `provisioning` | Updates the fields in the payload and keeps the rest. `user: null` and `pass: null` remove the stored credentials |
| [`DELETE /v1/gateway/{gateway}`](/docs/api/delete-v-1-gateway-gateway) | `destructive` on `gateway` | Removes the gateway. Messages already queued for it fail when their delivery runs, see [below](#a-gateway-that-no-longer-exists) |

Creating and editing a gateway are in the `provisioning` [permission group](/docs/api-reference/access-tokens#permissions) rather than `gateway`, because a changed `host` receives the stored password on the next delivery. A token narrowed with a `permissions` record has to name `provisioning` to register or edit a gateway, and `gateway` to read or delete one. Before EmailEngine 2.80.1 registering and editing were in the never-grantable `admin` group, so only an instance-wide token could do either.

The same five operations are available to AI agents as the `list_gateways`, `get_gateway`, `create_gateway`, `update_gateway` and `delete_gateway` [MCP tools](/docs/mcp/tools) of the `mcp-manage` scope.

Register a gateway:

```bash
curl -XPOST "https://emailengine.example.com/v1/gateway" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "transactional-relay",
    "name": "Transactional relay",
    "host": "smtp.relay.example.com",
    "port": 587,
    "secure": false,
    "user": "relay-user",
    "pass": "relay-password"
  }'
```

```json
{
  "gateway": "transactional-relay",
  "state": "new"
}
```

Read it back:

```bash
curl "https://emailengine.example.com/v1/gateway/transactional-relay" \
  -H "Authorization: Bearer <token>"
```

```json
{
  "gateway": "transactional-relay",
  "name": "Transactional relay",
  "host": "smtp.relay.example.com",
  "port": 587,
  "user": "relay-user",
  "pass": "******",
  "secure": false
}
```

The usage fields appear once the gateway has been used: `GET /v1/gateway/{gateway}` leaves them out until then, while the listing reports `deliveries: 0`, `lastUse: null` and `lastError: null` for a gateway that has not delivered anything.

Rotate the password without touching the other fields:

```bash
curl -XPUT "https://emailengine.example.com/v1/gateway/edit/transactional-relay" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pass": "new-relay-password"}'
```

Do not write a masked `pass` back: `******` is not the stored password, and the update stores it as given.

## Managing Gateways in the Admin Interface

Gateways are listed under **Gateways** in the **Email** section of the side menu, with their ID, status, the number of emails sent and the last activity. **Add gateway** opens a form with **Gateway ID** (optional, generated when left empty), **Display Name**, **Server Address**, **Port**, **Username**, **Password** and **Use direct TLS**, which is the `secure` field. **Test connection** opens an SMTP connection with the settings in the form and logs in before anything is saved, and reports the failure in plain words (an unknown hostname, a refused login, a TLS error, a timeout). The gateway page shows the stored settings with the password masked, the delivery count and the last error, with **Edit gateway** and the delete action in the actions menu.

## Routing a Message through a Gateway

A submission names a gateway in one of three ways:

- The `gateway` field of [`POST /v1/account/{account}/submit`](/docs/api/post-v-1-account-account-submit), and of the [draft submission](/docs/api/post-v-1-account-account-message-message-submit) endpoint
- The `X-EE-Gateway` header of a message handed to the [SMTP server](/docs/sending/smtp-interface#emailengine-options-as-headers), or carried in a `raw` submission or a submitted draft. The header is removed before delivery
- The `gateway` field of a [delivery test](/docs/sending/deliverability/inbox-placement-testing), which sends the test message through the gateway

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{ "address": "recipient@example.com" }],
    "subject": "Order confirmation",
    "text": "Your order has shipped.",
    "gateway": "transactional-relay"
  }'
```

The gateway is looked up when the message is queued. A submission naming a gateway that does not exist is refused with `404` and the message `Gateway "transactional-relay" was not found`. The queued entry shows the gateway in its `gateway` field in the [outbox API](/docs/sending/outbox-queue#outbox-api).

### What Changes for a Gateway Delivery

- **Connection.** The host, port, TLS mode and credentials come from the gateway record. The account's SMTP settings, its OAuth2 token and its authentication server are not used. A Gmail API or MS Graph account delivers over SMTP through the gateway instead of its provider API.
- **Network settings still come from the account and the instance.** The [local address](/docs/configuration/local-addresses) is selected as for any SMTP delivery, including a `localAddress` given on the submission. The proxy is the submission's `proxy`, then the account's, then the global proxy setting. The account's `smtpEhloName` sets the EHLO name, and the `ignoreMailCertErrors` setting applies to the gateway's certificate too.
- **Sent Mail copy.** A gateway delivery is uploaded to the Sent Mail folder by default for every account type, Gmail and Microsoft 365 included, because the provider never sees a message sent through a relay. `copy: false` suppresses it, and no copy is stored for an account with IMAP disabled, with no IMAP or OAuth2 configuration, or with no folder flagged `\Sent`. See [Skip Sent Folder](/docs/sending/basic-sending#skip-sent-folder).
- **Statistics.** A successful delivery increments the gateway's `deliveries`, sets `lastUse` and clears `lastError`. A failed attempt sets `lastUse` and records the failure in `lastError`, in addition to the account's own `smtpStatus`.
- **Webhooks.** `messageSent`, `messageDeliveryError` and `messageFailed` are sent for the account, and their `networkRouting` describes the connection to the gateway.

Retries, the `deliveryAttempts` limit and the distinction between permanent and transient failures are the same as for any SMTP delivery; see [Outbox Queue](/docs/sending/outbox-queue).

### A Gateway that No Longer Exists

A message queued for a gateway is never sent through the account's own server instead. If the gateway is deleted between queuing and delivery, the delivery fails before any connection is made, with the permanent error code `GatewayNotFound`. No `messageDeliveryError` is sent for it, because no attempt reached a server; the job ends at once and `messageFailed` reports it. Submit the message again, with another gateway or without one, to send it.

## See Also

- [Basic Email Sending](/docs/sending/basic-sending) - The submit payload the `gateway` field belongs to
- [SMTP Server](/docs/sending/smtp-interface) - The `X-EE-Gateway` header and the other control headers
- [Outbox Queue](/docs/sending/outbox-queue) - Delivery attempts, the retry schedule and what makes a failure permanent
- [Access Tokens](/docs/api-reference/access-tokens#permissions) - The `gateway` and `provisioning` permission groups
- [Transactional Email Service](/docs/sending/transactional-service) - Gateways in the context of a transactional sending setup
