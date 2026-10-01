---
title: Messages API
description: Reference for the message object, the message endpoints, and the request and response conventions they share
sidebar_position: 4
---

# Messages API

This page is the reference for the message resource: the fields a message carries in a listing and in its details, the endpoints that read and change messages, and the conventions those endpoints share. How to use them, with examples and the differences between IMAP, Gmail API and MS Graph accounts, is on [Message Operations](/docs/receiving/message-operations); the full search grammar is on [Searching Messages](/docs/receiving/searching); each endpoint's complete schema is on its generated page, linked below.

## Endpoints

| Operation | Endpoint | Permission |
| --- | --- | --- |
| [List messages in a folder](/docs/api/get-v-1-account-account-messages) | `GET /v1/account/{account}/messages` | `read` / `message` |
| [Search for messages](/docs/api/post-v-1-account-account-search) | `POST /v1/account/{account}/search` | `read` / `message` |
| [Get message information](/docs/api/get-v-1-account-account-message-message) | `GET /v1/account/{account}/message/{message}` | `read` / `message` |
| [Retrieve message text](/docs/api/get-v-1-account-account-text-text) | `GET /v1/account/{account}/text/{text}` | `read` / `message` |
| [Download attachment](/docs/api/get-v-1-account-account-attachment-attachment) | `GET /v1/account/{account}/attachment/{attachment}` | `read` / `message` |
| [Download raw message](/docs/api/get-v-1-account-account-message-message-source) | `GET /v1/account/{account}/message/{message}/source` | `read` / `message` |
| [Upload message](/docs/api/post-v-1-account-account-message) | `POST /v1/account/{account}/message` | `write` / `message` |
| [Update message](/docs/api/put-v-1-account-account-message-message) | `PUT /v1/account/{account}/message/{message}` | `write` / `message` |
| [Move a message](/docs/api/put-v-1-account-account-message-message-move) | `PUT /v1/account/{account}/message/{message}/move` | `write` / `message` |
| [Delete message](/docs/api/delete-v-1-account-account-message-message) | `DELETE /v1/account/{account}/message/{message}` | `destructive` / `message` |
| [Update messages](/docs/api/put-v-1-account-account-messages) | `PUT /v1/account/{account}/messages` | `write` / `message` |
| [Move messages](/docs/api/put-v-1-account-account-messages-move) | `PUT /v1/account/{account}/messages/move` | `write` / `message` |
| [Delete messages](/docs/api/put-v-1-account-account-messages-delete) | `PUT /v1/account/{account}/messages/delete` | `destructive` / `message` |

