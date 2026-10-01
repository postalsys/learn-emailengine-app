---
title: Email Threading
sidebar_position: 1
description: How email threading works, which headers drive it, which backends give EmailEngine a native thread ID, and where to read about provider support, thread search and threaded sending
---

# Email Threading

Email threading groups related messages into a conversation. Mail clients decide what belongs together from the `Message-ID`, `In-Reply-To`, and `References` headers, and some mail servers additionally assign a thread identifier that EmailEngine exposes as `threadId`. This page explains the headers and identifiers involved; the three pages under it each own one part of the subject.

## Quick Start

Use the `reference` field of the submit API and EmailEngine sets `In-Reply-To` and `References` from the referenced message:

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": {
      "message": "AAAADQAABl0",
      "action": "reply"
    },
    "html": "<p>Your reply</p>"
  }'
```

That covers replies and forwards to a message EmailEngine can already see. A sequence that starts with no stored message to reference has to carry its own `messageId` and threading headers; [Sending threaded messages](/docs/sending/threading/sending-threaded) walks through one.

## How Email Threading Works

Threading is done by the client, from four pieces of each message:

1. **Message-ID**: the unique identifier of the message
2. **In-Reply-To**: the `Message-ID` of the message being replied to
3. **References**: the chain of `Message-ID`s in the thread so far
4. **Subject**: expected to stay the same apart from `Re:` and `Fwd:` prefixes

### RFC 5256

RFC 5256 defined server-side threading over a single folder. That works for mailing-list traffic, where the whole thread sits in one folder, and poorly for one-to-one conversations, where half the messages are in the Inbox and the other half in Sent Mail.

### RFC 8474

RFC 8474 (the `OBJECTID` extension) gives each message a server-assigned thread ID that holds across folders. Support depends on the server, so client-side threading from headers remains the fallback for most accounts.

## Threading Headers Explained

### Message-ID

Every message has a unique `Message-ID`:

```
Message-ID: <56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>
```

**Format**: `<unique-id@domain>`

When you set it yourself:

- Wrap it in angle brackets `< >`
- Use a UUID or a comparably unique value
- Use the domain of the `From` address, or your own service domain
- Store it, because every follow-up needs it for `References`

If you do not set `messageId` on submit, EmailEngine generates one and returns it in the submit response.

### In-Reply-To

Names the message being replied to:

```
In-Reply-To: <56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>
```

This is the parent-child link between two messages. EmailEngine sets it for `reply` and `reply-all` submissions that use `reference`.

### References

The full chain of `Message-ID`s in the conversation:

```
References: <original@example.com> <reply1@example.com> <reply2@example.com>
```

- Space-separated
- Each ID in angle brackets
- Oldest first, newest last

When you use `reference`, EmailEngine builds this header from the referenced message's `References` (or its `In-Reply-To` when it has none) followed by its `Message-ID`, adding missing angle brackets and removing duplicates. Since v2.82.0 a chain longer than 21 entries is cut to the thread root plus the 20 most recent IDs; before that there was no upper bound. The derived chain replaces a `references` header given in the same call. Without `reference`, a `references` header you set yourself is sent as written.

## Threading Challenges

### Split Across Folders

A conversation is rarely in one folder:

- **Inbox**: received messages
- **Sent**: your side of the conversation
- **Other folders**: messages moved by filters or by hand

Retrieving a whole thread therefore needs either a cross-folder search or one search per folder. See [Searching threads](/docs/sending/threading/searching-threads).

### Provider Differences

- **Gmail**: a thread ID on every message (`X-GM-THRID` over IMAP, `threadId` in the Gmail API)
- **Microsoft 365**: a conversation ID over the Graph API, nothing over IMAP
- **Yahoo and AOL**: a thread ID through the `OBJECTID` extension
- **Other IMAP servers**: no thread ID unless the server implements `OBJECTID`

See [Provider support](/docs/sending/threading/provider-support) for the details.

### Subject Line Sensitivity

Some clients include the subject in their threading decision. Changing the subject text between messages, beyond adding `Re:` or `Fwd:`, can split a thread even when the headers are correct.

## EmailEngine's Threading Support

EmailEngine passes on the thread identifier whenever the backend provides one:

1. **Gmail API**: the Gmail API's `threadId`
2. **Microsoft Graph API**: the message's `conversationId`
3. **IMAP**: the value the server returns when it supports `OBJECTID` (RFC 8474) or Gmail's `X-GM-EXT-1` extension, which covers Gmail over IMAP and OBJECTID servers such as Yahoo and AOL

IMAP servers without either extension give EmailEngine nothing to pass on. For those accounts a thread has to be reconstructed from `Message-ID`, `In-Reply-To`, and `References`.

## Thread ID Format

The `threadId` property is a string whose format depends on the provider:

| Provider                        | Format                                            | Example                 |
| ------------------------------- | ------------------------------------------------- | ----------------------- |
| Gmail API                       | Long numeric string                               | `"1759349012996310407"` |
| Gmail over IMAP (X-GM-EXT-1)    | Long numeric string                               | `"1759349012996310407"` |
| Microsoft Graph API             | Graph `conversationId`, a long base64 string       | `"AAQkAGI2THY2..."`     |
| IMAP with OBJECTID (Yahoo, AOL) | Short numeric string                              | `"501"`                 |

Treat every one of them as an opaque string. [Provider support](/docs/sending/threading/provider-support) has a full Graph conversation ID in context.

A `threadId` is only meaningful within the account it came from. See [Message IDs](/docs/receiving/ids-explained) for how it relates to the other identifiers.

## Where Thread IDs Appear

`threadId` is present, when the backend provides one, in:

- Message listing responses
- Message detail responses
- Message search responses
- Webhook payloads that carry a message, such as `messageNew`

### Message Lists Are Not Thread Lists

EmailEngine does not group a listing by thread. Messages in the same thread are listed as separate entries, whatever the backend.

To get the messages of one thread, search with `threadId` in the `search` object. The `path` query parameter is required:

```bash
curl -XPOST "https://emailengine.example.com/v1/account/example/search?path=INBOX" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "1759349012996310407"
    }
  }'
