<a href="/" id="headerLogo" class="header__logoImg"><img src="lib_pTNsKLAHHUZrxQKE/xwb20trbbhmhskes.png?w=160" width="80" alt="Your Logo" /></a>

[Download](/#downloads)

Using EmailEngine

<a href="https://api.emailengine.app/" target="_blank" rel="noreferer noopener"></a>

API reference

[](/authenticating-api-requests)

Authenticating API requests

[](/hosted-authentication)

Hosted authentication

[](/webhooks)

Webhooks

[](/sending-emails)

Sending emails

[](/supported-account-types)

Supported Account Types

[](/oauth2-configuration)

OAuth2 configuration

[](/bounces)

Bounce detection

[](/email-templates)

Email templates

[](/shared-mailboxes-in-ms-365)

Shared Mailboxes in MS365

[](/virtual-mailing-lists)

Virtual mailing lists and unsubscribe

[](/pre-processing-functions)

Pre-processing functions

Operating EmailEngine

[](/set-up)

Installation instructions

[](/redis)

Redis requirements

[](/configuration)

Configuration options

[](/reset-password)

Reset password

[](/system-d-service)

Run as a SystemD service

[](/docker)

Run as a Docker container

[](/monitoring)

Monitoring

[](/logging)

Log management

[](/local-addresses)

Local IP-addresses

[](/prepared-settings)

Prepared settings

[](/prepared-access-token)

Prepared access token

[](/prepared-license)

Prepared license key

[](/troubleshooting)

Troubleshooting

[](/expose-public-https)

Use Nginx as a proxy

[FAQ](/#faq)<a href="https://docs.emailengine.app/" target="_blank" rel="noreferer noopener">Blog</a>[Support](/support)

<a href="https://postalsys.com/plans" id="btn_yks92isc4j" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

Menu

- <a href="/#downloads" class="drawerLink">Download</a>
- Using EmailEngine
  [](https://api.emailengine.app/)
  API reference
  [](/authenticating-api-requests)
  Authenticating API requests
  [](/hosted-authentication)
  Hosted authentication
  [](/webhooks)
  Webhooks
  [](/sending-emails)
  Sending emails
  [](/supported-account-types)
  Supported Account Types
  [](/oauth2-configuration)
  OAuth2 configuration
  [](/bounces)
  Bounce detection
  [](/email-templates)
  Email templates
  [](/shared-mailboxes-in-ms-365)
  Shared Mailboxes in MS365
  [](/virtual-mailing-lists)
  Virtual mailing lists and unsubscribe
  [](/pre-processing-functions)
  Pre-processing functions
- Operating EmailEngine
  [](/set-up)
  Installation instructions
  [](/redis)
  Redis requirements
  [](/configuration)
  Configuration options
  [](/reset-password)
  Reset password
  [](/system-d-service)
  Run as a SystemD service
  [](/docker)
  Run as a Docker container
  [](/monitoring)
  Monitoring
  [](/logging)
  Log management
  [](/local-addresses)
  Local IP-addresses
  [](/prepared-settings)
  Prepared settings
  [](/prepared-access-token)
  Prepared access token
  [](/prepared-license)
  Prepared license key
  [](/troubleshooting)
  Troubleshooting
  [](/expose-public-https)
  Use Nginx as a proxy
- <a href="/#faq" class="drawerLink">FAQ</a>
- <a href="https://docs.emailengine.app/" class="drawerLink">Blog</a>
- <a href="/support" class="drawerLink">Support</a>
- [](https://postalsys.com/plans)
  Get a license key
  ![](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMiIGhlaWdodD0iMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNTU3IDdIMWExIDEgMCAxIDEgMC0yaDguNTg2TDcuMDA3IDIuNDIxYTEgMSAwIDAgMSAxLjQxNC0xLjQxNGw0LjI0MyA0LjI0M2MuMjAzLjIwMi4zLjQ3LjI5Mi43MzZhLjk5Ny45OTcgMCAwIDEtLjI5Mi43MzVMOC40MiAxMC45NjRBMSAxIDAgMSAxIDcuMDA3IDkuNTVMOS41NTcgN3oiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=)

# Supported Account Types

Email backends that EmailEngine can connect to

EmailEngine supports various email backends to interact with users' email accounts. This document outlines the different protocols and services that EmailEngine can connect to, including their specific requirements and considerations.

## IMAP and SMTP

IMAP and SMTP are the most common protocols used to access email accounts. Nearly every email hosting provider supports these protocols. EmailEngine uses IMAP and SMTP as the default connection methods.

### IMAP and SMTP over OAuth2

Many OAuth2-capable email hosting providers support OAuth2 authentication over IMAP and SMTP. This means that when requesting permissions to access an email account, a standard OAuth2 authorization flow is used. When a user grants EmailEngine permission to access their email account, they are granting access to IMAP and SMTP using OAuth2 tokens rather than traditional username and password authentication.

When EmailEngine establishes an IMAP or SMTP session, it uses the OAUTHBEARER or XOAUTH2 SASL extensions to authenticate, similar to connecting to a regular IMAP or SMTP account.

#### Gmail

For [Gmail](https://docs.emailengine.app/setting-up-gmail-oauth2-for-imap-api/), the required OAuth2 scope is `https://mail.google.com/`. Note that this is a "restricted" scope and requires a mandatory security review. Unless your use case requires the ability to permanently delete emails, it is unlikely that Google will grant you this scope. In such cases, you might want to consider using the Gmail API as the backend instead.

With IMAP and SMTP, Gmail counts data traffic and the number of email recipients. These limit counters are account-wide, meaning that if multiple email clients are connected to the account and collectively download a large amount of data or send emails to many recipients, they might hit the daily data transfer limit. When this limit is reached, IMAP access is blocked for all email clients for that email account.

#### Microsoft 365/Outlook

For [Microsoft 365 (MS365) and Outlook](https://docs.emailengine.app/setting-up-oauth2-with-outlook/), the required OAuth2 scopes are `IMAP.AccessAsUser.All` and `SMTP.Send`. Be aware that many MS365 organizations have the SMTP scope disabled by default. While a user can grant access to it, using SMTP may still fail. In this case, you might want to consider using the MS Graph API as the backend instead.

### Indexing Methods: Full and Fast Indexers

EmailEngine supports two indexing modes when dealing with IMAP accounts: the "full" indexer and the "fast" indexer.

#### Full Indexer

The full indexer builds a comprehensive index of the email account, which is stored in Redis. EmailEngine uses this index to detect new, deleted, and updated emails (such as when an email is marked as seen or unseen). While this method provides the most features, the downside is that the index can consume a significant amount of space in Redis. The indexing process can also be slow when processing email accounts with a large number of emails. In some cases, indexing might take so much time that the IMAP session expires and is closed, causing EmailEngine to fail in properly indexing the emails on that account.

#### Fast Indexer

The fast indexer stores only minimal required information about the state of the email account. There is almost no storage overhead in Redis, and the indexing process is, as the name suggests, fast. The downside is that EmailEngine can only detect new emails but not deleted or modified emails with the fast indexer.

#### Selecting an Indexer

To select an indexer, you can set the preferred indexer in the Service configuration page:

- Navigate to **Configuration \> Service**
- Look for the **Indexing Method for IMAP Accounts** setting

You can also specify the preferred indexer by providing the `imapIndexer` property in the account data when adding a new email account to EmailEngine. If you have not set it, the default preferred indexer setting will be used.

**Note:** Once an indexer is set for an account, it cannot be changed directly. If you want to change the indexer, you need to use the [Account Flush API](https://api.emailengine.app/#operation/putV1AccountAccountFlush) to clear the existing index for that account. You can set the new indexer as part of the request so that once the existing index has been deleted, a new index is configured based on the provided input.

## Gmail API

When [using the Gmail API as the mail backend](https://docs.emailengine.app/setting-up-gmail-api-access/), EmailEngine does not open IMAP or SMTP sessions against Gmail and G Suite. Instead, it makes REST API requests to the Gmail API servers whenever it needs to perform an operation. EmailEngine normalizes all inputs and outputs, so when using EmailEngine's API, it should be transparent whether the backend is an IMAP server or the Gmail API.

To normalize some results, such as listing emails, EmailEngine might need to run multiple API requests instead of a single request, which can be slower.

**Considerations:**

- **Rate Limits:** Gmail API counts API requests for rate limiting. Different API requests have different weights, so specific operations (like listing long pages of emails) might use up the daily allocated quota faster.
- **Application-Specific Limits:** These limits are application-specific. If one connected app uses up its limits, it does not affect other apps connecting to that account.

**OAuth2 Scope:**

- The correct OAuth2 scope for using the Gmail API with EmailEngine is `https://www.googleapis.com/auth/gmail.modify`.

**Notifications:**

- `gmail.modify` is a "restricted" scope and requires a mandatory security review.
- To receive notifications about changes on the email account, EmailEngine needs to set up a Cloud Pub/Sub consumer. Therefore, a service account with the `https://www.googleapis.com/auth/pubsub` scope must also be set up for EmailEngine to use.

## Microsoft Graph API

When [using the Microsoft Graph API as the mail backend](https://docs.emailengine.app/setting-up-oauth2-with-outlook/), EmailEngine does not open IMAP or SMTP sessions against Microsoft 365 (MS365) and Outlook/Hotmail accounts. Instead, it makes REST API requests to the Microsoft Graph API servers whenever it needs to perform an operation.

**Considerations:**

- **Search Capabilities:** Compared to IMAP, using the Microsoft Graph API has somewhat more limited search capabilities. Some search fields that are available for other types of connections are unavailable (for example, the To and Cc fields).
- **Threading Support:** On the upside, the Microsoft Graph API supports threading, allowing you to search for threaded emails from all folders at once, instead of enumerating emails from each folder separately.

**OAuth2 Scopes:**

- The correct OAuth2 scopes for the Microsoft Graph API are `https://graph.microsoft.com/Mail.ReadWrite` and `https://graph.microsoft.com/Mail.Send`.
- **GCC High and DoD Clouds:** Experimentally, EmailEngine can support GCC High and DoD clouds, which have slightly different scopes.

## Other Protocols and Backends

Currently, EmailEngine cannot use other protocols or backends. It does not support POP3, ActiveSync, or proprietary APIs of different email hosting providers.

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
