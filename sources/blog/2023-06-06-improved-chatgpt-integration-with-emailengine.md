---
title: Improved ChatGPT integration with EmailEngine
slug: improved-chatgpt-integration-with-emailengine
date_published: 2023-06-06T10:39:57.000Z
date_updated: 2023-06-06T10:41:13.000Z
tags: AI, EmailEngine
---

EmailEngine, a serious tool from the get-go, had an unexpected twist. As a playful experiment, I [integrated](__GHOST_URL__/generating-summaries-of-new-emails-using-chatgpt/) it with ChatGPT AI. Surprisingly, over time, this integration turned out to be more than just a joke; it became a valuable feature.

Once the ChatGPT integration is activated in EmailEngine, it processes every new email that lands in the INBOX folder of a monitored email account. The result? A wealth of processed information about each email is added to your "new email" webhooks.

> If you've set up EmailEngine to sync with ElasticSearch, this analyzed data is also stored as part of the message details. But remember, moving an email from your Inbox to another folder will cause ElasticSearch to lose all the custom metadata for that email, including the analyzed data.

EmailEngine is compatible with both GPT3 and GPT4 models. If you're aiming for precision and top-tier results, GPT4 is your best bet. It has a larger context window, so it can handle longer emails. However, it's slower and more expensive than GPT3. So, if you just need a summary, GPT3 should suffice. For more advanced features, you might need to opt for GPT4.

> GPT4 API access isn't automatically enabled; you'll need to [apply](https://openai.com/waitlist/gpt-4-api) for it.

![](__GHOST_URL__/content/images/2023/06/Screenshot-2023-06-06-at-13.37.14.png)Enabling ChatGPT integration in the Service configuration page
Here's what EmailEngine extracts from incoming emails:

- ***Content Summary:*** It condenses the email content into a sentence or a short paragraph.
- ***Fraudulent Email Risk:*** It assigns a risk score from 1 to 5 (5 being riskier) and provides a brief explanation. It's adept at detecting scam emails, but not so much with spam.
- ***Reply Expectation:*** A boolean flag indicating whether the sender is expecting a reply.
- ***Reply or Forwarding Text:*** It removes threaded content from a reply email, leaving only the sender's original text.
- ***Event List:*** Any events with dates mentioned in the email.
- ***Activity List:*** Actions the recipient is expected to take, along with due dates if they're mentioned.
- ***Sentiment Assessment:*** A one-word evaluation of the email's sentiment - *positive*, *neutral*, or *negative*.

    {
      "summary": {
        "id": "chatcmpl-7IzVIEp5UL3hdQ3aZJ8AHyrJrt3R0",
        "tokens": 2060,
        "model": "gpt-4",
        "sentiment": "positive",
        "summary": "Request to contribute 2 to 5 euros for flowers for choir teachers and concertmaster, with excess funds used for a bouquet for the class teacher at end of the year.",
        "shouldReply": true,
        "events": [
          {
            "description": "Flower bouquets for choir teachers and concertmaster",
            "startTime": "2023-05-22"
          }
        ],
        "actions": [
          {
            "description": "Contribute 2 to 5 euros for flower bouquets",
            "dueDate": "2023-05-22"
          }
        ]
      },
      "riskAssessment": {
        "risk": 1,
        "assessment": "Sender information matches and authentication checks have passed."
      }
    }
    

Example processing results section in a "messageNew" webhook
This structured information can feed into your email processing pipeline. For instance, if an email mentions events but lacks a calendar attachment, you could create one using the extracted data.

I believe we're just at the beginning of what AI can do for email processing. The most innovative ideas are yet to be discovered. The future of email processing using AI is promising.
