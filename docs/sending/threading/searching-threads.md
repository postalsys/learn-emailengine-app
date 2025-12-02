---
title: Searching Thread Messages
sidebar_position: 3
description: How to find and retrieve all messages in an email thread
---

# Searching Thread Messages

Once you have a thread ID, you can search for all related messages across folders. The approach varies by email provider.

## Using the `\All` Folder

Gmail and Microsoft Graph API support a special `\All` folder that searches across all mailboxes simultaneously.

### Supported Providers

- Gmail (IMAP + OAuth2) - Supported
- Gmail (Gmail API) - Supported
- Microsoft Graph API - Supported
- Outlook/Microsoft 365 (IMAP + OAuth2) - Not supported
- Yahoo/AOL/Verizon - Not supported
- Generic IMAP - Not supported

### Search All Folders at Once

**Gmail Example** using the [Search Messages API endpoint](/docs/api/post-v-1-account-account-search):

```bash
curl -XPOST "https://ee.example.com/v1/account/gmail/search?path=%5CAll" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "1759349012996310407"
    }
  }'
```

**Response**:

```json
{
  "total": 5,
  "page": 0,
  "pages": 1,
  "nextPageCursor": null,
  "prevPageCursor": null,
  "messages": [
    {
      "id": "AAAAKAAACKM",
      "uid": 2211,
      "threadId": "1759349012996310407",
      "subject": "Project discussion",
      "from": { "name": "Colleague", "address": "colleague@example.com" },
      "date": "2025-10-10T14:30:00.000Z"
    },
    {
      "id": "AAAAKAAACKN",
      "uid": 445,
      "threadId": "1759349012996310407",
      "subject": "Re: Project discussion",
      "from": { "name": "Me", "address": "me@example.com" },
      "date": "2025-10-10T15:45:00.000Z"
    },
    {
      "id": "AAAAKAAACKO",
      "uid": 2213,
      "threadId": "1759349012996310407",
      "subject": "Re: Project discussion",
      "from": { "name": "Colleague", "address": "colleague@example.com" },
      "date": "2025-10-10T16:20:00.000Z"
    }
  ]
}
```

**Microsoft Graph API Example**:

```bash
curl -XPOST "https://ee.example.com/v1/account/outlook-graph/search?path=%5CAll" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "AAQkAGI2TH..."
    }
  }'
```

### Benefits of `\All` Folder

- **Single Request**: Get entire thread in one API call
- **Complete View**: Includes messages from Inbox, Sent, and all other folders
- **Efficient**: Faster than multiple folder queries
- **Sorted**: Messages returned in chronological order

## Folder-by-Folder Search

For providers without `\All` support, you must search each folder individually.

### Providers Requiring This Approach

- Yahoo/AOL/Verizon (OBJECTID support but no `\All`)
- Outlook/Microsoft 365 (IMAP backend)
- Generic IMAP providers

### Search Multiple Folders

**Step 1: Search Inbox**:

```bash
curl -XPOST "https://ee.example.com/v1/account/yahoo/search?path=INBOX" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "501"
    }
  }'
```

**Step 2: Search Sent**:

```bash
curl -XPOST "https://ee.example.com/v1/account/yahoo/search?path=Sent" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "501"
    }
  }'
```

**Step 3: Combine Results**:

```
// Pseudo code
function getCompleteThread(accountId, threadId):
    folders = ['INBOX', 'Sent', 'Archive', 'Drafts']
    allMessages = []

    for each folder in folders:
        // Send HTTP POST request
        response = HTTP_POST(
            url: "https://ee.example.com/v1/account/" + accountId + "/search?path=" + folder,
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: {
                search: { threadId: threadId }
            }
        )

        data = parseJSON(response.body)
        allMessages.append(data.messages)

    // Sort by date
    allMessages.sortBy(field: "date", order: ascending)

    return allMessages
```

### Limitations

- **Multiple Requests**: Slower than `\All` folder
- **Incomplete Results**: May miss messages moved to unexpected folders
- **Complexity**: Client-side merging and deduplication needed

## Generic IMAP Threading

