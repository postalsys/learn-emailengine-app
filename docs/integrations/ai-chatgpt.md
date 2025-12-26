---
title: AI and ChatGPT Integration
sidebar_position: 8
description: Complete guide to integrating AI and ChatGPT with EmailEngine for email processing, summarization, and conversational search
---

# AI and ChatGPT Integration

Learn how to enhance your email workflows with artificial intelligence using EmailEngine's OpenAI/ChatGPT integration capabilities.

## Overview

EmailEngine integrates with OpenAI's API to provide AI-powered email processing capabilities:

- **Email Summarization**: Generate concise summaries of incoming emails
- **Sentiment Analysis**: Detect positive, neutral, or negative sentiment
- **Event Extraction**: Identify events and dates mentioned in emails
- **Action Items**: Extract tasks and due dates
- **Fraud Detection**: Assess risk of scam or phishing emails
- **Reply Detection**: Identify if sender expects a response
- **Conversational Search**: Ask questions about your email history

### OpenAI API Access

- **Paid Account**: Recommended for production (free accounts have strict rate limits)

## Feature 1: Email Processing and Summarization

### Enable AI Processing

1. Navigate to **Configuration** → **AI Processing** in EmailEngine
2. Enter your OpenAI API key
3. Check "Enable AI Email Processing"
4. Select a model from the dropdown
5. Save configuration

### Model Selection

EmailEngine dynamically fetches available models from OpenAI's model listing API, so you always have access to the latest models. The model dropdown shows all chat-compatible models available for your API key.

#### Recommended Models

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| **GPT-5 Mini** | Fast | Low | General email processing (default) |
| **GPT-5** | Medium | Medium | Complex analysis, longer emails |
| **GPT-5 Pro** | Slower | High | Most demanding tasks |
| **GPT-4o Mini** | Fast | Low | Budget-conscious processing |
| **GPT-4o** | Medium | Medium | Balanced performance |
| **O3 Mini** | Medium | Medium | Advanced reasoning tasks |

#### Model Families

- **GPT-5.x** - Latest generation with best overall performance
- **GPT-4o** - Optimized models with good speed/cost balance
- **GPT-4.1** - Enhanced GPT-4 variants
- **O-series (O1, O3, O4)** - Reasoning-focused models for complex analysis
- **GPT-3.5/GPT-4** - Legacy models (still available)

**Recommendation**: Start with **GPT-5 Mini** (the default) for most email processing tasks. It offers an excellent balance of speed, cost, and quality. Upgrade to GPT-5 or GPT-5 Pro only if you need enhanced capabilities for complex analysis.

### How It Works

When AI processing is enabled, EmailEngine automatically processes every new email arriving in the INBOX folder:

1. Email arrives in monitored account
2. EmailEngine extracts text content
3. Content sent to OpenAI API for analysis
4. Analysis results added to webhook payload

### Webhook Enhancement

With AI processing enabled, `messageNew` webhooks include additional sections:

```json
{
  "account": "example",
  "event": "messageNew",
  "data": {
    "id": "AAAAGQAACeE",
    "from": {
      "name": "Jane Doe",
      "address": "jane@example.com"
    },
    "subject": "Project meeting tomorrow at 2pm",
    "summary": {
      "id": "chatcmpl-7IzVIEp5UL3hdQ3aZJ8AHyrJrt3R0",
      "tokens": 245,
      "model": "gpt-5-mini",
      "sentiment": "positive",
      "summary": "Request to attend project meeting tomorrow at 2pm in conference room A to discuss Q4 roadmap.",
      "shouldReply": true,
      "events": [
        {
          "description": "Project meeting",
          "startTime": "2023-06-07T14:00:00"
        }
      ],
      "actions": [
        {
          "description": "Attend project meeting",
          "dueDate": "2023-06-07"
        }
      ]
    },
    "riskAssessment": {
      "risk": 1,
      "assessment": "Sender information matches and authentication checks have passed."
    }
  }
}
```

### Extracted Information

#### 1. Content Summary

Condensed version of email content (sentence or short paragraph):

```json
{
  "summary": "Request to contribute 2 to 5 euros for flower bouquets for choir teachers and concertmaster."
}
```

#### 2. Sentiment Assessment

One-word sentiment evaluation:

- **positive**: Friendly, enthusiastic, grateful
- **neutral**: Informational, factual
- **negative**: Complaint, frustration, anger

```json
{
  "sentiment": "positive"
}
```

#### 3. Reply Expectation

Boolean flag indicating if sender expects a response:

```json
{
  "shouldReply": true
}
```

#### 4. Events List

Events with dates mentioned in the email:

