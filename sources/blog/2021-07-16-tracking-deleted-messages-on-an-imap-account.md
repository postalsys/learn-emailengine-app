---
title: Tracking deleted messages on an IMAP account
slug: tracking-deleted-messages-on-an-imap-account
date_published: 2021-07-16T11:35:27.000Z
date_updated: 2021-12-02T10:25:34.000Z
tags: IMAP, IMAP API, EmailEngine
excerpt: While it is pretty easy to get the current snapshot state of a mailbox, and it is not hard to track new emails coming in, one particular change is usually quite challenging to follow. That is message deletions.
---

The most common use case for programmatically accessing an IMAP account is taking an IMAP library, logging in to the email account, and listing existing messages in a folder. This happens, for example,  when you log in to some webmail application to see your emails. The application gets a snapshot of the current state of the email account. Simple.

Another common use case is tracking changes on an email account and somehow displaying or recording these changes, e.g., incremental backups or synchronization.

While it is pretty easy to get the current snapshot, and it is not hard to track new emails coming in, one particular change is usually quite challenging to follow. That is *message deletions*.

Sure, we can enter into IDLE state or start a NOOP-loop and listen for those EXPUNGE notifications coming in but consider the following:

- IDLE and NOOP apply for a single folder only. You only see what is happening in the currently opened folder.
- IMAP connection counts are usually limited; realistically, you can't open a separate connection for each folder. While some servers don't have strict limitations, some significant providers like Gmail heavily limit simultaneous connections, so you run out of available connections long before running out of folders to monitor. 
- Reconnects happen, both because of network issues and also forced logouts. When logged in again, you don't get notifications for the events while you were disconnected.
- Even if you get EXPUNGE notifications, these are against sequence numbers, not against UID's, so you must be super sure that the sequence number on your end corresponds to what the server thinks it is.

So what to do to overcome these nuisances?

### Was something even deleted?

The first thing is to check is if something has even been deleted from the folder—no need to do anything if all the messages are still there.

IMAP servers expose a value called UIDNEXT, which is the predicted UID value of the following message stored in that folder. Usually, it is the latest UID + 1. Suppose we keep the combination of the count of stored messages and the UIDNEXT value and later come back, and both values are still the same. In that case, we can be reasonably confident that the server deleted no messages while we were away.

Some servers support the CONDSTORE extension ([RFC7162](https://datatracker.ietf.org/doc/html/rfc7162)) that exposes a MODSEQ value for each folder. MODSEQ is a number that increments any time something changes with the contents of that folder. If we track the MODSEQ value, and it hasn't changed, then it means that the server has not deleted any messages from the folder.

MODSEQ does not track only deletions but everything on the folder, including *Seen/Unseen* flag updates, so the value changes often.

> In fact, there's even a better extension called QRESYNC that returns a list of "vanished" messages once a folder has been opened but it's not supported widely enough that we could actually rely on it.

### Sequence numbers

When receiving those EXPUNGE notifications, the server does not give you a UID value but a sequence number of the deleted message, so we need to know the sequence of the messages. Otherwise, we would be marking wrong messages as being deleted. 

    A IDLE
    + idling
    * 4 EXPUNGE
    * 4 EXPUNGE
    * 4 EXPUNGE
    * 2446 EXISTS
    

The server deleted message number 4 three times? Wut? This maps to messages from numbers 4 to 6 – every time a message is deleted, the sequence listing changes, and the same position is given to the following message.
The easiest (not the best, though) way to map sequence numbers with UID values would be to issue a UID SEARCH ALL command immediately after a folder is opened and store the returned list in sorted order.

    A UID SEARCH ALL
    * SEARCH 556 561 562 ... 3110 3111 3112 3113
    A OK SEARCH completed (Success)
    

The message with UID 556 has sequence position 1, UID 561 has sequence position 2, etc.
If we get an EXPUNGE notification, we treat the sequence list as a 1-based array, read the UID value from the sequence position, and remove that element from the list. This way, we know the UID of the deleted message and also keep the sequencing in sync.

### Diff

Suppose we have detected an anomaly between the expected message count and actual message count when opening a folder (message count is smaller than it used to be, or UIDNEXT value has grown, but message count has not). 

In that case, we can assume that the server has deleted something. We do not know which messages the server has deleted as we did not receive any EXPUNGE notifications; we only see a list of messages still there but no indication of what happened when the folder was closed.

The most straightforward approach would be to compare the last known UID sequence list discussed in the previous point against a new UID SEARCH ALL command result.

This approach assumes that we did store the UID sequence list and have kept it updated. Anything listed in our stored list but missing in the server-provided list has been deleted, and anything listed in the server response but missing in our stored list is a new message.

> While we are using UID SEARCH ALL here to generate our sequence list, this does not scale well in production. That command returns the listing of all messages in a single response but modern INBOX folders might contain hundreds of thousands of messages.

And that's it; this is how "easy" it is to track deleted messages on an IMAP account. Our lives would be better with the QRESYNC extension, but you have what you have (and you don't have widely adopted QRESYNC).

Alternatively, suppose you do not want to implement IMAP tracking logic on your own. In that case, you can use something like [EmailEngine](https://emailengine.app/) that does the tracking itself and notifies you of every change on the account via web-hooks.
