---
title: Email Threading
sidebar_position: 5
description: Understanding and maintaining email conversation threads across multiple messages
---

<!--
SOURCE ATTRIBUTION:
- Primary: blog/2023-04-10-threading-with-emailengine.md
- Merged: blog/2024-02-27-sending-multiple-emails-in-the-same-thread.md
-->

# Email Threading

Email threading allows related messages to be grouped together as conversations. This guide covers how EmailEngine handles threading and how to maintain threads when sending multiple emails.

## Why Threading Matters

Email clients rely on RFC 5322 `Message-ID` and `References` headers—never on SMTP commands—to decide which messages belong together. If you let EmailEngine autogenerate those values, your perfectly timed sequence may scatter across the inbox. By controlling them yourself, every follow-up lands exactly where the user expects.

## How Email Threading Works

Email threading is typically managed on the client side as virtual entities. Emails are threaded based on:

1. **Message-ID**: Unique identifier for each message
2. **In-Reply-To**: References the Message-ID being replied to
3. **References**: Chain of all Message-IDs in the thread
4. **Subject**: Must remain consistent (with Re:/Fwd: prefixes)

Previous attempts to define server-side threading (RFC5256) were mainly useful for mailing-list type threads, assuming that all related emails were located in the same folder. This approach proved ineffective for one-to-one threads, where half of the emails are in the Inbox and the other half in the Sent Mail folder.

## EmailEngine Threading Options

EmailEngine offers various threading options depending on the email provider and configuration.

### Gmail/Google Workspace

For Gmail/Gsuite accounts, EmailEngine utilizes the `X-GM-THRID` message property from the Gmail-specific `X-GM-EXT-1` extension.

- **Native thread identifiers**: Work with or without document store
- **Thread ID format**: Long numeric string (e.g., `"1759349012996310407"`)
- **Availability**: In webhooks, message listings, search results

```bash
curl "https://ee.example.com/v1/account/gmail/messages?path=INBOX" \
  -H "Authorization: Bearer <token>"
```

```json
{
  "messages": [
    {
      "id": "AAABkPHBeR0",
      "threadId": "1759349012996310407",
      "subject": "Project discussion"
    }
  ]
}
```

### Yahoo/AOL/Verizon

For Yahoo/Verizon/AOL accounts and other accounts supporting the `OBJECTID` extension (RFC8474), EmailEngine employs the `THREADID` message property.

- **Native thread identifiers**: Work with or without document store
- **Thread ID format**: Short numeric string (e.g., `"501"`)
- **Availability**: In webhooks, message listings, search results

### Other Email Providers

For all other email accounts, EmailEngine generates and manages thread identifiers internally.

**Requirements:**
- **Document store must be enabled**: EmailEngine maintains thread registry in ElasticSearch
- **Thread ID format**: UUID string (e.g., `"765e783c-a986-439c-982a-bc49a1b9a6b2"`)
- **Limitations without document store**:
  - Message lists from IMAP don't include `threadId`
  - Cannot search by `threadId` on IMAP server
  - Must query ElasticSearch for threading

## Enabling Document Store

To ensure consistent threading for all email providers, enable the document store option.

RFC8474 introduced a new method where each email is assigned a thread ID, making it possible to identify emails belonging to the same thread across different folders. However, this solution is not yet widely supported by email servers, meaning that, for the time being, email threading must still be managed on the client side for most users.

With document store enabled, EmailEngine maintains a registry of threads in ElasticSearch, as Redis cannot hold such a large amount of data.

Configuration example:

```bash
# Set in environment or configuration
EENGINE_DOCUMENT_STORE_ENABLED=true
EENGINE_DOCUMENT_STORE_URL=http://elasticsearch:9200
EENGINE_DOCUMENT_STORE_INDEX=emailengine
```

## Searching by Thread ID

The `threadId` property can be found in:

- Message listing responses
- Message detail responses
- Message search responses
- Webhook payloads (e.g., `messageNew`)

### Search Across All Folders

When document store is enabled, you can omit the mailbox path while searching to retrieve emails from all mailbox folders associated with the thread:

```bash
curl -XPOST "https://ee.example/v1/account/example/search?documentStore=true" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "070a656e-9237-42b8-a34e-12d009c05abf"
    }
  }'
```

**Response:**

