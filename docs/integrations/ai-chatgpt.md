---
title: AI and ChatGPT Integration
sidebar_position: 8
description: Complete guide to integrating AI and ChatGPT with EmailEngine for email processing, summarization, and conversational search
---

# AI and ChatGPT Integration

Learn how to enhance your email workflows with artificial intelligence using EmailEngine's OpenAI/ChatGPT integration capabilities.

**Sources**:
- [Integrating AI with EmailEngine](https://emailengine.app/blog/generating-summaries-of-new-emails-using-chatgpt) (September 14, 2023)
- [Improved ChatGPT Integration](https://emailengine.app/blog/improved-chatgpt-integration-with-emailengine) (June 6, 2023)
- [Chat with Emails](https://emailengine.app/blog/chat-with-emails-using-emailengine) (October 3, 2023)

## Overview

EmailEngine integrates with OpenAI's API to provide AI-powered email processing capabilities:

- **Email Summarization**: Generate concise summaries of incoming emails
- **Sentiment Analysis**: Detect positive, neutral, or negative sentiment
- **Event Extraction**: Identify events and dates mentioned in emails
- **Action Items**: Extract tasks and due dates
- **Fraud Detection**: Assess risk of scam or phishing emails
- **Reply Detection**: Identify if sender expects a response
- **Conversational Search**: Ask questions about your email history

## Prerequisites

Before enabling AI integration:

1. **EmailEngine Instance**: Running EmailEngine installation
2. **OpenAI Account**: Account with API access
3. **API Key**: OpenAI API key (paid account recommended)
4. **ElasticSearch** (optional): Required for chat/search features

### OpenAI API Access

- **GPT-3.5**: Available to all OpenAI accounts
- **GPT-4**: Requires separate [application](https://openai.com/waitlist/gpt-4-api)
- **Paid Account**: Recommended for production (free accounts have strict rate limits)

## Feature 1: Email Processing and Summarization

### Enable AI Processing

1. Navigate to **Configuration** → **LLM Integration** in EmailEngine
2. Enter your OpenAI API key
3. Check "Enable email processing with AI"
4. Select model (GPT-3.5 or GPT-4)
5. Save configuration

![LLM Integration Configuration](/img/screenshots/llm-config.png)

### Model Selection

| Model | Speed | Cost | Context Window | Best For |
|-------|-------|------|----------------|----------|
| **GPT-3.5 Turbo** | Fast | Low | 4K tokens | Summaries, basic analysis |
| **GPT-4** | Slower | High | 8K+ tokens | Complex analysis, longer emails |

**Recommendation**:
- Use GPT-3.5 for basic summarization
- Use GPT-4 for advanced features or longer emails

### How It Works

When AI processing is enabled, EmailEngine automatically processes every new email arriving in the INBOX folder:

1. Email arrives in monitored account
2. EmailEngine extracts text content
3. Content sent to OpenAI API for analysis
4. Analysis results added to webhook payload
5. If ElasticSearch is enabled, analysis stored with message

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
      "model": "gpt-4",
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
    "model": "gpt-4"
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

1. Go to **Configuration** → **LLM Integration**
2. Expand **Advanced Settings**
3. Edit the prompt template
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

## Feature 2: Chat with Emails (Conversational Search)

### Overview

The "Chat with emails" feature enables conversational search over your email history using vector embeddings and AI.

**Example Question**: "Last week, I received a newsletter about a city threatened by salt water. Which city was it?"

**AI Response**: "The city threatened by salt water mixing with their drinking water is New Orleans."

### Prerequisites

1. EmailEngine instance
2. ElasticSearch server
3. OpenAI API key
4. Email accounts connected

### Setup Process

#### 1. Enable Document Store

1. Go to **Configuration** → **Document Store**
2. Enter ElasticSearch connection details:
   ```
   URL: https://elasticsearch.example.com:9200
   Username: elastic
   Password: your-password
   ```
3. Enable Document Store
4. EmailEngine begins syncing emails to ElasticSearch

#### 2. Enable Chat Feature

1. Navigate to **Chat with Emails** tab (under Document Store)
2. Enter OpenAI API key
3. Select model (recommend GPT-3.5 or GPT-4)
4. Save configuration

#### 3. Index Existing Accounts

For existing accounts already added to EmailEngine:

**Problem**: Only *new* emails are processed for chat. Existing emails aren't automatically included.

**Solution**: Flush and re-index accounts using the Account Flush API:

```bash
curl -XPUT \
  "https://ee.example.com/v1/account/example/flush" \
  -H "Authorization: Bearer <TOKEN>"
```

This triggers complete re-indexing of the account.

### Using the Chat API

#### Basic Request

```bash
curl -XPOST \
  "http://127.0.0.1:3000/v1/chat/example" \
  -H "Authorization: Bearer <secret token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What emails did I receive about the project proposal?"
  }'
```

#### Response

```json
{
  "success": true,
  "answer": "You received 3 emails about the project proposal. The first was from John on Monday outlining initial requirements, followed by Sarah's feedback on Wednesday, and finally the revised proposal from John on Friday.",
  "messages": [
    {
      "id": "AAAAGQAACeE",
      "path": "INBOX",
      "date": "2023-10-02T10:00:00.000Z",
      "from": {
        "name": "John Smith",
        "address": "john@example.com"
      },
      "subject": "Project Proposal - Initial Draft",
      "messageSpecialUse": "\\Inbox"
    },
    {
      "id": "AAAAGQAACeF",
      "path": "INBOX",
      "date": "2023-10-04T14:30:00.000Z",
      "from": {
        "name": "Sarah Johnson",
        "address": "sarah@example.com"
      },
      "subject": "Re: Project Proposal - Feedback",
      "messageSpecialUse": "\\Inbox"
    },
    {
      "id": "AAAAGQAACeG",
      "path": "INBOX",
      "date": "2023-10-06T09:15:00.000Z",
      "from": {
        "name": "John Smith",
        "address": "john@example.com"
      },
      "subject": "Project Proposal - Revised",
      "messageSpecialUse": "\\Inbox"
    }
  ]
}
```

### Example Questions

**Time-Based Queries**:
```
"What emails did I receive last week?"
"Show me emails from yesterday about the meeting"
```

**Sender-Based Queries**:
```
"What did John email me about?"
"Find emails from jane@example.com"
```

**Content-Based Queries**:
```
"Find the email with the invoice attached"
"Which email mentioned the Paris conference?"
```

**Action-Based Queries**:
```
"What action items do I have from recent emails?"
"Did anyone ask me to review a document?"
```

### How It Works (Technical Details)

#### 1. Email Indexing

When a new email arrives:

1. EmailEngine divides email text into 400-token chunks
2. Each chunk prefixed with metadata (sender, subject, date, etc.)
3. Vector embeddings created for each chunk using OpenAI Embeddings API
4. Embeddings stored in ElasticSearch with text content

**Chunking Benefits**:
- Avoids sending entire emails to OpenAI (context window limits)
- Enables finding specific relevant sections
- Maximizes number of emails that can be referenced in a query

#### 2. Query Processing

When you ask a question:

1. **Question Embedding**: Question converted to vector embeddings
2. **Query Analysis**: GPT-3.5 Instruct analyzes question for constraints (timeframe, sender, etc.)
3. **Vector Search**: ElasticSearch returns most relevant email chunks based on embeddings similarity
4. **Answer Generation**: Relevant chunks + question sent to GPT for answer generation
5. **Response Formatting**: Answer formatted with source email references

#### 3. Relevant Email Selection

System retrieves **content chunks**, not whole emails:
- Each chunk is max 400 tokens
- Only chunks with high similarity scores included
- Chunks may come from different emails
- Source emails listed in response

### Web Interface

EmailEngine provides a "Try it" button on the Chat configuration page for testing queries directly in the web interface.

### Limitations

1. **Not True Chat**: More of an enhanced search than conversation
2. **Context**: Doesn't maintain conversation context between queries
3. **New Emails Only**: Must re-index existing accounts
4. **ElasticSearch Required**: Full dependency on ElasticSearch
5. **Metadata Loss**: Moving email from Inbox to another folder loses custom metadata in ElasticSearch

## Use Cases and Applications

### 1. Smart Email Routing

Route emails based on AI analysis:

```javascript
function routeEmail(webhook) {
  const summary = webhook.data.summary;

  if (summary.riskAssessment.risk >= 4) {
    // High risk - route to spam/security team
    moveToSpam(webhook.data.id);
  } else if (summary.actions && summary.actions.length > 0) {
    // Has action items - create tasks
    createTasks(summary.actions);
  } else if (summary.shouldReply) {
    // Needs response - add to priority inbox
    markAsPriority(webhook.data.id);
  }
}
```

### 2. Automatic Calendar Events

Create calendar events from email mentions:

```javascript
function createEventsFromEmail(webhook) {
  const events = webhook.data.summary.events || [];

  events.forEach(event => {
    if (event.startTime) {
      createCalendarEvent({
        title: event.description,
        start: event.startTime,
        end: event.endTime || event.startTime,
        source: 'email',
        emailId: webhook.data.id
      });
    }
  });
}
```

### 3. Task Management Integration

Extract and create tasks:

```javascript
function createTasksFromEmail(webhook) {
  const actions = webhook.data.summary.actions || [];

  actions.forEach(action => {
    createTask({
      title: action.description,
      dueDate: action.dueDate,
      source: webhook.data.from.address,
      emailSubject: webhook.data.subject,
      emailId: webhook.data.id
    });
  });
}
```

### 4. Customer Support Triage

Automatically categorize and prioritize support emails:

```javascript
function triageSupportEmail(webhook) {
  const sentiment = webhook.data.summary.sentiment;
  const risk = webhook.data.riskAssessment.risk;

  let priority = 'normal';

  if (sentiment === 'negative') {
    priority = 'high';
  } else if (risk >= 3) {
    priority = 'spam';
  } else if (webhook.data.summary.shouldReply) {
    priority = 'normal';
  } else {
    priority = 'low';
  }

  assignToQueue(webhook.data, priority);
}
```

### 5. Email Analytics Dashboard

Build analytics from AI-processed emails:

```javascript
function trackEmailMetrics(webhook) {
  const summary = webhook.data.summary;

  // Track sentiment distribution
  incrementMetric('sentiment', summary.sentiment);

  // Track response requirements
  if (summary.shouldReply) {
    incrementMetric('requiresResponse');
  }

  // Track action items
  if (summary.actions && summary.actions.length > 0) {
    incrementMetric('hasActions', summary.actions.length);
  }

  // Track high-risk emails
  if (summary.riskAssessment.risk >= 4) {
    incrementMetric('highRisk');
    alertSecurityTeam(webhook.data);
  }
}
```

### 6. Smart Email Search Assistant

Build conversational email search for users:

```javascript
async function searchEmails(userId, question) {
  const response = await fetch(
    `https://ee.example.com/v1/chat/${userId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    }
  );

  const data = await response.json();

  return {
    answer: data.answer,
    sourceEmails: data.messages
  };
}

// Usage
const result = await searchEmails(
  'user123',
  'Did I receive the invoice from Acme Corp?'
);

console.log(result.answer);
// "Yes, you received an invoice from Acme Corp on October 5th for $1,500."
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

## Cost Management

### Estimating Costs

OpenAI charges based on token usage:

**GPT-3.5 Turbo** (as of 2023):
- Input: $0.0015 per 1K tokens
- Output: $0.002 per 1K tokens

**GPT-4**:
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens

**Example**: Processing 100 emails per day with GPT-3.5:
- Average email: ~500 tokens input, 200 tokens output
- Daily tokens: ~70,000 tokens
- Monthly cost: ~$3-5

### Cost Optimization

1. **Use GPT-3.5 for Summaries**: Reserve GPT-4 for complex analysis
2. **Filter Emails**: Only process emails from Inbox (skip spam, notifications)
3. **Selective Processing**: Process only emails matching certain criteria
4. **Monitor Usage**: Track `tokens` field in webhooks
5. **Rate Limiting**: Limit processing during high-volume periods

### Monitoring Token Usage

Track token usage from webhooks:

```javascript
function trackTokenUsage(webhook) {
  if (webhook.data.summary) {
    const tokens = webhook.data.summary.tokens;
    const model = webhook.data.summary.model;

    logMetric('openai_tokens', {
      model,
      tokens,
      account: webhook.account,
      timestamp: new Date()
    });
  }
}
```

## Troubleshooting

### AI Processing Not Working

**Problem**: Webhooks don't include `summary` section

**Solutions**:
1. Verify OpenAI API key is correct
2. Check OpenAI account has available credits
3. Ensure webhook configuration includes email content
4. Review EmailEngine logs for API errors
5. Test API key with OpenAI directly

### Rate Limit Errors

**Problem**: "Rate limit exceeded" in logs

**Solutions**:
1. Upgrade to paid OpenAI account
2. Reduce number of emails processed
3. Add rate limiting in webhook processing
4. Use GPT-3.5 instead of GPT-4 (higher limits)

### Chat Feature Not Working

**Problem**: Chat API returns no results or errors

**Solutions**:
1. Verify ElasticSearch is running and accessible
2. Check Document Store is enabled
3. Confirm accounts have been indexed (or flushed)
4. Test ElasticSearch connection manually
5. Review EmailEngine logs

### Inaccurate AI Responses

**Problem**: AI summaries or answers are wrong

**Solutions**:
1. Try GPT-4 instead of GPT-3.5 (more accurate)
2. Adjust custom prompts for better guidance
3. Ensure email content is complete (not truncated)
4. For chat: Flush and re-index account
5. Review question phrasing (be specific)

### High API Costs

**Problem**: OpenAI costs higher than expected

**Solutions**:
1. Monitor token usage via `summary.tokens`
2. Switch to GPT-3.5 from GPT-4
3. Filter which emails get processed
4. Reduce custom prompt length
5. Review EmailEngine logs for unexpected API calls

## Best Practices

### 1. Start with GPT-3.5

Begin with GPT-3.5 Turbo:
- Lower cost
- Faster processing
- Sufficient for most use cases
- Upgrade to GPT-4 only if needed

### 2. Use Paid OpenAI Account

Free accounts have strict rate limits that will cause frequent failures in production.

### 3. Process Inbox Only

Configure EmailEngine to only process emails in Inbox to avoid wasting API calls on spam and notifications.

### 4. Handle Missing Summaries

Always check if `summary` exists before accessing:

```javascript
if (webhook.data.summary) {
  const sentiment = webhook.data.summary.sentiment;
  // Process...
} else {
  // AI processing failed or unavailable
}
```

### 5. Monitor and Alert

Set up monitoring for:
- AI processing failures
- High token usage
- Rate limit errors
- Response accuracy issues

### 6. Customize Prompts for Your Use Case

Tailor the AI prompt to extract information specific to your business needs.

### 7. Combine with Traditional Processing

Use AI to augment, not replace, traditional email processing:
- Use AI for classification and extraction
- Use rules for routing and automation
- Combine both for best results

## Next Steps

- Review [API Reference](https://api.emailengine.app/) for Chat API details
- Learn about [Webhooks Configuration](/docs/usage/webhooks.md)
- Explore [ElasticSearch Integration](/docs/advanced/elasticsearch.md)
- Set up [Monitoring](/docs/advanced/monitoring.md)

## See Also

- [CRM Integration](/docs/integrations/crm.md)
- [Webhooks](/docs/usage/webhooks.md)
- [Performance Tuning](/docs/advanced/performance-tuning.md)
- [API Reference](/docs/api-reference/index.md)

## Resources

- **OpenAI API**: [platform.openai.com](https://platform.openai.com/)
- **GPT-4 Access**: [OpenAI Waitlist](https://openai.com/waitlist/gpt-4-api)
- **EmailEngine API**: [api.emailengine.app](https://api.emailengine.app/)
- **Support**: [Get Help](/docs/support/index.md)
