---
title: Credential Security FAQ
sidebar_position: 2
description: How EmailEngine stores and protects email account credentials
---

# Credential Security FAQ

Common questions about how EmailEngine stores, secures, and encrypts email account credentials.

## Where are email credentials stored?

EmailEngine stores all account credentials in **Redis**:

- IMAP/SMTP passwords
- OAuth2 access tokens
- OAuth2 refresh tokens
- OAuth2 application client secrets
- Service account private keys

**Email message content is NOT stored** - EmailEngine fetches messages from the mail server on demand and only caches metadata (message IDs, flags, sync state) in Redis.

## Are credentials encrypted?

**It depends on your configuration:**

| Configuration | Storage Method | Security Level |
|--------------|----------------|----------------|
| Without `EENGINE_SECRET` | Cleartext | Development only |
| With `EENGINE_SECRET` | AES-256-GCM encrypted | Production ready |

For production deployments, always configure `EENGINE_SECRET`.

## How do I enable encryption?

Set the `EENGINE_SECRET` environment variable before starting EmailEngine:

```bash
# Generate a secure 256-bit secret
openssl rand -hex 32

# Set the environment variable
export EENGINE_SECRET=your-generated-secret-here

# Or add to .env file
echo "EENGINE_SECRET=$(openssl rand -hex 32)" >> .env
```

For existing installations with unencrypted data, run the encryption migration:

```bash
emailengine encrypt --service.secret="your-secret" --dbs.redis="redis://localhost:6379"
```

[Complete encryption guide](/docs/advanced/encryption)

## What encryption algorithm is used?

EmailEngine uses **AES-256-GCM** (Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode).

This provides:
- **Confidentiality** - Data cannot be read without the key
- **Authentication** - Tampering is detected
- **Industry standard** - Widely trusted and audited algorithm

## What happens if Redis is compromised?

| Scenario | Impact |
|----------|--------|
| Without encryption | Attacker gains all passwords and OAuth tokens in cleartext |
| With encryption | Attacker sees encrypted data; credentials remain secure unless `EENGINE_SECRET` is also compromised |

This is why it's critical to:
1. Always enable encryption in production
2. Store `EENGINE_SECRET` separately from Redis (not in the same system/backup)
3. Use Redis authentication and network isolation

## What happens if I lose EENGINE_SECRET?

If you lose the encryption secret:

- **Encrypted credentials cannot be recovered**
- All accounts will need to be re-authenticated
- OAuth2 tokens will need to be re-authorized

**Best practices:**
- Back up `EENGINE_SECRET` securely (separate from Redis backups)
- Use a secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.)
- Document your secret in secure company password management

## How do I rotate the encryption secret?

EmailEngine supports secret rotation:

```bash
# Re-encrypt with a new secret
emailengine encrypt \
  --service.secret="new-secret" \
  --dbs.redis="redis://localhost:6379"
```

The migration will:
1. Decrypt data with the old secret (from current config)
2. Re-encrypt with the new secret
3. Update all stored credentials

[Secret rotation guide](/docs/advanced/encryption#secret-rotation)

## Can I use external secret managers?

Yes. EmailEngine integrates with enterprise secret management systems:

**HashiCorp Vault:**
```bash
export EENGINE_SECRET=$(vault kv get -field=secret secret/emailengine)
```

**AWS Secrets Manager:**
```bash
export EENGINE_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id emailengine/secret --query SecretString --output text)
```

**Kubernetes Secrets:**
```yaml
env:
  - name: EENGINE_SECRET
    valueFrom:
      secretKeyRef:
        name: emailengine-secrets
        key: encryption-secret
```

**Docker Secrets:**
```bash
export EENGINE_SECRET=$(cat /run/secrets/emailengine_secret)
```

[Secret management examples](/docs/advanced/encryption#using-secret-management-systems)

## How do I secure Redis itself?

Beyond encrypting credentials, secure your Redis instance:

### Enable Redis Authentication

```bash
# redis.conf
requirepass your-redis-password

# Connection URL
EENGINE_REDIS="redis://:your-redis-password@localhost:6379"
```

### Use TLS Encryption

```bash
# Connect via TLS
EENGINE_REDIS="rediss://localhost:6379"
```

### Network Isolation

- Bind Redis to localhost or private network only
- Use firewall rules to restrict access
- Consider Redis ACLs for fine-grained permissions

[Redis security guide](/docs/configuration/redis#security)

## Security Checklist for Production

Before deploying EmailEngine to production:

- [ ] `EENGINE_SECRET` is configured with a strong random value
- [ ] Secret is stored securely (not in code repository)
- [ ] Secret is backed up separately from Redis data
- [ ] Redis authentication is enabled
- [ ] Redis is not exposed to public network
- [ ] TLS is enabled for Redis connections (if over network)
- [ ] Admin interface is protected (IP restrictions or VPN)
- [ ] API tokens have appropriate scope restrictions

## See Also

- [Encryption Guide](/docs/advanced/encryption) - Detailed encryption configuration
- [Security Best Practices](/docs/deployment/security) - Production security hardening
- [Redis Configuration](/docs/configuration/redis) - Redis setup and security
- [Environment Variables](/docs/configuration/environment-variables) - All configuration options
