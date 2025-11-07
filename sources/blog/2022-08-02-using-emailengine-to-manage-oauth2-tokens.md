---
title: Using EmailEngine to manage OAuth2 tokens
slug: using-emailengine-to-manage-oauth2-tokens
date_published: 2022-08-02T08:50:21.000Z
date_updated: 2022-08-02T08:50:21.000Z
tags: EmailEngine, OAuth2
---

If you want to use the OAuth2 accounts registered in EmailEngine for other activities, for example, you want to run API requests against MS or Google APIs directly, you do so by asking EmailEngine for the tokens.

1. When setting up the Azure app or Google Cloud app, select all the OAuth2 scopes you need in addition to the ones that EmailEngine requires
2. When configuring OAuth2 settings in EmailEngine, add all these extra scopes to the "Additional scopes" text box
3. in EmailEngine's Service configuration page, in the Security section, enable the Allow the API endpoint for fetching OAuth2 access tokens checkbox
4. Add the OAuth2 accounts (if you add accounts before configuring scopes, these accounts will be missing required permissions, so add accounts after you have configured everything)
5. When making an API request against MS API or Google API, ask for the currently valid access token for that user from the EmailEngine [oauth-token endpoint](https://api.emailengine.app/#operation/getV1AccountAccountOauthtoken). EmailEngine ensures that the token is renewed and up to date.

Without enabling the OAuth2 API endpoint, you can not use it as it's disabled by default.
![](__GHOST_URL__/content/images/2022/08/Screenshot-2022-08-02-at-11.23.20.png)Enable OAuth2 API endpoint in the service settings
**Example for Google**

Before adding any accounts, ensure the requested scopes are added to the application settings.
![](__GHOST_URL__/content/images/2022/08/Screenshot-2022-08-02-at-11.42.26.png)
Also, make sure that the APIs you are going to use (in this case, the Postmaster API) are enabled for this app. 
![](__GHOST_URL__/content/images/2022/08/Screenshot-2022-08-02-at-11.40.56.png)
Then add the scopes to the "Additional scopes" section on EmailEngine's OAuth settings page.
![](__GHOST_URL__/content/images/2022/08/Screenshot-2022-08-02-at-11.42.56.png)
Once everything is set up, add some accounts and try to generate some tokens.

First, ask for the access token from EmailEngine.

    curl "https://ee.example.com/v1/account/example/oauth-token" \
      -H "Authorization: Bearer f027c1e9485e....46b10be8862137"
    {
      "account": "example",
      "user": "user@example.com",
      "accessToken": "ya29.a0AVA9y1sXQ....CP1A",
      "registeredScopes": [
        "https://www.googleapis.com/auth/postmaster.readonly",
        "https://mail.google.com/"
      ],
      "expires": "2022-07-08T14:25:27.780Z"
    }
    

Next, use this token for a Google API request.

    curl https://gmailpostmastertools.googleapis.com/v1/domains \
      -H "Authorization: Bearer ya29.a0AVA9y1sXQ....CP1A"
    {...domains response...}
    

If everything was properly set up, then you should see a non-error response.
