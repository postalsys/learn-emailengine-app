---
title: Credential Security FAQ
sidebar_position: 2
description: How EmailEngine stores and protects email account credentials, access tokens, and admin sessions, and what it logs and sends out
---

# Credential Security FAQ

Common questions about how EmailEngine stores, secures, and encrypts email account credentials, and about the other secrets an instance holds.

## Where are email credentials stored?

EmailEngine stores every credential it holds in **Redis**:

- IMAP and SMTP passwords
- OAuth2 access tokens and refresh tokens
- OAuth2 application client secrets, service account keys, and external account configurations
- SMTP gateway passwords
- The SMTP server and IMAP proxy passwords, the OpenAI API key, the TOTP seed, and the admin session cookie key

## Is email content stored?

Not as a copy of the mailbox. EmailEngine reads messages from the mail server on demand and keeps only sync state (message IDs, flags, folder listings) in Redis.

Content does pass through Redis in two cases:

- A submitted message is stored in Redis, in full, from submission until it is delivered, so that the queue can retry it. It is removed once delivery succeeds or the attempts run out
- Webhook payloads waiting in the notify queue carry whatever the payload includes; with `notifyText` or `notifyAttachments` enabled, that is message content

Neither is encrypted by `EENGINE_SECRET`, which covers credentials only. The Document Store, which indexed message content in Elasticsearch, was removed in EmailEngine v2.82.0.

## Are credentials encrypted?

**It depends on your configuration:**

| Configuration | Storage Method | Security Level |
|--------------|----------------|----------------|
| Without `EENGINE_SECRET` | Cleartext | Development only |
| With `EENGINE_SECRET` | AES-256-GCM encrypted | Production ready |

For production deployments, always configure `EENGINE_SECRET`.

## How do I enable encryption?

Set `EENGINE_SECRET` before the first start and keep the same value on every start afterwards; a different or missing secret leaves the stored credentials undecryptable. An instance that already holds cleartext credentials encrypts them with `emailengine encrypt`. [Secret Encryption](/docs/deployment/encryption) has the generation, storage and migration steps.

## What encryption algorithm is used?

