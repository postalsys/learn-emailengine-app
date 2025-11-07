---
title: Performance tuning
slug: tuning-performance
date_published: 2025-09-06T07:06:00.000Z
date_updated: 2025-09-15T12:08:48.000Z
tags: EmailEngine, Threads, Webhooks
---

When you start with **EmailEngine** and only have a handful of test accounts, a modest server with the default configuration is usually enough. As your usage grows, however, you’ll want to review both your hardware and your EmailEngine configuration.

**Rule‑of‑thumb**

- **Waiting mainly for webhooks?** A smaller server is fine.
- **Issuing many API calls?** Provision more CPU/RAM _and_ tune the settings below.

This post walks through the main knobs that affect performance and how to pick sensible values.

## IMAP

EmailEngine spawns a fixed pool of worker threads to keep IMAP sessions alive.
SettingDefaultWhat it does` EENGINE_WORKERS``4 `Number of IMAP worker threads
If you have 100 accounts and `EENGINE_WORKERS=4`, each thread handles ~25 accounts. On a machine with many CPU cores (or on a VPS with several vCPUs), you can safely raise the value so that each core has fewer accounts to juggle.

### Smoother start‑up

Opening a TCP connection and running the IMAP handshake is CPU‑intensive. Doing that for hundreds or thousands of accounts at once can spike the CPU and even trigger the host’s OOM‑killer.

Use an artificial delay so that EmailEngine brings the accounts online one‑by‑one:

    EENGINE_CONNECTION_SETUP_DELAY=3s   # e.g. 3 seconds

With a 3 s delay and 1 000 accounts, the full warm‑up takes ~50 minutes. This is perfectly fine if you are **only** waiting for webhooks; API requests for an account will fail until that account is connected.

### Faster notifications for selected folders

If you need near‑real‑time updates for a small set of folders (for example `Inbox` and `Sent`), enable **sub‑connections** when you add or update an account:

    {
      "subconnections": ["\\Sent"]
    }

EmailEngine then opens a second TCP connection dedicated to that folder. The main connection still polls the rest of the mailbox, but the sub‑connection can fire webhooks for the selected folder instantly - saving both CPU and network traffic.

If you never care about the rest of the mailbox, limit indexing completely:

    {
      "path": ["Inbox", "\\Sent"],
      "subconnections": ["\\Sent"]
    }

With this configuration EmailEngine ignores every other folder.

## Webhooks

EmailEngine enqueues every event, even if webhooks are disabled. By default the queue is processed **serially** by one worker.
SettingDefaultMeaning` EENGINE_WORKERS_WEBHOOKS``1 `Number of webhook worker threads` EENGINE_NOTIFY_QC``1 `Concurrency per worker
The maximum number of in‑flight webhooks is therefore:

    ACTIVE_WH = EENGINE_WORKERS_WEBHOOKS × EENGINE_NOTIFY_QC

Make sure your webhook handler can cope with events arriving out‑of‑order if you raise either value.

> **Tip:** Keep the handler tiny. Ideally it writes the payload to an internal queue (Kafka, SQS, Postgres, …) in a few milliseconds and returns `2xx`, leaving the heavy lifting to downstream workers. This keeps EmailEngine’s own Redis memory usage predictable.

## Email sending

Queued messages live in Redis, so RAM usage scales with the size and number of messages. Like webhooks, email submissions are handled by a worker pool:
SettingDefaultMeaning` EENGINE_WORKERS_SUBMIT``1 `Number of submission worker threads` EENGINE_SUBMIT_QC``1 `Concurrency per worker
Be conservative when increasing `EENGINE_SUBMIT_QC`: each active submission loads the full RFC 822 message into the worker’s heap.

## Redis

1. **Minimize latency** – keep Redis and EmailEngine in the same AZ or at least the same LAN.
2. **Provision enough RAM** – aim for < 80 % usage in normal operation and 2× head‑room for snapshots.
3. **Persistence** – enable RDB snapshots. Turn on AOF only if you have very fast disks.
4. **Storage budget** – plan for **1–2 MB per account** (more for very large mailboxes).
5. **Eviction policy** – set `maxmemory-policy noeviction` (or a `volatile-*` policy). Never use `allkeys-*`.

### `tcp-keepalive`

Leave the default value (`300`). Setting it to `0` (disabling keep‑alive) may lead to half‑open TCP connections.

    tcp-keepalive 300

### Redis‑compatible servers

Provider / ProjectWorks with EmailEngineCaveats**Upstash Redis**✅1 MB command size limit – large attachments cannot be queued. Locate EmailEngine in the same GCP/AWS region.**AWS ElastiCache**✅ (technically)Treats itself as a cache; data loss on restarts. Not recommended.**Memurai**✅Tested only in staging.**Dragonfly**✅Start with `--default_lua_flags=allow-undeclared-keys`.**KeyDB**✅Tested only in staging.

## Horizontal scaling

EmailEngine does not coordinate across nodes. If multiple instances connect to the same Redis, each one will attempt to sync every account on its own. For now the solution is **manual sharding**:

> Divide your accounts across independent EmailEngine instances.
> Example: accounts 0–999 → instance A, 1000–1999 → instance B, etc.
