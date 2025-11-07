---
title: Mining email data for fun and profit
slug: mining-email-data-for-fun-and-profit
date_published: 2022-05-27T21:41:02.000Z
date_updated: 2025-09-11T12:12:13.000Z
tags: IMAP, EmailEngine, ElasticSearch
draft: true
excerpt: Tl;dr EmailEngine supports mirroring email accounts to ElasticSearch near real-time, which makes it possible to run data analytics queries against all the mirrored emails.
---

One of the coolest features for [EmailEngine](https://emailengine.app/) (v2.21.0 and newer) is the ability to mirror all emails from an IMAP account to ElasticSearch. That is, whenever a new email arrives in the email account, it gets copied to ElasticSearch, and once that email is deleted from the server, it also disappears from ElasticSearch. Flag changes (seen/unseen etc.) get synced as well. See the docs for it [here](https://emailengine.app/document-store).

Emails are mirrored using something you could jokingly call eventual consistency. By *eventual*, I mean anything between 1 second to 15 minutes. By *consistency*, I mean *best effort*. In reality, you could expect the mirrored data to reflect the original quite accurately.

> [Install the latest version](https://emailengine.app/set-up) of EmailEngine and once it is running, open [http://127.0.0.1:3000](http://127.0.0.1:3000) to access the dashboard.

In the configuration section of the side menu, click on the *Document Store* link to get to the ElasticSearch settings.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-27-at-23.35.34.png)
Next, you can provide the ElasticSearch API URL and, if needed, username and password for basic authentication. Also, mark the *Enable syncing to the Document Store* checkbox.

Before continuing, you should check if EmailEngine can connect to your ElasticSearch instance or not. There's an action link to verify configuration settings. Click on the hamburger menu and select *Test connection*.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-27-at-23.42.23.png)
There is no point continuing until you get a *Connection successful* response from that test.

Once everything checks out, click on the *Update settings* button, and that's it. EmailEngine is now mirroring emails to ElasticSearch!

Add an email account to EmailEngine, and EmailEngine should start copying all emails from that account to ElasticSearch. If you have a lot of emails on that account, then this syncing will take a lot of time as EmailEngine needs to process every email separately.

There are two options for accessing message data from ElasticSearch. 

1. One is to fetch messages using EmailEngine's regular API and set `documentStore=true` query argument. Eg. `GET /v1/account/account_id/messages?path=INBOX&documentStore=true`
2. The other is to run queries against ElasticSearch directly.

Both options are valid. Next, I'll show some examples of running ElasticSearch queries against stored emails using Kibana.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-28-at-00.11.47.png)This is what the stored emails look like in ElasticSearch.
One neat thing you can do is generate a donut chart about folder sizes of an email account.

1. Open the visualizer in Kibana
2. Search for `account:account_id`
3. Select Donut chart
4. To the "Slice by" area, drag the `path` field
5. To the "Size by" area, drag the `size` field
6. Click on the `size` field and select `sum` as the function, also select *Bytes* as the *Value format*
7. Click on the label setting button and select *Show value* as the *values* option

That's it. You get a donut chart showing which folder takes up the most space.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-28-at-00.18.09.png)Well, that was easy
Do you want to find all emails that include PDF attachments? Say no more; just run the following query:

    account:account_id and attachments:{ filename: "*.pdf" }
    

And you have your answer.
![](__GHOST_URL__/content/images/2022/05/Screenshot-2022-05-28-at-00.20.07.png)
The potential to use email accounts to dig for data like this is limitless.

### Custom search queries

In general, message searching maps directly to IMAP options, so it should not matter if you run the same query against IMAP or the document store. There might be cases where you want to run more advanced queries that are not available when using IMAP. EmailEngine exposes an additional search argument, `documentQueury` for these use cases. Whatever you provide as the value for this property will be passed to ElasticSearch as part of the [search query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html).

The following example searches for unseen emails with attachments. IMAP searches do not allow searching for attachments, but in ElasticSearch, it is possible. Note, though, that the attachment field is stored as a nested document, so the query must be built as a nested query as well. All attachments have an "id" property, so the query matches any document with `attachment.id` property set.

    curl -XPOST -s "http://example.com/v1/account/example/search?documentStore=true" \
        -H "Content-type: application/json" \
        -d '{
      "search": {
        "unseen": true
      },
      "documentQuery": {
        "nested": {
          "path": "attachments",
          "query": {
            "bool": {
              "must": [
                {
                  "exists": {
                    "field": "attachments.id"
                  }
                }
              ]
            }
          }
        }
      }
    }'
    

---

Any thoughts? Join our [Discord server](https://emailengine.app/discord).
