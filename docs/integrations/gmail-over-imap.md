---
title: Gmail over IMAP
sidebar_position: 2
---

> Click [here](/oauth2-configuration) to see other types of OAuth2 configurations or follow [this tutorial](https://docs.emailengine.app/setting-up-gmail-oauth2-for-imap-api/) for a detailed step-by-step guide.
### Setting up Gmail IMAP integration with EmailEngine
Follow these steps to configure Gmail IMAP with EmailEngine using OAuth2 authentication:
1.  **Open the Google Cloud Console**  
Go to the [Google Cloud Console](https://console.cloud.google.com/). This is where you manage your Google APIs and services, necessary for enabling OAuth2 authentication for Gmail IMAP access.
2.  **Create a new project**  
Click "Create Project" to set up a new Google Cloud project. Each project serves as a container for managing settings like OAuth credentials and API access.
3.  **Select the created project**  
Once your project is created, select it to ensure that the configurations and changes you make apply to this project.
4.  **Enable Gmail API**  
Navigate to _APIs & Services_ → _Enabled APIs and services_. Search for "Gmail API" and enable it. Even though we are configuring IMAP, the Gmail API must be enabled to manage OAuth2 access.
5.  **Set up OAuth consent screen**  
Navigate to _APIs & Services_ → _OAuth consent screen_. Google requires a consent screen to notify users of the data your app will access. Choose whether the app will be **Internal** (for users in the same Google Workspace) or **External** (for any Gmail user). In this tutorial, we use "Internal."
6.  **Fill in the OAuth consent form**  
Fill in the necessary details about your app on the consent form. For example, use the URL of your EmailEngine instance as the "Application home page." This allows Google to recognize your app and provides users with transparency on the data it will access.
7.  **Configure OAuth scopes**  
Once the consent form is filled out, click _Save and continue_ to get to the scope configuration screen. Click _Add or remove scopes_ and add the following scope:
-   `https://mail.google.com`  
This scope allows your app to access Gmail through IMAP and SMTP. Click _Save and continue_.
8.  **Create OAuth credentials**  
Navigate to _APIs & Services_ → _Credentials_, then click _Create Credentials_ → _OAuth client ID_. These credentials allow your app to authenticate users and access Gmail IMAP and SMTP services.
9.  **Set up OAuth client ID**  
Select _Web application_ as the application type. Under "Authorized JavaScript origins", add your EmailEngine URL. Under "Authorized redirect URIs", add your EmailEngine URL with the `/oauth` path (e.g., `https://your-emailengine-url.com/oauth`). This enables the redirect after users authenticate.
10.  **Download the credentials**  
After the client ID is created, download the OAuth credentials as a JSON file. This file contains the necessary authentication data for integrating with Gmail IMAP.
11.  **Create a new Gmail OAuth2 app in EmailEngine**  
Open EmailEngine and create a new **Gmail OAuth2** application. This will set up the integration between EmailEngine and Gmail over IMAP.
12.  **Upload the JSON credentials**  
In EmailEngine, select the downloaded JSON file to autofill configuration details such as client ID and secret. This links EmailEngine with Google’s OAuth system.
13.  **Choose IMAP and SMTP as the base scope**  
When setting up the OAuth2 app in EmailEngine, choose **IMAP and SMTP** as the base scope. This ensures that EmailEngine will authenticate and work over IMAP for email retrieval and SMTP for sending.
14.  **Complete the registration**  
Click _Register app_ in EmailEngine to complete the integration process. Your app is now ready to use Gmail IMAP through OAuth2 for secure email management.