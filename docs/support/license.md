---
title: License Information
description: License information, plans, and how to get a production license key
sidebar_position: 1
---

# EmailEngine Licensing

Complete information about EmailEngine licenses, pricing, activation, and management.

:::info Quick Summary
- **Development:** Free with limited features
- **Production:** Paid yearly license with full features
- **Pricing:** $995/year flat rate for unlimited mailboxes
:::

## License Types

### Development License (Free)

**Features:**
- YES: Full API access
- YES: All email protocols (IMAP, SMTP, Gmail API, etc.)
- YES: OAuth2 authentication
- YES: Webhooks
- YES: Basic monitoring
- NO: Limited to 10 accounts
- NO: Development use only
- NO: No commercial use
- NO: Limited support

**How to use:**
```bash
# Simply start EmailEngine without license key
emailengine

# Or explicitly
EENGINE_LICENSE_KEY="" emailengine
```

**Web interface shows:**
```
Status: Development Mode
Accounts: 7/10 (limit reached at 10)
```

**Best for:**
- Testing EmailEngine
- Development and prototyping
- Proof of concept
- Learning the API

:::warning Development Only
Development license is for testing only. Commercial use requires production license.
:::

---

### Production License (Paid)

**Features:**
- YES: **Unlimited accounts**
- YES: **Unlimited instances**
- YES: **Unlimited API calls**
- YES: All development features
- YES: Priority support
- YES: Commercial use allowed
- YES: Updates included
- YES: Source code access

**Pricing:**
- **$995 USD per year**
- Flat rate (not per-mailbox)
- Volume discounts available for multiple licenses
- Payment via credit card or invoice

