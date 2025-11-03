---
title: Hosted Authentication
sidebar_position: 7
description: Use EmailEngine's hosted authentication forms to let users connect their email accounts via OAuth2
---

<!--
Sources merged:
- docs/accounts/managing-accounts.md (hosted authentication form section)
- docs/accounts/gmail-imap.md (authentication examples)
- docs/accounts/outlook-365.md (authentication examples)
- Common patterns across account setup guides
-->

# Hosted Authentication

EmailEngine's hosted authentication feature provides a user-friendly web interface for connecting email accounts via OAuth2. Instead of manually handling OAuth2 flows in your application, you can redirect users to EmailEngine's authentication forms where they complete the setup process.

## Overview

### What is Hosted Authentication?

Hosted authentication is EmailEngine's built-in web interface for account setup. It provides:

**Pre-built OAuth2 flows:**
- Sign in with Google button
- Sign in with Microsoft button
- Automatic OAuth2 token management
- User-friendly consent screens

**Automatic account registration:**
- Creates account in EmailEngine
- Stores OAuth2 tokens securely
- Connects to IMAP/SMTP or API
- Returns user to your application

**No OAuth2 code required:**
- EmailEngine handles all OAuth2 complexity
- Your app just generates a form URL
- User completes authentication
- EmailEngine redirects back with results

### When to Use Hosted Authentication

**Good use cases:**

- **Quick integration** - Get OAuth2 working in minutes
- **Standard flows** - Gmail and Outlook OAuth2
- **User-facing setup** - Let users connect their own accounts
- **No OAuth2 expertise** - Don't want to build OAuth2 flows

**Not suitable for:**

- **Backend automation** - Use direct API registration with tokens
- **Custom OAuth2 flows** - Use authentication server instead
- **Headless systems** - No user interaction available

:::tip Alternative Approaches
- For custom OAuth2 management: [Authentication Server](/docs/accounts/authentication-server)
- For direct API registration: [Managing Accounts](/docs/accounts/managing-accounts)
- For OAuth2 setup details: [OAuth2 Setup Guide](/docs/accounts/oauth2-setup)
:::

## How It Works

### Authentication Flow

```mermaid
flowchart TD
    A[Your app generates authentication URL] --> B[User redirects to EmailEngine form]
    B --> C[User clicks 'Sign in with Google/Microsoft']
    C --> D[Provider OAuth2 consent screen]
    D --> E[User grants permissions]
    E --> F[EmailEngine receives tokens]
    F --> G[EmailEngine creates account]
    G --> H[User redirects back to your app]
```

### Step-by-Step Process

1. **Your application** calls EmailEngine API to generate form URL
2. **EmailEngine** returns unique authentication URL
3. **Your application** redirects user to this URL
4. **User** sees EmailEngine's authentication form
5. **User** clicks provider button (Google/Microsoft)
6. **Provider** shows consent screen
7. **User** grants permissions
8. **EmailEngine** receives OAuth2 tokens
9. **EmailEngine** creates and connects account
10. **EmailEngine** redirects user back to your application

## Generating Authentication Forms

### Basic Form Generation

Generate a form URL for a user:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_EMAILENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "john@gmail.com",
    "name": "John Doe",
    "redirectUrl": "https://myapp.com/settings"
  }'
```

**Response:**

```json
{
  "url": "https://your-ee.com/accounts/new?data=eyJhY2NvdW50IjoidXNlcjEyMyIsImVtYWlsIjoiam9obkBnbWFpbC5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJyZWRpcmVjdFVybCI6Imh0dHBzOi8vbXlhcHAuY29tL3NldHRpbmdzIn0"
}
```

Direct the user to this URL to begin authentication.

### Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `account` | Yes | Unique account identifier (your internal ID) |
| `email` | No | Pre-fill email address on form |
| `name` | No | Pre-fill display name on form |
| `redirectUrl` | Yes | Where to send user after completion |

### Implementation Example

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="programming-language">
<TabItem value="nodejs" label="Node.js">

```javascript
const axios = require('axios');

