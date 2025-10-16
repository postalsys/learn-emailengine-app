---
title: SMTP Gateway
sidebar_position: 8
description: Using EmailEngine's SMTP gateway for sending emails with standard SMTP clients
---

# SMTP Gateway

EmailEngine provides an SMTP gateway feature that allows you to send emails using standard SMTP protocol instead of the REST API. This is useful for legacy applications or when you need to integrate with tools that only support SMTP.

## Why Use the SMTP Gateway

The SMTP gateway is beneficial when:

- **Legacy applications**: Integration with older systems that only support SMTP
- **Email clients**: Using desktop or mobile email clients
- **Third-party tools**: Tools that require SMTP configuration
- **Standard libraries**: Using standard SMTP libraries in your code
- **Drop-in replacement**: Replacing an existing SMTP server without code changes

## How It Works

When the SMTP gateway is enabled:

1. EmailEngine listens on an SMTP port (default: 2525)
2. Clients connect using SMTP protocol
3. Authentication determines which account to use
4. EmailEngine routes the message to the appropriate account's SMTP server
5. Messages are queued just like with the Submit API
6. Delivery status tracked via webhooks

## Enabling the SMTP Gateway

### Via Environment Variables

```bash
# Enable SMTP gateway
EENGINE_SMTP_GATEWAY_ENABLED=true
EENGINE_SMTP_GATEWAY_PORT=2525
EENGINE_SMTP_GATEWAY_HOST=0.0.0.0

# Optional: Enable authentication
EENGINE_SMTP_GATEWAY_AUTH=true

# Optional: TLS/SSL
EENGINE_SMTP_GATEWAY_SECURE=false
```

### Via Configuration API

```bash
curl -XPUT "https://ee.example.com/v1/settings" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "smtpGateway": {
      "enabled": true,
      "port": 2525,
      "host": "0.0.0.0",
      "auth": true,
      "secure": false
    }
  }'
```

### Restart EmailEngine

After changing configuration, restart EmailEngine for changes to take effect.

## Authentication

### Using Account ID and API Token

The most secure method is using account ID as username and API token as password:

```javascript
// Example: Node.js with Nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'emailengine.example.com',
  port: 2525,
  secure: false,
  auth: {
    user: 'example',  // Account ID
    pass: 'your-api-token'  // EmailEngine API token
  }
});

await transporter.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test via SMTP Gateway',
  text: 'Hello from SMTP Gateway!'
});
```

### Using Email Address

You can also use the email address as username:

```python
# Example: Python smtplib
import smtplib
from email.mime.text import MIMEText

msg = MIMEText('Hello from SMTP Gateway!')
msg['Subject'] = 'Test via SMTP Gateway'
msg['From'] = 'sender@example.com'
msg['To'] = 'recipient@example.com'

server = smtplib.SMTP('emailengine.example.com', 2525)
server.login('sender@example.com', 'your-api-token')
server.send_message(msg)
server.quit()
```

## Configuration Examples

### Desktop Email Clients

#### Thunderbird

1. Go to **Account Settings → Outgoing Server (SMTP)**
2. Click **Add**
3. Configure:
   - **Server Name**: emailengine.example.com
   - **Port**: 2525
   - **Connection security**: None (or STARTTLS if configured)
   - **Authentication method**: Normal password
   - **Username**: Account ID or email address
   - **Password**: API token

#### Apple Mail

1. Go to **Mail → Preferences → Accounts**
2. Select your account
3. Go to **Server Settings**
4. Configure **Outgoing Mail Server**:
   - **Host Name**: emailengine.example.com
   - **Port**: 2525
   - **User Name**: Account ID or email address
   - **Password**: API token

### Programming Languages

#### Node.js (Nodemailer)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'emailengine.example.com',
  port: 2525,
  secure: false,
  auth: {
    user: 'example-account',
    pass: process.env.EMAILENGINE_TOKEN
  }
});

async function sendEmail() {
  const info = await transporter.sendMail({
    from: '"Sender Name" <sender@example.com>',
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'Plain text content',
    html: '<p>HTML content</p>',
    attachments: [
      {
        filename: 'document.pdf',
        path: './files/document.pdf'
      }
    ]
  });

  console.log('Message ID:', info.messageId);
}

sendEmail().catch(console.error);
```

#### Python (smtplib)

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

def send_email():
    # Create message
    msg = MIMEMultipart()
    msg['From'] = 'sender@example.com'
    msg['To'] = 'recipient@example.com'
    msg['Subject'] = 'Test Email'

    # Add body
    body = 'This is the email body'
    msg.attach(MIMEText(body, 'plain'))

    # Add attachment
    filename = 'document.pdf'
    with open(filename, 'rb') as attachment:
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment.read())

    encoders.encode_base64(part)
    part.add_header(
        'Content-Disposition',
        f'attachment; filename= {filename}'
    )
    msg.attach(part)

    # Send email
    server = smtplib.SMTP('emailengine.example.com', 2525)
    server.login('example-account', os.environ['EMAILENGINE_TOKEN'])
    server.send_message(msg)
    server.quit()

send_email()
```

#### PHP (PHPMailer)

