---
title: Performance Tuning
sidebar_position: 1
description: Size and tune a single EmailEngine instance for large account counts - worker threads, per-message work, queues, memory, logging and Redis
---

# Performance Tuning

This page covers what decides how much work one EmailEngine instance can do, and the settings that change it: where CPU and memory go, how accounts are spread over threads, how much work each new message causes, queue concurrency and retention, memory limits, logging, and the Redis it all depends on.

## Overview

### Where the resources go

EmailEngine is a single process with several threads. Knowing which thread does what tells you which setting to reach for:

- **Account worker threads** (`EENGINE_WORKERS`) keep every account connected and synced. IMAP, Gmail API and Microsoft Graph accounts all run here. An IMAP account holds at least one open connection; everything a new message needs before its webhook is queued (fetching text, headers, attachments, running [webhook route](/docs/webhooks/webhook-routing) scripts) happens on the account's thread. Every API call that touches a mailbox also runs on the account's thread
- **Queue worker threads** deliver webhooks, send queued messages and run exports. Their payloads wait in Redis, so a queue that does not drain shows up as Redis memory
- **The API worker** serves the REST API and the admin UI
- **The main thread** assigns accounts to workers, relays every call between threads, and runs a few things itself: bounce classification and the requests behind [AI processing](/docs/receiving/ai-processing)
- **Redis** stores everything: account state, mailbox indexes, queues and logs. Its latency is added to nearly every operation

With a handful of test accounts, a modest server on the default configuration is enough. As the account count grows:

- **Waiting mainly for webhooks?** A smaller server is fine; the cost is mostly connections that sit idle and the work done per new message
- **Issuing many API calls?** Provision more CPU and RAM, because those calls run on the same account threads that keep the accounts synced

### Where to start

