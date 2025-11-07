---
title: Mailbox locking in ImapFlow
slug: mailbox-locking-in-imapflow
date_published: 2021-07-19T07:57:17.000Z
date_updated: 2021-11-29T09:43:41.000Z
tags: ImapFlow, IMAP
excerpt: ImapFlow library allows to open folders in an IMAP account via two different methods, that are mailboxOpen(path) and getMailboxLock(path). What is the actual difference and why would you need something like that?
---

> [ImapFlow](https://imapflow.com/) is an IMAP access module for Node.js. It is used by IMAP API under the hood to make connections to IMAP servers and to run commands.

ImapFlow library allows opening folders in an IMAP account via two different methods, which are [*mailboxOpen(path)*](https://imapflow.com/module-imapflow-ImapFlow.html#mailboxOpen) and [*getMailboxLock(path)*](https://imapflow.com/module-imapflow-ImapFlow.html#getMailboxLock). What is the actual difference and why would you need something like that?

Think of the following. More or less at the same time, maybe due to user actions, our application tries to list all unseen emails in Inbox and delete all emails in Trash. These are the functions we run at the same time using the same IMAP connection:

    async function listUnseen(path){
        await imap.openBox(path);
        let list = await imap.search('1:*', 'UNSEEN');
        return list;
    }
    
    async function deleteAll(path){
        await imap.openBox(path);
        await imap.addFlags('1:*', '\\Deleted');
        await imap.expunge();
    }
    

IMAP connection does not run commands in parallel, you always have to wait until the previous command finishes until you can run the next one. So it is easy to see that we are running into conflicts if we queue a bunch of commands at the same time and then try to run these:
List all unseenDelete all from Trash*idle*`SELECT Trash`*waiting*`OK selected Trash``SELECT INBOX`*waiting*`OK selected INBOX`*waiting**waiting*`STORE 1:* (\Deleted)`*waiting*`OK store completed``SEARCH UNSEEN`*waiting*`* SEARCH 1,2,…`*waiting*`OK search completed`*waiting**idle*`EXPUNGE`*idle*`* 1 EXPUNGE…`*idle*`OK expunge completed`
So what happened here was that we actually deleted all the emails in the INBOX and not from the Trash. Not exactly what we wanted, isn't it?

ImapFlow tries to address this issue by using mailbox locking. You lock the mailbox, run your commands and release the lock. All other actions must wait until the lock is released. So it is kind of like a soft transaction, except that it does not roll back if exceptions occur.

After small modifications our code now looks like this:

    async function listUnseen(path){
        let lock = await client.getMailboxLock(path);
        try {
            return await client.await client.search({unseen: true});
        } finally {
            lock.release();
        }
    }
    
    async function deleteAll(path){
        let lock = await client.getMailboxLock(path);
        try {
            await client.messageDelete('1:*');
        } finally {
            lock.release();
        }
    }
    

This time commands can not be queued at the same time and the resulting action seems different:
List all unseenDelete all from Trash*idle*`SELECT Trash`*waiting*`OK selected Trash`*waiting*`STORE 1:* (\Deleted)`*waiting*`OK store completed`*waiting*`EXPUNGE`*waiting*`* 1 EXPUNGE…`*waiting*`OK expunge completed``SELECT INBOX`*idle*`OK selected INBOX`*idle*`SEARCH UNSEEN`*idle*`* SEARCH 1,2,…`*idle*`OK search completed`*idle*
So what happens is that operations become slightly slower as they need to wait until all other actions are finished but there aren't any more conflicts and we do not end up deleting messages from the wrong folder.
