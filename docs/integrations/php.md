---
title: PHP Integration
sidebar_position: 7
description: Complete guide to integrating EmailEngine with PHP applications using Composer
---

# PHP Integration Guide

Learn how to integrate EmailEngine with PHP applications using the official EmailEngine PHP SDK available through Composer.


## Overview

The EmailEngine PHP library provides a simple interface for:
- Registering and managing email accounts
- Sending emails through connected accounts
- Making API requests to EmailEngine
- Handling responses and errors

## Installation

### Install via Composer

Add the EmailEngine PHP library as a dependency:

```bash
composer require postalsys/emailengine-php
```

## Quick Start

### 1. Import and Initialize

```php
<?php

require 'vendor/autoload.php';

use EmailEnginePhp\EmailEngine;

// Initialize EmailEngine client
$ee = new EmailEngine([
    'access_token' => '3eb50ef80efb67885af...',
    'ee_base_url' => 'http://127.0.0.1:3000/',
]);
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `access_token` | Yes | API access token from EmailEngine |
| `ee_base_url` | Yes | Base URL of your EmailEngine instance |

**Getting an Access Token**:
1. Open EmailEngine web interface
2. Navigate to "Settings" → "Access Tokens"
3. Click "Create New Token"
4. Copy the generated token

## Registering an Email Account

Use the `request()` helper method to make API calls to EmailEngine (see: [Account Registration API](/docs/api/post-v-1-account)):

```php
<?php

$account_response = $ee->request('post', '/v1/account', [
    'account' => 'example',
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'imap' => [
        'auth' => [
            'user' => 'john@example.com',
            'pass' => 'your-password',
        ],
        'host' => 'imap.example.com',
        'port' => 993,
        'secure' => true,
    ],
    'smtp' => [
        'auth' => [
            'user' => 'john@example.com',
            'pass' => 'your-password',
        ],
        'host' => 'smtp.example.com',
        'port' => 465,
        'secure' => true,
    ],
]);

echo "Account registered: " . $account_response['account'] . "\n";
```

### Account Configuration

**IMAP Settings**:
- `auth.user`: IMAP username (usually email address)
- `auth.pass`: IMAP password or app-specific password
- `host`: IMAP server hostname
- `port`: IMAP port (993 for SSL/TLS, 143 for STARTTLS)
- `secure`: Use SSL/TLS connection

**SMTP Settings**:
- `auth.user`: SMTP username (usually email address)
- `auth.pass`: SMTP password or app-specific password
- `host`: SMTP server hostname
- `port`: SMTP port (465 for SSL/TLS, 587 for STARTTLS)
- `secure`: Use SSL/TLS connection

## Waiting for Account Connection

After registering an account, EmailEngine begins indexing. Wait until the account is connected before making API requests:

```php
<?php

$account_connected = false;

while (!$account_connected) {
    sleep(1);

    $account_info = $ee->request('get', '/v1/account/example');

    if ($account_info['state'] == 'connected') {
        $account_connected = true;
        echo "Account is connected\n";
    } else {
        echo "Account status is: " . $account_info['state'] . "...\n";
    }
}
```

### Account States

| State | Description |
|-------|-------------|
| `init` | Account is being initialized |
| `connecting` | Connecting to email server |
| `syncing` | Performing initial synchronization |
| `connected` | Account is ready to use |
| `authenticationError` | Authentication failed |
| `connectError` | Connection failed |
| `disconnected` | Account is temporarily disconnected |
| `unset` | Account is not configured |

**Important**: Add a timeout or maximum retry count to avoid infinite loops if the account cannot connect.

## Sending Emails

Once the account is connected, use the message submission endpoint (see: [Submit Message API](/docs/api/post-v-1-account-account-submit)):

```php
<?php

$submit_response = $ee->request('post', '/v1/account/example/submit', [
    'from' => [
        'name' => 'John Doe',
        'address' => 'john@example.com',
    ],
    'to' => [
        [
            'name' => 'Jane Smith',
            'address' => 'jane@example.com',
        ],
    ],
    'subject' => 'Test message',
    'text' => 'Hello from PHP!',
    'html' => '<p>Hello from <strong>PHP</strong>!</p>',
]);

