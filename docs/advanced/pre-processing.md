---
title: Pre-Processing Functions
sidebar_position: 6
description: Use JavaScript-based pre-processing functions to filter and transform webhooks and messages in EmailEngine
keywords:
  - pre-processing
  - javascript
  - webhooks
  - filtering
  - transformation
  - custom logic
---

<!--
SOURCE: docs/usage/pre-processing-functions.md
This guide covers EmailEngine's pre-processing functions for custom filtering and transformation logic.
-->

# Pre-Processing Functions

Pre-processing functions allow you to run custom JavaScript code to filter or transform data before EmailEngine processes it. Use these functions to implement custom business logic, filter unwanted events, or modify webhook payloads.

## Overview

EmailEngine supports pre-processing for:

- **Webhooks** - Filter or modify webhook payloads before delivery
- **Document Store** - Filter which emails are stored in Elasticsearch
- **Custom Routes** - Transform data before processing

Pre-processing functions are small JavaScript snippets that run in a secure sandbox environment.

## Function Types

### 1. Filter Functions

Filter functions determine whether an event should be processed or discarded.

**Return value:**
- `true` - Process the event
- `false` or any other value - Discard the event
- Exception thrown - Discard the event

**Use cases:**
- Skip webhooks for automated messages
- Only store important emails in Document Store
- Filter out spam or promotional emails

**Example - Skip auto-reply emails:**

```javascript
// Return true to send webhook, false to skip
function filterWebhook(data) {
  // Skip auto-replies
  if (data.headers && data.headers['auto-submitted']) {
    return false;
  }

  // Skip out-of-office messages
  if (data.subject && /out of office/i.test(data.subject)) {
    return false;
  }

  // Process all other webhooks
  return true;
}
```

### 2. Mapping Functions

Mapping functions modify the structure or content of data before processing.

**Return value:**
- Modified data object
- Original data unchanged if no return value

**Use cases:**
- Add custom fields to webhooks
- Redact sensitive information
- Normalize data formats
- Enrich with additional context

**Example - Add custom fields:**

```javascript
function mapWebhook(data) {
  // Add custom tracking ID
  data.customId = `${data.account}-${Date.now()}`;

  // Add priority based on subject
  if (data.subject && /urgent/i.test(data.subject)) {
    data.priority = 'high';
  } else {
    data.priority = 'normal';
  }

  // Redact sensitive content
  if (data.text) {
    data.text = data.text.replace(/ssn:\s*\d{3}-\d{2}-\d{4}/gi, 'ssn: [REDACTED]');
  }

  return data;
}
```

## Configuration

### Webhook Pre-Processing

Configure pre-processing for webhook routes in the EmailEngine UI.

#### Step 1: Navigate to Webhook Settings

1. Go to **Settings** → **Webhooks**
2. Click on the webhook route to configure
3. Scroll to **Pre-Processing Function** section

#### Step 2: Add Filter Function

```javascript
/**
 * Filter function for webhooks
 * @param {Object} data - Webhook payload
 * @returns {Boolean} - true to send webhook, false to skip
 */
function filterWebhook(data) {
  // Only send webhooks for inbox messages
  if (data.path !== 'INBOX') {
    return false;
  }

  // Skip notifications (usually automated)
  if (data.from && /noreply|no-reply/i.test(data.from.address)) {
    return false;
  }

  // Skip old messages (older than 1 hour)
  if (data.date) {
    const messageAge = Date.now() - new Date(data.date).getTime();
    if (messageAge > 3600000) { // 1 hour in milliseconds
      return false;
    }
  }

  return true;
}
```

#### Step 3: Add Mapping Function

```javascript
/**
 * Mapping function for webhooks
 * @param {Object} data - Webhook payload
 * @returns {Object} - Modified webhook payload
 */
function mapWebhook(data) {
  // Add custom fields
  data.metadata = {
    receivedAt: new Date().toISOString(),
    environment: 'production',
    version: '1.0'
  };

  // Categorize by subject
  if (data.subject) {
    const subject = data.subject.toLowerCase();
    if (subject.includes('invoice') || subject.includes('payment')) {
      data.category = 'billing';
    } else if (subject.includes('support') || subject.includes('help')) {
      data.category = 'support';
    } else {
      data.category = 'general';
    }
  }

  // Extract ticket ID from subject
  const ticketMatch = data.subject && data.subject.match(/#(\d+)/);
  if (ticketMatch) {
    data.ticketId = ticketMatch[1];
  }

  return data;
}
```