```php
<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'emailengine.example.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'example-account';
    $mail->Password   = getenv('EMAILENGINE_TOKEN');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 2525;

    // Recipients
    $mail->setFrom('sender@example.com', 'Sender Name');
    $mail->addAddress('recipient@example.com', 'Recipient Name');

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Test Email';
    $mail->Body    = '<p>HTML content</p>';
    $mail->AltBody = 'Plain text content';

    // Attachments
    $mail->addAttachment('/path/to/document.pdf');

    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Error: {$mail->ErrorInfo}";
}
?>
```

#### Ruby (Mail gem)

```ruby
require 'mail'

Mail.defaults do
  delivery_method :smtp, {
    address: 'emailengine.example.com',
    port: 2525,
    user_name: 'example-account',
    password: ENV['EMAILENGINE_TOKEN'],
    authentication: 'plain',
    enable_starttls_auto: false
  }
end

mail = Mail.new do
  from     'sender@example.com'
  to       'recipient@example.com'
  subject  'Test Email'
  body     'Plain text content'

  add_file '/path/to/document.pdf'
end

mail.deliver!
```

## TLS/SSL Support

### STARTTLS

Enable STARTTLS for encrypted connections:

```bash
EENGINE_SMTP_GATEWAY_SECURE=false
EENGINE_SMTP_GATEWAY_STARTTLS=true
```

Clients can upgrade to TLS using STARTTLS command.

### SSL/TLS (Implicit)

Use a different port for implicit SSL:

```bash
EENGINE_SMTP_GATEWAY_SECURE=true
EENGINE_SMTP_GATEWAY_PORT=465
```

Clients must connect with SSL from the start.

### Certificate Configuration

Provide custom TLS certificate:

```bash
EENGINE_SMTP_GATEWAY_TLS_KEY=/path/to/private.key
EENGINE_SMTP_GATEWAY_TLS_CERT=/path/to/certificate.crt
```

## Features and Limitations

### Supported Features

- [YES] Standard SMTP protocol
- [YES] Authentication (PLAIN, LOGIN)
- [YES] TLS/STARTTLS encryption
- [YES] Multiple recipients (TO, CC, BCC)
- [YES] Attachments
- [YES] Custom headers
- [YES] HTML and plain text
- [YES] Automatic queuing and retries
- [YES] Webhook notifications

### Limitations

- [NO] Cannot specify custom `sendAt` (scheduled sending)
- [NO] Cannot use mail merge via SMTP
- [NO] Cannot reference templates by ID
- [NO] Cannot use reply/forward reference mode
- [NO] Limited access to EmailEngine-specific features

For advanced features, use the [REST API](./basic-sending.md) instead.

## Monitoring and Webhooks

Messages sent via SMTP gateway are treated the same as messages sent via REST API:

- Queued in the outbox queue
- Automatic retry logic
- Webhook notifications (`messageSent`, `messageDeliveryError`, `messageFailed`)
- Visible in Arena queue UI

Query queue status:

```bash
curl "https://ee.example.com/v1/account/example/outbox" \
  -H "Authorization: Bearer <token>"
```

## Security Considerations

### Use API Tokens, Not Account Passwords

Always use EmailEngine API tokens for authentication, never the actual email account password:

```javascript
// GOOD: Using API token
auth: {
  user: 'example-account',
  pass: process.env.EMAILENGINE_API_TOKEN
}

// BAD: Using account password
auth: {
  user: 'example-account',
  pass: 'actual-email-password'  // Don't do this!
}
```

### Firewall Rules

Restrict SMTP gateway access to trusted IPs:

```bash
# Example: iptables
iptables -A INPUT -p tcp --dport 2525 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 2525 -j DROP
```

Or use a reverse proxy (nginx) with access control.

### Enable TLS

Always use TLS in production:

```bash
EENGINE_SMTP_GATEWAY_SECURE=true
# OR
EENGINE_SMTP_GATEWAY_STARTTLS=true
```

### Rate Limiting

Implement rate limiting at the network level or use EmailEngine's built-in limits.

## Troubleshooting

### Connection Refused

**Issue**: Cannot connect to SMTP gateway

**Solutions**:
- Verify SMTP gateway is enabled
- Check port is correct
- Verify firewall allows connections
- Check EmailEngine logs

```bash
# Test connection
telnet emailengine.example.com 2525
```

### Authentication Failed

**Issue**: "535 Authentication failed"

**Solutions**:
- Verify username (account ID or email)
- Verify password (API token, not account password)
- Check account exists and is active
- Check API token has correct permissions

### Messages Not Sending

**Issue**: Messages accepted but not delivered

**Solutions**:
- Check outbox queue for errors
- Verify account SMTP configuration
- Check webhook events for delivery errors
- Review failed jobs in Arena UI

### TLS Errors

**Issue**: "SSL/TLS handshake failed"

**Solutions**:
- Verify certificate is valid
- Check certificate path configuration
- Ensure client supports TLS version
- Try with STARTTLS instead of implicit SSL

## When to Use SMTP Gateway vs REST API

### Use SMTP Gateway When:

- Integrating with legacy systems
- Using desktop email clients
- Tools only support SMTP
- Minimal code changes desired
- Standard SMTP features sufficient

### Use REST API When:

- Building new applications
- Need advanced features (mail merge, templates, scheduled sending)
- Need programmatic control
- Want detailed delivery tracking
- Performance is critical (REST is faster)
