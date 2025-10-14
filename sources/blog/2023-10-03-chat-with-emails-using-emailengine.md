---
title: Chat with Emails using EmailEngine
slug: chat-with-emails-using-emailengine
date_published: 2023-10-03T09:27:30.000Z
date_updated: 2024-07-03T07:55:49.000Z
tags: AI, EmailEngine
draft: true
excerpt: The latest version of EmailEngine introduces a feature named "Chat with emails." In this blog post, I cover the setup and usage of this feature.
---

[EmailEngine](https://emailengine.app/) has offered OpenAI integration features for some time. These allow incoming emails to be sent to the OpenAI API for processing, enriching email data for webhooks. For instance, it can identify events or actions within an email or determine if the sender expects a response.

Our latest version of EmailEngine introduces a feature named "Chat with emails." When this chat feature is activated, EmailEngine creates vector embeddings for all incoming emails, storing them in ElasticSearch. A newly introduced API method then uses these vector embeddings, alongside the OpenAI API, to generate responses to user queries.

### Prerequisites

To utilize the chat feature, you'll need:

- A functioning EmailEngine instance
- An ElasticSearch server
- An OpenAI account with an API key

### Setup

Activating the chat feature is simple. Firstly, activate the Document Store feature. Go to Configuration ➞ Document Store and input your ElasticSearch server details. Once this feature is on, EmailEngine will begin syncing all new emails from the IMAP server to ElasticSearch.

Then, access the Chat with Emails tab under the Document Store settings and input your OpenAI API key. With this done, you're all set to add email accounts to your EmailEngine.

If you've previously added email accounts to EmailEngine, please keep in mind that they won't automatically be chat-enabled. EmailEngine processes *new* emails for chatting. Emails from these existing accounts already indexed won't be processed. However, any new emails from these accounts will be. You'll need to reset the index for those accounts to include the older, already indexed emails in the chat system, prompting EmailEngine to re-index everything. This can be done using the [Account Flush](https://api.emailengine.app/#operation/putV1AccountAccountFlush) API method.

Demo for configuring EmailEngine to chat with emails

### Usage

While there's a handy "Try it" button on the Chat with Emails settings page, most users will find the [Chat API method](https://api.emailengine.app/#operation/postV1ChatAccount) more practical. This method requires just two inputs – the account ID and your text question.

    curl -XPOST \
      "http://127.0.0.1:3000/v1/chat/example" \
      -H "Authorization: Bearer <secret token>" \
      -H "Content-Type: application/json" \
      -d '{
      "question": "Last week, I received a newsletter about a city threatened by salt water mixing with their drinking water. Which city was it?"
    }'
    

In essence, you send questions via the API, and EmailEngine attempts to provide an answer using the email data from your account. Admittedly, terming it as a "chat" might be a tad generous. It functions more as an enhanced search feature.

    {
      "success": true,
      "answer": "The city threatened by salt water mixing with their drinking water is New Orleans.",
      "messages": [
        {
          "id": "AAAAGQAACeE",
          "path": "INBOX",
          "date": "2023-09-29T10:03:49.000Z",
          "from": {
            "name": "Emma Tucker, WSJ",
            "address": "access@interactive.wsj.com"
          },
          "to": [
            {
              "name": "andris@example.com",
              "address": "andris@example.com"
            }
          ],
          "subject": "The 10-Point: Trading on the Biden name; Evan marks six months in detention; snack pitches for Japan’s baseball fans",
          "messageSpecialUse": "\\Inbox"
        }
      ]
    }
    

![](__GHOST_URL__/content/images/2023/10/Screenshot-2023-10-03-at-11.58.58.png)Here's a screenshot of the said email 
### Technical Details

Curious about the mechanics of this feature? It's a multi-layered process.

Whenever EmailEngine spots a new email, it divides the email's text into sections of 400 tokens each. It then prefixes each section with a metadata header (containing details like sender, recipient, subject, etc.) and crafts vector embeddings for these sections. These vectors are then stored in ElasticSearch and linked with their corresponding text values.

This "chunking" approach prevents having to send complete emails to OpenAI's API later during the answering phase. The GPT context window has limits, so EmailEngine prioritizes only the most pertinent sections to maximize the number of emails used in each prompt.

Upon receiving a question via the Chat API method, EmailEngine first turns the question into vector embeddings using OpenAI's embeddings API. It then sends a query to the OpenAI GPT 3.5 Instruct model, seeking insights on how to handle the question. For instance, if a query references a specific time frame, like "last week," EmailEngine can rule out emails outside of that period.

Given the insights from the Instruct prompt and the question's vector embeddings, EmailEngine retrieves the most relevant email chunks from ElasticSearch's embeddings index. Note that the system fetches content chunks rather than whole emails. An entire email might be quite extensive, but we only access a 400-token segment that aligns closely with the question's vector embeddings.

The final phase entails integrating the explanation prompt, the user's query, and the text from pertinent emails, and forwarding this aggregated prompt to the OpenAI API. If all goes well, the system will yield a response based on the supplied email chunks. EmailEngine then reshapes this into a JSON format, complemented with details from the actual synced emails.
