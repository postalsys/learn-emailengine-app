---
title: Sending Email with the EmailEngine API
slug: sending-an-email-from-emailengine
date_published: 2025-01-08T21:21:00.000Z
date_updated: 2025-05-14T11:13:06.000Z
tags: EmailEngine, SMTP
excerpt: Learn how to register an account in EmailEngine, queue a message for delivery, and verify it reached your MTA—all with two curl commands.
---

> **TL;DR**
> Register the mailbox with `**/v1/account**`, wait until it’s `connected`, then POST your message payload to **`/v1/account/:id/submit`**. EmailEngine queues the message, handles retries, and notifies you via webhooks.

## Why it matters

When your SaaS needs to send email on behalf of a customer, direct SMTP is brittle: every provider has its own auth, rate limits, retries, and error codes. **EmailEngine** shields you from that complexity by exposing a single REST endpoint that proxies the customer’s mailbox. You get consistent JSON responses and robust retry logic.

## Step‑by‑step

### 1. Register the account

**Endpoint:****`POST /v1/account`**

    $ curl -XPOST "http://127.0.0.1:3000/v1/account" \
      -H "Authorization: Bearer <your‑token>" \
      -H "Content-Type: application/json" \
      -d '{
        "account": "example",
        "name": "Andris Reinman",
        "email": "andris@example.com",
        "imap": {
          "auth": { "user": "andris", "pass": "secretpass" },
          "host": "mail.example.com",
          "port": 993,
          "secure": true
        },
        "smtp": {
          "auth": { "user": "andris", "pass": "secretpass" },
          "host": "mail.example.com",
          "port": 465,
          "secure": true
        }
      }'
    

Expected response:

    { "account": "example", "state": "new" }
    

> ⚠️ **Heads‑up** – If you use an SMTP port other than 465, set `"secure": false`.

### 2. Submit the message

**Endpoint:****`POST /v1/account/:id/submit`**
Full docs: [Message submission](https://api.emailengine.app/#operation/postV1AccountAccountSubmit)

    $ curl -XPOST "http://127.0.0.1:3000/v1/account/example/submit" \
      -H "Authorization: Bearer <your‑token>" \
      -H "Content-Type: application/json" \
      -d '{
        "to": [{ "name": "Ethereal", "address": "andris@ethereal.email" }],
        "subject": "Test message",
        "text": "Hello from myself!",
        "html": "<p>Hello from myself!</p>"
      }'
    

Expected response (queued, not yet delivered):

    {
      "response": "Queued for delivery",
      "messageId": "<99f7f0ec-90a1-caaf-698b-18e096c7679e@example.com>",
      "sendAt": "2025-05-14T10:22:31.312Z",
      "queueId": "4646ac53857fd2b2"
    }
    

> 💡 **Tip** – Submission is rejected while EmailEngine is still performing the initial sync. Poll `**/v1/account/:id**` until `state` becomes `"connected"`.

### 3. Listen for webhooks

EmailEngine pushes delivery status updates to the webhook URL you configured under **Settings → Webhooks**.

#### messageSent

Delivered to the outbound MTA.

    {
      "account": "example",
      "date": "2025-05-14T10:32:39.499Z",
      "event": "messageSent",
      "data": {
        "messageId": "<a00576bd-f757-10c7-26b8-885d7bbd9e83@example.com>",
        "response": "250 2.0.0 Ok: queued as 5755482356",
        "envelope": {
          "from": "andris@example.com",
          "to": [ "andris@ethereal.email" ]
        }
      }
    }
    

#### messageDeliveryError

Emitted **after every failed delivery attempt**. EmailEngine retries automatically until delivery succeeds or the maximum number of attempts is reached. You’ll receive one `messageDeliveryError` webhook per attempt.

    {
      "serviceUrl": "http://127.0.0.1:3000",
      "account": "example",
      "date": "2025-05-14T15:07:35.832Z",
      "event": "messageDeliveryError",
      "data": {
        "queueId": "1833c8a88a86109a1bf",
        "envelope": {
          "from": "andris@example.com",
          "to": [ "andris@ethereal.email" ]
        },
        "messageId": "<29e26263-7125-ff56-4f80-83a5cf737d5e@ekiri.ee>",
        "error": "400 Message Not Accepted",
        "errorCode": "EPROTOCOL",
        "smtpResponseCode": 400,
        "job": {
          "attemptsMade": 1,
          "attempts": 10,
          "nextAttempt": "2025-05-14T15:07:45.465Z"
        }
      }
    }
    

#### messageFailed

Raised once EmailEngine gives up retrying.

    {
      "account": "example",
      "date": "2025-05-14T11:58:50.181Z",
      "event": "messageFailed",
      "data": {
        "messageId": "<97ac5d9a-93c7-104b-8d26-6b25f8d644ec@example.com>",
        "queueId": "610c2c93e608bd37",
        "error": "Error: Invalid login: 535 5.7.8 Error: authentication failed: "
      }
    }
    

## Common pitfalls

> ⚠️ **Authentication quirks** – Gmail, Outlook, and Yahoo may refuse SMTP logins that look like bots. Switch to OAuth2 or an app‑specific password.

> 💡 **Timeouts** – Heroku dynos cut idle sockets. Either move off the platform or bump the dyno size.
