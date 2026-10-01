---
title: FIPS Mode
description: Run EmailEngine on a host whose OpenSSL is in FIPS mode - which installations qualify, which algorithms are used, and what to do before switching an existing instance
sidebar_position: 11
---

# FIPS Mode

EmailEngine uses only algorithms that an OpenSSL FIPS provider allows, so an installation that runs on the host's own Node.js and OpenSSL works on a system with FIPS mode enabled. There is no FIPS setting in EmailEngine and nothing in it detects FIPS mode: the same algorithms are used on every host, and FIPS mode is a property of the OpenSSL that Node.js loads.

This page says which installations qualify, what EmailEngine uses in place of the algorithms a FIPS provider refuses, and what to do before switching an existing instance.

:::note Approved algorithms, not a certification
EmailEngine is not FIPS certified and makes no such claim. What it offers is that every cryptographic operation goes through the platform's OpenSSL, using algorithms a FIPS 140 validated provider implements. The validated module, and the certification, belong to the operating system.
:::

## Which installations run in FIPS mode

FIPS mode is enforced by OpenSSL, so it applies when Node.js uses the operating system's OpenSSL with its FIPS provider loaded:

- **npm and source installations** on a Node.js build that links the system OpenSSL, such as the `nodejs` package of RHEL and its derivatives, or the `ubi9/nodejs` container images. See [Installing from Source](/docs/installation/source).
- **Not the standalone binary** and **not the Docker image**. Both bundle their own Node.js with a statically linked OpenSSL that carries no FIPS provider, so they run the same algorithms but outside FIPS mode.

To confirm that the Node.js EmailEngine runs on is in FIPS mode:

```bash
node -p "require('crypto').getFips()"
```

It prints `1` in FIPS mode and `0` otherwise. On RHEL, `fips-mode-setup --check` reports the system setting. Inside a UBI container, setting `OPENSSL_FORCE_FIPS_MODE=1` in the environment switches Red Hat's OpenSSL build into FIPS mode without a host-level change; the `--force-fips` flag of Node.js is refused there, since the setting belongs to OpenSSL.

## Algorithms in use

A FIPS provider refuses MD5, scrypt and Ed25519, among others. EmailEngine does not use them anywhere:

| Purpose | Algorithm |
| --- | --- |
| Stored credentials (`EENGINE_SECRET`) | AES-256-GCM, key derived with PBKDF2-HMAC-SHA256 (600,000 iterations) |
| Export files | AES-256-GCM with the same key derivation |
| Admin password hashes | PBKDF2-HMAC-SHA256 |
| Passkeys | ES256 (P-256) or RS256 keys, chosen at registration |
| Webhook signatures, token ids | HMAC-SHA256, SHA-256 |
| Self-signed certificates for the TLS listeners | RSA 2048 or P-256 keys, SHA-256 signatures |
| Internal message and attachment hashes | SHA-256 |

Stored credentials and export files written by earlier releases derived their key with scrypt. EmailEngine still reads them on a host that has scrypt, and rewrites a credential the next time it is saved, but on a FIPS host such a value cannot be read at all. The next section is about that.

## Before switching an existing instance

A fresh installation needs nothing beyond a FIPS-enabled host. An instance that already holds data has three things to take care of, all of them **before** FIPS mode is turned on, because each one needs an algorithm that is unavailable afterwards.

### 1. Rewrite stored credentials

Run the [encryption migration](/docs/deployment/encryption#rewriting-values-under-the-current-key-derivation) with the current secret while EmailEngine is stopped. It rewrites every value whose key was derived with scrypt, even though the secret does not change:

```bash
emailengine encrypt \
  --dbs.redis="redis://localhost:6379/8" \
  --service.secret="current-secret"
```

Every rewritten record is reported, and a run that finds nothing to rewrite reports a zero in each count (`Updated 0/3 accounts`). A value the current secret cannot decrypt is reported as `Could not process`; resolve those with the [secret rotation](/docs/deployment/encryption#changing-encryption-secret) steps before going on.

Skipping this step leaves the affected accounts without credentials once FIPS mode is on: EmailEngine logs `Failed to decrypt value` for each one, treats the field as missing, and the account fails to authenticate until its credentials are saved again.

### 2. Download or delete older exports

An [export file](/docs/receiving/exporting) is encrypted when `EENGINE_SECRET` is set, and a file created by an earlier release derived its key with scrypt. Such a file can be downloaded only where scrypt is available. Download the exports you still need, or delete them, before the switch. Exports created afterwards use PBKDF2 and download normally.

### 3. Re-register older passkeys

A passkey registered by an earlier release may hold an Ed25519 key, because those releases listed EdDSA first among the accepted algorithms. It keeps working on a host without FIPS mode and fails to sign in on a FIPS host: the browser prompt completes, the server answers `Authentication failed`, and the attempt is logged as `Failed to verify passkey authentication`. Remove such a passkey under **Account** > **Security** and register it again on the FIPS host; registration now accepts ES256 and RS256 keys only, on every host.

## Limitations

- **SMTP servers that offer only CRAM-MD5.** EmailEngine authenticates with PLAIN or LOGIN whenever the server offers one of them, and falls back to CRAM-MD5 only when it offers neither. On a FIPS host that fallback fails, because MD5 is unavailable, and the account reports an authentication error. Such servers are rare; every mainstream provider offers PLAIN or LOGIN over TLS.
- **No rollback to a release that predates PBKDF2 derivation.** A release that does not know the PBKDF2 scheme reads a value written under it as cleartext and uses the ciphertext as the credential. This applies to every instance, not only FIPS hosts, and is covered on the [encryption page](/docs/deployment/encryption#rewriting-values-under-the-current-key-derivation).
- **Coverage.** The IMAP and SMTP paths, bounce detection, exports, the admin interface login, the built-in SMTP server with a self-signed certificate, webhooks and secret rotation have been exercised in FIPS mode. The OAuth2 providers, passkey sign-in and the IMAP proxy have not; they use the same algorithms and no problem is expected, but report one if you find it.

## See Also

- [Secret Encryption](/docs/deployment/encryption) - How stored credentials are encrypted and how the migration tool rewrites them
- [CLI Reference](/docs/configuration/cli#encrypt-command) - Every option of the `encrypt` command
- [Installing from Source](/docs/installation/source) - The installation method that runs on the host's Node.js
- [Security Best Practices](/docs/deployment/security) - What else to lock down before going live
- [Compliance and Data Handling](/docs/deployment/compliance) - What EmailEngine stores, and which requirements it helps with