```json
{
  "events": [
    {
      "description": "Flower bouquets for choir teachers",
      "startTime": "2023-05-22"
    },
    {
      "description": "End of year celebration",
      "startTime": "2023-06-15",
      "endTime": "2023-06-15T18:00:00"
    }
  ]
}
```

#### 5. Actions List

Tasks recipient is expected to perform:

```json
{
  "actions": [
    {
      "description": "Contribute 2 to 5 euros for flower bouquets",
      "dueDate": "2023-05-22"
    },
    {
      "description": "RSVP for end of year celebration",
      "dueDate": "2023-06-10"
    }
  ]
}
```

#### 6. Fraud Risk Assessment

Risk score from 1 to 5 (5 being highest risk) with explanation:

```json
{
  "riskAssessment": {
    "risk": 4,
    "assessment": "Email contains urgent request for money transfer and sender domain doesn't match claimed identity. Possible phishing attempt."
  }
}
```

**Note**: AI is good at detecting scams but less effective with spam.

#### 7. Reply/Forward Text Extraction

For reply emails, removes threaded content leaving only new text:

```json
{
  "replyText": "Thanks for the update! I'll review the document and get back to you by Friday."
}
```

### Metadata Storage

#### Token Usage

The `tokens` field shows OpenAI API tokens consumed:

```json
{
  "summary": {
    "tokens": 2060,
    "model": "gpt-5-mini"
  }
}
```

Use this to track API costs and usage.

#### Request ID

The `id` field contains the OpenAI request ID for troubleshooting:

```json
{
  "summary": {
    "id": "chatcmpl-7IzVIEp5UL3hdQ3aZJ8AHyrJrt3R0"
  }
}
```

### Custom Prompts

Customize the AI analysis by modifying the system prompt:

1. Go to **Configuration** → **AI Processing**
2. Scroll to **AI Instructions** section
3. Edit the AI Prompt
4. Add custom instructions
5. Save configuration

#### Example: Add Language Detection

Add this line to the prompt:

```
- Return the ISO language code of the primary language used in the email as the "language" property
```

Result in webhook:

```json
{
  "summary": {
    "language": "en",
    "summary": "Meeting invitation for tomorrow at 2pm"
  }
}
```

#### Example: Custom Classification

Add business-specific classification:

```
- Classify the email type as "inquiry", "complaint", "order", or "other" in the "emailType" property
```

Result:

```json
{
  "summary": {
    "emailType": "inquiry",
    "summary": "Customer asking about product availability"
  }
}
```

### Handling Failures

EmailEngine skips AI processing if:

- OpenAI API request fails
- Rate limit exceeded
- Timeout occurs
- Email has no text content

In these cases, the `summary` section is omitted from webhook payload. Check EmailEngine logs for details.

### Webhook Content Configuration

If webhooks are configured not to include email content, AI summarization may fail (nothing to summarize). Ensure webhook configuration includes at least text content.

## Use Cases and Applications

### 1. Smart Email Routing

Route emails based on AI analysis:

```
// Pseudo code - implement in your preferred language
function routeEmail(webhook):
  summary = webhook.data.summary
  riskAssessment = webhook.data.riskAssessment

  if riskAssessment.risk >= 4:
    // High risk - route to spam/security team
    moveToSpam(webhook.data.id)
  else if summary.actions AND summary.actions.length > 0:
    // Has action items - create tasks
    createTasks(summary.actions)
  else if summary.shouldReply:
    // Needs response - add to priority inbox
    markAsPriority(webhook.data.id)
```

### 2. Automatic Calendar Events

Create calendar events from email mentions:

```
// Pseudo code - implement in your preferred language
function createEventsFromEmail(webhook):
  events = webhook.data.summary.events OR []

  for each event in events:
    if event.startTime:
      createCalendarEvent({
        title: event.description,
        start: event.startTime,
        end: event.endTime OR event.startTime,
        source: 'email',
        emailId: webhook.data.id
      })
```

### 3. Task Management Integration

Extract and create tasks:

```
// Pseudo code - implement in your preferred language
function createTasksFromEmail(webhook):
  actions = webhook.data.summary.actions OR []

  for each action in actions:
    createTask({
      title: action.description,
      dueDate: action.dueDate,
      source: webhook.data.from.address,
      emailSubject: webhook.data.subject,
      emailId: webhook.data.id
    })
```

### 4. Customer Support Triage

Automatically categorize and prioritize support emails:

```
// Pseudo code - implement in your preferred language
function triageSupportEmail(webhook):
  sentiment = webhook.data.summary.sentiment
  risk = webhook.data.riskAssessment.risk

  priority = 'normal'

  if sentiment == 'negative':
    priority = 'high'
  else if risk >= 3:
    priority = 'spam'
  else if webhook.data.summary.shouldReply:
    priority = 'normal'
  else:
    priority = 'low'

  assignToQueue(webhook.data, priority)
```

