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

<a href="https://postalsys.com/plans" id="btn_g721oh9643k" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Troubleshooting

When things go wrong

## Accounts do not connect

**Symptom**: when starting EmailEngine, most accounts stay disconnected and do not recover.

**Potential issue:** Redis is out of space.

EmailEngine uses Redis to store all its data. If Redis runs out of maximum allocated storage, EmailEngine can not write to Redis anymore. Creating connections will fail, as writing connection state information to Redis is part of the operation.

Check the `redis_memory_used_bytes` and `redis_memory_max_bytes` in the [monitoring output](https://emailengine.app/monitoring) to see how much space Redis uses.

## EmailEngine not accessible

**Symptom:** EmailEngine stops processing requests. The reverse proxy might report 502 errors.

**Potential issue:** EmailEngine has exhausted the maximum open files limit.

EmailEngine opens a lot of TCP connections which all use up file descriptors. Operating systems apply a maximum allowed open files limit to applications, and EmailEngine might run into that limit. As web requests also require opening sockets that are counted against the open file limit, these requests can not be served.

If the maximum open files limit is reached, you should see `EMFILE` errors in the application output log.

Check the `ulimit -n` value and increase it if it is too small. If running EmailEngine as a SystemD service, use the [LimitNOFILE directive](https://github.com/postalsys/emailengine/blob/e71110471e2437f297d0eb12721a30eb49d0c6dc/systemd/emailengine.service#L88).

## Syncing Takes Too Long or Never Completes

**Symptom:**  
EmailEngine is taking an unusually long time to sync a specific email account, or the syncing process never completes.

**Possible Cause:**  
The email account is too large for EmailEngine to handle efficiently.

**Explanation:**

- **Large Account Size:** EmailEngine indexes all emails in an account. For accounts with a vast number of emails, this process can be extremely time-consuming.
- **IMAP Session Timeout:** In some cases, the IMAP session may expire before the indexing process is complete. This prevents EmailEngine from finishing the sync, causing it to restart the process repeatedly.

**Solutions:**

1.  **Use API-Based Backends:**

    - **[Gmail API](https://emailengine.app/gmail-api) or [Microsoft Graph API](https://emailengine.app/outlook-and-ms-365):**
      - Switching to an API-based backend can handle large accounts more efficiently.
      - These APIs are designed to work with large datasets and can reduce syncing time.
      - **How to Implement:**
        - For Gmail accounts, configure EmailEngine to use the Gmail API.
        - For Microsoft accounts, set up EmailEngine to use the Microsoft Graph API.

2.  **Switch to the [Fast Indexer](https://emailengine.app/supported-account-types#fast-indexer) (for IMAP Accounts):**

    - **Fast Indexer:**
      - Opt for the "fast" indexer when using IMAP connections.
      - This indexer requires fewer resources and significantly reduces indexing time.
      - **Benefits:**
        - Minimal storage overhead in Redis.
        - Faster initial sync and reduced risk of IMAP session timeouts.
      - **Considerations:**
        - The fast indexer detects new emails but does not track deleted or modified emails.

> This page is updated as new issues occur and are resolved.

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
