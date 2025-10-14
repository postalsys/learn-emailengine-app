---
title: Security Best Practices
description: Security best practices for production deployments including encryption and access control
sidebar_position: 6
---

# Production Security Guide

Comprehensive security practices for deploying EmailEngine in production environments.

:::warning Security First
EmailEngine handles sensitive data including email credentials, OAuth tokens, and message content. Proper security configuration is critical.
:::

## Overview

This guide covers:
- Network security and firewall configuration
- Authentication and access control
- Encryption at rest and in transit
- API security
- Redis security
- Compliance considerations
- Security monitoring

## Network Security

### Firewall Configuration

**Only expose necessary ports:**

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (for Let's Encrypt)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw deny 3000/tcp     # Block direct EmailEngine access
sudo ufw deny 6379/tcp     # Block direct Redis access
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**Block EmailEngine and Redis from external access:**

```bash
# iptables rules
sudo iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j DROP
sudo iptables -A INPUT -p tcp --dport 6379 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -j DROP
```

### VPN Access

**Use VPN for admin access:**

```bash
# WireGuard example
sudo apt install wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
PrivateKey = <server-private-key>
ListenPort = 51820

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.0.0.2/32
```

**Restrict admin interface to VPN:**

```nginx
# Nginx configuration
location /admin {
    allow 10.0.0.0/24;  # VPN network
    deny all;
    proxy_pass http://localhost:3000;
}
```

### Network Segmentation

**Isolate EmailEngine and Redis:**

```
┌─────────────────────────────────┐
│    Public Network (Internet)     │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│         DMZ Zone                 │
│  ┌────────────────────────────┐ │
│  │   Nginx Reverse Proxy      │ │
│  │   (443/tcp)                │ │
│  └─────────────┬──────────────┘ │
└────────────────┼────────────────┘
                 │
┌────────────────▼────────────────┐
│    Application Zone              │
│  ┌──────────────────────────┐  │
│  │   EmailEngine Instances  │  │
│  │   (3000/tcp - internal)  │  │
│  └─────────────┬────────────┘  │
│                │                 │
│  ┌─────────────▼────────────┐  │
│  │   Redis Database         │  │
│  │   (6379/tcp - internal)  │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

## Authentication Security

### API Token Management

**Generate strong tokens:**

```bash
# Generate secure random token
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Store tokens securely:**

```bash
# Environment variables (not in code!)
export EENGINE_SECRET=$(openssl rand -hex 32)
export EENGINE_ENCRYPTION_SECRET=$(openssl rand -hex 32)

# Or use secret management service
# AWS Secrets Manager, HashiCorp Vault, etc.
```

**Token rotation policy:**

```bash
#!/bin/bash
# rotate-tokens.sh

# Generate new token
NEW_TOKEN=$(openssl rand -hex 32)

# Update environment
echo "EENGINE_SECRET=$NEW_TOKEN" >> /etc/emailengine/environment

# Restart service
systemctl restart emailengine

# Notify applications to use new token
# (implement gradual rollover for zero downtime)
```

### Access Control

**Implement role-based access:**

```javascript
// Example: Restrict access by IP and token
const allowedIPs = [
    '203.0.113.0/24',  // Office network
    '198.51.100.42'    // VPN server
];

const allowedTokens = {
    'admin-token': ['admin'],
    'api-token': ['read', 'write'],
    'readonly-token': ['read']
};
```

**API token scopes:**

```bash
# Create tokens with specific permissions
curl -X POST https://emailengine.example.com/admin/tokens \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Production API",
    "scopes": ["accounts:read", "messages:read", "messages:send"],
    "ip_whitelist": ["203.0.113.0/24"]
  }'
```

### OAuth2 Security

**Secure OAuth2 credentials:**

```bash
# Never commit to version control
echo ".env" >> .gitignore
echo "config/secrets.json" >> .gitignore

# Store in environment or secret manager
EENGINE_GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
EENGINE_GMAIL_CLIENT_SECRET=GOCSPX-xxx

# Rotate OAuth2 secrets periodically
# Update in Google Cloud Console / Azure Portal
```

**OAuth2 redirect URI restrictions:**

```
Allowed redirect URIs:
YES: https://emailengine.example.com/oauth
YES: https://emailengine.example.com/oauth/callback

Not allowed:
NO: http://emailengine.example.com/oauth  (no HTTPS)
NO: https://*/oauth  (wildcard)
NO: http://localhost/oauth  (except for development)
```

## Encryption

### Encryption at Rest

**Enable field encryption:**

```bash
# Set encryption secret
export EENGINE_ENCRYPTION_SECRET=$(openssl rand -hex 32)
```

**Configure encryption in config.json:**

```json
{
  "encryptionSecret": "${EENGINE_ENCRYPTION_SECRET}",
  "encrypt": true,
  "encryptPassword": true,
  "encryptAccessToken": true
}
```

**Encrypted fields:**
- Account passwords
- OAuth2 access tokens
- OAuth2 refresh tokens
- SMTP credentials
- API tokens (optional)

### Encryption in Transit

**Enforce TLS/SSL everywhere:**

```nginx
# Nginx: Redirect HTTP to HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# Strong SSL configuration
server {
    listen 443 ssl http2;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
}
```

**IMAP/SMTP connection security:**

```bash
# EmailEngine automatically uses TLS for IMAP/SMTP connections
# Verify in logs:
grep "Connection established" /var/log/emailengine/app.log
```

### Redis Encryption

**Enable Redis TLS:**

```bash
# redis.conf
port 0  # Disable non-TLS port
tls-port 6379
tls-cert-file /etc/redis/redis.crt
tls-key-file /etc/redis/redis.key
tls-ca-cert-file /etc/redis/ca.crt
```

**Configure EmailEngine to use Redis TLS:**

```bash
EENGINE_REDIS=rediss://localhost:6379  # Note: rediss:// (with 's')
```

### Secret Management

**Use environment variables (basic):**

```bash
# /etc/emailengine/environment
EENGINE_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
EENGINE_ENCRYPTION_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
EENGINE_REDIS=redis://localhost:6379
```

**Use secret management service (production):**

```bash
#!/bin/bash
# fetch-secrets.sh

# AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id emailengine/production \
  --query SecretString \
  --output text > /tmp/secrets.json

# Export to environment
export EENGINE_SECRET=$(jq -r .secret /tmp/secrets.json)
export EENGINE_ENCRYPTION_SECRET=$(jq -r .encryption_secret /tmp/secrets.json)

# Clean up
rm /tmp/secrets.json

# Start EmailEngine
/usr/local/bin/emailengine
```

**Vault integration:**

```javascript
// vault-secrets.js
const vault = require('node-vault')();

async function getSecrets() {
    await vault.approleLogin({
        role_id: process.env.VAULT_ROLE_ID,
        secret_id: process.env.VAULT_SECRET_ID
    });

    const { data } = await vault.read('secret/data/emailengine');

    process.env.EENGINE_SECRET = data.data.secret;
    process.env.EENGINE_ENCRYPTION_SECRET = data.data.encryption_secret;
}

getSecrets().then(() => {
    require('emailengine');
});
```

## API Security

### Rate Limiting

**Application-level rate limiting:**

```javascript
// config.json
{
  "api": {
    "rateLimit": {
      "enabled": true,
      "max": 100,        // requests
      "window": 60000    // per minute
    }
  }
}
```

**Nginx rate limiting:**

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $http_authorization zone=token_limit:10m rate=100r/s;

server {
    location /v1/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req zone=token_limit burst=200 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

### IP Whitelisting

**Restrict API access by IP:**

```nginx
# Nginx geo module
geo $allowed_ip {
    default 0;
    203.0.113.0/24 1;    # Office network
    198.51.100.0/24 1;   # Data center
    10.0.0.0/8 1;        # VPN network
}

server {
    location /v1/ {
        if ($allowed_ip = 0) {
            return 403;
        }
        proxy_pass http://localhost:3000;
    }
}
```

**Application-level IP filtering:**

```json
// config.json
{
  "api": {
    "whitelist": [
      "203.0.113.0/24",
      "198.51.100.42",
      "10.0.0.0/8"
    ]
  }
}
```

### Request Validation

**Input sanitization:**

```javascript
// Validate email addresses
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate account IDs
const accountIdRegex = /^[a-f0-9]{24}$/;

// Limit request size
app.use(express.json({ limit: '10mb' }));
```

**Prevent injection attacks:**

```javascript
// Never use eval() or Function() with user input
// Sanitize all inputs
const sanitize = require('sanitize-html');

const cleanInput = sanitize(userInput, {
    allowedTags: [],
    allowedAttributes: {}
});
```

## Redis Security

### Authentication

**Enable Redis authentication:**

```bash
# redis.conf
requirepass $(openssl rand -hex 32)

# Or use ACLs (Redis 6+)
user emailengine on >strongpassword ~* &* +@all
user default off
```

**Configure EmailEngine with Redis password:**

```bash
EENGINE_REDIS=redis://:password@localhost:6379
```

### Network Binding

**Bind Redis to localhost only:**

```bash
# redis.conf
bind 127.0.0.1 ::1

# Or specific internal IP
bind 10.0.1.100
```

### Disable Dangerous Commands

```bash
# redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_67890"
rename-command SHUTDOWN "SHUTDOWN_12345"
```

### Redis ACLs (Redis 6+)

```bash
# Create restricted user
ACL SETUSER emailengine on >password ~emailengine:* +@all -@dangerous

# Verify
ACL LIST
```

## Compliance

### GDPR Compliance

**Data minimization:**

```json
// config.json
{
  "dataRetention": {
    "messages": 90,        // days
    "deletedMessages": 30, // days
    "logs": 180           // days
  }
}
```

**Right to deletion:**

```bash
# API endpoint to delete account and all data
curl -X DELETE https://emailengine.example.com/v1/account/user@example.com \
  -H "Authorization: Bearer TOKEN"

# This deletes:
# - Account credentials
# - OAuth tokens
# - Message metadata
# - Webhook history
# - Logs related to account
```

**Data export:**

```bash
# Export all user data (GDPR Article 20)
curl https://emailengine.example.com/v1/account/user@example.com/export \
  -H "Authorization: Bearer TOKEN" > user-data.json
```

### HIPAA Compliance

**Requirements for HIPAA:**

1. **Encryption:**
   - YES: TLS 1.2+ for all connections
   - YES: Encryption at rest (Redis persistence encrypted)
   - YES: Field-level encryption for sensitive data

2. **Access Control:**
   - YES: Role-based access control
   - YES: API token authentication
   - YES: IP whitelisting
   - YES: Audit logging

3. **Audit Trail:**
   ```bash
   # Enable detailed logging
   EENGINE_LOG_LEVEL=info
   EENGINE_LOG_FILE=/var/log/emailengine/audit.log
   ```

4. **Data Retention:**
   ```json
   {
     "dataRetention": {
       "logs": 2555  // 7 years (HIPAA requirement)
     }
   }
   ```

### SOC 2 Compliance

**Logging requirements:**

```javascript
// Log all access attempts
{
  "timestamp": "2025-10-13T10:00:00Z",
  "event": "api.access",
  "user": "api-key-12345",
  "ip": "203.0.113.42",
  "endpoint": "/v1/accounts",
  "status": 200,
  "response_time": 45
}
```

**Incident response:**

```bash
#!/bin/bash
# incident-response.sh

# 1. Alert team
curl -X POST https://alerts.example.com/webhook \
  -d '{"severity": "high", "message": "Security incident detected"}'

# 2. Block suspicious IP
iptables -A INPUT -s $SUSPICIOUS_IP -j DROP

# 3. Rotate tokens
./rotate-tokens.sh

# 4. Collect evidence
tar czf incident-$(date +%Y%m%d).tar.gz \
  /var/log/emailengine/ \
  /var/log/nginx/ \
  /etc/emailengine/
```

## Security Monitoring

### Log Monitoring

**Monitor for suspicious activity:**

```bash
# Failed login attempts
grep "401\|403" /var/log/nginx/emailengine-access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn

# Unusual API usage
awk '{print $7}' /var/log/nginx/emailengine-access.log | \
  sort | uniq -c | sort -rn | head -20

# Large requests
awk '$10 > 1000000 {print $1, $7, $10}' /var/log/nginx/emailengine-access.log
```

**Automated monitoring:**

```bash
#!/bin/bash
# monitor-security.sh

# Check for brute force attempts
FAILED_LOGINS=$(grep "401" /var/log/nginx/emailengine-access.log | wc -l)
if [ $FAILED_LOGINS -gt 100 ]; then
    echo "WARNING: $FAILED_LOGINS failed login attempts"
    # Send alert
fi

# Check for unusual traffic patterns
REQUESTS_PER_IP=$(awk '{print $1}' /var/log/nginx/emailengine-access.log | \
  sort | uniq -c | sort -rn | head -1 | awk '{print $1}')
if [ $REQUESTS_PER_IP -gt 1000 ]; then
    echo "WARNING: Unusual traffic from single IP"
    # Send alert
fi
```

### Intrusion Detection

**Install AIDE (Advanced Intrusion Detection Environment):**

```bash
sudo apt install aide
sudo aideinit
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Run daily checks
sudo aide --check

# Cron job
0 2 * * * /usr/bin/aide --check | mail -s "AIDE Report" admin@example.com
```

**File integrity monitoring:**

```bash
# Monitor critical files
/etc/emailengine/config.json
/etc/emailengine/environment
/etc/systemd/system/emailengine.service
/etc/nginx/sites-available/emailengine.conf
```

### Vulnerability Scanning

**Regular security audits:**

```bash
# Update packages
sudo apt update && sudo apt upgrade

# NPM security audit
npm audit

# Check for CVEs
sudo apt install lynis
sudo lynis audit system

# SSL/TLS check
./testssl.sh --severity HIGH emailengine.example.com
```

## Security Checklist

### Pre-Deployment

- [ ] Generate strong `EENGINE_SECRET` (32+ characters)
- [ ] Generate strong `EENGINE_ENCRYPTION_SECRET` (32+ characters)
- [ ] Configure Redis authentication
- [ ] Enable Redis persistence
- [ ] Set up firewall rules
- [ ] Configure SSL/TLS certificates
- [ ] Enable field encryption
- [ ] Set up secret management
- [ ] Configure log rotation
- [ ] Plan backup strategy

### Post-Deployment

- [ ] Verify HTTPS is enforced
- [ ] Test firewall rules
- [ ] Verify Redis is not publicly accessible
- [ ] Check SSL certificate auto-renewal
- [ ] Set up monitoring alerts
- [ ] Configure log aggregation
- [ ] Perform security scan
- [ ] Document incident response plan
- [ ] Train team on security procedures
- [ ] Schedule regular security audits

### Ongoing Maintenance

- [ ] Update EmailEngine regularly
- [ ] Update system packages
- [ ] Rotate API tokens quarterly
- [ ] Review access logs weekly
- [ ] Check for security advisories
- [ ] Test backups monthly
- [ ] Review firewall rules quarterly
- [ ] Audit user access quarterly
- [ ] Update SSL certificates (automatic)
- [ ] Renew compliance certifications annually

## Incident Response

### Response Plan

**1. Detection:**
```bash
# Automated monitoring alerts
# Log analysis
# User reports
```

**2. Containment:**
```bash
# Block malicious IPs
sudo ufw deny from $IP_ADDRESS

# Revoke compromised tokens
curl -X DELETE https://emailengine.example.com/admin/tokens/$TOKEN_ID

# Isolate affected systems
sudo systemctl stop emailengine
```

**3. Investigation:**
```bash
# Collect logs
tar czf incident-logs-$(date +%Y%m%d).tar.gz \
  /var/log/emailengine/ \
  /var/log/nginx/ \
  /var/log/redis/

# Analyze access patterns
# Check for data exfiltration
# Identify attack vector
```

**4. Remediation:**
```bash
# Patch vulnerabilities
sudo apt update && sudo apt upgrade
npm update

# Rotate secrets
./rotate-all-secrets.sh

# Reset compromised accounts
# Notify affected users
```

**5. Recovery:**
```bash
# Restore from backup if needed
# Restart services
sudo systemctl start redis
sudo systemctl start emailengine

# Verify functionality
curl https://emailengine.example.com/health
```

**6. Post-Incident:**
```bash
# Document incident
# Update security procedures
# Implement additional controls
# Conduct team review
```

## Security Resources

### Tools

- **SSL Testing:** [SSL Labs](https://www.ssllabs.com/ssltest/)
- **Security Headers:** [SecurityHeaders.com](https://securityheaders.com/)
- **Vulnerability Scanner:** [OpenVAS](https://www.openvas.org/)
- **WAF:** [ModSecurity](https://modsecurity.org/)
- **IDS/IPS:** [Snort](https://www.snort.org/), [Suricata](https://suricata.io/)

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## See Also

- [Deployment Overview](/docs/deployment)
- [Configuration Options](/docs/configuration)
- [Nginx Proxy Setup](/docs/deployment/nginx-proxy)
- [Monitoring](/docs/advanced/monitoring)
- [Logging](/docs/advanced/logging)
- [Encryption](/docs/advanced/encryption)
