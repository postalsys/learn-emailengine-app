---
title: How to parse emails with Cloudflare Email Workers?
slug: how-to-parse-emails-with-cloudflare-email-workers
date_published: 2024-02-27T10:11:00.000Z
date_updated: 2025-04-15T16:38:56.000Z
tags: Cloudflare
---

> This blog post is about general email processing with Cloudflare Email Workers and is not specific to EmailEngine. If you want to process incoming emails with EmailEngine instead, see the other posts [here](__GHOST_URL__/tag/email-engine/).

Cloudflare [Email Workers](https://developers.cloudflare.com/email-routing/email-workers/) are a nifty way to process incoming emails. The built-in API of Cloudflare Workers allows you to route these emails, and it also provides some email metadata information. For example, you can reject an incoming email with a bounce response, you can forward it, or you can generate and send a new email. Your worker is also provided with the SMTP envelope information, like the envelope-*from *and envelope-*to* addresses used for routing.

    export default {
      async email(message, env, ctx) {
        message.setReject("I don't like your email :(");
      }
    }
    

All emails to such an email route will bounce with the provided message.
![](__GHOST_URL__/content/images/2024/02/Screenshot-2024-02-22-at-14.22.02.png)
But what about the content? Email routing information is mainly relevant for routing but not so much for processing. For example, it is probably not useful at all to detect the sender address as something like *bounce-mc.us20_123456789.17649072-1234567899@mail30.atl18.mcdlv.net*. It only tells us that this email was sent through a Mailchimp mailing list, but it does not reveal the actual sender. And what about the subject of the email or HTML body?

It turns out Cloudflare provides *some* information about the email contents. The message object includes a `headers` object which you can use to read email headers. It makes it really easy to read stuff like email subject line:

    let subject = message.headers.get('subject');
    

The `headers.get()` method is good for reading single-line values like the subject line but kind of falls through when processing headers that might have multiple values like the `To:` or` Cc:` address lines. Additionally, there is no information at all about the text contents of the email or attachments.

Luckily, the message object includes an additional property called `raw`, which is a readable stream. From that stream, we can read the source code of the email, which in itself, yet again, is not very useful, but we can parse it to get any information we need about the email. Email parsing is quite complex and difficult, but luckily, there is a solution: the [postal-mime](https://www.npmjs.com/package/postal-mime) package.

All you need to do is to install [postal-mime](https://www.npmjs.com/package/postal-mime) dependency from NPM.

    npm install postal-mime
    

And import it into your worker code.

    import PostalMime from 'postal-mime';
    

This allows you to easily parse incoming emails.

    const email = await PostalMime.parse(message.raw);
    

The resulting parsed `email` object includes a bunch of stuff like the subject line (`email.subject`) or the HTML content of the email (`email.html`). You can find the full list of available properties from the [docs](https://www.npmjs.com/package/postal-mime#parserparse).

### Attachment support.

PostalMime parses all attachments into `ArrayBuffer` objects. If you want to process the contents of an attachment as a regular string (which makes sense for textual attachments but not for binary files like images) or as a base64 encoded string, you can use the `attachmentEncoding` configuration option.

    const email = await PostalMime.parse(message.raw, {
        // Using "utf8" makes only sense with text files like .txt or .md
        // For binary files likes images or PDF, use "base64" instead
        attachmentEncoding: 'utf8'
    });
    console.log(email.attachments[0].content);

If you need to process binary attachments as strings, converting the ArrayBuffer value into a base64 encoded string is probably best. Set the `attachmentEncoding` configuration option to "base64," and that's it; you can now process binary attachments safely as strings.

### Full example

The following Email Worker parses an incoming email and logs some information about the parsed email to the worker's log output.

    import PostalMime from 'postal-mime';
    
    export default {
      async email(message, env, ctx) {
        const email = await PostalMime.parse(message.raw, {
            attachmentEncoding: 'base64'
        });
    
        console.log('Subject', email.subject);
        console.log('HTML', email.html);
    
        email.attachments.forEach((attachment) => {
          console.log('Attachment', attachment.filename, attachment.content);
        });
      },
    };
    