echo "Message sent! Message ID: " . $submit_response['messageId'] . "\n";
```

### Message Options

**Required Fields**:
- `from`: Sender address (object with `name` and `address`)
- `to`: Array of recipient addresses

**Optional Fields**:
- `cc`: Carbon copy recipients (array)
- `bcc`: Blind carbon copy recipients (array)
- `subject`: Email subject line
- `text`: Plain text content
- `html`: HTML content
- `attachments`: Array of attachment objects
- `headers`: Custom email headers

### Sending with Attachments

```php
<?php

$submit_response = $ee->request('post', '/v1/account/example/submit', [
    'from' => [
        'name' => 'John Doe',
        'address' => 'john@example.com',
    ],
    'to' => [
        [
            'address' => 'jane@example.com',
        ],
    ],
    'subject' => 'Invoice Attached',
    'text' => 'Please find the invoice attached.',
    'attachments' => [
        [
            'filename' => 'invoice.pdf',
            'content' => base64_encode(file_get_contents('/path/to/invoice.pdf')),
            'encoding' => 'base64',
        ],
    ],
]);
```

## Common Operations

### Listing Messages

(See: [List Messages API](/docs/api/get-v-1-account-account-messages))

```php
<?php

// Get messages from inbox
$messages = $ee->request('get', '/v1/account/example/messages', [
    'path' => 'INBOX',
]);

foreach ($messages['messages'] as $message) {
    echo "From: " . $message['from']['address'] . "\n";
    echo "Subject: " . $message['subject'] . "\n";
    echo "---\n";
}
```

### Getting Message Details

(See: [Get Message API](/docs/api/get-v-1-account-account-message-message))

By default, message text content is not included in the response. Use the `textType` query parameter to retrieve text content:

```php
<?php

// Use textType=* to include both plain text and HTML content
$message = $ee->request('get', '/v1/account/example/message/' . $messageId . '?textType=*');

echo "Subject: " . $message['subject'] . "\n";
echo "Text: " . ($message['text']['plain'] ?? '') . "\n";

// Attachments contain metadata, not content by default
// Use the attachment download endpoint to get attachment content
foreach ($message['attachments'] as $attachment) {
    echo "Attachment: " . $attachment['filename'] . "\n";
}
```

### Searching Messages

The search endpoint uses POST method with the search criteria in the request body:

```php
<?php

$results = $ee->request('post', '/v1/account/example/search?path=INBOX', [
    'search' => [
        'from' => 'jane@example.com',
    ],
]);

echo "Found " . count($results['messages']) . " messages\n";
```

### Updating Account Settings

```php
<?php

$ee->request('put', '/v1/account/example', [
    'name' => 'John Doe Updated',
    'smtp' => [
        'host' => 'new-smtp.example.com',
    ],
]);
```

### Deleting an Account

```php
<?php

$ee->request('delete', '/v1/account/example');
echo "Account deleted\n";
```

## Error Handling

Always wrap API calls in try-catch blocks:

```php
<?php

