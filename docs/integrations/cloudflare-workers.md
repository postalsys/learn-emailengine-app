---
title: Cloudflare Email Workers Integration
sidebar_position: 6
description: Parse and process incoming emails with Cloudflare Email Workers
---

# Cloudflare Email Workers Integration

Learn how to parse and process incoming emails using Cloudflare Email Workers with the postal-mime library.

**Source**: [How to Parse Emails with Cloudflare Email Workers](https://emailengine.app/blog/how-to-parse-emails-with-cloudflare-email-workers) (February 27, 2024)

:::info
This guide covers general email processing with Cloudflare Email Workers and is not specific to EmailEngine. For processing incoming emails with EmailEngine instead, see other guides in this documentation.
:::

## Overview

Cloudflare [Email Workers](https://developers.cloudflare.com/email-routing/email-workers/) provide a serverless way to process incoming emails at the edge. The built-in API allows you to:

- Route incoming emails
- Access envelope information (SMTP from/to addresses)
- Reject emails with bounce responses
- Forward emails
- Generate and send new emails

However, the built-in API has limitations when accessing email content beyond basic headers.

## Limitations of Built-In API

### What's Available

Cloudflare provides:
- **Envelope Information**: SMTP envelope addresses
- **Headers Object**: Access to email headers via `message.headers.get()`
- **Raw Stream**: Full email source via `message.raw`

### What's Missing

The built-in API doesn't directly provide:
- Parsed To/CC/BCC addresses (beyond envelope)
- Email body (text or HTML content)
- Attachments
- Structured parsing of complex headers

### Example: Basic Header Access

```javascript
export default {
  async email(message, env, ctx) {
    // This works for simple single-line headers
    let subject = message.headers.get('subject');
    console.log('Subject:', subject);

    // But this is problematic for multi-value headers
    let to = message.headers.get('to'); // Only returns first value
  }
}
```

## Solution: postal-mime Library

The [postal-mime](https://www.npmjs.com/package/postal-mime) package provides complete email parsing capabilities compatible with Cloudflare Workers.

### Features

- **Complete Parsing**: Headers, body, attachments
- **Standards Compliant**: Proper MIME parsing
- **Lightweight**: Optimized for edge runtime
- **Stream Support**: Works with readable streams
- **No Dependencies**: Pure JavaScript implementation

## Installation

### 1. Install postal-mime

```bash
npm install postal-mime
```

### 2. Import in Worker Code

```javascript
import PostalMime from 'postal-mime';
```

### 3. Parse Incoming Emails

```javascript
export default {
  async email(message, env, ctx) {
    const email = await PostalMime.parse(message.raw);

    // Now you have access to everything
    console.log('Subject:', email.subject);
    console.log('From:', email.from);
    console.log('HTML:', email.html);
    console.log('Attachments:', email.attachments.length);
  }
}
```

## Parsed Email Structure

### Available Properties

```javascript
{
  // Headers
  from: { name: 'John Doe', address: 'john@example.com' },
  to: [
    { name: 'Jane Smith', address: 'jane@example.com' },
    { name: '', address: 'team@example.com' }
  ],
  cc: [...],
  bcc: [...],
  subject: 'Meeting Tomorrow',
  messageId: '<abc123@example.com>',
  inReplyTo: '<def456@example.com>',
  references: '<def456@example.com> <ghi789@example.com>',
  date: '2024-02-27T10:30:00.000Z',
  replyTo: [{ name: 'Reply Handler', address: 'reply@example.com' }],

  // Content
  text: 'Plain text version of email...',
  html: '<p>HTML version of email...</p>',

  // Attachments
  attachments: [
    {
      filename: 'document.pdf',
      mimeType: 'application/pdf',
      disposition: 'attachment',
      related: false,
      contentId: null,
      content: ArrayBuffer // or String/Base64 depending on encoding option
    }
  ]
}
```

### Address Format

All address fields use consistent format:

```javascript
{
  name: 'Display Name', // Optional
  address: 'email@example.com' // Required
}
```

**Single Address** (from, sender):
```javascript
email.from.address // 'john@example.com'
email.from.name    // 'John Doe'
```

**Multiple Addresses** (to, cc, bcc, replyTo):
```javascript
email.to.forEach(recipient => {
  console.log(recipient.name, recipient.address);
});
```

## Handling Attachments

By default, attachments are parsed as `ArrayBuffer` objects. You can configure alternative encodings:

### UTF-8 Encoding (Text Files)

For text attachments (.txt, .md, .csv, etc.):

```javascript
const email = await PostalMime.parse(message.raw, {
    attachmentEncoding: 'utf8'
});

// Now attachment content is a string
console.log(email.attachments[0].content);
// "This is the content of the text file..."
```

:::warning
Only use UTF-8 encoding for text files. Binary files (images, PDFs) will be corrupted.
:::

### Base64 Encoding (Binary Files)

For binary attachments or when you need to store/transmit safely:

```javascript
const email = await PostalMime.parse(message.raw, {
    attachmentEncoding: 'base64'
});

// Attachment content is base64-encoded string
const base64Content = email.attachments[0].content;

// Can be safely stored in JSON, databases, etc.
// Decode when needed:
const buffer = Buffer.from(base64Content, 'base64');
```

### Default (ArrayBuffer)

Without encoding option, attachments are ArrayBuffer:

```javascript
const email = await PostalMime.parse(message.raw);

const attachment = email.attachments[0];
// attachment.content is ArrayBuffer

// Process as needed:
const buffer = Buffer.from(attachment.content);
const base64 = buffer.toString('base64');
```

### Attachment Properties

```javascript
{
  filename: 'report.pdf',        // Original filename
  mimeType: 'application/pdf',   // MIME type
  disposition: 'attachment',     // 'attachment' or 'inline'
  related: false,                // true if inline image
  contentId: 'image1@example',   // Content-ID for inline images
  content: ArrayBuffer           // Content (format depends on encoding)
}
```

### Inline Images

Inline images (embedded in HTML) are marked with `related: true`:

```javascript
email.attachments.forEach(att => {
  if (att.related && att.contentId) {
    console.log(`Inline image: ${att.filename} (cid:${att.contentId})`);
    // This image is referenced in HTML as:
    // <img src="cid:${att.contentId}">
  } else {
    console.log(`Regular attachment: ${att.filename}`);
  }
});
```

## Complete Example

### Basic Email Parser

```javascript
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    // Parse the email
    const email = await PostalMime.parse(message.raw, {
        attachmentEncoding: 'base64'
    });

    // Log email details
    console.log('Subject:', email.subject);
    console.log('From:', email.from.address);
    console.log('HTML length:', email.html?.length || 0);

    // Log attachments
    email.attachments.forEach((attachment) => {
      console.log('Attachment:', attachment.filename,
                  'Type:', attachment.mimeType,
                  'Size:', attachment.content.length);
    });

    // Process based on content
    if (email.subject?.includes('Invoice')) {
      await processInvoice(email, env);
    } else if (email.attachments.length > 0) {
      await processAttachments(email, env);
    }
  }
}

async function processInvoice(email, env) {
  // Extract invoice details
  const invoiceMatch = email.subject.match(/INV-(\d+)/);
  const invoiceNumber = invoiceMatch ? invoiceMatch[1] : null;

  // Store in KV or D1
  await env.INVOICES.put(`invoice-${invoiceNumber}`, JSON.stringify({
    from: email.from.address,
    subject: email.subject,
    receivedAt: new Date().toISOString(),
    hasAttachments: email.attachments.length > 0
  }));
}

async function processAttachments(email, env) {
  // Save attachments to R2
  for (const att of email.attachments) {
    if (!att.related) { // Skip inline images
      const key = `attachments/${Date.now()}-${att.filename}`;
      await env.ATTACHMENTS.put(key, Buffer.from(att.content, 'base64'), {
        httpMetadata: {
          contentType: att.mimeType
        }
      });
    }
  }
}
```

### Auto-Reply Worker

```javascript
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const email = await PostalMime.parse(message.raw);

    // Check if it's an auto-reply (avoid loops)
    if (email.headers.get('auto-submitted') !== 'auto-replied') {

      // Send auto-reply
      await message.reply({
        from: 'noreply@yourdomain.com',
        subject: `Re: ${email.subject}`,
        text: `Thank you for your email. We'll get back to you soon.

Original message:
From: ${email.from.name || email.from.address}
Subject: ${email.subject}
Date: ${email.date}`,
        headers: {
          'Auto-Submitted': 'auto-replied'
        }
      });
    }

    // Forward to inbox
    await message.forward('inbox@yourdomain.com');
  }
}
```

### Content-Based Routing

```javascript
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const email = await PostalMime.parse(message.raw);

    // Route based on content
    if (email.subject?.toLowerCase().includes('support')) {
      await message.forward('support@yourdomain.com');
    } else if (email.subject?.toLowerCase().includes('sales')) {
      await message.forward('sales@yourdomain.com');
    } else if (email.from.address.endsWith('@partner.com')) {
      await message.forward('partners@yourdomain.com');
    } else {
      await message.forward('general@yourdomain.com');
    }
  }
}
```

### Spam/Phishing Detection

```javascript
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const email = await PostalMime.parse(message.raw);

    // Simple spam detection
    const spamIndicators = [
      !email.from.address,                           // No from address
      !email.subject,                                 // No subject
      email.subject?.toUpperCase() === email.subject, // ALL CAPS subject
      email.text?.includes('click here'),             // Suspicious text
      email.text?.includes('urgent action required'), // Urgency tactics
    ];

    const spamScore = spamIndicators.filter(x => x).length;

    if (spamScore >= 3) {
      await message.setReject("Suspected spam or phishing");
    } else {
      await message.forward('inbox@yourdomain.com');
    }
  }
}
```

### Attachment Processing

```javascript
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const email = await PostalMime.parse(message.raw, {
      attachmentEncoding: 'base64'
    });

    // Filter for PDF attachments
    const pdfAttachments = email.attachments.filter(att =>
      att.mimeType === 'application/pdf' && !att.related
    );

    if (pdfAttachments.length > 0) {
      // Store PDFs in R2
      for (const pdf of pdfAttachments) {
        const key = `pdfs/${email.from.address}/${Date.now()}-${pdf.filename}`;
        await env.PDF_BUCKET.put(
          key,
          Buffer.from(pdf.content, 'base64'),
          {
            httpMetadata: { contentType: 'application/pdf' },
            customMetadata: {
              from: email.from.address,
              subject: email.subject,
              receivedAt: new Date().toISOString()
            }
          }
        );
      }

      // Send notification
      await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'pdf_received',
          from: email.from.address,
          subject: email.subject,
          pdfCount: pdfAttachments.length
        })
      });
    }

    // Forward email
    await message.forward('inbox@yourdomain.com');
  }
}
```

## Integration with Cloudflare Services

### Store in D1 (SQL Database)

```javascript
async function storeEmail(email, env) {
  await env.DB.prepare(`
    INSERT INTO emails (from_address, subject, text_content, html_content, received_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    email.from.address,
    email.subject,
    email.text,
    email.html,
    new Date().toISOString()
  ).run();
}
```

### Store in KV

```javascript
async function storeInKV(email, env) {
  const key = `email-${Date.now()}-${email.messageId}`;
  await env.EMAILS_KV.put(key, JSON.stringify({
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    receivedAt: new Date().toISOString()
  }), {
    expirationTtl: 86400 * 30 // Expire after 30 days
  });
}
```

### Store Attachments in R2

```javascript
async function storeAttachments(email, env) {
  for (const att of email.attachments) {
    if (!att.related) {
      const key = `attachments/${email.messageId}/${att.filename}`;
      await env.ATTACHMENTS_R2.put(key, att.content, {
        httpMetadata: { contentType: att.mimeType }
      });
    }
  }
}
```

### Send to Analytics

```javascript
async function logToAnalytics(email, env) {
  await env.ANALYTICS.writeDataPoint({
    blobs: [email.from.address, email.subject],
    doubles: [email.attachments.length],
    indexes: ['email_received']
  });
}
```

## Best Practices

### 1. Error Handling

Always wrap parsing in try-catch:

```javascript
export default {
  async email(message, env, ctx) {
    try {
      const email = await PostalMime.parse(message.raw);
      await processEmail(email, env);
    } catch (error) {
      console.error('Email parsing failed:', error);
      // Optionally forward unparseable emails
      await message.forward('errors@yourdomain.com');
    }
  }
}
```

### 2. Avoid Loops

Prevent auto-reply loops:

```javascript
// Check for auto-reply headers
const autoSubmitted = message.headers.get('auto-submitted');
const precedence = message.headers.get('precedence');

if (autoSubmitted === 'auto-replied' || precedence === 'bulk') {
  // Don't auto-reply to auto-replies or bulk emails
  return;
}
```

### 3. Validate Addresses

```javascript
function isValidEmail(address) {
  return address && address.includes('@') && address.length > 3;
}

if (!isValidEmail(email.from.address)) {
  await message.setReject("Invalid sender address");
  return;
}
```

### 4. Size Limits

Be aware of Cloudflare Workers limits:
- **CPU Time**: 50ms (free), 50ms-15min (paid)
- **Memory**: 128MB
- **Response Size**: 10MB

For large emails or attachments, consider:
- Processing asynchronously
- Storing in R2 instead of inline processing
- Using Durable Objects for stateful processing

### 5. Use Workers KV for State

Store processing state to avoid duplicates:

```javascript
const messageId = email.messageId;
const processed = await env.PROCESSED.get(messageId);

if (processed) {
  console.log('Already processed this email');
  return;
}

// Process email...

await env.PROCESSED.put(messageId, 'true', {
  expirationTtl: 86400 * 7 // Keep for 7 days
});
```

## Debugging

### Log Parsed Structure

```javascript
const email = await PostalMime.parse(message.raw);

console.log('Parsed email:', JSON.stringify({
  from: email.from,
  to: email.to,
  subject: email.subject,
  textLength: email.text?.length || 0,
  htmlLength: email.html?.length || 0,
  attachmentCount: email.attachments.length
}, null, 2));
```

### Test Locally with Wrangler

```bash
# Install wrangler
npm install -g wrangler

# Test worker locally
wrangler dev

# View logs
wrangler tail
```

### Use Workers Logs

View real-time logs in Cloudflare dashboard:
1. Navigate to Workers & Pages
2. Select your worker
3. Click "Logs" tab
4. Watch real-time stream

## Limitations and Considerations

### 1. No EmailEngine Features

This approach doesn't include EmailEngine's features:
- Account management
- IMAP synchronization
- Webhook notifications
- Message search
- Thread tracking

**Use Cloudflare Workers for**: Inbound email processing at edge
**Use EmailEngine for**: Full email account management and 2-way sync

### 2. Inbound Only

Cloudflare Email Workers handle incoming emails only. For sending:
- Use Cloudflare Workers with SMTP (via external service)
- Use EmailEngine for sending from user accounts
- Use Cloudflare's future email sending features

### 3. Processing Time Limits

Workers have execution time limits. For long processing:
- Queue to Durable Objects
- Use Queue API
- Store and process asynchronously

## Comparison with EmailEngine

| Feature | Cloudflare Workers | EmailEngine |
|---------|-------------------|-------------|
| **Inbound Processing** | [YES] Excellent | [YES] Excellent |
| **Outbound Sending** | [NO] Limited | [YES] Full support |
| **Account Management** | [NO] No | [YES] Full |
| **IMAP Sync** | [NO] No | [YES] Full |
| **Search** | [NO] Limited | [YES] Full |
| **Edge Processing** | [YES] Yes | [NO] No |
| **Webhooks** | [WARNING] Custom | [YES] Built-in |
| **Deployment** | [YES] Serverless | [WARNING] Server required |

**When to Use Cloudflare Workers**:
- Process inbound emails at edge
- Simple routing and filtering
- Serverless architecture preference
- High volume inbound processing

**When to Use EmailEngine**:
- Need full email account management
- Send emails from user accounts
- 2-way IMAP/SMTP sync
- CRM or application integration

**Combined Approach**:
- Use Cloudflare Workers for inbound processing
- Use EmailEngine for account management and sending
- Best of both worlds

## Next Steps

- Review [postal-mime documentation](https://www.npmjs.com/package/postal-mime)
- Explore [Cloudflare Email Workers docs](https://developers.cloudflare.com/email-routing/email-workers/)
- Learn about [EmailEngine integrations](/docs/integrations/index.md)
- Compare with [EmailEngine receiving features](/docs/receiving/index.md)

## See Also

- [Receiving Emails with EmailEngine](/docs/receiving/index.md)
- [Webhooks Configuration](/docs/usage/webhooks.md)
- [Low-Code Integrations](/docs/integrations/low-code.md)
- [API Reference](/docs/api-reference/index.md)

## Resources

- **postal-mime**: [npmjs.com/package/postal-mime](https://www.npmjs.com/package/postal-mime)
- **Cloudflare Email Workers**: [developers.cloudflare.com/email-routing/email-workers/](https://developers.cloudflare.com/email-routing/email-workers/)
- **Cloudflare Workers**: [workers.cloudflare.com](https://workers.cloudflare.com/)
- **EmailEngine**: [emailengine.app](https://emailengine.app/)
