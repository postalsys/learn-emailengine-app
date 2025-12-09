---
title: Email Authentication Testing
sidebar_position: 7
description: Verify DKIM, SPF, DMARC, BIMI, and ARC configuration by testing your email setup with EmailEngine's delivery test API
keywords:
  - dkim
  - spf
  - dmarc
  - bimi
  - arc
  - email authentication
  - deliverability
  - dns records
---

# Email Authentication Testing

Verify your email authentication setup (DKIM, SPF, DMARC, BIMI, ARC) by sending a test email to EmailEngine's verification service. This helps identify configuration issues before they affect real email delivery.

## Why Test Email Authentication?

Email authentication problems cause deliverability issues:

- **DKIM failures** - Emails may be marked as spam or rejected
- **SPF failures** - Receiving servers may reject emails from unauthorized IPs
- **DMARC failures** - Emails fail policy checks, leading to rejection or quarantine
- **Missing BIMI** - No brand logo displayed in supported email clients
- **Broken ARC chains** - Forwarded emails lose authentication

Testing helps you identify and fix these issues before they affect real email delivery.

## How It Works

1. You initiate a test via the API for a specific account
2. EmailEngine automatically creates a temporary test mailbox on [Ethereal Email](https://ethereal.email) (no configuration needed)
3. EmailEngine sends a test email from your account to this temporary mailbox
4. The Ethereal verification server analyzes the email's authentication headers
5. You poll the check endpoint to retrieve DKIM, SPF, DMARC, BIMI, and ARC results

The entire process is fully automated - you don't need to provide any test email addresses or set up external services. EmailEngine handles the test mailbox creation and cleanup automatically.

### Why an External Service?

Email authentication verification requires an **external receiving server** for accurate results:

- **SPF validation** checks if the sending server's IP address is authorized. The receiving server must see the actual IP of your mail server, not localhost.
- **DKIM signatures** are applied by the mail server during delivery. Sending to your own account might bypass these steps entirely.
- **DMARC alignment** depends on how the email travels through the internet. Internal delivery doesn't simulate real-world routing.

By using Ethereal Email as an external receiver, the test email goes through the complete email delivery pipeline to an independent mail server that performs all standard authentication checks, just like Gmail, Outlook, or any other recipient would.

This works with any account backend:
- **SMTP accounts** - Email is sent via your configured SMTP server
- **Gmail API accounts** - Email is sent via Gmail's API, and Gmail's servers handle authentication
- **Microsoft Graph accounts** - Email is sent via Microsoft's API

The test verifies whatever authentication your actual sending method provides.

:::note Service Availability
Since email authentication testing relies on an external service (Ethereal Email), test availability depends on that service being operational. If the external service is temporarily unavailable, delivery tests will fail. There is no fallback mechanism - you'll need to retry later when the service is back online.
:::

:::info Result Retention
Test results are stored for **1 hour** after the test is initiated. After this period, the test data is automatically deleted and you'll need to run a new test. Make sure to retrieve your results within this timeframe.
:::

## Starting a Delivery Test

Initiate a test for any connected email account:

**cURL:**

```bash
curl -X POST "http://localhost:3000/v1/delivery-test/account/my-account" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Node.js:**

```javascript
const response = await fetch(
  'http://localhost:3000/v1/delivery-test/account/my-account',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  }
);

const result = await response.json();
console.log('Test ID:', result.deliveryTest);
```

**Response:**

```json
{
  "success": true,
  "deliveryTest": "6420a6ad-7f82-4e4f-8112-82a9dad1f34d"
}
```

## Using a Gateway

By default, the test email is sent using the account's native sending method (SMTP, Gmail API, or Microsoft Graph). To test delivery through a specific SMTP gateway instead:

```bash
curl -X POST "http://localhost:3000/v1/delivery-test/account/my-account" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "sendgrid-gateway"
  }'
