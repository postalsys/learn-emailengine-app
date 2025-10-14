---
title: Data and security compliance in EmailEngine
slug: data-compliance
date_published: 2025-03-27T13:22:00.000Z
date_updated: 2025-05-14T11:01:24.000Z
tags: Compliance, EmailEngine, IMAP API
excerpt: Understand exactly what EmailEngine stores, how it encrypts secrets, and how to wipe data when a customer asks for it.
---

> **TL;DR**
> EmailEngine only keeps the minimum metadata it needs to sync mail—nothing leaves **your** infrastructure, and you can wipe everything with a single Redis command.

## Why it matters

Moving email through your SaaS means you’re touching PII and potentially regulated content (GDPR, HIPAA, etc.). Storing less data—and encrypting what you must keep—shrinks your compliance surface and calms security auditors.

> 🛠️ **Self‑hosted reassurance** – EmailEngine processes email entirely inside **your** infrastructure; no data leaves your network.

---

## What EmailEngine stores (and when)

EmailEngine tracks state in Redis so it can answer questions like “Has message *123* changed since the last webhook?” The exact data set depends on the backend.

> 🗒️ **Note** – EmailEngine stores message metadata **only for IMAP accounts**. Gmail API and Microsoft Graph accounts rely on provider‑side change tracking, so EmailEngine keeps **no local index** for them. Likewise, if you enable the *fast* indexer for IMAP (see [**Supported account types**](https://emailengine.app/supported-account-types)), EmailEngine skips the per‑message index altogether.

### 1. Account data

- **Name** – free‑form label you provide.
- **Username** – often the mailbox address.
- **Secrets** – IMAP/SMTP password or OAuth2 tokens, encrypted at rest.

### 2. Folder‑level data
FieldPurposePath namePrimary identifier in IMAP`UIDVALIDITY`, `HIGHESTMODSEQ`, `UIDNEXT`Detect additions, deletions and flag changes
### 3. Message‑level data (IMAP only)
FieldExampleWhy it’s stored`UID``4521`Stable per‑folder identifier`MODSEQ``1245567`Incremented on flag/body changeGlobal ID`X‑GM‑MSGID` / `EMAILID`Cross‑folder dedupingFlags`\Seen`, `\Flagged`Webhook diffingLabels (Gmail over IMAP)`Inbox`, `Important`Multi‑folder storageBounce info`550 5.1.1 No such user`Deliverability analytics
If a field never changes—or reveals sensitive content (e.g. *Subject*)—EmailEngine fetches it live from the mail server instead of caching it.

---

## Encryption

### Field‑level (secrets)

EmailEngine encrypts every value marked as *secret* with **AES‑256‑GCM**. Provide the key via [`EENGINE_SECRET`](__GHOST_URL__/enabling-secret-encryption/).

### Disk‑level

EmailEngine never touches disk directly; Redis does. Use encrypted volumes (LUKS, EBS‑encrypted, etc.) for your Redis data dir if regulatory rules require it.

### In transit

1. **REST API** – bind EmailEngine to `localhost` and terminate TLS at your reverse proxy.
2. **Redis** – use `rediss://` or an SSH tunnel for clusters.
3. **IMAP/SMTP** – EmailEngine always attempts `STARTTLS` or TLS. Most modern providers refuse plaintext logins anyway.

---

## Deleting data

Removing an account via **`DELETE /v1/accounts/:id`** wipes every related key in Redis. Legacy instances (< 2.0) may leave a pathname list behind—you can purge it manually:

    $ redis-cli DEL iah:<accountId>
    

### Backups

Because all state is Redis, your backups are Redis RDB/AOF snapshots. Decide—together with your Data Protection Officer—whether a GDPR “right to be forgotten” request affects historical RDB/AOF files.
