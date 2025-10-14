---
title: Redis Requirements for EmailEngine
sidebar_position: 2
---

> **TL;DR**  
> Deploy Redis in the same data centre as EmailEngine, allocate sufficient memory and durable storage, and set the memory‑policy to **noeviction**. Otherwise queued webhooks and mailbox indexes are at risk.
### Why Redis is required
EmailEngine stores mailbox indexes, OAuth credentials, job queues and webhook events in Redis. Performance and data consistency therefore depend directly on the health and configuration of Redis. Treat Redis as a primary operational database, not as a transient cache.
### Prerequisites
-   **Redis 6.0 or newer** in **stand‑alone** mode.  
**Redis Cluster is not supported.**
-   Start EmailEngine with an explicit Redis connection string:
```bash
$ emailengine --dbs.redis="redis://127.0.0.1:6379"
```
-   Enable either RDB snapshots **or** AOF persistence on reliable SSD or NVMe storage.
### Minimising network latency
Maintain a TCP round‑trip time (RTT) below **5 ms**, preferably below **1 ms**.
-   Deploy Redis and EmailEngine in the same **availability zone** or **local network segment**.
-   Avoid Internet‑facing or cross‑region endpoints.
-   Measure RTT with:
```bash
$ redis-cli --latency --raw -h <redis-host>
```
### Memory sizing guidelines
#### Baseline calculation
Allocate **1–2 MiB of RAM per mailbox**. The dominant factor is the count of message UIDs, not the aggregate mailbox size.
#### Provisioning rule
Provision at least **2×** the calculated baseline and ensure normal utilisation remains below **80 %**. The additional capacity accommodates:
1.  Copy‑on‑write memory during RDB snapshots.
2.  Short‑lived workload spikes (for example, large webhook bursts).
### Persistence strategy
#### RDB snapshots (recommended default)
RDB writes a complete memory image to disk on a schedule. A typical production configuration is:
```ini
save 900 1   # after 1 change in 15 min
save 300 10  # after 10 changes in 5 min
```
#### Append‑Only File (AOF)
Enable AOF only when the underlying storage can sustain at least **10 000 IOPS**. Verify the current setting with:
```bash
$ redis-cli CONFIG GET appendonly
```
#### Backups
Back up **dump.rdb** (or **appendonly.aof**) regularly—daily or more frequently, depending on your recovery objectives.
### TCP keep‑alive
Configure Redis with the default **300 s** keep‑alive to maintain the long‑lived connections that EmailEngine establishes over Pub/Sub:
```ini
tcp-keepalive 300
```
Disabling keep‑alives can lead to silent connection drops on NAT devices or load balancers.
### Key‑eviction policy
EmailEngine requires that keys remain resident in memory. Set:
```ini
maxmemory-policy noeviction
```
If strict memory limits are unavoidable, choose a `volatile-*` policy so that only keys with a TTL are subject to eviction. **Do not** use `allkeys-*`, because evicting mailbox indexes forces a complete resynchronisation.
### Compatibility of managed or alternative engines
Engine
Status
Notes
**Upstash Redis**
Supported with constraints
1 MB command size limit affects large MIME blobs; free tier quotas are insufficient; must be located in the same cloud region.
**Amazon ElastiCache**
Partially supported
Operates in stand‑alone mode, but data may be lost on node replacement unless Multi‑AZ persistence is enabled.
**Memurai**
Experimental
Passes basic tests on Windows; no long‑term performance data.
**Dragonfly**
Experimental
Requires `--default_lua_flags=allow-undeclared-keys`; validate against production workloads.
**KeyDB**
Experimental
Multi‑threaded fork of Redis; monitor replication lag and memory stability.
> **Unsupported** – Redis Cluster is incompatible with EmailEngine’s Lua scripts that reference dynamic keys. For high availability, use Redis Sentinel or a single‑primary replication setup.