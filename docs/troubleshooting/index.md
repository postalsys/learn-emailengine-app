---
title: Troubleshooting Guide
description: Troubleshoot common issues with accounts, webhooks, and email delivery
sidebar_position: 1
---

# Troubleshooting EmailEngine

Comprehensive troubleshooting guide for common issues and diagnostic procedures.

:::tip Quick Diagnostic
1. Check `/health` endpoint: `curl http://localhost:3000/health`
2. Check logs: `journalctl -u emailengine -n 100` or `docker logs emailengine`
3. Verify Redis: `redis-cli ping`
4. Test account connection from web interface
:::

## Quick Diagnostic Checklist

Use this checklist for initial troubleshooting:

- [ ] EmailEngine service is running
- [ ] Redis is running and accessible
- [ ] Redis has available memory
- [ ] Network connectivity to IMAP/SMTP servers
- [ ] Firewall not blocking required ports
- [ ] Valid credentials for email accounts
- [ ] OAuth2 tokens not expired
- [ ] Sufficient disk space
- [ ] System has adequate RAM
- [ ] No conflicting processes on ports

## Common Issues by Category

### Connection Issues

#### EmailEngine Won't Start

**Symptom:** Service fails to start or crashes immediately

**Diagnostic steps:**

```bash
# Check if process is running
ps aux | grep emailengine

# Check logs
journalctl -u emailengine -n 50
# Or for Docker
docker logs emailengine

# Test manual start
emailengine --version
emailengine --help
```

**Common causes and solutions:**

1. **Redis connection failed**
   ```
   Error: Redis connection to 127.0.0.1:6379 failed - connect ECONNREFUSED
   ```

   **Solution:**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   sudo systemctl start redis

   # Test connection
   redis-cli ping

   # Verify URL
   echo $EENGINE_REDIS
   # Should be: redis://localhost:6379
   ```

2. **Missing required configuration**
   ```
   Error: EENGINE_SECRET is required
   ```

   **Solution:**
   ```bash
   # Generate and set secret
   export EENGINE_SECRET=$(openssl rand -hex 32)
   ```

3. **Port already in use**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```

   **Solution:**
   ```bash
   # Find process using port
   sudo lsof -i :3000
   sudo netstat -tulpn | grep :3000

   # Kill process or use different port
   export EENGINE_PORT=3001
   ```

4. **Node.js version incompatible**
   ```
   Error: Node.js version 14.x is not supported
   ```

   **Solution:**
   ```bash
   # Check version
   node --version

   # Update Node.js
   nvm install 18
   nvm use 18
   ```

#### Accounts Stay Disconnected

**Symptom:** Most or all accounts show "disconnected" status and don't recover

**Diagnostic steps:**

```bash
# Check account status via API
curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer TOKEN" | jq

# Check specific account
curl http://localhost:3000/v1/account/user@example.com \
  -H "Authorization: Bearer TOKEN" | jq '.state'

# Check logs for connection errors
journalctl -u emailengine | grep -i "connection\|error"
```

**Common causes:**

1. **Redis out of memory**

   **Check Redis memory:**
   ```bash
   # Via redis-cli
   redis-cli INFO memory | grep used_memory_human
   redis-cli INFO memory | grep maxmemory_human

   # Via monitoring endpoint
   curl http://localhost:3000/admin/stats | jq '.redis'
   ```

   **Solution:**
   ```bash
   # Increase Redis maxmemory
   # Edit /etc/redis/redis.conf
   maxmemory 2gb

   # Restart Redis
   sudo systemctl restart redis

   # Or flush old data (WARNING: deletes data)
   redis-cli FLUSHDB
   ```

2. **Network connectivity issues**

   **Test IMAP connection:**
   ```bash
   # Test IMAP host reachability
   telnet imap.gmail.com 993
   openssl s_client -connect imap.gmail.com:993

   # Test SMTP
   telnet smtp.gmail.com 587
   ```

   **Check firewall:**
   ```bash
   # Check if ports are blocked
   sudo iptables -L -n | grep -E "993|587|465|143"

   # Allow IMAP/SMTP ports
   sudo ufw allow out 993/tcp
   sudo ufw allow out 587/tcp
   ```

3. **Rate limiting by email provider**

   **Solution:**
   - Reduce `maxConnections` per account
   - Increase connection timeout
   - Implement exponential backoff

   ```json
   {
     "maxConnections": 5,
     "imap": {
       "connectionTimeout": 120000
     }
   }
   ```

4. **Too many accounts**

   **Solution:**
   ```bash
   # Increase worker threads
   export EENGINE_WORKERS=8

   # Check resource usage
   top -p $(pgrep emailengine)
   ```

