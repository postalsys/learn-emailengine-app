---
title: Integrating AI with EmailEngine
slug: generating-summaries-of-new-emails-using-chatgpt
date_published: 2023-09-14T08:21:00.000Z
date_updated: 2023-09-14T10:53:04.000Z
tags: EmailEngine, AI
---

As we all know, integrating artificial intelligence with software is all the rage these days. That's why EmailEngine has decided to follow the trend and integrate with the OpenAI API to explore the usage of AI technology. The integration is not super in-depth, but it's a step forward in incorporating AI into the process.

So, what can this integration do for you? Well, with the help of OpenAI API, EmailEngine can now generate summaries of incoming emails and even provide a sentiment estimation for the email. This can help you quickly assess the tone and importance of these emails for whatever reason you would need it.

It's important to note, however, that these summaries and sentiment estimations are only provided for webhooks about new emails, not for API requests.

> PII alert! If OpenAI integration is enabled then EmailEngine uploads the text content of incoming emails to the servers of OpenAI. OpenAI does not use this content for training, but you need to verify if this behavior is in accordance with your data processing agreements with your users.

To enable the integration, navigate to the LLM Integration configuration page. Provide the OpenAI API key, and check the "Enable email processing with AI" checkbox.
![](__GHOST_URL__/content/images/2023/09/Screenshot-2023-09-14-at-13.18.39.png)
> If possible, use an API key of a paid OpenAI account. The API key for a free account has very strict rate limits, and if you are processing several emails at a time, then ChatGPT API requests will fail.

If everything is set up correctly and the integration works, then whenever you get a webhook for a new incoming email, it should include a sections called `summary` and `riskAssessment`. Also, consider that if you have configured webhooks not to contain any email message content, the summarization might fail, as there would be nothing to summarize.
![](__GHOST_URL__/content/images/2023/03/Screenshot-2023-03-13-at-11.17.18.png)
EmailEngine will skip summary processing if requests to ChatGPT API fail for any reason. In that case, the summary section would be missing from the webhook payload. If you need to know why summaries are not included with the webhooks, check the logs of EmailEngine.

### Custom prompts

You can modify the prompt EmailEngine uses for OpenAI API requests if you want it to return different data than EmailEngine asks for by default. For example, you can use this to return summaries in some other language than the default English. Or you can ask for values that are not described at all in the default prompt.
![](__GHOST_URL__/content/images/2023/09/Screenshot-2023-09-14-at-13.52.20.png)
For example, if you want EmailEngine to include the language of the email in the message structure, you can add the following line to the prompt:

    - Return the ISO language code of the primary language used in the email as the "language" property
    

This additional value should end up as the `"data.summary.language"` property in `messageNew` webhooks.
![](__GHOST_URL__/content/images/2023/09/Screenshot-2023-09-14-at-13.45.49.png)
