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

<a href="https://postalsys.com/plans" id="btn_130nyjqabho" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Accessing Shared Mailboxes in MS365

EmailEngine supports accessing Microsoft 365 (MS365) shared mailboxes, allowing your applications to interact with these mailboxes via a RESTful API.

## Introduction to Shared Mailboxes

Microsoft 365 allows you to create **shared mailboxes** that are not bound to a specific user. Instead, one or multiple users can access these mailboxes using their own credentials to send and receive emails on behalf of the shared mailbox.

EmailEngine enables you to interact with these shared mailboxes through its API by leveraging OAuth2 authentication. This means you can programmatically access shared mailboxes without needing separate credentials for each one.

## Prerequisites

- **Main User Account**: You must have the main user account (with access to the shared mailboxes) added to EmailEngine.
- **OAuth2 Application**: An OAuth2 application configured in both Azure and EmailEngine.
- **Permissions**: Ensure that the main account has the necessary permissions to access the shared mailboxes.

## Adding the Main User Account

Before accessing shared mailboxes, add the main user's Microsoft 365 account to EmailEngine using the standard account creation process. This account should have access to all the shared mailboxes you intend to use.

Refer to the [EmailEngine API documentation](https://api.emailengine.app/#operation/postV1Account) for detailed instructions on adding a new account.

## Adding Shared Mailboxes

To add a shared mailbox to EmailEngine, you'll use an API call that specifies the shared mailbox and instructs EmailEngine to use the main account's credentials.

### API Call Payload

Here's how to structure your API call:

- **`account`**: A unique identifier for the shared mailbox in EmailEngine (e.g., `"shared"`).
- **`name`**: A friendly name for the mailbox (e.g., `"Shared Account"`).
- **`email`**: The email address of the shared mailbox (e.g., `"shared@example.com"`).
- **`oauth2.auth.delegatedUser`**: The email address or MS365 user ID of the shared mailbox.
- **`oauth2.auth.delegatedAccount`**: The EmailEngine account ID of the main user (e.g., `"my-account"`).

#### Request - **POST `/v1/account`**

```json
{
  "account": "shared", // optional; null ⇒ auto-generated
  "name": "Shared Account",
  "email": "shared@example.com",
  "oauth2": {
    "auth": {
      "delegatedUser": "shared@example.com",
      "delegatedAccount": "my-account"
    }
  }
}
```

In this example, EmailEngine connects to Microsoft 365 servers and authenticates as `"shared@example.com"` using the OAuth2 tokens from the main account `"my-account"`.

## Using IMAP and SMTP

If your main account uses **IMAP and SMTP** protocols, you can access shared mailboxes without additional configuration.

- **IMAP Access**: EmailEngine accesses the shared mailbox's emails using IMAP.
- **SMTP Limitations**: Shared mailboxes without a full MS365 subscription lack SMTP access.

### Handling Sent Emails

When sending emails from a shared mailbox:

- **SMTP Authentication**: EmailEngine uses the SMTP credentials of the main account.
- **From Address**: The "From" address is set to the shared mailbox's email.
- **Sent Items Duplication**:
  - A copy of the sent email is saved in the shared mailbox's "Sent Items" folder.
  - Another copy is saved in the main account's "Sent Items" folder.
  - **Result**: Duplicate emails in "Sent Items" folders.

## Using Microsoft Graph API

If you prefer to use the **Microsoft Graph API**, additional configuration is required.

### Step 1: Update API Scopes in Azure

Add the following scopes to your Azure OAuth2 application:

1.  **Access Azure Portal**: Log in to [Azure Portal](https://portal.azure.com/) and navigate to your app.
2.  **API Permissions**: Go to **API Permissions** \> **Add a permission** \> **Microsoft Graph** \> **Delegated permissions**.
3.  **Add Scopes**:
    - `User.ReadBasic.All`
    - `Mail.ReadWrite.Shared`
    - `Mail.Send.Shared`

### Step 2: Update Scopes in EmailEngine

1.  **Navigate to OAuth2 Application**: In EmailEngine, go to your OAuth2 application's settings.

2.  **Edit Additional Scopes**:

    - Find the **Additional Scopes** section.

    - Add the following scopes:

          User.ReadBasic.All
          Mail.ReadWrite.Shared
          Mail.Send.Shared

3.  **Save Changes**: Click **Save** to apply the new scopes.

### Step 3: Refresh OAuth2 Grant for Main Account

To use the new permissions, update the OAuth2 grant for the main account.

- **Option 1**: **Re-add the Main Account**
  - Delete and re-add the main account in EmailEngine.
- **Option 2**: **Generate a New Authentication URL**
  1.  **Create Authentication Link**:
      - Use the [Authentication Form API](https://api.emailengine.app/#operation/postV1AuthenticationForm).
      - Set `account` to your main account's ID (e.g., `"my-account"`).
      - Set `type` to your OAuth2 application's ID in EmailEngine.
  2.  **User Authentication**:
      - Provide the link to the main account user.
      - The user must open the link and grant the new permissions.

### Step 4: Add or Reconnect Shared Mailboxes

With updated permissions:

- **Add New Shared Mailboxes**: Use the [Account API](https://api.emailengine.app/#operation/postV1Account) as previously described.
- **Reconnect Existing Mailboxes**: If shared mailboxes were added before, use the [Reconnect API](https://api.emailengine.app/#operation/putV1AccountAccountReconnect) to refresh their access.

## Registering a Microsoft 365 shared mailbox _without_ adding the user’s personal account

If you only need the shared mailbox, create **one** EmailEngine account for it and let an authorised user grant consent during OAuth 2.0 login.

#### Request - **POST `/v1/account`**

```json
{
  "account": "shared", // optional; null ⇒ auto-generated
  "name": "Shared mailbox",
  "email": "shared@example.com",

  "oauth2": {
    "provider": "AAABkwrwyA8AAAAm", // ID of the MS365 OAuth2 provider in EmailEngine
    "authorize": true, // ask EmailEngine to return an auth URL
    "redirectUrl": "https://emailengine.app/", // user is sent here after consent

    "auth": {
      "delegatedUser": "shared@example.com" // address or objectId of the shared mailbox
    }
  }
}
```

#### Response

```json
{
  "redirect": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=e887..."
}
```

Send the `redirect` URL to a user who **already has Full Access** to the shared mailbox.  
After they sign in and accept the scopes, EmailEngine stores the tokens and the new _shared_ account appears in the account listing. A separate personal-mailbox account is **not** required.

##### Field notes

- **`account`** – unique EmailEngine ID; set `null` to auto-generate.
- **`email`** – email address of the shared mailbox. Usually identical to `oauth2.auth.delegatedUser` unless you provide an objectId in that field.
- **`oauth2.auth.delegatedUser`** – the shared mailbox’s address or objectId, _not_ the credentials of the user who signs in.
- The signing-in user’s own mailbox is never added to EmailEngine; their login is used solely to authorise the shared mailbox.

Once consent is complete, call any EmailEngine REST endpoint against the `"shared"` account exactly as you would for a normal mailbox.

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
