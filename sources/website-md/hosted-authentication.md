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

<a href="https://postalsys.com/plans" id="btn_jph60mamhy" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Hosted Authentication

Let EmailEngine handle the email account setup process for your users.

While you can always add new email accounts directly via [EmailEngine's API](https://api.emailengine.app/#operation/postV1Account), you also have the option to let EmailEngine take care of the entire setup process. This approach simplifies user interactions and reduces complexity in your application.

With hosted authentication, you direct your users to EmailEngine’s web-based form, where they provide their email server credentials. After successful configuration, EmailEngine stores the account settings and redirects the user back to your application, ready for use.

> **Note:** If you prefer not to use the hosted authentication form but need to manage OAuth2 flows, consider the alternative [authentication server feature](https://docs.emailengine.app/using-an-authentication-server/).

## Example: IMAP Account Setup

Here’s a breakdown of the steps a user follows when setting up an IMAP account via EmailEngine’s hosted form.

<img src="lib_pTNsKLAHHUZrxQKE/v21k64jzcxzryrpt.png?w=400&amp;h=200&amp;fit=crop" srcset="lib_pTNsKLAHHUZrxQKE/v21k64jzcxzryrpt.png?w=800&amp;h=400&amp;fit=crop 2x" />

### 1. User Selects Account Type

The form will present options to connect either to an IMAP server or to OAuth2 providers like Gmail and Outlook, depending on what you've configured.

<img src="lib_pTNsKLAHHUZrxQKE/yfhjxd9r55eyn0lc.png?w=400&amp;h=200&amp;fit=crop" srcset="lib_pTNsKLAHHUZrxQKE/yfhjxd9r55eyn0lc.png?w=800&amp;h=400&amp;fit=crop 2x" />

### 2. User Enters General Information

The user provides their general information, such as name and email address. This helps EmailEngine associate the credentials with the correct account.

<img src="lib_pTNsKLAHHUZrxQKE/vz0s0afjnr3ibfoy.png?w=400&amp;h=200&amp;fit=crop" srcset="lib_pTNsKLAHHUZrxQKE/vz0s0afjnr3ibfoy.png?w=800&amp;h=400&amp;fit=crop 2x" />

### 3. Configuring Server Settings

In most cases, EmailEngine will automatically detect and configure the server settings. However, users can adjust these if necessary.

## How Does It Work?

Your application generates a signed URL that links to your EmailEngine installation. This URL includes basic account details (such as account ID and user name) that EmailEngine will use during the setup process.

Once your user is redirected to this URL, EmailEngine handles the rest by displaying the appropriate forms. After successful configuration, the user is redirected back to your application’s designated URL, and you can begin making API calls to interact with their email account.

> **Important:** To display options for Gmail or Outlook accounts, you need to configure these services ahead of time. Follow the specific guides for [Outlook OAuth2](https://docs.emailengine.app/setting-up-oauth2-with-outlook/) and [Gmail OAuth2](https://docs.emailengine.app/setting-up-gmail-oauth2-for-imap-api/) integration.

## Generating a Redirect URL via API

The most efficient way to generate a link to the hosted authentication form is by using EmailEngine's API. Here's an example:

``` bash
curl -X 'POST' \
  'https://ee.example.com/v1/authentication/form' \
  -H 'Content-Type: application/json' \
  -d '{
  "account": "example",
  "name": "My Email Account",
  "email": "user@example.com",
  "redirectUrl": "https://myapp/account/settings.php"
}'
```

This API request returns a JSON object containing the `url` field:

``` json
{
  "url": "https://ee.example.com/accounts/new?data=eyJhY2NvdW50IjoiZXhh...L0W_BkFH5HW6Krwmr7c"
}
```

You should then redirect your user to this URL (`url` value) to display the authentication form.

### Redirect URL

Once authentication is successful, EmailEngine redirects the user back to the `redirectUrl` you provided. It appends two query parameters to this URL:

1.  **account**: The account ID of the registered account. If you provided an `account` value in the original request, this ID will match it; otherwise, EmailEngine will generate one.
2.  **state**: Indicates whether the account is **new** ("new") or if an existing account was updated ("existing"). If an existing account was used, its settings are updated, and no new account is created.

## Internal Usage by EmailEngine

EmailEngine itself uses this hosted authentication process for adding new accounts via the admin dashboard, which ensures consistency and reliability in handling email account credentials.

<img src="lib_pTNsKLAHHUZrxQKE/9h55bdqybw0l5xs3.gif" class="media media--image" style="display:block" />

## Customizing the Authentication Form

You can personalize the authentication form (e.g., by adding your logo) by editing the header template used for public pages.

<img src="lib_pTNsKLAHHUZrxQKE/o9gkwlsx96ak24zk.gif" class="media media--image" style="display:block" />

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
