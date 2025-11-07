---
title: Tracking bounces
slug: tracking-bounces
date_published: 2022-10-12T11:34:00.000Z
date_updated: 2022-10-12T12:44:06.000Z
tags: EmailEngine
excerpt: Use the email automation capabilities of EmailEngine to track bounced emails for an IMAP account.
---

[EmailEngine](https://emailengine.app/) is an email automation platform that provides an easy-to-use REST API for IMAP and SMTP accounts. As one of the possible automations, EmailEngine can provide you with information about bounced emails for an email account.

EmailEngine has access both for sending and reading received emails of an email account, and it constantly monitors incoming emails to detect different kinds of signals. If there's a new email that looks like a bounce email, EmailEngine will process it, extract the bounce information, and will send you a webhook.

Minimally the webhook will include the Message-ID header value of the email that bounced. Usually, though, there are more data to extract, so in general, EmailEngine will also include the exact error message (for example `"User unknown in relay recipient table"`), full headers of the bounced email, and some additional metadata, like the name of the SMTP server, that generated the bounce response.

To dive in, let's send an email to a non-existing email address from an email account managed by EmailEngine.

    $ curl -XPOST "https://emailengine.srv.dev/v1/account/ekiri/submit" \
        -H "Authorization: Bearer secret123" \
        -H "Content-type: application/json" \
        -d '{
          "to": {
            "address": "unknown@ethereal.email"
          },
          "subject": "Test message",
          "text": "This email should bounce!"
        }'

EmailEngine queues the email for delivery and returns the `Message-ID` header of the sent email. We need this value later to determine if a bounce is related to this sent email or not.

    {
      "response": "Queued for delivery",
      "messageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@ekiri.ee>",
      "sendAt": "2022-10-12T12:10:34.845Z",
      "queueId": "183cc1a89ddfe365bbb"
    }
    

API response from EmailEngine about the queued email
As the email address we tried to send mail to does not exist, then after a few moments, there should be a new webhook sent to our app from EmailEngine. The webhook's event type is `"messageBounce"`, which identifies a bounce.

    {
      "serviceUrl": "https://emailengine.srv.dev",
      "account": "ekiri",
      "date": "2022-10-12T12:10:40.980Z",
      "event": "messageBounce",
      "data": {
        "bounceMessage": "AAAADAAAByc",
        "recipient": "unknown@ethereal.email",
        "action": "failed",
        "response": {
          "source": "smtp",
          "message": "550 No such user here",
          "status": "5.0.0"
        },
        "mta": "mx.ethereal.email",
        "queueId": "B7D3F8220C",
        "messageId": "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@ekiri.ee>",
        "messageHeaders": {
          "return-path": [
            "<andris@ekiri.ee>"
          ],
          "content-type": [
            "text/plain; charset=utf-8"
          ],
          "from": [
            "Andris Ekiri <andris@ekiri.ee>"
          ],
          "to": [
            "unknown@ethereal.email"
          ],
          "subject": [
            "Test message"
          ],
          "message-id": [
            "<3e013ba5-3bd2-a5f6-b102-5997c7d4d843@ekiri.ee>"
          ],
          "content-transfer-encoding": [
            "7bit"
          ],
          "date": [
            "Wed, 12 Oct 2022 12:10:34 +0000"
          ],
          "mime-version": [
            "1.0"
          ]
        }
      }
    }
    

As you can see, the `data.messageId` value matches the `messageId` value of the queued delivery, so our email, indeed, was not accepted by the recipient. The `data.response.message` value includes the error response from the MX server and `data.messageHeaders` is a structure that contains the headers of the email we tried to send.

### List sent emails

In addition to webhooks, the bounce information is also added to the emails in the sent emails folder listing. So, if sent emails are stored in a folder named `INBOX.Sent` and you list emails from it like this:

    $ curl -X "GET" \
      "https://emailengine.srv.dev/v1/account/ekiri/messages?path=INBOX.Sent" \
      -H "Authorization: Bearer secret123"
    

Then look for a `bounces` array in message entries. By default, there shouldn't be any, but if a bounce was registered for that specific email, the bounce information is listed in the bounces array. Why an array value? Each email can have multiple recipients, and each of these recipients can trigger a distinct bounce.

    ```
    {
      "total": 472,
      "page": 0,
      "pages": 24,
      "messages": [
        {
          "id": "AAAABgAAAdk",
          "uid": 473,
          "date": "2022-10-12T12:10:34.000Z",
          ...,
          "bounces": [
            {
              "message": "AAAADAAAByc",
              "recipient": "unknown@ethereal.email",
              "action": "failed",
              "response": {
                "message": "550 No such user here",
                "status": "5.0.0"
              },
              "date": "2022-10-12T12:10:40.003Z"
            }
          ]
        }
    ...
    ```

Bounce information includes the recipient that failed `unknown@ethereal.email`, SMTP server response `550 No such user here` if available and the bounce email ID `AAAABgAAAdk`. If you'd like, then you could use that ID to fetch the contents of the bounce report.

---

Well, that's about it. What to do with this bounce information depends on your application use case. You could plainly store it, or you could use it to trigger some additional automation steps, like removing the bouncing recipient from a mailing list.