```

This is useful for testing:
- Third-party SMTP services (SendGrid, Mailgun, Amazon SES)
- Custom SMTP relay servers
- Different sending configurations
- Comparing authentication results between your default method and a gateway

## Checking Test Results

Poll the check endpoint with the test ID to get results. The verification server needs time to receive and analyze the email, so you may need to wait a few seconds before results are available.

**cURL:**

```bash
curl "http://localhost:3000/v1/delivery-test/check/6420a6ad-7f82-4e4f-8112-82a9dad1f34d" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Node.js:**

```javascript
async function checkDeliveryTest(testId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `http://localhost:3000/v1/delivery-test/check/${testId}`,
      {
        headers: {
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      return result;
    }

    // Wait 2 seconds before retrying
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Test timed out');
}

const results = await checkDeliveryTest('6420a6ad-7f82-4e4f-8112-82a9dad1f34d');
console.log('DKIM:', results.dkim);
console.log('SPF:', results.spf);
console.log('DMARC:', results.dmarc);
```

**Response:**

```json
{
  "success": true,
  "dkim": {
    "status": "pass",
    "domain": "example.com",
    "selector": "default",
    "info": "DKIM signature verified"
  },
  "spf": {
    "status": "pass",
    "domain": "example.com",
    "ip": "203.0.113.10",
    "info": "SPF record allows this sender"
  },
  "dmarc": {
    "status": "pass",
    "domain": "example.com",
    "policy": "reject",
    "info": "DMARC policy satisfied"
  },
  "bimi": {
    "status": "none",
    "info": "No BIMI record found"
  },
  "arc": {
    "status": "none",
    "info": "No ARC headers present"
  },
  "mainSig": {
    "status": {
      "aligned": true,
      "result": "pass"
    },
    "domain": "example.com",
    "selector": "default"
  }
}
```

## Understanding Results

### DKIM (DomainKeys Identified Mail)

DKIM verifies that email content hasn't been modified and confirms the sender's domain.

| Status | Meaning |
|--------|---------|
| `pass` | DKIM signature verified successfully |
| `fail` | Signature verification failed (content modified or key mismatch) |
| `none` | No DKIM signature present |
| `temperror` | Temporary error during verification |
| `permerror` | Permanent error (invalid signature format) |

**Important:** Check `mainSig.status.aligned` - if `false`, DKIM may pass but still fail DMARC alignment.

### SPF (Sender Policy Framework)

SPF verifies that the sending server is authorized to send email for the domain.

| Status | Meaning |
|--------|---------|
| `pass` | Sending IP is authorized |
| `fail` | Sending IP is not authorized |
| `softfail` | IP not authorized but domain owner is testing |
| `neutral` | Domain owner has no assertion about the IP |
| `none` | No SPF record found |
| `temperror` | Temporary DNS error |
| `permerror` | Permanent error (invalid SPF record) |

### DMARC (Domain-based Message Authentication)

DMARC combines DKIM and SPF results with the domain's policy.

| Status | Meaning |
|--------|---------|
| `pass` | Email passes DMARC checks |
| `fail` | Email fails DMARC checks |
| `none` | No DMARC record found |

The `policy` field shows what the domain owner wants receiving servers to do with failing emails:
- `none` - Take no action (monitoring mode)
- `quarantine` - Mark as spam
- `reject` - Reject the email

### BIMI (Brand Indicators for Message Identification)

BIMI allows displaying brand logos in email clients.

| Status | Meaning |
|--------|---------|
| `pass` | Valid BIMI record with verified logo |
| `none` | No BIMI record found |
| `fail` | Invalid BIMI record or logo |

### ARC (Authenticated Received Chain)

ARC preserves authentication results when emails are forwarded.

| Status | Meaning |
|--------|---------|
| `pass` | Valid ARC chain |
| `none` | No ARC headers (email not forwarded) |
| `fail` | Broken or invalid ARC chain |

## Complete Testing Example

Here's a complete example that runs a delivery test and reports the results:

```javascript
async function runDeliveryTest(accountId) {
  const API_URL = 'http://localhost:3000';
  const TOKEN = 'YOUR_ACCESS_TOKEN';

  // Start the test
  console.log(`Starting delivery test for account: ${accountId}`);

  const startResponse = await fetch(
    `${API_URL}/v1/delivery-test/account/${accountId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }
  );

  const startResult = await startResponse.json();

  if (!startResult.success) {
    throw new Error('Failed to start delivery test');
  }

  const testId = startResult.deliveryTest;
  console.log(`Test started with ID: ${testId}`);

  // Poll for results
  console.log('Waiting for results...');

  for (let attempt = 1; attempt <= 15; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const checkResponse = await fetch(
      `${API_URL}/v1/delivery-test/check/${testId}`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    const checkResult = await checkResponse.json();

    if (checkResult.success) {
      console.log('\n=== Delivery Test Results ===\n');

      // DKIM
      const dkim = checkResult.dkim || {};
      console.log(`DKIM: ${dkim.status || 'unknown'}`);
      if (dkim.domain) console.log(`  Domain: ${dkim.domain}`);
      if (dkim.selector) console.log(`  Selector: ${dkim.selector}`);

      // SPF
      const spf = checkResult.spf || {};
      console.log(`SPF: ${spf.status || 'unknown'}`);
      if (spf.domain) console.log(`  Domain: ${spf.domain}`);
      if (spf.ip) console.log(`  IP: ${spf.ip}`);

      // DMARC
      const dmarc = checkResult.dmarc || {};
      console.log(`DMARC: ${dmarc.status || 'unknown'}`);
      if (dmarc.policy) console.log(`  Policy: ${dmarc.policy}`);

      // BIMI
      const bimi = checkResult.bimi || {};
      console.log(`BIMI: ${bimi.status || 'unknown'}`);

      // ARC
      const arc = checkResult.arc || {};
      console.log(`ARC: ${arc.status || 'unknown'}`);

      // Overall assessment
      console.log('\n=== Assessment ===\n');

      const issues = [];
      if (dkim.status !== 'pass') issues.push('DKIM not passing');
      if (spf.status !== 'pass') issues.push('SPF not passing');
      if (dmarc.status !== 'pass') issues.push('DMARC not passing');

      if (issues.length === 0) {
        console.log('All authentication checks passed!');
      } else {
        console.log('Issues found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      }

      return checkResult;
    }

    console.log(`Attempt ${attempt}/15 - waiting for email to be processed...`);
  }

  throw new Error('Test timed out after 30 seconds');
}

// Run the test
runDeliveryTest('my-account')
  .then(results => console.log('\nTest completed successfully'))
  .catch(err => console.error('Test failed:', err.message));
```

## Troubleshooting Authentication Issues

### DKIM Failures

- **Wrong DNS record** - Verify the DKIM public key is published at `selector._domainkey.yourdomain.com`
- **Key mismatch** - Ensure the private key used for signing matches the published public key
- **Modified content** - Check if email content is being modified by intermediate servers

### SPF Failures

- **Missing IP** - Add your sending server's IP to your SPF record
- **Too many lookups** - SPF has a 10 DNS lookup limit; flatten your record if needed
- **Wrong include** - Verify all `include:` statements point to valid SPF records

### DMARC Failures

- **Alignment issues** - The `From:` domain must align with DKIM or SPF domain
- **Missing record** - Publish a DMARC record at `_dmarc.yourdomain.com`
- **Start with p=none** - Use monitoring mode first to identify issues

## API Reference

For complete request/response schemas, see the API documentation:

- [Create delivery test](/docs/api/post-v-1-deliverytest-account-account) - `POST /v1/delivery-test/account/{account}`
- [Check test status](/docs/api/get-v-1-deliverytest-check-deliverytest) - `GET /v1/delivery-test/check/{deliveryTest}`

## See Also

- [Inbox Placement Testing](/docs/advanced/inbox-placement-testing) - Test whether emails land in inbox or spam
- [SMTP Gateway](/docs/sending/smtp-gateway) - Configure custom SMTP gateways
- [Webhooks](/docs/webhooks/overview) - Monitor email events