AES-256-GCM, with a key derived from `EENGINE_SECRET` by PBKDF2-HMAC-SHA256 and a per-value IV and authentication tag, so a tampered value is detected on decryption rather than silently accepted. Values written by earlier releases derived the key with scrypt and are still read; [Secret Encryption](/docs/deployment/encryption#rewriting-values-under-the-current-key-derivation) describes how to move them.

## Does EmailEngine run on a FIPS-enabled host?

Yes, when it runs on a Node.js that uses the host's OpenSSL with its FIPS provider, which is the case for npm and source installations on RHEL and its derivatives. EmailEngine uses only algorithms a FIPS provider allows (PBKDF2, AES-256-GCM, SHA-256, ES256 and RS256 passkeys) and has no FIPS mode of its own. The standalone binary and the Docker image bundle their own OpenSSL without a FIPS provider. An existing instance needs its stored values rewritten before the switch. See [FIPS Mode](/docs/deployment/fips-mode).

## What happens if Redis is compromised?

| Scenario | Impact |
|----------|--------|
| Without encryption | Attacker gains all passwords and OAuth tokens in cleartext |
| With encryption | Attacker sees encrypted data; credentials remain secure unless `EENGINE_SECRET` is also compromised |

Three things follow from that:

1. Enable encryption in production
2. Store `EENGINE_SECRET` separately from Redis, so one backup cannot yield both
3. Use Redis authentication and network isolation

## What happens if I lose EENGINE_SECRET?

Every encrypted value is unrecoverable. Password accounts have to be given their credentials again and OAuth2 accounts have to be re-authorized, one by one; there is no bulk recovery, because EmailEngine holds no second copy of the key.

Guard against it by backing the secret up somewhere other than the Redis backups, and by keeping it in a secrets manager rather than only in a deployment file.

## How do I rotate the encryption secret?

Run `emailengine encrypt` with the new secret in `--service.secret` and each old one in a `--decrypt` argument, which can be repeated. It decrypts every stored value with the old secrets and writes it back under the new one. See [Secret rotation](/docs/deployment/encryption#2-secret-rotation).

## Can I use external secret managers?

Yes. `EENGINE_SECRET` is read from the environment like any other variable, so any secret manager that can populate the environment before the process starts works, and `EENGINE_SECRET_FILE` reads it from a mounted file. [Using secret management systems](/docs/deployment/encryption#using-secret-management-systems) has examples for Vault, AWS Secrets Manager, Kubernetes and Docker secrets.

## How are API tokens stored?

Only as a SHA-256 hash. The token value is shown once, when it is created, and cannot be recovered from the hash afterwards. The hash is the token's `id` in listings and log entries, and `DELETE /v1/tokens/{token}` accepts either the value or the hash. See [Access tokens](/docs/api-reference/access-tokens#token-id).

## How are admin sessions protected?

The admin interface sets a session cookie named `ee`. It is sealed with a key EmailEngine generates on first start and stores encrypted in Redis, so it cannot be read or forged without that key. The cookie is marked `Secure` when `serviceUrl` uses `https://`, and `SameSite=Lax`. Changing the admin password ends every existing session at once.

## What do the logs contain?

The `Authorization` and `Cookie` request headers and an `access_token` query parameter are redacted before a request is logged, as are the offending values inside a request-validation error, which would otherwise carry the credential a rejected payload contained. Account passwords and OAuth2 tokens are not written to the log in normal operation.

The exception is raw protocol logging: `EENGINE_LOG_RAW=true` writes the IMAP conversation as-is, which includes the login exchange. Use it for a short debugging session, and treat the resulting log as sensitive. See [Logging](/docs/advanced/logging).

## What does EmailEngine send out?

An instance with a subscription license validates the key against `postalsys.com` at startup after an upgrade and then on the schedule the validation response sets: at most 30 days apart, and never closer together than 24 hours. That request carries the license key, the EmailEngine version, an instance ID, and an anonymized feature beacon; `EENGINE_BEACON_DISABLED=true` removes the beacon. The beacon itself holds enable flags, provider type names, coarse magnitude tiers rather than counts, usage booleans, and runtime context such as the Node.js version and CPU architecture. No email content, addresses, URLs, or credentials leave the server. A trial key and any other time-limited key are verified offline and make no request at all. [Licensing](/docs/licensing#what-a-licensed-instance-sends-home) and [Compliance](/docs/deployment/compliance#no-developer-access) describe the request in full.

## Is there a software bill of materials?

Yes, in SPDX format, listing every package in the running build:

- `GET /sbom.json`, which needs an access token holding the full `api` scope. An account-bound token or one narrowed with a `permissions` record is refused, because the inventory belongs to the instance rather than to any account
- Since v2.79.4, as a download from the **Legal Information** page of the admin interface (`/admin/legal/sbom.json`). It is served on the admin surface because the API token strategy has no session-cookie fallback, so a link from a rendered page answered a signed-in admin with a 401. Reaching it therefore requires an admin session, and an address inside `EENGINE_ADMIN_ACCESS_ADDRESSES` wherever that allowlist is set

See [Compliance](/docs/deployment/compliance#audit-support) for the request.

## How do I secure Redis itself?

Require a password or an ACL user, bind Redis to localhost or a private interface, connect over TLS with a `rediss://` URL when Redis is on another host, and keep port 6379 closed at the firewall. [Redis Configuration](/docs/configuration/redis) covers the Redis side and [Redis Security](/docs/deployment/security#redis-security) the EmailEngine side, including the commands EmailEngine never needs.

## Is there a production checklist?

[Security Best Practices](/docs/deployment/security#security-checklist) carries the pre-deployment, post-deployment and maintenance checklists. The four items specific to credentials: `EENGINE_SECRET` set to a strong random value, backed up separately from the Redis data and kept out of the code repository; Redis authenticated and unreachable from the public network; the admin interface reachable only from known addresses or through a VPN; API tokens bound to an account or a `permissions` record wherever they do not need instance-wide access.

## See Also

- [Encryption Guide](/docs/deployment/encryption) - Detailed encryption configuration
- [Security Best Practices](/docs/deployment/security) - Production security hardening
- [Admin Authentication](/docs/deployment/admin-authentication) - How admin sessions are opened, and the login audit log
- [Redis Configuration](/docs/configuration/redis) - Redis setup and security
- [Environment Variables](/docs/configuration/environment-variables) - All configuration options