try {
    $account_response = $ee->request('post', '/v1/account', [
        'account' => 'example',
        // ... configuration
    ]);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";

    // Handle specific error cases
    if (strpos($e->getMessage(), 'Account already exists') !== false) {
        echo "This account is already registered\n";
    }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid access token` | Wrong or expired token | Generate new token in EmailEngine |
| `Account already exists` | Account ID already in use | Use different account ID or delete existing |
| `Authentication failed` | Wrong credentials | Verify email credentials |
| `Connection failed` | Cannot reach email server | Check server hostname and port |

## Processing Webhooks

Create a webhook handler to receive email notifications:

```php
<?php

// webhook.php

require 'vendor/autoload.php';

// Read webhook payload
$payload = json_decode(file_get_contents('php://input'), true);

// Verify it's from EmailEngine (optional but recommended)
// Implement signature verification here

// Process different event types
switch ($payload['event']) {
    case 'messageNew':
        handleNewMessage($payload);
        break;
    case 'messageBounce':
        handleBounce($payload);
        break;
    default:
        error_log("Unknown event: " . $payload['event']);
}

// Always return 2xx status quickly
http_response_code(200);

function handleNewMessage($payload) {
    $account = $payload['account'];
    $from = $payload['data']['from']['address'];
    $subject = $payload['data']['subject'];

    // Process the new email
    error_log("New email from $from: $subject");

    // Store in database, trigger workflows, etc.
}

function handleBounce($payload) {
    $recipient = $payload['data']['recipient'];
    error_log("Email to $recipient bounced");

    // Handle bounce (update database, notify sender, etc.)
}
```

### Webhook Configuration

Configure webhook URL in EmailEngine via the Settings API:

```php
<?php

// Configure webhook URL via Settings API
$ee->request('post', '/v1/settings', [
    'webhooks' => 'https://yourdomain.com/webhook.php',
    'webhookEvents' => ['messageNew', 'messageBounce'],
    'webhooksEnabled' => true,
]);
```

## Complete Example Application

Here's a complete example of a simple email automation:

```php
<?php

require 'vendor/autoload.php';

use EmailEnginePhp\EmailEngine;

class EmailAutomation
{
    private $ee;

    public function __construct($token, $baseUrl)
    {
        $this->ee = new EmailEngine([
            'access_token' => $token,
            'ee_base_url' => $baseUrl,
        ]);
    }

    public function registerAccount($accountId, $email, $password, $imapHost, $smtpHost)
    {
        try {
            $response = $this->ee->request('post', '/v1/account', [
                'account' => $accountId,
                'name' => $email,
                'email' => $email,
                'imap' => [
                    'auth' => ['user' => $email, 'pass' => $password],
                    'host' => $imapHost,
                    'port' => 993,
                    'secure' => true,
                ],
                'smtp' => [
                    'auth' => ['user' => $email, 'pass' => $password],
                    'host' => $smtpHost,
                    'port' => 465,
                    'secure' => true,
                ],
            ]);

            return $this->waitForConnection($accountId);
        } catch (Exception $e) {
            error_log("Failed to register account: " . $e->getMessage());
            return false;
        }
    }

    private function waitForConnection($accountId, $maxWait = 60)
    {
        $startTime = time();

        while (time() - $startTime < $maxWait) {
            $info = $this->ee->request('get', "/v1/account/$accountId");

            if ($info['state'] === 'connected') {
                return true;
            }

            if (in_array($info['state'], ['authenticationError', 'connectError'])) {
                error_log("Account connection failed: " . $info['state']);
                return false;
            }

            sleep(2);
        }

        error_log("Account connection timeout");
        return false;
    }

    public function sendEmail($accountId, $to, $subject, $body)
    {
        try {
            $response = $this->ee->request('post', "/v1/account/$accountId/submit", [
                'to' => [['address' => $to]],
                'subject' => $subject,
                'html' => $body,
            ]);

            return $response['messageId'];
        } catch (Exception $e) {
            error_log("Failed to send email: " . $e->getMessage());
            return false;
        }
    }

    public function getUnreadMessages($accountId)
    {
        try {
            // Use POST search endpoint to filter by unseen messages
            $response = $this->ee->request('post', "/v1/account/$accountId/search?path=INBOX", [
                'search' => [
                    'unseen' => true,
                ],
            ]);

            return $response['messages'];
        } catch (Exception $e) {
            error_log("Failed to get messages: " . $e->getMessage());
            return [];
        }
    }
}

// Usage
$automation = new EmailAutomation(
    'your-api-token',
    'http://127.0.0.1:3000/'
);

// Register account
if ($automation->registerAccount(
    'my-account',
    'user@example.com',
    'password',
    'imap.example.com',
    'smtp.example.com'
)) {
    echo "Account registered successfully\n";

    // Send email
    $messageId = $automation->sendEmail(
        'my-account',
        'recipient@example.com',
        'Hello from PHP',
        '<p>This is a test email</p>'
    );

    if ($messageId) {
        echo "Email sent: $messageId\n";
    }

    // Check unread messages
    $messages = $automation->getUnreadMessages('my-account');
    echo "Unread messages: " . count($messages) . "\n";
}
```


