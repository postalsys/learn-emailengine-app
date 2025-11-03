---
title: Secret Encryption
sidebar_position: 3
description: Enable field-level encryption for sensitive data like passwords and OAuth tokens
---

# Secret Encryption

Learn how to enable field-level encryption for sensitive data stored by EmailEngine, including passwords, OAuth tokens, and API secrets.


## Overview

By default, EmailEngine stores all data in cleartext in Redis. This is fine for testing but not recommended for production environments.

EmailEngine offers **field-level encryption** that encrypts all sensitive fields using the **AES-256-GCM** cipher:
- Account passwords
- OAuth access and refresh tokens
- Google OAuth client secrets
- Other sensitive configuration values

## Why Enable Encryption?

### Security Benefits

1. **Data at Rest Protection**: Even if Redis is compromised, encrypted data remains secure
2. **Compliance**: Meets security requirements for many regulations (GDPR, HIPAA, etc.)
3. **Defense in Depth**: Additional security layer beyond network security
4. **Peace of Mind**: Production-ready security posture

### What Gets Encrypted

**Account credentials**:
- IMAP passwords
- SMTP passwords
- OAuth access tokens
- OAuth refresh tokens

**Configuration**:
- OAuth client secrets
- Webhook secrets
- API secrets

**Not encrypted**:
- Email content (not stored by default)
- Metadata (subject lines, senders, etc.)
- Account IDs
- Configuration settings

## Important Considerations

:::warning
Encryption settings cannot be changed during runtime. To enable, disable, or change encryption, you must:
1. Stop EmailEngine
2. Run encryption migration
3. Start EmailEngine with new encryption options
:::

## Enabling Encryption on New Instance

If you don't have any email accounts set up yet, this is the easiest approach.

### 1. Set Encryption Secret

```bash
export EENGINE_SECRET="your-secret-password-here"
```

### 2. Start EmailEngine

```bash
emailengine
```

That's it! All new accounts will have encrypted secrets automatically.

### Environment Variable Best Practices

:::tip
Don't provide environment variables using the `export` command in production. Instead:

**SystemD Service**:
```ini
[Service]
Environment="EENGINE_SECRET=secret-password"
```

**Docker Compose**:
```yaml
services:
  emailengine:
    environment:
      - EENGINE_SECRET=secret-password
```

**Docker Run**:
```bash
docker run -e EENGINE_SECRET=secret-password emailengine/emailengine
```

**.env File**:
```bash
# .env file in working directory
EENGINE_SECRET=secret-password
```
:::

## Enabling Encryption on Existing Instance

If you already have email accounts configured, you need to encrypt existing data before enabling encryption.

### Process Overview

1. Stop EmailEngine
2. Run encryption migration tool
3. Start EmailEngine with encryption enabled

### Step-by-Step Instructions

#### 1. Stop EmailEngine

```bash
# SystemD
sudo systemctl stop emailengine

# Docker
docker stop emailengine

# PM2
pm2 stop emailengine

# Direct process
pkill emailengine
```

#### 2. Run Encryption Migration

The encryption migration tool is the same `emailengine` command with the `encrypt` argument:

```bash
export EENGINE_SECRET="your-secret-password-here"
emailengine encrypt --any.command.line.options
```

**Example with options**:
```bash
export EENGINE_SECRET="my-encryption-key-2023"
export REDIS_URL="redis://localhost:6379"
emailengine encrypt
```

The tool will:
- Connect to Redis
- Find all unencrypted secrets
- Encrypt them with the provided secret
- Store encrypted values back to Redis
- Exit

#### 3. Start EmailEngine

```bash
export EENGINE_SECRET="your-secret-password-here"
emailengine
```

**SystemD**:
```bash
sudo systemctl start emailengine
```

**Docker**:
```bash
docker start emailengine
```

### Verification

Check logs to verify encryption is enabled:

```bash
# Look for encryption-related messages
tail -f /var/log/emailengine/app.log

# Docker
docker logs emailengine
```

You should see messages indicating secrets are being decrypted when accounts connect.

## Changing Encryption Secret

### When to Change

- Suspected secret compromise
- Regular security rotation policy
- Security audit requirements
- Compliance regulations

### Process

#### 1. Stop EmailEngine

```bash
sudo systemctl stop emailengine
```

#### 2. Run Migration with Old and New Secret

```bash
export EENGINE_SECRET="new-secret-password"
emailengine encrypt --decrypt="old-secret-password"
```

This will:
- Decrypt using old secret
- Re-encrypt using new secret
- Store updated values

#### 3. Start EmailEngine with New Secret

```bash
export EENGINE_SECRET="new-secret-password"
emailengine
```

### Multiple Old Secrets

If you have accounts encrypted with different secrets (after a botched migration), you can provide multiple old secrets:

```bash
export EENGINE_SECRET="new-secret"
emailengine encrypt \
  --decrypt="old-secret-1" \
  --decrypt="old-secret-2" \
  --decrypt="old-secret-3"
```

The tool will try each old secret until one works for each account.

## Disabling Encryption

### When to Disable

