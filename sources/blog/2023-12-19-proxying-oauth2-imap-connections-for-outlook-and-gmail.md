---
title: Proxying OAuth2 IMAP connections for Outlook and Gmail
slug: proxying-oauth2-imap-connections-for-outlook-and-gmail
date_published: 2023-12-19T05:40:00.000Z
date_updated: 2025-05-13T16:39:23.000Z
tags: EmailEngine, IMAP, Outlook, Gmail
---

Major email providers are deprecating password-based authentication for protocols like IMAP and SMTP. While iCloud supports application-specific passwords, Gmail and Outlook are shifting toward OAuth2 for increased security. This is great for end-user protection but adds complexity for developers: automated scripts need a way to fetch and refresh OAuth2 tokens without exposing account passwords.

> **Note:** You can learn how to manage OAuth2 tokens with EmailEngine [here](__GHOST_URL__/using-emailengine-to-manage-oauth2-tokens/).

However, even with a valid token, not all IMAP client libraries support OAuth2 natively. And you probably don't want your actual account password or long-lived tokens stored on every server running your scripts.

## IMAP Proxying with EmailEngine

EmailEngine provides a built-in IMAP proxy interface to solve these challenges. Your application connects to the proxy as if it were a standard IMAP server, authenticates with a short-lived token (not a password), and EmailEngine handles the OAuth2 or password login to the real server behind the scenes.

> **Important:** Proxying only works for accounts using IMAP authentication. Accounts using the Gmail API or Microsoft Graph API cannot be proxied.

Under the hood:

1. EmailEngine looks up the credentials for `<account>` in its database (password or OAuth2).
2. EmailEngine establishes a real IMAP session with the upstream server.
3. The proxy relays the IMAP session back to your client.

Your script connects to the EmailEngine IMAP proxy and sends:

    A LOGIN <account> <token>
    

You can also rotate or revoke tokens at any time via the EmailEngine API and enforce IP restrictions on token usage.

## 1. Enable the IMAP Proxy Interface

In the EmailEngine dashboard, go to **Config → IMAP Proxy Interface** and configure:

- **Host**: `0.0.0.0` (to allow external connections).
- **Port**: e.g. `2993`.
- **TLS**: Enable with your certificate for secure connections.

After saving, EmailEngine will spawn the proxy server on the specified host and port.

### Verify the Proxy is Running

**With TLS** (`openssl s_client`):

    $ openssl s_client -crlf -connect localhost:2993
    ...certificate details...
    * OK EmailEngine IMAP Proxy ready for requests from 127.0.0.1
    

**Without TLS** (telnet or `nc`):

    $ nc -C localhost 2993
    * OK EmailEngine IMAP Proxy ready for requests from 127.0.0.1
    

## 2. Generate a Token for IMAP Login

Use the EmailEngine REST API to create an access token scoped to `imap-proxy`. You can also restrict which IP addresses may use it.

    curl -X POST http://127.0.0.1:3000/v1/token \
      -H "Authorization: Bearer <ROOT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{
        "account": "example",
        "scopes": ["imap-proxy"],
        "description": "IMAP proxy token for backups",
        "restrictions": {
          "addresses": ["127.0.0.0/8"]
        }
      }'
    

Response:

    {
      "token": "6cad01dae08...458576a026c1ec"
    }
    

## 3. Authenticate via the Proxy

Connect and authenticate to the proxy using the token as your IMAP password:

    A LOGIN example 6cad01dae08...458576a026c1ec
    * CAPABILITY IMAP4rev1 LITERAL+ SASL-IR LOGIN-REFERRALS ID ENABLE IDLE SORT SORT=DISPLAY
    A OK example authenticated
    

If an IP restriction is violated, you'll see an error:

    A LOGIN example 6cad01dae08...458576a026c1ec
    A NO [AUTHENTICATIONFAILED] Access denied, traffic not accepted from this IP
    

## 4. Revoke a Token

To invalidate an existing token:

    curl -X DELETE http://127.0.0.1:3000/v1/token/6cad01dae08...458576a026c1ec
    

Response:

    {
      "deleted": true
    }
    

## 5. Using with Standard Email Clients

If you also enable the SMTP proxy and issue a token with both `imap-proxy` and `smtp` scopes, you can configure any email client (e.g., Thunderbird, Outlook) to use EmailEngine as the server for both IMAP and SMTP.
![EmailEngine proxying iCloud in Thunderbird](__GHOST_URL__/content/images/2022/08/Screenshot-2022-08-24-at-13.09.26.png)
---

For a walkthrough of setting up and using the IMAP proxy, watch the screencast below.
