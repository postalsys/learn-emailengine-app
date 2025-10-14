---
title: Mail merge with EmailEngine
slug: mail-merge-with-emailengine
date_published: 2025-01-19T05:30:00.000Z
date_updated: 2025-05-14T11:45:59.000Z
tags: EmailEngine, SMTP
excerpt: Use the mailMerge array in the message submission API call to generate per‑recipient copies of the same message, inject template variables, and keep each copy in the mailbox’s Sent Mail folder.
---

> **TL;DR**
> Drop `to`/`cc`/`bcc` from your payload, add a `mailMerge` array, and EmailEngine fan‑outs the request into distinct messages—each with its own *Message‑ID* you can track later.

## Why it matters

Bulk‑sending receipts, onboarding tips or weekly digests from **your customer’s** mailbox means better deliverability and brand consistency—but you don’t want 500 addresses exposed in the `To` header. EmailEngine turns one REST call into N fully‑formed messages, so every recipient feels like the only one.

## Step‑by‑step

### 1. Broadcast the same content

With mail merge you still hit `**/v1/account/:id/submit**` but replace the usual recipients array with `mailMerge`.

    $ curl -XPOST "https://ee.example.com/v1/account/example/submit" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{
        "subject": "Test message",
        "html": "<p>Each recipient will get the same message</p>",
        "mailMerge": [
          { "to": { "name": "Ada Lovelace", "address": "ada@example.com" } },
          { "to": { "name": "Grace Hopper", "address": "grace@example.com" } }
        ]
      }'
    

Response

    {
      "sendAt": "2025-05-14T09:12:23.123Z",
      "mailMerge": [
        {
          "success": true,
          "to": { "name": "Ada Lovelace", "address": "ada@example.com" },
          "messageId": "<91853631-2329-7f13-a4df-da377d873787@example.com>",
          "queueId": "182080c50b63e7e232a"
        },
        {
          "success": true,
          "to": { "name": "Grace Hopper", "address": "grace@example.com" },
          "messageId": "<8b47f91c-06f3-b555-ee19-2c99908aff25@example.com>",
          "queueId": "182080c50f283f49252"
        }
      ]
    }
    

Each recipient sees only their own address in *To*. Need to skip saving copies to *Sent Mail*? Add `"copy": false` to the payload.

### 2. Personalise with Handlebars

Handlebars lets you inject per‑recipient data:

    $ curl -XPOST "https://ee.example.com/v1/account/example/submit" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{
        "subject": "Test message for {{{params.nickname}}}",
        "html": "<p>This message is for {{params.nickname}}</p>",
        "mailMerge": [
          {
            "to": { "name": "Ada Lovelace", "address": "ada@example.com" },
            "params": { "nickname": "ada" }
          },
          {
            "to": { "name": "Grace Hopper", "address": "grace@example.com" },
            "params": { "nickname": "grace" }
          }
        ]
      }'
    

> ⚠️ **Heads‑up** – For plaintext fields (`subject`, `text`) use triple braces `{{{…}}}` so Handlebars doesn’t HTML‑escape characters.

You can also reference `{{account.email}}`, `{{account.name}}`, and `{{service.url}}` inside your templates.

### 3. Combine mail merge with [stored templates](https://emailengine.app/email-templates)

First store a [template](https://emailengine.app/email-templates) via `**/v1/templates**` or the web UI. Assume the ID is `AAABgggrm00AAAABZWtpcmk`.

    $ curl -XPOST "https://ee.example.com/v1/account/example/submit" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{
        "template": "AAABgggrm00AAAABZWtpcmk",
        "mailMerge": [
          {
            "to": { "name": "Ada Lovelace", "address": "ada@example.com" },
            "params": { "nickname": "ada" }
          },
          {
            "to": { "name": "Grace Hopper", "address": "grace@example.com" },
            "params": { "nickname": "grace" }
          }
        ]
      }'
    

EmailEngine swaps in the stored `subject`/`html`/`text` and still personalises via the `params` object.

## Common pitfalls

> 💡 **Template escaping** – Forgetting triple braces leads to subjects like `&lt;Welcome&gt;`.

> 💡 **Queue timeouts** – Each generated message gets its own queue entry; if your merge size is huge, watch **`/v1/queue`** for items that exceed EmailEngine’s 10 s processing window.

> 💡 **Unwanted sent copies** – Remember to set `"copy": false` if the mailbox shouldn’t store thousands of merge messages.
