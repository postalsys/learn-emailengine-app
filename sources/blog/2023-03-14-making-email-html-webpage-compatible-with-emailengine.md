---
title: Making email HTML web compatible
slug: making-email-html-webpage-compatible-with-emailengine
date_published: 2023-03-14T08:58:33.000Z
date_updated: 2023-03-14T09:12:27.000Z
---

Designing HTML emails can be a daunting task. With various email clients and devices that users might access their emails on, it is important to ensure that your email looks good and functions properly on all of them. However, what is even more challenging is parsing and displaying these emails on an email client website.

Emails aren't usually displayed as separate web pages but are embedded into the email client's user interface. This means that if the HTML in an email is broken, it can cause some serious problems. For example, if a sender forgets to include a closing `</div>` tag, it could completely mess up the entire webmail interface. And it's not just about broken code - if a sender uses `<style>` tags with `body` definitions, it could even override the styles of the email client web page itself. Plus, there's always the risk of malicious intent, such as injecting javascript into the HTML code. Overall, inserting HTML from emails into another webpage can be quite challenging, so it's important to be cautious and thorough to avoid any issues.

### Iframes

A common solution for these issues is to use `<iframe>` containers. This allows the email to be treated as a separate web page while still being displayed within the webmail user interface. Additionally, modern browsers offer features like the `sandbox`[attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox) that can be used to set special rules for iframes, such as suppressing scripting in the email's HTML code.

When it comes to displaying iframes with unknown HTML content within a webmail interface, there are a few things to keep in mind. It can be tricky to get the iframe to display smoothly, especially if you're trying to make your webmail client responsive to different screen sizes. If the iframe height is too low, you might end up with scrollbars for the email content, while if it's too high, you might end up with a section of blank space. And, if users resize their browser windows, you'll need to adjust the size of the iframe accordingly, which adds another layer of difficulty.

### Attachments

When it comes to attachments in emails, there are actually two types to be aware of. The first type is regular attachments, which are meant to be downloaded by the recipient. The second type is embedded attachments, which are designed to be displayed within the email's HTML as regular images.

If you take a closer look at the HTML code of an email with embedded attachment images, you might notice that the image tags look a bit different. That's because they use a `cid` protocol URL instead of the more common HTTP protocol URLs. The `cid` URL refers to the `Content-ID` of an attached image file, and it's up to the email client to ensure that the image tag in the HTML displays the correct image. Of course, browsers aren't familiar with `cid` links, so the URL will need to be replaced in some way by the email client, adding to the complexity of building an email user interface.

### Inline HTML with EmailEngine

[EmailEngine](https://emailengine.app/) can help you overcome those issues through some clever pre-processing techniques. By default, no pre-processing is done, so if you use the "Get message information" [API endpoint](https://api.emailengine.app/#operation/getV1AccountAccountMessageMessage), the included HTML looks exactly as the sender defined it.

However, by making use of some additional query options, you can unlock some powerful features. For example, setting `embedAttachedImages` to `true` will replace all `cid` links in the HTML with base64 encoded inline Data URL images. Meanwhile, setting `preProcessHtml` to `true` will run a series of optimizations on the HTML code to fix any broken tags, remove any suspicious content, and more.

> EmailEngine uses standard tools like [DOMPurify](https://github.com/cure53/DOMPurify) to sanitize the HTML code.

With both options enabled, you can fetch your email message information from EmailEngine and use the returned HTML code directly on your web page.
![](__GHOST_URL__/content/images/2023/03/Screenshot_2023-03-02_at_15.24.54.png)Make sure that `textType` is set to `*` (means "all"), otherwise, there would be no content to pre-process.
When you check out the webpage on the following screenshot, you'll notice that there are two main sections. The outer section represents the webmail UI, while the inner section is the HTML content that has been pre-processed by EmailEngine and injected directly onto the page. By using this approach, you can seamlessly integrate your email content with your website, creating a cohesive and user-friendly experience.
![](__GHOST_URL__/content/images/2023/03/Screenshot_2023-03-02_at_15.33.37.png)
Pre-processing works just as well if making requests against the ElasticSearch cache by setting the `documentStore` option to `true` if you have [ElasticSearch caching](https://emailengine.app/document-store) enabled for EmailEngine. In fact, it is way faster that way, as EmailEngine caches inlined image attachments in ElasticSearch, so there is no need to run any requests against the IMAP server to generate the HTML.