#### IMAP Connection Timeouts

**Symptom:** Accounts connect but frequently timeout

**Diagnostic:**

```bash
# Enable protocol logging
export EENGINE_LOG_RAW=true
export EENGINE_LOG_LEVEL=trace

# Check logs for timeouts
journalctl -u emailengine | grep -i timeout

# Measure network latency
ping imap.gmail.com
traceroute imap.gmail.com
```

**Solutions:**

1. **Increase timeout:**
   ```bash
   export EENGINE_IMAP_CONNECTION_TIMEOUT=120000  # 120 seconds
   ```

2. **Check network quality:**
   ```bash
   # Test packet loss
   mtr -c 100 imap.gmail.com

   # Check firewall interference
   sudo iptables -L -v
   ```

3. **Use proxy if needed:**
   ```json
   {
     "imap": {
       "proxy": "socks5://proxy.example.com:1080"
     }
   }
   ```

### OAuth2 Authentication Issues

#### OAuth2 Flow Fails

**Symptom:** OAuth2 authentication page shows error or redirect fails

**Diagnostic:**

```bash
# Check OAuth2 credentials
echo $EENGINE_GMAIL_CLIENT_ID
echo $EENGINE_GMAIL_CLIENT_SECRET

# Check redirect URI
curl http://localhost:3000/admin/config | jq '.gmail'

# Test OAuth2 endpoint
curl https://oauth2.googleapis.com/token
```

**Common causes:**

1. **Invalid client ID/secret**

   **Solution:**
   - Verify credentials in Google Cloud Console
   - Ensure credentials match environment variables
   - Check for trailing spaces in environment variables

   ```bash
   # Print without newline to check
   echo -n "$EENGINE_GMAIL_CLIENT_ID" | xxd
   ```

2. **Incorrect redirect URI**

   **Solution:**
   ```bash
   # Set correct base URL
   export EENGINE_BASE_URL=https://emailengine.example.com

   # Verify redirect URI in OAuth2 provider
   # Should match: https://emailengine.example.com/oauth
   ```

3. **OAuth2 scopes insufficient**

   **Gmail required scopes:**
   - `https://mail.google.com/`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`

   **Outlook required scopes:**
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

#### Token Refresh Fails

**Symptom:** Accounts work initially but stop after token expiry

**Diagnostic:**

```bash
# Check token expiry
curl http://localhost:3000/v1/account/user@example.com \
  -H "Authorization: Bearer TOKEN" | jq '.oauth2'

# Check logs for refresh errors
journalctl -u emailengine | grep -i "refresh\|token"
```

**Solutions:**

1. **Refresh token expired:**
   - Re-authenticate account
   - Check OAuth2 app approval screen settings

2. **OAuth2 app disabled:**
   - Verify app status in provider console
   - Check for security alerts

3. **Encryption key changed:**
   - Tokens encrypted with old key can't be decrypted
   - Re-authenticate all accounts

### Webhook Delivery Issues

#### Webhooks Not Delivered

**Symptom:** Events occur but webhooks aren't received

**Diagnostic:**

```bash
# Check webhook configuration
curl http://localhost:3000/v1/settings \
  -H "Authorization: Bearer TOKEN" | jq '.webhooksUrl'

# Check webhook queue
curl http://localhost:3000/v1/settings/queue/webhooks \
  -H "Authorization: Bearer TOKEN"

# Test webhook endpoint
curl -X POST https://your-app.com/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check logs
journalctl -u emailengine | grep -i webhook
```

**Common causes:**

1. **Webhook URL not set**

   **Solution:**
   ```bash
   curl -X POST http://localhost:3000/v1/settings \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"webhooksUrl": "https://your-app.com/webhooks"}'
   ```

2. **Webhook endpoint unreachable**

   **Test from EmailEngine server:**
   ```bash
   curl -I https://your-app.com/webhooks

   # Check DNS
   nslookup your-app.com

   # Check firewall
   telnet your-app.com 443
   ```

3. **Webhook timeout**

   **Solution:**
   ```json
   {
     "webhooks": {
       "timeout": 30000,  # Increase to 30s
       "retry": 5
     }
   }
   ```

4. **SSL certificate issues**

   **Check certificate:**
   ```bash
   openssl s_client -connect your-app.com:443 -servername your-app.com

   # If self-signed, disable verification (not recommended)
   # Set NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

#### Webhooks Delayed

**Symptom:** Webhooks delivered but with significant delay

**Diagnostic:**

