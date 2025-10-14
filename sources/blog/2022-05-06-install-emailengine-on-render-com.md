---
title: Install EmailEngine on Render.com
slug: install-emailengine-on-render-com
date_published: 2022-05-06T08:40:24.000Z
date_updated: 2022-05-27T20:11:36.000Z
tags: EmailEngine, Render
---

[Render](https://render.com/) is one of the newest popular web infrastructure services. It makes managing applications very easy – deploying [EmailEngine](https://emailengine.app/) on Render can be done from the web UI without accessing the SSH.

> For the fastest way to set up EmailEngine on [Render.com](https://render.com/) use the "Deploy to Render" button below. This would automatically configure a web service to run EmailEngine and a Redis database for storage. For manual setup, or if you want to use any custom options, the automated blueprint does not allow, follow the blog post.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/postalsys/emailengine)
### Step 1. Install Redis

Render has built-in support for Redis. To create a new instance, click on the New+ button on top of your dashboard and select "Redis."
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-06-at-11.16.42.png)
On the setup screen, select the options you like. In general, you should not choose the smallest instance option. For `Maxmemory Policy` select `noeviction`.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-06-at-11.23.37.png)
Create the instance and wait until it is started. From the information screen, the only important part is the Redis URL. We will provide this for EmailEngine in a later step.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-06-at-11.20.57.png)
Now that Redis is up and running, we can continue with setting up EmailEngine.

### Step 2. Install EmailEngine

Click on the New+ button on top of your dashboard, and this time select "Web Service."
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-06-at-11.26.28.png)
You need to provide a repository URL for the web service. Use [`https://github.com/postalsys/emailengine`](https://github.com/postalsys/emailengine) as a public repository.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-06-at-10.53.33.png)
Click on the *postalsys / emailengine* button to continue.

Next, an application details form is shown. Fill the form with the following values:

- Select whatever you want for the **name**. In this example, we use "EmailEngine."
- For the **environment**, select "Node."
- For the **build command** use `npm install --production`
- For the **start command** use `npm start`

Also, open the Advanced section and add an environment variable `EENGINE_REDIS` Use the Redis URL that we copied in the previous step as its value.

Yet again, do not select the smallest size. You need at least 1GB of RAM for EmailEngine to function correctly.
![](__GHOST_URL__/content/images/2022/05/render-app.png)
Next, you have to wait a bit until Render deploys EmailEngine. If everything succeeds, you should get the application URL from the top of the application details page.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-06-at-11.34.54.png)
That's it. You can now use EmailEngine.
