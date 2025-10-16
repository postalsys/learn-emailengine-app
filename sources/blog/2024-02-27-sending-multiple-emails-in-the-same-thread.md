---
title: Sending multiple emails in the same thread with EmailEngine
slug: sending-multiple-emails-in-the-same-thread
date_published: 2024-02-27T10:04:00.000Z
date_updated: 2025-05-14T11:30:46.000Z
tags: EmailEngine, SMTP
excerpt: Keep your follow‑up emails in the same conversation by generating your own Message‑ID values and building the References header.
---

> **TL;DR**
> Call `**POST /v1/account/:id/submit**` with your own `messageId` and a growing `references` header to force every follow‑up into the same email thread.

## Why it matters

Email clients rely on the RFC 5322 `Message‑ID` and `References` headers to decide which messages belong together. If you let EmailEngine autogenerate those values, your perfectly timed sequence may scatter across the inbox. By controlling them yourself, every follow‑up lands exactly where the user expects.

## Step‑by‑step

### 1. **Send the initial message**

    $ curl -XPOST "http://127.0.0.1:3000/v1/account/demo/submit" \
      -H "Authorization: Bearer $EE_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "from": { "address": "sender@example.com" },
        "to":   { "address": "recipient@example.com" },
        "subject": "Test message thread",
        "html": "<p>First message in thread!</p>",
        "messageId": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>"
      }'

_Save the `messageId` value - you’ll need it for every reply._

### 2. **Add the first follow‑up**

    $ curl -XPOST "http://127.0.0.1:3000/v1/account/demo/submit" \
      -H "Authorization: Bearer $EE_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "from": { "address": "sender@example.com" },
        "to":   { "address": "recipient@example.com" },
        "subject": "Test message thread",
        "html": "<p>Second message in thread!</p>",
        "messageId": "<77a7c383-cc1a-44c6-9866-96b2873e3322@example.com>",
        "headers": {
          "references": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>"
        }
      }'

### 3. **Keep extending `references`**

Each subsequent call appends the current message’s ID:

    "headers": {
      "references": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com> <77a7c383-cc1a-44c6-9866-96b2873e3322@example.com>"
    }

## Common pitfalls

> ⚠️ **Missing angle brackets** – Wrap every ID in `< >` or some clients ignore the header.

> 💡 **Subject drift** – Changing the subject (beyond adding _Re:_) breaks the thread despite perfect headers.

> 🚧 **Gmail limit** – Gmail reads only the last 20 `References` entries. If your sequence is longer, drop the oldest IDs.

> 🗄️ **ID storage** – Persist every generated `messageId` so you can rebuild the `references` header later; EmailEngine doesn’t store that list for you.