```json
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
      "subject": "Project discussion",
      "from": {
        "address": "colleague@example.com"
      }
    },
    {
      "path": "Sent",
      "id": "AAAAKAAACKN",
      "uid": 445,
      "threadId": "070a656e-9237-42b8-a34e-12d009c05abf",
      "subject": "Re: Project discussion",
      "from": {
        "address": "me@example.com"
      }
    },
    {
      "path": "INBOX",
      "id": "AAAAKAAACKO",
      "uid": 2213,
      "threadId": "070a656e-9237-42b8-a34e-12d009c05abf",
      "subject": "Re: Project discussion"
    }
  ]
}
```

The response includes emails with the same thread identification from all folders (Inbox, Sent, etc.).

## Sending Multiple Emails in the Same Thread

To maintain a conversation thread when sending follow-up emails, you need to control the Message-ID and References headers.

### Step 1: Send the Initial Message

Send the first message with a custom Message-ID:

```bash
curl -XPOST "http://127.0.0.1:3000/v1/account/demo/submit" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "address": "sender@example.com" },
    "to": { "address": "recipient@example.com" },
    "subject": "Test message thread",
    "html": "<p>First message in thread!</p>",
    "messageId": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>"
  }'
```

**Important:** Save the `messageId` value—you'll need it for every follow-up.

### Step 2: Add the First Follow-Up

Send a follow-up with the original Message-ID in the References header:

```bash
curl -XPOST "http://127.0.0.1:3000/v1/account/demo/submit" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "address": "sender@example.com" },
    "to": { "address": "recipient@example.com" },
    "subject": "Test message thread",
    "html": "<p>Second message in thread!</p>",
    "messageId": "<77a7c383-cc1a-44c6-9866-96b2873e3322@example.com>",
    "headers": {
      "references": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>"
    }
  }'
```

### Step 3: Keep Extending References

Each subsequent call appends the current message's ID to the References header:

```bash
curl -XPOST "http://127.0.0.1:3000/v1/account/demo/submit" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "address": "sender@example.com" },
    "to": { "address": "recipient@example.com" },
    "subject": "Test message thread",
    "html": "<p>Third message in thread!</p>",
    "messageId": "<new-message-id@example.com>",
    "headers": {
      "references": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com> <77a7c383-cc1a-44c6-9866-96b2873e3322@example.com>"
    }
  }'
```

## Threading Best Practices

### Always Use Angle Brackets

**Wrong:**
```json
{
  "headers": {
    "references": "56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com"
  }
}
```

**Correct:**
```json
{
  "headers": {
    "references": "<56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com>"
  }
}
```

Wrap every ID in `< >` or some clients will ignore the header.

### Maintain Consistent Subject

**Wrong:**
```json
{
  "subject": "Completely different subject"
}
```

**Correct:**
```json
{
  "subject": "Test message thread"
}
```

Changing the subject (beyond adding *Re:* or *Fwd:*) breaks the thread despite perfect headers.

### Gmail Reference Limit

Gmail reads only the last 20 `References` entries. If your sequence is longer, drop the oldest IDs:

```javascript
function buildReferences(messageIds) {
  // Keep only last 20 IDs
  const recent = messageIds.slice(-20);
  return recent.map(id => `<${id}>`).join(' ');
}
```

### Persist Message IDs

**Important:** Persist every generated `messageId` so you can rebuild the `references` header later. EmailEngine doesn't store that list for you.

Example storage:

```javascript
// Store thread in database
const thread = {
  threadId: 'custom-thread-123',
  messageIds: [
    '56b3c6d2-f7c0-4272-8beb-e25fdb7c19f1@example.com',
    '77a7c383-cc1a-44c6-9866-96b2873e3322@example.com'
  ],
  subject: 'Test message thread',
  participants: ['sender@example.com', 'recipient@example.com']
};

await db.threads.insert(thread);

// When sending next message
const thread = await db.threads.findOne({ threadId: 'custom-thread-123' });
const references = thread.messageIds.map(id => `<${id}>`).join(' ');

// Send with references
await sendMessage({
  messageId: '<new-id@example.com>',
  headers: { references },
  subject: thread.subject
});

// Update thread
thread.messageIds.push('new-id@example.com');
await db.threads.update({ threadId: 'custom-thread-123' }, thread);
```

## Using the Reference API for Threading