### 5. Email Analytics Dashboard

Build analytics from AI-processed emails:

```
// Pseudo code - implement in your preferred language
function trackEmailMetrics(webhook):
  summary = webhook.data.summary
  riskAssessment = webhook.data.riskAssessment

  // Track sentiment distribution
  incrementMetric('sentiment', summary.sentiment)

  // Track response requirements
  if summary.shouldReply:
    incrementMetric('requiresResponse')

  // Track action items
  if summary.actions AND summary.actions.length > 0:
    incrementMetric('hasActions', summary.actions.length)

  // Track high-risk emails
  if riskAssessment.risk >= 4:
    incrementMetric('highRisk')
    alertSecurityTeam(webhook.data)
```

### 6. Smart Email Search Assistant

Build conversational email search for users:

**cURL:**

```bash
curl -X POST "https://ee.example.com/v1/chat/user123" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Did I receive the invoice from Acme Corp?"
  }'
```

**Response:**

```json
{
  "success": true,
  "answer": "Yes, you received an invoice from Acme Corp on October 5th for $1,500.",
  "messages": [
    {
      "id": "AAAAGQAACeE",
      "from": {
        "name": "Acme Corp",
        "address": "billing@acmecorp.com"
      },
      "subject": "Invoice #12345",
      "date": "2023-10-05T10:00:00.000Z"
    }
  ]
}
```

**Implementation (Pseudo code):**

```
// Pseudo code - implement in your preferred language
function searchEmails(userId, question):
  response = HTTP_POST(
    url: "https://ee.example.com/v1/chat/" + userId,
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: {
      "question": question
    }
  )

  data = parse_json(response.body)

  return {
    answer: data.answer,
    sourceEmails: data.messages
  }

// Usage example
result = searchEmails(
  userId: 'user123',
  question: 'Did I receive the invoice from Acme Corp?'
)

print(result.answer)
// Output: "Yes, you received an invoice from Acme Corp on October 5th for $1,500."
```

## Privacy and Compliance

### Data Processing

**Important**: When OpenAI integration is enabled, EmailEngine uploads email text content to OpenAI servers.

**OpenAI Policy**: OpenAI does not use API data for training models.

**Your Responsibility**: Verify this behavior complies with:

- User data processing agreements
- GDPR requirements
- Industry-specific regulations (HIPAA, etc.)
- Company privacy policies

### User Consent

Recommendations:

1. **Transparent Disclosure**: Inform users that AI processes their emails
2. **Opt-In**: Allow users to enable/disable AI processing
3. **Data Retention**: Clarify how long AI-processed data is stored
4. **Third-Party Processing**: Disclose data sent to OpenAI

### Per-Account Control

You can enable/disable AI processing per account if needed (would require custom implementation).

## AI Pre-Processing Filter (openAiPreProcessingFn)

By default, AI processing is applied to all incoming emails in the INBOX folder. The `openAiPreProcessingFn` setting allows you to define a JavaScript function that filters which emails get processed by the AI, giving you fine-grained control over AI usage and costs.

### How It Works

When configured, the pre-processing filter runs before any AI processing occurs:

1. New email arrives in monitored account
2. Pre-processing filter function evaluates the email
3. If function returns `true`, email is sent to OpenAI for analysis
4. If function returns any other value, AI processing is skipped

### Configuration

Configure the filter via the Settings API:

```bash
curl -X POST "https://emailengine.example.com/v1/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openAiPreProcessingFn": "// Only process emails from specific domains\nconst senderDomain = payload.data.from?.address?.split(\"@\")[1];\nif ([\"important-client.com\", \"vip-customer.org\"].includes(senderDomain)) {\n  return true;\n}\nreturn false;"
  }'
```

### Filter Function Structure

The filter function receives the webhook payload and must return `true` to allow AI processing:

```javascript
// payload contains the full messageNew webhook data
// Return true to process with AI, false to skip

// Skip automated emails
if (payload.data.headers && payload.data.headers["auto-submitted"]) {
  return false;
}

// Skip emails from no-reply addresses
if (payload.data.from?.address?.includes("noreply")) {
  return false;
}

// Process all other emails
return true;
```

### Example Filters

**1. Process Only High-Priority Senders**

```javascript
// Only AI-process emails from VIP domains
const vipDomains = ["client.com", "partner.org", "executive.net"];
const senderDomain = payload.data.from?.address?.split("@")[1]?.toLowerCase();

if (vipDomains.includes(senderDomain)) {
  return true;
}
return false;
```

**2. Skip Newsletters and Automated Messages**

