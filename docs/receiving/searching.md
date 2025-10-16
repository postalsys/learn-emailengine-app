---
title: Searching Messages
sidebar_position: 5
description: "Complete guide to searching emails with EmailEngine - search queries, operators, filters, and best practices"
keywords:
  - email search
  - search queries
  - IMAP search
  - message filtering
  - search operators
---

# Searching Messages

<!--
Source attribution:
- EmailEngine API documentation
- IMAP SEARCH command reference
- Common search patterns
-->

EmailEngine provides powerful [search capabilities](/docs/api/post-v-1-account-account-search) to find messages across your email accounts. Search queries use IMAP SEARCH syntax under the hood, making them compatible with virtually any email server.

## Why Use Search?

**Performance**
- Server-side filtering reduces data transfer
- Faster than fetching all messages and filtering locally
- Scales to mailboxes with thousands of messages

**Flexibility**
- Combine multiple criteria
- Search by date ranges, flags, content, headers
- Use complex boolean logic

**Efficiency**
- Returns only matching messages
- Reduces API calls and processing time
- Lower memory usage

## Basic Search

### Search by Subject

Find messages with specific subject text:

```bash
curl "https://your-emailengine.com/v1/account/example/search?path=INBOX&search[subject]=meeting" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**JavaScript:**

```javascript
async function searchBySubject(accountId, folderPath, subjectText) {
  const params = new URLSearchParams({
    path: folderPath,
    'search[subject]': subjectText
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}

const results = await searchBySubject('example', 'INBOX', 'meeting');
console.log(`Found ${results.messages.length} messages`);
```

### Search by Sender

Find messages from a specific sender:

```javascript
async function searchBySender(accountId, folderPath, email) {
  const params = new URLSearchParams({
    path: folderPath,
    'search[from]': email
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}

// Find all emails from john@example.com
const results = await searchBySender('example', 'INBOX', 'john@example.com');
```

### Search by Date

Find messages from a specific date range:

```javascript
async function searchByDateRange(accountId, folderPath, since, before) {
  const params = new URLSearchParams({
    path: folderPath,
    'search[since]': since, // YYYY-MM-DD format
    'search[before]': before
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}

// Find messages from last week
const today = new Date();
const weekAgo = new Date(today);
weekAgo.setDate(weekAgo.getDate() - 7);

const results = await searchByDateRange(
  'example',
  'INBOX',
  weekAgo.toISOString().split('T')[0], // 2025-10-06
  today.toISOString().split('T')[0]    // 2025-10-13
);
```

## Search Operators

### Text Search Operators

**subject** - Subject contains text
```javascript
'search[subject]': 'invoice'
```

**body** - Message body contains text
```javascript
'search[body]': 'payment'
```

**from** - Sender address contains text
```javascript
'search[from]': 'john@example.com'
```

**to** - Recipient address contains text
```javascript
'search[to]': 'jane@company.com'
```

**text** - Subject or body contains text
```javascript
'search[text]': 'urgent'
```

**header** - Custom header search
```javascript
'search[header]': 'X-Custom-Header: value'
```

### Date Operators

**since** - Messages on or after date (YYYY-MM-DD)
```javascript
'search[since]': '2025-01-01'
```

**before** - Messages before date (YYYY-MM-DD)
```javascript
'search[before]': '2025-12-31'
```

**on** - Messages on specific date (YYYY-MM-DD)
```javascript
'search[on]': '2025-10-13'
```

### Size Operators

**larger** - Messages larger than size (bytes)
```javascript
'search[larger]': '1000000' // > 1MB
```

**smaller** - Messages smaller than size (bytes)
```javascript
'search[smaller]': '10000' // < 10KB
```

### Flag Operators

**seen** - Messages that are read
```javascript
'search[seen]': 'true'
```

**unseen** - Messages that are unread
```javascript
'search[unseen]': 'true'
```

**flagged** - Messages that are flagged/starred
```javascript
'search[flagged]': 'true'
```

**answered** - Messages that have been replied to
```javascript
'search[answered]': 'true'
```

**draft** - Draft messages
```javascript
'search[draft]': 'true'
```

### UID Operators

**uid** - Specific UID or range
```javascript
'search[uid]': '12345'        // Single UID
'search[uid]': '12345:12400'  // UID range
'search[uid]': '12345:*'      // From UID to latest
```

## Combined Searches

### Multiple Criteria (AND logic)

Combine multiple search criteria - all must match:

```javascript
async function searchUnreadFromSender(accountId, folderPath, sender) {
  const params = new URLSearchParams({
    path: folderPath,
    'search[from]': sender,
    'search[unseen]': 'true'
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}

// Find unread messages from john@example.com
const results = await searchUnreadFromSender('example', 'INBOX', 'john@example.com');
```

### Complex Search Example

Find recent large unread invoices:

```javascript
async function searchRecentLargeInvoices(accountId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const params = new URLSearchParams({
    path: 'INBOX',
    'search[subject]': 'invoice',
    'search[unseen]': 'true',
    'search[larger]': '500000', // > 500KB
    'search[since]': sevenDaysAgo.toISOString().split('T')[0]
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}

const invoices = await searchRecentLargeInvoices('example');
console.log(`Found ${invoices.messages.length} large unread invoices from last 7 days`);
```

## Common Search Patterns

### Find Messages with Attachments

```javascript
async function searchWithAttachments(accountId, folderPath) {
  // Note: Not all IMAP servers support attachment search
  // Alternative: List messages and filter by hasAttachments field

  const params = new URLSearchParams({
    path: folderPath,
    pageSize: 100
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/messages?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const data = await response.json();

  // Filter messages with attachments
  return data.messages.filter(msg => msg.hasAttachments);
}
```

### Search by Message ID

Find a specific message by its Message-ID header:

```javascript
async function findByMessageId(accountId, messageId) {
  // Search across all folders
  const folders = ['INBOX', 'Sent', 'Archive'];

  for (const folder of folders) {
    const params = new URLSearchParams({
      path: folder,
      'search[header]': `Message-ID: ${messageId}`
    });

    const response = await fetch(
      `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
      {
        headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
      }
    );

    const data = await response.json();

    if (data.messages && data.messages.length > 0) {
      return {
        folder: folder,
        message: data.messages[0]
      };
    }
  }

  return null; // Not found
}

const result = await findByMessageId('example', '<abc123@example.com>');
if (result) {
  console.log(`Found in ${result.folder}: ${result.message.subject}`);
}
```

### Search Today's Messages

```javascript
async function searchTodaysMessages(accountId, folderPath) {
  const today = new Date().toISOString().split('T')[0];

  const params = new URLSearchParams({
    path: folderPath,
    'search[on]': today
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}
```

### Search This Month

```javascript
async function searchThisMonth(accountId, folderPath) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const params = new URLSearchParams({
    path: folderPath,
    'search[since]': firstDay.toISOString().split('T')[0],
    'search[before]': lastDay.toISOString().split('T')[0]
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}
```

### Search Unread Important Messages

```javascript
async function searchUnreadImportant(accountId) {
  const params = new URLSearchParams({
    path: 'INBOX',
    'search[unseen]': 'true',
    'search[flagged]': 'true'
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  return await response.json();
}
```

### Search by Keywords

Search for messages containing specific keywords:

```javascript
async function searchByKeywords(accountId, folderPath, keywords) {
  // Search in both subject and body
  const results = [];

  for (const keyword of keywords) {
    const params = new URLSearchParams({
      path: folderPath,
      'search[text]': keyword
    });

    const response = await fetch(
      `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
      {
        headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
      }
    );

    const data = await response.json();
    results.push(...data.messages);
  }

  // Remove duplicates
  const uniqueMessages = Array.from(
    new Map(results.map(msg => [msg.id, msg])).values()
  );

  return uniqueMessages;
}

// Search for messages about invoices or payments
const results = await searchByKeywords('example', 'INBOX', ['invoice', 'payment', 'bill']);
```

## Advanced Search Techniques

### Search with Pagination

Handle large search results:

```javascript
async function searchWithPagination(accountId, folderPath, searchParams, pageSize = 20) {
  const allResults = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      path: folderPath,
      page: page,
      pageSize: pageSize,
      ...searchParams
    });

    const response = await fetch(
      `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
      {
        headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
      }
    );

    const data = await response.json();
    allResults.push(...data.messages);

    page++;
    hasMore = page < data.pages;
  }

  return allResults;
}

// Find all unread messages (might be hundreds)
const allUnread = await searchWithPagination('example', 'INBOX', {
  'search[unseen]': 'true'
}, 100);
```

### Search Multiple Folders

Search across multiple folders:

```javascript
async function searchMultipleFolders(accountId, folders, searchParams) {
  const results = await Promise.all(
    folders.map(async (folder) => {
      const params = new URLSearchParams({
        path: folder,
        ...searchParams
      });

      const response = await fetch(
        `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
        {
          headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
        }
      );

      const data = await response.json();
      return data.messages.map(msg => ({ ...msg, folder }));
    })
  );

  return results.flat();
}

// Search for "invoice" in Inbox and Archive
const results = await searchMultipleFolders('example', ['INBOX', 'Archive'], {
  'search[subject]': 'invoice'
});
```

### Search and Process

Search and immediately process results:

```javascript
async function searchAndProcess(accountId, folderPath, searchParams, processor) {
  const params = new URLSearchParams({
    path: folderPath,
    ...searchParams
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const data = await response.json();

  for (const message of data.messages) {
    try {
      await processor(accountId, message);
    } catch (err) {
      console.error(`Failed to process ${message.id}:`, err);
    }
  }

  return data.messages.length;
}

// Archive all read messages older than 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const archived = await searchAndProcess(
  'example',
  'INBOX',
  {
    'search[seen]': 'true',
    'search[before]': thirtyDaysAgo.toISOString().split('T')[0]
  },
  async (accountId, message) => {
    await archiveMessage(accountId, message.id);
    console.log(`Archived: ${message.subject}`);
  }
);

console.log(`Archived ${archived} old messages`);
```

## Search Performance Tips

### 1. Use Specific Search Criteria

```javascript
// Slow - searches entire mailbox
const results = await search(accountId, 'INBOX', {
  'search[text]': 'meeting'
});

// Faster - limits search to subject only
const results = await search(accountId, 'INBOX', {
  'search[subject]': 'meeting'
});

// Even faster - adds date constraint
const results = await search(accountId, 'INBOX', {
  'search[subject]': 'meeting',
  'search[since]': '2025-10-01'
});
```

### 2. Search Smaller Folders First

```javascript
async function smartSearch(accountId, searchParams) {
  // Try INBOX first (usually smaller than Archive)
  let results = await search(accountId, 'INBOX', searchParams);

  if (results.messages.length === 0) {
    // Only search archive if nothing found
    results = await search(accountId, 'Archive', searchParams);
  }

  return results;
}
```

### 3. Use Date Ranges

Always limit searches with date ranges when possible:

```javascript
// Bad - searches all messages (could be years worth)
const results = await search(accountId, 'INBOX', {
  'search[from]': 'john@example.com'
});

// Good - limits to last 90 days
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const results = await search(accountId, 'INBOX', {
  'search[from]': 'john@example.com',
  'search[since]': ninetyDaysAgo.toISOString().split('T')[0]
});
```

### 4. Cache Search Results

```javascript
class SearchCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  key(accountId, folderPath, searchParams) {
    return JSON.stringify({ accountId, folderPath, searchParams });
  }

  get(accountId, folderPath, searchParams) {
    const k = this.key(accountId, folderPath, searchParams);
    const cached = this.cache.get(k);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.results;
    }

    return null;
  }

  set(accountId, folderPath, searchParams, results) {
    const k = this.key(accountId, folderPath, searchParams);
    this.cache.set(k, {
      results,
      timestamp: Date.now()
    });

    // Clean up old entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}

const searchCache = new SearchCache(60000); // 1 min TTL

async function cachedSearch(accountId, folderPath, searchParams) {
  const cached = searchCache.get(accountId, folderPath, searchParams);
  if (cached) return cached;

  const results = await search(accountId, folderPath, searchParams);
  searchCache.set(accountId, folderPath, searchParams, results);

  return results;
}
```

## Provider-Specific Considerations

### Gmail API

Gmail API search has some differences:
- Labels are used instead of folders
- All messages are in `[Gmail]/All Mail`
- Use `labels` field to filter by label

```javascript
async function searchGmailByLabel(accountId, label) {
  const params = new URLSearchParams({
    path: '[Gmail]/All Mail'
  });

  const response = await fetch(
    `https://your-emailengine.com/v1/account/${accountId}/messages?${params}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
    }
  );

  const data = await response.json();

  // Filter by label
  return data.messages.filter(msg =>
    msg.labels && msg.labels.includes(label)
  );
}
```

### IMAP Limitations

Some IMAP servers have limitations:
- Body search might not be supported
- Date search formats may vary
- Some servers don't support all flags

Always test searches with your specific provider.

## Troubleshooting

### Problem: Search Returns No Results

**Solutions:**
1. Verify search syntax is correct
2. Check folder path is correct
3. Try broader search criteria
4. Verify messages actually exist (list folder)
5. Check date format is YYYY-MM-DD

### Problem: Search Too Slow

**Solutions:**
1. Add date range constraints
2. Search specific fields instead of text/body
3. Search smaller folders
4. Use pagination
5. Consider caching results

### Problem: Search Results Incomplete

**Solutions:**
1. Check pagination - might need multiple pages
2. Some servers limit search results
3. Messages might be in multiple folders
4. Check if messages were moved/deleted

### Problem: Special Characters in Search

**Solutions:**
1. URL-encode search parameters
2. Escape special characters
3. Use quotes for exact phrases

```javascript
// Properly encode search parameters
const params = new URLSearchParams({
  path: 'INBOX',
  'search[subject]': 'Re: [URGENT] Meeting'
});
// Automatically encodes special characters
```

## Best Practices

### 1. Always Validate Search Inputs

```javascript
function validateSearchParams(params) {
  // Check date format
  if (params.since && !/^\d{4}-\d{2}-\d{2}$/.test(params.since)) {
    throw new Error('Invalid date format for since');
  }

  // Check size is numeric
  if (params.larger && isNaN(params.larger)) {
    throw new Error('Invalid size for larger');
  }

  return true;
}
```

### 2. Use Appropriate Timeouts

```javascript
async function searchWithTimeout(accountId, folderPath, searchParams, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const params = new URLSearchParams({
      path: folderPath,
      ...searchParams
    });

    const response = await fetch(
      `https://your-emailengine.com/v1/account/${accountId}/search?${params}`,
      {
        headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' },
        signal: controller.signal
      }
    );

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 3. Log Search Queries

```javascript
async function loggedSearch(accountId, folderPath, searchParams) {
  const startTime = Date.now();

  try {
    const results = await search(accountId, folderPath, searchParams);
    const duration = Date.now() - startTime;

    console.log('Search completed:', {
      accountId,
      folderPath,
      params: searchParams,
      resultCount: results.messages.length,
      duration
    });

    return results;
  } catch (err) {
    console.error('Search failed:', {
      accountId,
      folderPath,
      params: searchParams,
      error: err.message
    });
    throw err;
  }
}
```
