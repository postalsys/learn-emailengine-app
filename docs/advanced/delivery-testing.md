---
title: Delivery Testing and Inbox Placement
sidebar_position: 8
description: Test email deliverability and measure inbox vs spam placement using EmailEngine's sub-connections feature
keywords:
  - delivery testing
  - inbox placement
  - spam testing
  - deliverability
  - seed lists
  - sub-connections
  - gmail categories
---

<!--
SOURCE: sources/blog/2023-02-27-measuging-inbox-spam-placement.md
This guide covers using EmailEngine to test email delivery and measure inbox/spam placement.
-->

# Delivery Testing and Inbox Placement

Measure email deliverability by monitoring test mailboxes with EmailEngine. Track whether your emails land in the inbox or spam folder, and for Gmail, which category tab they appear in.

## Overview

Common use case: Send test emails to seed list accounts and immediately check:

- Did the email arrive in **INBOX** or **Spam**?
- For Gmail: Which tab? (Primary, Promotions, Social, Updates, Forums)
- How long did delivery take?
- Were there any delivery issues?

EmailEngine's **sub-connections** feature enables real-time monitoring of multiple folders simultaneously, eliminating polling delays for instant delivery results.

## The Challenge

### Normal IMAP Behavior

IMAP clients can only subscribe to **one folder at a time** for real-time updates:

- EmailEngine subscribes to INBOX (or Gmail's "All Mail") for live updates
- Other folders (Spam, Junk, etc.) are **polled periodically**
- Polling introduces delays (typically 1-5 minutes)
- Gmail's "All Mail" **doesn't include Spam folder**, requiring polling

This is fine for normal operations but problematic for delivery testing where you need **immediate results**.

### The Solution: Sub-Connections

Sub-connections allow EmailEngine to establish **additional IMAP sessions** for specific folders:

- Each sub-connection monitors a specific folder in real-time
- IMAP servers notify EmailEngine about changes immediately
- No polling delay - instant delivery detection
- Perfect for spam folder monitoring

**Important Limitation:** Email providers heavily limit parallel IMAP connections:
- **Gmail:** 15 concurrent connections max
- **Outlook:** 10-15 concurrent connections
- **Yahoo:** Similar limits

Use sub-connections sparingly. EmailEngine prioritizes the primary connection and only establishes sub-connections after the main session is stable.

## Setting Up Delivery Testing

### 1. Create Test Account

Register a test email account (Gmail, Outlook, etc.) with EmailEngine:

```bash
curl -XPOST "http://localhost:3000/v1/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account": "test-account",
    "name": "Delivery Test Account",
    "email": "deliverytest@gmail.com",
    "imap": {
      "host": "imap.gmail.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "deliverytest@gmail.com",
        "pass": "app-password-here"
      }
    },
    "subconnections": ["\\\\Junk"]
  }'
```

**Key field:** `subconnections` array specifies additional folders to monitor.

### 2. Using Special-Use Flags

Instead of folder paths, use **special-use flags** (automatically resolved):

```json
{
  "subconnections": ["\\Junk"]  // Spam/Junk folder
}
```

Common special-use flags:
- `\\Junk` - Spam folder
- `\\Trash` - Deleted items
- `\\Sent` - Sent messages
- `\\Drafts` - Draft messages

EmailEngine resolves these to actual folder paths automatically.

### 3. Using Folder Paths

Or specify exact folder paths:

```json
{
  "subconnections": ["[Gmail]/Spam", "Promotions"]
}
```

**Gmail folder names:**
- `[Gmail]/Spam` - Spam folder
- `[Gmail]/All Mail` - All mail (default primary connection)
- `[Gmail]/Sent Mail` - Sent items
- `[Gmail]/Trash` - Trash

**Outlook folder names:**
- `Junk Email` - Spam folder
- `Deleted Items` - Trash
- `Sent Items` - Sent mail

### 4. Multiple Sub-Connections

Monitor multiple folders simultaneously:

```bash
curl -XPOST "http://localhost:3000/v1/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account": "test-account",
    "email": "test@ethereal.email",
    "imap": {
      "host": "imap.ethereal.email",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "test@ethereal.email",
        "pass": "password123"
      }
    },
    "subconnections": [
      "\\\\Junk",
      "\\\\Trash"
    ]
  }'
```

## Verifying Sub-Connections

Check which sub-connections are active in the EmailEngine UI:

1. Navigate to **Accounts**
2. Click on test account
3. Scroll to **IMAP** section
4. View **Sub-connections** list

![Sub-connections UI](__GHOST_URL__/content/images/2023/02/Screenshot-2023-02-27-at-11.48.41.png)

**Note:** EmailEngine skips duplicate connections. If you request INBOX as a sub-connection and EmailEngine already monitors it as the primary connection, it won't appear in the sub-connections list.

You can also check via API:

```bash
curl "http://localhost:3000/v1/account/test-account" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.subconnections'
```

Response:

```json
{
  "subconnections": [
    {
      "path": "[Gmail]/Spam",
      "specialUse": "\\Junk",
      "status": "connected"
    }
  ]
}
```

## Gmail Category Detection

Gmail sorts inbox emails into category tabs:

- **Primary** - Personal emails, direct correspondence
- **Social** - Social media notifications
- **Promotions** - Marketing emails, offers
- **Updates** - Confirmations, receipts, statements
- **Forums** - Mailing lists, discussion groups

![Gmail Category Tabs](__GHOST_URL__/content/images/2023/02/Screenshot-2023-02-27-at-11.52.29.png)

### Enable Category Detection

Category detection requires **additional IMAP commands per email**, which can slow processing for high-volume accounts. Enable only when needed.

#### Enable in UI

1. Go to **Settings** → **Configuration** → **Service** → **Labs**
2. Enable **Gmail Category Detection**
3. Save changes

![Enable Category Detection](__GHOST_URL__/content/images/2023/02/Screenshot-2023-02-27-at-11.50.10.png)

#### Enable via Environment Variable

```bash
EENGINE_GMAIL_CATEGORIES=true node server.js
```

### Category in Webhooks

Once enabled, `messageNew` webhooks for Gmail INBOX emails include a `category` field:

```json
{
  "event": "messageNew",
  "account": "test@gmail.com",
  "data": {
    "id": "AAAABgAAAdk",
    "path": "INBOX",
    "subject": "Special Offer - 50% Off!",
    "category": "promotions",
    "from": {
      "address": "marketing@example.com"
    }
  }
}
```

Possible `category` values:
- `primary`
- `social`
- `promotions`
- `updates`
- `forums`

## Implementing Delivery Tests

### Complete Testing Flow

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Track test emails
const testEmails = new Map();

// 1. Send test email
async function sendTestEmail(testAccount, subject, content) {
  const testId = `test-${Date.now()}`;

  // Send email with tracking ID in subject
  const response = await fetch('http://localhost:3000/v1/account/sender@example.com/submit', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: { address: testAccount },
      subject: `${subject} [Test:${testId}]`,
      text: content,
      html: `<p>${content}</p>`
    })
  });

  const data = await response.json();

  // Store test metadata
  testEmails.set(testId, {
    messageId: data.messageId,
    testAccount,
    subject,
    sentAt: new Date(),
    result: null
  });

  return testId;
}

