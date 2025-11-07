---
title: Low-code integrations with EmailEngine
slug: low-code-integrations
date_published: 2022-10-19T10:27:19.000Z
date_updated: 2023-06-30T11:44:56.000Z
tags: EmailEngine, Low-code, Webhooks
excerpt: EmailEngine is an email automation platform that makes it possible to access email accounts, both for sending and reading emails, with an HTTP REST API. EmailEngine continuously monitors those email accounts and sends a webhook notification whenever something happens.
---

[EmailEngine](https://emailengine.app/) makes it possible to integrate with any service that accepts webhooks. By default, the webhooks EmailEngine sends out use an EmailEngine-specific structure, a great option when you add support for EmailEngine to your app, as it includes all the available information about an event. For existing external services, you might need to use a specific payload structure, or maybe you only want to send some very specific webhooks to that service. In these cases, you can use the Webhook Routing feature.

Webhook Routing allows you to set up custom webhook handling in addition to the default webhook handler. While the default webhook handler always sends a single webhook for each event, with custom routing, every matching route is triggered. A single event, like a new incoming email, can trigger multiple webhooks with custom routes.

A webhook route consists of three components.

### Filtering function

First is the filtering function. This is a tiny program written in Javascript – and also the reason why the custom webhook route feature is called low-code instead of no-code. The function takes the webhook payload as an argument and returns if the route should be processed or not based on that input.

> All functions can utilize top-level `await...async` and the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for external HTTP requests. However, during development, be aware that the demo function runner on EmailEngine's dashboard operates in the browser context and hence executing `fetch` is limited by CORS. This limitation does not apply to the actual functions that operate in the server context.

The following example filter function accepts all bounce notifications.

    if(payload.event === "messageBounce"){
        return true;
    }
    

### Mapping function

Second, is the mapping function. It takes the webhook payload and morphs it into the required output structure for the target service. This is also a JavaScript code, just like the filtering function. Whatever the function returns will be sent to the target service.

The following example takes the bounce notification payload and converts it to a Discord chat message structure.

    return {
        username: 'EmailEngine',
        content: `Email from [${payload.account}](${payload.serviceUrl}/admin/accounts/${payload.account}) to *${payload.data.recipient}* with Message ID _${payload.data.messageId}_  bounced!`
    };
    

### Target URL

Finally, the third component is the webhook target URL. As the payload was for the Discord chat channel, I'll be creating a webhook URL in Discord.
![](__GHOST_URL__/content/images/2022/10/Screenshot-2022-10-19-at-12.36.28.png)
Once the webhook route has been set up, and an email bounces on one of the monitored email accounts, EmailEngine should detect it and send a chat message to the selected Discord channel.
![](__GHOST_URL__/content/images/2022/10/Screenshot-2022-10-19-at-12.41.29.png)
