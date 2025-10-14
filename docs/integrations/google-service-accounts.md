---
title: Google Service Accounts
sidebar_position: 5
---

> Click [here](/oauth2-configuration) to see other types of OAuth2 configurations.
### Setting up Google Service Account Integration with EmailEngine
Follow these steps to set up Google Service Account integration with EmailEngine to manage Gmail accounts across your entire organization.
1.  **Open Google Cloud Console**  
Go to the [Google Cloud Console](https://console.cloud.google.com/), where you will manage all Google API configurations and create a project for using Gmail API with EmailEngine.
2.  **Create a new project**  
Click "Create Project" to set up a new Google Cloud project. This project will contain all the configurations for enabling Gmail API and setting up the service account.
3.  **Select the created project**  
After creating the project, make sure to select it from the list to apply all configurations and API activations to the right project.
4.  **Enable Gmail API**  
Navigate to _APIs & Services_ → _Enabled APIs and services_. Search for "Gmail API" and enable it. This will allow EmailEngine to access and manage Gmail accounts via the service account.
5.  **Navigate to Credentials**  
Head back to _APIs & Services_ → _Credentials_. This is where you’ll create the service account, which will be used to access all Gmail accounts in your organization.
6.  **Manage Service Accounts**  
On the Credentials page, click the _Manage service accounts_ link. This will take you to the section where you can create and manage service accounts for your Google Cloud project.
7.  **Create a new service account**  
Click on "Create Service Account." A service account allows EmailEngine to interact with Google services, including Gmail, on behalf of your organization.
8.  **No need to grant roles**  
You do not need to grant any roles to this service account during creation because it will use domain-wide delegation for access.
9.  **Select the newly generated service account**  
Once the service account is created, select it from the list to configure advanced settings for domain-wide delegation.
10.  **Navigate to Advanced settings**  
Scroll down to find the _Advanced settings_ section of the service account.
11.  **Enable Domain-wide delegation**  
In the advanced settings, look for _Domain-wide delegation_. This option allows the service account to act on behalf of users across your organization. Enable it and copy the **client ID**.
12.  **Go to Google Workspace Admin Console**  
Click on the _View Google Workspace admin console_ button. This will take you to the Google Workspace Admin Console, where you’ll grant the service account domain-wide permissions.
13.  **Search for API Controls**  
In the Google Workspace Admin Console, search for **API Controls**. This section manages the permissions for apps to access data across your organization.
14.  **Manage Domain-wide delegation**  
Click on the _Manage domain-wide delegation_ link. This is where you’ll grant the service account access to Gmail across your organization.
15.  **Add new delegation**  
Click _Add new_ to create a new delegation for the service account. This will enable the service account to act on behalf of all Gmail users in your domain.
16.  **Enter Client ID and Scope**  
Paste the client ID you copied from the service account’s settings. In the OAuth2 scope field, add the following scope:
-   `https://mail.google.com`  
This allows the service account to access Gmail on behalf of all users.
17.  **Return to Service Account page**  
Go back to the service account page in the Google Cloud Console to continue configuring it.
18.  **Create a JSON key for the service account**  
Navigate to _Keys_ within the service account page. Click on "Create new key" and choose the **JSON format**. This file will be used by EmailEngine to authenticate with Google.
19.  **Save the JSON key file**  
After the key is generated, save the JSON file securely. You will need this file to configure the Gmail Service Account in EmailEngine.
20.  **Create a new Gmail Service Account application in EmailEngine**  
Open EmailEngine and create a new **Gmail Service Account** application. This will allow EmailEngine to use the service account to access Gmail accounts across your organization.
21.  **Upload the JSON configuration file**  
In EmailEngine, select the JSON file you downloaded from Google Cloud. This file contains the credentials that EmailEngine will use to authenticate with Google.
22.  **Select IMAP and SMTP as base scopes**  
When configuring the Gmail Service Account application in EmailEngine, select **IMAP and SMTP** as the base scopes. This ensures that EmailEngine can read and send emails using Gmail.
23.  **Register the app in EmailEngine**  
Click _Register app_ to complete the setup. Your EmailEngine instance is now connected to Gmail via the service account, allowing it to manage all Gmail accounts in your organization.