**How to purchase:**
1. Visit [EmailEngine Plans](https://postalsys.com/plans)
2. Select EmailEngine license
3. Complete purchase
4. Receive license key via email

**Best for:**
- Production deployments
- More than 10 accounts
- Commercial applications
- Professional support needed

## Pricing Details

### Standard Pricing

| Item | Price | Notes |
|------|-------|-------|
| **Single License** | $995/year | Unlimited mailboxes, instances |
| **Support** | Included | Community + email support |
| **Updates** | Included | All updates during license period |
| **Renewal** | $995/year | Same price (no increase) |

### Volume Discounts

For multiple licenses (e.g., multiple projects):

| Licenses | Discount | Price per License |
|----------|----------|-------------------|
| 1 | 0% | $995 |
| 2-4 | 10% | $895 |
| 5-9 | 15% | $846 |
| 10+ | 20% | $796 |

**Contact sales for volume pricing:** sales@emailengine.app

---

### Cost Comparison

**Cost per mailbox:**

```
For 100 mailboxes:  $995/year ÷ 100 = $9.95/mailbox/year ($0.83/month)
For 500 mailboxes:  $995/year ÷ 500 = $1.99/mailbox/year ($0.17/month)
For 2,000 mailboxes: $995/year ÷ 2,000 = $0.50/mailbox/year ($0.04/month)
```

**The more mailboxes, the lower the per-mailbox cost.**

**Total cost of ownership:**

```
EmailEngine License:    $995/year
+ Server costs:         $50-500/month
+ Redis costs:          $10-200/month
───────────────────────────────────
Total:                  ~$1,500-10,000/year

Compare to per-mailbox services:
100 mailboxes at $3/mailbox/month = $3,600/year
500 mailboxes at $2/mailbox/month = $12,000/year
2,000 mailboxes at $1/mailbox/month = $24,000/year
```

## Getting a License

### Step 1: Purchase

**Option A: Online Purchase**

1. Visit [EmailEngine Plans](https://postalsys.com/plans)
2. Click "Get EmailEngine License"
3. Select payment method (card/PayPal)
4. Complete purchase
5. Receive license key via email (usually within minutes)

**Option B: Invoice Purchase**

For invoice payment (NET30):

1. Email: sales@emailengine.app
2. Provide:
   - Company name
   - Billing address
   - Number of licenses needed
3. Receive invoice
4. Pay via bank transfer
5. Receive license key after payment clears

**Option C: Purchase Order**

For companies requiring PO:

1. Email sales@emailengine.app
2. Request quote
3. Submit PO
4. Receive invoice
5. License key sent after PO processing

### Step 2: License Key Format

Your license key will look like:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsaWNlbnNlS2V5IjoiZXhhbXBsZS1rZXkiLCJsaWNlbnNlZCI6IkV4YW1wbGUgQ29ycCIsImV4cGlyZXMiOiIyMDI2LTEyLTMxVDIzOjU5OjU5LjAwMFoifQ.signature
```

**What's in a license key:**
- Licensee name (your company)
- Expiration date
- License ID
- Digital signature

**License keys are JWT tokens** that can be decoded (but not modified without invalidating signature):

```bash
# Decode license (first part after splitting by '.')
echo "eyJhbGc..." | base64 -d | jq
```

### Step 3: Activate License

There are three ways to activate your license:

**Option 1: Environment Variable (Recommended)**

```bash
export EENGINE_LICENSE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Start EmailEngine
emailengine
```

**For SystemD service:**

Edit `/etc/emailengine/environment`:
```bash
EENGINE_LICENSE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For Docker:**

```bash
docker run -d \
  --env EENGINE_LICENSE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  postalsys/emailengine:v2
```

**For Docker Compose:**

```yaml
services:
  emailengine:
    environment:
      - EENGINE_LICENSE_KEY=${EENGINE_LICENSE_KEY}
```

---

**Option 2: Command Line**

```bash
emailengine --licenseKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

**Option 3: Configuration File**

Edit `/etc/emailengine/config.json`:

```json
{
  "licenseKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Or reference from environment:

```json
{
  "licenseKey": "${EENGINE_LICENSE_KEY}"
}
```

---

**Option 4: Web Interface**

1. Start EmailEngine (without license)
2. Access web interface: `http://localhost:3000`
3. Go to **Settings** → **License**
4. Paste license key
5. Click **Save**

### Step 4: Verify Activation

**Check via web interface:**
- Status should show: "Licensed to: Your Company Name"
- Account limit removed
- Expiration date displayed

**Check via API:**

```bash
curl http://localhost:3000/v1/license \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response:**
```json
{
  "active": true,
  "type": "EmailEngine License",
  "details": {
    "licensedTo": "Your Company Name",
    "expires": "2026-12-31T23:59:59.000Z"
  },
  "status": "Valid license"
}
```

**Check via logs:**

```bash
journalctl -u emailengine | grep -i license

# Should see:
# [INFO] License validated: Your Company Name (expires 2026-12-31)
```

## License Management

### Checking License Status

**Via web interface:**
- Dashboard shows license status
- Settings → License page shows details

**Via API:**

```bash
# Get license info
GET /v1/license
```

**Via health endpoint:**

```bash
curl http://localhost:3000/health

{
  "status": "ok",
  "version": "2.48.5",
  "license": {
    "active": true,
    "expires": "2026-12-31"
  }
}
```

### Updating License Key

When renewing or changing license:

**Method 1: Environment variable**

```bash
# Update environment
export EENGINE_LICENSE_KEY="new-license-key"

# Restart service
sudo systemctl restart emailengine
```

**Method 2: API**

```bash
POST /v1/license
Content-Type: application/json

{
  "licenseKey": "new-license-key"
}
```

**No downtime required** - EmailEngine validates new license and continues running.

### Multiple Instances

**One license covers unlimited instances:**

```bash
# Instance 1
EENGINE_LICENSE_KEY="same-key" emailengine --port=3000

# Instance 2
EENGINE_LICENSE_KEY="same-key" emailengine --port=3001

# Instance 3
EENGINE_LICENSE_KEY="same-key" emailengine --port=3002

# All use same license key
```

**Load-balanced setup:**

```yaml
# Docker Compose with 3 instances
services:
  emailengine-1:
    image: postalsys/emailengine:v2
    environment:
      - EENGINE_LICENSE_KEY=${LICENSE_KEY}
  emailengine-2:
    image: postalsys/emailengine:v2
    environment:
      - EENGINE_LICENSE_KEY=${LICENSE_KEY}
  emailengine-3:
    image: postalsys/emailengine:v2
    environment:
      - EENGINE_LICENSE_KEY=${LICENSE_KEY}
```

**All instances share same license.**

## License Expiration

### What Happens at Expiration

**30 days before expiration:**
- Warning appears in web interface
- Email notification sent (if configured)
- API returns expiration warning in responses

**7 days before expiration:**
- More frequent warnings
- Daily email reminders

**On expiration day:**
- EmailEngine continues to function
- No accounts deleted
- All features remain active
- **Grace period:** 30 days to renew

**After grace period (30 days expired):**
- EmailEngine reverts to development mode
- Account limit enforced (10 accounts)
- Existing accounts over limit remain but read-only
- New account registration blocked

**Accounts are never deleted**, even in development mode.

### Renewal Process

**60 days before expiration:**
- Renewal notice sent to licensee email
- Renewal link provided

**Renewal steps:**

1. **Receive renewal notice** via email
2. **Click renewal link** or visit [renewal page](https://postalsys.com/renew)
3. **Complete payment** (same price: $995/year)
4. **Receive new license key** via email
5. **Update license key** in EmailEngine

**Early renewal:**
- Can renew any time
- New expiration = current expiration + 1 year
- No time lost by renewing early

**Example:**
```
Current expiration: 2025-12-31
Renew on: 2025-10-01
New expiration: 2026-12-31 (not 2026-10-01)
```

### Lapsed License Recovery

If license expires and grace period passes:

1. **Purchase new license** (same process as initial)
2. **Activate new license key**
3. **All accounts automatically re-enabled**
4. **No data loss** - everything preserved

## License FAQ

### General Questions

**Q: Can I use one license for multiple projects?**

A: Yes! One license covers unlimited instances. Use for as many projects as needed.

**Q: Can I transfer my license to someone else?**

A: Yes. Email support@emailengine.app with:
- Current license key
- New owner information
- Reason for transfer

Transfer fee may apply.

**Q: What if I need a refund?**

A: **30-day money-back guarantee.** Not satisfied? Full refund within 30 days of purchase.

Email: support@emailengine.app

**Q: Do you offer monthly payment?**

A: Currently annual only. Monthly subscriptions may be available in future.

---

### Technical Questions

**Q: Is license key validated online?**

A: **No.** License validation is local (JWT signature verification). No "phone home" required. Works offline.

**Q: What if my server has no internet access?**

A: License works fine offline. JWT validation is cryptographic, not server-based.

**Q: Can I inspect my license key?**

A: Yes, it's a JWT token. Decode using:

```bash
# Extract payload
echo "eyJhbGc..." | base64 -d | jq
```

**Q: Is the license key secret?**

A: It's not a password, but treat it as confidential. Anyone with your license key could use it.

If leaked, email support@emailengine.app for replacement.

---

### Compliance Questions

**Q: Do I need a license for staging/testing?**

A: **No.** Use development mode (no license) for staging/testing. Production license only for production.

**Q: Do I need separate licenses for dev/staging/production?**

A: **No.** One license covers all environments. Or use development mode (free) for non-production.

**Q: Can I use EmailEngine for open-source projects?**

A: Yes, if self-hosted. Development mode (free) sufficient if under 10 accounts.

**Q: Can I resell EmailEngine as part of my SaaS?**

A: Yes, with production license. Your customers don't need individual licenses.

Example: You build CRM with email. You need one license (for your backend). Your 1,000 customers don't need licenses.

---

### Business Questions

**Q: Do you offer discounts for startups/nonprofits?**

A: Case-by-case basis. Email sales@emailengine.app with:
- Organization details
- Use case
- Budget constraints

**Q: Can I get invoice/PO payment?**

A: Yes, for companies. Email sales@emailengine.app

**Q: Do you offer educational licenses?**

A: Reduced pricing available for educational institutions. Email sales@emailengine.app

**Q: What currency is pricing in?**

A: USD. Credit card payments auto-convert from your currency.

## Support Included

### License Includes

**Community support:**
- GitHub discussions
- Community forum
- Documentation

**Email support:**
- support@emailengine.app
- Response time: Usually within 24 hours
- Bug reports prioritized

**Updates:**
- All updates during license period
- Security patches
- Bug fixes
- New features

### Not Included

- Custom development
- On-site training
- Consulting services
- Architecture review
- White-glove support

For enterprise support, contact sales@emailengine.app

## Security Best Practices

### Protecting Your License Key

**Do:**
- YES: Store in environment variables
- YES: Use secret management service (Vault, AWS Secrets Manager)
- YES: Restrict file permissions (600)
- YES: Rotate if exposed
- YES: Use different keys for different deployments (if multiple licenses)

**Don't:**
- NO: Commit to version control
- NO: Include in Docker images
- NO: Share publicly
- NO: Email unencrypted
- NO: Store in code

**Example secure setup:**

```bash
# Secure environment file
sudo nano /etc/emailengine/environment

# Content:
EENGINE_LICENSE_KEY=your-key-here

# Set permissions
sudo chown root:emailengine /etc/emailengine/environment
sudo chmod 640 /etc/emailengine/environment

# Only root and emailengine user can read
```

### License Key Rotation

If license key exposed:

1. **Email support immediately:** support@emailengine.app
2. **Request new license key**
3. **Update all instances**
4. **Old key will be invalidated**

No charge for key rotation due to security incident.

## Contact

### Sales Inquiries
- **Email:** sales@emailengine.app
- **Topics:** Pricing, volume discounts, enterprise, quotes

### License Support
- **Email:** support@emailengine.app
- **Topics:** Activation, renewal, technical issues

### General Information
- **Website:** [https://emailengine.app](https://emailengine.app)
- **Pricing:** [https://postalsys.com/plans](https://postalsys.com/plans)
