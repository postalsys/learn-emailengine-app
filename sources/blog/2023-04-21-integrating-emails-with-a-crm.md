---
title: Integrating email with a CRM
slug: integrating-emails-with-a-crm
date_published: 2023-04-21T09:23:26.000Z
date_updated: 2023-04-24T06:27:00.000Z
tags: EmailEngine, Integrations, CRM
---

[EmailEngine](https://emailengine.app/) is frequently utilized by smaller, niche CRM systems for email integration, such as those designed for managing donations at a church or coordinating influencers for marketing campaigns.

When integrating email with a CRM system, it typically involves connecting the CRM users' email accounts to the platform. This integration provides two key benefits. Firstly, users can send emails directly from the CRM to their contacts while maintaining their personal identity. Secondly, the CRM actively monitors the connected email account, identifying and tracking email exchanges with CRM contacts. In this blog post, we will explore various aspects of using EmailEngine as the integration layer for this process.

### Connecting email accounts

To integrate EmailEngine with email accounts, you'll first need to register the email server settings and credentials for each account. While this can be done using a [simple API call](https://api.emailengine.app/#operation/postV1Account), you might not have the necessary credentials initially. One solution is to request them through the CRM user interface, but a slightly more convenient option is to use the built-in authentication form feature in EmailEngine.

In this case, you'll [generate a specific authentication](https://api.emailengine.app/#operation/postV1AuthenticationForm) form URL and direct your user to it. This form enables the user to input their email server details or, for OAuth2, navigate to the OAuth2 permissions page. EmailEngine then encrypts and stores the email account credentials and starts email synchronization for that account. By utilizing this method, your application never handles any passwords or OAuth tokens, as EmailEngine manages everything internally.

Since our primary focus is on incoming and sent emails, there's an additional factor to consider. Email servers immediately notify EmailEngine about new emails in the primary folder (usually the Inbox), but for secondary folders, EmailEngine relies on polling. If a CRM user sends an email to a prospect and receives a response within a few minutes, EmailEngine might detect the incoming reply but not the initial sent email, as it hasn't yet polled the sent mail folder.

To address this issue, EmailEngine supports a feature called [sub-connections](__GHOST_URL__/measuging-inbox-spam-placement/). With sub-connections, you can configure additional folders to be treated as primary, enabling EmailEngine to receive instant notifications for them as well. However, sub-connections open extra IMAP sessions, and since parallel IMAP connections for an account are typically limited, you should only list the folders you genuinely need information about, rather than including everything "just in case."

When specifying the folders, you can use special use flags instead of absolute path names, allowing EmailEngine to determine the exact path automatically. The special use flag for Sent Mail folders is `\Sent`.

    curl -XPOST \
      "https://ee.example.com/v1/authentication/form" \
      -H "Authorization: Bearer <TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{
        "account": "USER_ID",
        "name": "User Name",
        "email": "user@example.com",
        "subconnections": [
          "\\Sent"
        ],
        "redirectUrl": "https://myapp/account/settings.php"
      }'

For more efficient management, use the same `USER_ID` value for the user as in the CRM system. The `redirectUrl` is the URL to which the user is redirected once the authentication process is complete.
EmailEngine returns the authentication form URL in the API response. Redirect the user's browser to that URL to initiate the authentication process.

    {
      "url": "https://ee.example.com/accounts/new?data=eyJhY2NvdW50Ijo..."
    }

![](__GHOST_URL__/content/images/2023/04/Screen-Capture-005---EmailEngine---emailengine.srv.dev.jpg)

![](__GHOST_URL__/content/images/2023/04/Screen-Capture-006---EmailEngine---emailengine.srv.dev.jpg)

![](__GHOST_URL__/content/images/2023/04/Screen-Capture-007---EmailEngine---emailengine.srv.dev.jpg)

Using the authentication form
After the authentication and initial synchronization are complete, and the email account has reached the "connected" state, you can begin using the account to receive and send emails through the CRM system.

### Listening for webhooks

To receive notifications about incoming and sent emails, you need to enable webhook sending from EmailEngine. Start by creating a webhook handling endpoint in your CRM that accepts JSON payloads, and then configure EmailEngine's webhook settings to use that URL as the destination for webhooks. While EmailEngine supports notifications for various events, it's recommended to select only the "New email" checkbox to reduce the load. Despite the event name, it also covers sent emails.

This event triggers a webhook whenever an email is added to a folder on the email server. If the folder is "Inbox," it signifies an incoming email, whereas if it's "Sent Mail," it indicates a sent email. Email servers don't provide information about actual email transactions, such as email delivery details. Instead, emails are added to corresponding folders, and we can use this information to deduce what just occurred.

### Classifying new emails as received, sent, and seen

What complicates matters is that any email added to a folder always appears as "new." This means that when a user moves an email from the Inbox to the Spam folder, it seems as if the email was deleted from the Inbox and an entirely new, unrelated email was added to the Spam folder. Email IDs are not persistent, and a new ID is assigned to the email each time it is moved from one folder to another. Consequently, if the user moves the email back to the Inbox, it appears as if a new email was received from a contact, even though it has already been processed.