// 2. Receive webhook when email arrives
app.post('/webhooks/emailengine', (req, res) => {
  const webhook = req.body;

  if (webhook.event === 'messageNew') {
    const { subject, path, category } = webhook.data;

    // Extract test ID from subject
    const testMatch = subject && subject.match(/\[Test:([^\]]+)\]/);

    if (testMatch) {
      const testId = testMatch[1];
      const test = testEmails.get(testId);

      if (test) {
        // Record delivery result
        const deliveryTime = new Date() - test.sentAt;

        test.result = {
          folder: path,
          category: category || null,
          deliveredAt: new Date(),
          deliveryTime: `${deliveryTime}ms`,
          status: path === 'INBOX' ? 'inbox' :
                  path.includes('Junk') || path.includes('Spam') ? 'spam' :
                  'other'
        };

        console.log(`Test ${testId} result:`, test.result);
      }
    }
  }

  res.json({ success: true });
});

// 3. Query test results
app.get('/test-results/:testId', (req, res) => {
  const test = testEmails.get(req.params.testId);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  res.json({
    testId: req.params.testId,
    sentAt: test.sentAt,
    result: test.result || { status: 'pending' }
  });
});

app.listen(3000, () => {
  console.log('Test server running on port 3000');
});

// Run test
async function runDeliveryTest() {
  const testId = await sendTestEmail(
    'deliverytest@gmail.com',
    'Delivery Test Email',
    'This is a test email to measure inbox placement.'
  );

  console.log(`Test started: ${testId}`);

  // Wait for result (or poll)
  setTimeout(() => {
    const test = testEmails.get(testId);
    console.log('Test result:', test.result);
  }, 10000); // Check after 10 seconds
}

