---
title: Threading with EmailEngine
slug: threading-with-emailengine
date_published: 2023-04-10T08:09:37.000Z
date_updated: 2023-04-10T08:13:56.000Z
tags: IMAP, EmailEngine, Threads
---

In a [previous blog post](__GHOST_URL__/sending-multiple-emails-in-the-same-thread/), we discussed how email threads are typically managed on the client side, as virtual entities. Previous attempts to define server-side threading, such as the [RFC5256](https://www.rfc-editor.org/rfc/rfc5256.html) standard, were mainly useful for mailing-list type threads, assuming that all related emails were located in the same folder. This approach proved ineffective for one-to-one threads, where half of the emails are in the Inbox and the other half in the Sent Mail folder.

To address this issue, [RFC8474](https://www.rfc-editor.org/rfc/rfc8474.html) introduced a new method, where each email is assigned a thread ID, making it possible to identify emails belonging to the same thread across different folders. However, this solution is not yet widely supported by email servers, meaning that, for the time being, email threading must still be managed on the client side for most users.

EmailEngine offers various threading options, but to ensure consistent threading for all emails, the [document store option](https://emailengine.app/document-store) must be enabled. In this case, EmailEngine maintains a registry of threads in ElasticSearch, as Redis cannot hold such a large amount of data.

- For Gmail/Gsuite accounts, EmailEngine utilizes the `X-GM-THRID` message property from the Gmail-specific `X-GM-EXT-1` extension. These are "native" thread identifiers, and work with or without the document store. The `threadId` value appears as a long numeric string (e.g., `"1759349012996310407"`).
- For Yahoo/Verizon/AOL accounts and other accounts supporting the `OBJECTID` extension (RFC8474), EmailEngine employs the `THREADID` message property. These "native" thread identifiers also function with or without the document store. The `threadId` value appears as a short numeric string (e.g., `"501"`).
- For all other email accounts, EmailEngine generates and manages thread identifiers internally. As previously mentioned, you must use the `documentStore` option. When listing messages directly from the IMAP server, the resulting list does not include the `threadId` value. Additionally, you cannot search by `threadId` from the IMAP server. This feature is only available when the `documentStore` option is enabled, which means that queries must run against the ElasticSearch server, not IMAP. The `threadId` value, in this case, is a UUID string (for example, `"765e783c-a986-439c-982a-bc49a1b9a6b2"`).

The `threadId` property can be found in various places, such as the `messageNew`[webhook payload](https://emailengine.app/webhooks#messageNew), mailbox [message listing](https://api.emailengine.app/#operation/getV1AccountAccountMessages) responses, [message detail](https://api.emailengine.app/#operation/getV1AccountAccountMessageMessage) responses, and [message search](https://api.emailengine.app/#operation/postV1AccountAccountSearch) responses. You can use `threadId` as a search parameter. Additionally, when the document store option is enabled, you can omit the mailbox path while searching to retrieve emails from all mailbox folders associated with the thread.

For example, you can search for threaded emails from all folders with the following query.

    curl -XPOST \
      "https://ee.example/v1/account/example/search?documentStore=true" \
      -H "Authorization: Bearer 990db3b95f8b04ab1fc..." \
      -H "Content-Type: application/json" \
      -d '{
      "search": {
        "threadId": "070a656e-9237-42b8-a34e-12d009c05abf"
      }
    }'
    

The response for such a request would include emails with the same thread identification from all folders.

    {
      "total": 3,
      "page": 0,
      "pages": 1,
      "messages": [
        {
          "path": "INBOX",
          "id": "AAAAKAAACKM",
          "uid": 2211,
          "threadId": "070a656e-9237-42b8-a34e-12d009c05abf",
          ...
    

If you mainly target Gmail or Yahoo accounts, then using the document store is not mandatory, as the mail server already provides threading features.
