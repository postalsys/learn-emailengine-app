---
title: Outlook and Microsoft 365 Integration
description: Integrate Microsoft 365 and Outlook accounts with OAuth2 and Graph API
sidebar_position: 4
---

> Click [here](/docs/accounts/oauth2-setup) to see other types of OAuth2 configurations or see the complete [Outlook OAuth2 Setup Guide](/docs/accounts/outlook-365) for detailed instructions.
### Setting up MS Graph API integration with EmailEngine
Follow these steps to integrate Outlook and MS365 email accounts with EmailEngine using OAuth2 and Microsoft Graph API:
1.  **Open Azure Portal**  
Go to the [Azure Portal](https://portal.azure.com/), where you will manage all settings and configurations for your Microsoft Graph API integration.
2.  **Navigate to Microsoft Entra ID → App Registrations**  
This is where you will register your app in Azure. App registration allows your app to access Microsoft services like MS Graph for email accounts.
3.  **Create a new app registration**  
Registering a new application creates a unique identity for your app, enabling it to access MS Graph API securely and interact with users' email accounts.
4.  **Select a suitable Supported accounts type**  
Choose the appropriate account type based on your needs. To allow broader access, choose _Accounts in any org and personal accounts_, which supports both Microsoft 365 and personal Outlook accounts.
5.  **Set the Redirect URI**  
Select _Web_ as the platform and use your EmailEngine URL with the `/oauth` path (e.g., `https://your-emailengine-url.com/oauth`). This allows Azure to send the OAuth2 response back to EmailEngine after successful authentication.
6.  **Copy the Application (client) ID**  
In the application's overview page, find the _Application (client) ID_. This ID will be used as the _Azure Application Id_ in EmailEngine’s OAuth form when configuring the Outlook integration.
7.  **Add API Permissions**  
Navigate to _API Permissions_ and click _Add a permission_. This step grants your app the necessary access to interact with users' Outlook and MS365 email accounts.
8.  **Enable Microsoft Graph Permissions**
-   Select _Microsoft Graph_ → _Delegated permissions_.
-   Search for and enable the following permissions to allow your app to interact with the user's email:
-   If you want to use **IMAP and SMTP** as the base scopes:
-   _IMAP.AccessAsUser.All_ (for IMAP access)
-   _SMTP.Send_ (for sending emails via SMTP)
-   _offline\_access_ (for long-term access to accounts)
-   If you want to use **MS Graph API** as the base scope:
-   _User.Read_ (for reading account properties)
-   _Mail.ReadWrite_ (for reading emails)
-   _Mail.Send_ (for sending emails)
-   _offline\_access_ (for long-term access to accounts)
9.  **Create a client secret**  
Navigate to _Certificates & Secrets_ and create a new client secret. The client secret is used by your app to authenticate with Azure. Choose an expiration period you are comfortable with. Note that once the secret expires, you'll need to generate a new one and update it in EmailEngine.
10.  **Copy the client secret value**  
Once the client secret is generated, make sure to copy the _Value_ of the secret (not the _Secret ID_). This value will be used as the _Client Secret_ in EmailEngine's OAuth configuration.
11.  **Create a new Outlook application in EmailEngine**  
Open EmailEngine and create a new **Outlook OAuth2** application. This will establish the connection between EmailEngine and the Microsoft Graph API.
12.  **Use the Application ID in EmailEngine**  
In the OAuth2 application form in EmailEngine, use the Application ID (from Azure’s dashboard) as the _Azure Application Id_.
13.  **Use the client secret in EmailEngine**  
In the EmailEngine form, use the client secret value (the one you copied earlier) as the _Client Secret_. This allows EmailEngine to authenticate with Azure and access Outlook email accounts.
14.  **Set the supported account types**  
In EmailEngine, set the _Supported account types_ value. The option _Common_ corresponds to the _Accounts in any org and personal accounts_ option you selected during the Azure app registration process.
15.  **Register the app in EmailEngine**  
Click _Register app_ in EmailEngine to complete the integration. Your app is now configured to use the Microsoft Graph API for accessing Outlook and MS365 email accounts via IMAP and SMTP.