// runDeliveryTest();
```

### Seed List Testing

Test multiple accounts simultaneously:

```javascript
async function runSeedListTest(subject, content) {
  const seedList = [
    'test1@gmail.com',
    'test2@outlook.com',
    'test3@yahoo.com',
    'test4@gmail.com'
  ];

  const results = {
    testId: `seed-${Date.now()}`,
    sentAt: new Date(),
    accounts: []
  };

  // Send to all seed accounts
  for (const email of seedList) {
    const testId = await sendTestEmail(email, subject, content);

    results.accounts.push({
      email,
      testId,
      status: 'pending'
    });
  }

  console.log(`Seed list test started: ${results.testId}`);

  return results;
}

// Check results after delay
async function checkSeedListResults(testResults) {
  const completed = [];
  const pending = [];

  for (const account of testResults.accounts) {
    const test = testEmails.get(account.testId);

    if (test.result) {
      completed.push({
        email: account.email,
        ...test.result
      });
    } else {
      pending.push(account.email);
    }
  }

  return {
    total: testResults.accounts.length,
    completed: completed.length,
    pending: pending.length,
    results: {
      inbox: completed.filter(r => r.status === 'inbox').length,
      spam: completed.filter(r => r.status === 'spam').length,
      other: completed.filter(r => r.status === 'other').length
    },
    details: completed
  };
}
```

### Python Example

```python
import requests
import time
from datetime import datetime

class DeliveryTester:
    def __init__(self, api_url, token):
        self.api_url = api_url
        self.token = token
        self.test_emails = {}

    def send_test_email(self, test_account, subject, content):
        test_id = f"test-{int(time.time() * 1000)}"

        # Send email
        response = requests.post(
            f"{self.api_url}/v1/account/sender@example.com/submit",
            headers={
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            },
            json={
                'to': {'address': test_account},
                'subject': f"{subject} [Test:{test_id}]",
                'text': content
            }
        )

        data = response.json()

        # Store test metadata
        self.test_emails[test_id] = {
            'message_id': data['messageId'],
            'test_account': test_account,
            'subject': subject,
            'sent_at': datetime.now(),
            'result': None
        }

        return test_id

    def process_webhook(self, webhook):
        """Process incoming webhook"""
        if webhook['event'] == 'messageNew':
            data = webhook['data']
            subject = data.get('subject', '')

            # Extract test ID
            import re
            match = re.search(r'\[Test:([^\]]+)\]', subject)

            if match:
                test_id = match.group(1)
                test = self.test_emails.get(test_id)

                if test:
                    delivery_time = (datetime.now() - test['sent_at']).total_seconds()

                    # Determine status
                    path = data['path']
                    if path == 'INBOX':
                        status = 'inbox'
                    elif 'Junk' in path or 'Spam' in path:
                        status = 'spam'
                    else:
                        status = 'other'

                    test['result'] = {
                        'folder': path,
                        'category': data.get('category'),
                        'delivered_at': datetime.now(),
                        'delivery_time_sec': delivery_time,
                        'status': status
                    }

                    print(f"Test {test_id} result: {status} in {delivery_time:.2f}s")

    def run_seed_list_test(self, seed_list, subject, content):
        """Test multiple accounts"""
        results = {
            'test_id': f"seed-{int(time.time())}",
            'sent_at': datetime.now(),
            'accounts': []
        }

        for email in seed_list:
            test_id = self.send_test_email(email, subject, content)
            results['accounts'].append({
                'email': email,
                'test_id': test_id
            })

        return results

    def check_results(self, test_results, timeout=30):
        """Check test results after timeout"""
        time.sleep(timeout)

        completed = []
        pending = []

        for account in test_results['accounts']:
            test = self.test_emails[account['test_id']]

            if test['result']:
                completed.append({
                    'email': account['email'],
                    **test['result']
                })
            else:
                pending.append(account['email'])

        # Calculate statistics
        inbox_count = sum(1 for r in completed if r['status'] == 'inbox')
        spam_count = sum(1 for r in completed if r['status'] == 'spam')

        return {
            'total': len(test_results['accounts']),
            'completed': len(completed),
            'pending': len(pending),
            'inbox_rate': f"{inbox_count / len(completed) * 100:.1f}%" if completed else "N/A",
            'spam_rate': f"{spam_count / len(completed) * 100:.1f}%" if completed else "N/A",
            'results': completed
        }

# Usage
tester = DeliveryTester('http://localhost:3000', 'YOUR_TOKEN')

seed_list = [
    'test1@gmail.com',
    'test2@outlook.com',
    'test3@yahoo.com'
]

test_results = tester.run_seed_list_test(
    seed_list,
    'Marketing Email - Special Offer',
    'Check out our exclusive deals!'
)

