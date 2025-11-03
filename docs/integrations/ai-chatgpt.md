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

:::warning Feature No Longer Available
The "Chat with emails" feature has been removed as it required Document Store (ElasticSearch backend) which is no longer available. This section is kept for reference only.
:::

### Overview

The "Chat with emails" feature enabled conversational search over your email history using vector embeddings and AI.

**Example Question**: "Last week, I received a newsletter about a city threatened by salt water. Which city was it?"

**AI Response**: "The city threatened by salt water mixing with their drinking water is New Orleans."

#### 2. Enable Chat Feature

1. Navigate to **Chat with Emails** configuration tab
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
3. **Vector Search**: Document Store returned most relevant email chunks based on embeddings similarity
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

1. **Feature Removed**: No longer available (required Document Store backend)
2. **Not True Chat**: Was more of an enhanced search than conversation
3. **Context**: Didn't maintain conversation context between queries

## Use Cases and Applications

### 1. Smart Email Routing

Route emails based on AI analysis:

```
// Pseudo code - implement in your preferred language
function routeEmail(webhook):
  summary = webhook.data.summary

  if summary.riskAssessment.risk >= 4:
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

  // Track sentiment distribution
  incrementMetric('sentiment', summary.sentiment)

  // Track response requirements
  if summary.shouldReply:
    incrementMetric('requiresResponse')

  // Track action items
  if summary.actions AND summary.actions.length > 0:
    incrementMetric('hasActions', summary.actions.length)

  // Track high-risk emails
  if summary.riskAssessment.risk >= 4:
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

