---
title: Measuring Inbox/Spam placement
slug: measuging-inbox-spam-placement
date_published: 2023-02-27T08:10:00.000Z
date_updated: 2023-02-27T10:05:51.000Z
tags: IMAP, IMAP API, EmailEngine
---

One common use case for syncing an IMAP mailbox with EmailEngine is to measure if emails are going to INBOX (in Gmail's case, to the primary or promotions tab) or to the Spam folder. This way, we can send test emails to that account and see what the email service provider thinks of us. Does the email end up in the INBOX or the Spam folder?

Such an analysis differs slightly from normal syncing as we want to get the results immediately. It is simpler with INBOX placement as EmailEngine is already following that folder to get live updates. With the Spam folder, EmailEngine has to perform periodic polling checks to detect new messages, which always happens with a noticeable delay and is far from immediate.

This is because an IMAP client can only subscribe to a single folder at a time. So EmailEngine subscribes to Inbox, or in the case of Gmail, to the "All Mail" folder and regularly polls the rest of the folders. Spam messages are not part of the "All Mail" in Gmail, so polling applies to these messages as well.

The solution is to use the sub-connections feature of EmailEngine. You can specify additional path names for EmailEngine to subscribe to. It means that EmailEngine would set up additional IMAP sessions for these folders. This way, IMAP servers can notify EmailEngine about changes for each folder separately, and there would be no need for polling anymore.

> Parallel IMAP connections for an email account are usually heavily limited by email hosting providers (Gmail allows just 15 IMAP connections at a time), so use these sub-connections sparingly. EmailEngine prioritizes the primary connection and only tries to set up sub-connections if the primary session has been established.

The `subconnections` array is an account property. It takes a list of folder paths or special-use flags, so if you know you are interested in the spam folder, you can use the `\Junk` flag instead of the actual folder path to the spam messages. EmailEngine would resolve that path itself.

    curl -XPOST "http://127.0.0.1:7003/v1/account" \
      -H "content-type: application/json" \
      -d '{
        "account": "jeremie.bahringer80",
        "name": "Jeremie Bahringer",
        "email": "jeremie.bahringer80@ethereal.email",
        "imap": {
            "host": "imap.ethereal.email",
            "port": 993,
            "secure": true,
            "auth": {
                "user": "jeremie.bahringer80@ethereal.email",
                "pass": "v5x5PH2vhs8bbwY6qD"
            }
        },
        "subconnections": ["\\Junk"]
    }'
    

You can see all connected sub-connections in the web UI under the IMAP section of an account. EmailEngine skips unneeded connections, so if you ask for an INBOX as a sub-connection and EmailEngine has already subscribed to it, then INBOX does not appear in the sub-connections list.
![](__GHOST_URL__/content/images/2023/02/Screenshot-2023-02-27-at-11.48.41.png)
### Gmail category tabs

Gmail sorts all emails in the INBOX into different categories that are shown as category tabs in the Gmail webmail.
![](__GHOST_URL__/content/images/2023/02/Screenshot-2023-02-27-at-11.52.29.png)
EmailEngine can also resolve the category for all INBOX emails, but it is not done by default as it requires running additional IMAP commands for every incoming email, which makes email processing slightly slower. Not an issue with low-activity mailboxes, but it could have a noticeable effect on email accounts that process many emails.

To use category detection, enable this feature in *Configuration* → *Service* → *Labs* section. Once it is enabled, all `messageNew` webhooks for Inbox emails will include a new property `category` with the category ID (`social`, `promotions`, `updates`, `forums`, or `primary`).
![](__GHOST_URL__/content/images/2023/02/Screenshot-2023-02-27-at-11.50.10.png)
