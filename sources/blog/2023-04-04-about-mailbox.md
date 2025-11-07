---
title: Special use mailbox folders
slug: about-mailbox
date_published: 2023-04-04T13:06:45.000Z
date_updated: 2025-01-15T11:12:42.000Z
---

A common area of confusion in IMAP involves mailbox folders, such as the requirements and standards for them. In this post, I aim to provide some clarity on this topic.

Although many of us are familiar with a standard set of folders like *Inbox*, *Sent Mail*, *Drafts*, etc., only one folder is actually guaranteed to be present on an email account: *INBOX*. It is entirely valid for an account to have just one INBOX and no other folders. Additionally, the INBOX folder is unique in that its name is case-insensitive, while all other folder names are case-sensitive.

When dealing with a more extensive set of folders beyond just INBOX, it can be challenging to determine the purpose of each folder. For example, if we see a folder named "Sent emails," we may assume it's meant for storing sent emails. However, what if the account uses a different language? Would you recognize that "Saadetud kirjad" serves the same purpose?

In the past, it was up to the email client to determine each folder's function. Different clients might have their own naming preferences for specific folders. This is why older email accounts often have multiple folders with similar names like *"Sent messages,"**"Sent mail,"* and *"Sent emails."* Each email client the user had previously used would create a folder based on its preferred naming convention.

Modern and updated email servers can provide hints to clients about the purpose of each folder. EmailEngine makes these hints available through the `specialUse` mailbox flag. For example, if the server specifies a folder's special use flag as `\Sent`, it indicates that the folder should be used for sent emails, regardless of its actual name. Similarly, a folder with the `\Trash` special use flag should be used for storing deleted emails, and so forth.

In cases where email servers do not provide hints about the purpose of folders, clients must continue to make educated guesses. EmailEngine utilizes a list of common names for each function type in various languages to identify the intended use of folders. However, unlike many traditional email clients, EmailEngine does not attempt to create a specific folder if it fails to detect one for a particular function.

To convey information about folder functions, EmailEngine relies on the `specialUse` flag property that you can find in the [mailbox listing response](https://api.emailengine.app/#operation/getV1AccountAccountMailboxes). Additionally, EmailEngine indicates the source of this information using the `specialUseSource` property.

    {
      "path": "[Gmail]/Sent Mail",
      "delimiter": "/",
      "listed": true,
      "name": "Sent Mail",
      "subscribed": true,
      "specialUse": "\\Sent",
      "specialUseSource": "extension",
      "parentPath": "[Gmail]",
      "messages": 1901,
      "uidNext": 2485
    }
    

This folder entry is intended for storing sent emails. The mail server provided the folder's function, EmailEngine did not determine it through guessing.

The possible `specialUse` values include:

1. `\Inbox`: This is a non-standard special-use flag assigned to the INBOX folder by EmailEngine.
2. `\Sent`: Represents sent mail.
3. `\Trash`: Designates folders for deleted emails.
4. `\Junk`: Indicates folders for spam emails.
5. `\Drafts`: Used for draft emails.
6. `\Archive`: Represents an archive, but the actual meaning of "Archive" depends on the specific mail server implementation.
7. `\All`: A virtual folder containing all emails, typically excluding those from Trash and Junk folders.

The `specialUseSource` property can have one of the following values:

1. `user`: Indicates that you defined the default path for a specific action yourself using the account create/update API call (e.g., `"imap.sentMailPath":"Some/Path"`). Custom definitions take precedence over all other sources.
2. `extension`: Represents that the email server provided a hint about the folder's function.
3. `name`: Signifies that the server did not provide a hint, and EmailEngine determined the folder's function based on its name.

It is important to note that EmailEngine does not automatically create any folders on its own. If the server fails to provide a hint regarding a sent emails folder, and no folder exists with a name similar to *"Sent mail,"* the mailbox listing will not include any folder bearing the `\Sent` special use flag.

If you want to override special use folders for an account, you can use the following account update payload:

    {
      "imap": {
        "partial": true,
        "sentMailPath": "path/to/sent mail",
        "draftsMailPath": "path/to/drafts",
        "junkMailPath": "path/to/spam folder",
        "trashMailPath": "path/to/deleted emails"
       }
    }

When updating IMAP or SMTP settings, make sure to set the `partial` option to `true`. Otherwise, the configuration block will override the entire IMAP or SMTP configuration instead of merging the updated values with the existing ones.