async function generateAuthUrl(userId, userEmail, userName) {
  const response = await axios.post(
    'https://your-ee.com/v1/authentication/form',
    {
      account: userId,
      email: userEmail,
      name: userName,
      redirectUrl: 'https://myapp.com/settings'
    },
    {
      headers: {
        'Authorization': 'Bearer YOUR_EMAILENGINE_TOKEN',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.url;
}

// Usage in Express route
app.get('/connect-email', async (req, res) => {
  const authUrl = await generateAuthUrl(
    req.user.id,
    req.user.email,
    req.user.name
  );

  res.redirect(authUrl);
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
import requests

def generate_auth_url(user_id, user_email, user_name):
    response = requests.post(
        'https://your-ee.com/v1/authentication/form',
        json={
            'account': user_id,
            'email': user_email,
            'name': user_name,
            'redirectUrl': 'https://myapp.com/settings'
        },
        headers={
            'Authorization': 'Bearer YOUR_EMAILENGINE_TOKEN',
            'Content-Type': 'application/json'
        }
    )

    return response.json()['url']

# Usage in Flask route
@app.route('/connect-email')
def connect_email():
    auth_url = generate_auth_url(
        current_user.id,
        current_user.email,
        current_user.name
    )

    return redirect(auth_url)
```

</TabItem>
<TabItem value="php" label="PHP">

```php
<?php

function generateAuthUrl($userId, $userEmail, $userName) {
    $data = [
        'account' => $userId,
        'email' => $userEmail,
        'name' => $userName,
        'redirectUrl' => 'https://myapp.com/settings'
    ];

    $ch = curl_init('https://your-ee.com/v1/authentication/form');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer YOUR_EMAILENGINE_TOKEN',
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    return $result['url'];
}

// Usage
$authUrl = generateAuthUrl($userId, $userEmail, $userName);
header("Location: $authUrl");
exit;
```

</TabItem>
</Tabs>

## Handling Redirects

### Success Redirect

After successful authentication, EmailEngine redirects to your `redirectUrl` with query parameters:

```
https://myapp.com/settings?account=user123&state=connected
```

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `account` | The account ID you provided |
| `state` | Account state: `connected`, `connecting`, or `authenticationError` |

### Handling the Redirect

<Tabs groupId="programming-language">
<TabItem value="nodejs" label="Node.js">

```javascript
app.get('/settings', async (req, res) => {
  const { account, state } = req.query;

  if (state === 'connected') {
    // Account successfully connected
    await db.users.update(
      { id: account },
      { emailConnected: true }
    );

    res.render('settings', {
      message: 'Email account connected successfully!'
    });
  } else if (state === 'authenticationError') {
    // Authentication failed
    res.render('settings', {
      error: 'Failed to connect email account. Please try again.'
    });
  } else {
    // Still connecting
    res.render('settings', {
      message: 'Connecting to your email account...'
    });
  }
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
@app.route('/settings')
def settings():
    account = request.args.get('account')
    state = request.args.get('state')

    if state == 'connected':
        # Account successfully connected
        db.users.update(
            {'id': account},
            {'email_connected': True}
        )
        flash('Email account connected successfully!', 'success')
    elif state == 'authenticationError':
        # Authentication failed
        flash('Failed to connect email account. Please try again.', 'error')
    else:
        # Still connecting
        flash('Connecting to your email account...', 'info')

    return render_template('settings.html')
```

</TabItem>
<TabItem value="php" label="PHP">

```php
<?php
// settings.php

$account = $_GET['account'] ?? null;
$state = $_GET['state'] ?? null;

if ($state === 'connected') {
    // Account successfully connected
    $stmt = $pdo->prepare('UPDATE users SET email_connected = 1 WHERE id = ?');
    $stmt->execute([$account]);

    $message = 'Email account connected successfully!';
    $messageType = 'success';
} elseif ($state === 'authenticationError') {
    // Authentication failed
    $message = 'Failed to connect email account. Please try again.';
    $messageType = 'error';
} else {
    // Still connecting
    $message = 'Connecting to your email account...';
    $messageType = 'info';
}
```

</TabItem>
</Tabs>

### Error Handling

**Connection failures:**
- Network issues
- OAuth2 errors
- User cancellation

**Best practices:**
- Show clear error messages
- Provide retry option
- Log errors for debugging
- Offer support contact

## Pre-filling Information

### Email Address

Pre-fill the email address to streamline the process:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "john@gmail.com",  # Pre-filled
    "redirectUrl": "https://myapp.com/settings"
  }'
```

The authentication form will show this email address, and for Gmail/Outlook, it will be used as the `login_hint` parameter in the OAuth2 flow.

### Display Name

Pre-fill the account name:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "john@gmail.com",
    "name": "John Doe",  # Pre-filled
    "redirectUrl": "https://myapp.com/settings"
  }'
```

This name will be displayed in EmailEngine's account list.

## Advanced Features

### Delegated Access (Shared Mailboxes)

For Microsoft 365 shared mailboxes, include the `delegated` flag:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "shared-support",
    "email": "support@company.com",
    "delegated": true,  # Important for shared mailboxes
    "redirectUrl": "https://myapp.com/settings"
  }'
```

User will authenticate with their personal account but access the shared mailbox.

[Learn more about shared mailboxes →](/docs/accounts/outlook-365#shared-mailboxes)

### Specific Provider

Force a specific OAuth2 provider:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "john@gmail.com",
    "provider": "gmail",  # Force Gmail OAuth2
    "redirectUrl": "https://myapp.com/settings"
  }'
```

Available providers:
- `gmail` - Gmail IMAP/SMTP with OAuth2
- `gmailApi` - Gmail API
- `outlook` - Outlook IMAP/SMTP or MS Graph API

### Custom Redirect Path

Redirect to different paths based on success/failure:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "email": "john@gmail.com",
    "redirectUrl": "https://myapp.com/settings/email",
    "successUrl": "https://myapp.com/welcome",  # Optional
    "errorUrl": "https://myapp.com/error"  # Optional
  }'
```

## User Experience

### What Users See

1. **Authentication Form**
   - EmailEngine branding
   - Sign in with Google button
   - Sign in with Microsoft button
   - Manual IMAP/SMTP option (if enabled)

2. **Provider Consent Screen**
   - Provider's OAuth2 consent page
   - Requested permissions
   - Allow/Deny buttons

3. **Success/Error Message**
   - Connection status
   - Redirect countdown
   - Or immediate redirect

### Customization Options

**EmailEngine settings:**
- Enable/disable manual IMAP configuration
- Configure available OAuth2 providers
- Customize redirect messages
- Set session timeouts

**OAuth2 app settings:**
- App name (shown in consent screen)
- App logo (Google/Microsoft)
- Privacy policy link
- Terms of service link