```bash
# Check queue status
curl http://localhost:3000/v1/settings/queue/webhooks \
  -H "Authorization: Bearer TOKEN" | jq

# Check backlog
redis-cli LLEN "bull:webhooks:wait"

# Monitor webhook processing
journalctl -u emailengine -f | grep webhook
```

**Solutions:**

1. **Increase queue concurrency:**
   ```bash
   curl -X PUT http://localhost:3000/v1/settings/queue/webhooks \
     -H "Authorization: Bearer TOKEN" \
     -d '{"concurrency": 10}'
   ```

2. **Reduce webhook payload:**
   - Disable including full message content
   - Fetch content on-demand via API

3. **Scale horizontally:**
   - Add more EmailEngine instances
   - Use load balancer

### Performance Issues

#### High Memory Usage

**Symptom:** EmailEngine consumes excessive RAM

**Diagnostic:**

```bash
# Check memory usage
ps aux | grep emailengine
top -p $(pgrep emailengine)

# Check Node.js heap
curl http://localhost:9090/metrics | grep heap

# Check account count
curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer TOKEN" | jq 'length'
```

**Solutions:**

1. **Too many accounts:**
   - **Rule of thumb:** 1-2 MB per account
   - 100 accounts ≈ 200 MB
   - 1000 accounts ≈ 2 GB

   **Solution:**
   - Add more instances
   - Increase system RAM

2. **Large mailboxes:**
   ```bash
   # Reduce chunk size
   export EENGINE_CHUNK_SIZE=2500

   # Limit messages synced
   # (via API per-account setting)
   ```

3. **Memory leak:**
   ```bash
   # Update to latest version
   npm update -g emailengine

   # Restart service
   sudo systemctl restart emailengine
   ```

#### Slow Performance

**Symptom:** API requests slow, UI sluggish

**Diagnostic:**

```bash
# Check Redis latency
redis-cli --latency
redis-cli --latency-history

# Check CPU usage
top

# Check IMAP response times
# (enable EENGINE_LOG_RAW=true and check logs)

# Test API performance
time curl http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer TOKEN"
```

**Solutions:**

1. **Redis latency high:**
   ```bash
   # Check Redis is on same machine/network
   ping <redis-host>

   # Move Redis to same datacenter
   # Use local Redis (not remote)

   # Optimize Redis
   # Edit /etc/redis/redis.conf
   tcp-backlog 511
   timeout 0
   tcp-keepalive 300
   ```

2. **Too few workers:**
   ```bash
   # Increase workers
   export EENGINE_WORKERS=$(nproc)  # Match CPU cores
   ```

3. **Database performance:**
   ```bash
   # Check Redis slow queries
   redis-cli SLOWLOG GET 10

   # Optimize Redis
   redis-cli CONFIG SET slowlog-log-slower-than 10000
   ```

### Email Sync Issues

#### Messages Not Syncing

**Symptom:** New emails don't appear in EmailEngine

**Diagnostic:**

```bash
# Check account state
curl http://localhost:3000/v1/account/user@example.com \
  -H "Authorization: Bearer TOKEN" | jq '.state'

# Force sync
curl -X PUT http://localhost:3000/v1/account/user@example.com/sync \
  -H "Authorization: Bearer TOKEN"

# Check logs
journalctl -u emailengine | grep -i "sync\|idle"
```

**Solutions:**

1. **IMAP IDLE not working:**
   - Check if server supports IDLE
   - Enable regular polling

2. **Sync paused:**
   ```bash
   # Resume sync
   curl -X PUT http://localhost:3000/v1/account/user@example.com \
     -H "Authorization: Bearer TOKEN" \
     -d '{"sync": true}'
   ```

3. **Mailbox not monitored:**
   - Check which folders are synced
   - Add folder to sync list

#### Deleted Messages Re-appear

**Symptom:** Deleted emails come back after sync

**Cause:** IMAP sync issue or message moved to Trash

**Solution:**

```bash
# Permanently delete (expunge)
curl -X PUT http://localhost:3000/v1/account/{account}/messages/delete \
  -H "Authorization: Bearer TOKEN" \
  -d '{"path": "INBOX", "message": "uid:123", "delete": true}'

# Check Trash folder
curl http://localhost:3000/v1/account/{account}/mailboxes \
  -H "Authorization: Bearer TOKEN" | jq '.[] | select(.specialUse=="\\Trash")'
```

## Step-by-Step Diagnostic Procedures

### Procedure 1: Complete Health Check

