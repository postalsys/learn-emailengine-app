---
title: Shared MS365 mailboxes with EmailEngine
slug: shared-ms365-mailboxes-with-emailengine
date_published: 2023-05-19T13:14:34.000Z
date_updated: 2024-11-11T07:31:57.000Z
tags: EmailEngine, Outlook
---

EmailEngine is capable of using MS365 shared mailboxes via OAuth2. This involves adding the shared mailbox to EmailEngine, while the OAuth2 authentication process is handled by a user who already has access to the mentioned mailbox.

However, there is a disadvantage to this. At present, EmailEngine anticipates that each OAuth2 account corresponds to a single email account within the system. Therefore, if an MS365 user has granted access to a shared mailbox for EmailEngine, they cannot use the same account to authorize a different shared mailbox, or their own primary account.

Below are the instructions to integrate a shared mailbox with EmailEngine.

Begin by requesting an [authentication form URL](https://emailengine.app/hosted-authentication) from EmailEngine.

    curl -XPOST \
      "https://emailengine.example.com/v1/authentication/form" \
      -H "Authorization: Bearer 990db3b95f8b04ab…678bff3b98462a" \
      -H 'Content-Type: application/json' \
      -d '{
        "account": "shared",
        "name": "Shared Account",
        "email": "shared@example.com",
        "delegated": true,
        "redirectUrl": "https://myapp/account/settings.php",
        "type": "AAABiCtT7XUAAAAF"
      }'
    

Fields:

- **account**: The account ID you intend to use
- **name**: The displayed name of the shared mailbox
- **email**: The email address of the shared mailbox, such as *"[info@example.com](info@example.com)"* or *"[sales@example.com](sales@example.com)"*
- **delegated**: Must be set to `true`. This indicates to EmailEngine that the authorizing user is not the email account being used to sign in
- **redirectUrl**: The URL where the user will be redirected once authentication is complete
- **type**: The ID of the OAuth application in EmailEngine

![](https://cldup.com/IVrLyCqaBc.png)The value for the "type" field is the ID of the OAuth2 app in EmailEngine
The above API call will return the URL that the user should be directed to.

    {"url":"https://emailengine.example.com/accounts/new?data=eyJhY2NvdW50Ijoic2hhcmVkIiwibmFtZSI…T_0AAAAE"}
    

The user in charge of authentication should visit this URL and sign in using their actual MS365 email account. It is crucial that this account has access to the shared mailbox, otherwise, the process will not be successful.

> **NB!** at this point EmailEngine does not support account credential re-use. If you authenticate shared@host using user@host, then you can't use user@host to authenticate any other accounts, including the main account for user@host.