The permission column is the `x-ee-action` and `x-ee-group` pair each operation publishes in the OpenAPI document; a token narrowed with a `permissions` record has to allow both. See [Access Tokens](/docs/api-reference/access-tokens#permissions). Sending is a separate resource, documented on the [Sending API](/docs/api-reference/sending-api).

## The Message Object

A listing entry and the message details share one shape; the details add the headers, the `Sender` and `Bcc` addresses and the bounce fields. Text content is included only when asked for.

```json
{
  "id": "AAAABAABNc",
  "uid": 12345,
  "emailId": "1234567890abcdef",
  "threadId": "thread_abc123",
  "path": "INBOX",
  "date": "2025-01-15T10:30:00.000Z",
  "flags": ["\\Seen"],
  "unseen": false,
  "flagged": false,
  "answered": false,
  "draft": false,
  "size": 15234,
  "subject": "Meeting Tomorrow",
  "from": {
    "name": "John Doe",
    "address": "john@example.com"
  },
  "to": [
    {
      "name": "Jane Smith",
      "address": "jane@example.com"
    }
  ],
  "messageId": "<abc123@example.com>",
  "inReplyTo": "<xyz789@example.com>",
  "text": {
    "id": "AAAAAQAACnAWkeM",
    "encodedSize": {
      "plain": 1013,
      "html": 3487
    }
  },
  "attachments": [
    {
      "id": "AAAAAQAACnAy",
      "contentType": "application/pdf",
      "encodedSize": 52341,
      "embedded": false,
      "inline": false,
      "filename": "document.pdf"
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | EmailEngine message ID. On IMAP accounts it encodes the folder and UID, so it changes when the message moves |
| `uid` | number | IMAP UID. IMAP accounts only |
| `path` | string | Mailbox path. In a listing, present when listing `\All` or another virtual folder; in message details, not returned for Gmail API accounts |
| `emailId` | string | RFC 8474 Email ID, when the server supports one (Gmail, MS Graph, IMAP servers with `OBJECTID`) |
| `threadId` | string | RFC 8474 Thread ID, when the server supports one |
| `date` | string | ISO date string |
| `flags` | array | IMAP flags |
| `unseen` | boolean | True if unread |
| `flagged` | boolean | True if flagged |
| `answered` | boolean | True if replied to (the `\Answered` flag). IMAP accounts only |
| `draft` | boolean | True if draft |
| `size` | number | Message size in bytes. Not returned for MS Graph accounts |
| `subject` | string | Subject line |
| `from` | object | Sender address |
| `sender` | object | The `Sender` header, when it differs from `From`. Message details only |
| `to` | array | Recipient addresses |
| `cc` | array | CC addresses |
| `bcc` | array | BCC addresses. Message details only |
| `replyTo` | array | Reply-To addresses |
| `messageId` | string | RFC 5322 Message-ID |
| `inReplyTo` | string | Message-ID being replied to |
| `text` | object | Text content metadata; `text.plain` and `text.html` are included when the `textType` parameter asks for them |
| `headers` | object | Every header of the message, keyed in lower case, each value an array because a header can repeat. Message details only |
| `labels` | array | Gmail labels, on Gmail accounts; Outlook categories, on MS Graph accounts. Absent when there are none |
| `preview` | string | A short plaintext preview, on Gmail API and MS Graph accounts |
| `category` | string | Gmail inbox tab (`primary`, `social`, `promotions`, `updates`, `forums`). Gmail API accounts only |
| `specialUse` | string | The special-use role of the folder the message is in, such as `\Sent`. Message details on IMAP accounts only |
| `messageSpecialUse` | string | The special-use role of the message itself, such as `\Sent` or `\Junk` |
| `isAutoReply` | boolean | True when the message looks like an automatic reply, see [Tracking Email Replies](/docs/receiving/tracking-replies#filtering-auto-responses) |
| `isBounce` | boolean | True when the message is a delivery failure report. Decided when the message is fetched, for messages in the Inbox only; a delivery or delay notification does not count. Message details only. Since 2.81.2 |
| `relatedMessageId` | string | The `Message-ID` of the message that bounced. Set together with `isBounce` |
| `attachments` | array | Attachment metadata |

Releases before 2.81.2 attached a `bounces` array to messages an IMAP account had sent, listing the bounces EmailEngine had matched to them. The array and the store behind it were removed in 2.81.2; a bounce is reported once, as a [`messageBounce`](/docs/webhooks/messagebounce) webhook, and the bounce message itself carries `isBounce`. [Message IDs Explained](/docs/receiving/ids-explained) covers how `id`, `uid`, `emailId` and `messageId` relate.

### Nested Structures

**Address Object:**
```json
{
  "name": "John Doe",
  "address": "john@example.com"
}
```

**Text Object:**
```json
{
  "id": "AAAAAQAACnAWkeM",
  "encodedSize": {
    "plain": 1013,
    "html": 3487
  },
  "plain": "Message text content",
  "html": "<p>Message HTML content</p>",
  "hasMore": false,
  "webSafe": false
}
```

`encodedSize` reports the size of each MIME part separately, before decoding. `plain` and `html` are present only when `textType` asked for them, `hasMore` says whether `maxBytes` truncated the result, and `webSafe` is set when `webSafeHtml` was requested and `html` has been processed for display. `text.id` is what `GET /v1/account/{account}/text/{text}` takes to fetch the body on its own.

**Attachment Object:**
```json
{
  "id": "AAAAAQAACnAy",
  "contentType": "application/pdf",
  "filename": "document.pdf",
  "encodedSize": 52341,
  "embedded": false,
  "inline": false,
  "encodedInMessage": false,
  "contentId": "<part1.abc@example.com>",
  "method": "REQUEST"
}
```

`encodedSize` is the size as stored in the message, base64 encoded, so the decoded file is roughly three quarters of it. `embedded` marks a part of a `multipart/related` body, `inline` a part meant to be shown in place rather than listed, `encodedInMessage` a part that belongs to an attached `message/rfc822` rather than to the message itself, and `contentId` is what a `cid:` URL in the HTML refers to. `method` is present on iCalendar attachments and carries the calendar method (`REQUEST`, `REPLY`, `CANCEL`). The attachment endpoint returns the decoded file with its own content type, not a JSON wrapper; see [Attachments](/docs/receiving/attachments).

## Request and Response Conventions

### Listing and search

`GET /v1/account/{account}/messages` and `POST /v1/account/{account}/search` take the folder in the `path` query parameter, which is required on both. Special-use names such as `\Sent` resolve to the folder that carries that role, and `\All` selects every message on Gmail and MS Graph accounts. The listing accepts no other filter; an unknown query parameter answers 400. To select by flag, sender, date or any other criterion, use the search endpoint, whose body is a `search` object and whose `path` became required in 2.82.0 when the Document Store, which had allowed an account-wide search, was removed.

Both answer the same shape, newest first:

```json
{
  "total": 128,
  "page": 0,
  "pages": 3,
  "nextPageCursor": "eyJhIjoxfQ",
  "prevPageCursor": null,
  "messages": []
}
```

Paging takes `pageSize` (default 20, maximum 1000) and either `cursor`, from `nextPageCursor` or `prevPageCursor`, or a zero-based `page`. `cursor` works on every account type and is the only way to page a Gmail API account, which rejects a `page` above 0 with 400 (`InvalidInput`); when both are sent the cursor wins. `total` and `pages` are exact for IMAP accounts, approximate for Gmail API accounts, and can be missing for MS Graph accounts. On MS Graph, `useOutlookSearch=true` runs the query through Graph's `$search` instead of `$filter`, which reaches more fields but returns at most 1,000 results, in relevance order, with no total.

### Message details and text

`GET /v1/account/{account}/message/{message}` returns no body unless `textType` is `plain`, `html` or `*`. `maxBytes` caps each body and sets `text.hasMore`; `webSafeHtml=true` returns the HTML processed for display, which also turns on `preProcessHtml` and `embedAttachedImages` unless `embedAttachedImages=false` is sent explicitly; `markAsSeen=true` adds the `\Seen` flag while fetching. `GET /v1/account/{account}/text/{text}` takes `textType`, `maxBytes` and `webSafeHtml` with the `text.id` from the message. See [Web-Safe HTML](/docs/receiving/web-safe-html).

### Flags and labels

`PUT /v1/account/{account}/message/{message}` takes `flags` with `add`, `delete` and `set`; `set` replaces the whole list and makes `add` and `delete` ignored. `labels` takes the same keys for Gmail labels and Outlook categories, with the values each backend expects described under [Working with Gmail Labels and Outlook Categories](/docs/receiving/message-operations#working-with-gmail-labels-and-outlook-categories). An IMAP account answers each operation with `true` or `false`, for example `{"flags": {"add": true}}`; Gmail API and MS Graph accounts echo the requested values and add `result`, the message's list after the update.

### Moves and deletes

A move takes `path`, which accepts the aliases `\Inbox`, `\Sent`, `\Drafts`, `\Trash` and `\Junk`, and answers the destination `path` with the message's new `id` and, on IMAP accounts, its new `uid` when the server reported them. On a Gmail API account a move is a label change, and `source` names the label to remove.

A delete moves the message to Trash by default and answers `{"deleted": false, "moved": {"destination": ..., "message": ...}}` on an IMAP account, or `{"deleted": true}` once the message is gone for good. Gmail API and MS Graph accounts report `deleted: true` for a move to Trash as well, so `deleted: false` is the only reliable signal that a message was moved rather than removed. `force=true` deletes without the Trash step on IMAP and MS Graph accounts and has no effect on Gmail API accounts. The bulk endpoints answer `moved.idMap`, pairs of source and destination IDs, on IMAP accounts and `moved.emailIds` on Gmail API and MS Graph accounts; a Graph bulk delete with `force=true` lists the removed messages under `deletedMessages.emailIds`.

### Bulk actions

`PUT /v1/account/{account}/messages`, `.../messages/move` and `.../messages/delete` take the folder in the `path` query parameter and the same `search` object as the search endpoint in the body, and apply one change to every match. `search` is required, but `{}` is valid and selects the whole folder. On Gmail API and MS Graph accounts `search.emailIds` acts on the listed `emailId` values and every other criterion is ignored; IMAP accounts ignore `emailIds`.

### Uploads

`POST /v1/account/{account}/message` appends a message to a folder, either from `raw` (a base64-encoded RFC 822 message) or from the structured fields `from`, `to`, `cc`, `bcc`, `subject`, `text`, `html`, `attachments`, `messageId` and `headers`. `path` is required; `flags` and `internalDate` set the stored flags and date, and `reference` turns the upload into a reply or forward of a stored message with the threading headers derived from it. The response carries the new `id`, `path` and `messageId`, plus `uid`, `uidValidity` and `seq` on IMAP accounts, and `reference.success` when a reference was given. Behavior per backend is on [Message Operations](/docs/receiving/message-operations#uploading-messages).

## See Also

- [Message Operations](/docs/receiving/message-operations) - Listing, fetching, moving, flagging, uploading and deleting, with examples per backend
- [Searching Messages](/docs/receiving/searching) - The full search grammar and provider differences
- [Attachments](/docs/receiving/attachments) - Downloading, inline images, and size limits
- [Sending API](/docs/api-reference/sending-api) - Submitting, scheduling, and the outbox
- [Message IDs Explained](/docs/receiving/ids-explained) - How `id`, `uid`, `emailId`, and `messageId` differ