#### Step 4: Test Function

Use the **Test** button to verify your function works correctly:

```javascript
// Test with sample data
const testData = {
  account: 'john@example.com',
  path: 'INBOX',
  subject: 'Invoice #12345 - Payment Due',
  from: {
    name: 'Billing Department',
    address: 'billing@example.com'
  },
  date: new Date().toISOString()
};

// Run through filter
const shouldSend = filterWebhook(testData);
console.log('Should send:', shouldSend); // true

// Run through mapping
const mapped = mapWebhook(testData);
console.log('Mapped data:', mapped);
// Output includes: category: 'billing', ticketId: '12345', metadata: {...}
```

### Document Store Pre-Processing

Configure which emails are stored in Elasticsearch.

#### Configuration Page

Navigate to **Settings** → **Document Store** → **Pre-Processing**

![Document Store Pre-Processing Configuration](https://cldup.com/mEQk0jEyGc.png)

#### Filter Function Example

```javascript
/**
 * Filter which emails to store in Document Store
 * @param {Object} email - Email data
 * @returns {Boolean} - true to store, false to skip
 */
function filterDocument(email) {
  // Don't store spam
  if (email.labels && email.labels.includes('\\Junk')) {
    return false;
  }

  // Don't store automated messages
  if (email.headers && email.headers['auto-submitted']) {
    return false;
  }

  // Only store emails from last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  if (new Date(email.date).getTime() < thirtyDaysAgo) {
    return false;
  }

  // Store everything else
  return true;
}
```

#### Mapping Function Example

```javascript
/**
 * Transform email data before storing
 * @param {Object} email - Email data
 * @returns {Object} - Modified email data
 */
function mapDocument(email) {
  // Add search-friendly fields
  email.searchableText = [
    email.from?.name,
    email.from?.address,
    email.subject,
    email.text,
    ...(email.to || []).map(t => t.address)
  ].filter(Boolean).join(' ');

  // Extract domain from sender
  if (email.from && email.from.address) {
    email.senderDomain = email.from.address.split('@')[1];
  }

  // Normalize labels
  if (email.labels) {
    email.labels = email.labels.map(l => l.toLowerCase());
  }

  // Add indexing timestamp
  email.indexedAt = new Date().toISOString();

  return email;
}
```

## Common Use Cases

### 1. Skip Automated Emails

```javascript
function filterWebhook(data) {
  // Check Auto-Submitted header
  if (data.headers && data.headers['auto-submitted'] &&
      data.headers['auto-submitted'][0] !== 'no') {
    return false;
  }

  // Check for common automated addresses
  const automatedPatterns = [
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
    /notifications?/i,
    /mailer-daemon/i,
    /postmaster/i
  ];

  if (data.from && data.from.address) {
    for (const pattern of automatedPatterns) {
      if (pattern.test(data.from.address)) {
        return false;
      }
    }
  }

  // Check subject for automated patterns
  const automatedSubjects = [
    /out of office/i,
    /automatic reply/i,
    /auto-reply/i,
    /mail delivery fail/i
  ];

  if (data.subject) {
    for (const pattern of automatedSubjects) {
      if (pattern.test(data.subject)) {
        return false;
      }
    }
  }

  return true;
}
```

### 2. Extract and Normalize Data

```javascript
function mapWebhook(data) {
  // Extract email addresses from CC and BCC
  const allRecipients = [
    ...(data.to || []),
    ...(data.cc || []),
    ...(data.bcc || [])
  ].map(r => r.address);

  data.allRecipients = [...new Set(allRecipients)]; // Remove duplicates

  // Parse subject line for ticket/order numbers
  if (data.subject) {
    // Extract ticket ID (e.g., "#12345", "TICKET-12345")
    const ticketMatch = data.subject.match(/#(\d+)|TICKET-(\d+)/i);
    if (ticketMatch) {
      data.ticketId = ticketMatch[1] || ticketMatch[2];
    }

    // Extract order ID (e.g., "Order #12345", "Order ID: 12345")
    const orderMatch = data.subject.match(/order\s*#?:?\s*(\d+)/i);
    if (orderMatch) {
      data.orderId = orderMatch[1];
    }
  }

  // Normalize sender domain
  if (data.from && data.from.address) {
    const domain = data.from.address.split('@')[1];
    data.senderDomain = domain.toLowerCase();

    // Flag internal emails
    data.isInternal = ['example.com', 'company.com'].includes(domain);
  }

  return data;
}
```

### 3. Priority and Categorization

```javascript
function mapWebhook(data) {
  // Determine priority
  data.priority = 'normal';

  // High priority indicators
  const urgentKeywords = ['urgent', 'asap', 'important', 'critical'];
  const subject = (data.subject || '').toLowerCase();

  for (const keyword of urgentKeywords) {
    if (subject.includes(keyword)) {
      data.priority = 'high';
      break;
    }
  }

  // VIP senders
  const vipDomains = ['important-client.com', 'executive.com'];
  if (data.from && data.from.address) {
    const domain = data.from.address.split('@')[1];
    if (vipDomains.includes(domain)) {
      data.priority = 'high';
      data.isVip = true;
    }
  }

  // Categorize by content
  const categories = {
    billing: ['invoice', 'payment', 'receipt', 'billing'],
    support: ['support', 'help', 'question', 'issue'],
    sales: ['quote', 'proposal', 'pricing', 'demo'],
    hr: ['benefits', 'payroll', 'pto', 'vacation']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (subject.includes(keyword)) {
        data.category = category;
        break;
      }
    }
    if (data.category) break;
  }

  data.category = data.category || 'general';

  return data;
}
```

### 4. Redact Sensitive Information

```javascript
function mapWebhook(data) {
  // Patterns for sensitive data
  const patterns = {
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  };

  // Redact from text
  if (data.text) {
    data.text = data.text.replace(patterns.ssn, 'SSN:[REDACTED]');
    data.text = data.text.replace(patterns.creditCard, 'CARD:[REDACTED]');
  }

  // Redact from HTML
  if (data.html) {
    data.html = data.html.replace(patterns.ssn, 'SSN:[REDACTED]');
    data.html = data.html.replace(patterns.creditCard, 'CARD:[REDACTED]');
  }

  // Flag as containing sensitive data
  const originalText = data.text || '';
  if (patterns.ssn.test(originalText) || patterns.creditCard.test(originalText)) {
    data.containsSensitiveData = true;
  }

  return data;
}
```

### 5. Add Metadata and Context

```javascript
function mapWebhook(data) {
  // Add processing metadata
  data.processing = {
    receivedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    serverHostname: require('os').hostname(),
    version: '2.0'
  };

  // Calculate message size
  const textSize = (data.text || '').length;
  const htmlSize = (data.html || '').length;
  data.sizeBytes = textSize + htmlSize;

  // Count attachments by type
  if (data.attachments) {
    data.attachmentStats = {
      total: data.attachments.length,
      images: data.attachments.filter(a => a.contentType?.startsWith('image/')).length,
      documents: data.attachments.filter(a => a.contentType?.includes('pdf') ||
                                               a.contentType?.includes('word')).length,
      totalSize: data.attachments.reduce((sum, a) => sum + (a.size || 0), 0)
    };
  }

  // Detect language (simple heuristic)
  const text = data.text || '';
  if (/[а-яА-Я]/.test(text)) {
    data.language = 'ru';
  } else if (/[à-ÿÀ-Ÿ]/.test(text)) {
    data.language = 'fr';
  } else if (/[äöüßÄÖÜ]/.test(text)) {
    data.language = 'de';
  } else {
    data.language = 'en';
  }

  return data;
}
```

## Available Data

### Webhook Payload

Pre-processing functions receive the complete webhook payload:

```javascript
{
  // Event info
  event: 'messageNew',
  account: 'john@example.com',
  date: '2024-10-13T14:23:45.678Z',

  // Message data
  id: 'AAAABgAAAdk',
  uid: 123,
  emailId: '<abc@example.com>',
  messageId: '<abc@example.com>',
  subject: 'Important Message',
  from: {
    name: 'John Doe',
    address: 'john@example.com'
  },
  to: [
    { name: 'Jane Smith', address: 'jane@example.com' }
  ],
  cc: [],
  bcc: [],
  date: '2024-10-13T14:20:00.000Z',

  // Content
  text: 'Plain text content...',
  html: '<p>HTML content...</p>',

  // Metadata
  path: 'INBOX',
  labels: ['\\Inbox'],
  flags: [],

  // Headers
  headers: {
    'message-id': ['<abc@example.com>'],
    'references': ['<xyz@example.com>'],
    'in-reply-to': ['<xyz@example.com>'],
    'content-type': ['text/plain; charset=utf-8']
  },

  // Attachments
  attachments: [
    {
      id: 'abc123',
      contentType: 'application/pdf',
      filename: 'document.pdf',
      size: 12345
    }
  ]
}
```

### Document Store Payload

Similar structure with additional indexing fields:

```javascript
{
  // All webhook fields, plus:

  // IMAP metadata
  internalDate: '2024-10-13T14:20:00.000Z',
  encodedSize: 12345,

  // Gmail-specific
  threadId: 'abc123',
  labelIds: ['INBOX', 'UNREAD']
}
```

## Sandbox Environment

Pre-processing functions run in a secure sandbox with limited access:

**Available:**
- Standard JavaScript (ES6+)
- `Date`, `Math`, `JSON`, `RegExp`
- `console.log()` for debugging

**Not Available:**
- `require()` - Cannot import modules
- `fs`, `http`, `net` - No filesystem or network access
- `process`, `child_process` - No system access
- External variables - Functions are isolated

**Performance:**
- Timeout: 1000ms (1 second)
- Memory limit: 50MB
- CPU limit: Moderate

Functions that exceed limits are terminated and the event is discarded.

## Security Considerations

### 1. Validate Input

Always validate data before processing:

```javascript
function filterWebhook(data) {
  // Check required fields exist
  if (!data.from || !data.from.address) {
    return false;
  }

  // Validate structure
  if (typeof data.subject !== 'string') {
    return false;
  }

  return true;
}
```

### 2. Avoid Exposing Secrets

Don't hardcode sensitive values:

```javascript
// Bad - hardcoded secret
function mapWebhook(data) {
  data.apiKey = 'secret123'; // Don't do this!
  return data;
}

// Good - use webhook payload only
function mapWebhook(data) {
  data.timestamp = Date.now();
  return data;
}
```

### 3. Handle Errors Gracefully

```javascript
function mapWebhook(data) {
  try {
    // Your transformation logic
    data.customField = JSON.parse(data.customData);
  } catch (err) {
    // Log error but don't crash
    console.log('Failed to parse custom data:', err.message);
    data.customField = null;
  }

  return data;
}
```

### 4. Limit Computation

Avoid expensive operations:

```javascript
// Bad - expensive regex
function filterWebhook(data) {
  // This can cause performance issues
  return !/(a+)+b/.test(data.text); // Catastrophic backtracking
}

// Good - efficient check
function filterWebhook(data) {
  return data.text && data.text.length < 100000; // Simple check
}
```

## Testing

### Test in UI

Use the built-in test feature:

1. Write your function
2. Click **Test**
3. Provide sample data
4. View results and console output

### Test Locally

Create a test script:

```javascript
// test-preprocessing.js

// Your pre-processing function
function filterWebhook(data) {
  if (data.headers && data.headers['auto-submitted']) {
    return false;
  }
  return data.path === 'INBOX';
}

function mapWebhook(data) {
  data.customId = `${data.account}-${Date.now()}`;
  return data;
}

// Test cases
const testCases = [
  {
    name: 'Normal inbox message',
    data: {
      account: 'john@example.com',
      path: 'INBOX',
      subject: 'Hello',
      from: { address: 'jane@example.com' }
    },
    expectedFilter: true
  },
  {
    name: 'Auto-reply message',
    data: {
      account: 'john@example.com',
      path: 'INBOX',
      subject: 'Auto-reply',
      headers: { 'auto-submitted': ['auto-replied'] },
      from: { address: 'jane@example.com' }
    },
    expectedFilter: false
  },
  {
    name: 'Sent folder message',
    data: {
      account: 'john@example.com',
      path: 'Sent',
      subject: 'Reply',
      from: { address: 'john@example.com' }
    },
    expectedFilter: false
  }
];

// Run tests
for (const test of testCases) {
  console.log(`\nTest: ${test.name}`);

  const shouldSend = filterWebhook(test.data);
  console.log(`  Filter result: ${shouldSend}`);
  console.log(`  Expected: ${test.expectedFilter}`);
  console.log(`  ${shouldSend === test.expectedFilter ? '✓ PASS' : '✗ FAIL'}`);

  if (shouldSend) {
    const mapped = mapWebhook(test.data);
    console.log(`  Mapped data:`, mapped);
  }
}
```

Run tests:

```bash
node test-preprocessing.js
```

## Performance Considerations

### 1. Keep Functions Fast

Pre-processing runs for every event. Keep functions lightweight:

```javascript
// Fast - simple checks
function filterWebhook(data) {
  return data.path === 'INBOX' && !data.headers['auto-submitted'];
}

// Slow - complex operations
function filterWebhook(data) {
  // Avoid expensive regex, loops, or parsing
  const words = data.text.split(/\s+/); // Can be slow for large messages
  return words.length > 10;
}
```

### 2. Cache Computed Values

If checking multiple conditions, store intermediate results:

```javascript
function mapWebhook(data) {
  const subject = (data.subject || '').toLowerCase(); // Compute once

  // Use cached value
  data.isUrgent = subject.includes('urgent') ||
                  subject.includes('important');

  data.isBilling = subject.includes('invoice') ||
                   subject.includes('payment');

  return data;
}
```

### 3. Exit Early

Return as soon as you know the result:

```javascript
function filterWebhook(data) {
  // Exit early if conditions not met
  if (data.path !== 'INBOX') return false;
  if (!data.from || !data.from.address) return false;
  if (data.headers && data.headers['auto-submitted']) return false;

  // Only process if all checks passed
  return true;
}
```

## Debugging

### Enable Console Logging

Use `console.log()` to debug:

```javascript
function filterWebhook(data) {
  console.log('Processing webhook for account:', data.account);
  console.log('Message path:', data.path);
  console.log('Has auto-submitted header:', !!data.headers?.['auto-submitted']);

  const result = data.path === 'INBOX';
  console.log('Filter result:', result);

  return result;
}
```

View logs in EmailEngine logs or UI test console.

### Check EmailEngine Logs

```bash
# View pre-processing logs
tail -f logs/emailengine.log | grep "pre-processing"

# View function errors
tail -f logs/emailengine.log | grep "function.*error"
```

### Monitor Execution Time

Log timing information:

```javascript
function mapWebhook(data) {
  const start = Date.now();

  // Your transformations
  data.customField = processData(data);

  const duration = Date.now() - start;
  console.log(`Processing took ${duration}ms`);

  return data;
}
```

## Best Practices

1. **Keep functions simple** - Complex logic should be in your application
2. **Test thoroughly** - Test with various message types and edge cases
3. **Handle errors** - Use try/catch to prevent function failures
4. **Log important decisions** - Use console.log for debugging
5. **Validate input** - Check data structure before processing
6. **Avoid side effects** - Functions should be pure (no external state)
7. **Document your code** - Add comments explaining business logic
8. **Monitor performance** - Track function execution time
9. **Version your functions** - Keep history of changes

## Next Steps

- Configure [Webhooks](/docs/receiving/webhooks) for event delivery
- Set up [Document Store](/docs/receiving/continuous-processing#elasticsearch-integration) for email indexing
- Implement [Performance Tuning](/docs/advanced/performance-tuning) for optimal throughput
- Review [Security Best Practices](/docs/deployment/security)

## Related Resources

- [Webhook Events Reference](/docs/reference/webhook-events)
- [Message Operations](/docs/receiving/message-operations)
- [JavaScript Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)