```

See [Searching threads](/docs/sending/threading/searching-threads) for which folder to search per provider.

**Example webhook** (abridged; a real `messageNew` payload carries the full message entry):

```json
{
  "account": "example",
  "date": "2025-10-10T14:30:00.000Z",
  "path": "INBOX",
  "event": "messageNew",
  "data": {
    "id": "AAABkPHBeR0",
    "threadId": "1759349012996310407",
    "subject": "Project discussion",
    "from": {
      "address": "colleague@example.com"
    }
  }
}
```

## Threading Documentation

### [Provider-Specific Threading](/docs/sending/threading/provider-support)

How each backend behaves:

- Gmail over IMAP and the Gmail API: thread IDs and the `\All` folder
- Microsoft 365 over the Graph API: conversation IDs and the `\All` folder
- Microsoft 365 over IMAP: no thread IDs
- Yahoo, AOL, and other OBJECTID servers: thread IDs, but no `\All` folder
- Other IMAP servers: no thread IDs

### [Searching Thread Messages](/docs/sending/threading/searching-threads)

Retrieving every message in a conversation:

- One search against `\All` where the backend has it
- One search per folder where it does not
- Building a thread from headers when the server assigns no `threadId`

### [Sending Threaded Messages](/docs/sending/threading/sending-threaded)

Keeping a sequence you send in one conversation:

- Setting `messageId` and extending `References` with each message
- When to use `reference` instead
- Detecting a `Message-ID` the receiving server rewrote

## See Also

- [Replies and forwards](/docs/sending/replies-forwards) - Letting EmailEngine build the threading headers for you
- [Searching messages](/docs/receiving/searching) - The search terms the thread queries are built from
- [Message IDs](/docs/receiving/ids-explained) - What a `threadId` is, and why it is not portable between providers
- [Messages API](/docs/api-reference/messages-api) - Where `threadId` appears in a message payload