For replies and forwards, EmailEngine handles threading automatically when you use the `reference` parameter:

```bash
curl -XPOST "http://127.0.0.1:3000/v1/account/example/submit" \
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

EmailEngine automatically:
- Extracts the original Message-ID
- Builds the References header
- Sets In-Reply-To header
- Adds Re: prefix to subject
- Maintains the thread

See [Replies & Forwards](./replies-forwards.md) for details.

## Threading Across Folders

One challenge with email threading is that conversation messages are often split across folders:

- **Inbox**: Contains received messages
- **Sent**: Contains sent messages
- **Other folders**: Messages may be moved by filters

### Document Store Solution

With document store enabled, EmailEngine can search across all folders:

```bash
curl -XPOST "https://ee.example.com/v1/account/example/search?documentStore=true" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "765e783c-a986-439c-982a-bc49a1b9a6b2"
    }
  }'
```

This returns all messages in the thread regardless of which folder they're in.

### Without Document Store

Without document store, you need to:

1. Search each folder individually
2. Match messages by Message-ID and References headers yourself
3. Build the thread client-side

## Provider-Specific Threading

### Gmail

Gmail has the best native threading support:

```javascript
// Gmail provides X-GM-THRID
const messages = await fetch('/v1/account/gmail/messages?path=INBOX');

// Group by threadId
const threads = {};
messages.forEach(msg => {
  if (!threads[msg.threadId]) {
    threads[msg.threadId] = [];
  }
  threads[msg.threadId].push(msg);
});
```

### Outlook/Exchange

Outlook uses conversation IDs:

```javascript
// Outlook provides ConversationId in headers
const message = await fetch('/v1/account/outlook/message/ABC123');

// Search for other messages in conversation
const related = await fetch(
  '/v1/account/outlook/search',
  {
    method: 'POST',
    body: JSON.stringify({
      search: {
        header: {
          key: 'Thread-Topic',
          value: message.headers['thread-topic']
        }
      }
    })
  }
);
```

### Generic IMAP

For generic IMAP servers without threading extensions:

```javascript
// Must build threads manually
function buildThread(message, allMessages) {
  const thread = [message];

  // Find messages this one references
  if (message.headers['references']) {
    const refs = message.headers['references']
      .match(/<[^>]+>/g) || [];

    refs.forEach(ref => {
      const refId = ref.slice(1, -1);
      const referenced = allMessages.find(
        m => m.messageId === refId
      );
      if (referenced && !thread.includes(referenced)) {
        thread.unshift(referenced);
      }
    });
  }

  // Find messages that reference this one
  allMessages.forEach(m => {
    if (m.headers['in-reply-to'] === `<${message.messageId}>` ||
        m.headers['references']?.includes(`<${message.messageId}>`)) {
      if (!thread.includes(m)) {
        thread.push(m);
      }
    }
  });

  return thread.sort((a, b) => new Date(a.date) - new Date(b.date));
}
```

## Common Pitfalls

### Missing Angle Brackets

**Problem:** Message IDs in References header without `< >`.

**Result:** Threading breaks in many email clients.

**Solution:** Always wrap IDs in angle brackets.

### Subject Drift

**Problem:** Changing the subject line.

**Result:** Thread breaks despite correct Message-ID headers.

**Solution:** Keep subject consistent, only adding Re:/Fwd: prefixes.

### Gmail 20-Reference Limit

**Problem:** Long threads with more than 20 messages.

**Result:** Gmail ignores older references.

**Solution:** Keep only the most recent 20 Message-IDs in the References header.

### ID Storage

**Problem:** Not persisting Message-IDs for building References later.

**Result:** Cannot maintain thread continuity.

**Solution:** Store all Message-IDs in your database alongside thread metadata.

### Mixed Thread Participants

**Problem:** Threading messages with different participant combinations.

**Result:** Some clients show separate threads.

**Solution:** Be consistent with participants, or accept that some clients may show separate threads.

## See Also

- [Replies & Forwards](./replies-forwards.md) - Use reference API for automatic threading
- [Basic Sending](./basic-sending.md) - Email sending fundamentals
- [Advanced: IDs Explained](../advanced/ids-explained.md) - Understanding EmailEngine ID types
- [Receiving: Message Operations](../receiving/message-operations.md) - Working with messages
