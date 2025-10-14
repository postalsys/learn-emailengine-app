---
title: Sending Replies and Forwarding Emails with EmailEngine
slug: sending-reply-and-forward-emails
date_published: 2025-02-07T13:05:00.000Z
date_updated: 2025-05-14T11:20:46.000Z
tags: EmailEngine, SMTP
excerpt: Learn how to use EmailEngine’s reply and forward modes to respond to—or relay—any message in your customer’s mailbox with just one API call.
---

> **TL;DR**
> Add a `reference` object to your `**/v1/account/:id/submit**` payload, set `action` to `"reply"` , `"replyAll"` or `"forward"`, and EmailEngine fills in every header so the message threads exactly like in a desktop email client.

## Why it matters

Writing a raw RFC 822 email that threads correctly is deceptively hard—`In‑Reply‑To`, `References`, prefixes like **Re:**/**Fwd:**, attachment handling, the IMAP `\Answered` flag… and that’s *before* you juggle every provider’s SMTP quirks. EmailEngine eliminates that boilerplate so you can reply or forward with one POST request.

## Step‑by‑step

### 1. Choose the message

You’ll need the opaque `message` identifier (`AAAADQAABl0` in the examples). Fetch it via the messages list or use the value included in any webhook EmailEngine sends when syncing mail.

### 2. Build the **reply** payload

    $ curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
      -H "Authorization: Bearer <token>" \
      -H "Content-Type: application/json" \
      -d '{
        "reference": {
          "message": "AAAADQAABl0",
          "action": "reply",
          "inline": true
        },
        "html": "<p>Hello from myself!</p>"
    }'
    

**Response**

    {
      "response": "Queued for delivery",
      "messageId": "<[email protected]>",
      "queueId": "24279fb3e0dff64e",
      "sendAt": "2025-05-14T10:02:27.135Z"
    }
    

> ✅ EmailEngine auto‑sets **`from`**, **`to`**, **`subject`**, **`In‑Reply‑To`**, `**References**`, and marks the original message with the IMAP `\Answered` flag.

### 3. Build the **forward** payload

    $ curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
      -H "Authorization: Bearer <token>" \
      -H "Content-Type: application/json" \
      -d '{
        "reference": {
          "message": "AAAADQAABl0",
          "action": "forward",
          "inline": true,
          "forwardAttachments": true
        },
        "to": {
          "name": "Andris Reinman",
          "address": "andris@ethereal.email"
        },
        "html": "<p>FYI — see below</p>"
    }'
    

> ✅ EmailEngine adds **Fwd:** to the subject, prepends the original message with a header block, copies attachments when `forwardAttachments` is `true`, and still marks the source message as `\Answered`.

## Common pitfalls

> ⚠️ **Missing `to` on forward** – Unlike replies, forwards require you to set the `to` field. Omit it and EmailEngine returns **400 Bad Request**.
> 
> 💡 **Huge attachments** – EmailEngine streams attachments from IMAP to SMTP. If the total size breaches the mailbox’s send limit, the SMTP server will bounce the message. Use `forwardAttachments:false` or filter the attachments you copy.
> 
> ⏳ **Timeouts on slow SMTP hosts** – Some PaaS providers kill idle sockets. Increase `smtpTimeout`, scale your dynos, or move EmailEngine off the constrained host.
