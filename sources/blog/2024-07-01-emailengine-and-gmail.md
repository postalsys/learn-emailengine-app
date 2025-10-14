---
title: EmailEngine and Gmail
slug: emailengine-and-gmail
date_published: 2024-07-01T20:04:00.000Z
date_updated: 2024-07-09T13:44:49.000Z
tags: EmailEngine, Gmail
excerpt: EmailEngine is an email client for apps. As such, it needs to talk to different email servers. In this post, I'll go through all the possible options there are to integrate Gmail email accounts with EmailEngine.
---

When talking about email servers, you can't ignore the elephant in the room, Gmail. Gmail is so huge that many email startups only cater to Gmail users. It's understandable too. With Gmail, you can use their rather sane API and ignore the mess that is IMAP. API calls are faster and provide more options, especially around labels. TAM is hundreds of millions of users, and so on.

What could go wrong when building on top of such a major player? It turns out, quite a lot.

> Whoa, just got this notice from Google.
> 
> Is this THE END of email warmup services?
> 
> Anybody else offering warmup get this? [pic.twitter.com/TIMeMLfw3H](https://t.co/TIMeMLfw3H)
> — Ajay Goel (@PartTimeSnob) [November 16, 2022](https://twitter.com/PartTimeSnob/status/1592886204709625857?ref_src=twsrc%5Etfw)

This is what might happen if you only depend on Gmail for your business.

[EmailEngine](https://emailengine.app/) tries to cover all email accounts, not only Gmail, and the lowest common denominator is IMAP. Everything is straightforward for most email accounts when using IMAP; you provide EmailEngine with your account username and password, and that's it. With Gmail, it gets more complicated. In this post, I'll explore the options you have when integrating Gmail accounts with EmailEngine.

### Account Password

While Google recently closed password authentication for regular Gmail accounts, it is still available for Google Workspace accounts, at least for now (Google will disable this option by September 30, 2024). There's a condition, though: the account must not have two-factor authentication enabled.

> Password authentication can not be used with APIs, but EmailEngine does not need API access, IMAP and SMTP are password-friendly.

What is an "account password" anyway? It's the main password for your account. The password you input into the login form you see when trying to log in to Google services.
![](__GHOST_URL__/content/images/2022/11/Screenshot-2022-11-17-at-15.03.35-1.png)This authentication form always requires your account password.
To allow using the account password, navigate to your [Google account management page](https://myaccount.google.com/lesssecureapps), look for the "Less secure app access" option, and ensure it is enabled. Once it is, you can log in to IMAP and SMTP using your account password.

> Google runs a lot of heuristics when authenticating, so your authentication attempts might still fail, but the error message from the server should indicate what you'd have to do. Usually, there's an account [unlock link](https://accounts.google.com/b/0/displayunlockcaptcha) you'd have to open in your browser.

![](__GHOST_URL__/content/images/2022/11/Screenshot-2022-11-17-at-14.24.43.png)If password authentication fails, you might need to unlock your Gmail account with this form.
### App Passwords

If you have enabled two-factor authentication for your Google account, you can't use your account password with third-party services like EmailEngine. Instead, you would have to generate [application-specific passwords](https://support.google.com/accounts/answer/185833?hl=en). The app password option is only available for users with two-factor authentication enabled. 

Regular Gmail accounts without two-factor authentication have no means at all to authenticate using a password and must use OAuth2-based authentication – as mentioned above, for Google Workspace accounts, using the account password is still an option.

If the account password is changed, it clears all app passwords as well, and the account is automatically logged out from EmailEngine. You would have to generate a new app password for EmailEngine in order to continue running the integration. Easy if you're the account owner, but annoying if you would have to go and ask for a new app password from your customers.

### OAuth2

> For history nerds, Google also allowed authenticating accounts using OAuth1 back in the day. It was a different scheme, required signing request data with SHA1 HMAC and whatnot, and has not been supported for the last ten years or so.

OAuth2 is what is called the "modern" authentication method by different providers. If you hear "modern," it means OAuth2.

Even though OAuth2 is meant for authenticating API access, it can be used for IMAP and SMTP with the XOAUTH2 SASL authentication method. The client, in this case, EmailEngine, negotiates a new valid access token from Google and uses it as an argument for the XOAUTH2 authentication command.

EmailEngine can use the Gmail API or IMAP and SMTP with OAuth2, depending on application configuration. Using OAuth2 defines the authentication method for these protocols, nothing else.

### "Internal" OAuth2 applications

To use OAuth2, you first need to [create an "application"](__GHOST_URL__/setting-up-gmail-oauth2-for-imap-api/) on the Google Developer site. While doing so, you are provided a choice, should the application be public or internal? In this section, we explore the "internal" option.

In short, internal apps cover all email accounts under the same Google Workspace organization. For example, if you're an admin of *@example.com* and create an internal app, then any email account under the same *@example.com* domain can authenticate and provide you access to their emails. The obvious downside is that users from other Google Workspace organizations and free *@gmail.com* accounts can not authenticate for your app.

For what is internal app type even useful, if most Gmail accounts are automatically excluded? Two words – no audit. Internal apps are managed and validated by the admin of the organization, not Google. If your target is only your organization, you can get the whole OAuth2 experience without hassle, money, or time.

### Service accounts

In other terms, the two-legged OAuth2 mechanism. [Service accounts](__GHOST_URL__/gmail-oauth-service-accounts/) are a special version of internal apps. You still have all the same limitations regular internal apps have, but in the case of service accounts, there is no need to get permission from account users. The admin itself gives access to each email account in the organization.

#### "Public" OAuth2 applications

Unlike internal apps, public apps are accessible to all Gmail accounts. There are two versions of the "public" apps, development and production versions.

**Public development OAuth2 applications**

You do not need to go through the security audit for development apps, but there are major downsides making these apps pretty much useless for any kind of production use.

First, there's a limit for enrolled Gmail accounts. At most, 100 accounts can use your app. And this is not an option for first come, first served until 100 accounts have been reached. Instead, you need to list all these accounts manually in a whitelist. Up to 100 addresses can be added to the whitelist, and anyone not on the list, can't access the app.

And the worst part – OAuth2 grants expire after seven days. This means that once every seven days, all accounts need to re-authenticate themselves.

**Public production OAuth2 applications**

This is the gold standard of Gmail authentication. Any Gmail account can provide access to their emails with a few clicks and seamless UX.

Before rushing to hand in your application, though, there are a few things to consider.

Public production apps that require access to emails require a [thorough security audit](https://support.google.com/cloud/answer/9110914), which takes time and costs a lot of money. The audit reviews several major topics, and you must pass all of these.

1. Is the app "secure." Security, in this case, is measured in OWASP and pentest means.
2. Does the app match the expected use case? Not all app types qualify.
3. Are you asking for the minimum set of permissions to achieve whatever use case you have?

The security topic is the easiest to get right. You just have to write secure code 🫣 Well, at least this topic is the most under your control. You can always hire a better specialist to help you.

The use case match is trickier. There are several app types that might seem legit at first but are blocked by Google nevertheless. For example, email exporters and security scanners.

The minimum permission set requirement is probably the one that will sink your application to get EmailEngine integrated with Gmail accounts. EmailEngine requires access to the highly restricted `"https://mail.google.com/"` OAuth2 scope. This is the only scope that allows access to IMAP and SMTP – the protocols that EmailEngine uses.

Unfortunately, Google would probably consider that scope too wide for whatever use case you have and ask you to use more restrictive scopes. These restrictive scopes, in theory, give you access to the required data but not to IMAP and thus are unusable by EmailEngine. If you can convince Google that the features you need are only available via IMAP, then you *might* pass the review. Obviously, there are no guarantees.

### To sum it up

If you can afford it and you are able to weasel yourself through the verification process, go with the public OAuth2. If you only need to access accounts in your organization, go with internal OAuth2. In every other case, use app passwords. These can be a bit annoying for the users to set up, but app passwords are usable now and here.
