---
title: Using EmailEngine to continuously feed emails for analysis
slug: using-emailengine-to-continuously-feed-emails-for-analysis
date_published: 2025-08-01T09:39:00.000Z
date_updated: 2025-09-15T12:05:39.000Z
---

A common use case for EmailEngine is to feed existing and incoming emails into some analyzing service, for example one that creates and stores vector embeddings for context-aware searches over a corpus of emails. With a regular email export you only get a snapshot of the time you created the export, but with EmailEngine you can keep continuously exporting emails in real time as they come in, so the vector database is always up to date and contains the newest emails.

    ┌──────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
    │  IMAP / SMTP │   │     EmailEngine     │   │  Analyzing Service / │
    │ Gmail API /  ├──► (fetch, parse, send) ├───►  Vector Database /   │
    │ MS Graph API │   │   webhooks on new   │   │  Custom Processing   │
    └──────────────┘   │    + existing mail  │   └──────────────────────┘
                       └─────────────────────┘

While EmailEngine does not have a built-in exporting function, you can achieve the same by using webhooks. By default, EmailEngine sends webhooks for new emails only, but for IMAP accounts (unfortunately this does not work if the email account uses Gmail API or MS Graph API as the backend), you can configure it to treat existing emails as "new" as well. When you add an IMAP account to EmailEngine and set the `notifyFrom` property to a very old date, EmailEngine detects any email newer than that date as "new" and issues a webhook. Regardless of whether you use IMAP, MS Graph API, or Gmail API, EmailEngine always sends new email webhooks as new emails are received.

To add an IMAP account with `notifyFrom` directly:

    curl -X POST 'https://emailengine.local/v1/account' \
      -H 'Content-Type: application/json' \
      -d '{
      "account": "example",
      "name": "Nyan Cat",
      "email": "nyan.cat@example.com",
      "notifyFrom": "1970-01-01T00:00:00.000Z",
      "imap": {
        "auth": {
          "user": "nyan.cat",
          "pass": "secretpass"
        },
        "host": "mail.example.com",
        "port": 993,
        "secure": true
      }
    }'

Or to generate an authentication link for the user for the Hosted Authentication form:

    curl -X POST 'https://emailengine.local/v1/authentication/form' \
      -H 'Content-Type: application/json' \
      -d '{
      "account": "example",
      "notifyFrom": "1970-01-01T00:00:00.000Z",
      "redirectUrl": "https://myapp/account/settings.php"
    }'

The new message webhook includes headers, metadata (such as the subject), and the HTML and/or plaintext message body. [See here](https://emailengine.app/webhooks#messageNew) for an example webhook payload. It does not contain attachment contents, only attachment metadata (filename, size, etc.). If you need attachment contents, download them separately using an attachment download API request.

To receive webhooks, make sure webhooks are enabled and that either all events or the _“messageNew”_ event is enabled. See the *Configuration *→* Webhooks* page for settings.

> Note that EmailEngine detects all previously unseen emails in any mailbox as "new." This means if you move an email from the Inbox to another folder, EmailEngine treats the copy in the other folder as a "new" email and sends a webhook.

To speed up indexing, you could change the IMAP indexer from "full" to "fast" (*Configuration *→* Service *→* Indexing Method for IMAP Accounts*). The main difference is that "full" also detects and sends webhooks about message updates (delete, seen/unseen, etc.), while "fast" only sends webhooks for new emails.

Once set up, if you add a new email account to your EmailEngine service with `notifyFrom` configured, EmailEngine will send webhook requests for all emails - both existing and new ones - with the full message contents to your webhook endpoint.
