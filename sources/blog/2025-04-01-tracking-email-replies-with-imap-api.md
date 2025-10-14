---
title: Tracking email replies
slug: tracking-email-replies-with-imap-api
date_published: 2025-04-01T11:40:00.000Z
date_updated: 2025-05-13T17:20:15.000Z
tags: IMAP, IMAP API, EmailEngine
excerpt: Reply tracking is useful when building integrations with users’ email accounts. Let’s say our service sends out emails as if these were sent by the user, eg. automated sales emails, and now the recipient replies to such message.
---

Integrating reply tracking into your application can turn an incoming response into a meaningful event—for example, converting a cold lead into a hot opportunity the moment they reply. In this guide, we'll walk through how to:

1. Send outbound messages with a reusable `Message-ID` for tracking.
2. Receive and inspect webhooks for new messages.
3. Detect replies by matching `In-Reply-To` headers.
4. Filter out bounces and auto-responses.

> **Prerequisites**A running EmailEngine instance (see the [Getting Started guide](__GHOST_URL__/)).A valid license key (free 14‑day trial enabled; purchase at [PostalSys](https://postalsys.com) for continued access).An account configured with an IMAP or a Gmail/MS Graph integration.

## 1. Sending messages with a tracked Message-ID

When sending outbound mail, include a unique `Message-ID` header. Store this ID in your database so that replies referencing it can be matched later. Suppress some automated replies by adding `X-Auto-Response-Suppress`.

    // send.js
    
    async function sendTrackedEmail(accountId, to, subject, html) {
      const messageId = `<${Date.now()}-${accountId}@yourdomain.com>`;
    
      const payload = {
        messageId,
        headers: {
          'X-Auto-Response-Suppress': 'OOF'
        },
        from: 'no-reply@yourdomain.com',
        to,
        subject,
        html
      };
    
      // Store messageId in your DB for future matching
      await saveMessageRecord({ accountId, messageId, to, subject });
    
      const res = await fetch(`https://your-emailengine.com/v1/account/${accountId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
    

> **Tip:** Always persist the exact `messageId` string (including angle brackets) in your database.

## 2. Handling inbound webhook notifications

EmailEngine emits a webhook on every new message. The payload differs slightly between generic IMAP servers and Gmail-based accounts.

- **Standard IMAP**: `path` contains the folder name (e.g., `INBOX`).
- **Gmail/GSuite**: `path` is only set for All Mail, Junk, Trash. Use the `labels` array to find special-use tags like `\\Inbox`, `\\Sent`.

Example notification for Gmail accounts:

    {
      "path": "[Google Mail]/All Mail",
      "specialUse": "\\All",
      "event": "messageNew",
      "data": {
        "id": "AAAAAQAAMqo",
        "inReplyTo": "<1234567890-yourdomain.com>",
        "labels": ["\\Inbox", "Leads"]
      }
    }
    

## 3. Detecting replies

1. **Check mailbox placement**: Ensure the message landed in the inbox:
- For IMAP: `path === 'INBOX'`.
- For Gmail: `data.labels.includes('\\Inbox')`.

2. **Match `In-Reply-To`**: Look for `data.inReplyTo` matching any stored `messageId`.

    function isReply(notification, storedMessageIds) {
      const inReplyTo = notification.data.inReplyTo;
      const inInbox = (
        notification.path === 'INBOX' ||
        (notification.data.labels || []).includes('\\Inbox')
      );
      return inInbox && storedMessageIds.includes(inReplyTo);
    }
    

## 4. Filtering out bounces and auto-responses

Even with OOF suppression, some automated messages still slip through. Fetch full headers for deeper inspection:

    async function fetchHeaders(accountId, messageId) {
      const res = await fetch(
        `https://your-emailengine.com/v1/account/${accountId}/message/${messageId}`
      );
      const msg = await res.json();
      return msg.headers; // object: lowercase header name → [values]
    }
    

Check these headers:

- **Return-Path**: If `return-path[0] === '<>'`, skip (bounce).
- **Auto-Submitted**: If present and not `'no'`, skip.
- **List-ID / List-Unsubscribe**: Likely a mailing-list reply; skip if you only care about one-to-one replies.

Also inspect the `Subject` for prefixes like `Out of Office:` or `Auto:`.

    function isAutomated(headers) {
      const auto = headers['auto-submitted']?.[0];
      const subj = headers.subject?.[0] || '';
      return (
        auto && auto.toLowerCase() !== 'no' ||
        /^\s*(auto:|out of office:)/i.test(subj) ||
        headers['list-id'] || headers['list-unsubscribe']
      );
    }
    

## 5. Finalizing reply detection

If a message passes all checks, classify it as a genuine reply. You can then:

- **Signal lead status**: Mark the user interaction as a hot lead.
- **Archive content**: Fetch full body and attachments via `/message/:id` for further processing.

    async function processNotification(accountId, notification) {
      const storedIds = await getStoredMessageIds(accountId);
      if (!isReply(notification, storedIds)) return;
    
      const headers = await fetchHeaders(accountId, notification.data.id);
      if (isAutomated(headers)) return;
    
      // Genuine reply!
      await markLeadAsReplied(notification.data.inReplyTo);
      // Optionally, fetch full content:
      const fullMsg = await fetch(
        `https://your-emailengine.com/v1/account/${accountId}/message/${notification.data.id}`
      ).then(r => r.json());
      // Process fullMsg.text, attachments, etc.
    }
    

And that’s it! With these steps, you’ll reliably detect replies and trigger workflows based on genuine user responses.