For generic IMAP providers without native threading support, threads must be built manually from Message-ID headers. See the "Building Threads Manually" section below for implementation details.

## Building Threads Manually

Without native threading support, you can build threads from Message-ID headers.

### Extract Thread from Headers

```
// Pseudo code
function buildThreadFromHeaders(message, allMessages):
    thread = [message]
    seen = Set([message.id])

    // Find parent messages (from References)
    if message.headers['references'] exists:
        // Extract all message IDs wrapped in < >
        refs = extractMessageIds(message.headers['references'])

        for each ref in refs:
            refId = ref.removeAngleBrackets()  // Remove < >
            parent = allMessages.find(m => m.messageId == refId)

            if parent exists and parent.id not in seen:
                thread.insertAtBeginning(parent)
                seen.add(parent.id)

    // Find replied messages (from In-Reply-To)
    if message.headers['in-reply-to'] exists:
        replyToId = extractMessageId(message.headers['in-reply-to'])

        if replyToId exists:
            parent = allMessages.find(m => m.messageId == replyToId)

            if parent exists and parent.id not in seen:
                thread.insertAtBeginning(parent)
                seen.add(parent.id)

    // Find child messages (messages that reference this one)
    for each m in allMessages:
        if m.id in seen:
            continue

        isChild = false
        if m.headers['in-reply-to'] contains "<" + message.messageId + ">":
            isChild = true
        if m.headers['references'] contains "<" + message.messageId + ">":
            isChild = true

        if isChild:
            thread.append(m)
            seen.add(m.id)

    // Sort chronologically
    thread.sortBy(field: "date", order: ascending)
    return thread
```

### Limitations

- Must fetch all messages from all folders first
- Computationally expensive for large mailboxes
- May miss messages if headers are malformed
- Doesn't provide persistent thread IDs

## Search Strategy by Provider

### Gmail / Gmail API

```
// Pseudo code
function searchGmailThread(accountId, threadId):
    // Single request using \All
    response = HTTP_POST(
        url: "https://ee.example.com/v1/account/" + accountId + "/search?path=%5CAll",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: {
            search: { threadId: threadId }
        }
    )

    return parseJSON(response.body)
```

### Microsoft Graph API

```
// Pseudo code
function searchGraphThread(accountId, threadId):
    // Single request using \All
    response = HTTP_POST(
        url: "https://ee.example.com/v1/account/" + accountId + "/search?path=%5CAll",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: {
            search: { threadId: threadId }
        }
    )

    return parseJSON(response.body)
```

### Yahoo / AOL / Verizon

```
// Pseudo code
function searchYahooThread(accountId, threadId):
    // Multiple requests per folder (Yahoo doesn't support \All)
    folders = ['INBOX', 'Sent']
    allMessages = []

    for each folder in folders:
        response = HTTP_POST(
            url: "https://ee.example.com/v1/account/" + accountId + "/search?path=" + encodeURIComponent(folder),
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: {
                search: { threadId: threadId }
            }
        )

        data = parseJSON(response.body)
        allMessages.append(data.messages)

    // Sort by date and return
    allMessages.sortBy(field: "date", order: ascending)
    return {
        messages: allMessages
    }
```

### Generic IMAP Manual Threading

```
// Pseudo code
function searchGenericThread(accountId, subject):
    // Search folders individually and build thread manually
    folders = ['INBOX', 'Sent']
    allMessages = []

    for each folder in folders:
        response = HTTP_POST(
            url: "https://ee.example.com/v1/account/" + accountId + "/search?path=" + encodeURIComponent(folder),
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: {
                search: { subject: subject }
            }
        )

        data = parseJSON(response.body)
        allMessages.append(data.messages)

    // Build thread from Message-ID headers
    return buildThreadFromHeaders(allMessages)
```

## Pagination

Thread searches support pagination for long threads:

```bash
curl -XPOST "https://ee.example.com/v1/account/gmail/search?path=%5CAll&page=0&pageSize=50" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "search": {
      "threadId": "1759349012996310407"
    }
  }'
```

**Response includes pagination metadata**:

```json
{
  "total": 127,
  "page": 0,
  "pages": 3,
  "messages": [...]
}
```