| Symptom | First things to check |
|---------|-----------------------|
| CPU constantly at 100% | Free memory (swapping looks like CPU load), [log level](#logging), [accounts per thread](#worker-threads), [reconnect loops](#accounts-keep-reconnecting) |
| Process memory grows with the account count | [Connections per account](#connections-per-account), [IMAP compression](#native-memory-imap-compression) |
| Memory high right after startup, falls back after a few minutes | [Young generation](#the-young-generation) |
| Redis memory grows | [Queue retention](#queue-retention), [webhook endpoint speed](#webhook-configuration), [per-message payload](#reducing-per-message-work), [account logs](#logging) |
| Webhooks arrive late | [Per-message work](#reducing-per-message-work), [webhook concurrency](#webhook-configuration), [route scripts](#webhook-routes-and-ai-processing) |
| API requests fail with 503 after a restart | [Warm-up](#connection-setup-delay) |
| API requests time out (504) | [Overloaded account threads](#api-request-timeouts) |

The worker and queue settings below are read from an environment variable or the configuration file at startup and cannot be changed at runtime; see [Environment variables](/docs/configuration/environment-variables#worker-threads) for the full list. The per-account settings (`path`, `subconnections`, `imapIndexer`, `imap.resyncDelay`) and the instance-wide settings (`notifyText`, `logs`, `exportMaxGlobalConcurrent` and the others named below) are changed through the API or the admin UI at runtime; see the [Settings reference](/docs/configuration/settings).

## Account Workers

### Worker Threads

EmailEngine spawns a fixed pool of account worker threads that keep connections alive and sync mail. Each thread handles a share of the accounts regardless of type.

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS` | `4` | Number of account worker threads. The value `cpus` means one thread per CPU core |

With 100 accounts and `EENGINE_WORKERS=4`, each thread handles about 25 accounts. On a machine with several cores, raise the count so that each core has fewer accounts to juggle:

```bash
# 8-core server with 400 accounts: about 50 accounts per thread
EENGINE_WORKERS=8
```

**How accounts are assigned.** Each account goes to the thread with the fewest accounts. Only the number of accounts counts, not their mailbox size or activity, so a few very busy accounts can land on the same thread. The assignment lives only in memory and is made again from scratch on every start, so changing `EENGINE_WORKERS` takes effect at the next restart.

**When a thread exits.** Its accounts wait up to 10 seconds for the replacement thread. If it is not up by then, they are spread over the surviving threads, and once the replacement is running a fair share is moved back to it. Every account that moves reconnects. Accounts do not move between threads at any other time.

### Connection Setup Delay

Opening TCP connections and running IMAP handshakes is CPU-intensive. Doing this for hundreds or thousands of accounts at once after a restart spikes CPU and can push the host into swapping.

`EENGINE_CONNECTION_SETUP_DELAY` inserts a pause between assigning one account to a worker and the next. The default is `0`; the value accepts a duration string, and a bare number is read as milliseconds:

```bash
EENGINE_CONNECTION_SETUP_DELAY=3s
```

The delay is global, not per thread: accounts are assigned one at a time. With a 3 second delay and 1,000 accounts, the last account comes online at least 50 minutes after startup, and the same pacing applies when the accounts of a failed thread are reassigned. That is fine if you are only waiting for webhooks, but API requests for an account fail with HTTP 503 until it is ready:

| Error code | Meaning |
|------------|---------|
| `WorkerNotAvailable` | The account has not been assigned to a thread yet |
| `NotYetConnected` | The account is assigned but has not finished its first connection |
| `IMAPUnavailable` | The account's IMAP connection is not usable at the moment |

Starting points:

- Under 100 accounts: 1-2s
- 100 to 1,000 accounts: 3-5s
- Over 1,000 accounts: 5-10s

### Unresponsive Threads

Every thread sends the main thread a heartbeat every 10 seconds. A thread that misses heartbeats for 30 seconds is logged as `Worker unhealthy - no heartbeat`; after 60 seconds it is logged as `Worker critically unresponsive, restarting` and terminated, and its accounts go through the reassignment described above.

A thread stops sending heartbeats when something keeps it busy without a break, which on an account thread usually means too many accounts, a slow [route script](#webhook-routes-and-ai-processing), or a very large message being processed. Because every account of a terminated thread reconnects at once, an overloaded thread can end up restarting in a loop. If these log lines repeat, raise `EENGINE_WORKERS` and look at what the accounts on that thread were doing. The `unresponsive_workers` and `thread_starts` metrics show the same from [monitoring](#monitoring-and-metrics).

## Reducing Per-Account Work

### Connections per Account

An IMAP account uses:

- **One primary connection**, which syncs the mailbox and then sits in `IDLE` on the watched folder
- **A command connection**, opened when an API request arrives while the primary connection is busy syncing
- **One connection per [sub-connection](#sub-connections-for-selected-folders) entry**
- **One upstream connection per client session** when the [IMAP proxy](/docs/receiving/imap-proxy-server) is in use

Count on two or more connections per account against the provider's per-account limit and against the instance's memory. To spread a large fleet over several source addresses or a proxy, see [Local IP address binding](/docs/configuration/local-addresses).

An account that only sends mail does not need an IMAP connection at all: set `imap.disabled` to `true` and it keeps sending over SMTP without connecting to IMAP. Replies and forwards that name a stored message as `reference` are not available on such an account. See [Managing accounts](/docs/accounts/managing-accounts).

### Polling and the Resync Interval

The primary connection sits in `IDLE` on INBOX, or on the first folder of the account's `path` setting when that is narrowed. On Gmail, an account watching all folders idles on "All Mail" instead, and the other folders except Junk and Trash are not synced at all, because "All Mail" already contains their messages.

Every other folder is checked by a periodic resync pass, by default every 15 minutes. Changes in those folders produce webhooks only when that pass runs. The interval is set per account as `imap.resyncDelay`, in seconds; OAuth2 IMAP accounts always use the 15 minute default. A longer interval means fewer commands per account and later webhooks for folders other than the watched one.

### Sub-Connections for Selected Folders

To get push notifications for a folder other than the watched one, list it in the account's `subconnections`:

```json
{
  "subconnections": ["\\Sent"]
}
```

Each entry is a folder path or a special-use flag (`\\Sent`, `\\Junk`, `\\Trash`, `\\Drafts`). For each one EmailEngine opens an additional IMAP session dedicated to that folder; the main connection keeps polling the rest of the mailbox.

**What you get:**
- Webhooks for the selected folder fire as soon as the server reports the change
- The folder is no longer waiting on the resync interval

**What it costs:**
- One more concurrent IMAP session per entry, against the provider's per-account connection limit
- A `subconnections` change reconnects the account

**Entries EmailEngine leaves disabled:** the account page (**Accounts** > the account > **Subconnections**) lists every configured path with a state badge. A disabled entry shows **Disabled**, and hovering over the badge shows the reason:

| Reason shown | When |
| ------------ | ---- |
| `Mailbox folder not found` | The path or special-use flag matched nothing in the folder listing. The entry is tried again on a later resync pass, in case the folder appears |
| `Covered by the primary connection` | The path is the first entry of the account's `path` setting, which the main connection already watches |
| `Covered by the "All Mail" folder` | Gmail account watching all folders: only `\\Trash` and `\\Junk` are accepted, because "All Mail" already covers everything else |
| `Can not use the default folder` | Non-Gmail account watching all folders: INBOX is already the main connection's folder |

:::info Best Effort
Sub-connections are non-blocking. If a sub-connection fails, for instance because the server rejects one more concurrent session, the account keeps working on its primary connection and the folder falls back to the resync interval.
:::

### Limiting Indexed Folders

If you never need the rest of the mailbox, limit what EmailEngine syncs with the account's `path` setting:

```json
{
  "path": ["INBOX", "\\Sent"],
  "subconnections": ["\\Sent"]
}
```

**What this does:**
- EmailEngine syncs and indexes only the listed folders
- Changes in unlisted folders produce no webhooks
- Unlisted folders stay fully reachable through the API: listing, searching, fetching and moving messages all work
- Unlisted folders still get a `STATUS` check on each resync pass so their message counts stay current, but they are not indexed, which is the main cost of a large mailbox

The default is `["*"]`, every folder. A support desk that only needs INBOX and Sent Mail is the typical case for narrowing it.

For a large mailbox where you do need every folder, the [`imapIndexer`](/docs/accounts/imap-indexers) setting is the other lever: the `fast` indexer skips tracking of flag changes and deletions and is much cheaper than `full`.

### Stale Primary Connections

New messages in the watched folder are only ever learned from the primary connection, which the periodic resync skips. A server can keep that session alive while its view of the folder stops moving, and nothing in the default configuration notices. Since v2.82.0, `EENGINE_IMAP_STALE_CHECK_INTERVAL` (a duration such as `1h`, off when unset) makes the resync pass check the folder's `UIDNEXT` over the command connection once the primary's own has not moved for that long, and reconnect the primary when the server is ahead on two checks in a row. Set it on an instance where accounts stop reporting new mail until they are reconnected by hand.

### Gmail API and Microsoft Graph Accounts

These accounts hold no IMAP connection, but they still run on the account threads and make periodic requests of their own:

- **Gmail API** accounts learn about changes through [Cloud Pub/Sub](/docs/accounts/gmail/gmail-pubsub). When no notification arrives for an account within `EENGINE_GMAIL_FALLBACK_POLL_INTERVAL` (default 10 minutes), it checks for changes itself. Pub/Sub messages are pulled by every webhook worker, so `EENGINE_WORKERS_WEBHOOKS` also sets the number of pullers
- **Microsoft Graph** accounts run a recovery pass every `EENGINE_OUTLOOK_FALLBACK_POLL_INTERVAL` (default `10m`) to catch messages whose change notification never arrived. A pass that finds nothing is one listing request, so 10,000 accounts on the default make about 17 Graph requests per second. See [Outlook and Microsoft 365](/docs/accounts/microsoft-365/outlook-365)

A request the provider throttles is retried at most three times, honouring `Retry-After` up to 5 seconds per wait and 8 seconds in total; a provider that keeps throttling for longer makes the request fail.

## Reducing Per-Message Work

For every new message, the account's thread fetches what the `messageNew` webhook will carry before the event is queued. The webhook settings therefore decide how many IMAP fetches each message causes, how long the account's thread spends on it, and how much Redis memory the queued event takes.

| Setting | Default | Cost per new message |
|---------|---------|----------------------|
| `notifyText` | `true` | A fetch of the text content. The text is stored in the queued event |
| `notifyTextSize` | 2 MB | Upper limit of the text fetched and stored per message |
| `notifyHeaders` | `[]` | Headers to include. `*` fetches and stores every header |
| `notifyAttachments` | `false` | One download per attachment, stored base64-encoded in the queued event |
| `notifyAttachmentSize` | no limit | Attachments above this size are skipped. Without it, a single large attachment ends up in Redis |
| `notifyWebSafeHtml` | `false` | HTML sanitising on the account thread, plus a download of the inline images it embeds |
| `notifyCalendarEvents` | `false` | A download and parse of each calendar attachment |
| `resolveGmailCategories` | `false` | Up to 7 extra `SEARCH` commands per Gmail inbox message |

The defaults put up to 2 MB of text into every queued `messageNew`. If your application fetches the message through the API anyway, turning `notifyText` off or lowering `notifyTextSize` is the largest single saving in both IMAP traffic and Redis memory. [messageNew](/docs/webhooks/messagenew) shows what each setting adds to the payload.

:::warning Event filters do not save this work
`webhookEvents` (the list of events to deliver) and `inboxNewOnly` are applied when the webhook worker delivers a queued event. Every event is still fetched, processed and queued first, so they reduce webhook requests, not IMAP or Redis load.
:::

The per-account `notifyFrom` setting skips messages older than a date, which helps when an account with a large history is added.

### Webhook Routes and AI Processing

Two features run inside the message path and can hold up every account on a thread:

- **[Webhook routes](/docs/webhooks/webhook-routing)** run their filter and mapping functions on the account's thread, for every event and every route, before the event is queued. A function may run for up to 30 seconds, and the thread does nothing else while it runs. Every route that matches also queues one more copy of the payload. Keep the functions short and the route count low
- **[AI processing](/docs/receiving/ai-processing)** requests a summary for each matching inbox message before its `messageNew` is queued. The request waits up to 2 minutes, and the account's later messages wait behind it, so a slow AI endpoint delays every webhook for that account. Turning on `generateEmailSummary` also turns `notifyText` back on

## Queues

EmailEngine queues every event, whether or not webhooks are enabled; the webhook worker decides at delivery time whether there is anywhere to send it. Queued jobs live in Redis until they are processed and, depending on the [retention settings](#queue-retention), for some time after.

### Webhook Delivery {#webhook-configuration}

By default one worker processes the webhook queue one job at a time.

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS_WEBHOOKS` | `1` | Number of webhook worker threads |
| `EENGINE_NOTIFY_QC` | `1` | Jobs each worker processes concurrently |
| `EENGINE_WEBHOOK_TIMEOUT` | `30s` | How long a delivery may take before it counts as failed |

The number of webhook requests in flight at once is the product of the two:

```text
in-flight webhooks = EENGINE_WORKERS_WEBHOOKS x EENGINE_NOTIFY_QC
```

```bash
# Default: one delivery at a time
EENGINE_WORKERS_WEBHOOKS=1
EENGINE_NOTIFY_QC=1

# 8 concurrent deliveries
EENGINE_WORKERS_WEBHOOKS=4
EENGINE_NOTIFY_QC=2

# 32 concurrent deliveries
EENGINE_WORKERS_WEBHOOKS=8
EENGINE_NOTIFY_QC=4
```

Events can reach your endpoint out of order with any configuration: a failed delivery is retried with exponential backoff (up to 10 attempts) while later events go ahead, and raising either value adds concurrent deliveries on top. Make sure the handler copes with a `messageUpdated` arriving before the `messageNew` for the same message. [Queue management](/docs/advanced/queue-management) covers the retry schedule.

#### Webhook Handler Best Practices

Keep the handler tiny: write the payload to a queue of your own (Kafka, SQS, Postgres, a job table) in a few milliseconds and return `2xx`, leaving the heavy lifting to downstream workers. That keeps EmailEngine's Redis usage predictable, because a slow endpoint shows up as a growing `notify` queue in Redis memory.

```javascript
// Endpoint: accept, hand off, return. Nothing slow on this path
app.post('/webhooks', express.json(), async (req, res) => {
  await queue.add('webhook', req.body); // your own queue, not EmailEngine's
  res.sendStatus(200);
});

// Worker: a separate process, scaled independently of the endpoint
worker.process('webhook', async job => {
  await heavyProcessing(job.data);
});
```

Enqueue before responding rather than after. Returning `200` first and then queueing means a crash between the two silently drops the event, and EmailEngine has already been told the delivery succeeded.

### Email Sending {#email-sending-configuration}

Queued messages live in Redis, so RAM usage scales with the size and number of messages waiting. Submissions are handled by a worker pool:

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS_SUBMIT` | `1` | Number of submission worker threads |
| `EENGINE_SUBMIT_QC` | `1` | Messages each worker sends concurrently |
| `EENGINE_SUBMIT_DELAY` | unset | Minimum time between two sends across the whole instance. When set, it caps throughput whatever the two settings above allow |

```text
concurrent sends = EENGINE_WORKERS_SUBMIT x EENGINE_SUBMIT_QC
```

```bash
# Default: one message at a time
EENGINE_WORKERS_SUBMIT=1
EENGINE_SUBMIT_QC=1

# 4 concurrent sends
EENGINE_WORKERS_SUBMIT=2
EENGINE_SUBMIT_QC=2

# 16 concurrent sends
EENGINE_WORKERS_SUBMIT=4
EENGINE_SUBMIT_QC=4
```

Be conservative with `EENGINE_SUBMIT_QC`. Each active submission loads the full RFC 822 message into memory: the submit worker reads it from Redis and hands it to the account's worker thread, which performs the SMTP transaction. 16 concurrent 10 MB messages hold at least 160 MB in the submit worker and as much again across the account threads. See [Outbox queue](/docs/sending/outbox-queue).

### Export {#export-configuration}

Bulk exports run on their own worker threads:

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS_EXPORT` | `1` | Number of export worker threads. Also `--workers.export` on the command line or `export` under `[workers]` in the configuration file. The environment variable is read since v2.82.1; before that only the flag and the configuration file worked |
| `EENGINE_EXPORT_QC` | `1` | Export jobs each worker runs concurrently |

```text
concurrent exports = EENGINE_WORKERS_EXPORT x EENGINE_EXPORT_QC
```

The runtime setting `exportMaxGlobalConcurrent` (default `8`) caps the number of exports running at once across the whole instance, whatever the worker configuration allows.

```bash
# Default: one export at a time
EENGINE_WORKERS_EXPORT=1
EENGINE_EXPORT_QC=1

# 4 concurrent exports
EENGINE_WORKERS_EXPORT=2
EENGINE_EXPORT_QC=2
```

Each export batch holds message data in memory while it is written, so raise the concurrency together with the worker's memory. See [Exporting messages](/docs/receiving/exporting).

### Queue Retention

Finished jobs can stay in Redis after they are processed, and on a large instance their payloads add up:

| Setting | Default | What is kept |
|---------|---------|--------------|
| `queueKeep` | `0` (from `EENGINE_QUEUE_REMOVE_AFTER`) | Completed jobs per queue, for up to 24 hours |
| `EENGINE_QUEUE_KEEP_FAILED` | `500` | Failed jobs per queue, at least |
| `EENGINE_QUEUE_KEEP_FAILED_AGE` | 7 days | How long failed jobs are kept |
| `EENGINE_QUEUE_KEEP_FAILED_CONTENT` / `_SIZE` | 100 messages / 100 MB | Raw content of failed outgoing messages, so they can be retried |

Failed jobs are the ones to budget for. While a webhook endpoint is down, every event fails after its retries, and 500 failed `messageNew` jobs each carrying 2 MB of text hold about 1 GB of Redis memory. Size `EENGINE_QUEUE_KEEP_FAILED` against [`notifyTextSize`](#reducing-per-message-work) and the Redis memory you have. See [Queue management](/docs/advanced/queue-management).

## API Workers

The API worker runs the REST API and the admin UI. One worker is enough for most deployments; a very high HTTP request volume can be spread across several.

| Setting | Default | Description |
|---------|---------|-------------|
| `EENGINE_WORKERS_API` | `1` | Number of API/HTTP worker threads. Accepts `cpus` like `EENGINE_WORKERS` |
| `EENGINE_TIMEOUT` | `10000` | Milliseconds an API request waits for the account's worker thread before failing with HTTP 504 |

**Platform support:** more than one API worker requires `SO_REUSEPORT` so the workers can share the listen port. That needs **Linux with Node.js 23.1 or newer**. Elsewhere EmailEngine starts a single API worker, logs why, and shows the reason on the **Workers** page (`/admin/internals`). Added in v2.69.0.

```bash
# Spread the REST API across 4 workers (Linux, Node.js 23.1+)
EENGINE_WORKERS_API=4
```

More API workers do not help with requests that touch a mailbox: those wait on the account's thread, which is where to look when they time out.

## Memory

### Node.js Heap

EmailEngine runs as one process with several threads: the main thread plus the API, account, webhook, submission, export, SMTP server and IMAP proxy workers. Each thread has its own V8 heap. Two V8 options size those heaps, and both apply to every thread separately. Neither one limits the memory of the process as a whole.

| Option | Default | Description |
|--------|---------|-------------|
| `--max-old-space-size` | Chosen by V8 from the machine's memory, about 4 GB on a 64-bit host with 16 GB or more. The prebuilt binaries are built with `4096` | Upper limit, in megabytes, of each thread's long-lived heap |
| `--max-semi-space-size` | `16` in the Docker image and the prebuilt binaries since v2.85.0. Without it, Node.js 24 allows up to `64` | Size, in megabytes, of each of the two halves of a thread's young generation, where new objects are allocated |

#### Memory is bounded by the container, not by these options

The limits multiply by the thread count. With `--max-old-space-size=2048` and ten threads, the process can still grow past 20 GB, so these options are not a memory budget. The ceiling for the process is the container memory limit, the systemd `MemoryMax` (see [Restart on memory threshold](/docs/deployment/systemd#restart-on-memory-threshold)), or the host's RAM. Leave room in it for Redis if it runs on the same host.

A worker thread that reaches its `--max-old-space-size` limit terminates with `ERR_WORKER_OUT_OF_MEMORY`, EmailEngine logs `Worker thread error` and starts a replacement. The main thread reaching its limit ends the process. Raise the option only after a log shows a thread hitting it; lowering it below the default does not reduce memory use, it makes that failure arrive sooner.

#### The young generation

Node.js 24 lets each thread's young generation grow to 128 MB, against 32 MB on Node.js 22. Startup allocates heavily in every thread, so each one grows to that size and gives the memory back only after it has been idle for a minute or two. An empty instance on Node.js 24 needed about half as much memory again at startup as the same instance on Node.js 22. Since v2.85.0 the Docker image and the prebuilt binaries set `--max-semi-space-size=16`, which restores the Node.js 22 sizing.

A larger young generation means fewer garbage collections under a heavy allocation rate, so an instance serving a high API or webhook volume on a host with spare memory can raise it, for example to `32`. Lower values trade memory for more frequent collections.

#### Setting the options

**npm, source and systemd installs** take them from `NODE_OPTIONS`, which reaches every thread:

```bash
NODE_OPTIONS="--max-semi-space-size=16" emailengine
```

```ini
[Service]
Environment="NODE_OPTIONS=--max-semi-space-size=16"
```

These installs run on whichever Node.js version is installed, and do not set `--max-semi-space-size` unless it is given here.

**Docker** sets `NODE_OPTIONS=--max-semi-space-size=16` in the image. A `NODE_OPTIONS` passed to the container replaces that value rather than adding to it, so include the flag to keep it:

```bash
docker run -d \
  --name emailengine \
  -p 3000:3000 \
  -e EENGINE_REDIS="redis://redis-host:6379/8" \
  -e NODE_OPTIONS="--max-semi-space-size=16 --max-old-space-size=6144" \
  postalsys/emailengine:v2
```

**Prebuilt binaries** carry the options from the build (`--max-old-space-size=4096`, and `--max-semi-space-size=16` since v2.85.0) and ignore `NODE_OPTIONS`, so they cannot be changed on these installs.

To see the limit a thread gets, run Node.js with the same options. The value includes the young generation:

```bash
node -e "console.log(v8.getHeapStatistics().heap_size_limit / 1048576)"
```

The **Workers** page (`/admin/internals`) shows the heap of each thread, which is where to see which one is growing.

### Native Memory: IMAP Compression

EmailEngine negotiates `COMPRESS=DEFLATE` with every IMAP server that offers it, Gmail and Dovecot among them. Each compressed connection keeps zlib state of about 300 KB outside the V8 heap, which the heap options above do not cover and the per-thread heap figures do not show. With 10,000 compressed connections that is about 3 GB of process memory, plus the CPU spent compressing.

`EENGINE_DISABLE_COMPRESSION=true` turns compression off for every IMAP connection. That trades this memory and CPU for more network traffic, mostly during the initial sync of large mailboxes; on a host short of memory with a fast network path to the mail servers, it is usually the better side of the trade.

### Redis

Redis is EmailEngine's only data store, and its latency is added to nearly every operation. [Redis](/docs/configuration/redis) covers sizing, persistence and compatible servers in full; the points that decide performance are:

1. **Keep Redis close.** Same host or same LAN. Cross-region Redis puts tens of milliseconds on every mailbox operation and is not a workable setup
2. **Budget 1-2 MiB per account** and provision twice that, so snapshots and growth have room. Queued and retained jobs come on top; see [Queue retention](#queue-retention)
3. **Never use an `allkeys-*` eviction policy.** EmailEngine needs everything it stores. `noeviction` is the setting to use; `GET /v1/stats` reports a warning when it is not
4. **Leave `tcp-keepalive` at its default.** Setting it to `0` leads to half-open connections after network hiccups
5. **Watch `redis_evicted_keys_total` and `redis_memory_used_bytes`** in the [metrics](/docs/advanced/monitoring#redis-metrics); evictions mean data loss

## Logging

The default log level is `trace`, which logs every IMAP command and response of every account. On a large instance that is a measurable share of the CPU and a large volume of output, so production instances usually run at `info`:

```bash
EENGINE_LOG_LEVEL=info
```

Per-account logs are a separate cost. With the `logs` setting's `all` option on, or logging enabled for an account, every IMAP log line of those accounts is also written to Redis, up to `maxLogLines` (default 10,000) per account. Enable it for the accounts being debugged rather than for all of them. [Logging](/docs/advanced/logging) covers both.

## Complete Configuration Example

A configuration for a medium deployment of around 500 accounts:

```bash
# Listener
EENGINE_HOST=0.0.0.0
EENGINE_PORT=3000

# Redis
EENGINE_REDIS=redis://redis.internal:6379

# Account workers: 8 threads, about 60 accounts each, paced startup
EENGINE_WORKERS=8
EENGINE_CONNECTION_SETUP_DELAY=3s

# Webhooks: 4 workers x 2 = 8 concurrent deliveries
EENGINE_WORKERS_WEBHOOKS=4
EENGINE_NOTIFY_QC=2

# Sending: 2 workers x 2 = 4 concurrent sends
EENGINE_WORKERS_SUBMIT=2
EENGINE_SUBMIT_QC=2

# Credential encryption
EENGINE_SECRET=your-encryption-secret-here

# Logging: trace (the default) logs every IMAP command
EENGINE_LOG_LEVEL=info
```

The per-message settings are runtime settings rather than environment variables. If the application reads message content through the API rather than from the webhook, a short text preview in the webhook is enough:

```bash
curl -X POST https://emailengine.example.com/v1/settings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifyText": true, "notifyTextSize": 65536}'
```

## Scaling EmailEngine

:::warning No Horizontal Scaling
EmailEngine does not support horizontal scaling. Two instances pointed at the same Redis database each try to sync every account, and the result is duplicate connections, duplicate webhooks and conflicting state.

In Kubernetes or any other orchestrator, run exactly one replica and do not attach a Horizontal Pod Autoscaler or an auto-scaling group. For more capacity, scale vertically or shard manually as described below.
:::

### Vertical Scaling (Recommended)

Give the single instance more resources:

- More CPU cores, and raise `EENGINE_WORKERS` to match
- More RAM, for more concurrent accounts and larger queues
- A faster network path to Redis and to the mail servers

```bash
EENGINE_WORKERS=16
EENGINE_WORKERS_WEBHOOKS=8
EENGINE_NOTIFY_QC=4
EENGINE_WORKERS_SUBMIT=4
EENGINE_SUBMIT_QC=2
```

One instance configured this way handles several thousand accounts.

### Manual Sharding (Advanced Workaround)

Beyond what one instance can carry, split the accounts across fully independent EmailEngine deployments:

:::danger Manual Sharding Requirements
- Each instance has its own Redis database
- Each instance manages a disjoint set of accounts
- Your application routes every API request to the instance that owns the account
- There is no failover or coordination between instances
:::

```bash
# Instance A
EENGINE_REDIS=redis://redis-a:6379
EENGINE_PORT=3000
EENGINE_SETTINGS='{"serviceUrl":"https://ee-a.example.com"}'

# Instance B
EENGINE_REDIS=redis://redis-b:6379
EENGINE_PORT=3001
EENGINE_SETTINGS='{"serviceUrl":"https://ee-b.example.com"}'
```

`serviceUrl` must be unique per instance, because it is the base of the default OAuth2 callback URL and of tracking links. `EENGINE_REDIS_PREFIX` is only needed if two instances have to share one Redis database; with separate databases it can stay unset.

**OAuth2 for sharded deployments:** the same OAuth2 application in Google Cloud Console or Microsoft Entra can serve every instance. Register each instance's callback URL on the application:

```text
https://ee-a.example.com/oauth
https://ee-b.example.com/oauth
```

Your application must keep the account-to-shard mapping, route every request accordingly, and handle an instance outage itself. This is considerably more to operate than one larger instance; scale vertically first.

## Monitoring and Metrics

The figures to watch while tuning, all available from the [Prometheus endpoint](/docs/advanced/monitoring#prometheus-metrics):

- **Accounts by state** - `imap_connections{status}`, to see how long warm-up takes and whether accounts drop. Accounts not yet assigned to a thread are counted as `disconnected`
- **Queue depth** - `queue_size{queue, state}`. Filter on `state="waiting"` for jobs not started yet, or sum over `state`. `queue="notify"` sizes the webhook workers, `queue="submit"` the submit workers
- **Webhook request time** - `webhook_req`, a histogram in milliseconds
- **Thread health** - `unresponsive_workers`, and `thread_starts` rising without a restart of the instance, which means threads are being replaced
- **Redis memory, latency and evictions** - `redis_memory_used_bytes`, `redis_latency`, `redis_evicted_keys_total`

The default Node.js metrics (`nodejs_heap_size_used_bytes`, `nodejs_eventloop_lag_seconds` and the rest) describe the main thread only. The **Workers** page (`/admin/internals`) shows the heap in use per thread.

`GET /health` answers without authentication once every account worker is up and Redis answers a write and read; it does not look at account states. `GET /v1/stats` returns the account state counts and queue depths as JSON. Both are described on [Monitoring](/docs/advanced/monitoring#health-check-endpoints).

## Performance Troubleshooting

### High CPU Usage

**Possible causes:**
1. **Memory exhaustion.** The most common cause of a constant 100% CPU load is running out of RAM: once free memory is gone, the host spends its time swapping. Check `free -h` or `docker stats` before anything else
2. The `trace` log level
3. Too many accounts per worker thread
4. Accounts reconnecting in a loop
5. Heavy API request load

**Solutions:**
- Add RAM, or reduce the account count on this instance
- Set `EENGINE_LOG_LEVEL=info`
- Raise `EENGINE_WORKERS`
- Add `EENGINE_CONNECTION_SETUP_DELAY` so restarts do not connect everything at once
- Find looping accounts with `imap_connections{status="connecting"}` and the per-account log

### High Memory Usage

**Possible causes:**
1. Redis memory growth from a queue that is not draining, or from retained failed jobs
2. Large webhook payloads: text, headers or attachments in every `messageNew`
3. A large submission queue holding message bodies
4. Too many concurrent submissions or exports
5. Many compressed IMAP connections
6. Startup allocation in every thread's young generation

**Solutions:**
- Fix or speed up the webhook endpoint so the `notify` queue drains
- Lower `notifyTextSize`, or set `notifyAttachmentSize` when attachments are included
- Lower `EENGINE_QUEUE_KEEP_FAILED`
- Lower `EENGINE_SUBMIT_QC` and `EENGINE_EXPORT_QC`
- Set `EENGINE_DISABLE_COMPRESSION=true`
- For memory that is high right after startup and falls back after a few minutes, cap the young generation of each thread; see [The young generation](#the-young-generation)
- Give Redis more memory

### Accounts Keep Reconnecting

**Possible causes:**
1. An account thread is terminated for missing heartbeats (`Worker critically unresponsive, restarting` in the log), and all its accounts reconnect
2. A thread runs out of heap (`Worker thread error` with `ERR_WORKER_OUT_OF_MEMORY`)
3. Individual accounts failing to connect or authenticate

**Solutions:**
- Raise `EENGINE_WORKERS` so each thread has fewer accounts
- Shorten or remove slow [webhook route](#webhook-routes-and-ai-processing) functions
- Check the per-thread heap on the **Workers** page and see [Node.js heap](#nodejs-heap)
- For individual accounts, look at the account's [per-account log](/docs/advanced/logging#per-account-logs)

### Slow Webhook Processing

**Possible causes:**
1. The webhook endpoint is slow
2. Not enough webhook workers for the event rate
3. Per-message work or route functions delaying events before they are queued
4. Network problems between EmailEngine and the endpoint

**Solutions:**
- Make the handler enqueue and return, as shown above
- Raise `EENGINE_WORKERS_WEBHOOKS` and `EENGINE_NOTIFY_QC`
- Review the [per-message settings](#reducing-per-message-work) and AI processing
- Check `webhook_req` for where the time goes

### API Request Timeouts

**Possible causes:**
1. The account is not connected yet (HTTP 503, see [Connection setup delay](#connection-setup-delay))
2. The account's thread is busy with other accounts (HTTP 504 after `EENGINE_TIMEOUT`)
3. Redis latency
4. A slow IMAP server

**Solutions:**
- Check the account state before issuing mailbox requests after a restart
- Raise `EENGINE_WORKERS`
- Move Redis closer
- Look at the account's [per-account log](/docs/advanced/logging#per-account-logs) for slow IMAP commands

## See Also

- [Monitoring](/docs/advanced/monitoring) - Measuring before and after a change
- [Redis](/docs/configuration/redis) - Memory, persistence, and capacity planning
- [Queue management](/docs/advanced/queue-management) - Retries, retention and concurrency for the queues
- [Settings reference](/docs/configuration/settings) - The runtime settings named on this page
- [IMAP indexers](/docs/accounts/imap-indexers) - The cheapest lever on a large account count
- [Logging](/docs/advanced/logging) - Log levels and per-account logs
- [Environment variables](/docs/configuration/environment-variables#worker-threads) - Where the worker counts are set
