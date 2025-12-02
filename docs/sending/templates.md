---
title: Email Templates
sidebar_position: 6
description: Create and manage reusable email templates with Handlebars for consistent messaging
---

<!--
SOURCE ATTRIBUTION:
- Primary: docs/usage/email-templates.md
-->

# Email Templates

Email templating allows you to prepare and reuse email content efficiently. Create templates once, then reference them when sending to ensure consistent branding and messaging across all your emails.

## Why Use Templates

Templates provide several benefits:

- **Consistency**: Ensure brand consistency across all emails
- **Efficiency**: Define content once, reuse many times
- **Maintainability**: Update content in one place
- **Personalization**: Use Handlebars for dynamic content
- **Separation of concerns**: Keep email content separate from application logic

## Managing Templates

You can manage templates in two ways:

1. **Templates API**: Programmatically create, update, and delete templates
2. **Admin Interface**: Visual interface at **Email Templates** in the side menu

![Email Templates List](/img/screenshots/15-templates-with-data.png)
*Email templates list in the admin interface*

![Template Editor](/img/screenshots/16-template-editor.png)
*Template editor showing Handlebars syntax and fields*

## Creating Templates

### Via API

Create a template using the [create template API](/docs/api/post-v-1-templates-template):

```bash
curl -XPOST "https://ee.example.com/v1/templates/template" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "example",
    "name": "Welcome Email",
    "description": "Welcome new users to the platform",
    "content": {
      "subject": "Welcome to {{{params.companyName}}}!",
      "text": "Hello {{params.firstName}},\n\nWelcome to {{params.companyName}}!",
      "html": "<h1>Hello {{params.firstName}}</h1><p>Welcome to <strong>{{params.companyName}}</strong>!</p>"
    }
  }'
```

**Response:**

```json
{
  "created": true,
  "account": "example",
  "id": "AAABgUIbuG0AAAAE"
}
```

Save the `id` value to reference this template when sending.

### Via Admin Interface

1. Navigate to **Email templates** in the EmailEngine UI
2. Click **Create Template**
3. Fill in template details:
   - **Name**: Template identifier (required)
   - **Description**: What this template is for (optional)
   - **Subject**: Email subject with optional Handlebars
   - **Text**: Plain text version with optional Handlebars
   - **HTML**: HTML version with optional Handlebars
4. Click **Save**

The interface shows a preview of how the template will render.

## Using Templates

### Basic Usage

When sending emails using the Submission API, set the `template` property instead of `subject`, `html`, or `text`:

```bash
curl -XPOST "https://ee.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {
        "name": "Recipient Name",
        "address": "recipient@example.com"
      }
    ],
    "template": "AAABgUIbuG0AAAAE",
    "render": {
      "params": {
        "firstName": "Alice",
        "companyName": "Acme Corp"
      }
    }
  }'
```

EmailEngine loads the template and renders it with your provided params.

### With Other Properties

You can include any other valid submission properties:

```bash
curl -XPOST "https://ee.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{ "address": "recipient@example.com" }],
    "template": "AAABgUIbuG0AAAAE",
    "render": {
      "params": {
        "firstName": "Alice",
        "companyName": "Acme Corp"
      }
    },
    "replyTo": { "address": "support@example.com" },
    "attachments": [
      {
        "filename": "welcome.pdf",
        "content": "base64-encoded-content"
      }
    ]
  }'
```

## Template Syntax