```javascript
// Skip common newsletter and automated email patterns
const from = payload.data.from?.address?.toLowerCase() || "";
const subject = payload.data.subject?.toLowerCase() || "";

// Skip newsletters
if (from.includes("newsletter") || from.includes("digest")) {
  return false;
}

// Skip automated messages
if (payload.data.headers?.["auto-submitted"] || payload.data.headers?.["x-auto-response-suppress"]) {
  return false;
}

// Skip common notification subjects
if (subject.includes("notification") || subject.includes("alert")) {
  return false;
}

return true;
```

**3. Process Based on Subject Keywords**

```javascript
// Only process emails with specific keywords
const subject = payload.data.subject?.toLowerCase() || "";
const keywords = ["urgent", "invoice", "contract", "proposal", "meeting"];

for (const keyword of keywords) {
  if (subject.includes(keyword)) {
    return true;
  }
}
return false;
```

**4. Size-Based Filtering**

```javascript
// Skip very short or very long emails (likely spam or bulk)
const textSize = payload.data.text?.encodedSize?.plain || 0;

if (textSize < 50) {
  // Too short - likely spam
  return false;
}
if (textSize > 50000) {
  // Too long - will consume many tokens
  return false;
}
return true;
```

**5. Time-Based Processing**

```javascript
// Only process recent emails (skip old backlog)
const emailDate = new Date(payload.data.date);
const now = new Date();
const hoursDiff = (now - emailDate) / (1000 * 60 * 60);

// Skip emails older than 24 hours
if (hoursDiff > 24) {
  return false;
}
return true;
```

### Available Payload Data

The filter function has access to the full `messageNew` webhook payload:

```javascript
payload.account;           // Account ID
payload.path;              // Mailbox path (e.g., "INBOX")
payload.data.id;           // Message ID
payload.data.from;         // { name, address }
payload.data.to;           // [{ name, address }, ...]
payload.data.subject;      // Email subject
payload.data.date;         // Message date
payload.data.headers;      // Email headers object
payload.data.text;         // { encodedSize: { plain, html } }
payload.data.attachments;  // Attachment metadata array
```

### Sandbox Environment

The filter function runs in the same sandbox as other pre-processing functions:

**Available:**

- Standard JavaScript (ES6+)
- `Date`, `Math`, `JSON`, `RegExp`
- `env` - Script environment variables (from `scriptEnv` setting)
- `logger` - Pino.js logger for debugging

**Not Available:**

- `fetch` - No external HTTP requests
- `require()` - No module imports
- Filesystem or system access

### Debugging Filters

Errors in the filter function are logged and the email is skipped (treated as returning `false`). Check EmailEngine logs for filter errors:

```bash
# View filter-related log entries
journalctl -u emailengine | grep "llm-pre-process"
```

You can also use the logger for debugging:

```javascript
logger.info({ from: payload.data.from?.address, subject: payload.data.subject, msg: "Evaluating email" });

const result = payload.path === "INBOX";
logger.info({ result, msg: "Filter decision" });

return result;
```

### Best Practices

1. **Start broad, then narrow** - Begin with minimal filtering and add rules as needed
2. **Monitor costs** - Track token usage to measure filter effectiveness
3. **Log decisions** - Use `logger` to track why emails are filtered
4. **Handle missing data** - Use optional chaining (`?.`) for potentially undefined values
5. **Keep it fast** - Complex logic adds processing overhead

## Cost Management

### Estimating Costs

OpenAI charges based on token usage. Pricing varies by model and changes over time. Check [OpenAI's pricing page](https://openai.com/pricing) for current rates.

**General pricing tiers:**

- **Mini/Nano models** (GPT-5 Mini, GPT-4o Mini) - Lowest cost, best for high-volume processing
- **Standard models** (GPT-5, GPT-4o) - Moderate cost, balanced performance
- **Pro models** (GPT-5 Pro, O3 Pro) - Higher cost, maximum capability

**Example**: Processing 100 emails per day with GPT-5 Mini:

- Average email: ~500 tokens input, 200 tokens output
- Daily tokens: ~70,000 tokens
- Monthly cost varies by current pricing - typically very affordable with mini models

### Cost Optimization

1. **Use Mini Models**: GPT-5 Mini or GPT-4o Mini for most email processing
2. **Filter Emails**: Only process emails from Inbox (skip spam, notifications)
3. **Selective Processing**: Process only emails matching certain criteria
4. **Monitor Usage**: Track `tokens` field in webhooks
5. **Rate Limiting**: Limit processing during high-volume periods

### Monitoring Token Usage

Track token usage from webhooks:

```
// Pseudo code - implement in your preferred language
function trackTokenUsage(webhook):
  if webhook.data.summary exists:
    tokens = webhook.data.summary.tokens
    model = webhook.data.summary.model

    logMetric('openai_tokens', {
      model: model,
      tokens: tokens,
      account: webhook.account,
      timestamp: current_timestamp()
    })
```