# Wait and check results
results = tester.check_results(test_results, timeout=30)
print(f"Inbox rate: {results['inbox_rate']}")
print(f"Spam rate: {results['spam_rate']}")
```

## Analyzing Results

### Track Deliverability Metrics

```javascript
async function analyzePlacementResults(testResults) {
  const stats = {
    total: testResults.length,
    inbox: 0,
    spam: 0,
    other: 0,
    byProvider: {},
    byCategory: {
      primary: 0,
      promotions: 0,
      social: 0,
      updates: 0,
      forums: 0
    },
    avgDeliveryTime: 0
  };

  let totalDeliveryTime = 0;

  for (const result of testResults) {
    // Count by status
    stats[result.status]++;

    // Count by provider
    const domain = result.email.split('@')[1];
    stats.byProvider[domain] = stats.byProvider[domain] || { inbox: 0, spam: 0 };
    stats.byProvider[domain][result.status]++;

    // Count by category (Gmail)
    if (result.category) {
      stats.byCategory[result.category]++;
    }

    // Sum delivery times
    totalDeliveryTime += parseFloat(result.deliveryTime);
  }

  stats.avgDeliveryTime = (totalDeliveryTime / stats.total).toFixed(2) + 'ms';
  stats.inboxRate = ((stats.inbox / stats.total) * 100).toFixed(1) + '%';
  stats.spamRate = ((stats.spam / stats.total) * 100).toFixed(1) + '%';

  return stats;
}
```

### Generate Report

```javascript
function generateDeliveryReport(stats) {
  console.log('\n=== Delivery Test Report ===\n');
  console.log(`Total Emails: ${stats.total}`);
  console.log(`Inbox: ${stats.inbox} (${stats.inboxRate})`);
  console.log(`Spam: ${stats.spam} (${stats.spamRate})`);
  console.log(`Other: ${stats.other}`);
  console.log(`Avg Delivery Time: ${stats.avgDeliveryTime}`);

  console.log('\n--- By Provider ---');
  for (const [provider, counts] of Object.entries(stats.byProvider)) {
    const total = counts.inbox + counts.spam;
    const rate = ((counts.inbox / total) * 100).toFixed(1);
    console.log(`${provider}: ${counts.inbox}/${total} inbox (${rate}%)`);
  }

  console.log('\n--- Gmail Categories ---');
  for (const [category, count] of Object.entries(stats.byCategory)) {
    if (count > 0) {
      console.log(`${category}: ${count}`);
    }
  }
}
```

## Best Practices

### 1. Use Dedicated Test Accounts

Don't use production accounts for delivery testing:

```javascript
const testAccounts = [
  'delivery-test-1@gmail.com',
  'delivery-test-2@outlook.com',
  'delivery-test-3@yahoo.com'
];
```

### 2. Monitor Connection Limits

Stay within IMAP connection limits:

```javascript
// Maximum 2-3 sub-connections per account
const maxSubConnections = 2;
```

### 3. Test Regularly

Run tests periodically to track deliverability:

```javascript
// Run daily tests
cron.schedule('0 9 * * *', () => {
  runSeedListTest('Daily Delivery Test', 'Test content');
});
```

### 4. Vary Test Content

Test different email types:

- Plain text vs HTML
- With/without images
- With/without links
- Different subject lines
- Different sender names

### 5. Track Historical Data

Store test results for trend analysis:

```javascript
await db.deliveryTests.insert({
  testId,
  date: new Date(),
  inboxRate: stats.inboxRate,
  spamRate: stats.spamRate,
  results: testResults
});
```

## Troubleshooting

### Sub-Connection Not Established

**Check connection limit:**

```bash
# View account details
curl "http://localhost:3000/v1/account/test-account" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.imap.connections'
```

**Reduce sub-connections:**

```json
{
  "subconnections": ["\\Junk"]  // Use only essential sub-connections
}
```

### Delayed Webhook Delivery

**Check webhook queue:**

```bash
# Visit Bull Board
http://localhost:3000/admin/arena
```

**Optimize webhook endpoint:**

Ensure your webhook endpoint responds quickly (<  1 second).

### Category Not Detected

**Verify feature is enabled:**

```bash
curl "http://localhost:3000/admin/config" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.gmail.categories'
```

**Note:** Categories only work for Gmail INBOX messages.

## Next Steps

- Configure [Bounces](/docs/advanced/bounces) detection for failed deliveries
- Set up [Monitoring](/docs/advanced/monitoring) to track delivery metrics
- Implement [Pre-Processing](/docs/advanced/pre-processing) to filter test results
- Review [Sending Best Practices](/docs/sending) for better deliverability

## Related Resources

- [IMAP RFC 3501](https://tools.ietf.org/html/rfc3501)
- [Gmail API Categories](https://developers.google.com/gmail/api/guides/labels)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability-best-practices/)
