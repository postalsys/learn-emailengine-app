---
title: Gmail API support in EmailEngine
slug: gmail-api-support-in-emailengine
date_published: 2024-07-08T12:16:04.000Z
date_updated: 2025-05-19T10:55:33.000Z
excerpt: EmailEngine lets you register Gmail accounts that talk to the Gmail API instead of IMAP/SMTP—faster sync and cleaner label handling out of the box.
---

> **TL;DR**
> Starting with v2.43.0, EmailEngine can operate a Gmail mailbox through the Gmail API. No IMAP sockets, no SMTP hand‑off—just direct, OAuth‑secured REST calls backed by Google Cloud Pub/Sub webhooks.

Since day one, EmailEngine has relied on **IMAP** for reading and **SMTP** for sending. That choice covers most mailboxes, and both Gmail and Outlook continue to expose IMAP/SMTP endpoints that you can lock down with OAuth 2.0. For many teams that setup feels “good enough,” but Gmail’s architecture has always been an awkward fit for a forty‑year‑old protocol.

IMAP, for example, models mailboxes as hierarchical folders, yet Gmail treats every message as an object that can wear multiple labels at the same time. Bridging those two worlds means every move or rename has to be translated, and that translation layer leaks into corner cases. On top of that, the **IDLE** command—IMAP’s closest thing to push—drops the connection after a few minutes, forcing EmailEngine to reconnect and burn extra CPU just to stay in sync. Finally, pulling large messages over IMAP requires several sequential fetches, while the Gmail API can grab the entire payload in a single batch request. Put together, these gaps translate into higher latency, more sockets, and wasted resources inside your containers.

To smooth out those rough edges, EmailEngine 2.43.0 introduces a **Gmail API backend**. When you add an account in this mode, EmailEngine abandons IMAP and SMTP entirely for that mailbox. Every internal operation—synchronizing folders, sending messages, updating flags—travels straight through Google’s REST interface and is fanned out in real time through Cloud Pub/Sub webhooks.

### When to stick with IMAP

There are still scenarios where classic IMAP/SMTP is the safer choice. If your organization cannot grant Cloud Pub/Sub permissions—perhaps due to strict GCP policies—or if you rely on features that the Gmail API has not yet exposed, such as raw SMTP *send‑as* with a forged envelope‑from, then staying on IMAP remains entirely viable. EmailEngine’s original backend is not going anywhere and continues to receive the same bug fixes and performance tweaks.