Generally not recommended for production, but valid for:
- Moving to development environment
- Testing unencrypted performance
- Troubleshooting encryption issues

### Process

#### 1. Stop EmailEngine

```bash
sudo systemctl stop emailengine
```

#### 2. Run Decryption Migration

Provide old secrets but no new secret:

```bash
emailengine encrypt --decrypt="old-secret-password"
```

This decrypts all secrets and stores them in cleartext.

#### 3. Start EmailEngine Without Secret

```bash
emailengine
```

(No `EENGINE_SECRET` environment variable)

## Secret Management Best Practices

### 1. Use Strong Secrets

```bash
# Generate strong random secret
openssl rand -base64 32

# Or use password generator
pwgen -s 64 1
```

**Requirements**:
- Minimum 32 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not reused elsewhere
- Not based on dictionary words

### 2. Secure Storage

**Never**:
- [NO] Commit to version control
- [NO] Include in Docker images
- [NO] Hard-code in configuration files
- [NO] Share via unsecured channels (email, Slack, etc.)

**Instead**:
- [YES] Use environment variables
- [YES] Use secret management systems (Vault, AWS Secrets Manager, etc.)
- [YES] Use orchestration secrets (Kubernetes Secrets, Docker Secrets)
- [YES] Restrict access to authorized personnel only

### 3. Secret Rotation

Implement regular rotation schedule:

**Recommended schedule**:
- **High security**: Every 30-90 days
- **Normal security**: Every 6-12 months
- **After incidents**: Immediately

**Process**:
1. Generate new secret
2. Schedule maintenance window
3. Run migration (see "Changing Encryption Secret")
4. Update secret storage systems
5. Verify all services working
6. Document change

### 4. Access Control

Limit who can access encryption secrets:

- Production secrets: DevOps/Security team only
- Staging secrets: Development team
- Development secrets: All developers

### 5. Backup Considerations

**Encrypted backups**: Redis backups contain encrypted data, but you MUST securely store:
- The encryption secret itself
- Recovery procedures
- Documentation of encryption status

**Without the secret**: Encrypted data is unrecoverable.

## Using Secret Management Systems

### HashiCorp Vault

```bash
#!/bin/bash
# Fetch secret from Vault
export EENGINE_SECRET=$(vault kv get -field=encryption_key secret/emailengine)
emailengine
```

### AWS Secrets Manager

```bash
#!/bin/bash
# Fetch from AWS Secrets Manager
export EENGINE_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id emailengine/encryption-key \
  --query SecretString \
  --output text)
emailengine
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: emailengine-secrets
type: Opaque
stringData:
  encryption-key: your-secret-here
---
apiVersion: v1
kind: Pod
metadata:
  name: emailengine
spec:
  containers:
  - name: emailengine
    image: emailengine/emailengine
    env:
    - name: EENGINE_SECRET
      valueFrom:
        secretKeyRef:
          name: emailengine-secrets
          key: encryption-key
```

### Docker Secrets

```bash
# Create secret
echo "your-secret-password" | docker secret create ee_encryption_key -

# Use in service
docker service create \
  --name emailengine \
  --secret ee_encryption_key \
  --env EENGINE_SECRET=/run/secrets/ee_encryption_key \
  emailengine/emailengine
```

## Migration Planning

### Pre-Migration Checklist

- [ ] Backup Redis database
- [ ] Generate strong encryption secret
- [ ] Store secret in secure location (Vault, etc.)
- [ ] Document secret storage location
- [ ] Plan maintenance window
- [ ] Test migration in staging environment
- [ ] Communicate downtime to users
- [ ] Prepare rollback plan

### Migration Steps

1. **Backup** Redis database
   ```bash
   redis-cli --rdb /backup/redis-backup-$(date +%Y%m%d).rdb
   ```

2. **Test in staging**
   ```bash
   # Restore backup to staging
   # Run migration
   # Verify functionality
   ```

3. **Schedule maintenance**
   - Choose low-traffic period
   - Allow 15-30 minutes for migration
   - Have team on standby

4. **Execute migration**
   ```bash
   sudo systemctl stop emailengine
   export EENGINE_SECRET="..."
   emailengine encrypt
   sudo systemctl start emailengine
   ```

5. **Verify**
   - Check logs for errors
   - Test account connections
   - Verify emails sending/receiving
   - Monitor for issues

6. **Document**
   - Update runbooks
   - Document secret location
   - Update disaster recovery procedures

### Rollback Plan

If migration fails:

1. **Stop EmailEngine**
   ```bash
   sudo systemctl stop emailengine
   ```

2. **Restore Redis backup**
   ```bash
   redis-cli --rdb /backup/redis-backup-20231001.rdb
   ```

3. **Start without encryption**
   ```bash
   unset EENGINE_SECRET
   sudo systemctl start emailengine
   ```

4. **Investigate** issue before retrying

## Conclusion

:::tip Key Points
- Encryption is essential for production environments
- Must stop EmailEngine to enable/change encryption
- Use strong, securely-stored secrets
- Test in staging before production
- Always backup before migration
- Document secret storage location
- Implement regular rotation schedule
:::
