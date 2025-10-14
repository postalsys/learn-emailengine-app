---
title: Transactional email service
slug: using-as-a-transactional-email-service
date_published: 2021-08-17T07:24:48.000Z
date_updated: 2021-12-12T20:03:58.000Z
tags: EmailEngine, SMTP
excerpt: EmailEngine is a self-hosted open-source application that provides a REST interface on top of any email account you can access, to read and send emails. Combining these features would give you a similar email sending experience you'd get from a transactional email service.
---

EmailEngine allows converting any email account into a poor-man's transactional email service. You can submit an email message for delivery; EmailEngine queues it and then tries to relay that message to the SMTP server of the sending account.

- You can submit emails for delivery either via REST API or SMTP
- You can schedule sending by providing a future date for delivery
- When an email bounces, a webhook notification is sent with the details of that bounce
- Sent emails are automatically uploaded to the "Sent Mail" folder
- If the sent email has a reference to a previous email, then this email is marked as *Answered*

### Delivery via API

To submit an email for delivery using the EmailEngine API, you can POST structured message details to the `/v1/account/{account}/submit` endpoint (see the details for that endpoint [here](https://api.emailengine.app/#operation/postV1AccountAccountSubmit)). As the message is provided as a structured object, you do not need to know anything MIME specific. EmailEngine takes the input (Unicode for strings, base64 for binary data like attachments) and converts it to a valid RFC822 message file sent to SMTP.

Here's an example of such a submission. Note that this example has no `subject` value set as the subject can be derived from the referenced message. In this case, EmailEngine would also make sure that headers like `In-Reply-To` and `References` are properly set. If you want to use a different subject, you can still set the `subject` property to do so.

    $ curl -XPOST "localhost:3000/v1/account/example/submit" -H "content-type: application/json" -d '{
        "reference": {
            "message": "AAAAAQAAP1w",
            "action": "reply"
        },
        "from": {
            "name": "Example Sender",
            "address": "andris@kreata.ee"
        },
        "to": [{
            "name": "Andris Reinman",
            "address": "andris@ethereal.email"
        }],
        "text": "test",
        "html": "<p>test</p>",
        "attachments": [
            {
                "filename": "checkmark.png",
                "content": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC"
            }
        ]
    }'

For successful submission, you should get a response that looks like the following:

    {
      "response": "Queued for delivery",
      "messageId": "<188db4df-3abb-806c-94c8-7a9303652c50@kreata.ee>",
      "sendAt": "2021-08-16T15:04:46.161Z",
      "queueId": "24279fb3e0dff64e"
    }
    

This does not yet mean that EmailEngine would have relayed the message to the SMTP server. It implies that EmailEngine has queued this message internally and tries to deliver it to the SMTP server as soon as possible (or if `sendAt` value was used then at the specified time). Once the message has been passed over to the account's SMTP server (or the server rejects it), EmailEngine sends a webhook notification.

    {
      "account": "example",
      "date": "2021-08-16T15:04:47.047Z",
      "event": "messageSent",
      "data": {
        "messageId": "<188db4df-3abb-806c-94c8-7a9303652c50@kreata.ee>",
        "response": "250 2.0.0 OK  1629126286 z8sm965227lfs.177 - gsmtp",
        "queueId": "24279fb3e0dff64e",
        "envelope": {
          "from": "andris@kreata.ee",
          "to": [
            "andris@ethereal.email"
          ]
        }
      }
    }
    

### Delivery via SMTP

SMTP sending is not enabled by default with EmailEngine. To use it, you would have to start the built-in SMTP server by enabling it from the configuration page.
![](__GHOST_URL__/content/images/2021/12/Screenshot-2021-12-12-at-16.52.47.png)
In general, you would be using EmailEngine's SMTP like any other SMTP server. There are some things to consider, though.

- Use `X-EE-Send-At` header to schedule future delivery time
- If authentication is disabled, you have to provide a `X-EE-Account` header that would set the account Id you want to use to send out the message.
- If your message includes a `Bcc` header then it is removed from the message automatically
- EmailEngine ensures that mandatory headers like `Message-Id`, `MIME-Version` and `Date` would be set
- There is no TLS support. Make sure that your SMTP client is configured to use a cleartext connection
- If you have to support TLS for SMTP, then you can use HAProxy with `send-proxy` option in front of EmailEngine (make sure though that "Enable PROXY protocol" is checked in SMTP Server's configuration page so that EmailEngine would be able to use the HAProxy protocol)

### Trying out SMTP

SMTP is a text-based protocol, and you can test it straight from the shell. First, you'd need the authentication argument for the AUTH PLAIN command to authenticate yourself. Other email protocols allow authentication with regular text username and password, which makes it easier to do manually, but all SMTP authentication mechanisms require authentication arguments to be encoded in *base64*.

If account ID is `example` and SMTP password value is `saladus` then you can generate the authentication argument in the shell-like this (note the mandatory `\0` sequences in front of the values):

    $ echo -ne "\0example\0saladus" | base64
    AGV4YW1wbGUAc2FsYWR1cw==
    

Next, you can connect to the SMTP relay with *telnet* or *netcat*:

    $ telnet localhost 2525
    

or

    $ nc -c localhost 2525
    

Once connected, run the SMTP handshake and authenticate yourself with the following commands:

    EHLO foo
    AUTH PLAIN AGV4YW1wbGUAc2FsYWR1cw==
    

The server should respond to the second command with `235 Authentication successful`.

To send an actual email, use the following command sequence. `MAIL FROM` can only be issued once. `RCPT TO` can be run many times. Once you send the `DATA` command, you can't change the recipient list anymore. Instead, you'd have to enter the MIME formatted message and then, on a separate line, send the dot symbol to complete the transaction.

    MAIL FROM:<andris@kreata.ee>
    RCPT TO:<andris@ethereal.email>
    DATA
    From: andris@kreata.ee
    To: andris@ethereal.email
    Subject: hello world!
    
    Hello!
    .
    
    

EmailEngine inserts missing mandatory headers like "Date" automatically.
> If you have previously not used SMTP directly then beware that the email is only sent to addresses submitted using the `RCPT TO` command. The addresses in the message's To, Cc and Bcc headers are informational only and not used in email routing

The server should respond with a success message:

    250 Message queued for delivery as 88f430cc6dbe9a65 (2021-08-16T12:15:17.408Z)
    

The timestamp in the response message shows the scheduled sending time.
### Scheduled sending

In general, EmailEngine tries to relay the message as soon as possible. You can delay sending to a suitable future time by using message scheduling. Emails can be scheduled both when sending via the API and SMTP.

Scheduling with the API can be done using the `sendAt` property. The value would be an ISO formatted timestamp of the time the message should be sent.

    $ curl -XPOST "localhost:3000/v1/account/example/submit" -H "content-type: application/json" -d '{
        "from": {
            "name": "Example Sender",
            "address": "andris@kreata.ee"
        },
        "to": [{
            "name": "Andris Reinman",
            "address": "andris@ethereal.email"
        }],
        "subject": "Scheduled email",
        "text": "test",
        "html": "<p>test</p>",
        "sendAt": "2021-08-18T06:42:25.408Z"
    }'
    

For SMTP, add an additional `X-EE-Send-At` header with the timestamp value to the message to schedule it. The server then removes that header from the message before delivering it.

    From: andris@kreata.ee
    To: andris@ethereal.email
    Subject: hello world!
    X-EE-Send-At: 2021-08-18T06:42:25.408Z
    
    Hello!
    

Once the message gets delivered (or rejected), you'd get a regular webhook notification about it.

### Bounce detection

One of the nifty features of EmailEngine is to automatically pick up information about bounced emails from the IMAP account. For example, when you try to send to a non-existing email address, the email is first accepted for delivery. If it later fails with a bounce response, you'd get a notification about the failure.

    {
      "account": "example",
      "date": "2021-08-16T11:55:06.107Z",
      "event": "messageBounce",
      "data": {
        "bounceMessage": "AAAAAgAAxxk",
        "recipient": "asfassdf@ethereal.email",
        "action": "failed",
        "response": {
          "source": "smtp",
          "message": "550 5.1.1 No such user",
          "status": "5.1.1"
        },
        "mta": "mx.ethereal.email. (13.49.22.0, the server for the domain ethereal.email.)",
        "messageId": "<19f1157c-d72b-50eb-74d5-d30f9ec816d3@kreata.ee>"
      }
    }
    

Note that though the bounce info includes a reference ID to the bounce response email (that is, the email sent by the MTA server and includes the bounce response, in this case `"AAAAAgAAxxk"`), it does not have a reference to the original message that was sent, and that got rejected. Instead, you get only Message-ID value that you can use to match the original message yourself. EmailEngine does not keep a registry of Message-ID values and does not know from which folder to look for that message. This behavior might change in the future, though.