```bash
#!/bin/bash
echo "=== EmailEngine Health Check ==="

# 1. Check service
echo "1. Service status:"
systemctl is-active emailengine

# 2. Check Redis
echo "2. Redis status:"
redis-cli ping

# 3. Check health endpoint
echo "3. Health endpoint:"
curl -s http://localhost:3000/health | jq

# 4. Check memory
echo "4. Redis memory:"
redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human"

# 5. Check accounts
echo "5. Account status:"
curl -s http://localhost:3000/v1/accounts \
  -H "Authorization: Bearer TOKEN" | \
  jq '[.[] | {account: .account, state: .state}]'

# 6. Check logs for errors
echo "6. Recent errors:"
journalctl -u emailengine --since "5 minutes ago" | grep -i error
```

### Procedure 2: Network Connectivity Test

```bash
#!/bin/bash
echo "=== Network Connectivity Test ==="

# Test IMAP
echo "Testing IMAP (Gmail):"
timeout 5 bash -c "</dev/tcp/imap.gmail.com/993" && echo "OK" || echo "FAILED"

# Test SMTP
echo "Testing SMTP (Gmail):"
timeout 5 bash -c "</dev/tcp/smtp.gmail.com/587" && echo "OK" || echo "FAILED"

# Test Redis
echo "Testing Redis:"
redis-cli ping

# Test webhook endpoint
echo "Testing webhook:"
curl -I -s https://your-app.com/webhooks | head -1
```

### Procedure 3: Account Connection Test

```bash
#!/bin/bash
ACCOUNT="user@example.com"
TOKEN="your-api-token"

echo "=== Account Connection Test ==="

# 1. Get account info
echo "1. Account info:"
curl -s "http://localhost:3000/v1/account/$ACCOUNT" \
  -H "Authorization: Bearer $TOKEN" | jq '.state, .syncError'

# 2. Test reconnection
echo "2. Testing reconnection:"
curl -X PUT "http://localhost:3000/v1/account/$ACCOUNT/reconnect" \
  -H "Authorization: Bearer $TOKEN"

# 3. Wait and check
sleep 10
echo "3. New state:"
curl -s "http://localhost:3000/v1/account/$ACCOUNT" \
  -H "Authorization: Bearer $TOKEN" | jq '.state'
```

## Log Analysis Tips

### Useful Log Commands

```bash
# View logs in real-time
journalctl -u emailengine -f

# Last 100 lines
journalctl -u emailengine -n 100

# Errors only
journalctl -u emailengine -p err

# Specific time range
journalctl -u emailengine --since "1 hour ago"

# Export logs
journalctl -u emailengine --since "today" > emailengine-$(date +%Y%m%d).log

# Search for pattern
journalctl -u emailengine | grep -i "connection\|error\|timeout"

# Count errors
journalctl -u emailengine --since "1 hour ago" | grep -c ERROR
```

### Log Patterns to Look For

**Connection issues:**
```
grep -i "econnrefused\|etimedout\|enotfound" emailengine.log
```

**Authentication failures:**
```
grep -i "authentication failed\|invalid credentials" emailengine.log
```

**Rate limiting:**
```
grep -i "rate limit\|too many requests\|throttle" emailengine.log
```

**Memory issues:**
```
grep -i "out of memory\|heap\|fatal" emailengine.log
```

## Getting Help

### Information to Collect

When requesting support, provide:

1. **EmailEngine version:**
   ```bash
   emailengine --version
   ```

2. **System information:**
   ```bash
   uname -a
   node --version
   redis-server --version
   ```

3. **Configuration:**
   ```bash
   # Sanitize sensitive data before sharing
   cat /etc/emailengine/config.json
   ```

4. **Logs:**
   ```bash
   journalctl -u emailengine -n 200 > logs.txt
   ```

5. **Account state:**
   ```bash
   curl http://localhost:3000/v1/accounts \
     -H "Authorization: Bearer TOKEN" | \
     jq '[.[] | {account, state, syncError}]'
   ```

### Support Channels

- **Documentation:** [https://docs.emailengine.app](https://docs.emailengine.app)
- **GitHub Issues:** [https://github.com/postalsys/emailengine/issues](https://github.com/postalsys/emailengine/issues)
- **Email Support:** [support@emailengine.app](mailto:support@emailengine.app)
- **Community Forum:** [https://emailengine.app/support](/docs/support/license)

## See Also

- [Configuration Reference](/docs/reference/configuration-options)
- [Error Codes Reference](/docs/reference/error-codes)
- [Account Troubleshooting](/docs/accounts/troubleshooting)
- [Performance Tuning](/docs/advanced/performance-tuning)
- [Monitoring Setup](/docs/advanced/monitoring)
- [Logging Configuration](/docs/advanced/logging)