Templates use [Handlebars](https://handlebarsjs.com/) for dynamic content.

### Variables

Insert variables using double or triple braces:

```handlebars
Hello {{params.firstName}} {{params.lastName}}!

Subject: Welcome {{{params.name}}}
```

- **Double braces** `{{...}}`: HTML-escape the value
- **Triple braces** `{{{...}}}`: No escaping (use for plain text fields like subject)

### Built-in Variables

EmailEngine provides built-in variables:

```handlebars
From: {{account.name}} <{{account.email}}>
Support: {{service.url}}
Custom params: {{params.anyKey}}
```

Available variables:

- `{{account.email}}` - Sender's email address
- `{{account.name}}` - Sender's display name
- `{{service.url}}` - EmailEngine instance URL
- `{{params.*}}` - Any custom parameters you provide

### Conditionals

Use `if`/`else` for conditional content:

```handlebars
<p>Hello {{params.firstName}},</p>

{{#if params.isPremium}}
  <p>Welcome to our premium tier! You have access to all features.</p>
{{else}}
  <p>Welcome! Upgrade to premium for additional features.</p>
{{/if}}
```

### Loops

Iterate over arrays with `each`:

```handlebars
<h2>Your order:</h2>
<ul>
{{#each params.items}}
  <li>{{this.name}} - ${{this.price}}</li>
{{/each}}
</ul>

<p>Total: ${{params.total}}</p>
```

With data:

```json
{
  "params": {
    "items": [
      { "name": "Product A", "price": "29.99" },
      { "name": "Product B", "price": "39.99" }
    ],
    "total": "69.98"
  }
}
```

### Helpers

Common Handlebars helpers:

```handlebars
{{!-- Comments --}}
{{! This is a comment and won't appear in output }}

{{!-- Unless (opposite of if) --}}
{{#unless params.isSubscribed}}
  <p>Subscribe to our newsletter!</p>
{{/unless}}

{{!-- With (change context) --}}
{{#with params.user}}
  <p>{{firstName}} {{lastName}}</p>
  <p>{{email}}</p>
{{/with}}
```

## Template Examples

### Welcome Email

```handlebars
Subject: Welcome to {{{params.companyName}}}, {{{params.firstName}}}!

HTML:
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #4CAF50; color: white; padding: 20px; }
    .content { padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to {{params.companyName}}!</h1>
  </div>
  <div class="content">
    <p>Hello {{params.firstName}},</p>
    <p>Thank you for joining {{params.companyName}}. We're excited to have you on board!</p>

    {{#if params.nextSteps}}
    <h2>Next Steps:</h2>
    <ul>
    {{#each params.nextSteps}}
      <li>{{this}}</li>
    {{/each}}
    </ul>
    {{/if}}

    <p>If you have any questions, reply to this email or visit our <a href="{{service.url}}/help">help center</a>.</p>

    <p>Best regards,<br>
    The {{params.companyName}} Team</p>
  </div>
</body>
</html>

Text:
Welcome to {{params.companyName}}!

Hello {{params.firstName}},

Thank you for joining {{params.companyName}}. We're excited to have you on board!

{{#if params.nextSteps}}
Next Steps:
{{#each params.nextSteps}}
- {{this}}
{{/each}}
{{/if}}

If you have any questions, reply to this email or visit our help center at {{service.url}}/help.

Best regards,
The {{params.companyName}} Team
```

### Order Confirmation

```handlebars
Subject: Order #{{{params.orderNumber}}} Confirmed

HTML:
<h1>Order Confirmation</h1>
<p>Hello {{params.customerName}},</p>
<p>Your order <strong>#{{params.orderNumber}}</strong> has been confirmed!</p>

<h2>Order Details:</h2>
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: #f5f5f5;">
      <th style="padding: 10px; text-align: left;">Item</th>
      <th style="padding: 10px; text-align: right;">Qty</th>
      <th style="padding: 10px; text-align: right;">Price</th>
    </tr>
  </thead>
  <tbody>
  {{#each params.items}}
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;">{{this.name}}</td>
      <td style="padding: 10px; text-align: right;">{{this.quantity}}</td>
      <td style="padding: 10px; text-align: right;">${{this.price}}</td>
    </tr>
  {{/each}}
  </tbody>
  <tfoot>
    <tr style="font-weight: bold; background: #f5f5f5;">
      <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
      <td style="padding: 10px; text-align: right;">${{params.total}}</td>
    </tr>
  </tfoot>
</table>

<p>Estimated delivery: {{params.estimatedDelivery}}</p>

<p>Track your order: <a href="{{params.trackingUrl}}">{{params.trackingNumber}}</a></p>
```

### Password Reset

```handlebars
Subject: Reset Your Password

HTML:
<h1>Password Reset Request</h1>
<p>Hello {{params.firstName}},</p>
<p>We received a request to reset your password for your {{account.name}} account.</p>

<p>Click the button below to reset your password:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{params.resetUrl}}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{params.resetUrl}}</p>

<p><strong>This link will expire in {{params.expiryHours}} hours.</strong></p>

<p>If you didn't request this password reset, you can safely ignore this email.</p>

<p>Best regards,<br>
{{account.name}}</p>
```

## Template Management

### List All Templates

Retrieve all templates using the [list templates API](/docs/api/get-v-1-templates):

```bash
curl "https://ee.example.com/v1/templates?account=example" \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "account": "example",
  "total": 2,
  "page": 0,
  "pages": 1,
  "templates": [
    {
      "id": "AAABgUIbuG0AAAAE",
      "name": "Welcome Email",
      "description": "Welcome new users",
      "format": "html",
      "created": "2025-05-14T10:00:00.000Z",
      "updated": "2025-05-14T12:00:00.000Z"
    },
    {
      "id": "AAABgUIbuG0AAAAF",
      "name": "Order Confirmation",
      "description": "Confirm orders",
      "format": "html",
      "created": "2025-05-14T11:00:00.000Z",
      "updated": "2025-05-14T11:00:00.000Z"
    }
  ]
}
```

### Get Template Details

Use the [get template API](/docs/api/get-v-1-templates-template-template):

```bash
curl "https://ee.example.com/v1/templates/template/AAABgUIbuG0AAAAE" \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "account": "example",
  "id": "AAABgUIbuG0AAAAE",
  "name": "Welcome Email",
  "description": "Welcome new users to the platform",
  "format": "html",
  "created": "2025-05-14T10:00:00.000Z",
  "updated": "2025-05-14T12:00:00.000Z",
  "content": {
    "subject": "Welcome to {{{params.companyName}}}!",
    "text": "Hello {{params.firstName}}...",
    "html": "<h1>Hello {{params.firstName}}</h1>..."
  }
}
```

### Update Template

Use the [update template API](/docs/api/put-v-1-templates-template-template):

```bash
curl -XPUT "https://ee.example.com/v1/templates/template/AAABgUIbuG0AAAAE" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "subject": "Welcome to {{{params.companyName}}}, {{{params.firstName}}}!",
      "html": "<h1>Updated content</h1>"
    }
  }'
```

Only include fields you want to update.

### Delete Template

Use the [delete template API](/docs/api/delete-v-1-templates-template-template):

```bash
curl -XDELETE "https://ee.example.com/v1/templates/template/AAABgUIbuG0AAAAE" \
  -H "Authorization: Bearer <token>"
```

## Using Templates with Mail Merge

Templates work great with mail merge for bulk personalized sending:

```bash
curl -XPOST "https://ee.example.com/v1/account/example/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "AAABgUIbuG0AAAAE",
    "mailMerge": [
      {
        "to": { "name": "Alice", "address": "alice@example.com" },
        "params": {
          "firstName": "Alice",
          "companyName": "Acme Corp",
          "isPremium": true
        }
      },
      {
        "to": { "name": "Bob", "address": "bob@example.com" },
        "params": {
          "firstName": "Bob",
          "companyName": "Acme Corp",
          "isPremium": false
        }
      }
    ]
  }'
```

Each recipient gets a personalized email based on their params.