Gmail and Yahoo accounts offer a unique `emailId` property that remains unchanged and persists as the message moves between folders. However, most other email servers do not support this feature. Therefore, the most practical approach to track what is new and what is not is to use the `messageId` property, which contains the value from the *Message-ID* header of the email.

For example, consider the following webhook payload for a new email:

    {
      "account": "USER_ID",
      "date": "2023-04-21T08:08:47.884Z",
      "path": "INBOX",
      "specialUse": "\\Inbox",
      "event": "messageNew",
      "data": {
        "id": "AAAARgAACMA",
        "uid": 2240,
        "from": {
          "name": "Sender Name",
          "address": "sender@example.com"
        },
        "to": [
          {
            "name": "",
            "address": "user@example.com"
          }
        ],
        "subject": "Hello world!",
        "messageId": "<01000187a29df5a2@example.com>",
        "messageSpecialUse": "\\Inbox",
        "threadId": "3d3e3d89-fc5b-4336-a454-a3ce280d849c"
      }
    }

There are two main aspects to consider. First, the `data.messageSpecialUse` property, which defines the primary special folder for a particular email. This is necessary instead of using the `path` root property because, in servers like Gmail, the same message can appear in multiple folders simultaneously, and we need to identify a specific main folder for that email. If the value is `\Inbox`, we can consider it as an incoming email, and if it's `\Sent`, we can consider it a sent email, regardless of the actual folder paths. There are other special folders like `\Junk` and `\Trash`. Regular, user-created folders do not have this flag set.

> When dealing with the Inbox folder, everything is usually clear. However, issues may arise if EmailEngine fails to accurately identify the Sent Mail folder. Most servers today advertise the folder path to clients, but not all do. In such cases, EmailEngine relies on the folder name to determine if it has any special conditions. Occasionally, there may be multiple folders like Sent, Sent Messages, Sent Emails, etc., and the folder EmailEngine selects for sent emails might not be the one the user actually employs. To address this, you can allow the user to choose the correct folder and [set it](https://api.emailengine.app/#operation/putV1AccountAccount) as the `imap.sentMailPath` property for their account.

The second aspect to consider is `data.messageId`. We will use this as an identifier to detect emails that have already been processed.

To manage this, we need a local registry of some sort. The example below demonstrates the creation of a SQL table that stores a set of user ID and message ID values:

    CREATE TABLE message_registry (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id VARCHAR(255),
      message_id VARCHAR(255),
      UNIQUE KEY user_message_idx (user_id, message_id)
    );

Whenever we receive a webhook about a new email we can then try to insert it as a row to the table.

    INSERT IGNORE INTO message_registry (user_id, message_id) 
      VALUES ('USER_ID', '<01000187a29df5a2@example.com>');

In the context of the SQL table created earlier, when you insert a row with a user ID and message ID combination and 1 row is added, it indicates that the email is new and hasn't been seen before. If no rows are added, it means that this specific email has been seen previously, as the `UNIQUE` constraint prevents duplicate entries for the same user ID and message ID combination.

> `messageId` might be empty in some cases. It is usually safe to completely ignore these emails because this is a clear indication of a spam email.

### Processing emails

After determining whether an email is a new message and whether it's incoming or sent, we can proceed with processing it.

In general, we need to consider two types of emails: incoming and outgoing, each requiring a different approach to identify the related parties.

> For classifying an email as incoming, you may consider any email that isn't in the Sent Mail folder and is relatively new as incoming. This is because users might have filters redirecting specific emails to folders other than the Inbox. However, be sure to ignore any new emails marked as drafts, either with the `data.messageSpecialUse` property set to `\Drafts` or the `data.flags` array containing `\Draft`. Email messages are immutable, so when a user makes changes to a draft, the email client will delete the previous version and upload a new one, triggering an event for a deleted email and a new email.

When it comes to incoming emails, the primary focus should be on the *From* address. Although there might occasionally be multiple *From* addresses, there is usually only one, and EmailEngine normalizes the *From* header into a single entry, not an array value. EmailEngine provides this information through the `data.from.address` property. The address may sometimes be empty, but you can ignore these emails since they are usually system-generated notifications rather than genuine correspondence.

Compare the From address with the user's contacts stored in the CRM. If there is a match, treat it as if that contact sent an email to the user. Then, record it in the CRM as an email activity associated with that contact.

For sent emails, the process becomes slightly more complex. This is primarily because, unlike incoming emails which typically have just one sender, sent emails can have multiple recipients, each potentially being a valid contact in the CRM.

Extract all email addresses from the To and CC fields and cross-reference them with the contact list in the CRM. For each match, create a separate email activity entry (or just one entry if your CRM supports multi-participant activities).

With this setup, we are now ready to process emails for CRM users. Incoming and outgoing emails are logged as activities for corresponding contacts in the CRM. Furthermore, we can enable sending emails directly from the CRM interface by utilizing the EmailEngine's email [submission API](https://api.emailengine.app/#tag/Submit) endpoint.

### More on this topic

- [Performance tuning EmailEngine](__GHOST_URL__/tuning-performance/) when going in production
- [Data and security complianc](__GHOST_URL__/data-compliance/)e with EmailEngine. What exactly is stored, and what do you need to consider.
