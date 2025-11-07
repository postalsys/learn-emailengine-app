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

<a href="https://postalsys.com/plans" id="btn_txfjtb73nx" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Bounces

Built-in Bounce Detection

EmailEngine automatically scans incoming emails for bounce responses. When a bounce is detected, EmailEngine sends a webhook notification. Additionally, when listing emails, any bounce information associated with a specific message is included in the message details as a `bounces` array.

> **Note:** EmailEngine does not use [VERP addresses](https://en.wikipedia.org/wiki/Variable_envelope_return_path). Since EmailEngine sends emails via standard channels and not directly, it can only detect bounces that include standard bounce information. Custom, human-readable messages without metadata markers may not be detected. Fortunately, the majority of email servers use standard bounce formats that EmailEngine can process.

## Bounce Webhooks

When EmailEngine detects an incoming email, it checks to see if the email is a bounce response. If so, it sends a webhook with the event type `messageBounce`.

Because EmailEngine cannot immediately identify the original message that triggered the bounce, the webhook payload does not include a `"id"` field. Instead, the `messageId` field is provided to help you match the bounce to a message in your system.

An example of a bounce webhook payload:

``` json
{
  "account": "account_id",
  "date": "2021-11-28T10:17:29.728Z",
  "event": "messageBounce",
  "data": {
    "bounceMessage": "AAAAAQAABWw",
    "recipient": "failed.recipient@example.com",
    "action": "failed",
    "response": {
      "source": "smtp",
      "message": "550 5.1.1 <failed.recipient@example.com>: Recipient address rejected: User unknown in relay recipient table",
      "status": "5.1.1"
    },
    "mta": "mx.example.com",
    "queueId": "BFC608226A",
    "messageId": "<4dbe4a40f37e9c2ba5b25912bc7c8997@example.com>"
  }
}
```

Note that some fields might be missing depending on how much information EmailEngine can extract from the bounce response.

## Bounces in Message Listings

When listing messages in the Sent Mail folder, EmailEngine checks for bounces associated with each listed message. If a bounce is detected, it is included in the message entry as a `bounces` array.

Here’s an example message listing that includes bounce information:

``` json
{
  "id": "AAAAAgAAAZ0",
  "uid": 413,
  "date": "2021-11-28T10:17:27.000Z",
  "size": 839,
  "subject": "Example message",
  "from": {
    "name": "Sender Name",
    "address": "sender@example.com"
  },
  "to": [
    {
      "name": "",
      "address": "failed.recipient@example.com"
    }
  ],
  "messageId": "<4dbe4a40f37e9c2ba5b25912bc7c8997@example.com>",
  "bounces": [
    {
      "message": "AAAAAQAABWw",
      "recipient": "failed.recipient@example.com",
      "action": "failed",
      "response": {
        "message": "550 5.1.1 <failed.recipient@example.com>: Recipient address rejected: User unknown in relay recipient table",
        "status": "5.1.1"
      },
      "date": "2021-11-28T10:17:29.722Z"
    }
  ]
}
```

## Retrieving Bounce Content

To retrieve the actual contents of a bounce message, you can use the `data.bounceMessage` value from the webhook payload or the `bounces[].message` value from the message listing.

For example, to fetch the bounce content for `AAAAAQAABWw`, use the following `curl` command:

    $ curl "http://localhost:3000/v1/account/ekiri/message/AAAAAQAABWw?textType=*" \
        -H 'Authorization: Bearer d2d438e2a965...'

The response will return the full content of the bounce message:

``` json
{
  "id": "AAAAAQAABWw",
  "uid": 1388,
  "date": "2021-11-28T10:17:28.000Z",
  "unseen": true,
  "size": 3611,
  "subject": "Undelivered Mail Returned to Sender",
  "from": {
    "name": "Mail Delivery System",
    "address": "MAILER-DAEMON@smtp.example.com"
  },
  "to": [
    {
      "name": "",
      "address": "sender@example.com"
    }
  ],
  "attachments": [
    {
      "id": "AAAAAQAABWwy",
      "contentType": "message/delivery-status",
      "encodedSize": 480,
      "filename": false,
      "embedded": false,
      "inline": false
    },
    {
      "id": "AAAAAQAABWwz",
      "contentType": "message/rfc822",
      "encodedSize": 1437,
      "filename": false,
      "embedded": false,
      "inline": false
    }
  ],
  "messageId": "<20211128101728.144CB82458@smtp.example.com>",
  "text": {
    "plain": "This is the mail system at host smtp.example.com.\n\nI'm sorry to have to inform...",
    "html": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\">\n<html><body style=...",
    "hasMore": false
  }
}
```

## Bounce Types

There are various reasons why an email might bounce. EmailEngine identifies these types of bounces.

<a href="https://cloudup.com/ikfKrxtMPtE" target="_blank" rel="noreferer noopener"></a>

<img src="lib_YPDxAnubLfzlHjLq/z2bolquggvj8yxic.png?w=400&amp;h=200&amp;fit=crop" srcset="lib_YPDxAnubLfzlHjLq/z2bolquggvj8yxic.png?w=800&amp;h=400&amp;fit=crop 2x" alt="SoWkIImgAStDuN8iA53GjLDmpKtCp77DIy_CIxLIi4a5yUoua0H1Qe9zGm8GaY0UXavJ0mC5nzAIZDIyaipan9BC_3m5Dw1qQWgwMK1hWKRbfXON9wQdkgJcP9Qb5bMw5XNb5w5OYs51Nhv2RdvHga9HQabHPcenNcCXDjjnEQJcfG2z2W00.png" />

### messageFailed

The SMTP server did not accept the email for delivery.

<a href="https://cloudup.com/iDlfPlTWjV7" target="_blank" rel="noreferer noopener"></a>

<img src="lib_YPDxAnubLfzlHjLq/s7s8bq18h16zdwfn.png?w=400&amp;h=200&amp;fit=crop" srcset="lib_YPDxAnubLfzlHjLq/s7s8bq18h16zdwfn.png?w=800&amp;h=400&amp;fit=crop 2x" alt="file.png" />

### messageBounce

The email was accepted by the SMTP server but was later rejected by the recipient's mail server (MX server).

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
