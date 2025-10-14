---
title: IDs explained
slug: ids-explained
date_published: 2024-07-02T18:17:00.000Z
date_updated: 2025-05-19T10:43:10.000Z
tags: EmailEngine, IMAP
excerpt: Unpack EmailEngine’s various message identifiers—id, uid, emailId, and messageId—and learn when and why to use each one.
---

If you’ve used [EmailEngine](https://emailengine.app/) for a while, you’ve probably noticed an abundance of different message identifiers: `id`, `emailId`, `uid`, `messageId`, and—under the hood—a sequence number. They all seem to identify the same thing: an email on an IMAP account. Why so many identifiers? The answer lies in 40 years of IMAP evolution and backward compatibility.

Each identifier serves a distinct role:

- `**id**` – This is the value you use in EmailEngine’s API requests (for example, `"AAAADAAAB40"`). It identifies a specific message entry within a particular folder and never changes *while that message remains in the same folder*. It does **not** identify the email entity itself. If you move an email to another folder, its `id` changes. An old `id` then points to a non-existent entry, even though the message still exists in your account. Internally, EmailEngine encodes the folder path, `UIDValidity`, and the `uid` into this `id`, allowing it to locate the message on the IMAP server.
- **`uid`** – The IMAP **Unique Identifier**. Within each folder (think of it as a database table), `uid` is an auto‑incrementing integer primary key. When you move a message between folders, its original `uid` is deleted and cannot be reused, so the message receives a new `uid`. Because `id` embeds the `uid`, it behaves similarly. Use `uid` when searching message ranges—e.g., a search for `"123:456"` matches all messages with `uid` values from 123 to 456.
- `**emailId**` – A stable identifier for the email entity itself. Unlike `id` and `uid`, this value never changes, even if you move or copy a message. All instances of the same email share the same `emailId`. However, this requires special IMAP extensions supported only by some providers (Gmail, Yahoo, Fastmail, etc.), so it isn’t universally available.
- `**messageId**` – Taken from the email’s `Message-ID` header, this value is *intended* to be globally unique. In practice, uniqueness isn’t enforced—senders can reuse IDs or omit them entirely. Still, a proper `Message-ID` is a reliable indicator: missing or duplicated values often signal spam or suspicious duplicates. Some users rely on `messageId` as their primary identifier and discard emails without one.

> If you want to search by `messageId`, use a header search. For example, to find `Message-ID: <123@abc>`, send this request body to the [Search For Messages](https://api.emailengine.app/#operation/postV1AccountAccountSearch) endpoint:

    {
      "search": {
        "header": { "Message-ID": "<123@abc>" }
      }
    }
    

- **Sequence numbers** – Core to IMAP’s protocol, sequence numbers represent a message’s position within a folder. EmailEngine uses sequence numbers internally but does not expose them through the public API.

In summary, use **`id`** for most API interactions because it’s stable within a folder and simplifies IMAP lookups. When you need server‑level control (like ranged searches), opt for **`uid`**. If your workflow demands a folder‑agnostic identifier, try **`emailId`** (where supported). And for global uniqueness—especially when integrating with third‑party systems—consider **`messageId`**, keeping in mind its caveats.
