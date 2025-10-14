---
title: Debugging Webhooks in EmailEngine
slug: debugging-webhooks-in-emailengine
date_published: 2025-05-05T08:41:22.000Z
date_updated: 2025-05-08T07:29:38.000Z
---

Webhooks are the mechanism EmailEngine uses to push account and message events to your application in real time. If you are not receiving the expected notifications, follow the diagnostic flow below to identify the bottleneck.

## 1. Prove that EmailEngine can reach an external endpoint

Start with the simplest external listener so you can observe the raw HTTP requests.

> **Example listener**
> [https://webhook.site/](https://webhook.site/) gives you a temporary URL and a live log of incoming requests.
> **Postal Systems OÜ is not affiliated with webhook.site; we mention it only as a convenient example.**
> Any comparable service—e.g. **requestbin.com**, **pipelines.dev**, or a self‑hosted **ngrok** tunnel—works just as well.

1. Open your chosen listener and copy the unique callback URL.
2. In EmailEngine open **Configuration → Webhooks**.
3. Tick **Enable webhooks**, paste the URL into **Webhook URL**, select **All events**, and save.

If you trigger any event now, the listener page should show a POST request from EmailEngine. If nothing appears, the problem is network level (firewall, proxy, DNS) or a typo in the URL—fix this before proceeding.

## 2. Preserve failed webhook attempts for inspection

By default EmailEngine discards completed and failed jobs immediately, which hides useful error context.

1. Go to **Configuration → Service** and set **Completed/failed queue entries to keep** to **100** (or any non‑zero value).
2. Open **Tools → Bull Board → Webhooks queue**.
- **Delayed** tab – jobs that failed but will be retried automatically.
- **Failed** tab – jobs that exceeded the retry limit.

Open a job to see the full error stack, headers, and payload that EmailEngine sent. This usually reveals TLS errors, 4xx/5xx responses from your server, or JSON parse failures.

## 3. Verify that the event itself exists

Add a fresh mailbox to EmailEngine and wait until its status is **connected**. The listener should immediately receive an **Account initialized** event. If you see it, outbound delivery is working.

Next, send an email *from an external mailbox* to the new account. Within 10‑60 s you should receive a **New message** webhook. If not, continue below.

### 3.1 Is the message in the mailbox at all?

Log in with a regular mail client. If the message landed in *Spam* or *Other* folders, EmailEngine will still detect it, but this quick check rules out delivery issues.

### 3.2 Can EmailEngine see the message?

Run an API request against your EmailEngine to list messages in the INBOX folder.

    curl "https://EMAILENGINE.HOST/v1/account/ACCOUNT_ID/messages?path=INBOX&pageSize=5" \
      -H "Authorization: Bearer ACCESS_TOKEN"
    

Edit EMAILENGINE.HOST, ACCOUNT_ID and ACCESS_TOKEN values

If the received message is missing from the JSON response, the account credentials point to a different mailbox (common with shared accounts) or the OAuth token lacks scope.

## 4. Special requirements for OAuth2 backends

When **Base scopes** is **API** (Gmail API or MS Graph) instead of **IMAP**, EmailEngine relies on provider‑specific push channels.

### 4.1 Gmail API + Cloud Pub/Sub

Open **Configuration → OAuth2**, choose the Gmail OAuth app, and scroll to **Cloud Pub/Sub configuration**. All three items—*Topic*, *Subscription*, *Gmail bindings*—must show **Created** in green. Anything else means the Google Cloud service account is missing IAM roles or the Pub/Sub API is disabled.

### 4.2 MS Graph API subscriptions

Open **Email Accounts**, select the failing account, and scroll to **Change subscription**. The status must be **Created** and the expiration timestamp must be in the future. If not, ensure the Azure app has **Mail.Send** and **offline_access** scopes, and that incoming notifications can reach your EmailEngine host.

If a subscription has not been created, then the most common cause is that your EmailEngine instance is not reachable from the Microsoft Graph servers. Microsoft Graph sends HTTPS requests to these endpoints:

    https://EMAILENGINE.HOST/oauth/msg/lifecycle
    https://EMAILENGINE.HOST/oauth/msg/notification
    

If Graph cannot reach those URLs, for example, if you are serving plain HTTP, your TLS certificates are invalid, **EMAILENGINE.HOST** does not resolve to your instance (set in **Configuration→Service→ServiceURL**), or outbound connections are firewalled, then new‑message webhooks for Graph accounts will fail.

For IMAP accounts, EmailEngine detects new messages on its own. For API back‑ends such as Microsoft Graph, EmailEngine depends on the provider’s webhooks, so external connectivity is mandatory.

## 5. Recap

- **No request at the listener?** Check the network path and ensure EmailEngine is allowed to reach the URL.
- **Job in Failed tab?** Inspect the stack trace for HTTP/TLS problems.
- **Message not visible via API?** Verify mailbox credentials and OAuth scopes.
- **Using Gmail/MS Graph?** Confirm Pub/Sub or Graph subscription set‑up.

Working through the steps above in order narrows the fault domain quickly and gets your integration back to real‑time status updates.
